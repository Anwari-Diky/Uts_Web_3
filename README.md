# spk-labkom

Frontend Sistem Pendukung Keputusan (SPK) Penentuan Kelayakan Upgrade dan Perbaikan Perangkat Periferal Laboratorium Komputer Pondok Pesantren Al Ihsan Baron Bogor.

## Tech Stack
- **Framework:** React 18 + Vite
- **Icons:** Lucide React
- **Styling:** Modern Custom Design System (Responsive & Print-ready KOP Surat Resmi)

## Fitur Utama Frontend
- **Dashboard Interaktif:** Metrik statistik perangkat, chart distribusi kondisi & prioritas, ringkasan status operasional.
- **Data Perangkat:** Manajemen inventaris periferal lab lengkap (PC, Monitor, Keyboard, Mouse, Printer).
- **Dokumentasi Kerusakan:** Pelaporan kerusakan periferal disertai bukti foto.
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
