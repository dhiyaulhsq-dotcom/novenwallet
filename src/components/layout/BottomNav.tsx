import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Menu,
  Plus,
  WalletCards,
  Target,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  BarChart3,
  Settings,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { settings, setLogoutModalOpen } = useFinanceStore();

  const moreItems = [
    { to: '/wallets', label: 'Dompet & Rekening', icon: WalletCards },
    { to: '/goals', label: 'Tujuan Tabungan', icon: Target },
    { to: '/debts', label: 'Utang & Cicilan', icon: FileSpreadsheet },
    { to: '/investments', label: 'Investasi & Aset', icon: TrendingUp },
    { to: '/bills', label: 'Tagihan & Langganan', icon: Receipt },
    { to: '/reports', label: 'Laporan & Analisis', icon: BarChart3 },
    { to: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer for Additional Pages */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 z-10 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Menu Lengkap
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* User Account & Logout in Mobile Drawer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                  {(settings.authUsername || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono block truncate">
                    {settings.authUsername || 'admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Sesi aktif 2 hari</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200 dark:border-rose-900/60 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Transaksi</span>
        </NavLink>

        {/* Center Floating Plus Button */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Catat Transaksi Cepat"
          className="relative -top-5 flex items-center justify-center w-12 h-12 rounded-full bg-teal-700 text-white shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>

        <NavLink
          to="/budget"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <PieChart className="w-5 h-5" />
          <span>Anggaran</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors ${
            isMoreOpen
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
};
