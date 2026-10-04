import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  PieChart,
  Target,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  BarChart3,
  Settings,
  Plus,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Lock,
  LogOut,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateNetWorth } from '../../lib/financialMath';
import { formatRupiah } from '../../lib/formatters';

interface SidebarProps {
  onOpenQuickAdd: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickAdd }) => {
  const {
    wallets,
    assets,
    debts,
    settings,
    updateSettings,
    setLock,
    setLogoutModalOpen,
  } = useFinanceStore();

  const netWorthData = calculateNetWorth(wallets, assets, debts);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { to: '/wallets', label: 'Dompet & Rekening', icon: WalletCards },
    { to: '/budget', label: 'Anggaran', icon: PieChart },
    { to: '/goals', label: 'Tujuan Tabungan', icon: Target },
    { to: '/debts', label: 'Utang & Cicilan', icon: FileSpreadsheet },
    { to: '/investments', label: 'Investasi & Aset', icon: TrendingUp },
    { to: '/bills', label: 'Tagihan & Langganan', icon: Receipt },
    { to: '/reports', label: 'Laporan & Analisis', icon: BarChart3 },
    { to: '/settings', label: 'Pengaturan', icon: Settings },
  ];

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

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white font-bold shadow-xs">
            NW
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              Noven Wallet
            </h1>
            <p className="text-[11px] text-slate-400 font-medium leading-none">
              Keuangan Pribadi
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="p-4">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi</span>
          <kbd className="hidden lg:inline-block ml-auto text-[10px] bg-teal-800/80 px-1.5 py-0.5 rounded text-teal-200">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Net Worth & Quick Actions Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="px-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Kekayaan Bersih
            </span>
            <button
              type="button"
              onClick={togglePrivacy}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title={settings.isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {settings.isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {formatRupiah(netWorthData.netWorth, settings.isPrivacyMode)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gelap</span>
              </>
            )}
          </button>

          {settings.pinHash && (
            <button
              type="button"
              onClick={() => setLock(true)}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors"
              title="Kunci Aplikasi Sekarang"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>
          )}
        </div>

        {/* User Account & Logout */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-[10px] shrink-0">
              {(settings.authUsername || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono truncate text-[11px]">
              {settings.authUsername || 'admin'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Keluar dari Akun (Logout)"
            aria-label="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
