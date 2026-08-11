# API & Service Design Document (ASDD)
## Sistem Informasi Pengelolaan Kas Kecil

### 1. Pendahuluan
Dokumen API & Service Design Document (ASDD) ini bertujuan untuk mendefinisikan seluruh kontrak layanan (service contract) dan operasi bisnis pada Sistem Informasi Pengelolaan Kas Kecil. Dokumen ini akan menjadi acuan utama bagi *developer* sebelum proses penulisan kode, dengan menitikberatkan pada validasi, input, output, aturan bisnis, dan penanganan *error*. Spesifikasi ini dirancang spesifik untuk ekosistem Next.js, Supabase Auth, dan PostgreSQL (via Supabase Client & RPC), tanpa terikat pada arsitektur REST API konvensional.

---

### 2. Prinsip Desain
Arsitektur interaksi data pada sistem ini mengikuti prinsip-prinsip berikut:
- **Prioritas Supabase Client:** Operasi *Create, Read, Update, Delete* (CRUD) yang sederhana (seperti membaca master data) diutamakan untuk memanggil Supabase Client secara langsung dari sisi klien (atau melalui *Server Components* Next.js) demi kecepatan pengembangan dan efisiensi.
- **Isolasi Logika Kompleks:** Operasi yang mengubah state krusial, membutuhkan validasi bisnis ketat (cek saldo), atau melibatkan *insert/update* lebih dari satu tabel dalam satu waktu direkomendasikan menggunakan **PostgreSQL Function (RPC)** atau **Next.js Server Action**.
- **Security-First (RLS):** Seluruh operasi tanpa pengecualian dikawal oleh *Row Level Security* (RLS) di PostgreSQL. RLS adalah lapis pertahanan utama untuk validasi hak akses berdasarkan peran (*Role*), bukan sekadar mengandalkan validasi di level antarmuka pengguna (UI).
- **Kepatuhan Proses Bisnis:** Semua operasi mutlak harus mematuhi aturan bisnis yang telah ditetapkan pada SRS (contoh: saldo tidak boleh negatif).

---

### 3. Daftar Operasi Sistem
Sistem ini menyediakan layanan-layanan utama berikut:

**Autentikasi**
- Login
- Logout

**Dashboard**
- Membaca ringkasan dashboard (Admin & User)

**Master Data (Khusus Admin)**
- Kelola Kategori (Kategori Keperluan)
- Kelola Bidang (Bidang/Sub Bidang)
- Kelola Pemegang Dana
- Kelola Sumber Dana
- Kelola User / Profil

**Alokasi Dana**
- Membuat alokasi
- Membaca riwayat alokasi

**Transaksi**
- Membuat transaksi pengeluaran
- Mengubah transaksi pengeluaran
- Membaca riwayat transaksi

**Rekap**
- Menghasilkan rekap bulanan
- Export rekap ke Excel (Logika Client/Server Action)

---

### 4. Detail Setiap Operasi

#### Autentikasi
**Nama:** `SignIn`
- **Tujuan:** Autentikasi pengguna ke dalam sistem.
- **Role:** Semua pengguna.
- **Input:** Email, Password.
- **Validasi:** Format email valid, kredensial cocok.
- **Proses:** Memanggil `supabase.auth.signInWithPassword`.
- **Output:** Session Token, Data Profile, Akses Sumber Dana (`user_cash_source_access`).
- **Error:** Kredensial salah, akun dinonaktifkan.

#### Alokasi Dana
**Nama:** `CreateAllocation`
- **Tujuan:** Memindahkan dana antar sumber dana.
- **Role:** ADMIN
- **Input:** `date`, `source_id`, `destination_id`, `amount`, `description`.
- **Validasi:** 
  - `amount` > 0.
  - `source_id` != `destination_id`.
  - Saldo sumber (`source_id`) saat ini >= `amount`.
- **Proses:** Memeriksa saldo *real-time*, memasukkan data ke tabel `allocations`, menyematkan metadata audit (created_at, created_by).
- **Output:** Detail data alokasi yang berhasil dibuat.
- **Error:** Saldo tidak mencukupi, Sumber data tidak valid, Sumber dan Tujuan sama.

#### Transaksi
**Nama:** `CreateTransaction`
- **Tujuan:** Mencatat pengeluaran kas kecil.
- **Role:** ADMIN, USER
- **Input:** `date`, `cash_source_id`, `recipient_name`, `category_id`, `vehicle_number`, `division_id`, `amount`, `description`, `receipt_date`, `handover_date`.
- **Validasi:**
  - Pengguna memiliki hak akses terhadap `cash_source_id`.
  - Kategori dan Divisi valid (ada di DB).
  - `amount` > 0.
  - Saldo `cash_source_id` saat ini >= `amount`.
- **Proses:** Memastikan kepemilikan/akses sumber dana, mengecek perhitungan saldo terkini, menyimpan record ke tabel `transactions` dengan metadata audit.
- **Output:** Data transaksi yang berhasil dibuat.
- **Error:** Saldo tidak mencukupi, Akses sumber dana ditolak (Unauthorized), Kategori/Divisi tidak valid.

**Nama:** `UpdateTransaction`
- **Tujuan:** Mengubah data transaksi pengeluaran yang sudah tersimpan.
- **Role:** ADMIN (USER/Pemegang Dana tidak diperbolehkan mengubah transaksi yang sudah tersimpan).
- **Input:** `transaction_id`, field yang akan diubah (opsional: `date`, `cash_source_id`, `amount`, dll).
- **Validasi:**
  - Transaksi dengan `transaction_id` harus ada.
  - Jika `amount` atau `cash_source_id` berubah, saldo sumber dana yang baru mutlak harus >= nominal yang baru (kalkulasi ulang seluruh validasi bisnis saldo).
- **Proses:** Memverifikasi ketersediaan saldo jika ada perubahan finansial, lalu menyimpan perubahan ke tabel `transactions`. Wajib memperbarui metadata audit (`updated_at` dan `updated_by`) untuk menjaga konsistensi audit trail.
- **Output:** Data transaksi yang berhasil diperbarui.
- **Error:** Saldo tidak mencukupi, Akses ditolak (jika bukan ADMIN), Data tidak ditemukan.

#### Dashboard
**Nama:** `GetDashboardSummary`
- **Tujuan:** Menampilkan data ringkasan finansial di Dashboard.
- **Role:** ADMIN, USER
- **Input:** `period` (bulan, tahun).
- **Validasi:** Sesi pengguna aktif.
- **Proses:** Menghitung total alokasi dan total transaksi untuk menampilkan Saldo Akhir. (Admin mendapat view global; User difilter berdasarkan sumber dananya).
- **Output:** JSON berisi struktur saldo saat ini, total pengeluaran bulan ini, dan riwayat mutasi terbaru.
- **Error:** Sesi tidak valid.

#### Rekap
**Nama:** `GetMonthlyRecap`
- **Tujuan:** Menghasilkan laporan rekap bulanan yang siap digunakan.
- **Role:** ADMIN
- **Input:** `month`, `year`.
- **Validasi:** Parameter tanggal valid.
- **Proses:** Sistem tidak sekadar mengambil daftar transaksi, melainkan membangun agregasi bisnis yang mengombinasikan histori transaksi, histori alokasi, master data, dan hasil perhitungan saldo akhir berdasarkan rentang waktu yang dipilih.
- **Output:** Tabel rekap bulanan dengan struktur format yang sama persis dengan spreadsheet UPDL saat ini (termasuk saldo dan rincian transaksi), sehingga dapat langsung disalin (copy-paste) ke dokumen surat resmi.
- **Error:** Periode tidak valid.

---

### 5. Validasi Bisnis Terpusat
Seluruh operasi yang memengaruhi keuangan akan selalu diawasi oleh aturan validasi bisnis berikut, di mana pun layanan tersebut dipanggil (UI maupun API eksternal):
- **Limit Saldo:** Saldo hasil perhitungan (berdasar histori) tidak boleh menyentuh angka negatif pada akhir eksekusi perintah transaksi.
- **Nominal Positif:** Parameter `amount` pada Alokasi maupun Transaksi secara mutlak harus lebih besar dari 0.
- **Hak Akses Ketat:** Setiap `USER` hanya diizinkan menggunakan dan melihat saldo dari `cash_source_id` yang terdaftar pada tabel `user_cash_source_access` untuk dirinya.
- **Validitas Alokasi:** Tidak boleh ada alokasi sirkular dalam satu aksi (contoh: memindahkan uang dari Kas Utama kembali ke Kas Utama dalam satu form).
- **Integritas Referensi:** Referensi kunci seperti `category_id` dan `division_id` bersifat *mandatory* (wajib diisi dan valid).

---

### 6. Hak Akses (Access Control)
Hak akses dipisahkan berdasarkan Role di tabel `profiles`:
- **ADMIN:** Memiliki hak istimewa (privilege) untuk memanggil *service* pengelolaan master data, membaca dan memodifikasi *semua* transaksi, mengeksekusi layanan alokasi, serta melihat fitur Rekapitulasi lengkap. Admin juga dapat bertindak atas nama Pemegang Dana karena dapat mengakses seluruh sumber dana.
- **USER (Pemegang Dana):** Terbatas pada layanan `CreateTransaction` (menggunakan ID yang menjadi hak aksesnya), membaca `GetDashboardSummary` miliknya sendiri, dan membaca riwayat transaksinya.

---

### 7. Operasi yang Direkomendasikan Menggunakan RPC
Beberapa operasi tidak disarankan dieksekusi langsung via Supabase Client secara mentah dari *browser* karena menuntut konsistensi transaksi database secara atomik. Operasi ini harus menggunakan **PostgreSQL Function (RPC)**:
1. `CreateAllocation`
2. `CreateTransaction`
3. `UpdateTransaction`

**Alasan Teknis:** Operasi ini membutuhkan tahapan (1) Mengecek hak akses, (2) Mengkalkulasi saldo dari histori keseluruhan secara *real-time*, (3) Membandingkan nominal input dengan saldo, (4) Melakukan *Insert*. Apabila tahapan ini dilakukan di sisi klien/frontend (*multiple API calls*), maka akan sangat rentan terhadap *Race Condition* (kondisi di mana ada input ganda dalam milidetik yang sama) yang berujung pada saldo menjadi negatif. RPC memastikan perhitungan saldo dan operasi *insert* berjalan sebagai satu *database transaction* tunggal yang di-*lock* dan atomik.

---

### 8. Operasi yang Cukup Menggunakan Supabase Client
Sistem ini mendayagunakan fitur BaaS Supabase untuk menghindari penulisan kode *backend* (*controller/route*) yang tidak perlu. Operasi berikut disarankan dipanggil langsung via **Supabase Client**:
- **Membaca Master Data** (Kategori, Divisi, Pemegang Dana, Sumber Dana)
- **Membaca Profil dan Akses User**
- **Membaca Riwayat** (menampilkan list `transactions` dan `allocations` untuk tabel)
- **Filter dan Rekap**

**Alasan Teknis:** Operasi ini murni pembacaan (Read-only) yang tidak mengubah status (State) sistem. Dengan implementasi *Row Level Security (RLS)*, pembacaan ini sudah dijamin aman tanpa perlu RPC atau *Server Action* tambahan, sekaligus memanfaatkan sistem *caching* & optimasi query Supabase secara langsung dari komponen Next.js.

---

### 9. Error Handling
Setiap operasi harus memetakan *Error Code* / Respon pesan dengan jelas:
- **`ERR_INSUFFICIENT_FUNDS`:** Jika validasi (Saldo < Amount) terpenuhi.
- **`ERR_UNAUTHORIZED_SOURCE`:** Jika pengguna mencoba menggunakan `cash_source_id` yang bukan haknya.
- **`ERR_INVALID_INPUT`:** Jika nominal < 0 atau parameter wajib kosong.
- **`ERR_NOT_FOUND`:** Jika data yang akan diedit tidak ditemukan di *database*.
- **`ERR_SAME_SOURCE_DEST`:** Jika alokasi ditujukan pada sumber yang sama persis.

---

### 10. Catatan Implementasi Akhir
Sebagai pedoman penting bagi pengembang *backend*:
- **Jangan Percayai Frontend (Never trust the client):** Seluruh validasi saldo, hak akses, dan integritas data (poin 5) **wajib** dilakukan di dalam RPC PostgreSQL atau Next.js *Server Action*, meskipun *form frontend* telah divalidasi dengan library seperti *Zod/Yup*.
- **Gunakan Database Transaction:** Segala blok eksekusi pada RPC harus digabung dalam satu `BEGIN ... COMMIT` (secara default di Postgres Function).
- **Row Level Security (RLS) is King:** Desain *Policy* (kebijakan) RLS dengan teliti. RLS adalah jantung sistem keamanan Supabase untuk memastikan Pemegang Dana tidak dapat mengutak-atik transaksi Pemegang Dana lain, meskipun API ditembak melalui cURL / Postman.
- **Jangan Menduplikasi Logika:** Perhitungan rumus saldo hanya perlu ada di satu tempat (RPC / Database View). Jangan membuat fungsi manual kalkulasi saldo di Frontend, lalu dibuat lagi di Backend. Frontend cukup menerima hasil akhirnya dari Backend.
