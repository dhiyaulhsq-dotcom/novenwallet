export type TransactionType = 'income' | 'expense' | 'transfer';

export type WalletType = 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment' | 'other';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumber?: string;
  isExcludedFromTotal?: boolean;
  // Khusus kartu kredit
  creditLimit?: number;
  billingCycleDate?: number; // tanggal cetak tagihan (1-31)
  dueDate?: number; // tanggal jatuh tempo (1-31)
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  subcategories: string[];
}

export interface TransactionSplit {
  categoryId: string;
  subcategory?: string;
  amount: number;
  note?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  categoryId: string;
  subcategory?: string;
  walletId: string;
  toWalletId?: string; // Khusus transfer
  note?: string;
  tags: string[];
  payee?: string; // Merchant / Penerima
  receiptImage?: string; // base64 string
  splits?: TransactionSplit[];
  recurringId?: string;
  createdAt: string; // ISO string
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  frequency: RecurringFrequency;
  nextDate: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  categoryId: string;
  subcategory?: string;
  walletId: string;
  toWalletId?: string;
  note?: string;
  payee?: string;
  isActive: boolean;
  lastGeneratedDate?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
}

export type GoalPreset = 'emergency' | 'education' | 'house_dp' | 'vehicle' | 'vacation' | 'retirement' | 'custom';

export interface GoalContribution {
  id: string;
  date: string;
  amount: number;
  note?: string;
  walletId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  preset: GoalPreset;
  color: string;
  icon: string;
  history: GoalContribution[];
  notes?: string;
}

export type DebtType = 'debt' | 'receivable'; // debt = utang kita, receivable = piutang (uang kita di orang)

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  note?: string;
  walletId?: string;
}

export interface Debt {
  id: string;
  type: DebtType;
  title: string;
  lenderOrBorrower: string; // Nama bank/orang
  principalAmount: number; // Pokok pinjaman
  interestRateYearly: number; // Persentase bunga per tahun (misal 8.5)
  tenorMonths: number; // Lama pinjaman dalam bulan
  monthlyPayment: number; // Angsuran per bulan
  dueDateDay: number; // Tanggal jatuh tempo tiap bulan (1-31)
  remainingPrincipal: number; // Sisa pokok
  status: 'active' | 'paid';
  startDate: string; // YYYY-MM-DD
  paymentHistory: DebtPayment[];
  notes?: string;
}

export type AssetType = 'stock' | 'mutual_fund' | 'gold' | 'crypto' | 'bond' | 'deposit' | 'property' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  unitCount: number; // misal gram emas, lot saham, unit reksa dana
  avgBuyPrice: number; // Harga beli rata-rata per unit
  currentPrice: number; // Harga pasar saat ini per unit
  notes?: string;
  lastUpdated: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDateDay: number; // Hari jatuh tempo (1-31)
  frequency: 'monthly' | 'yearly';
  categoryId: string;
  walletId: string;
  isAutoPay: boolean;
  paidMonths: string[]; // Daftar 'YYYY-MM' yang sudah dibayar
  reminderDays: number; // Ingatkan H-X hari
}

export interface UserSettings {
  startDayOfMonth: number; // Tanggal gajian / awal pembukuan (1-28)
  isPrivacyMode: boolean; // Sembunyikan nominal
  theme: 'light' | 'dark' | 'system';
  pinHash: string | null;
  hasSampleDataLoaded: boolean;
  authUsername: string; // Username akun login
  authPasswordHash: string; // Hash password login
  lastLoginTimestamp: number | null; // Timestamp login terakhir (ms) untuk batas 2 hari
  isCustomAuthSet?: boolean; // Penanda apakah user sudah mengatur kredensial custom di dalam aplikasi
}

export type DateFilterType = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

export interface DateFilterRange {
  type: DateFilterType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface FinancialHealthBreakdown {
  savingsRateScore: number; // 0-25
  emergencyFundScore: number; // 0-25
  dtiScore: number; // 0-25
  budgetAdherenceScore: number; // 0-25
  totalScore: number; // 0-100
  savingsRatePercent: number;
  emergencyFundMonths: number;
  dtiPercent: number;
  budgetAdherencePercent: number;
  level: 'Sangat Sehat' | 'Sehat' | 'Cukup Baik' | 'Perlu Perhatian';
  summary: string;
  recommendations: string[];
}
