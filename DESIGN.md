# DESIGN SYSTEM: Impeccable UI/UX

## 1. Design Principles
- **Clarity over Cleverness:** Angka finansial dan status transaksi harus dapat dipindai secara instan oleh mata. Tidak ada elemen visual yang mengganggu fokus.
- **Premium Aesthetics:** Terapkan bayangan lembut (*soft shadows*), *border* yang sangat tipis, dan *whitespace* yang lega agar aplikasi terasa mahal dan dikembangkan secara matang.
- **Micro-interactions:** Tombol, baris tabel, dan input *form* harus terasa responsif. Gunakan transisi halus (`transition-all duration-200`) saat *hover* atau *active*.
- **Accessibility (a11y):** Kontras warna harus tinggi, terutama pada data finansial kritis (misalnya membedakan pemasukan vs. pengeluaran).

## 2. Color Palette (OKLCH / HSL Recommended)
- **Primary (BUMN / Trust):** Biru korporat PLN (`bg-blue-600` / `text-blue-700`). Nantinya dapat diperhalus di Tailwind v4 dengan tingkat *vibrancy* OKLCH yang lebih modern.
- **Backgrounds:** Abu-abu sangat muda/Off-white (`bg-slate-50`) untuk mengurangi ketegangan mata, dipadukan dengan putih murni (`bg-white`) untuk *Card* dan *Container* utama.
- **Accent/Semantic:** 
  - **Success / In:** Hijau Zamrud (`text-emerald-600` / `bg-emerald-50`)
  - **Danger / Out:** Merah Tajam (`text-rose-600` / `bg-rose-50`)
  - **Warning:** Kuning Amber (`text-amber-500`)
- **Text:** Slate gelap untuk keterbacaan tinggi (`text-slate-900` untuk judul, `text-slate-500` untuk teks sekunder/informasi tambahan).

## 3. Typography
- **Primary Font:** *Geist* / *Inter* (Sistem *default* Next.js modern).
- **Hierarchy:**
  - `h1` / `h2`: *Semi-bold* dengan *tracking* (jarak antar huruf) yang ketat (`tracking-tight`).
  - **Body:** Ketebalan reguler dengan *line-height* santai (`leading-relaxed`).
  - **Angka Finansial (Tabular):** Gunakan `tabular-nums` pada Tailwind agar digit mata uang sejajar lurus secara vertikal di dalam tabel atau laporan.

## 4. Layout & Spacing
- **Container Constraints:** Gunakan batas lebar maksimal (misal `max-w-7xl`) agar tabel/form tidak merentang tak beraturan di monitor *ultrawide*.
- **Grid/Spacing:** Terapkan skala ruang (spacing) konsisten berbasis kelipatan 4px (`gap-4`, `gap-6`, `p-6`).
- **Cards & Surfaces:** Gunakan border sangat tipis (`border-slate-200`) dipadukan dengan bayangan yang lembut dan luas (`shadow-sm` atau `shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]`).

## 5. UI Components Guidelines
- **Forms:** Input dengan *border* minimalis. Saat aktif (*focus*), berikan *ring* yang berpadu dengan warna primer (`focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`).
- **Tables:** *Header* dengan latar belakang redup (`bg-slate-50`), ukuran font lebih kecil (`text-xs uppercase`), dan transisi warna pada baris (*hover row*).
- **Buttons:** Variasi yang tegas antara *Primary* (Aksi utama - Biru solid), *Secondary* (*Outline*), dan *Destructive* (Merah). Tombol *submit* WAJIB memiliki status *Loading* (Spinner) saat ditekan untuk mencegah *double-submit*.
- **Empty States:** Halaman tanpa data tidak boleh kosong begitu saja. Harus ada ikon yang elegan dan kalimat persuasif (misal: "Belum ada transaksi di bulan ini").
