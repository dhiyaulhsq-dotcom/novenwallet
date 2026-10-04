import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Wallet,
  Category,
  Transaction,
  Budget,
  Goal,
  Debt,
  Asset,
  Bill,
  UserSettings,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_WALLETS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_RECURRING,
  DEFAULT_BUDGETS,
  DEFAULT_GOALS,
  DEFAULT_DEBTS,
  DEFAULT_ASSETS,
  DEFAULT_BILLS,
} from '../data/defaultData';

export interface FirebaseSyncedData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  assets: Asset[];
  bills: Bill[];
  settings: Partial<UserSettings>;
}

/**
 * Sync or create user profile on login
 */
export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || 'user@novenwallet.app',
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Noven',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Initialize starter data for new user
      await initializeNewUserStarterData(user.uid);
    } else {
      await setDoc(
        userRef,
        {
          updatedAt: new Date().toISOString(),
          displayName: user.displayName || existing.data().displayName,
          photoURL: user.photoURL || existing.data().photoURL,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Initialize brand new user with standard clean Indonesian categories & a zero-balance starter wallet
 */
export async function initializeNewUserStarterData(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const batch = writeBatch(db);

    // 1. Starter Wallet: Dompet Utama with Rp 0 balance
    const starterWallet: Wallet = {
      id: 'w_main',
      name: 'Dompet Utama',
      type: 'cash',
      balance: 0,
      initialBalance: 0,
      color: '#0F766E',
      icon: 'Banknote',
    };
    batch.set(doc(db, 'users', userId, 'wallets', starterWallet.id), starterWallet);

    // 2. Default categories
    for (const cat of DEFAULT_CATEGORIES) {
      batch.set(doc(db, 'users', userId, 'categories', cat.id), cat);
    }

    // 3. User default settings
    batch.set(doc(db, 'users', userId, 'settings', 'config'), {
      currency: 'IDR',
      isPrivacyMode: false,
      salaryDate: 25,
      theme: 'system',
      monthlyBudgetLimit: 5000000,
      savingsTargetPct: 20,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Start real-time sync across devices (Mobile <-> Desktop)
 */
export function startRealtimeSync(
  userId: string,
  onUpdate: (data: Partial<FirebaseSyncedData>) => void
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  // 1. Wallets listener
  const walletsPath = `users/${userId}/wallets`;
  const unsubWallets = onSnapshot(
    collection(db, 'users', userId, 'wallets'),
    (snapshot) => {
      const wallets: Wallet[] = [];
      snapshot.forEach((docSnap) => {
        wallets.push(docSnap.data() as Wallet);
      });
      onUpdate({ wallets });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, walletsPath);
    }
  );
  unsubscribers.push(unsubWallets);

  // 2. Categories listener
  const categoriesPath = `users/${userId}/categories`;
  const unsubCategories = onSnapshot(
    collection(db, 'users', userId, 'categories'),
    (snapshot) => {
      const categories: Category[] = [];
      snapshot.forEach((docSnap) => {
        categories.push(docSnap.data() as Category);
      });
      if (categories.length > 0) {
        onUpdate({ categories });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, categoriesPath);
    }
  );
  unsubscribers.push(unsubCategories);

  // 3. Transactions listener
  const txPath = `users/${userId}/transactions`;
  const unsubTx = onSnapshot(
    collection(db, 'users', userId, 'transactions'),
    (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        transactions.push(docSnap.data() as Transaction);
      });
      onUpdate({ transactions });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, txPath);
    }
  );
  unsubscribers.push(unsubTx);

  // 4. Budgets listener
  const budgetsPath = `users/${userId}/budgets`;
  const unsubBudgets = onSnapshot(
    collection(db, 'users', userId, 'budgets'),
    (snapshot) => {
      const budgets: Budget[] = [];
      snapshot.forEach((docSnap) => {
        budgets.push(docSnap.data() as Budget);
      });
      onUpdate({ budgets });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, budgetsPath);
    }
  );
  unsubscribers.push(unsubBudgets);

  // 5. Goals listener
  const goalsPath = `users/${userId}/goals`;
  const unsubGoals = onSnapshot(
    collection(db, 'users', userId, 'goals'),
    (snapshot) => {
      const goals: Goal[] = [];
      snapshot.forEach((docSnap) => {
        goals.push(docSnap.data() as Goal);
      });
      onUpdate({ goals });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, goalsPath);
    }
  );
  unsubscribers.push(unsubGoals);

  // 6. Debts listener
  const debtsPath = `users/${userId}/debts`;
  const unsubDebts = onSnapshot(
    collection(db, 'users', userId, 'debts'),
    (snapshot) => {
      const debts: Debt[] = [];
      snapshot.forEach((docSnap) => {
        debts.push(docSnap.data() as Debt);
      });
      onUpdate({ debts });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, debtsPath);
    }
  );
  unsubscribers.push(unsubDebts);

  // 7. Assets listener
  const assetsPath = `users/${userId}/assets`;
  const unsubAssets = onSnapshot(
    collection(db, 'users', userId, 'assets'),
    (snapshot) => {
      const assets: Asset[] = [];
      snapshot.forEach((docSnap) => {
        assets.push(docSnap.data() as Asset);
      });
      onUpdate({ assets });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, assetsPath);
    }
  );
  unsubscribers.push(unsubAssets);

  // 8. Bills listener
  const billsPath = `users/${userId}/bills`;
  const unsubBills = onSnapshot(
    collection(db, 'users', userId, 'bills'),
    (snapshot) => {
      const bills: Bill[] = [];
      snapshot.forEach((docSnap) => {
        bills.push(docSnap.data() as Bill);
      });
      onUpdate({ bills });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, billsPath);
    }
  );
  unsubscribers.push(unsubBills);

  // 9. Settings listener
  const settingsPath = `users/${userId}/settings/config`;
  const unsubSettings = onSnapshot(
    doc(db, 'users', userId, 'settings', 'config'),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ settings: docSnap.data() as Partial<UserSettings> });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, settingsPath);
    }
  );
  unsubscribers.push(unsubSettings);

  // Return cleanup function to unsubscribe from all listeners on logout or unmount
  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        console.warn('Error unsubscribing listener:', err);
      }
    });
  };
}

/**
 * CRUD functions that sync directly to Firestore with error boundary handling
 */
export async function saveWalletFirestore(userId: string, wallet: Wallet): Promise<void> {
  const path = `users/${userId}/wallets/${wallet.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'wallets', wallet.id), wallet);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWalletFirestore(userId: string, walletId: string): Promise<void> {
  const path = `users/${userId}/wallets/${walletId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'wallets', walletId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTransactionFirestore(userId: string, tx: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFirestore(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function bulkDeleteTransactionsFirestore(userId: string, txIds: string[]): Promise<void> {
  const path = `users/${userId}/transactions`;
  try {
    const batch = writeBatch(db);
    for (const id of txIds) {
      batch.delete(doc(db, 'users', userId, 'transactions', id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryFirestore(userId: string, cat: Category): Promise<void> {
  const path = `users/${userId}/categories/${cat.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'categories', cat.id), cat);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFirestore(userId: string, catId: string): Promise<void> {
  const path = `users/${userId}/categories/${catId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'categories', catId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBudgetFirestore(userId: string, budget: Budget): Promise<void> {
  const path = `users/${userId}/budgets/${budget.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'budgets', budget.id), budget);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBudgetFirestore(userId: string, budgetId: string): Promise<void> {
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGoalFirestore(userId: string, goal: Goal): Promise<void> {
  const path = `users/${userId}/goals/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'goals', goal.id), goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGoalFirestore(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDebtFirestore(userId: string, debt: Debt): Promise<void> {
  const path = `users/${userId}/debts/${debt.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'debts', debt.id), debt);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDebtFirestore(userId: string, debtId: string): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'debts', debtId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAssetFirestore(userId: string, asset: Asset): Promise<void> {
  const path = `users/${userId}/assets/${asset.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'assets', asset.id), asset);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAssetFirestore(userId: string, assetId: string): Promise<void> {
  const path = `users/${userId}/assets/${assetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'assets', assetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBillFirestore(userId: string, bill: Bill): Promise<void> {
  const path = `users/${userId}/bills/${bill.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'bills', bill.id), bill);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBillFirestore(userId: string, billId: string): Promise<void> {
  const path = `users/${userId}/bills/${billId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'bills', billId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSettingsFirestore(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const path = `users/${userId}/settings/config`;
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'config'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Clear all user collections in Firestore (Mulai dari Kosong)
 */
export async function resetUserDataInFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const collectionsToClear = [
      'transactions',
      'budgets',
      'goals',
      'debts',
      'assets',
      'bills',
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, 'users', userId, colName));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Reset wallets to 1 clean starter wallet (Dompet Utama with 0 balance)
    const walletSnap = await getDocs(collection(db, 'users', userId, 'wallets'));
    const walletBatch = writeBatch(db);
    walletSnap.forEach((d) => walletBatch.delete(d.ref));
    const starterWallet: Wallet = {
      id: 'w_main',
      name: 'Dompet Utama',
      type: 'cash',
      balance: 0,
      initialBalance: 0,
      color: '#0F766E',
      icon: 'Banknote',
    };
    walletBatch.set(doc(db, 'users', userId, 'wallets', starterWallet.id), starterWallet);
    await walletBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Load 6-month simulation sample data to user's Firestore cloud database
 */
export async function loadSampleDataToFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    // 1. Wallets
    const wBatch = writeBatch(db);
    for (const w of DEFAULT_WALLETS) {
      wBatch.set(doc(db, 'users', userId, 'wallets', w.id), w);
    }
    await wBatch.commit();

    // 2. Categories
    const cBatch = writeBatch(db);
    for (const c of DEFAULT_CATEGORIES) {
      cBatch.set(doc(db, 'users', userId, 'categories', c.id), c);
    }
    await cBatch.commit();

    // 3. Transactions
    const tBatch = writeBatch(db);
    for (const t of DEFAULT_TRANSACTIONS) {
      tBatch.set(doc(db, 'users', userId, 'transactions', t.id), t);
    }
    await tBatch.commit();

    // 4. Budgets
    const bBatch = writeBatch(db);
    for (const b of DEFAULT_BUDGETS) {
      bBatch.set(doc(db, 'users', userId, 'budgets', b.id), b);
    }
    await bBatch.commit();

    // 5. Goals
    const gBatch = writeBatch(db);
    for (const g of DEFAULT_GOALS) {
      gBatch.set(doc(db, 'users', userId, 'goals', g.id), g);
    }
    await gBatch.commit();

    // 6. Debts
    const dBatch = writeBatch(db);
    for (const d of DEFAULT_DEBTS) {
      dBatch.set(doc(db, 'users', userId, 'debts', d.id), d);
    }
    await dBatch.commit();

    // 7. Assets
    const aBatch = writeBatch(db);
    for (const a of DEFAULT_ASSETS) {
      aBatch.set(doc(db, 'users', userId, 'assets', a.id), a);
    }
    await aBatch.commit();

    // 8. Bills
    const billBatch = writeBatch(db);
    for (const bill of DEFAULT_BILLS) {
      billBatch.set(doc(db, 'users', userId, 'bills', bill.id), bill);
    }
    await billBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
