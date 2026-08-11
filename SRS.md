# Software Requirement Specification (SRS)
## Sistem Informasi Pengelolaan Kas Kecil

### 1. Pendahuluan
Sistem Informasi Pengelolaan Kas Kecil merupakan aplikasi internal yang dikembangkan untuk Divisi PKU UPDL PLN Palembang. Sistem ini bertujuan untuk mendigitalisasi proses pencatatan pengeluaran kas kecil yang saat ini menggunakan format spreadsheet, tanpa mengubah alur kerja atau proses bisnis yang sudah berjalan.

### 2. Tujuan Sistem
- Mempermudah pencatatan pengeluaran dan monitoring saldo kas.
- Mengelola pembagian (alokasi) dana kepada pemegang dana secara transparan.
- Menghasilkan rekap bulanan berupa tabel yang siap disalin (copy) ke dokumen surat resmi.
- Menjaga kesederhanaan sistem agar familiar seperti penggunaan spreadsheet. Aplikasi ini BUKAN merupakan software akuntansi kompleks, ERP, maupun aplikasi dengan alur approval bertingkat.

### 3. Aktor Sistem
Terdapat dua aktor (role) utama dalam sistem ini:
1. **Administrator (Admin):** Memiliki kendali penuh atas sistem, termasuk alokasi dana, manajemen user, manajemen master data, dan dapat mengelola transaksi pada seluruh sumber dana.
2. **Pemegang Dana:** Pengguna yang menerima alokasi dana dan hanya dapat mengelola (melihat dan menginput) transaksi terkait sumber dana yang menjadi hak aksesnya.

### 4. Proses Bisnis
1. Setiap bulan, UPDL menerima dropping dana Kas Utama (sekitar Rp100.000.000).
2. Administrator mengalokasikan dana dari Kas Utama kepada beberapa pemegang dana (Contoh: Kas Utama → Pak Didik Rp10.000.000).
3. Setelah alokasi, saldo pemegang dana bertambah, dan saldo Kas Utama berkurang.
4. Pemegang dana menggunakan uang tersebut untuk operasional dan mencatat setiap pengeluaran, yang secara otomatis mengurangi saldo sumber dananya.
5. Transaksi juga dapat menggunakan sumber dana Kas Utama secara langsung tanpa melalui proses alokasi ke pemegang dana.
6. Pada akhir periode, sistem menghasilkan output rekap bulanan dengan format tabel yang persis seperti spreadsheet saat ini.

### 5. Konsep Entitas Sistem
Untuk menghindari interpretasi yang berbeda saat pengembangan, berikut adalah perbedaan empat entitas kunci dalam sistem:

#### Kas Utama
Merupakan sumber dana utama yang berasal dari dropping bulanan UPDL. Saldo Kas Utama dapat digunakan langsung untuk transaksi maupun dialokasikan kepada pemegang dana.

#### Sumber Dana
Merupakan akun kas yang saldonya dapat digunakan sebagai sumber transaksi. Contohnya:
- Kas Utama
- Pak Didik
- Fanhar
- Tiara
- Rezky

Setiap transaksi wajib menggunakan tepat satu sumber dana.

#### Pemegang Dana
Merupakan pegawai PKU yang bertanggung jawab terhadap satu atau lebih sumber dana.

#### User
Merupakan akun yang digunakan untuk login ke aplikasi. User mempunyai role dan hak akses tertentu terhadap sumber dana.

**Penting:** User, Pemegang Dana, dan Sumber Dana adalah tiga konsep yang berbeda dan terpisah, meskipun mungkin memiliki nama yang sama (misal: User Pak Didik, Pemegang Dana Pak Didik, Sumber Dana Pak Didik).

### 6. Hak Akses
**Administrator:**
- Login
- Melihat Dashboard
- Kelola User
- Kelola Master Data
- Melakukan Alokasi Dana
- Input transaksi (bisa memilih semua sumber dana)
- Edit transaksi
- Hapus transaksi (opsional)
- Melihat seluruh riwayat transaksi
- Melihat Rekap
- Export Excel

**Pemegang Dana:**
- Login
- Melihat saldo sendiri
- Input transaksi
- Melihat riwayat transaksi sendiri

*Catatan Sumber Dana:* Administrator dapat memilih semua sumber dana saat transaksi. Pemegang Dana hanya dapat memilih sumber dana yang menjadi hak aksesnya (Contoh: Pak Didik hanya dapat memilih "Kas Utama" atau "Pak Didik").

### 7. Daftar Fitur
- **Autentikasi:** Login pengguna.
- **Dashboard:** Ringkasan informasi keuangan sesuai hak akses.
- **Master Data:** Pengelolaan referensi data sistem.
- **Alokasi Dana:** Pemindahan saldo antar sumber dana (termasuk dari Kas Utama ke Pemegang Dana).
- **Riwayat Alokasi:** Menampilkan seluruh histori perpindahan dana antar sumber dana yang memuat informasi: Tanggal, Dari, Ke, Nominal, dan Keterangan. Riwayat alokasi bersifat permanen dan tidak boleh hilang.
- **Pencatatan Transaksi:** Input form statis layaknya baris pada spreadsheet.
- **Riwayat Transaksi:** Tabel daftar transaksi pengeluaran.
- **Detail Sumber Dana:** Halaman pusat monitoring setiap sumber dana yang menampilkan: Nama Sumber Dana, Saldo Saat Ini, Riwayat Alokasi, dan Riwayat Pengeluaran.
- **Rekapitulasi:** Tabel rekap bulanan dan fitur Export.

### 8. Flow Sistem
- **Flow Alokasi (Admin):** Menu Alokasi → Pilih Sumber Dana (Asal) → Pilih Sumber Dana Tujuan → Input Nominal → Simpan → Saldo asal berkurang & Saldo tujuan bertambah.
- **Flow Transaksi:** Menu Transaksi → Pilih Sumber Dana → Input Data → Validasi Saldo → Simpan → Saldo Berkurang → Riwayat Bertambah → Data otomatis masuk ke Rekap.

### 9. Aturan Bisnis
- Saldo pada setiap sumber dana **tidak boleh menjadi negatif**.
- Nominal transaksi pengeluaran **tidak boleh melebihi saldo** sumber dana yang dipilih.
- Setiap transaksi **wajib memiliki tepat satu sumber dana**.
- Setiap transaksi **hanya boleh mengurangi saldo dari satu sumber dana**.
- Setiap alokasi **hanya boleh memindahkan saldo antar sumber dana**.
- Saldo **selalu dihitung dari histori alokasi dan histori transaksi**, bukan diinput secara manual.
- Semua transaksi langsung tersimpan dan sah **tanpa proses approval**.
- Semua pergerakan alokasi dana wajib tercatat sebagai riwayat.
- Semua transaksi pengeluaran wajib tercatat sebagai riwayat.
- Riwayat data **tidak boleh hilang** dari sistem.
- Sistem harus dibuat sederhana dengan alur menyerupai spreadsheet yang saat ini digunakan (Fokus utama pada kemudahan pencatatan).

### 10. Struktur Menu
**Administrator:**
- Dashboard
- Transaksi
  - Input Transaksi
  - Riwayat Transaksi
- Alokasi Dana
  - Input Alokasi
  - Riwayat Alokasi
- Rekap Bulanan
- Master Data
  - Kategori Keperluan
  - Bidang / Sub Bidang
  - Pemegang Dana
  - User

**Pemegang Dana:**
- Dashboard
- Transaksi
  - Input Transaksi
  - Riwayat Transaksi

### 11. Daftar Master Data
Hanya data berikut yang dikelola sebagai master data:
- **Kategori Keperluan** (Default: Perkakas, RT Umum & Pengiriman; BBM; E-Toll; Konsumsi; Lain-lain)
- **Bidang / Sub Bidang**
- **Pemegang Dana**
- **User**

*Catatan:* "Nama Penerima" adalah text bebas dan BUKAN master data.

### 12. Spesifikasi Form
#### Form Input Transaksi
Form input bersifat statis dan semua field berikut selalu tersedia (tidak menggunakan *dynamic form*):
1. Tanggal
2. Sumber Dana (Dropdown pilihan dibatasi sesuai hak akses login)
3. Nama Penerima (Text bebas, contoh: Pak Abu, SPBU Pertamina)
4. Kategori Keperluan (Dropdown dari Master Data)
5. No Polisi / No Kartu Etoll
6. Bidang / Sub Bidang (Dropdown dari Master Data)
7. Nominal
8. Deskripsi Keperluan
9. Tanggal Kuitansi
10. Tanggal Penyerahan

#### Form Alokasi Dana
1. Tanggal
2. Sumber Dana (Asal dana)
3. Tujuan (Sumber Dana penerima)
4. Nominal
5. Keterangan

*Efek setelah disimpan:* Saldo sumber dana berkurang, saldo tujuan bertambah, riwayat alokasi tercatat.

### 13. Dashboard
**Tampilan Administrator:**
- Saldo Kas Utama
- Total Pengeluaran Bulan Ini
- Jumlah Transaksi (Bulan ini)
- Daftar Pemegang Dana beserta jumlah saldonya masing-masing
- Tabel transaksi terbaru secara global
- (*Opsional: Link ke Detail Sumber Dana*)

**Tampilan Pemegang Dana:**
- Saldo Saat Ini
- Jumlah Transaksi Bulan Ini
- 5 Transaksi Terakhir

### 14. Rekap
- Menghasilkan tampilan berupa tabel.
- Format tabel dibuat sama persis dengan format spreadsheet saat ini.
- Tabel dirancang agar rapi saat disorot dan disalin (copy) untuk dipaste ke surat resmi.
- Sistem tidak bertugas melakukan *generate* dokumen surat.

### 15. Audit Trail & Metadata
Setiap transaksi dan alokasi dalam sistem minimal menyimpan informasi metadata berikut untuk keperluan pelacakan (*Audit Trail*):
- `Created By` (Siapa yang membuat data)
- `Created At` (Kapan data dibuat)
- `Updated By` (Siapa yang terakhir mengubah data)
- `Updated At` (Kapan data terakhir diubah)

Audit trail ini sangat penting untuk mengetahui siapa yang membuat atau mengubah data, terutama ketika administrator membantu menginput transaksi milik pemegang dana.

### 16. Catatan Implementasi
- Jauhkan desain dari pola pikir aplikasi akuntansi rumit (jurnal ganda, dsb).
- Utamakan performa input yang cepat (seperti *data entry* di Excel).

---
> [!TIP]
> **Saran Pengembangan Masa Depan (Di luar lingkup saat ini)**
> - Menerapkan *Soft-Delete* pada database jika fitur hapus transaksi diaktifkan, agar riwayat tetap terlacak dan memenuhi aturan bisnis "riwayat tidak boleh hilang".
> - Fitur unggah (upload) foto struk/kuitansi digital jika ke depan UPDL menginginkan pengarsipan *paperless*.
> - Fitur duplikasi transaksi (*copy as new*) untuk mempercepat input transaksi rutin yang berulang.
