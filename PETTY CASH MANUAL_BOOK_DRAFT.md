# Manual Book: Sistem Informasi Kas Kecil (Petty Cash)
**Unit Induk Pembelajaran dan Pengembangan (UPDL) Palembang**
*Versi Dokumen: 1.0 (Draft Kerangka)*

Selamat datang di Panduan Penggunaan Sistem Informasi Kas Kecil (Petty Cash) UPDL Palembang. Panduan ini disusun untuk membantu Anda memahami, menggunakan, dan memaksimalkan seluruh fitur aplikasi dalam pencatatan dan pelaporan keuangan harian instansi.

---

## 1. Mengenal Sistem

### Gambaran Singkat Sistem
Sistem Informasi Kas Kecil (Petty Cash) adalah aplikasi berbasis web yang dirancang untuk merapikan, memantau, dan mendokumentasikan setiap arus uang keluar yang bersifat operasional. 

### Tujuan & Masalah yang Diselesaikan
Sebelumnya, pencatatan kas kecil mungkin dilakukan secara manual atau tersebar di berbagai dokumen Excel. Sistem ini hadir untuk memusatkan pencatatan, mempermudah pembuatan rekapitulasi akhir bulan, serta memastikan setiap pengeluaran memiliki jejak bukti (kuitansi) yang dapat dipertanggungjawabkan secara rapi.

### Konsep Dasar Kas Kecil
Dalam sistem ini, uang dikelola dalam "Sumber Dana" (misal: Brankas atau Rekening Bank). Setiap bulannya, terdapat "Periode Keuangan" yang membatasi kapan uang bisa dikeluarkan (Pagu Anggaran). Pengeluaran rutin dicatat langsung, sedangkan pengeluaran dana talangan dicatat melalui fitur Non-Kas Kecil (NKK).

### Alur Umum Penggunaan
1. **Admin** menyiapkan Periode, Pagu, dan Sumber Dana di awal bulan.
2. **Pemegang Dana / User** mencatat transaksi pengeluaran sehari-hari dan mengunggah foto kuitansinya.
3. Di akhir bulan, **Admin** mengekspor laporan rekapitulasi dan menutup periode.

---

## 2. Role dan Hak Akses

Aplikasi ini membagi wewenang ke dalam dua jenis peran (*role*) pengguna untuk menjaga keamanan data.

| Fitur / Hak Akses | Admin Utama (ADMIN) | Pemegang Dana (USER) |
| :--- | :---: | :---: |
| Akses Dashboard (Ringkasan Saldo) | Semua Sumber Dana | Hanya Sumber Dana miliknya |
| Input & Edit Transaksi | Ya | Ya (Sesuai Sumber Dana) |
| Batalkan Transaksi (Log Sampah) | Ya | Tidak |
| Reimbursement / NKK | Ya (Bisa Menyetujui) | Hanya Input Klaim |
| Mengelola Master Data | Ya | Tidak |
| Top-Up Alokasi Dana | Ya | Tidak |

*Catatan: Batasan ini secara otomatis mencegah User melihat atau mengubah data kas yang bukan menjadi tanggung jawabnya.*

---

## 3. Langkah Awal Penggunaan (Onboarding & Setting Awal)

Bagi **Admin**, saat pertama kali menggunakan sistem atau pada setiap awal bulan, ikuti urutan wajib berikut:

1. **Buat Periode Baru:** Masuk ke menu `Master Data -> Periode`, lalu buat periode untuk bulan berjalan.
2. **Suntikkan Modal Awal (Pagu):** Setelah periode berstatus OPEN, pada kartu Periode tersebut akan muncul form **Pendanaan (Funding)**. Masukkan *Nominal Pagu* (modal awal bulan dari pusat) dan klik *Beri Pendanaan*. Sistem otomatis akan memindahkan dana ini ke Kas Utama. *(Catatan: Proses ini hanya bisa dilakukan 1x per periode).*
3. **Buat Sumber Dana Turunan (Opsional):** Buat sumber dana tambahan jika uang fisik dipecah ke beberapa brankas/rekening.
4. **Alokasikan Dana:** Pindahkan uang dari Kas Utama ke sumber dana turunan melalui menu `Alokasi Dana`.
5. **Atur Pengguna & Hak Akses:** Buat akun untuk pemegang dana. **⚠️ SANGAT PENTING:** Setelah profil dibuat, Admin *wajib* mengklik tombol **Kelola Akses** dan mencentang sumber dana yang boleh dikelola oleh pengguna tersebut. Tanpa akses ini, saldo pengguna akan selalu kosong!

---

## 4. Memulai Sistem

### Login ke Aplikasi
1. Buka tautan aplikasi melalui *browser* Anda.
2. Masukkan *Email* dan *Password* yang telah didaftarkan oleh Admin.
3. Klik tombol **Login**.

`[SCREENSHOT: Halaman Login]`

### Mengenal Tampilan Awal & Navigasi
Setelah berhasil masuk, Anda akan melihat bilah menu (Navigasi) di sebelah kiri layar. Jika Anda membutuhkan panduan spesifik per halaman, Anda dapat selalu menekan laci panduan `(?)` di sebelah judul halaman.

`[SCREENSHOT: Tampilan Navigasi Kiri]`

### Cara Keluar (Logout)
Untuk menjaga keamanan, pastikan Anda selalu keluar setelah selesai menggunakan aplikasi.
1. Klik nama profil Anda di sudut kanan bawah layar.
2. Pilih opsi **Logout**.

---

## 4. Dashboard (Pusat Informasi)

Dashboard adalah halaman pertama yang Anda lihat, menyajikan ringkasan kesehatan keuangan saat ini.

* **Pagu Anggaran:** Total ketersediaan uang di awal bulan.
* **Total Belanja:** Jumlah uang yang sudah terpakai hingga saat ini.
* **Sisa Saldo:** Uang yang masih bisa digunakan.
* **Warning Limit (Indikator Batas):** Bar berwarna di bawah saldo. Jika saldo menipis, warna bar akan berubah menjadi peringatan (merah).
* **Riwayat Terbaru:** Tabel di bagian bawah menampilkan 5 pengeluaran terakhir yang baru saja diinput.

`[SCREENSHOT: Dashboard dengan Anotasi pada setiap Kartu Statistik]`

---

## 5. Transaksi Kas Kecil

Bagian ini adalah kegiatan yang paling sering Anda lakukan: mencatat pengeluaran.

### Cara Membuat Transaksi Baru
1. Buka menu **Input Transaksi**.
2. Isi formulir yang tersedia dengan lengkap:
   * Pilih Tanggal dan Sumber Dana.
   * Masukkan Nama Penerima dan Kategori pengeluaran.
   * Isi Nominal uang yang dikeluarkan.
3. **Upload Kuitansi Langsung:** Klik pada kotak unggah file, lalu pilih foto/PDF bukti kuitansi (Maks. 5MB). Sistem akan otomatis memperkecil ukuran foto Anda (kompresi) agar proses simpan lebih cepat.
4. Klik **Simpan Transaksi**.

`[SCREENSHOT: Form Input Transaksi]`

### Cara Mengubah Data Transaksi & Upload Kuitansi Susulan
Jika Anda salah memasukkan nominal, salah mengetik deskripsi, atau baru ingin mengunggah foto kuitansi belakangan:

1. Buka menu **Riwayat Transaksi**.
2. Cari transaksi Anda, lalu klik tombol **Edit** (ikon pensil).
3. Anda **DAPAT** mengubah Nominal, Deskripsi, dan rincian transaksi lainnya **asalkan** Periode bulanan tersebut masih berstatus **OPEN**. (Perubahan Anda akan memotong/mengembalikan saldo secara otomatis).
4. Di bagian bawah formulir, unggah foto kuitansi Anda.
5. Klik **Simpan Perubahan**.

> **⚠️ Aturan Keamanan:** Jika Periode sudah ditutup (**CLOSED**), Anda tidak dapat mengubah data nominal dan deskripsi lagi demi menjaga integritas data keuangan. Anda hanya diizinkan untuk mengunggah kuitansi susulan.

`[SCREENSHOT: Tombol Edit pada Riwayat Transaksi]`

### Mencari dan Memfilter Transaksi
1. Buka menu **Riwayat Transaksi**.
2. Gunakan baris pencarian untuk mencari nama toko atau deskripsi spesifik.
3. Gunakan *dropdown* filter di atas tabel untuk menyaring berdasarkan **Periode**, **Sumber Dana**, atau **Kategori**.

`[SCREENSHOT: Baris Pencarian dan Filter Tabel]`

### Memahami Status Kuitansi
Pada tabel riwayat, Anda akan melihat label status kuitansi:
* **⚠️ Blm Kuitansi:** Transaksi dicatat tapi bukti foto belum diunggah.
* **✓ Kuitansi:** Transaksi sudah memiliki lampiran bukti valid.

---

## 6. Pembatalan Transaksi & Log Sampah (Khusus Admin)

Jika terjadi kesalahan fatal dalam input data, Admin dapat membatalkan transaksi. Aplikasi ini **tidak menghapus data secara fisik (permanen)** demi menjaga jejak audit keuangan.

### Cara Membatalkan Transaksi
1. Buka menu **Riwayat Transaksi**.
2. Klik baris transaksi yang salah (layar detail akan muncul).
3. Klik tombol merah **Batalkan**.
4. Masukkan alasan pembatalan, lalu konfirmasi.

`[SCREENSHOT: Modal Pembatalan Transaksi]`

### Apa yang Terjadi Setelah Dibatalkan?
* Nominal transaksi tersebut diubah menjadi **Rp 0**. Uang yang tadinya keluar akan otomatis kembali utuh ke saldo kas.
* Transaksi tersebut akan pindah dan terekam selamanya di mode **Log Sampah** dengan label "DIBATALKAN".
* **Syarat Penting:** Transaksi hanya bisa dibatalkan jika Periode bulanan tersebut masih berstatus **OPEN**.

---

## 7. Periode Keuangan (Buka/Tutup Buku)

Sistem bekerja berdasarkan siklus bulan berjalan (Periode).

### Periode OPEN
* Hanya boleh ada **satu** periode yang berstatus OPEN pada satu waktu.
* Semua aktivitas finansial (input transaksi, top-up, pembatalan) hanya bisa dilakukan pada periode ini.

### Periode CLOSED (Tutup Buku)
* Jika bulan berganti, Admin akan mengubah status periode menjadi **CLOSED**.
* **Terkunci:** Tidak ada seorang pun yang bisa menambah, mengubah nominal, atau membatalkan transaksi pada periode CLOSED.
* **Pengecualian:** Anda **tetap diperbolehkan** untuk mengunggah atau melengkapi foto kuitansi pada transaksi di periode CLOSED melalui tombol Edit.

`[SCREENSHOT: Peringatan Periode CLOSED pada halaman Edit]`

---

## 8. Transaksi Non-Kas Kecil (NKK) & Reimbursement

Gunakan NKK untuk tagihan dalam jumlah sangat besar yang ditalangi lebih dulu.

### Cara Membuat Klaim NKK
1. Masuk ke menu **Non-Kas Kecil** > **Klaim Baru**.
2. Isi formulir dan wajib lampirkan bukti kuitansinya.
3. Status klaim Anda akan menjadi **BELUM DIGANTI**.

`[SCREENSHOT: Form Klaim NKK]`

### Proses Reimbursement Otomatis (Khusus Admin)
1. Admin membuka daftar NKK, klik klaim yang diajukan, lalu tekan **Reimburse (Ganti Uang)**.
2. Admin memilih uang tersebut akan dicairkan dari Sumber Dana yang mana.
3. Sistem akan **otomatis memotong saldo kas**, membuat rekam transaksi kas kecilnya, dan **menyalin foto kuitansi** NKK tadi ke transaksi kas tanpa perlu diunggah ulang. Status akan berubah menjadi **SUDAH DIGANTI**.

`[SCREENSHOT: Proses Reimbursement oleh Admin]`

---

## 9. Alokasi / Top-Up Dana

Fitur untuk mencatat uang masuk (suntikan dana baru) ke kas.

### Menambahkan Top-Up Dana
1. Buka menu **Alokasi Dana**.
2. Pilih Sumber Kas yang akan dituju.
3. Masukkan nominal uang yang masuk beserta keterangannya.
4. Saldo kas tersebut akan otomatis bertambah secara *real-time*.

`[SCREENSHOT: Form Alokasi Dana]`

---

## 10. Rekapitulasi & Pelaporan

Halaman ini digunakan di akhir bulan untuk menarik laporan pertanggungjawaban (SPJ).

### Cara Mengambil Laporan (Export to Excel)
1. Buka menu **Rekapitulasi**.
2. Pilih filter Bulan, Tahun, dan Sumber Dana yang ingin dilaporkan.
3. Sistem akan memunculkan ringkasan Saldo Awal, Total Belanja, dan Sisa Saldo di bagian atas tabel.
4. Klik tombol **Export Excel** di sebelah deretan filter pencarian.
5. File laporan Excel (.xlsx) akan otomatis terunduh ke komputer Anda dengan format dan kop standar yang sudah tertata rapi.

`[SCREENSHOT: Halaman Rekapitulasi menyorot tombol Export Excel]`

---

## 11. Master Data (Khusus Admin)

Halaman pusat pengaturan (hanya bisa diakses oleh Admin). Terdapat 6 sub-menu di bagian ini:

* **Periode:** Tempat untuk membuat bulan baru, mengatur tanggal, menetapkan nominal batas Pagu, dan menutup periode (*Close*).
* **Pemegang Dana:** Tempat mendaftarkan nama-nama pegawai yang diberi wewenang/tanggung jawab untuk mengelola uang kas kecil.
* **Kategori:** Mengelola daftar label jenis pengeluaran (misal: "Konsumsi", "ATK") agar laporan seragam.
* **Bidang / Divisi:** Mengelola daftar nama divisi atau unit kerja yang melakukan pengeluaran.
* **Sumber Dana:** Tempat mendaftarkan nama bank/brankas (dompet) dan menautkannya dengan Pemegang Dana.
* **Users & Akses:** Tempat menambahkan akun login pegawai baru, mematikan akun (*non-aktif*), atau mengatur peran (Admin/User).

`[SCREENSHOT: Halaman Master Data menampilkan 6 tab menu]`

---

## 12. Page Guide (Panduan Layar Otomatis)

Jika Anda lupa cara kerja sebuah halaman, Anda tidak perlu selalu kembali ke buku manual ini!
1. Perhatikan sudut kanan atas di hampir setiap halaman aplikasi (misal di Dashboard atau Riwayat).
2. Terdapat ikon tanda tanya bulat **(?)**.
3. Klik ikon tersebut, dan sebuah laci panduan singkat akan meluncur muncul untuk memandu langkah Anda di halaman tersebut.

`[SCREENSHOT: Page Guide Laci Terbuka]`

---

## 13. Aturan Penting Sistem

Mohon ingat 6 aturan emas (aturan bisnis) yang dijaga ketat oleh aplikasi ini:
1. **Hanya boleh ada MAKSIMAL 1 Periode OPEN** pada waktu yang bersamaan.
2. **Periode CLOSED mengunci data uang.** Perubahan nominal transaksi di periode tutup buku ditolak oleh sistem.
3. **Hard delete dilarang keras.** Anda tidak akan menemukan tombol "Hapus Permanen" dimanapun.
4. **Pembatalan memulihkan saldo.** Pembatalan (Soft Delete) mengembalikan sisa saldo, namun jejaknya tersimpan abadi di Log Sampah.
5. **Kuitansi menyusul diperbolehkan,** bahkan saat periode finansialnya sudah berstatus CLOSED.
6. **Hak Akses dibatasi secara tegas.** Pengguna biasa (User) sama sekali tidak dapat mengakses Master Data ataupun melihat lalu lintas uang milik orang lain.

---

## 14. Fitur yang Belum Tersedia

Untuk menghindari kebingungan saat mencari tombol fitur, kami informasikan bahwa fitur-fitur di bawah ini **belum didukung** pada versi aplikasi saat ini:
* ❌ **Cetak Laporan PDF Otomatis:** Saat ini, ekspor PDF dengan kop surat belum tersedia. Harap gunakan fitur *Copy to Excel* untuk mencetak laporan.
* ❌ **Notifikasi WhatsApp/Email:** Aplikasi belum terhubung ke sistem pesan otomatis. Peringatan saldo limit hanya dapat dilihat ketika Anda membuka aplikasi.
* ❌ **Grafik/Chart Interaktif:** Visualisasi data masih berupa angka pada kartu informasi (belum menggunakan diagram lingkaran/batang).

---

## 15. FAQ / Pertanyaan yang Sering Diajukan (Troubleshooting)

**T: Mengapa saya tidak bisa mengedit nominal transaksi?**
J: Periksa status transaksinya. Jika periode keuangannya sudah berstatus "CLOSED", sistem secara otomatis mengunci perubahan angka/nominal. Anda hanya diizinkan memperbarui lampiran foto kuitansi.

**T: Mengapa saya tidak menemukan Sumber Dana atau Bank tertentu saat akan input transaksi?**
J: Jika Anda adalah pengguna biasa (User), sistem hanya memunculkan Sumber Dana yang secara spesifik ditugaskan kepada Anda oleh Admin. Silakan hubungi Admin jika ada Sumber Dana yang belum dimasukkan ke akun Anda.

**T: Bagaimana jika saya lupa memfoto atau mengunggah kuitansi saat input?**
J: Tidak masalah! Anda bisa menambahkan kuitansinya belakangan melalui menu *Riwayat Transaksi*, lalu menekan tombol *Edit* (ikon pensil) pada transaksi yang bersangkutan.

**T: Apa yang terjadi jika saya salah input pengeluaran?**
J: Harap laporkan kepada Admin Anda. Admin memiliki wewenang untuk menekan tombol "Batalkan Transaksi". Dana akan otomatis kembali ke saldo Anda, dan transaksi yang salah tersebut akan masuk ke Log Sampah (tidak dihapus hilang).

---

## 16. Penutup

Sistem Informasi Kas Kecil (Petty Cash) ini dirancang semudah mungkin untuk membantu tertib administrasi Anda. 
Biasakan untuk selalu mengisi data dengan sebenar-benarnya dan langsung mengunggah foto kuitansi untuk menghindari pekerjaan yang menumpuk di akhir bulan.

*Jika Anda menghadapi kendala teknis (sistem error) yang tidak dijelaskan dalam panduan ini, silakan hubungi tim Helpdesk/Admin Utama UPDL Palembang.*

`[PLACEHOLDER: Kontak / Email / Nomor Helpdesk]`
