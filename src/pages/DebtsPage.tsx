import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Table,
  Zap,
  Flame,
  Snowflake,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Debt, DebtType } from '../types/finance';
import { formatRupiah, formatTanggal } from '../lib/formatters';
import {
  generateAmortizationSchedule,
  simulateDebtPayoff,
} from '../lib/financialMath';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const DebtsPage: React.FC = () => {
  const {
    debts,
    wallets,
    addDebt,
    updateDebt,
    deleteDebt,
    recordDebtPayment,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Tab: 'debt' (Kewajiban Utang) vs 'receivable' (Piutang ke Orang)
  const [activeTab, setActiveTab] = useState<DebtType>('debt');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [amortizationModalDebt, setAmortizationModalDebt] = useState<Debt | null>(null);
  const [paymentModalDebt, setPaymentModalDebt] = useState<Debt | null>(null);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);

  // Form State
  const [formType, setFormType] = useState<DebtType>('debt');
  const [formTitle, setFormTitle] = useState('');
  const [formLender, setFormLender] = useState('');
  const [formPrincipal, setFormPrincipal] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('8');
  const [formTenor, setFormTenor] = useState('24');
  const [formMonthlyPayment, setFormMonthlyPayment] = useState('');
  const [formDueDateDay, setFormDueDateDay] = useState('10');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // Payment Modal State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPrincipalPart, setPaymentPrincipalPart] = useState('');
  const [paymentInterestPart, setPaymentInterestPart] = useState('');
  const [paymentWalletId, setPaymentWalletId] = useState(wallets[0]?.id || '');
  const [paymentNote, setPaymentNote] = useState('');

  // Snowball / Avalanche Simulator State
  const [extraMonthlyInput, setExtraMonthlyInput] = useState('1000000');

  // Filtered debts by tab
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => d.type === activeTab);
  }, [debts, activeTab]);

  // Aggregate metrics
  const totalPrincipalRemaining = useMemo(() => {
    return filteredDebts
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => sum + d.remainingPrincipal, 0);
  }, [filteredDebts]);

  const totalMonthlyCommitment = useMemo(() => {
    return filteredDebts
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => sum + d.monthlyPayment, 0);
  }, [filteredDebts]);

  // Open Form
  const openAddModal = (type: DebtType) => {
    setEditingDebt(null);
    setFormType(type);
    setFormTitle(type === 'debt' ? 'Cicilan Kendaraan' : 'Pinjaman Teman');
    setFormLender(type === 'debt' ? 'Bank Mandiri' : 'Nama Peminjam');
    setFormPrincipal('25000000');
    setFormInterestRate(type === 'debt' ? '8.5' : '0');
    setFormTenor('24');
    setFormMonthlyPayment('1150000');
    setFormDueDateDay('15');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: Debt) => {
    setEditingDebt(d);
    setFormType(d.type);
    setFormTitle(d.title);
    setFormLender(d.lenderOrBorrower);
    setFormPrincipal(d.principalAmount.toString());
    setFormInterestRate(d.interestRateYearly.toString());
    setFormTenor(d.tenorMonths.toString());
    setFormMonthlyPayment(d.monthlyPayment.toString());
    setFormDueDateDay(d.dueDateDay.toString());
    setFormStartDate(d.startDate);
    setFormNotes(d.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(formPrincipal);
    if (!principal || principal <= 0) {
      addToast('Pokok pinjaman harus lebih dari 0', 'error');
      return;
    }

    const payload = {
      type: formType,
      title: formTitle.trim(),
      lenderOrBorrower: formLender.trim(),
      principalAmount: principal,
      interestRateYearly: parseFloat(formInterestRate) || 0,
      tenorMonths: parseInt(formTenor, 10) || 12,
      monthlyPayment: parseFloat(formMonthlyPayment) || Math.round(principal / (parseInt(formTenor, 10) || 12)),
      dueDateDay: parseInt(formDueDateDay, 10) || 1,
      remainingPrincipal: editingDebt ? editingDebt.remainingPrincipal : principal,
      status: 'active' as const,
      startDate: formStartDate,
      notes: formNotes.trim() || undefined,
    };

    if (editingDebt) {
      updateDebt(editingDebt.id, payload);
      addToast('Data utang/piutang berhasil diperbarui', 'success');
    } else {
      addDebt(payload);
      addToast('Catatan utang/piutang baru ditambahkan', 'success');
    }

    setIsAddModalOpen(false);
  };

  // Payment Recording
  const openPaymentModal = (d: Debt) => {
    setPaymentModalDebt(d);
    setPaymentAmount(d.monthlyPayment.toString());
    // Auto calculate approx interest and principal breakdown
    const monthlyRate = (d.interestRateYearly / 100) / 12;
    const estInterest = Math.round(d.remainingPrincipal * monthlyRate);
    const estPrincipal = Math.max(0, d.monthlyPayment - estInterest);
    setPaymentInterestPart(estInterest.toString());
    setPaymentPrincipalPart(estPrincipal.toString());
    setPaymentNote(`Pembayaran cicilan rutin`);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebt) return;

    const amt = parseFloat(paymentAmount);
    const princ = parseFloat(paymentPrincipalPart);
    const intst = parseFloat(paymentInterestPart) || 0;

    if (!amt || amt <= 0 || isNaN(princ)) {
      addToast('Masukkan nominal pembayaran yang valid', 'error');
      return;
    }

    recordDebtPayment(paymentModalDebt.id, {
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      principalPaid: princ,
      interestPaid: intst,
      walletId: paymentWalletId,
      note: paymentNote.trim() || undefined,
    });

    addToast(`Pembayaran cicilan ${paymentModalDebt.title} berhasil dicatat`, 'success');
    setPaymentModalDebt(null);
  };

  // Amortization Schedule Data
  const currentAmortization = useMemo(() => {
    if (!amortizationModalDebt) return [];
    return generateAmortizationSchedule({
      principal: amortizationModalDebt.principalAmount,
      annualInterestRate: amortizationModalDebt.interestRateYearly,
      tenorMonths: amortizationModalDebt.tenorMonths,
    });
  }, [amortizationModalDebt]);

  // Simulation Data
  const simulationResults = useMemo(() => {
    const extra = parseFloat(extraMonthlyInput) || 0;
    return simulateDebtPayoff(debts, extra);
  }, [debts, extraMonthlyInput]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Utang, Cicilan & Piutang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola jadwal amortisasi cicilan, catat pembayaran, dan simulasikan strategi percepatan pelunasan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Simulasi Snowball vs Avalanche */}
          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 rounded-xl transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Simulasi Pelunasan</span>
          </button>

          <button
            type="button"
            onClick={() => openAddModal(activeTab)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'debt' ? 'Tambah Cicilan' : 'Tambah Piutang'}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Utang (Kewajiban) vs Piutang */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('debt')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'debt'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Utang & Kewajiban ({debts.filter((d) => d.type === 'debt').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'receivable'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Piutang Teman/Kolega ({debts.filter((d) => d.type === 'receivable').length})
          </button>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-500">Total Sisa Pokok: </span>
          <strong className="text-slate-900 dark:text-white tabular-nums">
            {formatRupiah(totalPrincipalRemaining, settings.isPrivacyMode)}
          </strong>
        </div>
      </div>

      {/* Grid Kartu Utang / Piutang */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebts.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
            {activeTab === 'debt' ? 'Tidak ada catatan utang/cicilan aktif. Bebas utang!' : 'Tidak ada piutang aktif yang tercatat.'}
          </div>
        ) : (
          filteredDebts.map((d) => {
            const isPaid = d.status === 'paid' || d.remainingPrincipal <= 0;
            const paidPct = Math.min(100, Math.round(((d.principalAmount - d.remainingPrincipal) / d.principalAmount) * 100));

            return (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Header Title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {d.title}
                        {isPaid && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                            Lunas
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {d.type === 'debt' ? 'Kreditur' : 'Debitur'}: {d.lenderOrBorrower} · Bunga {d.interestRateYearly}% p.a
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus catatan ${d.title}?`)) {
                            deleteDebt(d.id);
                            addToast('Catatan dihapus', 'success');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sisa Pokok & Angsuran */}
                  <div className="grid grid-cols-2 gap-3 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Pokok</span>
                      <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatRupiah(d.remainingPrincipal, settings.isPrivacyMode)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        dari pokok {formatRupiah(d.principalAmount, settings.isPrivacyMode)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Angsuran / Bulan</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(d.monthlyPayment, settings.isPrivacyMode)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Jatuh tempo tgl {d.dueDateDay}
                      </span>
                    </div>
                  </div>

                  {/* Progres Pelunasan */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Progres Pelunasan</span>
                      <span>{paidPct}% lunas</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-300"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Bayar & Lihat Amortisasi */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => openPaymentModal(d)}
                      className="flex-1 py-2 px-3 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{d.type === 'debt' ? 'Bayar Cicilan' : 'Terima Pembayaran'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAmortizationModalDebt(d)}
                    className="py-2 px-3 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Jadwal Amortisasi</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL SIMULASI PELUNASAN DIPERCEPAT (SNOWBALL VS AVALANCHE) */}
      <Modal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        title="Simulasi Pelunasan: Snowball vs Avalanche"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Bandingkan efektivitas strategi pelunasan utang dengan mengalokasikan pembayaran ekstra setiap bulan:
          </p>

          <div>
            <label className="block font-medium mb-1">
              Alokasi Dana Tambahan Bulanan (Ekstra Pembayaran)
            </label>
            <input
              type="number"
              value={extraMonthlyInput}
              onChange={(e) => setExtraMonthlyInput(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Kartu Snowball */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold">
                <Snowflake className="w-4 h-4 text-blue-600" />
                <span>Metode Snowball (Efek Bola Salju)</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Fokus melunasi pokok saldo terkecil lebih dulu untuk mendongkrak motivasi psikologis.
              </p>
              <div className="pt-2 border-t border-blue-100 dark:border-blue-900">
                <div className="flex justify-between py-1">
                  <span>Waktu Bebas Utang:</span>
                  <strong className="text-slate-900 dark:text-white">{simulationResults.snowballMonths} Bulan</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Bunga Dibayar:</span>
                  <strong className="text-slate-900 dark:text-white tabular-nums">{formatRupiah(simulationResults.snowballTotalInterest)}</strong>
                </div>
              </div>
            </div>

            {/* Kartu Avalanche */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Metode Avalanche (Matematika Optimal)</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Fokus melunasi pinjaman dengan suku bunga tertinggi lebih dulu demi meminimalkan total bunga.
              </p>
              <div className="pt-2 border-t border-amber-100 dark:border-amber-900">
                <div className="flex justify-between py-1">
                  <span>Waktu Bebas Utang:</span>
                  <strong className="text-slate-900 dark:text-white">{simulationResults.avalancheMonths} Bulan</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Bunga Dibayar:</span>
                  <strong className="text-slate-900 dark:text-white tabular-nums">{formatRupiah(simulationResults.avalancheTotalInterest)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Penghematan */}
          {simulationResults.interestSaved > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium">
              💡 Dengan metode Avalanche, Anda menghemat bunga sebesar{' '}
              <strong className="tabular-nums">{formatRupiah(simulationResults.interestSaved)}</strong> dibanding strategi snowball!
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => setIsSimulatorModalOpen(false)}
              className="px-4 py-2 font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL JADWAL AMORTISASI */}
      {amortizationModalDebt && (
        <Modal
          isOpen={!!amortizationModalDebt}
          onClose={() => setAmortizationModalDebt(null)}
          title={`Jadwal Amortisasi: ${amortizationModalDebt.title}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>Pokok: {formatRupiah(amortizationModalDebt.principalAmount)}</span>
              <span>Bunga: {amortizationModalDebt.interestRateYearly}% p.a</span>
              <span>Tenor: {amortizationModalDebt.tenorMonths} Bulan</span>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 font-semibold text-slate-500">
                  <tr>
                    <th className="p-2.5">Bulan Ke-</th>
                    <th className="p-2.5 text-right">Angsuran</th>
                    <th className="p-2.5 text-right">Porsi Pokok</th>
                    <th className="p-2.5 text-right">Porsi Bunga</th>
                    <th className="p-2.5 text-right">Sisa Pokok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentAmortization.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 tabular-nums">
                      <td className="p-2.5 font-medium">{row.month}</td>
                      <td className="p-2.5 text-right font-semibold">{formatRupiah(row.installment)}</td>
                      <td className="p-2.5 text-right text-teal-600">{formatRupiah(row.principalPayment)}</td>
                      <td className="p-2.5 text-right text-rose-500">{formatRupiah(row.interestPayment)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{formatRupiah(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAmortizationModalDebt(null)}
                className="px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL BAYAR CICILAN */}
      {paymentModalDebt && (
        <Modal
          isOpen={!!paymentModalDebt}
          onClose={() => setPaymentModalDebt(null)}
          title={`Catat Pembayaran: ${paymentModalDebt.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium mb-1">Total Pembayaran (Rp) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                value={paymentAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentAmount(val);
                  // default principal = amount
                  setPaymentPrincipalPart(val);
                  setPaymentInterestPart('0');
                }}
                className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Porsi Pengurang Pokok</label>
                <input
                  type="number"
                  value={paymentPrincipalPart}
                  onChange={(e) => setPaymentPrincipalPart(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Porsi Bunga Pinjaman</label>
                <input
                  type="number"
                  value={paymentInterestPart}
                  onChange={(e) => setPaymentInterestPart(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                {paymentModalDebt.type === 'debt' ? 'Potong dari Rekening' : 'Masuk ke Rekening'}
              </label>
              <select
                value={paymentWalletId}
                onChange={(e) => setPaymentWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Catatan Pembayaran</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentModalDebt(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL TAMBAH UTANG/PIUTANG */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingDebt ? 'Ubah Data Pinjaman' : formType === 'debt' ? 'Catat Utang Baru' : 'Catat Piutang Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveDebt} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Nama Pinjaman / Cicilan <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: KPR Rumah, Cicilan Motor, Pinjaman Teman"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              {formType === 'debt' ? 'Kreditur / Bank Pemberi Pinjaman' : 'Nama Peminjam (Debitur)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Bank BTN, Budi, dsb."
              value={formLender}
              onChange={(e) => setFormLender(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Pokok Pinjaman Awal (Rp)</label>
              <input
                type="number"
                required
                value={formPrincipal}
                onChange={(e) => setFormPrincipal(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Suku Bunga Tahunan (% p.a)</label>
              <input
                type="number"
                step="0.1"
                value={formInterestRate}
                onChange={(e) => setFormInterestRate(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Tenor (Bulan)</label>
              <input
                type="number"
                required
                value={formTenor}
                onChange={(e) => setFormTenor(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Cicilan / Bulan (Rp)</label>
              <input
                type="number"
                required
                value={formMonthlyPayment}
                onChange={(e) => setFormMonthlyPayment(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Tgl Jatuh Tempo Tiap Bulan (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formDueDateDay}
                onChange={(e) => setFormDueDateDay(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Tanggal Mulai Pinjaman</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
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
              Simpan Pinjaman
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
