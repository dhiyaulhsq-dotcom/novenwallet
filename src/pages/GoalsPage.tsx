import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  ShieldCheck,
  Home,
  Plane,
  Car,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Goal, GoalPreset } from '../types/finance';
import { formatRupiah, formatTanggal } from '../lib/formatters';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const GoalsPage: React.FC = () => {
  const {
    goals,
    wallets,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    withdrawFromGoal,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositWalletId, setDepositWalletId] = useState(wallets[0]?.id || '');
  const [depositNote, setDepositNote] = useState('');

  // Editing state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formDeadline, setFormDeadline] = useState('2027-12-31');
  const [formPreset, setFormPreset] = useState<GoalPreset>('custom');
  const [formColor, setFormColor] = useState('#0F766E');
  const [formNotes, setFormNotes] = useState('');

  const PRESETS: { id: GoalPreset; label: string; icon: any; defaultTarget: number }[] = [
    { id: 'emergency', label: 'Dana Darurat', icon: ShieldCheck, defaultTarget: 50000000 },
    { id: 'house_dp', label: 'DP Rumah', icon: Home, defaultTarget: 100000000 },
    { id: 'vacation', label: 'Liburan Impian', icon: Plane, defaultTarget: 25000000 },
    { id: 'vehicle', label: 'Beli Kendaraan', icon: Car, defaultTarget: 35000000 },
    { id: 'education', label: 'Dana Pendidikan', icon: GraduationCap, defaultTarget: 60000000 },
    { id: 'custom', label: 'Tujuan Lainnya', icon: Target, defaultTarget: 20000000 },
  ];

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setFormPreset(p.id);
    if (!editingGoal) {
      setFormName(p.label);
      setFormTarget(p.defaultTarget.toString());
    }
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setFormName('Dana Liburan');
    setFormTarget('20000000');
    setFormCurrent('0');
    setFormDeadline('2027-12-31');
    setFormPreset('vacation');
    setFormColor('#0F766E');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setFormName(g.name);
    setFormTarget(g.targetAmount.toString());
    setFormCurrent(g.currentAmount.toString());
    setFormDeadline(g.deadline);
    setFormPreset(g.preset);
    setFormColor(g.color || '#0F766E');
    setFormNotes(g.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(formTarget);
    if (!target || target <= 0) {
      addToast('Target nominal harus lebih dari 0', 'error');
      return;
    }

    const payload = {
      name: formName.trim(),
      targetAmount: target,
      currentAmount: parseFloat(formCurrent) || 0,
      deadline: formDeadline,
      preset: formPreset,
      color: formColor,
      icon: formPreset === 'emergency' ? 'ShieldCheck' : formPreset === 'house_dp' ? 'Home' : formPreset === 'vacation' ? 'Plane' : 'Target',
      notes: formNotes.trim() || undefined,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
      addToast('Tujuan tabungan berhasil diperbarui', 'success');
    } else {
      addGoal(payload);
      addToast('Tujuan tabungan baru berhasil dibuat', 'success');
    }

    setIsAddModalOpen(false);
  };

  const openDepositModal = (goalId: string, type: 'deposit' | 'withdraw') => {
    setDepositGoalId(goalId);
    setDepositType(type);
    setDepositAmount('');
    setDepositNote('');
    setIsDepositModalOpen(true);
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      addToast('Masukkan nominal yang valid', 'error');
      return;
    }

    const targetGoal = goals.find((g) => g.id === depositGoalId);

    if (depositType === 'deposit') {
      contributeToGoal(depositGoalId, amt, depositNote.trim() || undefined, depositWalletId);
      addToast(`Setoran ${formatRupiah(amt)} berhasil dicatat`, 'success');

      // Trigger Confetti jika mencapai target 100%
      if (targetGoal && targetGoal.currentAmount + amt >= targetGoal.targetAmount) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        addToast('Selamat! Target tabungan Anda telah tercapai! 🎉', 'success');
      }
    } else {
      if (targetGoal && amt > targetGoal.currentAmount) {
        addToast('Penarikan melebihi dana tabungan yang terkumpul', 'error');
        return;
      }
      withdrawFromGoal(depositGoalId, amt, depositNote.trim() || undefined, depositWalletId);
      addToast(`Penarikan dana ${formatRupiah(amt)} dicatat`, 'success');
    }

    setIsDepositModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Tujuan Tabungan & Impian Finansial
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lacak progres tabungan masa depan dan ketahui rekomendasi setoran bulanan.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tujuan Baru</span>
        </button>
      </div>

      {/* Grid Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const progressPct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);

          // Hitung sisa bulan ke tenggat
          const today = new Date();
          const deadlineDate = new Date(g.deadline);
          const monthsLeft = Math.max(
            1,
            (deadlineDate.getFullYear() - today.getFullYear()) * 12 +
              (deadlineDate.getMonth() - today.getMonth())
          );
          const recommendedMonthly = Math.round(remainingAmount / monthsLeft);

          const isAchieved = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: g.color || '#0F766E' }}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {g.name}
                        {isAchieved && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 inline shrink-0" />
                        )}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Tenggat: {formatTanggal(g.deadline, 'short')} ({monthsLeft} bulan lagi)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus tujuan tabungan "${g.name}"?`)) {
                          deleteGoal(g.id);
                          addToast('Tujuan tabungan dihapus', 'success');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatRupiah(g.currentAmount, settings.isPrivacyMode)}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {formatRupiah(g.targetAmount, settings.isPrivacyMode)} ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAchieved ? 'bg-emerald-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Insight & Rekomendasi Bulanan */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  {isAchieved ? (
                    <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Target tabungan telah 100% tercapai! Siap dieksekusi.</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Saran Tabungan Bulanan:</span>
                      <strong className="text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(recommendedMonthly, settings.isPrivacyMode)} / bln
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Setor & Tarik */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openDepositModal(g.id, 'deposit')}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Setor Tabungan</span>
                </button>
                <button
                  type="button"
                  onClick={() => openDepositModal(g.id, 'withdraw')}
                  className="py-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Tarik</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL BUAT / UBAH GOAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingGoal ? 'Ubah Tujuan Tabungan' : 'Buat Tujuan Tabungan Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block font-medium mb-1.5">Pilih Preset Rekomendasi</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      formPreset === p.id
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] truncate w-full">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Nama Tujuan Impian <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Target Nominal (Rp) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Dana Terkumpul Awal (Rp)</label>
              <input
                type="number"
                value={formCurrent}
                onChange={(e) => setFormCurrent(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Tenggat Target Tercapai (Deadline)</label>
            <input
              type="date"
              required
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Catatan / Rencana Tempat Simpan</label>
            <input
              type="text"
              placeholder="Contoh: Disimpan di Reksadana Pasar Uang Bibit"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Simpan Tujuan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SETOR / TARIK TABUNGAN */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={depositType === 'deposit' ? 'Setor Dana Tabungan' : 'Tarik Dana Tabungan'}
        maxWidth="sm"
      >
        <form onSubmit={handleExecuteDeposit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">
              Nominal {depositType === 'deposit' ? 'Setoran' : 'Penarikan'} (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 1000000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 font-mono text-base font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              {depositType === 'deposit' ? 'Potong dari Rekening / Dompet' : 'Masuk ke Rekening / Dompet'}
            </label>
            <select
              value={depositWalletId}
              onChange={(e) => setDepositWalletId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Catatan</label>
            <input
              type="text"
              placeholder="Keterangan setoran..."
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              {depositType === 'deposit' ? 'Konfirmasi Setoran' : 'Konfirmasi Penarikan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
