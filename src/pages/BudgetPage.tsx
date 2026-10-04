import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  Copy,
  Wand2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Budget } from '../types/finance';
import { formatRupiah, formatTanggal } from '../lib/formatters';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const BudgetPage: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    setBudget,
    deleteBudget,
    copyBudgetsFromPreviousMonth,
    apply503020Template,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateIncomeInput, setTemplateIncomeInput] = useState<string>('12000000');

  // Form State
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formRollover, setFormRollover] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Previous month string
  const previousMonthStr = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Filter budgets for selected month
  const currentBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  // Calculate actual spending per category in selected month
  const spendingPerCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.date.startsWith(selectedMonth)) {
        if (t.splits && t.splits.length > 0) {
          for (const s of t.splits) {
            map[s.categoryId] = (map[s.categoryId] || 0) + s.amount;
          }
        } else {
          map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
        }
      }
    }
    return map;
  }, [transactions, selectedMonth]);

  // Overall budget metrics
  const totalBudgetLimit = useMemo(() => {
    return currentBudgets.reduce((sum, b) => sum + b.monthlyLimit + (b.rolloverAmount || 0), 0);
  }, [currentBudgets]);

  const totalBudgetSpent = useMemo(() => {
    return currentBudgets.reduce((sum, b) => sum + (spendingPerCategory[b.categoryId] || 0), 0);
  }, [currentBudgets, spendingPerCategory]);

  const overallProgressPct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  // Available expense categories not budgeted yet
  const availableExpenseCats = useMemo(() => {
    const budgetedCatIds = new Set(currentBudgets.map((b) => b.categoryId));
    return categories.filter((c) => c.type === 'expense' && (!budgetedCatIds.has(c.id) || editingBudget?.categoryId === c.id));
  }, [categories, currentBudgets, editingBudget]);

  const openAddBudgetModal = () => {
    setEditingBudget(null);
    setFormCategoryId(availableExpenseCats[0]?.id || categories[0]?.id || '');
    setFormLimit('1500000');
    setFormRollover(false);
    setIsModalOpen(true);
  };

  const openEditBudgetModal = (b: Budget) => {
    setEditingBudget(b);
    setFormCategoryId(b.categoryId);
    setFormLimit(b.monthlyLimit.toString());
    setFormRollover(b.rolloverEnabled || false);
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(formLimit);
    if (!limit || limit <= 0) {
      addToast('Batas anggaran harus lebih dari 0', 'error');
      return;
    }

    setBudget({
      categoryId: formCategoryId,
      monthlyLimit: limit,
      month: selectedMonth,
      rolloverEnabled: formRollover,
      rolloverAmount: editingBudget?.rolloverAmount || 0,
    });

    addToast('Anggaran berhasil disimpan', 'success');
    setIsModalOpen(false);
  };

  const handleCopyFromPrevious = () => {
    const prevCount = budgets.filter((b) => b.month === previousMonthStr).length;
    if (prevCount === 0) {
      addToast(`Tidak ada data anggaran pada bulan ${previousMonthStr}`, 'error');
      return;
    }

    if (confirm(`Salin ${prevCount} anggaran dari bulan ${previousMonthStr}? Anggaran bulan ini akan diperbarui.`)) {
      copyBudgetsFromPreviousMonth(selectedMonth, previousMonthStr);
      addToast('Anggaran berhasil disalin dari bulan lalu', 'success');
    }
  };

  const handleApply503020 = (e: React.FormEvent) => {
    e.preventDefault();
    const inc = parseFloat(templateIncomeInput);
    if (!inc || inc <= 0) {
      addToast('Masukkan estimasi pendapatan bulanan yang valid', 'error');
      return;
    }

    apply503020Template(inc, selectedMonth);
    addToast('Template 50/30/20 berhasil diterapkan', 'success');
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Bulan & Aksi Cepat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Anggaran Bulanan ({formatTanggal(`${selectedMonth}-01`, 'month_year')})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kendalikan pengeluaran dengan batasan pos belanja dan opsi rollover sisa dana.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pilih Bulan */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />

          {/* Salin dari Bulan Lalu */}
          <button
            type="button"
            onClick={handleCopyFromPrevious}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Salin anggaran dari bulan sebelumnya"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salin Bulan Lalu</span>
          </button>

          {/* Template 50/30/20 */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 rounded-xl transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Template 50/30/20</span>
          </button>

          {/* Tambah Anggaran */}
          <button
            type="button"
            onClick={openAddBudgetModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Atur Pos Baru</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Keseluruhan Anggaran Bulan Terpilih */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Pengeluaran Dianggarkan
            </span>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
              {formatRupiah(totalBudgetSpent, settings.isPrivacyMode)}
              <span className="text-sm font-normal text-slate-400 ml-2">
                dari batas {formatRupiah(totalBudgetLimit, settings.isPrivacyMode)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-slate-500 block">Sisa Alokasi Anggaran</span>
            <span
              className={`text-xl font-bold tabular-nums ${
                totalBudgetLimit - totalBudgetSpent >= 0
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(totalBudgetLimit - totalBudgetSpent, settings.isPrivacyMode)}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallProgressPct > 100
                ? 'bg-rose-600'
                : overallProgressPct >= 80
                ? 'bg-amber-500'
                : 'bg-teal-600'
            }`}
            style={{ width: `${Math.min(100, overallProgressPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>{overallProgressPct}% terpakai</span>
          {overallProgressPct > 100 ? (
            <span className="text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Overbudget sebesar {formatRupiah(totalBudgetSpent - totalBudgetLimit)}
            </span>
          ) : overallProgressPct >= 80 ? (
            <span className="text-amber-500 font-medium">Mendekati batas anggaran</span>
          ) : (
            <span className="text-emerald-600 font-medium">Pengeluaran terkendali</span>
          )}
        </div>
      </div>

      {/* Daftar Anggaran per Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentBudgets.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
            Belum ada anggaran untuk bulan {formatTanggal(`${selectedMonth}-01`, 'month_year')}.
            <div className="mt-3">
              <button
                type="button"
                onClick={openAddBudgetModal}
                className="px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
              >
                Buat Anggaran Pertama
              </button>
            </div>
          </div>
        ) : (
          currentBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = spendingPerCategory[b.categoryId] || 0;
            const effectiveLimit = b.monthlyLimit + (b.rolloverAmount || 0);
            const pct = effectiveLimit > 0 ? Math.round((spent / effectiveLimit) * 100) : 0;
            const remaining = effectiveLimit - spent;

            let barColor = 'bg-teal-600';
            let statusText = 'Aman';
            let statusColor = 'text-emerald-600 dark:text-emerald-400';

            if (pct > 100) {
              barColor = 'bg-rose-600';
              statusText = 'Overbudget';
              statusColor = 'text-rose-600 dark:text-rose-400 font-bold';
            } else if (pct >= 80) {
              barColor = 'bg-amber-500';
              statusText = 'Peringatan 80%';
              statusColor = 'text-amber-500 font-semibold';
            }

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat?.color || '#0F766E' }}
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {cat?.name || 'Kategori'}
                      </h4>
                      {b.rolloverEnabled && (
                        <span className="text-[10px] text-teal-600 dark:text-teal-400">
                          Rollover aktif (+{formatRupiah(b.rolloverAmount || 0)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditBudgetModal(b)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus anggaran ${cat?.name}?`)) {
                          deleteBudget(b.id);
                          addToast('Anggaran dihapus', 'success');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500">
                    Terpakai: <strong className="text-slate-900 dark:text-white tabular-nums">{formatRupiah(spent, settings.isPrivacyMode)}</strong>
                  </span>
                  <span className="text-slate-400">
                    Pagu: {formatRupiah(effectiveLimit, settings.isPrivacyMode)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className={`text-[11px] ${statusColor}`}>
                    {statusText} ({pct}%)
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {remaining >= 0 ? `Sisa: ${formatRupiah(remaining, settings.isPrivacyMode)}` : `Lebih: ${formatRupiah(Math.abs(remaining), settings.isPrivacyMode)}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL ATUR / EDIT ANGGARAN */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Ubah Anggaran Pos' : 'Atur Anggaran Kategori Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Pilih Kategori Pengeluaran</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {availableExpenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Batas Maksimal Bulanan (Rp)</label>
            <input
              type="number"
              required
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              placeholder="Contoh: 2000000"
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={formRollover}
                onChange={(e) => setFormRollover(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Aktifkan Rollover (Akumulasikan sisa anggaran bulan lalu)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan Anggaran
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL TEMPLATE 50/30/20 */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Template Anggaran 50/30/20"
        maxWidth="md"
      >
        <form onSubmit={handleApply503020} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
            <p className="leading-relaxed">
              Metode 50/30/20 membagi pendapatan Anda:
              <br />• <strong>50% Kebutuhan Pokok</strong> (Makanan, Transport, Tagihan)
              <br />• <strong>30% Keinginan & Lifestyle</strong> (Belanja, Hiburan)
              <br />• <strong>20% Tabungan / Investasi</strong>
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Estimasi Total Pendapatan Bulanan (Rp)</label>
            <input
              type="number"
              required
              value={templateIncomeInput}
              onChange={(e) => setTemplateIncomeInput(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Terapkan Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
