# frontend-spk-labkom

Frontend Sistem Pendukung Keputusan (SPK) Penentuan Kelayakan Upgrade dan Perbaikan Perangkat Periferal Laboratorium Komputer Pondok Pesantren Al Ihsan Baron Bogor.

Aplikasi ini dapat langsung di-deploy ke **Vercel** dengan fitur **Standalone Demo Mode**, di mana pengguna dapat langsung mencoba seluruh alur SPK (Login Admin / Pimpinan / Teknisi, Dashboard, Data Perangkat, Kriteria, Kalkulasi SAW, Rekomendasi Keputusan, hingga Cetak Laporan Resmi ber-KOP Surat) tanpa harus menyalakan server backend lokal secara terpisah.

Saat dijalankan bersama server backend lokal (`localhost:5000`), aplikasi secara otomatis beralih menggunakan backend Express dan database MySQL asli.

## Tech Stack
- **Framework:** React 18 + Vite
- **Icons:** Lucide React
- **Styling:** Modern Custom Design System (Responsive & Print-ready KOP Surat Resmi)
- **Deployment Ready:** Vercel SPA Routing (`vercel.json`) & Client-side Fallback

## Akun Demo untuk Pengujian di Vercel
- **Admin Lab:** Username: `admin` | Password: `any` (misal `admin123`)
- **Pimpinan Lab:** Username: `pimpinan` | Password: `any` (misal `pimpinan123`)
- **Teknisi Lab:** Username: `teknisi` | Password: `any` (misal `teknisi123`)

## Fitur Utama Frontend
- **Dashboard Interaktif:** Metrik statistik perangkat, chart distribusi kondisi & prioritas, ringkasan status operasional.
- **Data Perangkat:** Manajemen inventaris periferal lab lengkap (PC, Monitor, Keyboard, Mouse, Printer).
- **Dokumentasi Kerusakan:** Pelaporan kerusakan periferal.
- **Kriteria & Bobot SAW:** Manajemen bobot 7 kriteria dan snapshot bobot penilaian.
- **Kalkulasi & Matriks SAW:** Matriks keputusan $X$, matriks ternormalisasi $R$, dan nilai preferensi $V$ deterministik.
- **Penetapan Rekomendasi:** Alur persetujuan Pimpinan Lab (Setujui, Tolak, Rekomendasi Khusus).
- **Riwayat Perbaikan & Upgrade:** Manajemen tugas teknisi lab dan pencatatan biaya realisasi.
- **Modul Laporan & Dokumen Resmi:** Kop surat resmi lembaga, logo, pilihan kertas A4 & F4, orientasi Potret & Lanskap, serta ekspor CSV/Excel dan cetak PDF.
- **Pengaturan Sistem & Branding:** Pengaturan nama lembaga, alamat, kontak, logo instansi, dan penandatangan laporan.

## Cara Menjalankan Secara Lokal
```bash
# Masuk ke direktori frontend
cd frontend

# Install dependensi
npm install

# Jalankan server pengembangan Vite
npm run dev
```
Default URL: `http://localhost:5173`
