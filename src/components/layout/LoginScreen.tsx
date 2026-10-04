import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { DEFAULT_AUTH_USERNAME, DEFAULT_AUTH_PASSWORD } from '../../lib/security';

export const LoginScreen: React.FC = () => {
  const { login, loginWithGoogleAuth, settings, updateSettings } = useFinanceStore();

  const [username, setUsername] = useState(settings.authUsername || DEFAULT_AUTH_USERNAME);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogleAuth();
      if (!res.success) {
        setErrorMessage(res.message || 'Gagal login dengan akun Google');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kendala saat menghubungkan akun Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Silakan masukkan username');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setErrorMessage(res.message || 'Username atau password salah');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memverifikasi akun');
    } finally {
      setIsLoading(false);
    }
  };

  const isDefaultCredentials = !settings.isCustomAuthSet;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F6F8FB] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 p-4 transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ubah Tema"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-700 text-white font-bold items-center justify-center text-xl shadow-md shadow-teal-700/20 mb-1">
            NW
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Noven Wallet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aplikasi Manajemen Keuangan Pribadi & Analisis Finansial
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masukkan kredensial yang telah Anda atur untuk mengakses data keuangan.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign In Button - Multi-User Cloud Sync */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Menghubungkan ke Akun Google...' : 'Masuk dengan Akun Google (Cloud Sync)'}</span>
            </button>

            <div className="flex items-center gap-1.5 justify-center text-[10.5px] text-teal-700 dark:text-teal-400 font-medium bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-xl border border-teal-100 dark:border-teal-900/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Multi-User Terisolasi · Sinkron Otomatis HP & Laptop</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider shrink-0">
              atau masuk dengan akun lokal
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-md shadow-teal-700/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Noven Wallet'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Session Expiry Info Badge */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <span>
                Sesi login aktif selama <strong>2 hari (48 jam)</strong>. Jika tidak login selama 2 hari, Anda akan otomatis keluar demi keamanan.
              </span>
            </div>

            {isDefaultCredentials && (
              <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/40 text-[11px] text-teal-900 dark:text-teal-200">
                <span className="font-semibold block mb-0.5">💡 Akun Bawaan Awal:</span>
                Username: <code className="font-mono font-bold bg-teal-100/80 dark:bg-teal-900/60 px-1 py-0.5 rounded">admin</code> · Password: <code className="font-mono font-bold bg-teal-100/80 dark:bg-teal-900/60 px-1 py-0.5 rounded">admin</code>
                <span className="block text-[10px] text-teal-700 dark:text-teal-300 mt-1">
                  (Dapat diubah di menu Pengaturan setelah masuk)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Privasi lokal 100% tersimpan di browser Anda</span>
        </p>
      </div>
    </div>
  );
};
