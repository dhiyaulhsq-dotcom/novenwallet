import React from 'react';
import { LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useToastStore } from './Toast';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutModalOpen, setLogoutModalOpen, logout, settings, firebaseUser } = useFinanceStore();
  const { addToast } = useToastStore();

  if (!isLogoutModalOpen) return null;

  const handleConfirmLogout = () => {
    logout();
    setLogoutModalOpen(false);
    addToast('Anda telah keluar dari Noven Wallet', 'info');
  };

  const accountLabel = firebaseUser?.displayName || firebaseUser?.email || settings.authUsername || 'admin';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0"
        onClick={() => setLogoutModalOpen(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-5 text-center">
        {/* Icon / Avatar Badge */}
        {firebaseUser?.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt={accountLabel}
            className="mx-auto w-14 h-14 rounded-2xl border-2 border-teal-500 shadow-md object-cover"
          />
        ) : (
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
            <LogOut className="w-7 h-7" />
          </div>
        )}

        {/* Text Details */}
        <div className="space-y-2">
          <h3
            id="logout-dialog-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Keluar dari Akun?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anda akan keluar dari sesi akun{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {accountLabel}
            </strong>
            . Sesi sinkronisasi real-time akan dihentikan hingga Anda masuk kembali.
          </p>
        </div>

        {/* Security Note */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Semua catatan keuangan Anda tetap tersimpan dengan aman di browser.</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(false)}
            className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
