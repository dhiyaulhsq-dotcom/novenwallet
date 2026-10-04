import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Wallet,
  Category,
  Transaction,
  RecurringTransaction,
  Budget,
  Goal,
  Debt,
  DebtPayment,
  Asset,
  Bill,
  UserSettings,
  DateFilterType,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_WALLETS,
  DEFAULT_BUDGETS,
  DEFAULT_GOALS,
  DEFAULT_DEBTS,
  DEFAULT_ASSETS,
  DEFAULT_BILLS,
  DEFAULT_RECURRING,
  DEFAULT_TRANSACTIONS,
} from '../data/defaultData';
import { getDateRange } from '../lib/formatters';
import {
  hashPassword,
  verifyPassword,
  isSessionExpired,
  DEFAULT_AUTH_USERNAME,
  DEFAULT_AUTH_PASSWORD,
  DEFAULT_PASSWORD_HASH,
} from '../lib/security';
import { signInWithGoogle, logOutFromFirebase } from '../lib/firebase';
import {
  FirebaseSyncedData,
  syncUserProfile,
  saveWalletFirestore,
  deleteWalletFirestore,
  saveCategoryFirestore,
  deleteCategoryFirestore,
  saveTransactionFirestore,
  deleteTransactionFirestore,
  bulkDeleteTransactionsFirestore,
  saveBudgetFirestore,
  deleteBudgetFirestore,
  saveGoalFirestore,
  deleteGoalFirestore,
  saveDebtFirestore,
  deleteDebtFirestore,
  saveAssetFirestore,
  deleteAssetFirestore,
  saveBillFirestore,
  deleteBillFirestore,
  saveSettingsFirestore,
  resetUserDataInFirestore,
  loadSampleDataToFirestore,
} from '../lib/firestoreSync';

interface FinanceState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  assets: Asset[];
  bills: Bill[];
  settings: UserSettings;
  isLocked: boolean;
  activePeriod: DateFilterType;
  customDateRange: { startDate: string; endDate: string };

  // Auth State & Actions
  isAuthenticated: boolean;
  isLogoutModalOpen: boolean;
  setLogoutModalOpen: (open: boolean) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCredentials: (params: { currentPassword: string; newUsername: string; newPassword?: string }) => Promise<{ success: boolean; message: string }>;
  refreshSession: () => void;
  checkSession: () => boolean;

  // Firebase Multi-User & Cloud Sync State
  firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  isCloudSyncing: boolean;
  setFirebaseUser: (
    user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null
  ) => void;
  syncFromFirebase: (data: Partial<FirebaseSyncedData>) => void;
  loginWithGoogleAuth: () => Promise<{ success: boolean; message?: string }>;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => string;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  bulkDeleteTransactions: (ids: string[]) => void;
  
  addWallet: (wallet: Omit<Wallet, 'id'>) => string;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  reconcileWallet: (walletId: string, actualBalance: number, note?: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  copyBudgetsFromPreviousMonth: (targetMonth: string, sourceMonth: string) => void;
  apply503020Template: (totalIncome: number, targetMonth: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'history'>) => string;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  contributeToGoal: (goalId: string, amount: number, note?: string, walletId?: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, note?: string, walletId?: string) => void;
  deleteGoal: (id: string) => void;

  addDebt: (debt: Omit<Debt, 'id' | 'paymentHistory'>) => string;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  recordDebtPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
  deleteDebt: (id: string) => void;

  addAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => string;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addBill: (bill: Omit<Bill, 'id' | 'paidMonths'>) => string;
  updateBill: (id: string, bill: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (billId: string, monthStr: string, walletId?: string) => void;

  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => string;
  updateRecurring: (id: string, rec: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  processDueRecurringTransactions: () => void;

  updateSettings: (settings: Partial<UserSettings>) => void;
  setLock: (locked: boolean) => void;
  setActivePeriod: (period: DateFilterType, customRange?: { startDate: string; endDate: string }) => void;
  
  resetToEmpty: () => void;
  loadSampleData: () => void;
  importFullData: (data: any) => boolean;
}

const defaultSettings: UserSettings = {
  startDayOfMonth: 1,
  isPrivacyMode: false,
  theme: 'light',
  pinHash: null,
  hasSampleDataLoaded: true,
  authUsername: DEFAULT_AUTH_USERNAME,
  authPasswordHash: DEFAULT_PASSWORD_HASH,
  lastLoginTimestamp: null,
  isCustomAuthSet: false,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      wallets: DEFAULT_WALLETS,
      categories: DEFAULT_CATEGORIES,
      transactions: DEFAULT_TRANSACTIONS,
      recurringTransactions: DEFAULT_RECURRING,
      budgets: DEFAULT_BUDGETS,
      goals: DEFAULT_GOALS,
      debts: DEFAULT_DEBTS,
      assets: DEFAULT_ASSETS,
      bills: DEFAULT_BILLS,
      settings: defaultSettings,
      isLocked: false,
      isAuthenticated: false,
      isLogoutModalOpen: false,
      setLogoutModalOpen: (open: boolean) => set({ isLogoutModalOpen: open }),
      firebaseUser: null,
      isCloudSyncing: false,
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      syncFromFirebase: (data) => {
        set((state) => ({
          wallets: data.wallets !== undefined ? data.wallets : state.wallets,
          categories: data.categories !== undefined ? data.categories : state.categories,
          transactions: data.transactions !== undefined ? data.transactions : state.transactions,
          budgets: data.budgets !== undefined ? data.budgets : state.budgets,
          goals: data.goals !== undefined ? data.goals : state.goals,
          debts: data.debts !== undefined ? data.debts : state.debts,
          assets: data.assets !== undefined ? data.assets : state.assets,
          bills: data.bills !== undefined ? data.bills : state.bills,
          settings: data.settings !== undefined ? { ...state.settings, ...data.settings } : state.settings,
          isCloudSyncing: false,
        }));
      },
      loginWithGoogleAuth: async () => {
        try {
          const user = await signInWithGoogle();
          await syncUserProfile(user);
          set({
            firebaseUser: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            },
            isAuthenticated: true,
            isLocked: false,
            isCloudSyncing: true,
            settings: {
              ...get().settings,
              lastLoginTimestamp: Date.now(),
            },
          });
          return { success: true };
        } catch (error: any) {
          console.error('Google Sign-in failed:', error);
          return {
            success: false,
            message: error?.message || 'Gagal masuk dengan akun Google',
          };
        }
      },
      activePeriod: 'this_month',
      customDateRange: {
        startDate: getDateRange('this_month').startDate,
        endDate: getDateRange('this_month').endDate,
      },

      // --- TRANSAKSI ---
      addTransaction: (txData) => {
        const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newTx: Transaction = {
          ...txData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // Sesuaikan saldo dompet
          const updatedWallets = state.wallets.map((w) => {
            if (newTx.type === 'expense' && w.id === newTx.walletId) {
              return { ...w, balance: w.balance - newTx.amount };
            }
            if (newTx.type === 'income' && w.id === newTx.walletId) {
              return { ...w, balance: w.balance + newTx.amount };
            }
            if (newTx.type === 'transfer') {
              if (w.id === newTx.walletId) {
                return { ...w, balance: w.balance - newTx.amount };
              }
              if (w.id === newTx.toWalletId) {
                return { ...w, balance: w.balance + newTx.amount };
              }
            }
            return w;
          });

          return {
            transactions: [newTx, ...state.transactions],
            wallets: updatedWallets,
          };
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          saveTransactionFirestore(fbUser.uid, newTx).catch(console.error);
          const stateAfter = get();
          const targetW = stateAfter.wallets.find((w) => w.id === newTx.walletId);
          if (targetW) saveWalletFirestore(fbUser.uid, targetW).catch(console.error);
          if (newTx.type === 'transfer' && newTx.toWalletId) {
            const targetToW = stateAfter.wallets.find((w) => w.id === newTx.toWalletId);
            if (targetToW) saveWalletFirestore(fbUser.uid, targetToW).catch(console.error);
          }
        }

        return id;
      },

      updateTransaction: (id, updated) => {
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id);
          if (!oldTx) return state;

          const mergedTx = { ...oldTx, ...updated };

          // Revert old effect
          let currentWallets = state.wallets.map((w) => {
            let bal = w.balance;
            if (oldTx.type === 'expense' && w.id === oldTx.walletId) {
              bal += oldTx.amount;
            } else if (oldTx.type === 'income' && w.id === oldTx.walletId) {
              bal -= oldTx.amount;
            } else if (oldTx.type === 'transfer') {
              if (w.id === oldTx.walletId) bal += oldTx.amount;
              if (w.id === oldTx.toWalletId) bal -= oldTx.amount;
            }
            return { ...w, balance: bal };
          });

          // Apply new effect
          currentWallets = currentWallets.map((w) => {
            let bal = w.balance;
            if (mergedTx.type === 'expense' && w.id === mergedTx.walletId) {
              bal -= mergedTx.amount;
            } else if (mergedTx.type === 'income' && w.id === mergedTx.walletId) {
              bal += mergedTx.amount;
            } else if (mergedTx.type === 'transfer') {
              if (w.id === mergedTx.walletId) bal -= mergedTx.amount;
              if (w.id === mergedTx.toWalletId) bal += mergedTx.amount;
            }
            return { ...w, balance: bal };
          });

          return {
            transactions: state.transactions.map((t) => (t.id === id ? mergedTx : t)),
            wallets: currentWallets,
          };
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          const updatedTx = get().transactions.find((t) => t.id === id);
          if (updatedTx) saveTransactionFirestore(fbUser.uid, updatedTx).catch(console.error);
          for (const w of get().wallets) {
            saveWalletFirestore(fbUser.uid, w).catch(console.error);
          }
        }
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) return state;

          const updatedWallets = state.wallets.map((w) => {
            if (tx.type === 'expense' && w.id === tx.walletId) {
              return { ...w, balance: w.balance + tx.amount };
            }
            if (tx.type === 'income' && w.id === tx.walletId) {
              return { ...w, balance: w.balance - tx.amount };
            }
            if (tx.type === 'transfer') {
              let bal = w.balance;
              if (w.id === tx.walletId) bal += tx.amount;
              if (w.id === tx.toWalletId) bal -= tx.amount;
              return { ...w, balance: bal };
            }
            return w;
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            wallets: updatedWallets,
          };
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          deleteTransactionFirestore(fbUser.uid, id).catch(console.error);
          for (const w of get().wallets) {
            saveWalletFirestore(fbUser.uid, w).catch(console.error);
          }
        }
      },

      bulkDeleteTransactions: (ids) => {
        set((state) => {
          const idSet = new Set(ids);
          const toDelete = state.transactions.filter((t) => idSet.has(t.id));
          
          let updatedWallets = [...state.wallets];
          for (const tx of toDelete) {
            updatedWallets = updatedWallets.map((w) => {
              if (tx.type === 'expense' && w.id === tx.walletId) {
                return { ...w, balance: w.balance + tx.amount };
              }
              if (tx.type === 'income' && w.id === tx.walletId) {
                return { ...w, balance: w.balance - tx.amount };
              }
              if (tx.type === 'transfer') {
                let bal = w.balance;
                if (w.id === tx.walletId) bal += tx.amount;
                if (w.id === tx.toWalletId) bal -= tx.amount;
                return { ...w, balance: bal };
              }
              return w;
            });
          }

          return {
            transactions: state.transactions.filter((t) => !idSet.has(t.id)),
            wallets: updatedWallets,
          };
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          bulkDeleteTransactionsFirestore(fbUser.uid, ids).catch(console.error);
          for (const w of get().wallets) {
            saveWalletFirestore(fbUser.uid, w).catch(console.error);
          }
        }
      },

      // --- DOMPET ---
      addWallet: (walletData) => {
        const id = `wallet-${Date.now()}`;
        const newWallet: Wallet = { ...walletData, id };
        set((state) => ({ wallets: [...state.wallets, newWallet] }));
        const fbUser = get().firebaseUser;
        if (fbUser) saveWalletFirestore(fbUser.uid, newWallet).catch(console.error);
        return id;
      },

      updateWallet: (id, updated) => {
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        }));
        const fbUser = get().firebaseUser;
        if (fbUser) {
          const w = get().wallets.find((item) => item.id === id);
          if (w) saveWalletFirestore(fbUser.uid, w).catch(console.error);
        }
      },

      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
        const fbUser = get().firebaseUser;
        if (fbUser) deleteWalletFirestore(fbUser.uid, id).catch(console.error);
      },

      reconcileWallet: (walletId, actualBalance, note) => {
        const state = get();
        const targetWallet = state.wallets.find((w) => w.id === walletId);
        if (!targetWallet) return;

        const diff = actualBalance - targetWallet.balance;
        if (diff === 0) return;

        const today = new Date().toISOString().split('T')[0];

        if (diff > 0) {
          // Kenaikan saldo -> Catat Pemasukan
          const incomeCat = state.categories.find((c) => c.name.includes('Hadiah & Lainnya') || c.type === 'income');
          get().addTransaction({
            date: today,
            type: 'income',
            amount: diff,
            categoryId: incomeCat ? incomeCat.id : 'cat-inc-gift',
            subcategory: 'Penyesuaian Saldo',
            walletId,
            note: note || `Penyesuaian Rekonsiliasi Saldo (Koreksi +${diff})`,
            tags: ['Rekonsiliasi'],
          });
        } else {
          // Penurunan saldo -> Catat Pengeluaran
          const expenseCat = state.categories.find((c) => c.name.includes('Lain-lain') || c.type === 'expense');
          get().addTransaction({
            date: today,
            type: 'expense',
            amount: Math.abs(diff),
            categoryId: expenseCat ? expenseCat.id : 'cat-exp-other',
            subcategory: 'Penyesuaian Saldo',
            walletId,
            note: note || `Penyesuaian Rekonsiliasi Saldo (Koreksi ${diff})`,
            tags: ['Rekonsiliasi'],
          });
        }
      },

      // --- KATEGORI ---
      addCategory: (categoryData) => {
        const id = `cat-${Date.now()}`;
        const newCat: Category = { ...categoryData, id };
        set((state) => ({ categories: [...state.categories, newCat] }));
        const fbUser = get().firebaseUser;
        if (fbUser) saveCategoryFirestore(fbUser.uid, newCat).catch(console.error);
        return id;
      },

      updateCategory: (id, updated) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        }));
        const fbUser = get().firebaseUser;
        if (fbUser) {
          const c = get().categories.find((item) => item.id === id);
          if (c) saveCategoryFirestore(fbUser.uid, c).catch(console.error);
        }
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
        const fbUser = get().firebaseUser;
        if (fbUser) deleteCategoryFirestore(fbUser.uid, id).catch(console.error);
      },

      // --- ANGGARAN (BUDGET) ---
      setBudget: (budgetData) => {
        let savedBudget: Budget | null = null;
        set((state) => {
          const existingIdx = state.budgets.findIndex(
            (b) => b.categoryId === budgetData.categoryId && b.month === budgetData.month
          );
          if (existingIdx >= 0) {
            const copy = [...state.budgets];
            copy[existingIdx] = { ...copy[existingIdx], ...budgetData };
            savedBudget = copy[existingIdx];
            return { budgets: copy };
          }
          const id = `bgt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          savedBudget = { ...budgetData, id };
          return { budgets: [...state.budgets, savedBudget] };
        });

        const fbUser = get().firebaseUser;
        if (fbUser && savedBudget) {
          saveBudgetFirestore(fbUser.uid, savedBudget).catch(console.error);
        }
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
        const fbUser = get().firebaseUser;
        if (fbUser) deleteBudgetFirestore(fbUser.uid, id).catch(console.error);
      },

      copyBudgetsFromPreviousMonth: (targetMonth, sourceMonth) => {
        set((state) => {
          const sourceBudgets = state.budgets.filter((b) => b.month === sourceMonth);
          const otherBudgets = state.budgets.filter((b) => b.month !== targetMonth);

          const newTargetBudgets: Budget[] = sourceBudgets.map((b) => ({
            id: `bgt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            categoryId: b.categoryId,
            monthlyLimit: b.monthlyLimit,
            month: targetMonth,
            rolloverEnabled: b.rolloverEnabled,
            rolloverAmount: 0,
          }));

          return { budgets: [...otherBudgets, ...newTargetBudgets] };
        });
      },

      apply503020Template: (totalIncome, targetMonth) => {
        set((state) => {
          if (totalIncome <= 0) return state;

          const needsLimit = totalIncome * 0.50; // Kebutuhan pokok
          const wantsLimit = totalIncome * 0.30; // Keinginan / Lifestyle

          // Cari kategori yang sesuai
          const foodCat = state.categories.find((c) => c.name.includes('Makanan'));
          const transCat = state.categories.find((c) => c.name.includes('Transportasi'));
          const billsCat = state.categories.find((c) => c.name.includes('Tagihan'));
          const shopCat = state.categories.find((c) => c.name.includes('Belanja'));
          const entCat = state.categories.find((c) => c.name.includes('Hiburan'));

          const newBudgets: Budget[] = [];
          if (foodCat) {
            newBudgets.push({
              id: `bgt-${Date.now()}-1`,
              categoryId: foodCat.id,
              monthlyLimit: Math.round(needsLimit * 0.5),
              month: targetMonth,
              rolloverEnabled: true,
            });
          }
          if (transCat) {
            newBudgets.push({
              id: `bgt-${Date.now()}-2`,
              categoryId: transCat.id,
              monthlyLimit: Math.round(needsLimit * 0.25),
              month: targetMonth,
            });
          }
          if (billsCat) {
            newBudgets.push({
              id: `bgt-${Date.now()}-3`,
              categoryId: billsCat.id,
              monthlyLimit: Math.round(needsLimit * 0.25),
              month: targetMonth,
            });
          }
          if (shopCat) {
            newBudgets.push({
              id: `bgt-${Date.now()}-4`,
              categoryId: shopCat.id,
              monthlyLimit: Math.round(wantsLimit * 0.6),
              month: targetMonth,
            });
          }
          if (entCat) {
            newBudgets.push({
              id: `bgt-${Date.now()}-5`,
              categoryId: entCat.id,
              monthlyLimit: Math.round(wantsLimit * 0.4),
              month: targetMonth,
            });
          }

          const existingOthers = state.budgets.filter((b) => b.month !== targetMonth);
          return { budgets: [...existingOthers, ...newBudgets] };
        });
      },

      // --- TUJUAN TABUNGAN (GOALS) ---
      addGoal: (goalData) => {
        const id = `goal-${Date.now()}`;
        const newGoal: Goal = { ...goalData, id, history: [] };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        return id;
      },

      updateGoal: (id, updated) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updated } : g)),
        }));
      },

      contributeToGoal: (goalId, amount, note, walletId) => {
        const today = new Date().toISOString().split('T')[0];
        const contribId = `gh-${Date.now()}`;

        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              currentAmount: g.currentAmount + amount,
              history: [
                { id: contribId, date: today, amount, note: note || 'Setoran tabungan', walletId },
                ...g.history,
              ],
            };
          }),
        }));

        // Jika dipotong dari dompet, catat transaksi
        if (walletId) {
          const state = get();
          const targetGoal = state.goals.find((g) => g.id === goalId);
          const goalName = targetGoal ? targetGoal.name : 'Tujuan Tabungan';
          const investCat = state.categories.find((c) => c.type === 'expense' && (c.name.includes('Donasi') || c.name.includes('Lain')));
          
          get().addTransaction({
            date: today,
            type: 'expense',
            amount,
            categoryId: investCat ? investCat.id : 'cat-exp-other',
            subcategory: 'Tabungan & Impian',
            walletId,
            note: `Setoran Tujuan Tabungan: ${goalName} ${note ? `(${note})` : ''}`,
            tags: ['Tabungan', 'Goal'],
          });
        }
      },

      withdrawFromGoal: (goalId, amount, note, walletId) => {
        const today = new Date().toISOString().split('T')[0];
        const contribId = `gh-${Date.now()}`;

        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              currentAmount: Math.max(0, g.currentAmount - amount),
              history: [
                { id: contribId, date: today, amount: -amount, note: note || 'Penarikan dana tabungan', walletId },
                ...g.history,
              ],
            };
          }),
        }));

        if (walletId) {
          const state = get();
          const targetGoal = state.goals.find((g) => g.id === goalId);
          const goalName = targetGoal ? targetGoal.name : 'Tujuan Tabungan';
          const giftCat = state.categories.find((c) => c.type === 'income');

          get().addTransaction({
            date: today,
            type: 'income',
            amount,
            categoryId: giftCat ? giftCat.id : 'cat-inc-gift',
            subcategory: 'Pencairan Tabungan',
            walletId,
            note: `Pencairan Tabungan: ${goalName} ${note ? `(${note})` : ''}`,
            tags: ['Tabungan', 'Pencairan'],
          });
        }
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      },

      // --- UTANG & CICILAN ---
      addDebt: (debtData) => {
        const id = `debt-${Date.now()}`;
        const newDebt: Debt = { ...debtData, id, paymentHistory: [] };
        set((state) => ({ debts: [...state.debts, newDebt] }));
        return id;
      },

      updateDebt: (id, updated) => {
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updated } : d)),
        }));
      },

      recordDebtPayment: (debtId, paymentData) => {
        const paymentId = `dp-${Date.now()}`;
        const newPayment: DebtPayment = { ...paymentData, id: paymentId };

        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id !== debtId) return d;
            const updatedRemaining = Math.max(0, d.remainingPrincipal - paymentData.principalPaid);
            const isFullyPaid = updatedRemaining <= 0;
            return {
              ...d,
              remainingPrincipal: updatedRemaining,
              status: isFullyPaid ? 'paid' : d.status,
              paymentHistory: [newPayment, ...d.paymentHistory],
            };
          }),
        }));

        // Catat transaksi keuangan jika walletId disertakan
        if (paymentData.walletId) {
          const state = get();
          const targetDebt = state.debts.find((d) => d.id === debtId);
          if (targetDebt) {
            if (targetDebt.type === 'debt') {
              // Bayar cicilan utang kita -> Pengeluaran
              const debtCat = state.categories.find((c) => c.name.includes('Cicilan') || c.type === 'expense');
              get().addTransaction({
                date: paymentData.date,
                type: 'expense',
                amount: paymentData.amount,
                categoryId: debtCat ? debtCat.id : 'cat-exp-debt',
                subcategory: 'Cicilan & Utang',
                walletId: paymentData.walletId,
                note: `Pembayaran cicilan: ${targetDebt.title} (Pokok: ${paymentData.principalPaid}, Bunga: ${paymentData.interestPaid})`,
                tags: ['Cicilan', 'Pelunasan'],
              });
            } else {
              // Orang bayar utang ke kita (piutang) -> Pemasukan
              const incCat = state.categories.find((c) => c.type === 'income');
              get().addTransaction({
                date: paymentData.date,
                type: 'income',
                amount: paymentData.amount,
                categoryId: incCat ? incCat.id : 'cat-inc-gift',
                subcategory: 'Pelunasan Piutang',
                walletId: paymentData.walletId,
                note: `Penerimaan cicilan piutang dari ${targetDebt.lenderOrBorrower}: ${targetDebt.title}`,
                tags: ['Piutang', 'Pemasukan'],
              });
            }
          }
        }
      },

      deleteDebt: (id) => {
        set((state) => ({ debts: state.debts.filter((d) => d.id !== id) }));
      },

      // --- INVESTASI & ASET ---
      addAsset: (assetData) => {
        const id = `asset-${Date.now()}`;
        const newAsset: Asset = {
          ...assetData,
          id,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        set((state) => ({ assets: [...state.assets, newAsset] }));
        return id;
      },

      updateAsset: (id, updated) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id
              ? { ...a, ...updated, lastUpdated: new Date().toISOString().split('T')[0] }
              : a
          ),
        }));
      },

      deleteAsset: (id) => {
        set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
      },

      // --- TAGIHAN & LANGGANAN ---
      addBill: (billData) => {
        const id = `bill-${Date.now()}`;
        const newBill: Bill = { ...billData, id, paidMonths: [] };
        set((state) => ({ bills: [...state.bills, newBill] }));
        return id;
      },

      updateBill: (id, updated) => {
        set((state) => ({
          bills: state.bills.map((b) => (b.id === id ? { ...b, ...updated } : b)),
        }));
      },

      deleteBill: (id) => {
        set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
      },

      markBillPaid: (billId, monthStr, walletId) => {
        const state = get();
        const targetBill = state.bills.find((b) => b.id === billId);
        if (!targetBill) return;

        // Tambah ke paidMonths
        set((s) => ({
          bills: s.bills.map((b) => {
            if (b.id !== billId) return b;
            if (b.paidMonths.includes(monthStr)) return b;
            return { ...b, paidMonths: [...b.paidMonths, monthStr] };
          }),
        }));

        // Otomatis buat transaksi pengeluaran
        const effectiveWallet = walletId || targetBill.walletId || (state.wallets[0]?.id ?? '');
        const today = new Date().toISOString().split('T')[0];

        get().addTransaction({
          date: today,
          type: 'expense',
          amount: targetBill.amount,
          categoryId: targetBill.categoryId,
          walletId: effectiveWallet,
          note: `Pembayaran tagihan rutin: ${targetBill.title} (${monthStr})`,
          tags: ['Tagihan', 'Rutin'],
          payee: targetBill.title,
        });
      },

      // --- TRANSAKSI BERULANG ---
      addRecurring: (recData) => {
        const id = `rec-${Date.now()}`;
        const newRec: RecurringTransaction = { ...recData, id };
        set((state) => ({ recurringTransactions: [...state.recurringTransactions, newRec] }));
        return id;
      },

      updateRecurring: (id, updated) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? { ...r, ...updated } : r
          ),
        }));
      },

      deleteRecurring: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
        }));
      },

      processDueRecurringTransactions: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];
        const activeRecurring = state.recurringTransactions.filter((r) => r.isActive);

        for (const rec of activeRecurring) {
          if (rec.nextDate <= todayStr && rec.lastGeneratedDate !== rec.nextDate) {
            // Buat transaksi otomatis
            get().addTransaction({
              date: rec.nextDate,
              type: rec.type,
              amount: rec.amount,
              categoryId: rec.categoryId,
              subcategory: rec.subcategory,
              walletId: rec.walletId,
              toWalletId: rec.toWalletId,
              note: `${rec.note || ''} (Otomatis Berulang)`.trim(),
              payee: rec.payee,
              tags: ['Otomatis', 'Berulang'],
              recurringId: rec.id,
            });

            // Hitung tanggal berikutnya
            const currDate = new Date(rec.nextDate);
            if (rec.frequency === 'daily') {
              currDate.setDate(currDate.getDate() + 1);
            } else if (rec.frequency === 'weekly') {
              currDate.setDate(currDate.getDate() + 7);
            } else if (rec.frequency === 'monthly') {
              currDate.setMonth(currDate.getMonth() + 1);
            } else if (rec.frequency === 'yearly') {
              currDate.setFullYear(currDate.getFullYear() + 1);
            }

            const nextIso = currDate.toISOString().split('T')[0];
            get().updateRecurring(rec.id, {
              lastGeneratedDate: rec.nextDate,
              nextDate: nextIso,
            });
          }
        }
      },

      // --- PENGATURAN & LAINNYA ---
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setLock: (locked) => {
        set({ isLocked: locked });
      },

      // --- AUTENTIKASI LOGIN (Username & Password, auto logout 2 hari) ---
      login: async (username: string, password: string) => {
        const state = get();
        const storedUser = state.settings.authUsername || DEFAULT_AUTH_USERNAME;
        const storedHash = state.settings.authPasswordHash || DEFAULT_PASSWORD_HASH;

        // Validasi username (case-insensitive)
        if (username.trim().toLowerCase() !== storedUser.trim().toLowerCase()) {
          return { success: false, message: 'Username tidak ditemukan' };
        }

        // Validasi password
        let isMatch = false;
        // Jika belum ubah kredensial kustom, izinkan default 'admin'
        if (!state.settings.isCustomAuthSet && (password === DEFAULT_AUTH_PASSWORD || password === 'admin123')) {
          isMatch = true;
        } else {
          isMatch = await verifyPassword(password, storedHash);
        }

        if (!isMatch) {
          return { success: false, message: 'Password salah, silakan coba lagi' };
        }

        // Login berhasil: catat timestamp sesi sekarang
        const now = Date.now();
        set((s) => ({
          isAuthenticated: true,
          settings: {
            ...s.settings,
            lastLoginTimestamp: now,
          },
        }));

        return { success: true };
      },

      logout: () => {
        logOutFromFirebase().catch(() => {});
        set((s) => ({
          isAuthenticated: false,
          isLocked: false,
          isLogoutModalOpen: false,
          firebaseUser: null,
          isCloudSyncing: false,
          settings: {
            ...s.settings,
            lastLoginTimestamp: null,
          },
        }));
        try {
          window.location.hash = '#/';
        } catch {}
      },

      refreshSession: () => {
        const state = get();
        if (state.isAuthenticated) {
          set((s) => ({
            settings: {
              ...s.settings,
              lastLoginTimestamp: Date.now(),
            },
          }));
        }
      },

      checkSession: () => {
        const state = get();
        const lastLogin = state.settings.lastLoginTimestamp;
        if (!lastLogin || isSessionExpired(lastLogin)) {
          if (state.isAuthenticated) {
            set({ isAuthenticated: false });
          }
          return false;
        }
        if (!state.isAuthenticated) {
          set({ isAuthenticated: true });
        }
        return true;
      },

      updateCredentials: async ({ currentPassword, newUsername, newPassword }) => {
        const state = get();
        const storedHash = state.settings.authPasswordHash || DEFAULT_PASSWORD_HASH;

        // Verifikasi password lama
        let isOldMatch = false;
        if (!state.settings.isCustomAuthSet && (currentPassword === DEFAULT_AUTH_PASSWORD || currentPassword === 'admin123')) {
          isOldMatch = true;
        } else {
          isOldMatch = await verifyPassword(currentPassword, storedHash);
        }

        if (!isOldMatch) {
          return { success: false, message: 'Password saat ini salah' };
        }

        if (!newUsername.trim()) {
          return { success: false, message: 'Username tidak boleh kosong' };
        }

        let newHash = storedHash;
        if (newPassword && newPassword.trim()) {
          if (newPassword.length < 4) {
            return { success: false, message: 'Password baru minimal 4 karakter' };
          }
          newHash = await hashPassword(newPassword);
        }

        const now = Date.now();
        set((s) => ({
          settings: {
            ...s.settings,
            authUsername: newUsername.trim(),
            authPasswordHash: newHash,
            isCustomAuthSet: true,
            lastLoginTimestamp: now,
          },
          isAuthenticated: true,
        }));

        return { success: true, message: 'Username dan password berhasil diperbarui' };
      },

      setActivePeriod: (period, customRange) => {
        const state = get();
        let range = customRange;
        if (!range && period !== 'custom') {
          const calc = getDateRange(period, state.settings.startDayOfMonth);
          range = { startDate: calc.startDate, endDate: calc.endDate };
        }
        set({
          activePeriod: period,
          customDateRange: range || state.customDateRange,
        });
      },

      resetToEmpty: () => {
        const currentAuth = get().settings;
        set({
          wallets: [
            {
              id: 'wallet-cash-main',
              name: 'Dompet Utama',
              type: 'cash',
              balance: 0,
              initialBalance: 0,
              color: '#0F766E',
              icon: 'Banknote',
            },
          ],
          categories: DEFAULT_CATEGORIES,
          transactions: [],
          recurringTransactions: [],
          budgets: [],
          goals: [],
          debts: [],
          assets: [],
          bills: [],
          settings: {
            ...defaultSettings,
            authUsername: currentAuth.authUsername || DEFAULT_AUTH_USERNAME,
            authPasswordHash: currentAuth.authPasswordHash,
            lastLoginTimestamp: currentAuth.lastLoginTimestamp,
            isCustomAuthSet: currentAuth.isCustomAuthSet,
            hasSampleDataLoaded: false,
          },
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          resetUserDataInFirestore(fbUser.uid).catch(console.error);
        }
      },

      loadSampleData: () => {
        const currentAuth = get().settings;
        set({
          wallets: DEFAULT_WALLETS,
          categories: DEFAULT_CATEGORIES,
          transactions: DEFAULT_TRANSACTIONS,
          recurringTransactions: DEFAULT_RECURRING,
          budgets: DEFAULT_BUDGETS,
          goals: DEFAULT_GOALS,
          debts: DEFAULT_DEBTS,
          assets: DEFAULT_ASSETS,
          bills: DEFAULT_BILLS,
          settings: {
            ...defaultSettings,
            authUsername: currentAuth.authUsername || DEFAULT_AUTH_USERNAME,
            authPasswordHash: currentAuth.authPasswordHash,
            lastLoginTimestamp: currentAuth.lastLoginTimestamp,
            isCustomAuthSet: currentAuth.isCustomAuthSet,
            hasSampleDataLoaded: true,
          },
        });

        const fbUser = get().firebaseUser;
        if (fbUser) {
          loadSampleDataToFirestore(fbUser.uid).catch(console.error);
        }
      },

      importFullData: (data) => {
        try {
          if (!data || typeof data !== 'object') return false;
          const currentAuth = get().settings;
          set({
            wallets: data.wallets || [],
            categories: data.categories || DEFAULT_CATEGORIES,
            transactions: data.transactions || [],
            recurringTransactions: data.recurringTransactions || [],
            budgets: data.budgets || [],
            goals: data.goals || [],
            debts: data.debts || [],
            assets: data.assets || [],
            bills: data.bills || [],
            settings: {
              ...defaultSettings,
              ...(data.settings || {}),
              // Pertahankan kredensial login jika data impor tidak menyertakannya
              authUsername: data.settings?.authUsername || currentAuth.authUsername || DEFAULT_AUTH_USERNAME,
              authPasswordHash: data.settings?.authPasswordHash || currentAuth.authPasswordHash,
              lastLoginTimestamp: currentAuth.lastLoginTimestamp,
            },
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'noven-wallet-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkSession();
        }
      },
    }
  )
);
