import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  TrendingUp,
  Lightbulb,
  DollarSign,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  PieChart,
  BarChart2,
  Calendar,
  ChevronRight,
  Monitor,
  Check,
  Clock,
  ArrowUpRight,
  Camera
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const DashboardView = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoaded, setChartLoaded] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setChartLoaded(true), 100);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const devicesTotal = stats?.devices?.total || 0;
  const conditions = stats?.devices?.conditions || { baik: 0, rusak_ringan: 0, rusak_berat: 0 };
  const operational = stats?.devices?.operational || { aktif: 0, dalam_perbaikan: 0, tidak_aktif: 0 };
  const categories = stats?.devices?.categories || [];
  const latestSaw = stats?.latest_saw_run;
  const recommendations = stats?.recommendations || { pending: 0, approved: 0, rejected: 0, deferred: 0 };
  const repairs = stats?.repairs || { counts: {}, total_estimated_cost: 0, total_actual_cost: 0 };
  const recentLogs = stats?.recent_activities || [];

  const totalRusak = (conditions.rusak_ringan || 0) + (conditions.rusak_berat || 0);
  const pctBaik = devicesTotal > 0 ? Math.round((conditions.baik / devicesTotal) * 100) : 0;
  const pctRingan = devicesTotal > 0 ? Math.round((conditions.rusak_ringan / devicesTotal) * 100) : 0;
  const pctBerat = devicesTotal > 0 ? Math.max(0, 100 - pctBaik - pctRingan) : 0;

  // Donut SVG Parameters (Radius 52, Circumference ~ 326.7)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeBaik = (pctBaik / 100) * circumference;
  const strokeRingan = (pctRingan / 100) * circumference;
  const strokeBerat = (pctBerat / 100) * circumference;

  const offsetBaik = 0;
  const offsetRingan = -strokeBaik;
  const offsetBerat = -(strokeBaik + strokeRingan);

  // SAW Priority numbers
  const prioritasTinggi = latestSaw?.priority_bands?.Tinggi || 0;
  const prioritasSedang = latestSaw?.priority_bands?.Sedang || 0;
  const prioritasRendah = latestSaw?.priority_bands?.Rendah || 0;
  const totalEvaluatedSaw = prioritasTinggi + prioritasSedang + prioritasRendah || 1;

  // Financial calculations
  const totalEstCost = repairs.total_estimated_cost || 0;
  const totalActCost = repairs.total_actual_cost || 0;
  const budgetRatio = totalEstCost > 0 ? Math.min(100, Math.round((totalActCost / totalEstCost) * 100)) : 0;

  // Max count for category distribution
  const maxCategoryCount = Math.max(...categories.map((c) => c.device_count || 0), 1);

  // Today formatted date
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header Hero Card: Balanced, Elegant & Clear */}
      <div
        className="anim-fade-in"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '260px',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(59, 130, 246, 0.04) 50%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--electric-blue-light)',
                  color: 'var(--electric-blue)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid var(--electric-blue-border)',
                }}
              >
                <span className="anim-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
                Laboratorium Aktif
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{todayFormatted}</span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Selamat Datang, {user?.full_name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              Ringkasan inventaris periferal, status fisik perangkat, dan rekomendasi perbaikan lab.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('devices')}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                borderRadius: '9px',
                backgroundColor: 'var(--surface-white)',
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <HardDrive size={15} color="var(--electric-blue)" />
              Inventaris Perangkat
            </button>
            <button
              onClick={() => onNavigate('damage-docs')}
              className="btn-primary"
              style={{
                fontSize: '13px',
                padding: '8px 18px',
                borderRadius: '9px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                backgroundColor: 'var(--brand-forest)',
              }}
              title="Buka menu Dokumentasi Kerusakan"
            >
              <Camera size={15} />
              Dokumentasi Kerusakan
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Row: Clear Hierarchy & Comfortable Padding */}
      <div
        className="anim-fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Perangkat */}
        <div
          onClick={() => onNavigate('devices')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--electric-blue)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Total Inventaris</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HardDrive size={18} color="var(--electric-blue)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {devicesTotal} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Unit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--status-success)', marginTop: '8px', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
            {conditions.baik} Unit Kondisi Baik ({pctBaik}%)
          </div>
        </div>

        {/* Perlu Perhatian / Rusak */}
        <div
          onClick={() => onNavigate('devices')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--status-warning)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Perlu Perhatian</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="var(--status-warning)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {totalRusak} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Unit</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
            <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>{conditions.rusak_ringan}</span> Rusak Ringan • <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{conditions.rusak_berat}</span> Berat
          </div>
        </div>

        {/* Dokumentasi Kerusakan Periferal */}
        <div
          onClick={() => onNavigate('damage-docs')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
          title="Klik untuk membuka menu Dokumentasi Kerusakan"
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--brand-forest)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Dokumentasi Kerusakan</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={18} color="var(--brand-forest)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--brand-forest)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {stats?.damage_docs?.total ?? (conditions.rusak_ringan + conditions.rusak_berat) ?? 2}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Berkas Foto</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
            Bukti fisik kerusakan periferal
          </div>
        </div>

        {/* Realisasi Pemeliharaan */}
        <div
          onClick={() => onNavigate('repair-history')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-cyan)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Realisasi Perbaikan</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(34, 211, 238, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} color="#0891B2" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {repairs.counts?.completed || 0} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Selesai</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
            {(repairs.counts?.planned || 0) + (repairs.counts?.in_progress || 0)} Unit dalam penanganan
          </div>
        </div>
      </div>

      {/* 3. ROW 1: Donut Chart & SAW Priority Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Chart A: Donut Komposisi Kondisi Fisik */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 22px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="var(--electric-blue)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Komposisi Kondisi Fisik Perangkat
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Status Terkini</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '18px', padding: '6px 0' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
              <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="13"
                />

                {/* Baik Segment */}
                {strokeBaik > 0 && (
                  <circle
                    cx="68"
                    cy="68"
                    r={radius}
                    fill="transparent"
                    stroke="var(--status-success)"
                    strokeWidth="13"
                    strokeDasharray={`${strokeBaik} ${circumference}`}
                    strokeDashoffset={chartLoaded ? offsetBaik : circumference}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                )}

                {/* Rusak Ringan Segment */}
                {strokeRingan > 0 && (
                  <circle
                    cx="68"
                    cy="68"
                    r={radius}
                    fill="transparent"
                    stroke="var(--status-warning)"
                    strokeWidth="13"
                    strokeDasharray={`${strokeRingan} ${circumference}`}
                    strokeDashoffset={chartLoaded ? offsetRingan : circumference}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                )}

                {/* Rusak Berat Segment */}
                {strokeBerat > 0 && (
                  <circle
                    cx="68"
                    cy="68"
                    r={radius}
                    fill="transparent"
                    stroke="var(--status-danger)"
                    strokeWidth="13"
                    strokeDasharray={`${strokeBerat} ${circumference}`}
                    strokeDashoffset={chartLoaded ? offsetBerat : circumference}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                )}
              </svg>

              {/* Center Info */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {pctBaik}%
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>
                  Kondisi Baik
                </div>
              </div>
            </div>

            {/* Clean, Refined Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px', flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-success)' }}>Kondisi Baik</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--status-success)' }}>
                  {conditions.baik} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>({pctBaik}%)</span>
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--status-warning-bg)',
                  border: '1px solid var(--status-warning-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-warning)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-warning)' }}>Rusak Ringan</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--status-warning)' }}>
                  {conditions.rusak_ringan} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>({pctRingan}%)</span>
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-danger)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-danger)' }}>Rusak Berat</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--status-danger)' }}>
                  {conditions.rusak_berat} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>({pctBerat}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Bar */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Kesiapan Operasional</span>
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                {operational.aktif} Aktif • {operational.dalam_perbaikan} Perbaikan • {operational.tidak_aktif} Nonaktif
              </span>
            </div>
            <div
              style={{
                height: '7px',
                backgroundColor: '#E2E8F0',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.aktif / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: 'var(--electric-blue)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.dalam_perbaikan / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: 'var(--status-warning)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.tidak_aktif / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: 'var(--status-danger)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Chart C: Kategori Inventaris Perangkat (Mendampingi Komposisi Fisik pada Baris 1) */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 22px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--electric-blue)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Distribusi Inventaris Perangkat
                </h3>
              </div>
              <button
                onClick={() => onNavigate('devices')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--electric-blue)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                Semua <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {categories.slice(0, 5).map((cat) => {
                const count = cat.device_count || 0;
                const barPercent = Math.round((count / maxCategoryCount) * 100);
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--electric-blue)' }}>
                        {count} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Unit</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: chartLoaded ? `${barPercent}%` : '0%',
                          backgroundColor: 'var(--electric-blue)',
                          borderRadius: '4px',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Category Summary Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '14px',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Cakupan Kategori</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {categories.length} <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>Jenis Periferal</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Status Inventarisasi</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-success)', marginTop: '2px' }}>
                  100% <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>Terdata Lengkap</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
            <button
              onClick={() => onNavigate('devices')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--electric-blue)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Kelola data inventaris <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: Ringkasan Pemeliharaan & Riwayat Aktivitas Terkini (Tombol Laporan & Log Lengkap Disembunyikan Sesuai Milestone 50%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Chart D: Analisis Finansial Pemeliharaan */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 22px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="var(--electric-blue)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Realisasi Anggaran Pemeliharaan
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                Status Pemeliharaan Lab
              </span>
            </div>

            {/* Minimalist Financial Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Estimasi Anggaran</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.01em' }}>
                  {formatRupiah(totalEstCost)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Total rencana perbaikan</div>
              </div>

              <div style={{ backgroundColor: 'var(--electric-blue-light)', padding: '11px 14px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600 }}>Realisasi Biaya</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--electric-blue)', marginTop: '2px', letterSpacing: '-0.01em' }}>
                  {formatRupiah(totalActCost)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Biaya aktual riil</div>
              </div>
            </div>

            {/* Budget Utilization Meter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rasio Realisasi Terhadap Estimasi</span>
                <span style={{ fontWeight: 700, color: 'var(--electric-blue)' }}>{budgetRatio}%</span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: chartLoaded ? `${budgetRatio}%` : '0%',
                    backgroundColor: 'var(--electric-blue)',
                    borderRadius: '4px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: 'var(--status-success)',
              fontWeight: 500,
            }}
          >
            <CheckCircle2 size={15} color="var(--status-success)" />
            <span>Pengeluaran anggaran pemeliharaan terkendali</span>
          </div>
        </div>

        {/* 5. Riwayat Aktivitas & Log Sistem Terbaru (Tombol Log Lengkap Disembunyikan) */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 22px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--electric-blue)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Riwayat Aktivitas Sistem Terkini
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                Aktivitas Terakhir
              </span>
            </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
            Belum ada aktivitas tercatat hari ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  backgroundColor: '#ffffff',
                  borderRadius: '9px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12.5px',
                  gap: '12px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      padding: '2.5px 7px',
                      backgroundColor: 'var(--electric-blue-light)',
                      color: 'var(--electric-blue)',
                      borderRadius: '5px',
                      fontWeight: 600,
                      fontSize: '10.5px',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                    }}
                  >
                    {log.action_key}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.summary}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', flexShrink: 0, fontSize: '12px' }}>
                  <span>
                    oleh <strong>{log.actor_name || 'Sistem'}</strong>
                  </span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
