# Noven Wallet - Aplikasi Manajemen Keuangan Pribadi & Analisis Finansial

Noven Wallet adalah aplikasi web pencatatan dan analisis keuangan pribadi yang modern, komprehensif, dan siap produksi. Aplikasi ini dirancang untuk memberikan visibilitas 360 derajat terhadap kondisi finansial Anda: arus kas harian, dompet & rekening bank, anggaran bulanan, target tabungan, utang & cicilan, serta portofolio investasi aset riil.

Seluruh data keuangan **100% tersimpan secara lokal di peramban (browser pengguna)** melalui `localStorage`. Tidak memerlukan backend, tidak ada database pihak ketiga, dan tanpa API key eksternal.

---

## 🌟 Fitur Utama (10 Modul Lengkap)

1. **Dashboard Finansial Utama**
   - **Filter Periode Dinamis**: Bulan ini, bulan lalu, 3 bulan terakhir, tahun ini, dan rentang tanggal kustom.
   - **6 Kartu Indikator Kinerja Utama (KPI)**: Total Saldo Kas, Pemasukan, Pengeluaran, Arus Kas Bersih (Net Cashflow), Tingkat Tabungan (Savings Rate %), dan Total Kekayaan Bersih (Net Worth), lengkap dengan tren naik/turun vs periode sebelumnya.
   - **5 Grafik Analisis Interaktif (Recharts)**:
     - Area chart perbandingan tren arus kas bulanan (Pemasukan vs Pengeluaran).
     - Donat komposisi pengeluaran per kategori.
     - Bar chart pengeluaran harian 14 hari terakhir.
     - Tren pertumbuhan kekayaan bersih (Net Worth) 12 bulan.
     - Bar chart 5 kategori belanja terboros.
   - **Skor Kesehatan Keuangan (0–100)**: Evaluasi objektif berbasis aturan deterministic yang menilai 4 pilar utama: rasio tabungan, kecukupan dana darurat, rasio cicilan utang (DTI), dan kepatuhan anggaran, disertai rekomendasi tindakan praktis.
   - **Panel Notifikasi Cepat**: Tagihan jatuh tempo 7 hari ke depan, transaksi terkini, progres tujuan tabungan, dan ringkasan utang.

2. **Pencatatan & Manajemen Transaksi**
   - Mendukung 3 jenis transaksi: **Pengeluaran**, **Pemasukan**, dan **Transfer Antar Dompet**.
   - Input lengkap: tanggal, nominal, kategori, subkategori, rekening dompet asal/tujuan, merchant/penerima, catatan, multi-tag label, dan unggah foto bukti struk (disimpan base64 ringan).
   - **Fitur Split Transaksi**: Bagi satu struk belanja ke beberapa kategori berbeda secara akurat.
   - **Otomatisasi Transaksi Berulang**: Harian, mingguan, bulanan, atau tahunan yang dibuat otomatis saat aplikasi dibuka.
   - Filter multi-kriteria: pencarian teks, jenis transaksi, kategori, rekening dompet, tag, rentang nominal, dan rentang tanggal.
   - Paginasi, sortir tanggal/nominal, edit & hapus massal (bulk delete).
   - **Impor & Ekspor CSV**: Ekspor transaksi ke CSV serta impor CSV eksternal dengan panduan pemetaan kolom.
   - Shortcut keyboard instan: Tekan `Ctrl + K` atau huruf `N` untuk membuka modal pencatatan kapan saja.

3. **Dompet & Rekening Bank**
   - Mendukung tipe akun: Tunai (Cash), Bank, E-Wallet (GoPay, OVO, ShopeePay), Kartu Kredit, Akun Investasi, dan Lainnya.
   - Saldo awal, warna kustom, dan mutasi riwayat per rekening.
   - **Rekonsiliasi Saldo**: Bandingkan saldo aplikasi dengan saldo buku rekening asli; selisih akan otomatis dicatat sebagai transaksi koreksi pembukuan.
   - **Manajemen Kartu Kredit**: Pemantauan limit kredit, tanggal cetak tagihan, tanggal jatuh tempo, dan persentase utilisasi limit.

4. **Anggaran Bulanan (Budgeting)**
   - Penetapan pagu anggaran per kategori dengan bilah kemajuan (progress bar) berwarna dinamis (hijau <80%, kuning peringatan 80-100%, merah overbudget >100%).
   - Fitur **Rollover**: Akumulasikan sisa anggaran bulan lalu yang tidak terpakai ke bulan berjalan.
   - **Template 50/30/20**: Generator otomatis alokasi anggaran (50% Kebutuhan Pokok, 30% Keinginan, 20% Tabungan/Investasi) berdasarkan estimasi pendapatan bulanan.
   - Tombol **Salin Anggaran Bulan Lalu** untuk kemudahan duplikasi.

5. **Tujuan Tabungan & Impian (Goals)**
   - Target nominal, tenggat waktu (deadline), dana terkumpul, dan riwayat setoran/penarikan dana.
   - Preset impian: Dana Darurat, DP Rumah, Liburan, Kendaraan, Pendidikan Anak, dan Pensiun.
   - Hitungan otomatis saran setoran bulanan yang diperlukan agar target tercapai tepat waktu.
   - Efek perayaan konfeti (confetti) saat tujuan tabungan 100% tercapai.

6. **Kewajiban Utang & Piutang**
   - Catatan pinjaman: pokok, bunga tahunan (%), tenor (bulan), angsuran per bulan, tanggal jatuh tempo, dan sisa pokok pinjaman.
   - **Jadwal Amortisasi Otomatis**: Rincian per bulan untuk angsuran, porsi pokok, dan porsi bunga.
   - Pencatatan pembayaran cicilan bulanan yang otomatis memotong saldo dompet pilihan.
   - **Simulator Pelunasan Dipercepat**: Perbandingan metode **Snowball** (efek psikologis saldo terkecil) vs **Avalanche** (matematika bunga tertinggi) beserta estimasi penghematan total bunga rupiah.
   - Tab pencatatan **Piutang** (uang Anda yang dipinjam orang lain) dengan status pelunasan.

7. **Portofolio Investasi & Aset Riil**
   - Instrumen: Saham, Reksa Dana, Emas Batangan (Antam), Kripto (Bitcoin/Ethereum), Obligasi Negara (SBN/ORI), Deposito, Properti, dan Aset Lainnya.
   - Rincian unit, harga beli rata-rata, harga pasar terkini, total nilai portofolio, dan keuntungan/kerugian (Rp & %).
   - Diagram alokasi diversifikasi portofolio.
   - **Perhitungan Net Worth Real-Time**: Total seluruh aset (kas + investasi) dikurangi sisa pokok seluruh utang aktif.

8. **Tagihan Rutin & Biaya Langganan**
   - Pengelolaan biaya langganan berulang (Listrik PLN, WiFi Indihome, Netflix, Spotify, BPJS, dll.).
   - Kalender tanggal jatuh tempo bulanan.
   - Penghitungan komitmen pengeluaran tetap per bulan dan per tahun.
   - Tombol **Tandai Lunas** satu klik yang langsung mencatat transaksi pengeluaran di dompet.

9. **Laporan, Analisis & Kalkulator Finansial**
   - Laporan resmi bulanan: ringkasan arus kas, surplus/defisit, dan rata-rata pengeluaran per hari.
   - **Heatmap Kalender Belanja**: Peta panas visual pengeluaran harian sepanjang 31 hari.
   - **Proyeksi Arus Kas 6 Bulan ke Depan** berdasarkan rata-rata historis dan transaksi rutin.
   - **4 Kalkulator Finansial**:
     1. Kalkulator Dana Darurat (sesuai jumlah tanggungan).
     2. Kalkulator Dana Pensiun (Rule of 25 / 4% Safe Withdrawal Rate).
     3. Kalkulator Bunga Majemuk (Compound Interest).
     4. Simulator Angsuran KPR Rumah.
   - **Ekspor Laporan ke PDF** via `window.print()` dengan stylesheet cetak rapi khusus A4, dan ekspor data ke format CSV.

10. **Pengaturan & Keamanan**
    - Kelola master kategori dan subkategori belanja/pemasukan.
    - **Kunci Keamanan PIN (4–6 Digit)**: Proteksi privasi menggunakan hash SHA-256 yang tersimpan di perangkat.
    - **Mode Privasi**: Sembunyikan semua nominal keuangan hanya dengan satu klik tombol mata.
    - **Siklus Tanggal Pembukuan Gajian**: Sesuaikan awal bulan keuangan (misalnya tanggal 25).
    - Tema Terang / Gelap.
    - **Cadangkan & Pulihkan Seluruh Data (JSON)**: Ekspor dan impor seluruh basis data aplikasi.
    - **Atur Ulang Data**: Tombol "Mulai dari Kosong" untuk menghapus data sampel dan mencatat data pribadi dari nol, atau "Muat Ulang Data Contoh 6 Bulan" untuk simulasi.

---

## 💻 Panduan Menjalankan Secara Lokal

Pastikan Anda telah memasang **Node.js (versi 18 atau lebih baru)** di komputer Anda.

1. **Clone repositori**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd noven-wallet
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan (development server)**:
   ```bash
   npm run dev
   ```
   Buka peramban Anda di alamat `http://localhost:3000` (atau port yang tertera di terminal).

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```
   Hasil build siap deploy akan berada di folder `dist/`.

---

## 🚀 Panduan Push ke GitHub

1. Inisialisasi git (jika belum):
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi aplikasi Noven Wallet"
   ```

2. Buat repositori baru di GitHub (misalnya bernama `noven-wallet`).

3. Hubungkan repositori lokal ke GitHub dan lakukan push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<username-anda>/noven-wallet.git
   git push -u origin main
   ```

---

## 🌐 Panduan Deploy ke Vercel

Aplikasi ini sudah dilengkapi file konfigurasi `vercel.json` dengan rewrite rute SPA.

1. Masuk ke akun [Vercel](https://vercel.com/) Anda.
2. Klik tombol **"Add New Project"** dan pilih repositori GitHub `noven-wallet`.
3. Konfigurasi proyek:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Klik tombol **"Deploy"**. Proyek Anda akan aktif dalam hitungan detik!

---

## 🔒 Catatan Privasi & Keamanan Data Pengguna

- **Privasi Mutlak**: Aplikasi ini **tidak mengirimkan data keuangan Anda ke server mana pun**. Seluruh data disimpan secara lokal pada `localStorage` peramban Anda.
- **Cadangan Berkala**: Karena data tersimpan di peramban, menghapus cache/data browser dapat menghapus catatan Anda. Sangat disarankan untuk melakukan **"Unduh Cadangan JSON"** secara berkala melalui menu **Pengaturan** > **Cadangan & Pemulihan Data**.
- **Keamanan Repositori**: Repositori GitHub publik **tidak boleh memuat data keuangan asli atau data sensitif Anda**. Gunakan data contoh yang telah disediakan untuk keperluan demo/showcase publik.
