export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export const DAY_NAMES_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format number to Indonesian Rupiah standard format
 * e.g. formatRupiah(1500000) => "Rp 1.500.000"
 */
export function formatRupiah(value: number, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return 'Rp ••••••';
  }
  
  const isNegative = value < 0;
  const absValue = Math.round(Math.abs(value));
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absValue);

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format number to compact Indonesian Rupiah format
 * e.g. 1500000 => "Rp 1,5 jt"
 */
export function formatRupiahShort(value: number, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return 'Rp •••';
  }

  const isNegative = value < 0;
  const abs = Math.abs(value);
  let formatted = '';

  if (abs >= 1_000_000_000) {
    formatted = `${(abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  } else if (abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  } else if (abs >= 1_000) {
    formatted = `${(abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  } else {
    formatted = `${abs.toLocaleString('id-ID')}`;
  }

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format ISO or YYYY-MM-DD date string to Indonesian formatted text
 */
export function formatTanggal(
  dateInput: string | Date,
  format: 'short' | 'medium' | 'long' | 'day_month' | 'month_year' | 'iso_date' = 'medium'
): string {
  if (!dateInput) return '-';
  
  let date: Date;
  if (typeof dateInput === 'string') {
    // If format is YYYY-MM-DD, parse year, month, day to avoid timezone skew
    const parts = dateInput.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const dayName = DAY_NAMES_ID[date.getDay()];
  const monthName = MONTH_NAMES_ID[date.getMonth()];
  const monthNameShort = MONTH_NAMES_SHORT_ID[date.getMonth()];
  const year = date.getFullYear();

  switch (format) {
    case 'short':
      return `${day} ${monthNameShort} ${year}`;
    case 'medium':
      return `${day} ${monthName} ${year}`;
    case 'long':
      return `${dayName}, ${day} ${monthName} ${year}`;
    case 'day_month':
      return `${day} ${monthNameShort}`;
    case 'month_year':
      return `${monthName} ${year}`;
    case 'iso_date':
      return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    default:
      return `${day} ${monthName} ${year}`;
  }
}

/**
 * Get standard Date Filter range based on option and optional anchor date
 */
export function getDateRange(
  filterType: 'this_month' | 'last_month' | 'last_3_months' | 'this_year',
  startDayOfMonth: number = 1,
  nowDate: Date = new Date()
): { startDate: string; endDate: string; label: string } {
  const currentYear = nowDate.getFullYear();
  const currentMonth = nowDate.getMonth(); // 0-indexed
  const currentDay = nowDate.getDate();

  const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (filterType === 'this_month') {
    let startD: Date;
    let endD: Date;
    if (startDayOfMonth === 1) {
      startD = new Date(currentYear, currentMonth, 1);
      endD = new Date(currentYear, currentMonth + 1, 0);
    } else {
      // If current day is before cutoff day, current billing cycle started in previous month
      if (currentDay < startDayOfMonth) {
        startD = new Date(currentYear, currentMonth - 1, startDayOfMonth);
        endD = new Date(currentYear, currentMonth, startDayOfMonth - 1);
      } else {
        startD = new Date(currentYear, currentMonth, startDayOfMonth);
        endD = new Date(currentYear, currentMonth + 1, startDayOfMonth - 1);
      }
    }
    return {
      startDate: toIso(startD),
      endDate: toIso(endD),
      label: 'Bulan Ini',
    };
  }

  if (filterType === 'last_month') {
    let startD: Date;
    let endD: Date;
    if (startDayOfMonth === 1) {
      startD = new Date(currentYear, currentMonth - 1, 1);
      endD = new Date(currentYear, currentMonth, 0);
    } else {
      if (currentDay < startDayOfMonth) {
        startD = new Date(currentYear, currentMonth - 2, startDayOfMonth);
        endD = new Date(currentYear, currentMonth - 1, startDayOfMonth - 1);
      } else {
        startD = new Date(currentYear, currentMonth - 1, startDayOfMonth);
        endD = new Date(currentYear, currentMonth, startDayOfMonth - 1);
      }
    }
    return {
      startDate: toIso(startD),
      endDate: toIso(endD),
      label: 'Bulan Lalu',
    };
  }

  if (filterType === 'last_3_months') {
    const endD = new Date(currentYear, currentMonth + 1, 0);
    const startD = new Date(currentYear, currentMonth - 2, 1);
    return {
      startDate: toIso(startD),
      endDate: toIso(endD),
      label: '3 Bulan Terakhir',
    };
  }

  // this_year
  const startD = new Date(currentYear, 0, 1);
  const endD = new Date(currentYear, 11, 31);
  return {
    startDate: toIso(startD),
    endDate: toIso(endD),
    label: `Tahun ${currentYear}`,
  };
}
