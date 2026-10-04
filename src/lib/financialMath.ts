import {
  Wallet,
  Transaction,
  Budget,
  Debt,
  Asset,
  FinancialHealthBreakdown,
} from '../types/finance';

/**
 * Calculate Net Worth:
 * Net Worth = (Total Saldo Dompet Aktif + Total Nilai Pasar Portofolio Investasi) - Total Sisa Pokok Utang
 */
export function calculateNetWorth(
  wallets: Wallet[],
  assets: Asset[],
  debts: Debt[]
): {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  walletAssets: number;
  investmentAssets: number;
} {
  // Saldo dompet (yang tidak dikecualikan dan bukan saldo negatif kartu kredit)
  const walletAssets = wallets
    .filter(w => !w.isExcludedFromTotal)
    .reduce((sum, w) => {
      // Jika kartu kredit dengan saldo terpakai (biasanya dicatat sebagai pengeluaran atau saldo negatif),
      // kita hitung hanya saldo aset riil (cash/bank/ewallet/invest)
      if (w.type === 'credit_card') {
        return sum; // Utang kartu kredit ditangani terpisah atau dihitung di pemakaian
      }
      return sum + Math.max(0, w.balance);
    }, 0);

  // Nilai pasar investasi
  const investmentAssets = assets.reduce(
    (sum, a) => sum + (a.unitCount * a.currentPrice),
    0
  );

  const totalAssets = walletAssets + investmentAssets;

  // Total utang aktif (hanya tipe 'debt', bukan 'receivable')
  const totalDebts = debts
    .filter(d => d.type === 'debt' && d.status === 'active')
    .reduce((sum, d) => sum + d.remainingPrincipal, 0);

  const netWorth = totalAssets - totalDebts;

  return {
    totalAssets,
    totalDebts,
    netWorth,
    walletAssets,
    investmentAssets,
  };
}

/**
 * Filter transactions within a date range [startDate, endDate] inclusive
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter(t => t.date >= startDate && t.date <= endDate);
}

/**
 * Calculate cashflow metrics for transactions
 */
export function calculateCashflow(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expense += t.amount;
    }
    // Transfer does not change net cashflow
  }

  const netCashflow = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  return {
    income,
    expense,
    netCashflow,
    savingsRate: Math.max(-100, Math.min(100, savingsRate)),
  };
}

/**
 * Calculate percentage difference between current and previous value
 */
export function calculatePercentageDiff(current: number, previous: number): {
  diff: number;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
} {
  const diff = current - previous;
  if (previous === 0) {
    if (current === 0) return { diff: 0, percentage: 0, trend: 'neutral' };
    return { diff, percentage: 100, trend: current > 0 ? 'up' : 'down' };
  }
  const percentage = (diff / Math.abs(previous)) * 100;
  return {
    diff,
    percentage,
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
  };
}

/**
 * Compute 0-100 Financial Health Score based on deterministic rules
 */
export function calculateFinancialHealth(params: {
  wallets: Wallet[];
  debts: Debt[];
  transactions: Transaction[]; // Transaksi 1-3 bulan terakhir
  budgets: Budget[];
  currentMonth: string; // YYYY-MM
}): FinancialHealthBreakdown {
  const { wallets, debts, transactions, budgets, currentMonth } = params;

  // 1. Hitung rata-rata pemasukan & pengeluaran bulanan
  const monthlyStats = calculateCashflow(transactions);
  const income = monthlyStats.income;
  const expense = monthlyStats.expense;

  // (a) Savings Rate Score (0 - 25)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  let savingsRateScore = 0;
  if (savingsRate >= 30) savingsRateScore = 25;
  else if (savingsRate >= 20) savingsRateScore = 22;
  else if (savingsRate >= 10) savingsRateScore = 16;
  else if (savingsRate >= 5) savingsRateScore = 10;
  else if (savingsRate > 0) savingsRateScore = 5;
  else savingsRateScore = 0;

  // (b) Emergency Fund Score (0 - 25)
  // Total dana likuid (tunai, bank, ewallet)
  const liquidCash = wallets
    .filter(w => !w.isExcludedFromTotal && (w.type === 'cash' || w.type === 'bank' || w.type === 'ewallet'))
    .reduce((sum, w) => sum + Math.max(0, w.balance), 0);

  const monthlyBurnRate = expense > 0 ? expense : 3000000; // Asumsi minimum pengeluaran
  const emergencyFundMonths = liquidCash / monthlyBurnRate;

  let emergencyFundScore = 0;
  if (emergencyFundMonths >= 6) emergencyFundScore = 25;
  else if (emergencyFundMonths >= 4) emergencyFundScore = 20;
  else if (emergencyFundMonths >= 3) emergencyFundScore = 16;
  else if (emergencyFundMonths >= 1) emergencyFundScore = 10;
  else emergencyFundScore = 4;

  // (c) Debt-to-Income (DTI) Score (0 - 25)
  const activeDebts = debts.filter(d => d.type === 'debt' && d.status === 'active');
  const monthlyDebtService = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const dti = income > 0 ? (monthlyDebtService / income) * 100 : 0;

  let dtiScore = 0;
  if (activeDebts.length === 0) dtiScore = 25;
  else if (dti <= 15) dtiScore = 25;
  else if (dti <= 25) dtiScore = 20;
  else if (dti <= 35) dtiScore = 15;
  else if (dti <= 50) dtiScore = 8;
  else dtiScore = 3;

  // (d) Budget Adherence Score (0 - 25)
  let budgetAdherencePercent = 100;
  let budgetAdherenceScore = 20;

  if (budgets.length > 0) {
    let adheredCount = 0;
    // Hitung pengeluaran per kategori bulan ini
    const currentMonthExpenses: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.date.startsWith(currentMonth)) {
        if (t.splits && t.splits.length > 0) {
          for (const s of t.splits) {
            currentMonthExpenses[s.categoryId] = (currentMonthExpenses[s.categoryId] || 0) + s.amount;
          }
        } else {
          currentMonthExpenses[t.categoryId] = (currentMonthExpenses[t.categoryId] || 0) + t.amount;
        }
      }
    }

    for (const b of budgets) {
      const spent = currentMonthExpenses[b.categoryId] || 0;
      const limit = b.monthlyLimit + (b.rolloverAmount || 0);
      if (spent <= limit) {
        adheredCount++;
      }
    }

    budgetAdherencePercent = Math.round((adheredCount / budgets.length) * 100);
    if (budgetAdherencePercent >= 90) budgetAdherenceScore = 25;
    else if (budgetAdherencePercent >= 75) budgetAdherenceScore = 20;
    else if (budgetAdherencePercent >= 50) budgetAdherenceScore = 12;
    else budgetAdherenceScore = 6;
  } else {
    // Jika belum buat anggaran, evaluasi apakah pengeluaran < pemasukan
    if (expense <= income * 0.8) budgetAdherenceScore = 20;
    else if (expense <= income) budgetAdherenceScore = 15;
    else budgetAdherenceScore = 5;
  }

  const totalScore = Math.min(100, Math.round(savingsRateScore + emergencyFundScore + dtiScore + budgetAdherenceScore));

  let level: FinancialHealthBreakdown['level'] = 'Cukup Baik';
  let summary = '';
  if (totalScore >= 85) {
    level = 'Sangat Sehat';
    summary = 'Kondisi finansial Anda sangat prima! Arus kas positif, dana darurat aman, dan rasio utang terkendali baik.';
  } else if (totalScore >= 70) {
    level = 'Sehat';
    summary = 'Kondisi keuangan Anda dalam keadaan sehat dengan fondasi yang solid. Pertahankan disiplin anggaran.';
  } else if (totalScore >= 50) {
    level = 'Cukup Baik';
    summary = 'Keuangan Anda stabil, namun ada beberapa pos yang perlu dioptimalkan seperti dana darurat atau porsi tabungan.';
  } else {
    level = 'Perlu Perhatian';
    summary = 'Perlu pembenahan pada arus kas atau beban cicilan bulanan agar keuangan Anda tidak rentan terhadap risiko tak terduga.';
  }

  const recommendations: string[] = [];
  if (savingsRate < 20) {
    recommendations.push('Tingkatkan porsi tabungan minimal 20% dari total pendapatan bulanan dengan metode auto-debet.');
  }
  if (emergencyFundMonths < 6) {
    recommendations.push(`Dana darurat Anda saat ini mencukupi ~${emergencyFundMonths.toFixed(1)} bulan. Targetkan minimal 6 bulan pengeluaran.`);
  }
  if (dti > 30) {
    recommendations.push(`Rasio cicilan utang (${dti.toFixed(0)}%) melebihi batas aman 30%. Prioritaskan percepatan pelunasan utang berbunga tinggi.`);
  }
  if (budgetAdherencePercent < 80 && budgets.length > 0) {
    recommendations.push('Kepatuhan anggaran masih di bawah 80%. Tinjau pos pengeluaran gaya hidup atau sesuaikan pagu anggaran.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Semua metrik kesehatan finansial Anda hijau. Anda siap melipatgandakan portofolio investasi produktif!');
  }

  return {
    savingsRateScore,
    emergencyFundScore,
    dtiScore,
    budgetAdherenceScore,
    totalScore,
    savingsRatePercent: Math.round(savingsRate),
    emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    dtiPercent: Math.round(dti),
    budgetAdherencePercent,
    level,
    summary,
    recommendations,
  };
}

/**
 * Generate Loan Amortization Schedule (Anuitas)
 */
export function generateAmortizationSchedule(params: {
  principal: number;
  annualInterestRate: number; // e.g. 9 for 9%
  tenorMonths: number;
}) {
  const { principal, annualInterestRate, tenorMonths } = params;
  if (principal <= 0 || tenorMonths <= 0) return [];

  const monthlyRate = (annualInterestRate / 100) / 12;
  
  // Monthly payment formula for annuity: P * r * (1+r)^n / ((1+r)^n - 1)
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / tenorMonths;
  } else {
    monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
  }

  const schedule = [];
  let remainingBalance = principal;

  for (let month = 1; month <= tenorMonths; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(remainingBalance, monthlyPayment - interestPayment);
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    schedule.push({
      month,
      installment: Math.round(principalPayment + interestPayment),
      principalPayment: Math.round(principalPayment),
      interestPayment: Math.round(interestPayment),
      remainingBalance: Math.round(remainingBalance),
    });

    if (remainingBalance <= 0) break;
  }

  return schedule;
}

/**
 * Snowball vs Avalanche Debt Payoff Simulator
 * - Snowball: prioritizes smallest balance first
 * - Avalanche: prioritizes highest interest rate first
 */
export function simulateDebtPayoff(
  debts: Debt[],
  extraMonthlyPayment: number
) {
  const activeDebts = debts.filter(d => d.type === 'debt' && d.status === 'active' && d.remainingPrincipal > 0);
  if (activeDebts.length === 0) {
    return {
      snowballMonths: 0,
      avalancheMonths: 0,
      snowballTotalInterest: 0,
      avalancheTotalInterest: 0,
      interestSaved: 0,
      fasterMonths: 0,
    };
  }

  // Simulation runner
  const runSimulation = (strategy: 'snowball' | 'avalanche') => {
    // Clone debts
    const simDebts = activeDebts.map(d => ({
      id: d.id,
      title: d.title,
      balance: d.remainingPrincipal,
      rate: d.interestRateYearly / 100 / 12,
      minPayment: d.monthlyPayment,
    }));

    let month = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years cap to prevent infinite loop

    while (simDebts.some(d => d.balance > 0) && month < maxMonths) {
      month++;
      let extra = extraMonthlyPayment;

      // 1. Accrue monthly interest on each active debt
      for (const d of simDebts) {
        if (d.balance > 0) {
          const interest = d.balance * d.rate;
          totalInterest += interest;
          d.balance += interest;
        }
      }

      // 2. Pay minimums
      for (const d of simDebts) {
        if (d.balance > 0) {
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
        }
      }

      // 3. Apply extra payment based on strategy order
      const remainingDebts = simDebts.filter(d => d.balance > 0);
      if (strategy === 'snowball') {
        // Smallest balance first
        remainingDebts.sort((a, b) => a.balance - b.balance);
      } else {
        // Highest interest rate first
        remainingDebts.sort((a, b) => b.rate - a.rate);
      }

      for (const target of remainingDebts) {
        if (extra <= 0) break;
        const extraPay = Math.min(target.balance, extra);
        target.balance -= extraPay;
        extra -= extraPay;
      }
    }

    return { months: month, totalInterest: Math.round(totalInterest) };
  };

  const snowball = runSimulation('snowball');
  const avalanche = runSimulation('avalanche');

  return {
    snowballMonths: snowball.months,
    avalancheMonths: avalanche.months,
    snowballTotalInterest: snowball.totalInterest,
    avalancheTotalInterest: avalanche.totalInterest,
    interestSaved: Math.max(0, snowball.totalInterest - avalanche.totalInterest),
    fasterMonths: Math.max(0, snowball.months - avalanche.months),
  };
}

/**
 * Compound Interest Calculator
 */
export function calculateCompoundInterest(params: {
  initialAmount: number;
  monthlyDeposit: number;
  annualRatePercent: number;
  years: number;
}) {
  const { initialAmount, monthlyDeposit, annualRatePercent, years } = params;
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = years * 12;

  let currentBalance = initialAmount;
  let totalDeposited = initialAmount;

  const yearlyData = [];

  for (let m = 1; m <= totalMonths; m++) {
    currentBalance += currentBalance * monthlyRate;
    currentBalance += monthlyDeposit;
    totalDeposited += monthlyDeposit;

    if (m % 12 === 0 || m === totalMonths) {
      yearlyData.push({
        year: Math.ceil(m / 12),
        totalBalance: Math.round(currentBalance),
        totalDeposited: Math.round(totalDeposited),
        totalInterest: Math.round(currentBalance - totalDeposited),
      });
    }
  }

  return {
    finalBalance: Math.round(currentBalance),
    totalDeposited: Math.round(totalDeposited),
    totalInterest: Math.round(currentBalance - totalDeposited),
    yearlyData,
  };
}
