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
  ArrowUpRight
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

  // Donut SVG Parameters (Radius 58, Circumference ~ 364.4)
  const radius = 58;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Header Hero Card: Elegant, Clean, Modern */}
      <div
        className="anim-fade-in"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px 28px',
          border: '1px solid #e1ebe4',
          boxShadow: '0 4px 20px -2px rgba(27, 77, 62, 0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '280px',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(232, 242, 236, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f0f6f2',
                  color: 'var(--brand-forest)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid #d4e5da',
                }}
              >
                <span className="anim-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Laboratorium Aktif
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>{todayFormatted}</span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#16382a', letterSpacing: '-0.02em', margin: 0 }}>
              Selamat Datang, {user?.full_name}
            </h2>
            <p style={{ fontSize: '13px', color: '#5f7d6f', margin: '4px 0 0 0', maxWidth: '620px', lineHeight: 1.5 }}>
              Ringkasan pemantauan kondisi perangkat, penilaian kelayakan pemeliharaan, dan tindak lanjut perbaikan periferal komputer.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('devices')}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #d4e2d8',
                fontWeight: 600,
                color: '#1e3a2f',
              }}
            >
              <HardDrive size={15} color="var(--brand-forest)" />
              Inventaris Perangkat
            </button>
            <button
              onClick={() => onNavigate('recommendations')}
              className="btn-primary"
              style={{
                fontSize: '13px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(32, 91, 67, 0.22)',
              }}
            >
              <Lightbulb size={15} />
              Rekomendasi Keputusan
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Row: Cohesive, Refined, Minimalist */}
      <div
        className="anim-fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Perangkat */}
        <div
          onClick={() => onNavigate('devices')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2ebe5',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--brand-forest)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Total Inventaris</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(32, 91, 67, 0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HardDrive size={18} color="var(--brand-forest)" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16382a', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {devicesTotal} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Unit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534', marginTop: '10px', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            {conditions.baik} Unit Kondisi Baik ({pctBaik}%)
          </div>
        </div>

        {/* Perlu Perhatian / Rusak */}
        <div
          onClick={() => onNavigate('devices')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2ebe5',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#d97706' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Perlu Perhatian</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#b45309" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16382a', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {totalRusak} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Unit</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: 500 }}>
            <span style={{ color: '#b45309', fontWeight: 600 }}>{conditions.rusak_ringan}</span> Ringan • <span style={{ color: '#dc2626', fontWeight: 600 }}>{conditions.rusak_berat}</span> Rusak Berat
          </div>
        </div>

        {/* Prioritas Penanganan SAW */}
        <div
          onClick={() => onNavigate('saw-results')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2ebe5',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#dc2626' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Prioritas Penanganan</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {prioritasTinggi} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Perangkat</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: 500 }}>
            Tingkat urgensi tinggi memerlukan tindakan
          </div>
        </div>

        {/* Realisasi Pemeliharaan */}
        <div
          onClick={() => onNavigate('repair-history')}
          className="dashboard-card-interactive"
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2ebe5',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--brand-forest)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Realisasi Perbaikan</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(32, 91, 67, 0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} color="var(--brand-forest)" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16382a', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {repairs.counts?.completed || 0} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Selesai</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: 500 }}>
            {(repairs.counts?.planned || 0) + (repairs.counts?.in_progress || 0)} Unit sedang proses penanganan
          </div>
        </div>
      </div>

      {/* 3. ROW 1: Donut Chart & SAW Priority Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Chart A: Donut Komposisi Kondisi Fisik */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2ebe5',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#16382a', margin: 0 }}>
                Komposisi Kondisi Fisik Perangkat
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Status Saat Ini</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', padding: '8px 0' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#edf2ee"
                  strokeWidth="14"
                />

                {/* Baik Segment */}
                {strokeBaik > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke="var(--brand-forest)"
                    strokeWidth="14"
                    strokeDasharray={`${strokeBaik} ${circumference}`}
                    strokeDashoffset={chartLoaded ? offsetBaik : circumference}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                )}

                {/* Rusak Ringan Segment */}
                {strokeRingan > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke="#d97706"
                    strokeWidth="14"
                    strokeDasharray={`${strokeRingan} ${circumference}`}
                    strokeDashoffset={chartLoaded ? offsetRingan : circumference}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                )}

                {/* Rusak Berat Segment */}
                {strokeBerat > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke="#dc2626"
                    strokeWidth="14"
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
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#16382a', lineHeight: 1 }}>
                  {pctBaik}%
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                  Kondisi Baik
                </div>
              </div>
            </div>

            {/* Clean, Refined Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '170px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f6f9f7',
                  border: '1px solid #e2ebe5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-forest)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#16382a' }}>Kondisi Baik</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-forest)' }}>
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
                  backgroundColor: '#fdfbf7',
                  border: '1px solid #f2e9dc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>Rusak Ringan</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400e' }}>
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
                  backgroundColor: '#fdf7f7',
                  border: '1px solid #fae3e3',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Rusak Berat</span>
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#991b1b' }}>
                  {conditions.rusak_berat} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>({pctBerat}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Bar */}
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #edf2ee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: '#16382a' }}>Kesiapan Operasional</span>
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                {operational.aktif} Aktif • {operational.dalam_perbaikan} Dalam Perbaikan • {operational.tidak_aktif} Nonaktif
              </span>
            </div>
            <div
              style={{
                height: '7px',
                backgroundColor: '#edf2ee',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.aktif / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: 'var(--brand-forest)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.dalam_perbaikan / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: '#d97706',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                style={{
                  width: chartLoaded ? `${devicesTotal > 0 ? (operational.tidak_aktif / devicesTotal) * 100 : 0}%` : '0%',
                  backgroundColor: '#dc2626',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Chart B: Prioritas & Evaluasi SAW */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2ebe5',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#16382a', margin: 0 }}>
                Distribusi Prioritas Evaluasi SAW
              </h3>
            </div>
            <button
              onClick={() => onNavigate('saw-results')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-forest)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Lihat Detail <ChevronRight size={13} />
            </button>
          </div>

          {/* Minimalist Progress Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
            {/* Prioritas Tinggi */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                  Prioritas Tinggi
                </span>
                <span style={{ fontWeight: 700, color: '#16382a' }}>
                  {prioritasTinggi} Perangkat{' '}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    ({Math.round((prioritasTinggi / totalEvaluatedSaw) * 100)}%)
                  </span>
                </span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#fef2f2', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: chartLoaded ? `${(prioritasTinggi / totalEvaluatedSaw) * 100}%` : '0%',
                    backgroundColor: '#dc2626',
                    borderRadius: '4px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>

            {/* Prioritas Sedang */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                  Prioritas Sedang
                </span>
                <span style={{ fontWeight: 700, color: '#16382a' }}>
                  {prioritasSedang} Perangkat{' '}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    ({Math.round((prioritasSedang / totalEvaluatedSaw) * 100)}%)
                  </span>
                </span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#fffbeb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: chartLoaded ? `${(prioritasSedang / totalEvaluatedSaw) * 100}%` : '0%',
                    backgroundColor: '#d97706',
                    borderRadius: '4px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>

            {/* Prioritas Rendah */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--brand-forest)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-forest)' }} />
                  Prioritas Rendah
                </span>
                <span style={{ fontWeight: 700, color: '#16382a' }}>
                  {prioritasRendah} Perangkat{' '}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    ({Math.round((prioritasRendah / totalEvaluatedSaw) * 100)}%)
                  </span>
                </span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#f0f6f2', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: chartLoaded ? `${(prioritasRendah / totalEvaluatedSaw) * 100}%` : '0%',
                    backgroundColor: 'var(--brand-forest)',
                    borderRadius: '4px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Workflow Status Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #edf2ee',
            }}
          >
            <div style={{ backgroundColor: '#f8faf9', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5eee8' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Persetujuan Pimpinan</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#16382a', marginTop: '2px' }}>
                {recommendations.approved}{' '}
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--brand-forest)' }}>Disetujui</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8faf9', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5eee8' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Rekomendasi Pembaruan</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#16382a', marginTop: '2px' }}>
                {latestSaw?.upgrade_candidates || 0}{' '}
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Unit Upgrade</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: Kategori Inventaris & Ringkasan Anggaran */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Chart C: Kategori Inventaris Perangkat */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2ebe5',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#16382a', margin: 0 }}>
                Distribusi Inventaris Perangkat
              </h3>
            </div>
            <button
              onClick={() => onNavigate('devices')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-forest)',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.slice(0, 5).map((cat) => {
              const count = cat.device_count || 0;
              const barPercent = Math.round((count / maxCategoryCount) * 100);
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 600, color: '#16382a' }}>{cat.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-forest)' }}>
                      {count} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Unit</span>
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#edf2ee', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: chartLoaded ? `${barPercent}%` : '0%',
                        backgroundColor: 'var(--brand-forest)',
                        borderRadius: '4px',
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #edf2ee', textAlign: 'right' }}>
            <button
              onClick={() => onNavigate('devices')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-forest)',
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

        {/* Chart D: Analisis Finansial Pemeliharaan */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2ebe5',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#16382a', margin: 0 }}>
                Realisasi Anggaran Pemeliharaan
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-forest)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Ekspor Laporan <ChevronRight size={13} />
            </button>
          </div>

          {/* Minimalist Financial Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#f8faf9', padding: '14px', borderRadius: '12px', border: '1px solid #e5eee8' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Estimasi Anggaran</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#16382a', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {formatRupiah(totalEstCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Total rencana perbaikan</div>
            </div>

            <div style={{ backgroundColor: '#f0f6f2', padding: '14px', borderRadius: '12px', border: '1px solid #d8e8dc' }}>
              <div style={{ fontSize: '11px', color: 'var(--brand-forest)', fontWeight: 600 }}>Realisasi Biaya Selesai</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--brand-forest)', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {formatRupiah(totalActCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#5f7d6f', marginTop: '2px' }}>Biaya aktual riil</div>
            </div>
          </div>

          {/* Budget Utilization Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#16382a' }}>Rasio Realisasi Terhadap Estimasi</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-forest)' }}>{budgetRatio}%</span>
            </div>
            <div style={{ height: '7px', backgroundColor: '#edf2ee', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: chartLoaded ? `${budgetRatio}%` : '0%',
                  backgroundColor: 'var(--brand-forest)',
                  borderRadius: '4px',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid #edf2ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534' }}>
              <CheckCircle2 size={15} color="var(--brand-forest)" />
              <span>Pengeluaran terkendali</span>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="btn-primary"
              style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px' }}
            >
              Unduh Rekap Laporan
            </button>
          </div>
        </div>
      </div>

      {/* 5. Riwayat Aktivitas & Log Sistem Terbaru: Clean, Minimalist Timeline */}
      <div
        className="anim-fade-in"
        style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2ebe5',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--brand-forest)" />
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#16382a', margin: 0 }}>
              Riwayat Aktivitas Sistem Terkini
            </h3>
          </div>
          <button
            onClick={() => onNavigate('activity-logs')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-forest)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            Lihat Seluruh Log <ChevronRight size={13} />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
            Belum ada aktivitas tercatat hari ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  backgroundColor: '#fbfdfb',
                  borderRadius: '10px',
                  border: '1px solid #edf3ef',
                  fontSize: '12.5px',
                  gap: '12px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4f8f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fbfdfb')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span
                    style={{
                      padding: '2px 7px',
                      backgroundColor: '#eaf2ed',
                      color: 'var(--brand-forest)',
                      borderRadius: '5px',
                      fontWeight: 600,
                      fontSize: '10.5px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {log.action_key}
                  </span>
                  <span style={{ color: '#16382a', fontWeight: 500 }}>
                    {log.summary}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', flexShrink: 0, fontSize: '11.5px' }}>
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
  );
};
