import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ArrowUpDown,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight,
  Split,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction, TransactionType } from '../types/finance';
import { formatRupiah, formatTanggal } from '../lib/formatters';
import { exportTransactionsToCsv, downloadCsv, parseCsv } from '../lib/csvHelper';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { QuickTransactionModal } from '../components/common/QuickTransactionModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    categories,
    wallets,
    deleteTransaction,
    bulkDeleteTransactions,
    addTransaction,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // all | income | expense | transfer
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [receiptModalImage, setReceiptModalImage] = useState<string | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // In-App Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteTransaction = (tx: Transaction) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi?',
      message: `Apakah Anda yakin ingin menghapus transaksi ${tx.payee ? `ke "${tx.payee}"` : ''} senilai ${formatRupiah(tx.amount)}?`,
      onConfirm: () => {
        deleteTransaction(tx.id);
        addToast('Transaksi berhasil dihapus', 'success');
      },
    });
  };

  // CSV Import State
  const [parsedCsvData, setParsedCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [csvColMap, setCsvColMap] = useState({
    dateCol: 0,
    typeCol: 1,
    amountCol: 2,
    catCol: 3,
    walletCol: 5,
    noteCol: 9,
  });

  // Unique tags list
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search text (payee, note, tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPayee = t.payee?.toLowerCase().includes(q);
        const matchNote = t.note?.toLowerCase().includes(q);
        const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        const matchSub = t.subcategory?.toLowerCase().includes(q);
        if (!matchPayee && !matchNote && !matchTag && !matchSub) return false;
      }

      // Filter Type
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Filter Category
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

      // Filter Wallet
      if (filterWallet !== 'all' && t.walletId !== filterWallet && t.toWalletId !== filterWallet) {
        return false;
      }

      // Filter Tag
      if (filterTag !== 'all' && (!t.tags || !t.tags.includes(filterTag))) return false;

      // Filter Amount
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;

      // Filter Date
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'desc' ? -cmp : cmp;
      } else {
        const cmp = a.amount - b.amount;
        return sortOrder === 'desc' ? -cmp : cmp;
      }
    });
  }, [
    transactions,
    searchQuery,
    filterType,
    filterCategory,
    filterWallet,
    filterTag,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi Terpilih?',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi terpilih? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        bulkDeleteTransactions(selectedIds);
        setSelectedIds([]);
        addToast(`${selectedIds.length} transaksi berhasil dihapus`, 'success');
      },
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    const csvStr = exportTransactionsToCsv(filteredTransactions, categories, wallets);
    downloadCsv(csvStr, `transaksi_noven_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast('File CSV berhasil diunduh', 'success');
  };

  // CSV Import File Handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) {
        addToast('File CSV kosong atau tidak valid', 'error');
        return;
      }
      setParsedCsvData(parsed);
      setIsCsvImportOpen(true);
    };
    reader.readAsText(file);
  };

  const executeCsvImport = () => {
    if (!parsedCsvData) return;

    let importedCount = 0;
    const defaultWalletId = wallets[0]?.id || 'wallet-bca';
    const defaultCatId = categories[0]?.id || 'cat-exp-other';

    for (const row of parsedCsvData.rows) {
      const rawDate = row[csvColMap.dateCol];
      const rawType = (row[csvColMap.typeCol] || '').toLowerCase();
      const rawAmount = parseFloat((row[csvColMap.amountCol] || '0').replace(/[^0-9.-]+/g, ''));
      const rawNote = row[csvColMap.noteCol] || '';

      if (!rawDate || isNaN(rawAmount) || rawAmount <= 0) continue;

      let type: TransactionType = 'expense';
      if (rawType.includes('pemasukan') || rawType.includes('income')) {
        type = 'income';
      } else if (rawType.includes('transfer')) {
        type = 'transfer';
      }

      addTransaction({
        date: rawDate.trim(),
        type,
        amount: Math.abs(rawAmount),
        categoryId: defaultCatId,
        walletId: defaultWalletId,
        note: rawNote.trim() || 'Impor dari CSV',
        tags: ['ImporCSV'],
      });
      importedCount++;
    }

    addToast(`Berhasil mengimpor ${importedCount} transaksi dari CSV`, 'success');
    setIsCsvImportOpen(false);
    setParsedCsvData(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar: Pencarian, Tambah Baru, Impor/Ekspor */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi, penerima, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* Impor CSV */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              className="hidden"
            />
          </label>

          {/* Tombol Tambah Transaksi */}
          <button
            type="button"
            onClick={() => {
              setEditingTxId(null);
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter Bar Lengkap */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Filter Lanjutan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Filter Jenis */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Jenis</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Dompet */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Dompet</label>
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tag */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Tag</label>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Tag</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          {/* Rentang Tanggal Mulai */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Rentang Tanggal Akhir */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        {(filterType !== 'all' || filterCategory !== 'all' || filterWallet !== 'all' || filterTag !== 'all' || startDate || endDate || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterWallet('all');
                setFilterTag('all');
                setMinAmount('');
                setMaxAmount('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Banner (Jika ada item dipilih) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs">
          <span className="font-semibold text-teal-900 dark:text-teal-200">
            {selectedIds.length} transaksi dipilih
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih</span>
          </button>
        </div>
      )}

      {/* Tabel Transaksi Desktop & Card List Mobile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Header Controls: Sort & Total Count */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredTransactions.length} transaksi</span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Urutkan:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortField === 'date') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortField('date');
                    setSortOrder('desc');
                  }
                }}
                className={`font-semibold px-2 py-1 rounded-lg ${sortField === 'date' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}
              >
                Tanggal {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortField === 'amount') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortField('amount');
                    setSortOrder('desc');
                  }
                }}
                className={`font-semibold px-2 py-1 rounded-lg ${sortField === 'amount' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}
              >
                Nominal {sortField === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value={10}>10 / hal</option>
              <option value={15}>15 / hal</option>
              <option value={30}>30 / hal</option>
              <option value={50}>50 / hal</option>
            </select>
          </div>
        </div>

        {/* Tabel Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    aria-label="Pilih semua"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {selectedIds.length > 0 && selectedIds.length === paginatedTransactions.length ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kategori / Dompet</th>
                <th className="p-3">Penerima & Catatan</th>
                <th className="p-3">Tag / Struk</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const wal = wallets.find((w) => w.id === tx.walletId);
                  const toWal = tx.toWalletId ? wallets.find((w) => w.id === tx.toWalletId) : null;
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isSelected = selectedIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(tx.id)}
                          aria-label={`Pilih transaksi ${tx.id}`}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400 font-medium">
                        {formatTanggal(tx.date, 'short')}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.type === 'transfer' ? 'Transfer Antar Dompet' : cat?.name || 'Kategori'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{wal?.name || 'Dompet'}</span>
                          {toWal && (
                            <>
                              <span>→</span>
                              <span>{toWal.name}</span>
                            </>
                          )}
                          {tx.subcategory && (
                            <>
                              <span>·</span>
                              <span>{tx.subcategory}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        {tx.payee && (
                          <div className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {tx.payee}
                          </div>
                        )}
                        {tx.note && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {tx.note}
                          </div>
                        )}
                        {tx.splits && tx.splits.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            <Split className="w-3 h-3" />
                            <span>Split: {tx.splits.length} pos</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {tx.tags?.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              #{t}
                            </span>
                          ))}
                          {tx.receiptImage && (
                            <button
                              type="button"
                              onClick={() => setReceiptModalImage(tx.receiptImage!)}
                              className="p-1 text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-950/40 rounded transition-colors"
                              title="Lihat Struk"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold tabular-nums text-sm ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-teal-600 dark:text-teal-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatRupiah(tx.amount, settings.isPrivacyMode)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTxId(tx.id);
                              setIsQuickAddOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                            aria-label="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tidak ada transaksi ditemukan.
            </div>
          ) : (
            paginatedTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const wal = wallets.find((w) => w.id === tx.walletId);
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';

              return (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {tx.payee || cat?.name || 'Transaksi'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatTanggal(tx.date, 'short')} · {wal?.name}
                      </div>
                    </div>
                    <span
                      className={`font-bold tabular-nums text-xs ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-teal-600'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatRupiah(tx.amount, settings.isPrivacyMode)}
                    </span>
                  </div>

                  {tx.note && (
                    <p className="text-[11px] text-slate-500 italic">{tx.note}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {tx.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTxId(tx.id);
                          setIsQuickAddOpen(true);
                        }}
                        className="text-xs text-teal-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginasi Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL LIHAT GAMBAR STRUK */}
      {receiptModalImage && (
        <Modal
          isOpen={!!receiptModalImage}
          onClose={() => setReceiptModalImage(null)}
          title="Bukti Struk Transaksi"
          maxWidth="md"
        >
          <div className="flex flex-col items-center">
            <img
              src={receiptModalImage}
              alt="Bukti Struk Transaksi"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-200 dark:border-slate-800"
            />
            <button
              type="button"
              onClick={() => setReceiptModalImage(null)}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL PEMETAAN KOLOM CSV IMPOR */}
      {isCsvImportOpen && parsedCsvData && (
        <Modal
          isOpen={isCsvImportOpen}
          onClose={() => setIsCsvImportOpen(false)}
          title="Pemetaan Kolom Impor CSV"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Ditemukan {parsedCsvData.rows.length} baris data. Sesuaikan indeks kolom CSV dengan field transaksi Noven Wallet.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Kolom Tanggal (YYYY-MM-DD)</label>
                <select
                  value={csvColMap.dateCol}
                  onChange={(e) => setCsvColMap({ ...csvColMap, dateCol: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {parsedCsvData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Kolom Nominal</label>
                <select
                  value={csvColMap.amountCol}
                  onChange={(e) => setCsvColMap({ ...csvColMap, amountCol: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {parsedCsvData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Kolom Tipe (Pemasukan/Pengeluaran)</label>
                <select
                  value={csvColMap.typeCol}
                  onChange={(e) => setCsvColMap({ ...csvColMap, typeCol: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {parsedCsvData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Kolom Catatan / Deskripsi</label>
                <select
                  value={csvColMap.noteCol}
                  onChange={(e) => setCsvColMap({ ...csvColMap, noteCol: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {parsedCsvData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      Kolom {i + 1}: {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCsvImportOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeCsvImport}
                className="px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
              >
                Mulai Impor Sekarang
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QUICK ADD / EDIT MODAL */}
      <QuickTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingTxId(null);
        }}
        editTransactionId={editingTxId}
      />
      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
};
