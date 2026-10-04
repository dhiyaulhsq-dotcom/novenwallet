import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  LogOut,
  User,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { DateFilterType } from '../../types/finance';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard Utama',
  '/transactions': 'Daftar Transaksi',
  '/wallets': 'Dompet & Rekening',
  '/budget': 'Anggaran Bulanan',
  '/goals': 'Tujuan Tabungan',
  '/debts': 'Utang & Cicilan',
  '/investments': 'Portofolio Investasi',
  '/bills': 'Tagihan & Langganan',
  '/reports': 'Laporan & Analisis',
  '/settings': 'Pengaturan Aplikasi',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'Noven Wallet';

  const {
    settings,
    updateSettings,
    activePeriod,
    setActivePeriod,
    bills,
    setLogoutModalOpen,
    firebaseUser,
    isCloudSyncing,
  } = useFinanceStore();

  const togglePrivacy = () => {
    updateSettings({ isPrivacyMode: !settings.isPrivacyMode });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Hitung tagihan belum bayar bulan ini
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const unpaidBillsCount = bills.filter(
    (b) => !b.paidMonths.includes(currentMonthStr)
  ).length;

  return (
    <header className="no-print h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Zone 1: Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {pageTitle}
        </h2>
      </div>

      {/* Zone 2: Filter Periode (Khusus Dashboard / Transaksi / Laporan) */}
      {(location.pathname === '/' || location.pathname === '/transactions' || location.pathname === '/reports') && (
        <div className="hidden sm:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
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
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activePeriod === key
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Zone 3: Quick Action Icons */}
      <div className="flex items-center gap-2">
        {/* Unpaid bills reminder */}
        {unpaidBillsCount > 0 && (
          <div
            title={`${unpaidBillsCount} tagihan belum dibayar bulan ini`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">{unpaidBillsCount} Tagihan</span>
            <span className="sm:hidden">{unpaidBillsCount}</span>
          </div>
        )}

        {/* Privacy Mode Toggle */}
        <button
          type="button"
          onClick={togglePrivacy}
          aria-label={settings.isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={settings.isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
        >
          {settings.isPrivacyMode ? (
            <EyeOff className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ubah Tema"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Ubah Mode Gelap/Terang"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User indicator & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          {firebaseUser ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName || 'Pengguna'}
                    className="w-7 h-7 rounded-xl object-cover border border-teal-500/50 shadow-xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs font-bold font-mono">
                    {(firebaseUser.displayName || firebaseUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                    isCloudSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-500'
                  }`}
                  title={isCloudSyncing ? 'Menyinkronkan cloud...' : 'Tersambung real-time'}
                />
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px] leading-tight">
                  {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight flex items-center gap-1">
                  <span>Cloud Sync</span>
                </span>
              </div>
            </div>
          ) : (
            <span className="hidden md:inline-block text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono truncate max-w-[100px]">
              {settings.authUsername || 'admin'}
            </span>
          )}

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            aria-label="Keluar dari akun"
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Keluar dari Akun (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
