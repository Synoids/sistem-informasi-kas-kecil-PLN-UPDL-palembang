# Database Design Document (DDD)
## Sistem Informasi Pengelolaan Kas Kecil

### 1. Filosofi Desain Database
Desain database ini dibangun berdasarkan prinsip-prinsip berikut:
- **Mengikuti Proses Bisnis:** Database dirancang untuk mencerminkan proses bisnis di dunia nyata (dropping dana → alokasi → pengeluaran), bukan sekadar meniru bentuk fisik *spreadsheet*.
- **Histori adalah *Source of Truth*:** Saldo sumber dana **tidak** diinput atau disimpan secara statis secara manual. Saldo adalah hasil kalkulasi murni dari total dana masuk (alokasi masuk) dikurangi total pengeluaran (alokasi keluar + transaksi pengeluaran).
- **Single Source of Truth untuk Transaksi:** Satu transaksi pengeluaran dipastikan hanya memotong saldo dari satu sumber dana. Satu alokasi dana dipastikan hanya memindahkan nilai antar dua sumber dana.
- **Integritas Data Sejarah:** Riwayat mutasi (alokasi dan transaksi) bersifat kekal (permanen) untuk menjaga keabsahan perhitungan saldo setiap saat.
- **Kesederhanaan dan Pemeliharaan (KISS):** Menghindari *over-engineering* seperti tabel *ledger* / jurnal ganda kompleks, karena sistem ini bukan aplikasi akuntansi murni, melainkan sistem manajemen kas kecil.

---

### 2. Daftar Entitas
Berikut adalah entitas-entitas yang membentuk sistem ini:

1. **`profiles`**: Menyimpan data profil tambahan untuk *user* yang login. Menggantikan entitas `users` agar sejalan dengan *best practice* Supabase (data autentikasi seperti email dan password tetap berada di skema aman `auth.users`). Diperlukan untuk menyimpan role dan data diri aplikasi.
2. **`fund_holders`**: Master data Pegawai PKU (Pemegang Dana) yang bertanggung jawab memegang kas fisik. Diperlukan sebagai informasi penanggung jawab dana.
3. **`cash_sources`**: Entitas akun kas fisik maupun logis (seperti Kas Utama, Kas Pak Didik). Ini adalah "wadah" uang. Diperlukan karena setiap transaksi akan memotong saldo dari wadah ini.
4. **`user_cash_source_access`**: Tabel *mapping* untuk mengatur sumber dana mana saja yang berhak diakses (dilihat/diinput) oleh suatu *Profile/User*. Diperlukan untuk memenuhi kebutuhan hak akses yang spesifik.
5. **`categories`**: Master data kategori keperluan (BBM, E-Toll, dll). Diperlukan untuk standarisasi laporan.
6. **`divisions`**: Master data bidang atau sub bidang. Diperlukan untuk pengelompokan laporan.
7. **`allocations`**: Mencatat histori perpindahan dana antar *Cash Source*. Diperlukan untuk melacak asal muasal saldo masuk dan keluar.
8. **`transactions`**: Mencatat detail setiap pengeluaran kas kecil. Diperlukan sebagai inti pencatatan pengeluaran sistem.

---

### 3. Detail Setiap Entitas

#### `profiles`
Menyimpan informasi pengguna aplikasi yang terintegrasi dengan Supabase Auth.
**Primary Key:** `id`
**Foreign Key:** `id` references `auth.users(id)`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | Relasi ke `auth.users` Supabase |
| full_name | String | No | Nama lengkap pengguna |
| role | String | No | Dibatasi: 'ADMIN' atau 'USER' |
| created_at | Timestamp | No | Default: now() |
| updated_at | Timestamp | No | Default: now() |

*Alasan Desain (Best Practice Supabase):* Menggunakan tabel `profiles` terpisah dari Supabase Auth (`auth.users`) adalah praktik standar. Supabase sudah mengelola email, password, dan keamanan *login* di `auth.users`. Tabel `profiles` ini hanya berfungsi untuk menyimpan data profil tambahan aplikasi (*full name*, *role*).

#### `fund_holders`
Master data pemegang dana (pegawai).
**Primary Key:** `id`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| name | String | No | Nama Pegawai |
| employee_id | String | Yes | NIP (Opsional) |
| is_active | Boolean | No | Default: true |

#### `cash_sources`
Wadah penampung saldo kas.
**Primary Key:** `id`
**Unique Constraint:** `code`
**Foreign Key:** `fund_holder_id` references `fund_holders(id)`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| code | String | No | Kode unik permanen (contoh: MAIN, DIDIK, FANHAR) |
| name | String | No | Nama sumber dana (Kas Utama, Kas Pak Didik) |
| type | String | No | Dibatasi: 'MAIN' (Utama) atau 'INDIVIDUAL' |
| fund_holder_id | UUID | Yes | Pemegang dana penanggung jawab (bisa null untuk Kas Utama) |
| is_active | Boolean | No | Default: true |

#### `user_cash_source_access`
Tabel *mapping* hak akses user terhadap sumber dana.
**Primary Key:** `user_id`, `cash_source_id`
**Foreign Key:** `user_id` references `profiles(id)`, `cash_source_id` references `cash_sources(id)`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| user_id | UUID | No | |
| cash_source_id | UUID | No | |

#### `categories`
Master data kategori pengeluaran.
**Primary Key:** `id`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| name | String | No | BBM, Konsumsi, dll |
| is_active | Boolean | No | Default: true |

#### `divisions`
Master data Bidang / Sub Bidang.
**Primary Key:** `id`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| name | String | No | Nama Bidang/Sub Bidang |
| is_active | Boolean | No | Default: true |

#### `allocations`
Riwayat transfer/dropping/alokasi uang.
**Primary Key:** `id`
**Foreign Key:** `source_id`, `destination_id` references `cash_sources(id)`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| date | Date | No | Tanggal alokasi |
| source_id | UUID | No | Sumber dana asal |
| destination_id | UUID | No | Sumber dana tujuan |
| amount | Decimal | No | Nominal uang yang dialokasikan |
| description | String | Yes | Keterangan alokasi |
| created_by | UUID | No | Profile ID pembuat data |
| created_at | Timestamp | No | Default: now() |
| updated_by | UUID | No | Profile ID pengubah terakhir |
| updated_at | Timestamp | No | Default: now() |

#### `transactions`
Pencatatan pengeluaran / kuitansi.
**Primary Key:** `id`
**Foreign Key:** `cash_source_id` references `cash_sources`, `category_id` references `categories`, `division_id` references `divisions`
| Nama | Tipe Data | Nullable | Keterangan |
|---|---|---|---|
| id | UUID | No | |
| date | Date | No | Tanggal transaksi |
| cash_source_id | UUID | No | Sumber dana yang dipotong saldonya |
| recipient_name | String | No | Text bebas (Toko, Orang) |
| category_id | UUID | No | |
| vehicle_number | String | Yes | No Polisi / No Etoll (Opsional) |
| division_id | UUID | No | |
| amount | Decimal | No | Nominal pengeluaran |
| description | String | Yes | Deskripsi keperluan |
| receipt_date | Date | No | Tanggal Kuitansi |
| handover_date | Date | No | Tanggal Penyerahan |
| created_by | UUID | No | Profile ID pembuat data |
| created_at | Timestamp | No | Default: now() |
| updated_by | UUID | No | Profile ID pengubah terakhir |
| updated_at | Timestamp | No | Default: now() |

---

### 4. Relasi Antar Entitas
- `Profile` **(1..N)** `UserCashSourceAccess` **(N..1)** `CashSource`
  *(Satu Profile bisa mengakses banyak Cash Source, satu Cash Source bisa diakses beberapa Profile)*
- `FundHolder` **(1..N)** `CashSource`
  *(Satu Pemegang Dana bisa bertanggung jawab atas banyak Cash Source)*
- `CashSource` **(1..N)** `Allocation (sebagai Source)`
- `CashSource` **(1..N)** `Allocation (sebagai Destination)`
- `CashSource` **(1..N)** `Transaction`
- `Category` **(1..N)** `Transaction`
- `Division` **(1..N)** `Transaction`

---

### 5. Data Flow
- **Login:** Autentikasi dilakukan via Supabase Auth (`auth.users`), sistem mengambil profil dan *role* dari tabel `profiles`, dan mencari sumber dana yang berhak diakses dari tabel `user_cash_source_access`.
- **Alokasi Dana:** Admin memilih Sumber dan Tujuan (dari tabel `cash_sources`). Sistem memvalidasi saldo sumber. Jika valid, row baru tersimpan di tabel `allocations`.
- **Input Transaksi:** User/Admin memilih `cash_source_id` (hanya yang dia miliki hak aksesnya). Sistem memvalidasi saldo. Jika valid, row baru tersimpan di tabel `transactions`.
- **Rekap:** Sistem melakukan query `JOIN` antara tabel `transactions`, `cash_sources`, `categories`, dan `divisions` dan difilter per bulan (tanpa perlu tabel agregat terpisah karena jumlah data harian tidak akan se-masif *e-commerce*).

---

### 6. Aturan Integritas Data
- `amount` pada `transactions` maupun `allocations` **wajib > 0**.
- `source_id` dan `destination_id` pada `allocations` **tidak boleh sama**.
- Tidak boleh menghapus data referensi master (Category, Division) jika sudah terpakai di `transactions` (Gunakan implementasi pembatasan via *Foreign Key constraint* atau *Soft Delete/is_active = false*).
- Saldo (yang dihitung secara dinamis) **tidak boleh negatif** (< 0). Validasi ini harus dilakukan pada level aplikasi *backend/middleware* sebelum melakukan perintah `INSERT`.
- Hak akses: API harus memastikan ID `cash_source_id` pada payload `transactions` terdaftar di `user_cash_source_access` untuk User ID (`profiles.id`) yang bersangkutan.

**Penggunaan Nilai Terbatas (ENUM / CHECK Constraint):**
Beberapa atribut memiliki nilai yang sangat spesifik dan terbatas. Aturan database (bisa menggunakan ENUM type atau CHECK constraint pada saat pembuatan SQL nantinya) harus memastikan:
- Atribut `role` pada `profiles` hanya boleh bernilai: `ADMIN` atau `USER`.
- Atribut `type` pada `cash_sources` hanya boleh bernilai: `MAIN` atau `INDIVIDUAL`.
*(Pembatasan ini penting agar tidak ada data anomali di kolom-kolom kritikal).*

---

### 7. Perhitungan Saldo
Saldo **dihitung secara *real-time*** (on the fly), bukan disimpan manual sebagai kolom di tabel `cash_sources`.
**Formula Saldo Suatu Cash Source (X):**
```
Saldo X = (Total Allocation di mana destination_id = X)
          - (Total Allocation di mana source_id = X)
          - (Total Transaction di mana cash_source_id = X)
```
**Alasan Desain:**
- Mencegah kondisi anomali data (inkonsistensi) antara riwayat dan jumlah saldo akibat kegagalan sinkronisasi kolom *cached*.
- Jumlah mutasi kas kecil bulanan / tahunan masih dalam batas performa optimal PostgreSQL. Jika di masa depan data mulai lambat di-*query*, kita bisa menggunakan *Database View*, *Materialized View*, atau perhitungan agregasi via RPC/Stored Procedure.

---

### 8. Audit Trail
Tabel operasional utama (`allocations`, `transactions`) diwajibkan memiliki 4 kolom Audit Trail:
- `created_at`
- `created_by` (merujuk ke `profiles.id`)
- `updated_at`
- `updated_by` (merujuk ke `profiles.id`)

**Alasan Desain:**
- Memungkinkan pelacakan historis siapa yang melakukan penginputan, terutama saat Administrator yang menginputkan transaksi untuk Pemegang Dana.
- Tabel master data (`categories`, `divisions`) mungkin tidak wajib membutuhkan kelengkapan `created_by` / `updated_by` penuh jika perubahan jarang terjadi dan hanya dilakukan admin, namun `created_at` tetap dianjurkan.

---

### 9. Index yang Direkomendasikan
Untuk mendukung kecepatan aplikasi dan proses rekap, direkomendasikan pembuatan Index untuk kolom-kolom berikut:
- **`transactions.date`**: Berguna untuk mempercepat filter pencarian dan rekap bulanan berdasarkan periode waktu.
- **`transactions.cash_source_id`**: Mempercepat proses kalkulasi saldo.
- **`transactions.category_id`**: Mempercepat query dan agregasi rekapitulasi pengeluaran berdasarkan Kategori.
- **`transactions.division_id`**: Mempercepat query rekapitulasi pengeluaran berdasarkan Bidang/Sub Bidang.
- **`allocations.source_id` dan `allocations.destination_id`**: Mempercepat proses kalkulasi saldo.
- **`user_cash_source_access.user_id`**: Mempercepat load data saat login untuk menentukan *dropdown* sumber dana mana saja yang bisa diakses user.

---

### 10. Initial Seed Data
Data bawaan yang harus dimasukkan (*seeded*) ketika sistem pertama kali di-*deploy* ke *production* meliputi:

**Categories (Kategori Keperluan):**
- BBM
- E-Toll
- Konsumsi
- Lain-lain
- Perkakas, RT Umum & Pengiriman

**Divisions (Bidang / Sub Bidang):**
- MAN
- PKU
- JAR
- PMK
- PBJ
- INS
- K3LHKam

**Cash Sources (Sumber Dana Bawaan):**
- Kas Utama (Tipe: `MAIN`, Kode: `MAIN`)

**Roles (Referensi Nilai / Role Dasar):**
- `ADMIN`
- `USER`

---

### 11. Catatan Desain Keputusan
- **Mengapa Nama Penerima bukan master data?** Sesuai proses bisnis, nama penerima (misal "Toko A", "Pak B") terlalu dinamis dan tidak berulang secara konsisten untuk dikelola sebagai master data yang harus diurus Admin.
- **Mengapa ada Field `code` di `cash_sources`?** Nama sumber dana dapat berubah (misal salah ketik atau pergantian formal). Field `code` memberikan *identifier bisnis* yang stabil dan aman.
- **Mengapa Pemegang Dana (Pegawai) dan Profile (Login) dipisah?** Karena tidak semua pegawai pasti mempunyai akses aplikasi login sendiri, atau sewaktu-waktu akun login pegawai A dinonaktifkan tetapi nama pegawai A sebagai penanggung jawab dana tetap harus ada historinya.
- **Mengapa Alokasi dipisah dari Transaksi?** Transaksi bersifat mengurangi kas untuk *keperluan eksternal/operasional*, memiliki kategori dan divisi. Sedangkan alokasi murni perpindahan internal kas (*internal transfer*) yang tidak perlu memakan atribut kategori/divisi.
- **Mengapa tidak menggunakan *Soft Delete* di tabel transaksi pada versi ini?** SRS awal menyebutkan riwayat tidak boleh hilang (sehingga hapus mungkin dilarang secara UI). Fokus pengembangan utama ditekankan pada kesederhanaan operasional. Jika fitur Hapus diadakan ke depan, opsi *is_deleted* bisa ditambahkan.
- **Mengapa rekap adalah Query, bukan Tabel Khusus?** Data tidak terlalu raksasa (sekitar 100-500 mutasi/bulan). Membangun arsitektur OLAP atau tabel agregat harian terlalu *over-engineering* untuk kasus ini. Kalkulasi *real-time* sangat cukup dan menghindari *sync-error*.
