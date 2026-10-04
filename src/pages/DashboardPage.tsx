import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  WalletCards,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  CreditCard,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { StatCard } from '../components/common/StatCard';
import {
  calculateNetWorth,
  calculateCashflow,
  calculateFinancialHealth,
  filterTransactionsByDate,
  calculatePercentageDiff,
} from '../lib/financialMath';
import {
  formatRupiah,
  formatRupiahShort,
  formatTanggal,
  getDateRange,
} from '../lib/formatters';
import { DateFilterType } from '../types/finance';
import { useToastStore } from '../components/common/Toast';

export const DashboardPage: React.FC = () => {
  const {
    wallets,
    categories,
    transactions,
    budgets,
    goals,
    debts,
    assets,
    bills,
    settings,
    activePeriod,
    setActivePeriod,
    customDateRange,
    markBillPaid,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Custom date picker state
  const [customStart, setCustomStart] = useState(customDateRange.startDate);
  const [customEnd, setCustomEnd] = useState(customDateRange.endDate);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // 1. Dapatkan rentang tanggal aktif
  const currentRange = useMemo(() => {
    if (activePeriod === 'custom') {
      return {
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
        label: 'Rentang Kustom',
      };
    }
    return getDateRange(activePeriod, settings.startDayOfMonth);
  }, [activePeriod, customDateRange, settings.startDayOfMonth]);

  // 2. Dapatkan rentang tanggal periode sebelumnya untuk komparasi persentase
  const previousRange = useMemo(() => {
    const start = new Date(currentRange.startDate);
    const end = new Date(currentRange.endDate);
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff + 1);

    const toIso = (d: Date) => d.toISOString().split('T')[0];
    return {
      startDate: toIso(prevStart),
      endDate: toIso(prevEnd),
    };
  }, [currentRange]);

  // 3. Filter transaksi periode aktif & sebelumnya
  const currentTxs = useMemo(
    () => filterTransactionsByDate(transactions, currentRange.startDate, currentRange.endDate),
    [transactions, currentRange]
  );

  const prevTxs = useMemo(
    () => filterTransactionsByDate(transactions, previousRange.startDate, previousRange.endDate),
    [transactions, previousRange]
  );

  // 4. Hitung Metrik Finansial
  const currentCashflow = useMemo(() => calculateCashflow(currentTxs), [currentTxs]);
  const prevCashflow = useMemo(() => calculateCashflow(prevTxs), [prevTxs]);

  const incomeDiff = calculatePercentageDiff(currentCashflow.income, prevCashflow.income);
  const expenseDiff = calculatePercentageDiff(currentCashflow.expense, prevCashflow.expense);
  const netDiff = calculatePercentageDiff(currentCashflow.netCashflow, prevCashflow.netCashflow);
  const savingsRateDiff = calculatePercentageDiff(currentCashflow.savingsRate, prevCashflow.savingsRate);

  const netWorthData = useMemo(() => calculateNetWorth(wallets, assets, debts), [wallets, assets, debts]);

  // Total saldo likuid dompet
  const totalWalletBalance = useMemo(
    () => wallets.filter(w => !w.isExcludedFromTotal).reduce((sum, w) => sum + (w.type === 'credit_card' ? 0 : w.balance), 0),
    [wallets]
  );

  // 5. Skor Kesehatan Keuangan
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const healthScore = useMemo(
    () =>
      calculateFinancialHealth({
        wallets,
        debts,
        transactions,
        budgets,
        currentMonth: currentMonthStr,
      }),
    [wallets, debts, transactions, budgets, currentMonthStr]
  );

  // 6. Data Grafik:
  // (a) Pemasukan vs Pengeluaran 6 Bulan Terakhir
  const monthlyCashflowChartData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();

    // Buat 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = formatTanggal(`${key}-01`, 'month_year');
      months[key] = { month: label, income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const monthKey = t.date.slice(0, 7);
      if (months[monthKey]) {
        if (t.type === 'income') {
          months[monthKey].income += t.amount;
        } else if (t.type === 'expense') {
          months[monthKey].expense += t.amount;
        }
      }
    }

    return Object.values(months);
  }, [transactions]);

  // (b) Donat Pengeluaran per Kategori
  const categoryExpenses = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};

    for (const t of currentTxs) {
      if (t.type === 'expense') {
        if (t.splits && t.splits.length > 0) {
          for (const s of t.splits) {
            const cat = categories.find((c) => c.id === s.categoryId);
            const name = cat ? cat.name : 'Lainnya';
            const color = cat ? cat.color : '#94A3B8';
            if (!map[name]) map[name] = { name, value: 0, color };
            map[name].value += s.amount;
          }
        } else {
          const cat = categories.find((c) => c.id === t.categoryId);
          const name = cat ? cat.name : 'Lainnya';
          const color = cat ? cat.color : '#94A3B8';
          if (!map[name]) map[name] = { name, value: 0, color };
          map[name].value += t.amount;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [currentTxs, categories]);

  // (c) 5 Kategori Terboros
  const top5Expenses = useMemo(() => {
    return categoryExpenses.slice(0, 5);
  }, [categoryExpenses]);

  // (d) Pengeluaran Harian dalam rentang periode (atau 14 hari terakhir)
  const dailyExpensesChartData = useMemo(() => {
    const daysMap: Record<string, number> = {};
    const dList = [];

    // Ambil maksimal 14 hari terakhir dari rentang aktif
    const end = new Date(currentRange.endDate);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      daysMap[iso] = 0;
      dList.push({ date: iso, label: formatTanggal(iso, 'day_month'), amount: 0 });
    }

    for (const t of currentTxs) {
      if (t.type === 'expense' && daysMap[t.date] !== undefined) {
        daysMap[t.date] += t.amount;
      }
    }

    return dList.map((item) => ({
      ...item,
      amount: daysMap[item.date] || 0,
    }));
  }, [currentRange, currentTxs]);

  // (e) Tren Net Worth 12 Bulan (Simulasi berdasarkan saldo awal + akumulasi arus kas bulanan)
  const netWorthTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    let rollingNetWorth = netWorthData.netWorth;

    // Mundur dari bulan ini
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = formatTanggal(`${key}-01`, 'month_year');

      // Ambil net cashflow bulan tersebut
      const monthTxs = transactions.filter((t) => t.date.startsWith(key));
      const cf = calculateCashflow(monthTxs);

      data.unshift({
        month: label,
        netWorth: Math.max(0, rollingNetWorth),
      });

      // Kurangi arus kas bulan tersebut untuk menghitung bulan sebelumnya
      rollingNetWorth -= cf.netCashflow;
    }

    return data;
  }, [netWorthData, transactions]);

  // 7. Tagihan Jatuh Tempo dalam 7 Hari ke Depan
  const upcomingBills = useMemo(() => {
    const today = new Date().getDate();
    const currentMonth = new Date().toISOString().slice(0, 7);

    return bills
      .filter((b) => {
        const isPaid = b.paidMonths.includes(currentMonth);
        const dayDiff = b.dueDateDay - today;
        return !isPaid && dayDiff >= -2 && dayDiff <= 7;
      })
      .sort((a, b) => a.dueDateDay - b.dueDateDay);
  }, [bills]);

  // 8. Transaksi Terbaru (5 teratas)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [transactions]);

  // Handle Quick Pay Tagihan
  const handleQuickPayBill = (billId: string) => {
    markBillPaid(billId, currentMonthStr);
    addToast('Tagihan berhasil ditandai lunas & dicatat', 'success');
  };

  const handleApplyCustomDate = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      setActivePeriod('custom', { startDate: customStart, endDate: customEnd });
      setShowCustomModal(false);
    } else {
      addToast('Rentang tanggal tidak valid', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Filter Bar for Mobile / Quick Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {currentRange.label}:
          </span>
          <span className="tabular-nums">
            {formatTanggal(currentRange.startDate, 'short')} – {formatTanggal(currentRange.endDate, 'short')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              ['this_month', 'Bulan Ini'],
              ['last_month', 'Bulan Lalu'],
              ['last_3_months', '3 Bulan'],
              ['this_year', 'Tahun Ini'],
            ] as [DateFilterType, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActivePeriod(key)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap ${
                activePeriod === key
                  ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomModal(!showCustomModal)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap ${
              activePeriod === 'custom'
                ? 'bg-teal-700 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Kustom
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown */}
      {showCustomModal && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 shadow-sm animate-in fade-in">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleApplyCustomDate}
              className="px-4 py-1.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-xs"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 6 KARTU KPI UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Saldo Kas"
          value={formatRupiah(totalWalletBalance, settings.isPrivacyMode)}
          subtitle={`${wallets.length} dompet aktif`}
          icon={<WalletCards className="w-5 h-5" />}
        />
        <StatCard
          title="Pemasukan"
          value={formatRupiah(currentCashflow.income, settings.isPrivacyMode)}
          trend={{
            percentage: incomeDiff.percentage,
            trend: incomeDiff.trend,
            isGoodWhenUp: true,
          }}
          icon={<ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <StatCard
          title="Pengeluaran"
          value={formatRupiah(currentCashflow.expense, settings.isPrivacyMode)}
          trend={{
            percentage: expenseDiff.percentage,
            trend: expenseDiff.trend,
            isGoodWhenUp: false,
          }}
          icon={<ArrowDownCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />
        <StatCard
          title="Arus Kas Bersih"
          value={formatRupiah(currentCashflow.netCashflow, settings.isPrivacyMode)}
          trend={{
            percentage: netDiff.percentage,
            trend: netDiff.trend,
            isGoodWhenUp: true,
          }}
          icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
        />
        <StatCard
          title="Tingkat Tabungan"
          value={`${currentCashflow.savingsRate.toFixed(1)}%`}
          trend={{
            percentage: savingsRateDiff.percentage,
            trend: savingsRateDiff.trend,
            isGoodWhenUp: true,
          }}
          subtitle={currentCashflow.savingsRate >= 20 ? 'Sesuai target' : 'Di bawah 20%'}
          icon={<Target className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          title="Kekayaan Bersih"
          value={formatRupiahShort(netWorthData.netWorth, settings.isPrivacyMode)}
          subtitle={`Aset ${formatRupiahShort(netWorthData.totalAssets)} - Utang ${formatRupiahShort(netWorthData.totalDebts)}`}
          icon={<ShieldCheck className="w-5 h-5 text-teal-700" />}
          variant="primary"
        />
      </div>

      {/* SKOR KESEHATAN KEUANGAN BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                  {healthScore.totalScore}
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">/ 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Skor Kesehatan Keuangan: {healthScore.level}
                </h3>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Analisis Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {healthScore.summary}
              </p>
            </div>
          </div>

          {/* 4 Pilar Metrik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Porsi Tabungan</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                {healthScore.savingsRatePercent}%
              </p>
              <span className="text-[10px] text-slate-400">Skor: {healthScore.savingsRateScore}/25</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Dana Darurat</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                {healthScore.emergencyFundMonths} bln
              </p>
              <span className="text-[10px] text-slate-400">Skor: {healthScore.emergencyFundScore}/25</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Rasio Utang (DTI)</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                {healthScore.dtiPercent}%
              </p>
              <span className="text-[10px] text-slate-400">Skor: {healthScore.dtiScore}/25</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Kepatuhan Anggaran</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                {healthScore.budgetAdherencePercent}%
              </p>
              <span className="text-[10px] text-slate-400">Skor: {healthScore.budgetAdherenceScore}/25</span>
            </div>
          </div>
        </div>

        {/* Saran Tindakan */}
        {healthScore.recommendations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Saran Perbaikan Finansial:
            </span>
            <ul className="mt-1.5 space-y-1">
              {healthScore.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-teal-600 dark:text-teal-400 mt-0.5">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* GRAFIK UTAMA: (A) Arus Kas 6 Bulan & (B) Donat Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* (A) Arus Kas Bulanan (Pemasukan vs Pengeluaran) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tren Arus Kas (Pemasukan vs Pengeluaran)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat perbandingan arus kas selama 6 bulan terakhir
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Pengeluaran
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCashflowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Pengeluaran"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* (B) Donat Komposisi Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Pengeluaran per Kategori
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi pos belanja periode ini
            </p>
          </div>

          {categoryExpenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 py-10">
              Belum ada transaksi pengeluaran
            </div>
          ) : (
            <>
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
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
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {categoryExpenses.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0 ml-2">
                      {formatRupiah(cat.value, settings.isPrivacyMode)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* GRAFIK SEKUNDER: (C) Bar Pengeluaran Harian & (D) Tren Net Worth & (E) 5 Terboros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* (C) Bar Pengeluaran Harian 14 Hari */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Pengeluaran 14 Hari Terakhir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pola lonjakan pengeluaran harian
            </p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpensesChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
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
                <Bar dataKey="amount" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* (D) Tren Net Worth 12 Bulan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tren Kekayaan Bersih 12 Bulan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pertumbuhan nilai aset dikurangi sisa utang
            </p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
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
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Net Worth"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#nwGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* (E) 5 Kategori Terboros */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              5 Kategori Terboros
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pos alokasi pengeluaran terbesar periode ini
            </p>

            <div className="mt-4 space-y-3">
              {top5Expenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pengeluaran</p>
              ) : (
                top5Expenses.map((cat, i) => {
                  const maxExpense = top5Expenses[0]?.value || 1;
                  const pct = Math.round((cat.value / maxExpense) * 100);
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {i + 1}. {cat.name}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatRupiah(cat.value, settings.isPrivacyMode)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            to="/budget"
            className="mt-4 inline-flex items-center justify-between text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <span>Sesuaikan Anggaran Pengeluaran</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* PANEL-PANEL PENDUKUNG: Transaksi Terbaru, Tagihan Jatuh Tempo, Progres Anggaran & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Tagihan Jatuh Tempo 7 Hari ke Depan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tagihan Jatuh Tempo 7 Hari ke Depan
              </h3>
            </div>
            <Link
              to="/bills"
              className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
            >
              Lihat Semua ({bills.length})
            </Link>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              Semua tagihan terdekat telah lunas atau belum ada tagihan mendesak!
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBills.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {b.title}
                    </h4>
                    <span className="text-slate-500 dark:text-slate-400">
                      Jatuh tempo tgl {b.dueDateDay} bulan ini · {formatRupiah(b.amount, settings.isPrivacyMode)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickPayBill(b.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/60 dark:hover:bg-teal-900 rounded-lg transition-colors"
                  >
                    Bayar Sekarang
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Transaksi Terbaru */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transaksi Terkini
            </h3>
            <Link
              to="/transactions"
              className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
            >
              Lihat Riwayat ({transactions.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const cat = categories.find((c) => c.id === tx.categoryId);

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 text-white"
                      style={{ backgroundColor: cat ? cat.color : '#0F766E' }}
                    >
                      {cat ? cat.name.charAt(0) : 'T'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                        {tx.payee || cat?.name || 'Transaksi'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>{formatTanggal(tx.date, 'short')}</span>
                        {tx.subcategory && (
                          <>
                            <span>·</span>
                            <span>{tx.subcategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-semibold tabular-nums ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isExpense
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-teal-600'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatRupiah(tx.amount, settings.isPrivacyMode)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progres Tujuan Tabungan & Anggaran Bulan Ini Ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progres Tujuan Tabungan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Progres Tujuan Tabungan
            </h3>
            <Link
              to="/goals"
              className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
            >
              Kelola Goals
            </Link>
          </div>

          <div className="space-y-3.5">
            {goals.slice(0, 3).map((g) => {
              const progressPct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {g.name}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {formatRupiah(g.currentAmount, settings.isPrivacyMode)} / {formatRupiah(g.targetAmount, settings.isPrivacyMode)} ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: g.color || '#0F766E',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Beban Utang & Cicilan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ringkasan Kewajiban Cicilan
            </h3>
            <Link
              to="/debts"
              className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
            >
              Simulasi Pelunasan
            </Link>
          </div>

          <div className="space-y-3">
            {debts
              .filter((d) => d.type === 'debt' && d.status === 'active')
              .slice(0, 3)
              .map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {d.title} ({d.lenderOrBorrower})
                    </h4>
                    <span className="text-slate-400 text-[11px]">
                      Cicilan: {formatRupiah(d.monthlyPayment, settings.isPrivacyMode)}/bln · Tgl {d.dueDateDay}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Sisa Pokok</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatRupiah(d.remainingPrincipal, settings.isPrivacyMode)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
