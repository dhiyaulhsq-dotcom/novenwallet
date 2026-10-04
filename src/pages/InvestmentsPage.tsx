import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Plus,
  Coins,
  Gem,
  Building,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Asset, AssetType } from '../types/finance';
import { formatRupiah, formatPercent, formatTanggal } from '../lib/formatters';
import { calculateNetWorth } from '../lib/financialMath';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const InvestmentsPage: React.FC = () => {
  const {
    assets,
    wallets,
    debts,
    addAsset,
    updateAsset,
    deleteAsset,
    settings,
  } = useFinanceStore();

  const { addToast } = useToastStore();

  // Filter Aset per Tipe
  const [filterType, setFilterType] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AssetType>('stock');
  const [formUnitCount, setFormUnitCount] = useState('');
  const [formAvgBuyPrice, setFormAvgBuyPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Perhitungan Nilai Portofolio & Keuntungan
  const portfolioMetrics = useMemo(() => {
    let totalInvested = 0;
    let totalMarketValue = 0;

    for (const a of assets) {
      const invested = a.unitCount * a.avgBuyPrice;
      const market = a.unitCount * a.currentPrice;
      totalInvested += invested;
      totalMarketValue += market;
    }

    const totalProfit = totalMarketValue - totalInvested;
    const profitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalMarketValue,
      totalProfit,
      profitPct,
    };
  }, [assets]);

  // Net Worth Calculation
  const netWorthData = useMemo(() => calculateNetWorth(wallets, assets, debts), [wallets, assets, debts]);

  // Donut Chart Data: Alokasi Aset per Tipe
  const assetAllocationData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {
      stock: { name: 'Saham', value: 0, color: '#2563EB' },
      mutual_fund: { name: 'Reksa Dana', value: 0, color: '#0F766E' },
      gold: { name: 'Emas Mulia', value: 0, color: '#EAB308' },
      crypto: { name: 'Kripto', value: 0, color: '#8B5CF6' },
      bond: { name: 'SBN / Obligasi', value: 0, color: '#10B981' },
      property: { name: 'Properti', value: 0, color: '#EC4899' },
      deposit: { name: 'Deposito', value: 0, color: '#0EA5E9' },
      other: { name: 'Aset Lainnya', value: 0, color: '#64748B' },
    };

    for (const a of assets) {
      const marketVal = a.unitCount * a.currentPrice;
      if (map[a.type]) {
        map[a.type].value += marketVal;
      }
    }

    return Object.values(map).filter((item) => item.value > 0);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (filterType === 'all') return assets;
    return assets.filter((a) => a.type === filterType);
  }, [assets, filterType]);

  const openAddModal = () => {
    setEditingAsset(null);
    setFormName('');
    setFormType('stock');
    setFormUnitCount('10');
    setFormAvgBuyPrice('900000');
    setFormCurrentPrice('950000');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (a: Asset) => {
    setEditingAsset(a);
    setFormName(a.name);
    setFormType(a.type);
    setFormUnitCount(a.unitCount.toString());
    setFormAvgBuyPrice(a.avgBuyPrice.toString());
    setFormCurrentPrice(a.currentPrice.toString());
    setFormNotes(a.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const units = parseFloat(formUnitCount);
    const buyPrice = parseFloat(formAvgBuyPrice);
    const currPrice = parseFloat(formCurrentPrice);

    if (!formName.trim() || isNaN(units) || isNaN(buyPrice) || isNaN(currPrice)) {
      addToast('Mohon lengkapi semua data aset', 'error');
      return;
    }

    const payload = {
      name: formName.trim(),
      type: formType,
      unitCount: units,
      avgBuyPrice: buyPrice,
      currentPrice: currPrice,
      notes: formNotes.trim() || undefined,
    };

    if (editingAsset) {
      updateAsset(editingAsset.id, payload);
      addToast('Aset berhasil diperbarui', 'success');
    } else {
      addAsset(payload);
      addToast('Aset baru ditambahkan ke portofolio', 'success');
    }

    setIsAddModalOpen(false);
  };

  const getAssetTypeBadge = (t: AssetType) => {
    switch (t) {
      case 'stock':
        return 'Saham';
      case 'mutual_fund':
        return 'Reksa Dana';
      case 'gold':
        return 'Emas';
      case 'crypto':
        return 'Kripto';
      case 'bond':
        return 'SBN / Obligasi';
      case 'property':
        return 'Properti';
      case 'deposit':
        return 'Deposito';
      default:
        return 'Lainnya';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Portofolio Investasi & Aset Riil
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lacak kinerja investasi saham, reksa dana, emas antam, kripto, obligasi, dan aset properti.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* KPI Cards: Nilai Portofolio & Net Worth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nilai Pasar Portofolio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Nilai Pasar Investasi
          </span>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatRupiah(portfolioMetrics.totalMarketValue, settings.isPrivacyMode)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Modal Beli: {formatRupiah(portfolioMetrics.totalInvested, settings.isPrivacyMode)}
          </span>
        </div>

        {/* Untung / Rugi (P&L) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Keuntungan (Unrealized)
          </span>
          <div
            className={`text-2xl font-bold tabular-nums mt-1 flex items-baseline gap-1.5 ${
              portfolioMetrics.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {portfolioMetrics.totalProfit >= 0 ? '+' : ''}
            {formatRupiah(portfolioMetrics.totalProfit, settings.isPrivacyMode)}
          </div>
          <span className={`text-xs font-semibold tabular-nums mt-1 inline-flex items-center gap-0.5 ${
            portfolioMetrics.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {portfolioMetrics.totalProfit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {portfolioMetrics.profitPct.toFixed(2)}%
          </span>
        </div>

        {/* Total Aset Riil (Kas + Investasi) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Seluruh Aset
          </span>
          <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
            {formatRupiah(netWorthData.totalAssets, settings.isPrivacyMode)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Kas {formatRupiah(netWorthData.walletAssets, settings.isPrivacyMode)} + Investasi {formatRupiah(netWorthData.investmentAssets, settings.isPrivacyMode)}
          </span>
        </div>

        {/* Total Kekayaan Bersih (Net Worth) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/20 shadow-2xs">
          <span className="text-xs font-medium text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Kekayaan Bersih (Net Worth)</span>
          </span>
          <div className="text-2xl font-bold tabular-nums text-teal-900 dark:text-teal-200 mt-1">
            {formatRupiah(netWorthData.netWorth, settings.isPrivacyMode)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Aset dikurangi Utang ({formatRupiah(netWorthData.totalDebts, settings.isPrivacyMode)})
          </span>
        </div>
      </div>

      {/* Donut Chart Alokasi Aset */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Alokasi Portofolio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Komposisi diversifikasi instrumen investasi
            </p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-32 overflow-y-auto">
            {assetAllocationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatRupiah(item.value, settings.isPrivacyMode)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Kinerja Seluruh Instrumen */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rincian Kinerja Instrumen Aset
              </h3>
              <p className="text-xs text-slate-500">
                Pembaruan harga pasar terakhir dan rasio untung/rugi
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['all', 'stock', 'mutual_fund', 'gold', 'crypto', 'bond'].map((typeKey) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setFilterType(typeKey)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterType === typeKey
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {typeKey === 'all'
                    ? 'Semua'
                    : typeKey === 'stock'
                    ? 'Saham'
                    : typeKey === 'mutual_fund'
                    ? 'Reksa Dana'
                    : typeKey === 'gold'
                    ? 'Emas'
                    : typeKey === 'crypto'
                    ? 'Kripto'
                    : 'SBN'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Nama Instrumen</th>
                  <th className="p-3 text-right">Jumlah Unit</th>
                  <th className="p-3 text-right">Harga Beli</th>
                  <th className="p-3 text-right">Harga Pasar</th>
                  <th className="p-3 text-right">Nilai Total</th>
                  <th className="p-3 text-right">P&L (%)</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      Belum ada aset dalam kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((a) => {
                    const totalCost = a.unitCount * a.avgBuyPrice;
                    const totalVal = a.unitCount * a.currentPrice;
                    const profit = totalVal - totalCost;
                    const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
                    const isProfit = profit >= 0;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {a.name}
                          </div>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            {getAssetTypeBadge(a.type)} · Update: {formatTanggal(a.lastUpdated, 'short')}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {a.unitCount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                          {formatRupiah(a.avgBuyPrice, settings.isPrivacyMode)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {formatRupiah(a.currentPrice, settings.isPrivacyMode)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatRupiah(totalVal, settings.isPrivacyMode)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <span className={`font-semibold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}{profitPct.toFixed(1)}%
                          </span>
                          <span className="text-[10px] block text-slate-400">
                            {formatRupiah(profit, settings.isPrivacyMode)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(a)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Update Harga / Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus aset ${a.name}?`)) {
                                  deleteAsset(a.id);
                                  addToast('Aset dihapus', 'success');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / UPDATE ASET */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingAsset ? 'Ubah Nilai / Harga Aset' : 'Tambah Instrumen Portofolio Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Nama Aset / Saham / Logam <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: BBCA, Sucor Reksadana, Emas Antam"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Jenis Instrumen</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as AssetType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="stock">Saham</option>
              <option value="mutual_fund">Reksa Dana</option>
              <option value="gold">Emas Logam Mulia</option>
              <option value="crypto">Kripto</option>
              <option value="bond">SBN / Obligasi Negara</option>
              <option value="deposit">Deposito</option>
              <option value="property">Properti</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium mb-1">Jumlah Unit / Lot</label>
              <input
                type="number"
                step="any"
                required
                value={formUnitCount}
                onChange={(e) => setFormUnitCount(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Harga Beli Rata2</label>
              <input
                type="number"
                step="any"
                required
                value={formAvgBuyPrice}
                onChange={(e) => setFormAvgBuyPrice(e.target.value)}
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Harga Pasar Saat Ini</label>
              <input
                type="number"
                step="any"
                required
                value={formCurrentPrice}
                onChange={(e) => setFormCurrentPrice(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Catatan / Sekuritas / Dompet Simpan</label>
            <input
              type="text"
              placeholder="Contoh: Akun Mirae Asset, Brankas Fisik, Bibit"
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
              Simpan Aset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
