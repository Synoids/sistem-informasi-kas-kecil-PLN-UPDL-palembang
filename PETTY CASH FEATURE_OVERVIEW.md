# Gambaran Fitur Sistem Informasi Kas Kecil (Petty Cash)

Dokumen ini merupakan hasil audit terbaru dan komprehensif terhadap sistem yang sedang berjalan. Fitur-fitur di bawah ini mencerminkan fungsionalitas yang **benar-benar telah tersedia** dalam aplikasi. Dokumen ini dirancang untuk memudahkan pemahaman pengguna terhadap cara kerja sistem, batasan aturan bisnis, dan kapabilitas yang ditawarkan.

---

## 1. Manajemen Hak Akses (Role & Access Control)
Sistem menggunakan kontrol akses berbasis peran (*Role-Based Access Control*) yang memisahkan wewenang secara tegas.
- **Admin Utama (ADMIN):** Memiliki kendali penuh. Dapat mengakses pengaturan dasar (Master Data), menyetujui reimbursement NKK, membatalkan transaksi (Log Sampah), serta memantau seluruh arus kas dari semua sumber dana.
- **Pemegang Dana (USER):** Memiliki akses fungsional terbatas. Hanya dapat melakukan input transaksi, melihat riwayat transaksi miliknya sendiri, dan mengekspor laporan rekapitulasi yang khusus untuk sumber dana yang ditugaskan kepadanya.

---

## 2. Fitur Modul Utama (Tersedia & Berjalan Penuh)

### A. Dashboard Utama
Pusat informasi harian yang memberikan ringkasan kesehatan kas kecil secara *real-time*.
- **Ringkasan Keuangan:** Menampilkan Pagu Anggaran (total dana awal periode), Total Belanja Operasional, dan Sisa Saldo saat ini.
- **Indikator Batas Aman (Warning Limit):** Dilengkapi dengan progress bar berwarna yang akan otomatis berubah menjadi merah jika sisa saldo mendekati batas menipis, memberikan peringatan visual bagi pengguna.
- **Riwayat Terbaru:** Menampilkan tabel 5 transaksi terakhir yang dicatat dalam sistem.

### B. Transaksi Kas Kecil
Modul inti untuk mencatat uang keluar (pengeluaran operasional).
- **Input Transaksi:** Formulir pengisian pengeluaran yang divalidasi dengan ketat. Pengguna wajib mengisi informasi dasar dan dapat langsung melampirkan kuitansi.
- **Unggah & Pembaruan Kuitansi (Upload Belakangan):** Kuitansi dapat diunggah belakangan! Pengguna cukup menekan tombol "Edit" pada transaksi di Riwayat, lalu melampirkan bukti. 
- **Kompresi Kuitansi Otomatis:** Sistem secara pintar mengompres gambar kuitansi langsung dari perangkat Anda sebelum dikirim, menghemat kuota internet dan mempercepat proses *upload*, namun tetap menjaga agar gambar bisa dibaca dengan baik. Format yang didukung: JPG, PNG, dan PDF (maks 5MB).
- **Riwayat Transaksi:** Tabel rekam jejak yang bisa dicari (berdasarkan nama/deskripsi) dan disaring (berdasarkan Periode, Sumber Dana, atau Kategori).
- **Log Sampah & Pembatalan (Khusus Admin):** Jika terjadi kesalahan, Admin dapat membatalkan transaksi selama periode keuangannya masih buka (*OPEN*). Transaksi akan dipindahkan ke "Log Sampah" dengan nominal Rp 0 dan diberi catatan alasan batal. Ini menjaga integritas jejak audit tanpa mengganggu sisa saldo.

### C. Pengelolaan Transaksi di Periode Tutup (CLOSED)
Sistem memiliki pengamanan ketat terhadap periode keuangan bulanan.
- **Data Finansial Terkunci:** Jika Admin telah menutup sebuah periode (*CLOSED*), maka tidak ada satupun pengguna (termasuk Admin) yang bisa mengubah nominal uang, membatalkan transaksi, atau menambah tagihan baru di periode tersebut.
- **Pengecualian Administrasi:** Meski data keuangannya terkunci, pengguna **tetap diizinkan mengunggah atau memperbarui file kuitansi** pada transaksi di periode tersebut.

### D. Transaksi Non-Kas Kecil (NKK) & Reimbursement
Modul untuk menangani pengeluaran besar di luar siklus kas kecil harian (dana talangan).
- **Klaim Baru:** Pegawai dapat merekam tagihan NKK dan menyertakan bukti potretnya.
- **Reimbursement Otomatis (Khusus Admin):** Admin dapat menyetujui klaim NKK. Sistem secara otomatis akan mencairkan dana tersebut dengan membuat transaksi di Kas Kecil, memotong sisa saldo, dan **menyalin file kuitansi secara otomatis** dari klaim awal ke dalam transaksi Kas Kecil tanpa perlu mengunggah ulang.

### E. Alokasi / Pendanaan (Top-Up)
- **Input Alokasi Dana:** Mencatat masuknya suntikan dana baru (pagu bulanan/top-up) ke dalam brankas atau rekening Kas Kecil tertentu.
- **Riwayat Alokasi:** Tabel pemantauan seluruh riwayat aliran dana masuk.

### F. Rekapitulasi & Pelaporan
Pusat pembuatan laporan bulanan untuk Surat Pertanggungjawaban (SPJ).
- **Laporan Bulanan:** Meringkas total saldo awal, uang keluar, dan sisa per bulan untuk setiap sumber dana.
- **Ekspor Cepat (Copy to Excel):** Dilengkapi tombol pintar "Copy Table". Pengguna cukup mengklik tombol tersebut lalu menekan *Paste* di Microsoft Excel. Tabel, garis, dan angkanya akan tertata rapi secara instan.

### G. Master Data (Khusus Admin)
Ruang kendali untuk mengatur fondasi aturan aplikasi.
- **Manajemen Periode Keuangan:** Menentukan siklus bulan operasional. (Sistem menjaga agar hanya boleh ada maksimal 1 periode yang berstatus aktif/OPEN).
- **Sumber Dana & PIC:** Mendaftarkan kas/bank baru dan menunjuk siapa user/pegawai yang bertanggung jawab memegang kas tersebut (Pemegang Dana).
- **Kategori & Divisi:** Mengelola label pengeluaran agar pelaporan seragam.
- **Manajemen Pengguna:** Menambah akun *login* baru dan mengatur status keaktifannya.

### H. Fitur UX Pendukung
- **Page Guide (Panduan Layar):** Tersedia tombol bantuan (berikon `?`) di seluruh halaman utama aplikasi (Dashboard, Master, Transaksi, Rekap). Saat diklik, laci menu interaktif akan meluncur memberikan panduan *step-by-step* untuk menggunakan halaman tersebut.

---

## 3. Fitur Terbatas / Aturan Penggunaan

- **Hapus Permanen Transaksi (Hard Delete):** Sistem melarang penghapusan data secara fisik demi alasan keamanan finansial dan jejak audit. Penghapusan selalu menggunakan mode **Pembatalan (Soft Delete)** sehingga jejaknya tersimpan abadi di "Log Sampah".

---

## 4. Fitur Belum Tersedia / Rencana Mendatang
Berikut adalah daftar fitur yang sering ditanyakan namun **belum tersedia** pada versi aplikasi saat ini:
- **Cetak Laporan PDF Otomatis:** Sistem belum mendukung *generate* PDF laporan secara utuh dengan kop surat instansi. Laporan masih diandalkan via fitur *Copy to Excel* untuk diformat dan dicetak manual oleh admin.
- **Notifikasi Pesan (Email/WhatsApp):** Sistem belum terhubung ke penyedia layanan pesan pihak ketiga untuk mengirimkan *alert* saldo secara otomatis ke *handphone*. Peringatan limit baru bersifat visual (warna UI berubah di dalam aplikasi).
- **Grafik / Chart Interaktif:** Tampilan visualisasi data *chart* (seperti diagram lingkaran/batang) belum diterapkan di *Dashboard*.
