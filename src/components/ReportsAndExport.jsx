import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  HardDrive,
  TrendingUp,
  UserCheck,
  Wrench,
  Globe,
  Phone,
  Server,
  Maximize2
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

const getColumnAlignment = (key) => {
  // Rata Tengah: Peringkat, Nilai Preferensi (V), Kategori Prioritas, Kode Perangkat, Kategori, Status, Tanggal, ID
  if (
    key === 'rank_position' ||
    key === 'preference_value' ||
    key === 'priority_band' ||
    key === 'code' ||
    key === 'device_code' ||
    key === 'id' ||
    key === 'category_name' ||
    key === 'condition_status' ||
    key === 'operational_status' ||
    key === 'decision_status' ||
    key === 'status' ||
    key === 'action_type' ||
    key === 'decision_at'
  ) {
    return 'center';
  }
  // Rata Kanan: Nilai keuangan / biaya
  if (key.includes('cost') || key === 'purchase_value') {
    return 'right';
  }
  // Rata Kiri: Nama perangkat, lokasi, merek/model, rekomendasi sistem, permasalahan, catatan, petugas
  return 'left';
};

export const ReportsAndExport = () => {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState('saw_ranking');
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [paperSize, setPaperSize] = useState('A4'); // 'A4' | 'F4'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // Fetch initial filters & settings
  const fetchSettingsAndFilters = useCallback(async () => {
    try {
      const [resP, resC, resS] = await Promise.all([
        fetch('/api/v1/assessment-periods', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/device-categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/settings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resP.ok) {
        const p = (await resP.json()).data || [];
        setPeriods(p);
        const active = p.find((item) => item.is_active === 1) || p[0];
        if (active) setSelectedPeriodId(active.id);
      }

      if (resC.ok) {
        setCategories((await resC.json()).data || []);
      }

      if (resS.ok) {
        const s = (await resS.json()).data || {};
        setSettings(s);
      }
    } catch (e) {
      console.error('Failed to load filters or settings:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchSettingsAndFilters();

    const handleBrandingUpdate = (e) => {
      if (e.detail?.branding) {
        setSettings((prev) => ({
          ...prev,
          app_branding: e.detail.branding,
        }));
      } else {
        fetchSettingsAndFilters();
      }
    };

    window.addEventListener('app-branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('app-branding-updated', handleBrandingUpdate);
  }, [fetchSettingsAndFilters]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: reportType,
      });
      if (selectedPeriodId) queryParams.set('period_id', selectedPeriodId);
      if (selectedCategoryId) queryParams.set('category_id', selectedCategoryId);

      const res = await fetch(`/api/v1/reports/data?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, reportType, selectedPeriodId, selectedCategoryId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Trigger Excel CSV Download
  const handleDownloadCsv = () => {
    const queryParams = new URLSearchParams({
      type: reportType,
    });
    if (selectedPeriodId) queryParams.set('period_id', selectedPeriodId);
    if (selectedCategoryId) queryParams.set('category_id', selectedCategoryId);

    const url = `/api/v1/reports/export/csv?${queryParams.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `laporan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error(err));
  };

  // Trigger Print / PDF
  const handlePrint = () => {
    window.print();
  };

  const columns = reportData?.columns || [];
  const items = reportData?.items || [];
  const logoUrl = settings?.app_branding?.logo_url || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Dynamic Print Stylesheet for A4 & F4 with Portrait & Landscape Orientation */}
      <style>
        {`
          @media print {
            @page {
              size: ${
                paperSize === 'F4'
                  ? orientation === 'landscape'
                    ? '330mm 215mm'
                    : '215mm 330mm'
                  : orientation === 'landscape'
                  ? 'A4 landscape'
                  : 'A4 portrait'
              };
              margin: ${orientation === 'landscape' ? '1.2cm 1.5cm' : '1.5cm 1.2cm'};
            }
            body, html {
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
            .no-print,
            aside,
            header,
            footer,
            button,
            .btn-primary,
            .btn-secondary {
              display: none !important;
              visibility: hidden !important;
            }
            .app-shell-root,
            .app-main-layout,
            #root,
            main,
            .container {
              margin-left: 0 !important;
              margin-right: 0 !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              display: block !important;
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
            }
            .print-document {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
            }
            .table {
              width: 100% !important;
              table-layout: auto !important;
              border-collapse: collapse !important;
            }
            .table th, .table td {
              border: 1px solid #4b5563 !important;
              padding: ${orientation === 'landscape' ? '6px 10px' : '6px 7px'} !important;
              font-size: ${orientation === 'landscape' ? '11px' : '10.5px'} !important;
            }
            .table th {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .table td span {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-signatures,
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      {/* Non-print Toolbar & Controls */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Bar */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-soft)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={22} color="var(--brand-forest)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Modul Laporan &amp; Dokumen Resmi
              </h2>
              <span
                style={{
                  backgroundColor: 'var(--surface-sage)',
                  color: 'var(--brand-forest)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid #c8dcd0',
                }}
              >
                KOP Resmi Aktif
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
              Format surat resmi dengan KOP lembaga lengkap, logo resmi, pilihan orientasi Potret/Lanskap, dan kertas A4 atau F4 (Folio).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadCsv}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '10px' }}
              title="Unduh berkas Microsoft Excel (.CSV)"
            >
              <Download size={14} color="var(--brand-forest)" />
              Unduh Excel (.CSV)
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                fontSize: '13px',
                padding: '9px 18px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(32, 91, 67, 0.22)',
              }}
              title="Cetak atau Simpan PDF dengan KOP Surat Resmi"
            >
              <Printer size={15} />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* Filter & Paper Format Bar */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid var(--border-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Jenis Laporan */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Jenis Laporan Dokumen:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-select"
                style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  minWidth: '240px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-soft)',
                  backgroundColor: 'var(--canvas-soft)',
                  outline: 'none',
                }}
              >
                <option value="saw_ranking">1. Hasil Kalkulasi &amp; Peringkat SAW</option>
                <option value="decisions">2. Keputusan Rekomendasi Pimpinan</option>
                <option value="inventory">3. Inventaris &amp; Kondisi Fisik Perangkat</option>
                <option value="repairs">4. Pelaksanaan Riwayat Perbaikan &amp; Biaya</option>
              </select>
            </div>

            {/* Filter Periode */}
            {(reportType === 'saw_ranking' || reportType === 'decisions') && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Periode Penilaian:
                </label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="input-select"
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    minWidth: '170px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    backgroundColor: 'var(--canvas-soft)',
                    outline: 'none',
                  }}
                >
                  <option value="">Semua Periode</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_active ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Kategori */}
            {reportType === 'inventory' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Kategori Perangkat:
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="input-select"
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    minWidth: '170px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    backgroundColor: 'var(--canvas-soft)',
                    outline: 'none',
                  }}
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paper Size Switcher (A4 vs F4) */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Ukuran Kertas:
              </label>
              <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'var(--canvas-soft)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: paperSize === 'A4' ? 'var(--brand-forest)' : 'transparent',
                    color: paperSize === 'A4' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: paperSize === 'A4' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('F4')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: paperSize === 'F4' ? 'var(--brand-forest)' : 'transparent',
                    color: paperSize === 'F4' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: paperSize === 'F4' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  F4 / Folio
                </button>
              </div>
            </div>

            {/* Orientation Switcher (Portrait vs Landscape) */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Orientasi Cetak:
              </label>
              <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'var(--canvas-soft)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: orientation === 'portrait' ? 'var(--brand-forest)' : 'transparent',
                    color: orientation === 'portrait' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: orientation === 'portrait' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  Potret (Tegak)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: orientation === 'landscape' ? 'var(--brand-forest)' : 'transparent',
                    color: orientation === 'landscape' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: orientation === 'landscape' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  Lanskap (Melebar)
                </button>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', textAlign: 'right' }}>
            Setting: <strong>{paperSize === 'F4' ? 'F4 / Folio' : 'A4'}</strong> • <strong>{orientation === 'landscape' ? 'Lanskap' : 'Potret'}</strong>
          </div>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div
        className="card print-document"
        style={{
          width: '100%',
          maxWidth:
            orientation === 'landscape'
              ? paperSize === 'F4'
                ? '1080px'
                : '1000px'
              : paperSize === 'F4'
              ? '860px'
              : '820px',
          margin: '0 auto',
          padding:
            orientation === 'landscape'
              ? '36px 42px'
              : paperSize === 'F4'
              ? '42px 38px'
              : '36px 34px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          border: '1px solid #d1d5db',
          transition: 'max-width 0.25s ease, padding 0.25s ease',
        }}
      >
        {/* Official Letterhead (KOP SURAT RESMI LEMBAGA) */}
        <div className="print-header" style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              paddingBottom: '10px',
            }}
          >
            {/* Logo Kiri Atas (Dari Pengaturan Sistem) */}
            <div
              style={{
                width: '82px',
                height: '82px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Institusi"
                  style={{
                    maxWidth: '82px',
                    maxHeight: '82px',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--brand-forest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Server size={36} color="#ffffff" />
                </div>
              )}
            </div>

            {/* Teks Kop Surat Tengah */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1b4d3e',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Lab Komputer
              </h2>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#111827',
                  margin: '3px 0 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Pondok Pesantren Al Ihsan Baron Bogor
              </h1>
              <p
                style={{
                  fontSize: '11.5px',
                  color: '#374151',
                  margin: '3px 0 0 0',
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                Jl. Ponpes Baron Rt.03 Rw.13 Cilendek Barat, Kota Bogor, Jawa barat 16112
              </p>

              {/* Baris Media Sosial & Kontak Resmi */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '5px',
                  fontSize: '11px',
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                {/* Logo IG dan FB */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {/* IG Icon SVG */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#205B43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  {/* FB Icon SVG */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#205B43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span>ponpesbaronbogr</span>
                </span>

                <span style={{ color: '#9ca3af' }}>•</span>

                {/* Telepon / Kontak WA */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} color="#205B43" />
                  <span>0812-1898-7172</span>
                </span>

                <span style={{ color: '#9ca3af' }}>•</span>

                {/* Website Resmi */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} color="#205B43" />
                  <span>alihsanbaronbogor.ponpes.id</span>
                </span>
              </div>
            </div>

            {/* Spacer Kanan Penyeimbang Logo */}
            <div style={{ width: '82px', flexShrink: 0 }} />
          </div>

          {/* Garis Ganda Pemisah KOP Surat Resmi */}
          <div style={{ borderBottom: '3px solid #111827', marginTop: '6px' }} />
          <div style={{ borderBottom: '1px solid #111827', marginTop: '2px', marginBottom: '18px' }} />

          {/* Judul Dokumen Laporan & Tanggal */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', textDecoration: 'underline', letterSpacing: '0.3px' }}>
              {reportData?.title || 'Laporan Resmi Laboratorium'}
            </h3>
            <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>
              Periode: <strong>{periods.find((p) => p.id === parseInt(selectedPeriodId, 10))?.name || 'Tahun Ajaran 2026/Ganjil'}</strong> • Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Tabel Data Laporan */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
            Memuat data laporan...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
            Tidak ada data untuk kriteria laporan yang dipilih.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table className="table" style={{ width: '100%', fontSize: orientation === 'landscape' ? '11.5px' : '11px', borderCollapse: 'collapse', color: '#111827' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6' }}>
                  <th style={{ width: '38px', textAlign: 'center', border: '1px solid #9CA3AF', padding: '8px 6px', fontWeight: 700 }}>No</th>
                  {columns.map((col) => {
                    const align = getColumnAlignment(col.key);
                    return (
                      <th
                        key={col.key}
                        style={{
                          border: '1px solid #9CA3AF',
                          padding: orientation === 'landscape' ? '8px 10px' : '8px 6px',
                          textAlign: align,
                          fontWeight: 700,
                        }}
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                    <td style={{ textAlign: 'center', border: '1px solid #D1D5DB', padding: '6px 6px', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.key];
                      const align = getColumnAlignment(col.key);
                      const isCost = col.key.includes('cost') || col.key === 'purchase_value';
                      const isRank = col.key === 'rank_position';
                      const isCode = col.key === 'code' || col.key === 'device_code';
                      const isPreference = col.key === 'preference_value';
                      const isPriority = col.key === 'priority_band';

                      return (
                        <td
                          key={col.key}
                          style={{
                            border: '1px solid #D1D5DB',
                            padding: orientation === 'landscape' ? '6px 10px' : '6px 6px',
                            textAlign: align,
                            fontWeight: isRank || isPreference ? 700 : 'normal',
                          }}
                        >
                          {isPriority ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '10.5px',
                                backgroundColor:
                                  val === 'Tinggi'
                                    ? '#FEE2E2'
                                    : val === 'Sedang'
                                    ? '#FEF3C7'
                                    : '#E5E7EB',
                                color:
                                  val === 'Tinggi'
                                    ? '#991B1B'
                                    : val === 'Sedang'
                                    ? '#92400E'
                                    : '#374151',
                                border: `1px solid ${
                                  val === 'Tinggi'
                                    ? '#FCA5A5'
                                    : val === 'Sedang'
                                    ? '#FCD34D'
                                    : '#D1D5DB'
                                }`,
                              }}
                            >
                              {val || '-'}
                            </span>
                          ) : isPreference ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.3px', fontWeight: 700 }}>
                              {val ?? '-'}
                            </span>
                          ) : isRank ? (
                            <span style={{ fontWeight: 700 }}>
                              {val ?? '-'}
                            </span>
                          ) : isCode ? (
                            <span style={{ fontFamily: "monospace, 'Consolas', sans-serif", fontWeight: 600 }}>
                              {val ?? '-'}
                            </span>
                          ) : isCost && typeof val === 'number' ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                              {formatRupiah(val)}
                            </span>
                          ) : (
                            String(val ?? '-')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lembar Pengesahan Resmi (Sign-off Block) */}
        <div
          className="print-signatures"
          style={{
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#111827',
            pageBreakInside: 'avoid',
          }}
        >
          {/* Penandatangan Kiri: Teknisi Laboratorium */}
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div>Diverifikasi oleh,</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>Teknisi Laboratorium</div>
            <div style={{ height: '60px' }} />
            <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
              {settings?.report_signees?.teknisi_name || 'Diki Anwari S.Kom'}
            </div>
            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
              {settings?.report_signees?.teknisi_nip || 'NIP. 19880412 201402 1 002'}
            </div>
          </div>

          {/* Penandatangan Kanan: Kepala Laboratorium Komputer */}
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div>
              {settings?.lab_identity?.location || 'Bogor'},{' '}
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>Mengetahui &amp; Menyetujui,</div>
            <div style={{ fontWeight: 600 }}>Kepala Laboratorium Komputer</div>
            <div style={{ height: '60px' }} />
            <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
              {settings?.report_signees?.kepala_lab_name || 'Muhammad Ridwan Abdullah S.Kom'}
            </div>
            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
              {settings?.report_signees?.kepala_lab_title || 'Kepala Unit IT & Lab Komputer'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
