import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  Bell,
  Check,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Bill } from '../types/finance';
import { formatRupiah } from '../lib/formatters';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const BillsPage: React.FC = () => {
  const {
    bills,
    categories,
    wallets,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDateDay, setFormDueDateDay] = useState('10');
  const [formFrequency, setFormFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formWalletId, setFormWalletId] = useState(wallets[0]?.id || '');
  const [formIsAutoPay, setFormIsAutoPay] = useState(false);
  const [formReminderDays, setFormReminderDays] = useState('3');

  // Aggregates
  const totalMonthlyCost = useMemo(() => {
    return bills.reduce((sum, b) => {
      return sum + (b.frequency === 'yearly' ? Math.round(b.amount / 12) : b.amount);
    }, 0);
  }, [bills]);

  const totalYearlyCost = totalMonthlyCost * 12;

  // Bills categorized by status this month
  const unpaidBills = useMemo(() => {
    return bills
      .filter((b) => !b.paidMonths.includes(currentMonthStr))
      .sort((a, b) => a.dueDateDay - b.dueDateDay);
  }, [bills, currentMonthStr]);

  const paidBills = useMemo(() => {
    return bills
      .filter((b) => b.paidMonths.includes(currentMonthStr))
      .sort((a, b) => a.dueDateDay - b.dueDateDay);
  }, [bills, currentMonthStr]);

  const openAddModal = () => {
    setEditingBill(null);
    setFormTitle('Internet WiFi Rumah');
    setFormAmount('385000');
    setFormDueDateDay('15');
    setFormFrequency('monthly');
    setFormCategoryId(categories.find((c) => c.name.includes('Tagihan'))?.id || categories[0]?.id || '');
    setFormWalletId(wallets[0]?.id || '');
    setFormIsAutoPay(false);
    setFormReminderDays('3');
    setIsAddModalOpen(true);
  };

  const openEditModal = (b: Bill) => {
    setEditingBill(b);
    setFormTitle(b.title);
    setFormAmount(b.amount.toString());
    setFormDueDateDay(b.dueDateDay.toString());
    setFormFrequency(b.frequency);
    setFormCategoryId(b.categoryId);
    setFormWalletId(b.walletId);
    setFormIsAutoPay(b.isAutoPay);
    setFormReminderDays(b.reminderDays.toString());
    setIsAddModalOpen(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (!formTitle.trim() || !amt || amt <= 0) {
      addToast('Lengkapi data tagihan', 'error');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      amount: amt,
      dueDateDay: parseInt(formDueDateDay, 10) || 1,
      frequency: formFrequency,
      categoryId: formCategoryId || categories[0]?.id,
      walletId: formWalletId,
      isAutoPay: formIsAutoPay,
      reminderDays: parseInt(formReminderDays, 10) || 3,
    };

    if (editingBill) {
      updateBill(editingBill.id, payload);
      addToast('Tagihan berhasil diperbarui', 'success');
    } else {
      addBill(payload);
      addToast('Tagihan rutin baru ditambahkan', 'success');
    }

    setIsAddModalOpen(false);
  };

  const handlePayBill = (billId: string) => {
    markBillPaid(billId, currentMonthStr);
    addToast('Tagihan ditandai lunas dan transaksi dicatat', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Tagihan Rutin & Biaya Langganan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan tidak ada denda keterlambatan dengan memantau jadwal jatuh tempo dan estimasi beban bulanan.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tagihan</span>
        </button>
      </div>

      {/* KPI Cards: Komitmen Biaya Langganan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Komitmen Tagihan / Bulan
          </span>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalMonthlyCost, settings.isPrivacyMode)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {bills.length} layanan rutin aktif
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Estimasi Biaya Langganan / Tahun
          </span>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalYearlyCost, settings.isPrivacyMode)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Beban tahunan terakumulasi
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Status Bulan Ini ({currentMonthStr})
          </span>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span className={unpaidBills.length > 0 ? 'text-amber-500' : 'text-emerald-600'}>
              {unpaidBills.length} Belum
            </span>
            <span className="text-sm font-normal text-slate-400">/ {paidBills.length} Lunas</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {unpaidBills.length === 0 ? 'Semua tagihan bulan ini telah beres!' : 'Perlu diselesaikan sebelum jatuh tempo'}
          </span>
        </div>
      </div>

      {/* KALENDER / TIMELINE JATUH TEMPO HARI BULAN INI */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>Kalender Jatuh Tempo Tagihan</span>
        </h3>

        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-16 lg:grid-cols-31 gap-1.5 pt-2 text-center">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const dayBills = bills.filter((b) => b.dueDateDay === day);
            const hasBills = dayBills.length > 0;
            const isToday = currentDay === day;
            const allDayPaid = hasBills && dayBills.every((b) => b.paidMonths.includes(currentMonthStr));

            return (
              <div
                key={day}
                title={hasBills ? `${dayBills.map((b) => b.title).join(', ')}` : undefined}
                className={`p-2 rounded-xl text-xs transition-all border ${
                  isToday
                    ? 'ring-2 ring-teal-500 font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-500'
                    : hasBills
                    ? allDayPaid
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-semibold'
                    : 'border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <span>{day}</span>
                {hasBills && (
                  <div className="mt-1 flex justify-center">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        allDayPaid ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DAFTAR TAGIHAN BELUM LUNAS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Belum Dibayar Bulan Ini ({unpaidBills.length})</span>
        </h3>

        {unpaidBills.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            Luar biasa! Tidak ada tagihan tertunggak untuk bulan ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unpaidBills.map((b) => {
              const daysLeft = b.dueDateDay - currentDay;
              const isOverdue = daysLeft < 0;
              const wal = wallets.find((w) => w.id === b.walletId);

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {b.title}
                      </h4>
                      {b.isAutoPay && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                          Auto-Debet
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Jatuh tempo tiap tgl <strong>{b.dueDateDay}</strong> · Rekening {wal?.name || 'Default'}
                    </div>
                    <span
                      className={`text-[11px] font-semibold block ${
                        isOverdue ? 'text-rose-600' : daysLeft <= 3 ? 'text-amber-500' : 'text-slate-500'
                      }`}
                    >
                      {isOverdue ? `Lewat jatuh tempo ${Math.abs(daysLeft)} hari lalu` : `Jatuh tempo dalam ${daysLeft} hari`}
                    </span>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {formatRupiah(b.amount, settings.isPrivacyMode)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePayBill(b.id)}
                      className="px-3 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tandai Lunas</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DAFTAR TAGIHAN YANG SUDAH LUNAS */}
      {paidBills.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Sudah Lunas Bulan Ini ({paidBills.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {paidBills.map((b) => (
              <div
                key={b.id}
                className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs opacity-80"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    {b.title}
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Lunas untuk {currentMonthStr}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatRupiah(b.amount, settings.isPrivacyMode)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus langganan ${b.title}?`)) {
                        deleteBill(b.id);
                        addToast('Langganan dihapus', 'success');
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / UBAH TAGIHAN */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBill ? 'Ubah Tagihan Rutin' : 'Tambah Tagihan Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBill} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Nama Tagihan / Layanan <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: Listrik PLN, WiFi Indihome, Netflix"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Nominal per Periode (Rp) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Frekuensi</label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value as 'monthly' | 'yearly')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Tgl Jatuh Tempo (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={formDueDateDay}
                onChange={(e) => setFormDueDateDay(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Ingatkan H- Hari</label>
              <input
                type="number"
                min="1"
                max="14"
                value={formReminderDays}
                onChange={(e) => setFormReminderDays(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Kategori Pengeluaran</label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {categories.filter((c) => c.type === 'expense').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Rekening Pembayaran Default</label>
              <select
                value={formWalletId}
                onChange={(e) => setFormWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer font-medium pt-1">
              <input
                type="checkbox"
                checked={formIsAutoPay}
                onChange={(e) => setFormIsAutoPay(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Terkoneksi Auto-Debet / Potong Otomatis</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan Tagihan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
