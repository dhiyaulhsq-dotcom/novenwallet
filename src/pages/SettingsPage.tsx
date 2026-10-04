import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  KeyRound,
  User,
  LogOut,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Category } from '../types/finance';
import { hashPin, verifyPin, formatRemainingSession, DEFAULT_AUTH_USERNAME } from '../lib/security';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    settings,
    updateSettings,
    resetToEmpty,
    loadSampleData,
    importFullData,
    updateCredentials,
    setLogoutModalOpen,
    refreshSession,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Category modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#0F766E');
  const [catSubcategories, setCatSubcategories] = useState<string>('');

  // PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPinCheck, setCurrentPinCheck] = useState('');

  // Credential Modal (Username & Password)
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [credCurrentPassword, setCredCurrentPassword] = useState('');
  const [credNewUsername, setCredNewUsername] = useState(settings.authUsername || DEFAULT_AUTH_USERNAME);
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [credError, setCredError] = useState('');
  const [showCredPassword, setShowCredPassword] = useState(false);

  // In-App Confirmation Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLoadSampleModalOpen, setIsLoadSampleModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Open Credential Modal
  const openCredentialModal = () => {
    setCredCurrentPassword('');
    setCredNewUsername(settings.authUsername || DEFAULT_AUTH_USERNAME);
    setCredNewPassword('');
    setCredConfirmPassword('');
    setCredError('');
    setIsCredModalOpen(true);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');

    if (!credCurrentPassword) {
      setCredError('Password saat ini wajib diisi');
      return;
    }

    if (!credNewUsername.trim()) {
      setCredError('Username baru tidak boleh kosong');
      return;
    }

    if (credNewPassword && credNewPassword.length < 4) {
      setCredError('Password baru minimal 4 karakter');
      return;
    }

    if (credNewPassword && credNewPassword !== credConfirmPassword) {
      setCredError('Konfirmasi password baru tidak cocok');
      return;
    }

    const res = await updateCredentials({
      currentPassword: credCurrentPassword,
      newUsername: credNewUsername.trim(),
      newPassword: credNewPassword.trim() || undefined,
    });

    if (res.success) {
      addToast(res.message, 'success');
      setIsCredModalOpen(false);
    } else {
      setCredError(res.message);
    }
  };

  // Open Category Form
  const openAddCategory = () => {
    setEditingCat(null);
    setCatName('');
    setCatType('expense');
    setCatColor('#0F766E');
    setCatSubcategories('Umum');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatType(c.type);
    setCatColor(c.color);
    setCatSubcategories(c.subcategories.join(', '));
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      addToast('Nama kategori tidak boleh kosong', 'error');
      return;
    }

    const subs = catSubcategories
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      name: catName.trim(),
      type: catType,
      color: catColor,
      icon: 'Tag',
      subcategories: subs.length > 0 ? subs : ['Umum'],
    };

    if (editingCat) {
      updateCategory(editingCat.id, payload);
      addToast('Kategori berhasil diperbarui', 'success');
    } else {
      addCategory(payload);
      addToast('Kategori baru berhasil ditambahkan', 'success');
    }

    setIsCatModalOpen(false);
  };

  // PIN Management
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      addToast('PIN harus terdiri dari 4 sampai 6 digit angka', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      addToast('Konfirmasi PIN tidak cocok', 'error');
      return;
    }

    if (settings.pinHash) {
      const isOldValid = await verifyPin(currentPinCheck, settings.pinHash);
      if (!isOldValid) {
        addToast('PIN lama tidak sesuai', 'error');
        return;
      }
    }

    const hashed = await hashPin(newPin);
    updateSettings({ pinHash: hashed });
    addToast('Kunci PIN berhasil diatur', 'success');
    setIsPinModalOpen(false);
    setNewPin('');
    setConfirmPin('');
    setCurrentPinCheck('');
  };

  const handleRemovePin = async () => {
    if (!settings.pinHash) return;
    const input = prompt('Masukkan PIN saat ini untuk menonaktifkan proteksi:');
    if (!input) return;

    const isValid = await verifyPin(input, settings.pinHash);
    if (isValid) {
      updateSettings({ pinHash: null });
      addToast('Kunci PIN telah dinonaktifkan', 'success');
    } else {
      addToast('PIN salah', 'error');
    }
  };

  // Backup JSON Export
  const handleExportFullJson = () => {
    const state = useFinanceStore.getState();
    const backupObj = {
      version: 1,
      exportDate: new Date().toISOString(),
      appName: 'Noven Wallet',
      wallets: state.wallets,
      categories: state.categories,
      transactions: state.transactions,
      recurringTransactions: state.recurringTransactions,
      budgets: state.budgets,
      goals: state.goals,
      debts: state.debts,
      assets: state.assets,
      bills: state.bills,
      settings: state.settings,
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noven_wallet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('File cadangan JSON berhasil diunduh', 'success');
  };

  // Restore JSON Import
  const handleImportFullJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importFullData(parsed);
        if (ok) {
          addToast('Semua data berhasil dipulihkan dari cadangan', 'success');
        } else {
          addToast('Format file JSON tidak valid', 'error');
        }
      } catch {
        addToast('Gagal membaca file JSON cadangan', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Empty
  const handleResetToEmpty = () => {
    resetToEmpty();
    setIsResetModalOpen(false);
    addToast('Semua data berhasil dikosongkan. Noven Wallet siap digunakan dari nol!', 'info');
  };

  // Reload Sample Data
  const handleLoadSampleData = () => {
    loadSampleData();
    setIsLoadSampleModalOpen(false);
    addToast('Data contoh 6 bulan berhasil dimuat!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Pengaturan Noven Wallet
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Konfigurasi preferensi privasi, kategori anggaran, tanggal pembukuan gaji, dan cadangan data.
        </p>
      </div>

      {/* SECTION 1: PREFERENSI TAMPILAN & PRIVASI */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-700" />
          <span>Privasi & Keamanan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mode Privasi (Sembunyikan Saldo) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mode Privasi Nominal
              </h4>
              <p className="text-slate-400 text-[11px]">
                Sembunyikan angka rupiah menjadi Rp •••••• di semua layar
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ isPrivacyMode: !settings.isPrivacyMode })}
              className={`p-2 rounded-xl transition-colors ${
                settings.isPrivacyMode
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {settings.isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Kunci PIN Aplikasi */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Kunci Aplikasi dengan PIN
              </h4>
              <p className="text-slate-400 text-[11px]">
                {settings.pinHash ? 'PIN Aktif (SHA-256 tersimpan lokal)' : 'Belum mengaktifkan PIN'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.pinHash ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    className="px-3 py-1.5 font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 rounded-lg hover:underline"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-3 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs"
                >
                  Pasang PIN
                </button>
              )}
            </div>
          </div>

          {/* Tanggal Awal Pembukuan / Gajian */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Tanggal Awal Bulan Keuangan (Gajian)
              </h4>
              <p className="text-slate-400 text-[11px]">
                Siklus perhitungan anggaran & arus kas dimulai tanggal ini
              </p>
            </div>
            <select
              value={settings.startDayOfMonth}
              onChange={(e) => updateSettings({ startDayOfMonth: Number(e.target.value) })}
              className="px-3 py-1.5 font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-teal-700"
            >
              <option value={1}>Tgl 1 (Awal Bulan Kalender)</option>
              <option value={20}>Tgl 20</option>
              <option value={25}>Tgl 25 (Gajian Standar)</option>
              <option value={28}>Tgl 28 (Akhir Bulan)</option>
            </select>
          </div>

          {/* Tema Gelap / Terang */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Tema Antarmuka
              </h4>
              <p className="text-slate-400 text-[11px]">
                Beralih antara mode gelap profesional dan mode terang
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                updateSettings({ theme: nextTheme });
                if (nextTheme === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {settings.theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{settings.theme === 'dark' ? 'Gelap' : 'Terang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: AKUN LOGIN & KREDENSIAL PENGGUNA (HANYA DAPAT DIATUR DI SINI) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-700" />
            <span>Akun Login & Kredensial Akses</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Username dan password masuk ke Noven Wallet hanya dapat diatur dan diubah di dalam aplikasi ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Card Username */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Username Aktif
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs">
                  {(settings.authUsername || DEFAULT_AUTH_USERNAME).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    {settings.authUsername || DEFAULT_AUTH_USERNAME}
                  </h4>
                  <span className="text-[11px] text-slate-400">Akun Pengguna Noven Wallet</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCredentialModal}
              className="w-full py-2 px-3 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 rounded-xl border border-teal-200 dark:border-teal-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ubah Username / Password</span>
            </button>
          </div>

          {/* Card Sesi & Logout */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Masa Aktif Sesi Login
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {formatRemainingSession(settings.lastLoginTimestamp)}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Otomatis logout jika tidak login selama 2 hari (48 jam)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  refreshSession();
                  addToast('Masa aktif sesi telah diperpanjang 2 hari ke depan', 'success');
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 rounded-xl border border-teal-200 dark:border-teal-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Perpanjang Sesi</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="flex-1 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: KELOLA KATEGORI & SUBKATEGORI */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Kelola Kategori & Subkategori ({categories.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sesuaikan klasifikasi pos pengeluaran dan pos pendapatan Anda
            </p>
          </div>

          <button
            type="button"
            onClick={openAddCategory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kategori</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    {c.name}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${c.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  Sub: {c.subcategories.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => openEditCategory(c)}
                  className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(c)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Hapus Kategori"
                  aria-label={`Hapus Kategori ${c.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CADANGAN & PEMULIHAN DATA (JSON) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-700" />
            <span>Cadangan & Pemulihan Seluruh Data (JSON)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua data tersimpan aman di browser Anda tanpa server eksternal. Simpan cadangan berkala ke file JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Ekspor JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Cadangkan Seluruh Data (Backup)
            </h4>
            <p className="text-slate-400 text-[11px]">
              Unduh salinan lengkap transaksi, rekening, anggaran, goals, dan investasi ke format JSON.
            </p>
            <button
              type="button"
              onClick={handleExportFullJson}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Cadangan JSON</span>
            </button>
          </div>

          {/* Impor JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Pulihkan Data dari Cadangan (Restore)
            </h4>
            <p className="text-slate-400 text-[11px]">
              Kembalikan seluruh data dari file JSON cadangan yang pernah Anda simpan sebelumnya.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Pilih File JSON Cadangan</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFullJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 4: RESET DATA & DATA CONTOH */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Zona Atur Ulang & Data Contoh</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mulai dari lembar kosong untuk mencatat keuangan pribadi asli Anda, atau muat data sampel 6 bulan untuk simulasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mulai dari Kosong (Hapus Semua)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLoadSampleModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 rounded-xl border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Muat Ulang Data Contoh (6 Bulan)</span>
          </button>
        </div>
      </div>

      {/* MODAL KATEGORI */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Nama Kategori <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: Belanja Online, Kebugaran"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Jenis Kategori</label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Daftar Subkategori (Pisahkan dengan koma)</label>
            <input
              type="text"
              placeholder="Contoh: Sayur, Buah, Daging, Bumbu"
              value={catSubcategories}
              onChange={(e) => setCatSubcategories(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Warna Label</label>
            <div className="flex items-center gap-2">
              {['#0F766E', '#005E9E', '#16A34A', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setCatColor(col)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    catColor === col ? 'scale-115 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan Kategori
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SET PIN */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={settings.pinHash ? 'Ganti PIN Keamanan' : 'Pasang PIN Keamanan Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSetPin} className="space-y-4 text-xs">
          {settings.pinHash && (
            <div>
              <label className="block font-medium mb-1">PIN Saat Ini</label>
              <input
                type="password"
                maxLength={6}
                required
                value={currentPinCheck}
                onChange={(e) => setCurrentPinCheck(e.target.value)}
                className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">PIN Baru (4-6 Digit)</label>
            <input
              type="password"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Konfirmasi PIN Baru</label>
            <input
              type="password"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan PIN
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UBAH USERNAME & PASSWORD LOGIN */}
      <Modal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        title="Ubah Username & Password Login"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Perubahan kredensial ini hanya berlaku di dalam perangkat Anda. Pastikan Anda mengingat username dan password baru.
          </p>

          {credError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{credError}</span>
            </div>
          )}

          {/* Password Saat Ini (Wajib) */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCredPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password yang aktif saat ini"
                value={credCurrentPassword}
                onChange={(e) => setCredCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCredPassword(!showCredPassword)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1.5"
              >
                {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!settings.isCustomAuthSet && (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 block">
                (Password bawaan awal saat ini: <code>admin</code>)
              </span>
            )}
          </div>

          {/* Username Baru */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: noven_finance atau nama Anda"
              value={credNewUsername}
              onChange={(e) => setCredNewUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Password Baru (Opsional bila hanya ganti username) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password Baru (Kosongkan bila tidak ingin mengubah password)
              </label>
              <input
                type={showCredPassword ? 'text' : 'password'}
                placeholder="Minimal 4 karakter"
                value={credNewPassword}
                onChange={(e) => setCredNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {credNewPassword && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showCredPassword ? 'text' : 'password'}
                  required
                  placeholder="Ketik ulang password baru"
                  value={credConfirmPassword}
                  onChange={(e) => setCredConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCredModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan Kredensial Baru
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL KONFIRMASI MULAI DARI KOSONG (HAPUS SEMUA DATA) */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Mulai dari Kosong (Hapus Semua)?"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-rose-800 dark:text-rose-200 text-sm">
                Tindakan ini akan mengosongkan seluruh data finansial!
              </h4>
              <p className="text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                Semua catatan transaksi, saldo rekening, anggaran bulanan, target tabungan, utang, portofolio investasi, dan daftar tagihan akan dihapus permanen dari browser ini.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Apa yang terjadi setelah direset:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Saldo seluruh dompet menjadi <strong>Rp 0</strong> (Dompet Utama siap pakai).</li>
              <li>Riwayat transaksi dan grafik statistik kembali bersih dari nol.</li>
              <li>Akun login Anda (username & password) <strong>tetap aman</strong> dan tidak akan hilang.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="px-5 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ya, Kosongkan Semua Data</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL KONFIRMASI MUAT ULANG DATA CONTOH */}
      <Modal
        isOpen={isLoadSampleModalOpen}
        onClose={() => setIsLoadSampleModalOpen(false)}
        title="Muat Data Contoh (6 Bulan)?"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Apakah Anda ingin memuat data simulasi keuangan 6 bulan lengkap dengan berbagai transaksi, dompet (BCA, Mandiri, GoPay, Tunai), anggaran bulanan, portofolio investasi, utang, dan tagihan rutin?
          </p>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Data keuangan yang saat ini ada di aplikasi akan ditimpa dengan data sampel simulasi.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsLoadSampleModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 active:scale-98 rounded-xl shadow-xs cursor-pointer"
            >
              Ya, Muat Data Contoh
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL HAPUS KATEGORI */}
      {categoryToDelete && (
        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title={`Hapus Kategori "${categoryToDelete.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                  addToast('Kategori berhasil dihapus', 'success');
                }}
                className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
