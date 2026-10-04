import { Transaction, Category, Wallet } from '../types/finance';

/**
 * Convert transactions list to standard Indonesian CSV string
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[]
): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const walMap = new Map(wallets.map(w => [w.id, w.name]));

  const headers = [
    'Tanggal',
    'Tipe',
    'Nominal',
    'Kategori',
    'Subkategori',
    'Dompet Asal',
    'Dompet Tujuan',
    'Merchant / Penerima',
    'Tag',
    'Catatan'
  ];

  const rows = transactions.map(t => {
    const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const catName = catMap.get(t.categoryId) || '-';
    const subcat = t.subcategory || '-';
    const fromWallet = walMap.get(t.walletId) || '-';
    const toWallet = t.toWalletId ? (walMap.get(t.toWalletId) || '-') : '-';
    const payee = t.payee || '-';
    const tags = t.tags && t.tags.length > 0 ? t.tags.join(';') : '-';
    const note = t.note ? t.note.replace(/"/g, '""') : '-';

    return [
      t.date,
      typeLabel,
      t.amount,
      `"${catName}"`,
      `"${subcat}"`,
      `"${fromWallet}"`,
      `"${toWallet}"`,
      `"${payee}"`,
      `"${tags}"`,
      `"${note}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Trigger browser download of CSV
 */
export function downloadCsv(csvContent: string, fileName: string = 'transaksi_noven_wallet.csv') {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV raw text to array of columns and rows
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows };
}
