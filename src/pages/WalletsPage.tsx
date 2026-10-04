import React, { useState, useMemo } from 'react';
import {
  WalletCards,
  Building2,
  Smartphone,
  Banknote,
  CreditCard,
  TrendingUp,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, WalletType } from '../types/finance';
import { formatRupiah, formatPercent, formatTanggal } from '../lib/formatters';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const WalletsPage: React.FC = () => {
  const {
    wallets,
    transactions,
    addWallet,
    updateWallet,
    deleteWallet,
    reconcileWallet,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Selected wallet for transaction history
  const [activeWalletId, setActiveWalletId] = useState<string>(wallets[0]?.id || '');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [reconcileModalWallet, setReconcileModalWallet] = useState<Wallet | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [reconcileNote, setReconcileNote] = useState<string>('');

  // Form State for Wallet Creation / Editing
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<WalletType>('bank');
  const [formBalance, setFormBalance] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formColor, setFormColor] = useState('#0F766E');
  const [formCreditLimit, setFormCreditLimit] = useState('');
  const [formBillingCycleDate, setFormBillingCycleDate] = useState('15');
  const [formDueDate, setFormDueDate] = useState('5');

  const openAddModal = () => {
    setEditingWallet(null);
    setFormName('');
    setFormType('bank');
    setFormBalance('0');
    setFormAccountNumber('');
    setFormColor('#0F766E');
    setFormCreditLimit('10000000');
    setFormBillingCycleDate('15');
    setFormDueDate('5');
    setIsAddModalOpen(true);
  };

  const openEditModal = (w: Wallet) => {
    setEditingWallet(w);
    setFormName(w.name);
    setFormType(w.type);
    setFormBalance(w.balance.toString());
    setFormAccountNumber(w.accountNumber || '');
    setFormColor(w.color || '#0F766E');
    setFormCreditLimit(w.creditLimit?.toString() || '');
    setFormBillingCycleDate(w.billingCycleDate?.toString() || '15');
    setFormDueDate(w.dueDate?.toString() || '5');
    setIsAddModalOpen(true);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Nama dompet harus diisi', 'error');
      return;
    }

    const payload = {
      name: formName.trim(),
      type: formType,
      balance: parseFloat(formBalance) || 0,
      initialBalance: parseFloat(formBalance) || 0,
      accountNumber: formAccountNumber.trim() || undefined,
      color: formColor,
      icon: formType === 'bank' ? 'Building2' : formType === 'ewallet' ? 'Smartphone' : formType === 'credit_card' ? 'CreditCard' : 'Banknote',
      creditLimit: formType === 'credit_card' ? parseFloat(formCreditLimit) || 0 : undefined,
      billingCycleDate: formType === 'credit_card' ? parseInt(formBillingCycleDate, 10) : undefined,
      dueDate: formType === 'credit_card' ? parseInt(formDueDate, 10) : undefined,
    };

    if (editingWallet) {
      updateWallet(editingWallet.id, payload);
      addToast('Dompet berhasil diperbarui', 'success');
    } else {
      const newId = addWallet(payload);
      setActiveWalletId(newId);
      addToast('Dompet baru berhasil ditambahkan', 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteWallet = (id: string, name: string) => {
    if (confirm(`Hapus dompet "${name}"? Data transaksi yang terhubung tetap tersimpan.`)) {
      deleteWallet(id);
      addToast(`Dompet ${name} dihapus`, 'success');
      if (activeWalletId === id) {
        setActiveWalletId(wallets.find((w) => w.id !== id)?.id || '');
      }
    }
  };

  // Reconcile Handler
  const openReconcileModal = (w: Wallet) => {
    setReconcileModalWallet(w);
    setActualBalanceInput(w.balance.toString());
    setReconcileNote('');
  };

  const handleExecuteReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileModalWallet) return;

    const actual = parseFloat(actualBalanceInput);
    if (isNaN(actual)) {
      addToast('Masukkan saldo riil yang valid', 'error');
      return;
    }

    reconcileWallet(reconcileModalWallet.id, actual, reconcileNote.trim() || undefined);
    addToast(`Saldo dompet ${reconcileModalWallet.name} disesuaikan ke ${formatRupiah(actual)}`, 'success');
    setReconcileModalWallet(null);
  };

  // History of selected wallet
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0];
  const activeWalletTransactions = useMemo(() => {
    if (!activeWallet) return [];
    return transactions
      .filter((t) => t.walletId === activeWallet.id || t.toWalletId === activeWallet.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, activeWallet]);

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Banknote className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Kelola Rekening & Dompet Digital
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau saldo real-time, pantau tagihan kartu kredit, dan lakukan rekonsiliasi berkala.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekening</span>
        </button>
      </div>

      {/* Grid Kartu Dompet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const isSelected = w.id === activeWallet?.id;
          const isCreditCard = w.type === 'credit_card';
          const creditLimit = w.creditLimit || 1;
          const utilizationPct = isCreditCard ? Math.min(100, Math.round((w.balance / creditLimit) * 100)) : 0;

          return (
            <div
              key={w.id}
              onClick={() => setActiveWalletId(w.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-slate-900'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Header Card */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: w.color || '#0F766E' }}
                    >
                      {getWalletIcon(w.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {w.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {w.type === 'bank'
                          ? 'Rekening Bank'
                          : w.type === 'ewallet'
                          ? 'Dompet Digital'
                          : w.type === 'credit_card'
                          ? 'Kartu Kredit'
                          : 'Uang Tunai'}
                        {w.accountNumber && ` · ${w.accountNumber}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit, Reconcile, Delete */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openReconcileModal(w)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Rekonsiliasi Saldo (Koreksi)"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(w)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Ubah"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingWallet(w)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hapus Dompet"
                      aria-label={`Hapus Dompet ${w.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Saldo Nominal */}
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {isCreditCard ? 'Tagihan / Pemakaian Saat Ini' : 'Saldo Tersedia'}
                  </span>
                  <div
                    className={`text-2xl font-bold tabular-nums tracking-tight ${
                      isCreditCard ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatRupiah(w.balance, settings.isPrivacyMode)}
                  </div>
                </div>
              </div>

              {/* Khusus Kartu Kredit: Limit & Tanggal Jatuh Tempo */}
              {isCreditCard && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">
                      Limit: {formatRupiah(w.creditLimit || 0, settings.isPrivacyMode)}
                    </span>
                    <span className={utilizationPct > 50 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      Pemakaian {utilizationPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        utilizationPct > 70 ? 'bg-rose-500' : utilizationPct > 40 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Tgl Cetak: {w.billingCycleDate || 15}</span>
                    <span>Jatuh Tempo: {w.dueDate || 5}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Riwayat Transaksi per Dompet Terpilih */}
      {activeWallet && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Riwayat Mutasi Saldo: {activeWallet.name}
              </h3>
              <p className="text-xs text-slate-500">
                Total {activeWalletTransactions.length} transaksi keluar/masuk melalui rekening ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => openReconcileModal(activeWallet)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rekonsiliasi Saldo</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeWalletTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada mutasi transaksi pada rekening ini.
              </div>
            ) : (
              activeWalletTransactions.slice(0, 10).map((t) => {
                const isIncoming = t.type === 'income' || (t.type === 'transfer' && t.toWalletId === activeWallet.id);
                return (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {t.payee || t.note || (t.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi')}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatTanggal(t.date, 'short')} {t.subcategory && `· ${t.subcategory}`}
                      </span>
                    </div>
                    <span
                      className={`font-semibold tabular-nums ${
                        isIncoming
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncoming ? '+' : '-'}
                      {formatRupiah(t.amount, settings.isPrivacyMode)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT REKENING */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingWallet ? 'Ubah Dompet / Rekening' : 'Tambah Rekening Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveWallet} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Dompet / Bank <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipe Akun
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as WalletType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Uang Tunai</option>
                <option value="credit_card">Kartu Kredit</option>
                <option value="investment">Akun Investasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {formType === 'credit_card' ? 'Saldo Terpakai (Rp)' : 'Saldo Saat Ini (Rp)'}
              </label>
              <input
                type="number"
                step="any"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nomor Rekening / Catatan Akun (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: 8210984122"
              value={formAccountNumber}
              onChange={(e) => setFormAccountNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Form Tambahan Khusus Kartu Kredit */}
          {formType === 'credit_card' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Pengaturan Kartu Kredit
              </span>
              <div>
                <label className="block font-medium mb-1">Limit Kartu Kredit (Rp)</label>
                <input
                  type="number"
                  value={formCreditLimit}
                  onChange={(e) => setFormCreditLimit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Tgl Cetak Tagihan (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formBillingCycleDate}
                    onChange={(e) => setFormBillingCycleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Tgl Jatuh Tempo (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warna Dompet */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pilihan Warna Ikon
            </label>
            <div className="flex items-center gap-2">
              {['#0F766E', '#005E9E', '#003366', '#00AED6', '#16A34A', '#8B5CF6', '#BE123C', '#EAB308'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    formColor === c ? 'scale-115 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              Simpan Dompet
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL REKONSILIASI SALDO */}
      {reconcileModalWallet && (
        <Modal
          isOpen={!!reconcileModalWallet}
          onClose={() => setReconcileModalWallet(null)}
          title={`Rekonsiliasi Saldo: ${reconcileModalWallet.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteReconcile} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
              <p>
                Rekonsiliasi membandingkan saldo tercatat di Noven Wallet dengan saldo asli di rekening bank Anda. Selisih akan otomatis dicatat sebagai transaksi penyesuaian.
              </p>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Saldo Tercatat Saat Ini:</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(reconcileModalWallet.balance)}
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Saldo Aktual di Rekening Bank / Dompet Fisik (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Hitung Selisih */}
            {actualBalanceInput && !isNaN(parseFloat(actualBalanceInput)) && (
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <span>Selisih Penyesuaian:</span>
                <span
                  className={`font-bold tabular-nums ${
                    parseFloat(actualBalanceInput) - reconcileModalWallet.balance >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {formatRupiah(parseFloat(actualBalanceInput) - reconcileModalWallet.balance)}
                </span>
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Catatan Alasan Koreksi
              </label>
              <input
                type="text"
                placeholder="Contoh: Rekonsiliasi akhir bulan September"
                value={reconcileNote}
                onChange={(e) => setReconcileNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReconcileModalWallet(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
              >
                Sesuaikan Saldo Sekarang
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE WALLET MODAL */}
      {deletingWallet && (
        <ConfirmModal
          isOpen={!!deletingWallet}
          onClose={() => setDeletingWallet(null)}
          onConfirm={() => {
            deleteWallet(deletingWallet.id);
            addToast(`Dompet "${deletingWallet.name}" berhasil dihapus`, 'success');
            if (activeWalletId === deletingWallet.id) {
              setActiveWalletId(wallets.find((w) => w.id !== deletingWallet.id)?.id || '');
            }
          }}
          title={`Hapus Dompet "${deletingWallet.name}"?`}
          message="Data transaksi yang terhubung dengan dompet ini tetap tersimpan, namun dompet tidak akan muncul lagi di daftar akun aktif Anda."
          confirmLabel="Hapus Dompet"
          cancelLabel="Batal"
          variant="danger"
        />
      )}
    </div>
  );
};
