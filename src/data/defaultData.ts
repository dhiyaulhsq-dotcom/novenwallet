import {
  Category,
  Wallet,
  Budget,
  Goal,
  Debt,
  Asset,
  Bill,
  RecurringTransaction,
  Transaction,
} from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran
  {
    id: 'cat-exp-food',
    name: 'Makanan & Minuman',
    type: 'expense',
    icon: 'Utensils',
    color: '#F97316', // Orange
    subcategories: ['Makanan Pokok', 'Restoran & Cafe', 'Kopi & Minuman', 'Jajanan & Snack', 'Belanja Dapur']
  },
  {
    id: 'cat-exp-transport',
    name: 'Transportasi',
    type: 'expense',
    icon: 'Car',
    color: '#0EA5E9', // Sky
    subcategories: ['Bensin/BBM', 'Ojek/Taksi Online', 'Parkir & Tol', 'Servis & Kendaraan', 'Tiket & Kereta']
  },
  {
    id: 'cat-exp-bills',
    name: 'Tagihan & Utilitas',
    type: 'expense',
    icon: 'Zap',
    color: '#EAB308', // Amber
    subcategories: ['Listrik PLN', 'Air PDAM', 'Internet & WiFi', 'Pulsa & Data', 'Gas LPG', 'BPJS & Asuransi']
  },
  {
    id: 'cat-exp-housing',
    name: 'Tempat Tinggal',
    type: 'expense',
    icon: 'Home',
    color: '#8B5CF6', // Purple
    subcategories: ['Sewa Kos/Kontrakan', 'Iuran Kebersihan & IPL', 'Perbaikan Rumah', 'Perlengkapan Rumah']
  },
  {
    id: 'cat-exp-shopping',
    name: 'Belanja & Lifestyle',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#EC4899', // Pink
    subcategories: ['Pakaian & Fashion', 'Elektronik & Gadget', 'Perawatan Diri & Skincare', 'Hobi']
  },
  {
    id: 'cat-exp-entertainment',
    name: 'Hiburan & Langganan',
    type: 'expense',
    icon: 'Film',
    color: '#6366F1', // Indigo
    subcategories: ['Streaming (Netflix/Spotify)', 'Bioskop & Event', 'Liburan & Wisata', 'Game']
  },
  {
    id: 'cat-exp-health',
    name: 'Kesehatan & Medis',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#EF4444', // Red
    subcategories: ['Obat & Vitamin', 'Dokter & Lab', 'Gym & Olahraga', 'Konsultasi']
  },
  {
    id: 'cat-exp-education',
    name: 'Pendidikan & Kursus',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#14B8A6', // Teal
    subcategories: ['Buku & Modul', 'Kursus Online', 'Uang Kuliah/Sekolah', 'Sertifikasi']
  },
  {
    id: 'cat-exp-donation',
    name: 'Donasi, Zakat & Keluarga',
    type: 'expense',
    icon: 'HeartHandshake',
    color: '#10B981', // Emerald
    subcategories: ['Zakat Maal / Fitrah', 'Sedekah & Infaq', 'Kiriman Orang Tua', 'Kado & Hadiah']
  },
  {
    id: 'cat-exp-debt',
    name: 'Cicilan & Utang',
    type: 'expense',
    icon: 'CreditCard',
    color: '#F43F5E', // Rose
    subcategories: ['Cicilan KPR', 'Cicilan Kendaraan', 'Kartu Kredit', 'Cicilan Lainnya']
  },
  {
    id: 'cat-exp-other',
    name: 'Lain-lain',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748B', // Slate
    subcategories: ['Biaya Admin', 'Pengeluaran Tak Terduga', 'Penyesuaian Saldo']
  },

  // Pemasukan
  {
    id: 'cat-inc-salary',
    name: 'Gaji & Upah',
    type: 'income',
    icon: 'Briefcase',
    color: '#16A34A', // Green
    subcategories: ['Gaji Pokok', 'Tunjangan', 'Uang Lembur', 'THR & Bonus']
  },
  {
    id: 'cat-inc-business',
    name: 'Bisnis & Usaha',
    type: 'income',
    icon: 'Store',
    color: '#2563EB', // Blue
    subcategories: ['Penjualan Produk', 'Jasa & Proyek', 'Keuntungan Dagang']
  },
  {
    id: 'cat-inc-investment',
    name: 'Investasi & Pasif',
    type: 'income',
    icon: 'TrendingUp',
    color: '#0D9488', // Teal
    subcategories: ['Dividen Saham', 'Imbal Hasil Reksadana', 'Bunga Tabungan/Deposito', 'Capital Gain']
  },
  {
    id: 'cat-inc-freelance',
    name: 'Freelance & Sampingan',
    type: 'income',
    icon: 'Laptop',
    color: '#8B5CF6', // Purple
    subcategories: ['Desain & Konten', 'Coding & Tech', 'Komisi Afiliasi']
  },
  {
    id: 'cat-inc-gift',
    name: 'Hadiah & Lainnya',
    type: 'income',
    icon: 'Gift',
    color: '#D97706', // Amber
    subcategories: ['Hadiah/Pemberian', 'Cashback & Promo', 'Refund/Pengembalian', 'Penyesuaian Saldo']
  }
];

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet-bca',
    name: 'BCA Utama (Tahapan)',
    type: 'bank',
    balance: 18450000,
    initialBalance: 15000000,
    color: '#005E9E',
    icon: 'Building2',
    accountNumber: '8210984122'
  },
  {
    id: 'wallet-mandiri',
    name: 'Mandiri Tabungan Bisnis',
    type: 'bank',
    balance: 7850000,
    initialBalance: 6000000,
    color: '#003366',
    icon: 'Building2',
    accountNumber: '1370019283741'
  },
  {
    id: 'wallet-gopay',
    name: 'GoPay Saldo',
    type: 'ewallet',
    balance: 850000,
    initialBalance: 500000,
    color: '#00AED6',
    icon: 'Smartphone'
  },
  {
    id: 'wallet-cash',
    name: 'Dompet Tunai (Cash)',
    type: 'cash',
    balance: 1250000,
    initialBalance: 1000000,
    color: '#16A34A',
    icon: 'Banknote'
  },
  {
    id: 'wallet-ovo',
    name: 'OVO Premier',
    type: 'ewallet',
    balance: 420000,
    initialBalance: 200000,
    color: '#4C3494',
    icon: 'Smartphone'
  },
  {
    id: 'wallet-cc-bca',
    name: 'BCA Everyday Card',
    type: 'credit_card',
    balance: 2450000, // Terpakai
    initialBalance: 0,
    color: '#BE123C',
    icon: 'CreditCard',
    creditLimit: 15000000,
    billingCycleDate: 15,
    dueDate: 5
  }
];

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'bgt-1',
    categoryId: 'cat-exp-food',
    monthlyLimit: 3500000,
    month: '2026-10',
    rolloverEnabled: true,
    rolloverAmount: 150000
  },
  {
    id: 'bgt-2',
    categoryId: 'cat-exp-transport',
    monthlyLimit: 1200000,
    month: '2026-10',
    rolloverEnabled: false,
    rolloverAmount: 0
  },
  {
    id: 'bgt-3',
    categoryId: 'cat-exp-bills',
    monthlyLimit: 1500000,
    month: '2026-10',
    rolloverEnabled: false,
    rolloverAmount: 0
  },
  {
    id: 'bgt-4',
    categoryId: 'cat-exp-shopping',
    monthlyLimit: 1500000,
    month: '2026-10',
    rolloverEnabled: false,
    rolloverAmount: 0
  },
  {
    id: 'bgt-5',
    categoryId: 'cat-exp-entertainment',
    monthlyLimit: 800000,
    month: '2026-10',
    rolloverEnabled: false,
    rolloverAmount: 0
  },
  {
    id: 'bgt-6',
    categoryId: 'cat-exp-donation',
    monthlyLimit: 1800000,
    month: '2026-10',
    rolloverEnabled: false,
    rolloverAmount: 0
  }
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-emergency',
    name: 'Dana Darurat 6 Bulan',
    targetAmount: 48000000,
    currentAmount: 34500000,
    deadline: '2027-06-30',
    preset: 'emergency',
    color: '#0F766E',
    icon: 'ShieldCheck',
    notes: 'Disimpan di Reksadana Pasar Uang & Tabungan untuk kebutuhan mendesak.',
    history: [
      { id: 'gh-1', date: '2026-08-25', amount: 2500000, note: 'Alokasi dari gaji Agustus' },
      { id: 'gh-2', date: '2026-09-25', amount: 2500000, note: 'Alokasi dari gaji September' }
    ]
  },
  {
    id: 'goal-house',
    name: 'DP Rumah Impian',
    targetAmount: 100000000,
    currentAmount: 46000000,
    deadline: '2028-12-31',
    preset: 'house_dp',
    color: '#2563EB',
    icon: 'Home',
    notes: 'Target DP 20% untuk rumah di kawasan Serpong / BSD.',
    history: [
      { id: 'gh-3', date: '2026-09-01', amount: 3000000, note: 'Setoran rutin bulanan' }
    ]
  },
  {
    id: 'goal-vacation',
    name: 'Liburan ke Jepang (Tokyo - Kyoto)',
    targetAmount: 25000000,
    currentAmount: 17500000,
    deadline: '2027-04-15',
    preset: 'vacation',
    color: '#EC4899',
    icon: 'Plane',
    notes: 'Musim semi Sakura untuk 8 hari.',
    history: [
      { id: 'gh-4', date: '2026-09-15', amount: 1500000, note: 'Bonus freelance' }
    ]
  },
  {
    id: 'goal-laptop',
    name: 'Upgrade Laptop Kerja M4',
    targetAmount: 28000000,
    currentAmount: 21000000,
    deadline: '2026-12-25',
    preset: 'custom',
    color: '#8B5CF6',
    icon: 'Laptop',
    notes: 'MacBook Pro untuk produktivitas kerja.',
    history: [
      { id: 'gh-5', date: '2026-09-28', amount: 2000000, note: 'Tabungan sampingan' }
    ]
  }
];

export const DEFAULT_DEBTS: Debt[] = [
  {
    id: 'debt-kpr',
    type: 'debt',
    title: 'KPR BTN Syariah Griya',
    lenderOrBorrower: 'Bank BTN Syariah',
    principalAmount: 280000000,
    interestRateYearly: 7.75,
    tenorMonths: 120,
    monthlyPayment: 3360000,
    dueDateDay: 10,
    remainingPrincipal: 218500000,
    status: 'active',
    startDate: '2024-03-01',
    paymentHistory: [
      {
        id: 'dp-1',
        date: '2026-09-10',
        amount: 3360000,
        principalPaid: 1950000,
        interestPaid: 1410000,
        note: 'Cicilan bulan ke-30'
      }
    ],
    notes: 'Bunga fixed 3 tahun pertama, sisa floating capped 10%.'
  },
  {
    id: 'debt-motor',
    type: 'debt',
    title: 'Cicilan Motor PCX 160',
    lenderOrBorrower: 'FIF Astra',
    principalAmount: 34000000,
    interestRateYearly: 8.5,
    tenorMonths: 24,
    monthlyPayment: 1650000,
    dueDateDay: 20,
    remainingPrincipal: 8250000,
    status: 'active',
    startDate: '2025-10-15',
    paymentHistory: [
      {
        id: 'dp-2',
        date: '2026-09-20',
        amount: 1650000,
        principalPaid: 1320000,
        interestPaid: 330000,
        note: 'Cicilan bulan ke-11'
      }
    ],
    notes: 'Sisa 5 bulan lagi lunas.'
  },
  {
    id: 'receivable-budi',
    type: 'receivable',
    title: 'Pinjaman Modal Teman (Budi)',
    lenderOrBorrower: 'Budi Santoso',
    principalAmount: 5000000,
    interestRateYearly: 0,
    tenorMonths: 6,
    monthlyPayment: 1000000,
    dueDateDay: 28,
    remainingPrincipal: 2000000,
    status: 'active',
    startDate: '2026-07-01',
    paymentHistory: [
      {
        id: 'dp-3',
        date: '2026-09-28',
        amount: 1000000,
        principalPaid: 1000000,
        interestPaid: 0,
        note: 'Transfer cicilan ke-3 via BCA'
      }
    ],
    notes: 'Pinjaman tanpa bunga untuk modal katering.'
  }
];

export const DEFAULT_ASSETS: Asset[] = [
  {
    id: 'asset-saham-bbca',
    name: 'PT Bank Central Asia Tbk (BBCA)',
    type: 'stock',
    unitCount: 15, // 15 lot = 1500 lembar
    avgBuyPrice: 915000, // per lot
    currentPrice: 1025000, // per lot (Rp 10.250/lembar)
    notes: 'Saham bluechip dividen stabil, akun di Mirae Asset Sekuritas.',
    lastUpdated: '2026-10-02'
  },
  {
    id: 'asset-saham-bbri',
    name: 'PT Bank Rakyat Indonesia Tbk (BBRI)',
    type: 'stock',
    unitCount: 20, // 20 lot = 2000 lembar
    avgBuyPrice: 485000, // per lot
    currentPrice: 535000,
    notes: 'Akumulasi berkala tiap koreksi harga.',
    lastUpdated: '2026-10-02'
  },
  {
    id: 'asset-reksa-sucor',
    name: 'Sucorinvest Sharia Money Market Fund',
    type: 'mutual_fund',
    unitCount: 12500, // Unit penyertaan
    avgBuyPrice: 1420,
    currentPrice: 1610,
    notes: 'Portofolio parkir dana darurat di Bibit.',
    lastUpdated: '2026-10-01'
  },
  {
    id: 'asset-gold-antam',
    name: 'Emas Batangan Antam Logam Mulia',
    type: 'gold',
    unitCount: 25, // 25 gram
    avgBuyPrice: 1180000, // per gram
    currentPrice: 1495000, // per gram
    notes: 'Brankas fisik bersertifikat CertiEye.',
    lastUpdated: '2026-10-03'
  },
  {
    id: 'asset-crypto-btc',
    name: 'Bitcoin (BTC)',
    type: 'crypto',
    unitCount: 0.022,
    avgBuyPrice: 920000000,
    currentPrice: 1150000000,
    notes: 'Hardware wallet Ledger, alokasi risiko tinggi 5%.',
    lastUpdated: '2026-10-03'
  },
  {
    id: 'asset-sbn-ori',
    name: 'Obligasi Negara Ritel ORI025',
    type: 'bond',
    unitCount: 20, // @ Rp 1.000.000
    avgBuyPrice: 1000000,
    currentPrice: 1000000,
    notes: 'Kupon 6.25% p.a dibayar tanggal 15 setiap bulan.',
    lastUpdated: '2026-10-01'
  }
];

export const DEFAULT_BILLS: Bill[] = [
  {
    id: 'bill-pln',
    title: 'Listrik PLN Pascabayar',
    amount: 485000,
    dueDateDay: 20,
    frequency: 'monthly',
    categoryId: 'cat-exp-bills',
    walletId: 'wallet-bca',
    isAutoPay: true,
    paidMonths: ['2026-08', '2026-09'],
    reminderDays: 3
  },
  {
    id: 'bill-wifi',
    title: 'Internet WiFi Indihome 50 Mbps',
    amount: 385000,
    dueDateDay: 15,
    frequency: 'monthly',
    categoryId: 'cat-exp-bills',
    walletId: 'wallet-bca',
    isAutoPay: false,
    paidMonths: ['2026-08', '2026-09'],
    reminderDays: 2
  },
  {
    id: 'bill-netflix',
    title: 'Langganan Netflix Premium 4K',
    amount: 186000,
    dueDateDay: 10,
    frequency: 'monthly',
    categoryId: 'cat-exp-entertainment',
    walletId: 'wallet-cc-bca',
    isAutoPay: true,
    paidMonths: ['2026-08', '2026-09'],
    reminderDays: 1
  },
  {
    id: 'bill-spotify',
    title: 'Spotify Premium Family Plan',
    amount: 86900,
    dueDateDay: 6,
    frequency: 'monthly',
    categoryId: 'cat-exp-entertainment',
    walletId: 'wallet-gopay',
    isAutoPay: true,
    paidMonths: ['2026-08', '2026-09', '2026-10'],
    reminderDays: 2
  },
  {
    id: 'bill-bpjs',
    title: 'Iuran BPJS Kesehatan Kelas 1 Mandiri',
    amount: 150000,
    dueDateDay: 10,
    frequency: 'monthly',
    categoryId: 'cat-exp-bills',
    walletId: 'wallet-mandiri',
    isAutoPay: true,
    paidMonths: ['2026-08', '2026-09'],
    reminderDays: 3
  }
];

export const DEFAULT_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec-salary',
    frequency: 'monthly',
    nextDate: '2026-10-25',
    amount: 14500000,
    type: 'income',
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    note: 'Payroll gaji bulanan',
    isActive: true,
    lastGeneratedDate: '2026-09-25'
  },
  {
    id: 'rec-wifi',
    frequency: 'monthly',
    nextDate: '2026-10-15',
    amount: 385000,
    type: 'expense',
    categoryId: 'cat-exp-bills',
    subcategory: 'Internet & WiFi',
    walletId: 'wallet-bca',
    payee: 'Telkom Indihome',
    note: 'Paket Fiber 50 Mbps',
    isActive: true,
    lastGeneratedDate: '2026-09-15'
  },
  {
    id: 'rec-sedekah',
    frequency: 'weekly',
    nextDate: '2026-10-09',
    amount: 100000,
    type: 'expense',
    categoryId: 'cat-exp-donation',
    subcategory: 'Sedekah & Infaq',
    walletId: 'wallet-gopay',
    payee: 'Masjid Raya Al-Ikhlas',
    note: 'Infaq Jumat berkah',
    isActive: true,
    lastGeneratedDate: '2026-10-02'
  }
];

// Rich 6-month Indonesian transaction history
export const DEFAULT_TRANSACTIONS: Transaction[] = [
  // OKTOBER 2026 (Bulan Berjalan)
  {
    id: 'tx-2610-01',
    date: '2026-10-04',
    type: 'expense',
    amount: 165000,
    categoryId: 'cat-exp-food',
    subcategory: 'Restoran & Cafe',
    walletId: 'wallet-gopay',
    payee: 'Kopi Kenangan & Roti',
    tags: ['Nongkrong', 'Ngopi'],
    note: 'Kopi Kenangan Mantan x 3 + Toast',
    createdAt: '2026-10-04T09:15:00.000Z'
  },
  {
    id: 'tx-2610-02',
    date: '2026-10-03',
    type: 'expense',
    amount: 320000,
    categoryId: 'cat-exp-transport',
    subcategory: 'Bensin/BBM',
    walletId: 'wallet-mandiri',
    payee: 'SPBU Pertamina Pasti Pas',
    tags: ['Mobil', 'Pertamax'],
    note: 'Isi full tank Pertamax',
    createdAt: '2026-10-03T16:30:00.000Z'
  },
  {
    id: 'tx-2610-03',
    date: '2026-10-03',
    type: 'expense',
    amount: 850000,
    categoryId: 'cat-exp-food',
    subcategory: 'Belanja Dapur',
    walletId: 'wallet-bca',
    payee: 'Superindo BSD',
    tags: ['Mingguan', 'Groceries'],
    note: 'Belanja sayur, buah, daging, dan kebutuhan dapur mingguan',
    createdAt: '2026-10-03T11:20:00.000Z'
  },
  {
    id: 'tx-2610-04',
    date: '2026-10-02',
    type: 'expense',
    amount: 100000,
    categoryId: 'cat-exp-donation',
    subcategory: 'Sedekah & Infaq',
    walletId: 'wallet-gopay',
    payee: 'Masjid Raya Al-Ikhlas',
    tags: ['Sedekah', 'Jumat'],
    note: 'Kotak amal jumat',
    createdAt: '2026-10-02T12:45:00.000Z'
  },
  {
    id: 'tx-2610-05',
    date: '2026-10-01',
    type: 'transfer',
    amount: 1500000,
    categoryId: 'cat-exp-other',
    walletId: 'wallet-bca',
    toWalletId: 'wallet-gopay',
    tags: ['TopUp'],
    note: 'Top up GoPay untuk ongkos & jajan harian',
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'tx-2610-06',
    date: '2026-10-01',
    type: 'income',
    amount: 2500000,
    categoryId: 'cat-inc-freelance',
    subcategory: 'Coding & Tech',
    walletId: 'wallet-mandiri',
    payee: 'Klien Web E-Commerce',
    tags: ['SideHustle'],
    note: 'Pembayaran termin 1 website toko online',
    createdAt: '2026-10-01T15:20:00.000Z'
  },

  // SEPTEMBER 2026
  {
    id: 'tx-2609-01',
    date: '2026-09-28',
    type: 'expense',
    amount: 450000,
    categoryId: 'cat-exp-shopping',
    subcategory: 'Pakaian & Fashion',
    walletId: 'wallet-bca',
    payee: 'Uniqlo Grand Indonesia',
    tags: ['BajuKerja'],
    note: 'Kemeja Airism & kaos polo',
    createdAt: '2026-09-28T14:30:00.000Z'
  },
  {
    id: 'tx-2609-02',
    date: '2026-09-25',
    type: 'income',
    amount: 14500000,
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    tags: ['Gaji', 'Payroll'],
    note: 'Gaji bulan September 2026',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'tx-2609-03',
    date: '2026-09-25',
    type: 'expense',
    amount: 3360000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan KPR',
    walletId: 'wallet-bca',
    payee: 'Bank BTN Syariah',
    tags: ['KPR', 'Utang'],
    note: 'Auto-debet cicilan KPR bulan September',
    createdAt: '2026-09-25T08:30:00.000Z'
  },
  {
    id: 'tx-2609-04',
    date: '2026-09-25',
    type: 'expense',
    amount: 1500000,
    categoryId: 'cat-exp-donation',
    subcategory: 'Kiriman Orang Tua',
    walletId: 'wallet-bca',
    payee: 'Ibu Tercinta',
    tags: ['Keluarga', 'Bakti'],
    note: 'Transfer bulanan orang tua di kampung',
    createdAt: '2026-09-25T09:00:00.000Z'
  },
  {
    id: 'tx-2609-05',
    date: '2026-09-20',
    type: 'expense',
    amount: 1650000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan Kendaraan',
    walletId: 'wallet-mandiri',
    payee: 'FIF Astra',
    tags: ['Motor'],
    note: 'Cicilan motor PCX angsuran ke-11',
    createdAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'tx-2609-06',
    date: '2026-09-20',
    type: 'expense',
    amount: 475000,
    categoryId: 'cat-exp-bills',
    subcategory: 'Listrik PLN',
    walletId: 'wallet-bca',
    payee: 'PLN Pascabayar',
    tags: ['Tagihan', 'Listrik'],
    note: 'Tagihan listrik rumah',
    createdAt: '2026-09-20T11:15:00.000Z'
  },
  {
    id: 'tx-2609-07',
    date: '2026-09-15',
    type: 'expense',
    amount: 385000,
    categoryId: 'cat-exp-bills',
    subcategory: 'Internet & WiFi',
    walletId: 'wallet-bca',
    payee: 'Indihome Fiber',
    tags: ['Tagihan', 'WiFi'],
    note: 'Langganan internet rumah',
    createdAt: '2026-09-15T09:00:00.000Z'
  },
  {
    id: 'tx-2609-08',
    date: '2026-09-12',
    type: 'expense',
    amount: 680000,
    categoryId: 'cat-exp-food',
    subcategory: 'Restoran & Cafe',
    walletId: 'wallet-cc-bca',
    payee: 'Sushi Tei PIM',
    tags: ['Weekend', 'Makan'],
    note: 'Makan malam keluarga',
    createdAt: '2026-09-12T19:30:00.000Z'
  },
  {
    id: 'tx-2609-09',
    date: '2026-09-10',
    type: 'expense',
    amount: 186000,
    categoryId: 'cat-exp-entertainment',
    subcategory: 'Streaming (Netflix/Spotify)',
    walletId: 'wallet-cc-bca',
    payee: 'Netflix Subscription',
    tags: ['Langganan'],
    note: 'Netflix 4K',
    createdAt: '2026-09-10T08:00:00.000Z'
  },
  {
    id: 'tx-2609-10',
    date: '2026-09-05',
    type: 'expense',
    amount: 450000,
    categoryId: 'cat-exp-health',
    subcategory: 'Obat & Vitamin',
    walletId: 'wallet-gopay',
    payee: 'Apotek Guardian',
    tags: ['Kesehatan'],
    note: 'Beli Blackmores Vitamin C & Minyak Ikan',
    createdAt: '2026-09-05T13:40:00.000Z'
  },
  {
    id: 'tx-2609-11',
    date: '2026-09-02',
    type: 'income',
    amount: 1200000,
    categoryId: 'cat-inc-investment',
    subcategory: 'Dividen Saham',
    walletId: 'wallet-bca',
    payee: 'PT Bank Central Asia Tbk',
    tags: ['Dividen', 'Investasi'],
    note: 'Dividen interim saham BBCA',
    createdAt: '2026-09-02T10:00:00.000Z'
  },

  // AGUSTUS 2026
  {
    id: 'tx-2608-01',
    date: '2026-08-25',
    type: 'income',
    amount: 14500000,
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    tags: ['Gaji'],
    note: 'Gaji bulan Agustus',
    createdAt: '2026-08-25T08:00:00.000Z'
  },
  {
    id: 'tx-2608-02',
    date: '2026-08-25',
    type: 'expense',
    amount: 3360000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan KPR',
    walletId: 'wallet-bca',
    payee: 'Bank BTN Syariah',
    tags: ['KPR'],
    note: 'Cicilan KPR Agustus',
    createdAt: '2026-08-25T08:30:00.000Z'
  },
  {
    id: 'tx-2608-03',
    date: '2026-08-20',
    type: 'expense',
    amount: 1650000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan Kendaraan',
    walletId: 'wallet-mandiri',
    payee: 'FIF Astra',
    tags: ['Motor'],
    note: 'Cicilan motor ke-10',
    createdAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'tx-2608-04',
    date: '2026-08-17',
    type: 'expense',
    amount: 550000,
    categoryId: 'cat-exp-entertainment',
    subcategory: 'Liburan & Wisata',
    walletId: 'wallet-gopay',
    payee: 'Taman Impian Jaya Ancol',
    tags: ['Liburan', '17Agustus'],
    note: 'Tiket masuk Dufan perayaan HUT RI',
    createdAt: '2026-08-17T11:00:00.000Z'
  },
  {
    id: 'tx-2608-05',
    date: '2026-08-15',
    type: 'expense',
    amount: 2850000,
    categoryId: 'cat-exp-food',
    subcategory: 'Restoran & Cafe',
    walletId: 'wallet-bca',
    payee: 'Resto Padang Pagi Sore',
    tags: ['Traktiran'],
    splits: [
      { categoryId: 'cat-exp-food', subcategory: 'Restoran & Cafe', amount: 2000000, note: 'Traktir tim kantor' },
      { categoryId: 'cat-exp-donation', subcategory: 'Sedekah & Infaq', amount: 850000, note: 'Kotak sumbangan panti' }
    ],
    note: 'Split transaksi: Traktir ulang tahun + sedekah panti',
    createdAt: '2026-08-15T19:00:00.000Z'
  },
  {
    id: 'tx-2608-06',
    date: '2026-08-10',
    type: 'expense',
    amount: 490000,
    categoryId: 'cat-exp-bills',
    subcategory: 'Listrik PLN',
    walletId: 'wallet-bca',
    payee: 'PLN Pascabayar',
    tags: ['Listrik'],
    note: 'Listrik AC & rumah',
    createdAt: '2026-08-10T12:00:00.000Z'
  },
  {
    id: 'tx-2608-07',
    date: '2026-08-05',
    type: 'income',
    amount: 4200000,
    categoryId: 'cat-inc-business',
    subcategory: 'Jasa & Proyek',
    walletId: 'wallet-mandiri',
    payee: 'Agensi Digital Studio',
    tags: ['Proyek'],
    note: 'Pelunasan jasa UI/UX Design aplikasi kasir',
    createdAt: '2026-08-05T14:00:00.000Z'
  },

  // JULI 2026
  {
    id: 'tx-2607-01',
    date: '2026-07-25',
    type: 'income',
    amount: 14500000,
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    tags: ['Gaji'],
    note: 'Gaji bulan Juli',
    createdAt: '2026-07-25T08:00:00.000Z'
  },
  {
    id: 'tx-2607-02',
    date: '2026-07-25',
    type: 'expense',
    amount: 3360000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan KPR',
    walletId: 'wallet-bca',
    payee: 'Bank BTN Syariah',
    tags: ['KPR'],
    note: 'Cicilan KPR Juli',
    createdAt: '2026-07-25T08:30:00.000Z'
  },
  {
    id: 'tx-2607-03',
    date: '2026-07-20',
    type: 'expense',
    amount: 1650000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan Kendaraan',
    walletId: 'wallet-mandiri',
    payee: 'FIF Astra',
    tags: ['Motor'],
    note: 'Cicilan motor ke-9',
    createdAt: '2026-07-20T10:00:00.000Z'
  },
  {
    id: 'tx-2607-04',
    date: '2026-07-15',
    type: 'expense',
    amount: 850000,
    categoryId: 'cat-exp-education',
    subcategory: 'Kursus Online',
    walletId: 'wallet-bca',
    payee: 'Udemy / Coursera',
    tags: ['Belajar', 'Skill'],
    note: 'Kursus Full-Stack TypeScript & AI Agent',
    createdAt: '2026-07-15T15:00:00.000Z'
  },
  {
    id: 'tx-2607-05',
    date: '2026-07-10',
    type: 'expense',
    amount: 1200000,
    categoryId: 'cat-exp-food',
    subcategory: 'Belanja Dapur',
    walletId: 'wallet-bca',
    payee: 'Hypermart Lippo Karawaci',
    tags: ['Groceries'],
    note: 'Belanja bulanan daging & beras',
    createdAt: '2026-07-10T14:20:00.000Z'
  },

  // JUNI 2026
  {
    id: 'tx-2606-01',
    date: '2026-06-25',
    type: 'income',
    amount: 14500000,
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    tags: ['Gaji'],
    note: 'Gaji bulan Juni',
    createdAt: '2026-06-25T08:00:00.000Z'
  },
  {
    id: 'tx-2606-02',
    date: '2026-06-25',
    type: 'expense',
    amount: 3360000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan KPR',
    walletId: 'wallet-bca',
    payee: 'Bank BTN Syariah',
    tags: ['KPR'],
    note: 'Cicilan KPR Juni',
    createdAt: '2026-06-25T08:30:00.000Z'
  },
  {
    id: 'tx-2606-03',
    date: '2026-06-18',
    type: 'income',
    amount: 3500000,
    categoryId: 'cat-inc-investment',
    subcategory: 'Imbal Hasil Reksadana',
    walletId: 'wallet-bca',
    payee: 'Bibit Tumbuh Bersama',
    tags: ['Investasi', 'Profit'],
    note: 'Profit taking sebagian reksadana obligasi',
    createdAt: '2026-06-18T11:00:00.000Z'
  },
  {
    id: 'tx-2606-04',
    date: '2026-06-12',
    type: 'expense',
    amount: 980000,
    categoryId: 'cat-exp-transport',
    subcategory: 'Servis & Kendaraan',
    walletId: 'wallet-mandiri',
    payee: 'Bengkel Resmi AHASS Honda',
    tags: ['Motor', 'Servis'],
    note: 'Ganti oli mesin, oli gardan, kampas rem PCX',
    createdAt: '2026-06-12T10:15:00.000Z'
  },

  // MEI 2026
  {
    id: 'tx-2605-01',
    date: '2026-05-25',
    type: 'income',
    amount: 14500000,
    categoryId: 'cat-inc-salary',
    subcategory: 'Gaji Pokok',
    walletId: 'wallet-bca',
    payee: 'PT Teknologi Digital Nusantara',
    tags: ['Gaji'],
    note: 'Gaji bulan Mei',
    createdAt: '2026-05-25T08:00:00.000Z'
  },
  {
    id: 'tx-2605-02',
    date: '2026-05-20',
    type: 'expense',
    amount: 1650000,
    categoryId: 'cat-exp-debt',
    subcategory: 'Cicilan Kendaraan',
    walletId: 'wallet-mandiri',
    payee: 'FIF Astra',
    tags: ['Motor'],
    note: 'Cicilan motor ke-7',
    createdAt: '2026-05-20T10:00:00.000Z'
  },
  {
    id: 'tx-2605-03',
    date: '2026-05-15',
    type: 'expense',
    amount: 1450000,
    categoryId: 'cat-exp-food',
    subcategory: 'Makanan Pokok',
    walletId: 'wallet-bca',
    payee: 'Lotte Mart Gandaria',
    tags: ['Groceries'],
    note: 'Stok beras premium, minyak goreng, dan lauk beku',
    createdAt: '2026-05-15T16:00:00.000Z'
  }
];
