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
  BarChart3,
  Calendar,
  ChevronRight,
  Monitor,
  Check,
  Clock,
  ArrowUpRight,
  Camera,
  Keyboard,
  Mouse,
  Printer,
  Cpu,
  Flame,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

const getCategoryIcon = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('keyboard')) return Keyboard;
  if (lower.includes('monitor') || lower.includes('layar')) return Monitor;
  if (lower.includes('mouse')) return Mouse;
  if (lower.includes('printer')) return Printer;
  if (lower.includes('komputer') || lower.includes('cpu') || lower.includes('pc')) return Cpu;
  return HardDrive;
};

const getCategoryColor = (index) => {
  const colors = [
    { solid: '#3B82F6', light: '#EFF6FF', border: '#BFDBFE', gradient: 'linear-gradient(180deg, #38BDF8 0%, #2563EB 100%)' }, // Cyan -> Electric Blue
    { solid: '#0284C7', light: '#E0F2FE', border: '#BAE6FD', gradient: 'linear-gradient(180deg, #60A5FA 0%, #0369A1 100%)' }, // Light Blue -> Royal Navy
    { solid: '#0D9488', light: '#CCFBF1', border: '#99F6E4', gradient: 'linear-gradient(180deg, #2DD4BF 0%, #0F766E 100%)' }, // Teal
    { solid: '#D97706', light: '#FEF3C7', border: '#FDE68A', gradient: 'linear-gradient(180deg, #FBBF24 0%, #B45309 100%)' }, // Amber
    { solid: '#6366F1', light: '#EEF2FF', border: '#C7D2FE', gradient: 'linear-gradient(180deg, #818CF8 0%, #4338CA 100%)' }, // Indigo
  ];
  return colors[index % colors.length];
};

export const DashboardView = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [categoryChartType, setCategoryChartType] = useState('bar');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [sawChartType, setSawChartType] = useState('bars');
  const [hoveredSawTier, setHoveredSawTier] = useState(null);

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

  // SAW Priority numbers & metrics
  const prioritasTinggi = latestSaw?.priority_bands?.Tinggi || 0;
  const prioritasSedang = latestSaw?.priority_bands?.Sedang || 0;
  const prioritasRendah = latestSaw?.priority_bands?.Rendah || 0;
  const totalEvaluatedSaw = prioritasTinggi + prioritasSedang + prioritasRendah;
  const safeTotalSaw = totalEvaluatedSaw > 0 ? totalEvaluatedSaw : 1;

  const pctTinggi = totalEvaluatedSaw > 0 ? Math.round((prioritasTinggi / safeTotalSaw) * 100) : 0;
  const pctSedang = totalEvaluatedSaw > 0 ? Math.round((prioritasSedang / safeTotalSaw) * 100) : 0;
  const pctRendah = totalEvaluatedSaw > 0 ? Math.max(0, 100 - pctTinggi - pctSedang) : 0;

  // Donut SVG Parameters for SAW (Radius 50, Circumference ~ 314.159)
  const sawRadius = 50;
  const sawCircumference = 2 * Math.PI * sawRadius;
  const sawStrokeTinggi = (pctTinggi / 100) * sawCircumference;
  const sawStrokeSedang = (pctSedang / 100) * sawCircumference;
  const sawStrokeRendah = (pctRendah / 100) * sawCircumference;

  const sawOffsetTinggi = 0;
  const sawOffsetSedang = -sawStrokeTinggi;
  const sawOffsetRendah = -(sawStrokeTinggi + sawStrokeSedang);

  // Financial calculations
  const totalEstCost = repairs.total_estimated_cost || 0;
  const totalActCost = repairs.total_actual_cost || 0;
  const budgetRatio = totalEstCost > 0 ? Math.min(100, Math.round((totalActCost / totalEstCost) * 100)) : 0;

  // Category distribution metrics and safe fallbacks
  const displayCategories = categories.length > 0 ? categories : [
    { id: 1, name: 'Keyboard', device_count: 1 },
    { id: 2, name: 'Monitor', device_count: 2 },
    { id: 3, name: 'Mouse', device_count: 1 },
    { id: 4, name: 'Printer', device_count: 0 },
    { id: 5, name: 'Komputer', device_count: 2 },
  ];
  const maxCategoryCount = Math.max(...displayCategories.map((c) => c.device_count || 0), 1);
  const dominantCategory = [...displayCategories].sort((a, b) => (b.device_count || 0) - (a.device_count || 0))[0];

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
              onClick={() => onNavigate('recommendations')}
              className="btn-primary"
              style={{
                fontSize: '13px',
                padding: '8px 18px',
                borderRadius: '9px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                backgroundColor: 'var(--electric-blue)',
              }}
              title="Buka menu Rekomendasi Keputusan"
            >
              <Lightbulb size={15} />
              Rekomendasi Keputusan
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Row: Clear Hierarchy & Comfortable Padding */}
      <div className="anim-fade-in dashboard-kpi-grid">
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

        {/* Prioritas Penanganan SAW */}
        <div
          onClick={() => onNavigate('saw-results')}
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
          title="Klik untuk membuka menu Hasil & Peringkat SAW"
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'var(--status-danger)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Prioritas Penanganan</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} color="var(--status-danger)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-danger)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {prioritasTinggi} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Perangkat</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
            Tingkat urgensi tinggi (SAW)
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

      {/* 3. ROW 1: Komposisi Kondisi & Distribusi Inventaris Perangkat */}
      <div className="dashboard-charts-row">
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

        {/* Chart C: Grafik Distribusi Inventaris Perangkat (Modern Animated Column & Donut Chart) */}
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
            position: 'relative',
          }}
        >
          <div>
            {/* Card Header with View Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--electric-blue-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--electric-blue)',
                  }}
                >
                  <BarChart3 size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Distribusi Inventaris Perangkat
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Visualisasi perbandingan unit per kategori periferal lab
                  </p>
                </div>
              </div>

              {/* View Switcher Pill (Kolom vs Donut) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '8px',
                    padding: '2.5px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => setCategoryChartType('bar')}
                    title="Grafik Batang / Kolom"
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: categoryChartType === 'bar' ? 'var(--surface-white)' : 'transparent',
                      color: categoryChartType === 'bar' ? 'var(--electric-blue)' : '#64748B',
                      boxShadow: categoryChartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <BarChart2 size={12} />
                    <span>Kolom</span>
                  </button>
                  <button
                    onClick={() => setCategoryChartType('donut')}
                    title="Grafik Komposisi Donut"
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: categoryChartType === 'donut' ? 'var(--surface-white)' : 'transparent',
                      color: categoryChartType === 'donut' ? 'var(--electric-blue)' : '#64748B',
                      boxShadow: categoryChartType === 'donut' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <PieChart size={12} />
                    <span>Donut</span>
                  </button>
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
                    gap: '2px',
                  }}
                >
                  Semua <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* CHART DISPLAY AREA */}
            {categoryChartType === 'bar' ? (
              /* 1. Mode Grafik Kolom (Vertical Bar Chart) dengan Gridlines & Animasi Naik */
              <div
                style={{
                  position: 'relative',
                  padding: '16px 8px 6px 8px',
                  backgroundColor: '#FAFBFD',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '14px',
                }}
              >
                {/* Horizontal Guide Gridlines */}
                <div
                  style={{
                    position: 'absolute',
                    top: '28px',
                    left: '12px',
                    right: '12px',
                    bottom: '56px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ borderTop: '1px dashed #E2E8F0', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '-7px', backgroundColor: '#FAFBFD', paddingLeft: '4px' }}>
                      {maxCategoryCount} Unit
                    </span>
                  </div>
                  <div style={{ borderTop: '1px dashed #E2E8F0', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '-7px', backgroundColor: '#FAFBFD', paddingLeft: '4px' }}>
                      {Math.ceil(maxCategoryCount / 2)} Unit
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid #CBD5E1', width: '100%' }} />
                </div>

                {/* Animated Columns Grid */}
                <div
                  className="chart-columns-grid"
                  style={{
                    gridTemplateColumns: `repeat(${displayCategories.length}, 1fr)`,
                  }}
                >
                  {displayCategories.map((cat, idx) => {
                    const count = cat.device_count || 0;
                    const pctOfMax = maxCategoryCount > 0 ? Math.round((count / maxCategoryCount) * 100) : 0;
                    const pctOfTotal = devicesTotal > 0 ? Math.round((count / devicesTotal) * 100) : 0;
                    const colorScheme = getCategoryColor(idx);
                    const IconComp = getCategoryIcon(cat.name);
                    const isHovered = hoveredCategory === cat.id;

                    return (
                      <div
                        key={cat.id || idx}
                        className="chart-column-item"
                        onMouseEnter={() => setHoveredCategory(cat.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Value Badge at top of column */}
                        <div
                          style={{
                            marginBottom: '6px',
                            padding: '2px 7px',
                            borderRadius: '12px',
                            backgroundColor: isHovered ? colorScheme.solid : colorScheme.light,
                            color: isHovered ? '#FFFFFF' : colorScheme.solid,
                            fontSize: '11px',
                            fontWeight: 700,
                            border: `1px solid ${colorScheme.border}`,
                            transition: 'all 0.2s ease',
                            animation: isHovered ? 'bouncePill 0.6s infinite' : 'none',
                          }}
                        >
                          {count}
                        </div>

                        {/* Column Track & Animated Fill Bar */}
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '42px',
                            height: '105px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '8px 8px 3px 3px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            overflow: 'hidden',
                            border: `1px solid ${isHovered ? colorScheme.solid : '#E2E8F0'}`,
                            boxShadow: isHovered ? `0 0 0 2px ${colorScheme.light}` : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            className="chart-bar-fill"
                            style={{
                              width: '100%',
                              height: chartLoaded ? `${Math.max(count > 0 ? 12 : 4, pctOfMax)}%` : '0%',
                              background: count > 0 ? colorScheme.gradient : '#CBD5E1',
                              borderRadius: '7px 7px 0 0',
                              borderTop: count > 0 ? '2px solid rgba(255, 255, 255, 0.75)' : 'none',
                              boxShadow: count > 0 ? `0 4px 12px rgba(59, 130, 246, 0.25)` : 'none',
                            }}
                          />
                        </div>

                        {/* Column X-Axis Footer Label */}
                        <div
                          style={{
                            marginTop: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '3px',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              backgroundColor: colorScheme.light,
                              color: colorScheme.solid,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${colorScheme.border}`,
                            }}
                          >
                            <IconComp size={13} />
                          </div>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: isHovered ? 700 : 600,
                              color: isHovered ? 'var(--electric-blue)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '68px',
                            }}
                            title={cat.name}
                          >
                            {cat.name}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>
                            {pctOfTotal}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 2. Mode Grafik Donut Komposisi Kategori */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  flexWrap: 'wrap',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#FAFBFD',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '14px',
                  minHeight: '208px',
                }}
              >
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
                  <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="68" cy="68" r="52" fill="transparent" stroke="#E2E8F0" strokeWidth="14" />
                    {(() => {
                      const radius = 52;
                      const circ = 2 * Math.PI * radius;
                      let accOffset = 0;
                      return displayCategories.map((cat, idx) => {
                        const count = cat.device_count || 0;
                        const sliceLen = devicesTotal > 0 ? (count / devicesTotal) * circ : 0;
                        const offset = -accOffset;
                        accOffset += sliceLen;
                        const col = getCategoryColor(idx);
                        if (sliceLen <= 0) return null;
                        return (
                          <circle
                            key={cat.id || idx}
                            cx="68"
                            cy="68"
                            r={radius}
                            fill="transparent"
                            stroke={col.solid}
                            strokeWidth="14"
                            strokeDasharray={`${sliceLen} ${circ}`}
                            strokeDashoffset={chartLoaded ? offset : circ}
                            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                          />
                        );
                      });
                    })()}
                  </svg>
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
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {devicesTotal}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                      Total Unit
                    </div>
                  </div>
                </div>

                {/* Donut Legend List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
                  {displayCategories.map((cat, idx) => {
                    const count = cat.device_count || 0;
                    const pctOfTotal = devicesTotal > 0 ? Math.round((count / devicesTotal) * 100) : 0;
                    const col = getCategoryColor(idx);
                    const IconComp = getCategoryIcon(cat.name);
                    return (
                      <div
                        key={cat.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          border: `1px solid ${col.border}`,
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.solid }} />
                          <IconComp size={13} color={col.solid} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: col.solid }}>
                          {count} <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>({pctOfTotal}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clean Category Summary Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Cakupan Kategori</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {displayCategories.length} <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>Jenis Periferal</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Dominasi Terbanyak</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--electric-blue)', marginTop: '2px' }}>
                  {dominantCategory?.name || 'Komputer'}{' '}
                  <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>
                    ({dominantCategory?.device_count || 0} Unit)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Link */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
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

      {/* 4. ROW 2: Prioritas Evaluasi SAW & Realisasi Anggaran Pemeliharaan */}
      <div className="dashboard-charts-row">
        {/* Chart B: Prioritas & Evaluasi SAW (Modern Animated Priority Channels & Donut Chart) */}
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
            position: 'relative',
          }}
        >
          <div>
            {/* Header with View Switcher (Urgensi vs Donut) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-danger)',
                  }}
                >
                  <Activity size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Distribusi Prioritas Evaluasi SAW
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Tingkat urgensi penanganan dari kalkulasi preferensi Simple Additive Weighting
                  </p>
                </div>
              </div>

              {/* View Switcher & Detail Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '8px',
                    padding: '2.5px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => setSawChartType('bars')}
                    title="Tingkat Urgensi SAW"
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: sawChartType === 'bars' ? 'var(--surface-white)' : 'transparent',
                      color: sawChartType === 'bars' ? 'var(--electric-blue)' : '#64748B',
                      boxShadow: sawChartType === 'bars' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    <BarChart2 size={12} />
                    <span>Urgensi</span>
                  </button>
                  <button
                    onClick={() => setSawChartType('donut')}
                    title="Grafik Donut Komposisi SAW"
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: sawChartType === 'donut' ? 'var(--surface-white)' : 'transparent',
                      color: sawChartType === 'donut' ? 'var(--electric-blue)' : '#64748B',
                      boxShadow: sawChartType === 'donut' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    <PieChart size={12} />
                    <span>Donut</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('saw-results')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--electric-blue)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  Detail <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* CHART DISPLAY: Mode Urgensi (Animated Channels) OR Mode Donut */}
            {sawChartType === 'bars' ? (
              /* 1. Mode Animated Urgency Channels with Custom Gradients & Badges */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {/* Prioritas Tinggi */}
                <div
                  className="saw-tier-card"
                  onMouseEnter={() => setHoveredSawTier('Tinggi')}
                  onMouseLeave={() => setHoveredSawTier(null)}
                  style={{
                    backgroundColor: hoveredSawTier === 'Tinggi' ? 'rgba(254, 242, 242, 0.7)' : '#FAFBFD',
                    border: '1px solid',
                    borderColor: hoveredSawTier === 'Tinggi' ? '#FCA5A5' : '#E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#FEE2E2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#DC2626',
                        }}
                      >
                        <Flame size={14} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="anim-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>Prioritas Tinggi</span>
                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>
                          V<sub>i</sub> ≥ 0.70
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {prioritasTinggi} Perangkat
                      </span>
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#DC2626',
                          backgroundColor: '#FEE2E2',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {pctTinggi}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track with Glow & Custom Cubic Bezier */}
                  <div style={{ height: '8px', backgroundColor: '#FEE2E2', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: chartLoaded ? `${pctTinggi}%` : '0%',
                        background: 'linear-gradient(90deg, #F87171 0%, #EF4444 60%, #DC2626 100%)',
                        borderRadius: '5px',
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                        transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px' }}>
                    Tindakan segera: Butuh perbaikan intensif atau pertimbangan peremajaan komponen
                  </div>
                </div>

                {/* Prioritas Sedang */}
                <div
                  className="saw-tier-card"
                  onMouseEnter={() => setHoveredSawTier('Sedang')}
                  onMouseLeave={() => setHoveredSawTier(null)}
                  style={{
                    backgroundColor: hoveredSawTier === 'Sedang' ? 'rgba(254, 243, 199, 0.7)' : '#FAFBFD',
                    border: '1px solid',
                    borderColor: hoveredSawTier === 'Sedang' ? '#FCD34D' : '#E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D97706',
                        }}
                      >
                        <Clock size={14} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>Prioritas Sedang</span>
                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>
                          0.50 ≤ V<sub>i</sub> &lt; 0.70
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {prioritasSedang} Perangkat
                      </span>
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#D97706',
                          backgroundColor: '#FEF3C7',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {pctSedang}%
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '8px', backgroundColor: '#FEF3C7', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: chartLoaded ? `${pctSedang}%` : '0%',
                        background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 60%, #D97706 100%)',
                        borderRadius: '5px',
                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                        transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px' }}>
                    Tindakan terjadwal: Pemeliharaan berkala, servis minor, dan kalibrasi periferal
                  </div>
                </div>

                {/* Prioritas Rendah */}
                <div
                  className="saw-tier-card"
                  onMouseEnter={() => setHoveredSawTier('Rendah')}
                  onMouseLeave={() => setHoveredSawTier(null)}
                  style={{
                    backgroundColor: hoveredSawTier === 'Rendah' ? 'rgba(238, 242, 255, 0.7)' : '#FAFBFD',
                    border: '1px solid',
                    borderColor: hoveredSawTier === 'Rendah' ? '#A5B4FC' : '#E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#DBEAFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563EB',
                        }}
                      >
                        <ShieldCheck size={14} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>Prioritas Rendah</span>
                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#2563EB', fontWeight: 600 }}>
                          V<sub>i</sub> &lt; 0.50
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {prioritasRendah} Perangkat
                      </span>
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#2563EB',
                          backgroundColor: '#DBEAFE',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {pctRendah}%
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '8px', backgroundColor: '#DBEAFE', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: chartLoaded ? `${pctRendah}%` : '0%',
                        background: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 60%, #1D4ED8 100%)',
                        borderRadius: '5px',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.35)',
                        transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px' }}>
                    Kondisi terkendali: Cukup pembersihan rutin dan siap digunakan praktikum
                  </div>
                </div>
              </div>
            ) : (
              /* 2. Mode Grafik Donut SAW dengan Detail Interaktif */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 16px',
                  backgroundColor: '#FAFBFD',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px',
                }}
              >
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background Track */}
                    <circle
                      cx="70"
                      cy="70"
                      r={sawRadius}
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="14"
                    />
                    {/* Segment 1: Tinggi (Red) */}
                    {pctTinggi > 0 && (
                      <circle
                        className="saw-donut-slice"
                        cx="70"
                        cy="70"
                        r={sawRadius}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth={hoveredSawTier === 'Tinggi' ? 16 : 14}
                        strokeDasharray={`${chartLoaded ? sawStrokeTinggi : 0} ${sawCircumference}`}
                        strokeDashoffset={sawOffsetTinggi}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredSawTier('Tinggi')}
                        onMouseLeave={() => setHoveredSawTier(null)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {/* Segment 2: Sedang (Amber) */}
                    {pctSedang > 0 && (
                      <circle
                        className="saw-donut-slice"
                        cx="70"
                        cy="70"
                        r={sawRadius}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth={hoveredSawTier === 'Sedang' ? 16 : 14}
                        strokeDasharray={`${chartLoaded ? sawStrokeSedang : 0} ${sawCircumference}`}
                        strokeDashoffset={sawOffsetSedang}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredSawTier('Sedang')}
                        onMouseLeave={() => setHoveredSawTier(null)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {/* Segment 3: Rendah (Blue) */}
                    {pctRendah > 0 && (
                      <circle
                        className="saw-donut-slice"
                        cx="70"
                        cy="70"
                        r={sawRadius}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth={hoveredSawTier === 'Rendah' ? 16 : 14}
                        strokeDasharray={`${chartLoaded ? sawStrokeRendah : 0} ${sawCircumference}`}
                        strokeDashoffset={sawOffsetRendah}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredSawTier('Rendah')}
                        onMouseLeave={() => setHoveredSawTier(null)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </svg>
                  {/* Center Text Info */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    {hoveredSawTier === 'Tinggi' ? (
                      <>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626' }}>{prioritasTinggi}</span>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Tinggi</span>
                      </>
                    ) : hoveredSawTier === 'Sedang' ? (
                      <>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>{prioritasSedang}</span>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Sedang</span>
                      </>
                    ) : hoveredSawTier === 'Rendah' ? (
                      <>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB' }}>{prioritasRendah}</span>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Rendah</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626' }}>{prioritasTinggi}</span>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Urgensi Tinggi</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Donut Legend Cards */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onMouseEnter={() => setHoveredSawTier('Tinggi')}
                    onMouseLeave={() => setHoveredSawTier(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: hoveredSawTier === 'Tinggi' ? '#FEE2E2' : 'var(--status-danger-bg)',
                      border: '1px solid var(--status-danger-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="anim-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C' }}>Tinggi</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#B91C1C' }}>
                      {prioritasTinggi} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>({pctTinggi}%)</span>
                    </span>
                  </div>

                  <div
                    onMouseEnter={() => setHoveredSawTier('Sedang')}
                    onMouseLeave={() => setHoveredSawTier(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: hoveredSawTier === 'Sedang' ? '#FEF3C7' : 'var(--status-warning-bg)',
                      border: '1px solid var(--status-warning-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#B45309' }}>Sedang</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#B45309' }}>
                      {prioritasSedang} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>({pctSedang}%)</span>
                    </span>
                  </div>

                  <div
                    onMouseEnter={() => setHoveredSawTier('Rendah')}
                    onMouseLeave={() => setHoveredSawTier(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: hoveredSawTier === 'Rendah' ? '#DBEAFE' : 'var(--electric-blue-light)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>Rendah</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1D4ED8' }}>
                      {prioritasRendah} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>({pctRendah}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Status Badges & Quick Action Link */}
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                gap: '10px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--status-success-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-success)',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Persetujuan Pimpinan</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {recommendations.approved}{' '}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-success)' }}>Disetujui</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366F1',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Rekomendasi Pembaruan</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {latestSaw?.upgrade_candidates || 0}{' '}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6366F1' }}>Unit Upgrade</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action to Full SAW Calculation */}
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onNavigate('saw-results')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--electric-blue)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
              >
                <span>Buka Matriks & Kalkulasi Lengkap SAW</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

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
              <button
                onClick={() => onNavigate('reports')}
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
                Ekspor Laporan <ChevronRight size={13} />
              </button>
            </div>

            {/* Minimalist Financial Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '14px' }}>
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
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--status-success)', fontWeight: 500 }}>
              <CheckCircle2 size={15} color="var(--status-success)" />
              <span>Pengeluaran terkendali</span>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="btn-primary"
              style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--electric-blue)' }}
            >
              Unduh Rekap Laporan
            </button>
          </div>
        </div>
      </div>

      {/* 5. Riwayat Aktivitas & Log Sistem Terbaru */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--electric-blue)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Riwayat Aktivitas Sistem Terkini
            </h3>
          </div>
          <button
            onClick={() => onNavigate('activity-logs')}
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
            Lihat Seluruh Log <ChevronRight size={13} />
          </button>
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
                  gap: '10px',
                  flexWrap: 'wrap',
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
  );
};
