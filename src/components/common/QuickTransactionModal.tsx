import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Modal } from './Modal';
import { TransactionType, TransactionSplit } from '../../types/finance';
import { useToastStore } from './Toast';
import { Upload, Plus, Trash2, Tag as TagIcon } from 'lucide-react';
import { formatRupiah } from '../../lib/formatters';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransactionId?: string | null;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  editTransactionId,
}) => {
  const {
    wallets,
    categories,
    transactions,
    addTransaction,
    updateTransaction,
  } = useFinanceStore();
  const { addToast } = useToastStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string>('');
  
  // Split transaction state
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<TransactionSplit[]>([
    { categoryId: '', subcategory: '', amount: 0, note: '' },
    { categoryId: '', subcategory: '', amount: 0, note: '' },
  ]);

  // Load editing transaction if provided
  useEffect(() => {
    if (editTransactionId && isOpen) {
      const existing = transactions.find((t) => t.id === editTransactionId);
      if (existing) {
        setType(existing.type);
        setAmount(existing.amount.toString());
        setDate(existing.date);
        setWalletId(existing.walletId);
        setToWalletId(existing.toWalletId || '');
        setCategoryId(existing.categoryId);
        setSubcategory(existing.subcategory || '');
        setPayee(existing.payee || '');
        setNote(existing.note || '');
        setTags(existing.tags || []);
        setReceiptImage(existing.receiptImage || '');
        if (existing.splits && existing.splits.length > 0) {
          setIsSplit(true);
          setSplits(existing.splits);
        } else {
          setIsSplit(false);
        }
        return;
      }
    }

    if (isOpen) {
      // Default initial states
      setType('expense');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      if (wallets.length > 0 && !walletId) {
        setWalletId(wallets[0].id);
      }
      if (wallets.length > 1 && !toWalletId) {
        setToWalletId(wallets[1].id);
      }
      setSubcategory('');
      setPayee('');
      setNote('');
      setTags([]);
      setReceiptImage('');
      setIsSplit(false);
      setSplits([
        { categoryId: '', subcategory: '', amount: 0, note: '' },
        { categoryId: '', subcategory: '', amount: 0, note: '' },
      ]);
    }
  }, [isOpen, editTransactionId, wallets, transactions]);

  // Set default category when type changes
  useEffect(() => {
    const availableCats = categories.filter((c) =>
      type === 'transfer' ? true : c.type === type
    );
    if (availableCats.length > 0 && (!categoryId || !availableCats.some((c) => c.id === categoryId))) {
      setCategoryId(availableCats[0].id);
      setSubcategory(availableCats[0].subcategories[0] || '');
    }
  }, [type, categories]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat && cat.subcategories.length > 0) {
      setSubcategory(cat.subcategories[0]);
    } else {
      setSubcategory('');
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (1MB max to keep localStorage lightweight)
    if (file.size > 1024 * 1024) {
      addToast('Ukuran gambar maksimal 1MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
      addToast('Struk berhasil diunggah', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Split management
  const handleSplitChange = (index: number, field: keyof TransactionSplit, val: any) => {
    const updated = [...splits];
    updated[index] = { ...updated[index], [field]: val };
    setSplits(updated);
  };

  const addSplitRow = () => {
    setSplits([...splits, { categoryId: categoryId || '', subcategory: '', amount: 0, note: '' }]);
  };

  const removeSplitRow = (index: number) => {
    if (splits.length <= 2) {
      addToast('Split minimal membutuhkan 2 pembagian', 'info');
      return;
    }
    setSplits(splits.filter((_, idx) => idx !== index));
  };

  const splitSum = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!parsedAmount || parsedAmount <= 0) {
      addToast('Nominal harus lebih dari 0', 'error');
      return;
    }

    if (!walletId) {
      addToast('Pilih dompet sumber', 'error');
      return;
    }

    if (type === 'transfer' && walletId === toWalletId) {
      addToast('Dompet tujuan harus berbeda dari dompet asal', 'error');
      return;
    }

    if (isSplit && Math.round(splitSum) !== Math.round(parsedAmount)) {
      addToast(`Total split (${formatRupiah(splitSum)}) belum sama dengan total transaksi (${formatRupiah(parsedAmount)})`, 'error');
      return;
    }

    const payload = {
      date,
      type,
      amount: parsedAmount,
      categoryId: categoryId || (type === 'transfer' ? 'cat-exp-other' : categories[0].id),
      subcategory: subcategory || undefined,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      note: note.trim() || undefined,
      tags,
      payee: payee.trim() || undefined,
      receiptImage: receiptImage || undefined,
      splits: isSplit ? splits : undefined,
    };

    if (editTransactionId) {
      updateTransaction(editTransactionId, payload);
      addToast('Transaksi berhasil diperbarui', 'success');
    } else {
      addTransaction(payload);
      addToast('Transaksi berhasil dicatat', 'success');
    }

    onClose();
  };

  const availableCategories = categories.filter((c) =>
    type === 'transfer' ? true : c.type === type
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTransactionId ? 'Ubah Transaksi' : 'Catat Transaksi Cepat'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipe Transaksi: Segmented Buttons */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              type === 'transfer'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Nominal & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="Contoh: 50000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-base font-semibold tabular-nums rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            {parsedAmount > 0 && (
              <p className="mt-1 text-xs text-teal-600 dark:text-teal-400 font-medium tabular-nums">
                {formatRupiah(parsedAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Dompet Asal & Tujuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === 'transfer' ? 'Dari Rekening / Dompet' : 'Rekening / Dompet'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ke Rekening / Dompet Tujuan <span className="text-rose-500">*</span>
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === walletId}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kategori Utama
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={isSplit}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Subkategori & Penerima / Merchant (Jika bukan transfer dan bukan split) */}
        {type !== 'transfer' && !isSplit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCategory && activeCategory.subcategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subkategori
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Pilih Subkategori --</option>
                  {activeCategory.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={activeCategory?.subcategories.length ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {type === 'expense' ? 'Merchant / Toko / Penerima' : 'Pemberi / Sumber Dana'}
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'Contoh: Superindo, Starbucks' : 'Contoh: Kantor, Klien'}
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        )}

        {/* Split Transaction Checkbox (Untuk Pengeluaran) */}
        {type === 'expense' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                />
                <span>Bagi Transaksi (Split ke beberapa kategori)</span>
              </label>
              {isSplit && (
                <button
                  type="button"
                  onClick={addSplitRow}
                  className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Pos
                </button>
              )}
            </div>

            {isSplit && (
              <div className="mt-3 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-500">Rincian Pembagian</span>
                  <span className={splitSum === parsedAmount ? 'text-emerald-600 font-bold tabular-nums' : 'text-rose-500 font-bold tabular-nums'}>
                    Total Split: {formatRupiah(splitSum)} / {formatRupiah(parsedAmount)}
                  </span>
                </div>
                {splits.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={s.categoryId}
                      onChange={(e) => handleSplitChange(idx, 'categoryId', e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Pilih Kategori</option>
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={s.amount || ''}
                      onChange={(e) => handleSplitChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSplitRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catatan */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Catatan Tambahan
          </label>
          <input
            type="text"
            placeholder="Keterangan transaksi..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Tagging */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tag Label
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ketik tag lalu tekan enter (misal: Bensin, Liburan)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              Tambah
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Struk / Lampiran Foto */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Lampiran Struk / Bukti Transfer (Opsional)
          </label>
          {receiptImage ? (
            <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group">
              <img
                src={receiptImage}
                alt="Bukti Struk"
                className="h-24 w-auto object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => setReceiptImage('')}
                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                title="Hapus Gambar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-500 dark:text-slate-400">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Unggah foto nota/struk (Maks 1MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-xs transition-colors"
          >
            {editTransactionId ? 'Simpan Perubahan' : 'Catat Transaksi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
