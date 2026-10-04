import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import {
  Printer,
  Download,
  Calculator,
  Calendar,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  calculateCashflow,
  calculateCompoundInterest,
  filterTransactionsByDate,
} from '../lib/financialMath';
import { formatRupiah, formatRupiahShort, formatTanggal } from '../lib/formatters';
import { exportTransactionsToCsv, downloadCsv } from '../lib/csvHelper';
import { useToastStore } from '../components/common/Toast';

export const ReportsPage: React.FC = () => {
  const {
    transactions,
    categories,
    wallets,
    recurringTransactions,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Selected Period for Report
  const [reportYear, setReportYear] = useState<number>(2026);
  const [reportMonth, setReportMonth] = useState<string>('2026-10');

  // Interactive Calculators Tab
  const [calcTab, setCalcTab] = useState<'emergency' | 'retirement' | 'compound' | 'mortgage'>('emergency');

  // Calculator 1: Dana Darurat
  const [calcExpenseMonth, setCalcExpenseMonth] = useState('6000000');
  const [calcDependents, setCalcDependents] = useState('single'); // single (3-6), married (6-9), kids (9-12)

  // Calculator 2: Dana Pensiun (Rule of 25)
  const [calcRetireExpense, setCalcRetireExpense] = useState('10000000'); // target bulanan saat pensiun
  const [calcCurrentAge, setCalcCurrentAge] = useState('28');
  const [calcRetireAge, setCalcRetireAge] = useState('55');

  // Calculator 3: Bunga Majemuk
  const [ciInitial, setCiInitial] = useState('10000000');
  const [ciMonthly, setCiMonthly] = useState('2000000');
  const [ciRate, setCiRate] = useState('10'); // 10% p.a (IHSG / Reksadana Saham)
  const [ciYears, setCiYears] = useState('10');

  // Calculator 4: KPR
  const [kprHousePrice, setKprHousePrice] = useState('600000000');
  const [kprDpPercent, setKprDpPercent] = useState('20');
  const [kprRate, setKprRate] = useState('7.5');
  const [kprTenorYears, setKprTenorYears] = useState('15');

  // Month Transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(reportMonth));
  }, [transactions, reportMonth]);

  const monthCashflow = useMemo(() => calculateCashflow(monthTransactions), [monthTransactions]);

  // Daily Average Expense
  const daysInMonth = useMemo(() => {
    const [y, m] = reportMonth.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [reportMonth]);

  const dailyAverageExpense = Math.round(monthCashflow.expense / daysInMonth);

  // Heatmap Kalender Pengeluaran Bulan Terpilih (1 sampai 31)
  const dailySpendingHeatmap = useMemo(() => {
    const days: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) days[i] = 0;

    for (const t of monthTransactions) {
      if (t.type === 'expense') {
        const day = parseInt(t.date.split('-')[2], 10);
        if (days[day] !== undefined) {
          days[day] += t.amount;
        }
      }
    }

    const maxSpend = Math.max(...Object.values(days), 1);
    return { days, maxSpend };
  }, [monthTransactions, daysInMonth]);

  // Proyeksi Arus Kas 6 Bulan ke Depan
  const projectionData = useMemo(() => {
    const list = [];
    const now = new Date();
    // Hitung rata-rata pengeluaran bulanan historis
    const last3MonthsExpenses: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txs = transactions.filter((t) => t.date.startsWith(k) && t.type === 'expense');
      last3MonthsExpenses.push(txs.reduce((sum, t) => sum + t.amount, 0));
    }
    const avgMonthlyExpense = last3MonthsExpenses.length > 0
      ? Math.round(last3MonthsExpenses.reduce((a, b) => a + b, 0) / last3MonthsExpenses.length)
      : 8000000;

    // Recurring incomes per month
    const monthlyRecurringIncome = recurringTransactions
      .filter((r) => r.isActive && r.type === 'income')
      .reduce((sum, r) => sum + (r.frequency === 'monthly' ? r.amount : r.frequency === 'weekly' ? r.amount * 4 : 0), 0);

    const baseIncome = monthlyRecurringIncome > 0 ? monthlyRecurringIncome : 14500000;

    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = formatTanggal(`${key}-01`, 'month_year');
      list.push({
        month: label,
        proyeksiPemasukan: baseIncome,
        proyeksiPengeluaran: avgMonthlyExpense,
        estimasiTabungan: Math.max(0, baseIncome - avgMonthlyExpense),
      });
    }

    return list;
  }, [transactions, recurringTransactions]);

  // Compound Interest Results
  const compoundResults = useMemo(() => {
    return calculateCompoundInterest({
      initialAmount: parseFloat(ciInitial) || 0,
      monthlyDeposit: parseFloat(ciMonthly) || 0,
      annualRatePercent: parseFloat(ciRate) || 0,
      years: parseInt(ciYears, 10) || 5,
    });
  }, [ciInitial, ciMonthly, ciRate, ciYears]);

  // KPR Calculator Results
  const kprResults = useMemo(() => {
    const price = parseFloat(kprHousePrice) || 0;
    const dpPct = parseFloat(kprDpPercent) || 20;
    const rate = parseFloat(kprRate) || 7.5;
    const years = parseInt(kprTenorYears, 10) || 15;

    const dpNominal = (price * dpPct) / 100;
    const loanPrincipal = price - dpNominal;
    const monthlyRate = (rate / 100) / 12;
    const tenorMonths = years * 12;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = loanPrincipal / tenorMonths;
    } else {
      monthlyPayment = (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
    }

    const totalPaid = monthlyPayment * tenorMonths;
    const totalInterest = totalPaid - loanPrincipal;

    return {
      dpNominal: Math.round(dpNominal),
      loanPrincipal: Math.round(loanPrincipal),
      monthlyPayment: Math.round(monthlyPayment),
      totalPaid: Math.round(totalPaid),
      totalInterest: Math.round(totalInterest),
    };
  }, [kprHousePrice, kprDpPercent, kprRate, kprTenorYears]);

  // Cetak Laporan PDF
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvStr = exportTransactionsToCsv(monthTransactions, categories, wallets);
    downloadCsv(csvStr, `laporan_${reportMonth}.csv`);
    addToast('Laporan CSV berhasil diunduh', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Print Trigger */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Laporan Keuangan & Kalkulator Finansial
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor laporan formal, pantau heatmap belanja, dan simulasikan dana masa depan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pilih Bulan Laporan */}
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="allow-print-btn flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF / Print</span>
          </button>
        </div>
      </div>

      {/* SECTION LAPORAN UTAMA: CETAK & RINGKASAN RESMI */}
      <div className="card-print bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ikhtisar Arus Kas: {formatTanggal(`${reportMonth}-01`, 'month_year')}
            </h3>
            <span className="text-xs text-slate-400">
              Dokumen Laporan Keuangan Pribadi · Noven Wallet
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Rata-rata Pengeluaran Harian</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatRupiah(dailyAverageExpense, settings.isPrivacyMode)} / hari
            </span>
          </div>
        </div>

        {/* 3 Angka Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Pemasukan</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              {formatRupiah(monthCashflow.income, settings.isPrivacyMode)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Pengeluaran</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
              {formatRupiah(monthCashflow.expense, settings.isPrivacyMode)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Surplus / Arus Kas Bersih</span>
            <div
              className={`text-xl font-bold tabular-nums mt-1 ${
                monthCashflow.netCashflow >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-rose-600'
              }`}
            >
              {formatRupiah(monthCashflow.netCashflow, settings.isPrivacyMode)}
            </div>
          </div>
        </div>

        {/* HEATMAP KALENDER PENGELUARAN HARIAN */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Heatmap Intensitas Belanja Harian ({daysInMonth} Hari)
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Hemat</span>
              <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
              <span className="w-3 h-3 rounded bg-teal-200 dark:bg-teal-900" />
              <span className="w-3 h-3 rounded bg-teal-400 dark:bg-teal-700" />
              <span className="w-3 h-3 rounded bg-teal-700 dark:bg-teal-500" />
              <span>Tinggi</span>
            </div>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1.5">
            {Array.from({ length: daysInMonth }, (_, idx) => idx + 1).map((day) => {
              const spent = dailySpendingHeatmap.days[day] || 0;
              const ratio = dailySpendingHeatmap.maxSpend > 0 ? spent / dailySpendingHeatmap.maxSpend : 0;

              let heatBg = 'bg-slate-100 dark:bg-slate-800/60 text-slate-500';
              if (spent > 0) {
                if (ratio > 0.6) heatBg = 'bg-teal-700 text-white font-bold';
                else if (ratio > 0.3) heatBg = 'bg-teal-500 text-white font-semibold';
                else if (ratio > 0.1) heatBg = 'bg-teal-300 dark:bg-teal-800 text-teal-900 dark:text-teal-100';
                else heatBg = 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300';
              }

              return (
                <div
                  key={day}
                  title={`Tgl ${day}: ${formatRupiah(spent)}`}
                  className={`p-2 rounded-xl text-center text-xs transition-colors ${heatBg}`}
                >
                  <span className="block text-[11px]">{day}</span>
                  <span className="block text-[9px] truncate opacity-90">
                    {spent > 0 ? formatRupiahShort(spent) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PROYEKSI ARUS KAS 6 BULAN KE DEPAN */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Proyeksi Arus Kas 6 Bulan ke Depan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimasi berdasarkan komitmen pendapatan rutin & rata-rata pengeluaran historis
          </p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => formatRupiahShort(val)}
              />
              <Tooltip
                formatter={(val: any) => formatRupiah(Number(val))}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="proyeksiPemasukan" name="Proyeksi Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="proyeksiPengeluaran" name="Proyeksi Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimasiTabungan" name="Potensi Tabungan" fill="#0F766E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 KALKULATOR FINANSIAL INTERAKTIF */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Kalkulator & Simulator Perencanaan Finansial
          </h3>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCalcTab('emergency')}
            className={`py-2 px-3 rounded-xl transition-colors ${
              calcTab === 'emergency'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            1. Dana Darurat
          </button>
          <button
            type="button"
            onClick={() => setCalcTab('retirement')}
            className={`py-2 px-3 rounded-xl transition-colors ${
              calcTab === 'retirement'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            2. Dana Pensiun (4%)
          </button>
          <button
            type="button"
            onClick={() => setCalcTab('compound')}
            className={`py-2 px-3 rounded-xl transition-colors ${
              calcTab === 'compound'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            3. Bunga Majemuk
          </button>
          <button
            type="button"
            onClick={() => setCalcTab('mortgage')}
            className={`py-2 px-3 rounded-xl transition-colors ${
              calcTab === 'mortgage'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            4. Simulasi KPR
          </button>
        </div>

        {/* KALKULATOR 1: DANA DARURAT */}
        {calcTab === 'emergency' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Rata-rata Pengeluaran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={calcExpenseMonth}
                  onChange={(e) => setCalcExpenseMonth(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Status Pernikahan & Tanggungan</label>
                <select
                  value={calcDependents}
                  onChange={(e) => setCalcDependents(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="single">Lajang (Rekomendasi: 3 - 6 Bulan Pengeluaran)</option>
                  <option value="married">Menikah tanpa anak (Rekomendasi: 6 - 9 Bulan)</option>
                  <option value="kids">Menikah dengan anak / Freelance (Rekomendasi: 9 - 12 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-teal-800 dark:text-teal-300 uppercase font-semibold">
                  Rekomendasi Besaran Dana Darurat
                </span>
                <div className="text-2xl font-bold text-teal-950 dark:text-teal-100 tabular-nums mt-1">
                  {formatRupiah(
                    (parseFloat(calcExpenseMonth) || 0) * (calcDependents === 'single' ? 6 : calcDependents === 'married' ? 9 : 12)
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-2">
                  {calcDependents === 'single'
                    ? 'Sebagai lajang, cadangan 6 bulan pengeluaran memberi rasa tenang bila terjadi pergantian karir.'
                    : calcDependents === 'married'
                    ? 'Bagi keluarga muda, 9 bulan menutup risiko kesehatan darurat atau biaya rumah tangga tak terduga.'
                    : 'Untuk keluarga dengan tanggungan, 12 bulan adalah standar emas perlindungan keluarga maksimal.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KALKULATOR 2: DANA PENSIUN (RULE OF 25) */}
        {calcTab === 'retirement' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Target Pengeluaran Bulanan Saat Pensiun (Rp)</label>
                <input
                  type="number"
                  value={calcRetireExpense}
                  onChange={(e) => setCalcRetireExpense(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Usia Saat Ini</label>
                  <input
                    type="number"
                    value={calcCurrentAge}
                    onChange={(e) => setCalcCurrentAge(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Target Usia Pensiun</label>
                  <input
                    type="number"
                    value={calcRetireAge}
                    onChange={(e) => setCalcRetireAge(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-indigo-800 dark:text-indigo-300 uppercase font-semibold">
                  Target Nilai Portofolio Pensiun (4% Rule)
                </span>
                <div className="text-2xl font-bold text-indigo-950 dark:text-indigo-100 tabular-nums mt-1">
                  {formatRupiah((parseFloat(calcRetireExpense) || 0) * 12 * 25)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-2 leading-relaxed">
                  Berdasarkan Trinity Study (Rule of 25), jika Anda mengumpulkan 25x pengeluaran tahunan dan melakukan penarikan 4% per tahun, modal pokok Anda diproyeksikan bertahan tanpa pernah habis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KALKULATOR 3: BUNGA MAJEMUK */}
        {calcTab === 'compound' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium mb-1">Modal Awal (Rp)</label>
                <input
                  type="number"
                  value={ciInitial}
                  onChange={(e) => setCiInitial(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Setoran Rutin / Bulan (Rp)</label>
                <input
                  type="number"
                  value={ciMonthly}
                  onChange={(e) => setCiMonthly(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Imbal Hasil Tahunan (% p.a)</label>
                <input
                  type="number"
                  step="0.5"
                  value={ciRate}
                  onChange={(e) => setCiRate(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Jangka Waktu (Tahun)</label>
                <input
                  type="number"
                  value={ciYears}
                  onChange={(e) => setCiYears(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Total Modal Disetor:</span>
                <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatRupiah(compoundResults.totalDeposited)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Total Bunga / Keuntungan Majemuk:</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatRupiah(compoundResults.totalInterest)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Estimasi Saldo Akhir:</span>
                <p className="text-base font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                  {formatRupiah(compoundResults.finalBalance)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KALKULATOR 4: KPR */}
        {calcTab === 'mortgage' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium mb-1">Harga Properti (Rp)</label>
                <input
                  type="number"
                  value={kprHousePrice}
                  onChange={(e) => setKprHousePrice(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Uang Muka / DP (%)</label>
                <input
                  type="number"
                  value={kprDpPercent}
                  onChange={(e) => setKprDpPercent(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Suku Bunga KPR (% p.a)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kprRate}
                  onChange={(e) => setKprRate(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Tenor (Tahun)</label>
                <input
                  type="number"
                  value={kprTenorYears}
                  onChange={(e) => setKprTenorYears(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Estimasi DP + Pokok KPR:</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  DP {formatRupiah(kprResults.dpNominal)} · Pinjaman {formatRupiah(kprResults.loanPrincipal)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Perkiraan Angsuran Bulanan:</span>
                <p className="text-lg font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                  {formatRupiah(kprResults.monthlyPayment)} / bln
                </p>
              </div>
              <div>
                <span className="text-slate-400">Total Bunga Selama Tenor:</span>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatRupiah(kprResults.totalInterest)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
