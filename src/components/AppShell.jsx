import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Server,
  LayoutDashboard,
  HardDrive,
  Camera,
  History,
  Sliders,
  Award,
  ClipboardList,
  BarChart3,
  Lightbulb,
  FileText,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Play,
  Activity,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { DeviceManagement } from './DeviceManagement.jsx';
import { DamageDocumentationView } from './DamageDocumentationView.jsx';
import { CriteriaManagement } from './CriteriaManagement.jsx';
import { AssessmentAndSaw } from './AssessmentAndSaw.jsx';
import { RecommendationsAndFollowUp } from './RecommendationsAndFollowUp.jsx';
import { DashboardView } from './DashboardView.jsx';
import { ReportsAndExport } from './ReportsAndExport.jsx';
import { ActivityLogsView } from './ActivityLogsView.jsx';
import { UserManagement } from './UserManagement.jsx';

export const AppShell = () => {
  const { user, token, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic branding state (Title, Institution, and Logo)
  const [branding, setBranding] = useState({
    app_title: 'SPK Periferal',
    institution_name: 'Ponpes Al Ihsan Baron',
    logo_url: null,
  });

  useEffect(() => {
    if (!token) return;
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const b = json.data?.app_branding;
          if (b) {
            setBranding({
              app_title: b.app_title || 'SPK Periferal',
              institution_name: b.institution_name || 'Ponpes Al Ihsan Baron',
              logo_url: b.logo_url || null,
            });
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchBranding();

    const handleBrandingUpdate = (e) => {
      if (e.detail) {
        setBranding((prev) => ({ ...prev, ...e.detail }));
      } else {
        fetchBranding();
      }
    };
    window.addEventListener('app-branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('app-branding-updated', handleBrandingUpdate);
  }, [token]);

  // RBAC Navigation Configuration conforming to SOT/PRD.md Section 4 & SOT/UI-GUIDELINE.md Section 4
  const navigationGroups = [
    {
      group: 'Ringkasan',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pimpinan', 'teknisi'] },
      ],
    },
    {
      group: 'Perangkat',
      items: [
        { id: 'devices', label: 'Data Perangkat', icon: HardDrive, roles: ['admin', 'pimpinan', 'teknisi'] },
        { id: 'damage-docs', label: 'Dokumentasi Kerusakan', icon: Camera, roles: ['admin', 'pimpinan', 'teknisi'] },
        { id: 'repair-history', label: 'Riwayat Perbaikan & Upgrade', icon: History, roles: ['admin', 'pimpinan', 'teknisi'] },
      ],
    },
    {
      group: 'Metode SAW',
      items: [
        { id: 'criteria', label: 'Kriteria & Bobot', icon: Sliders, roles: ['admin', 'pimpinan'] },
        { id: 'scale-guides', label: 'Skala Penilaian', icon: Award, roles: ['admin', 'pimpinan', 'teknisi'] },
        { id: 'assessments', label: 'Penilaian Perangkat', icon: ClipboardList, roles: ['admin', 'pimpinan', 'teknisi'] },
        { id: 'saw-results', label: 'Hasil & Peringkat', icon: BarChart3, roles: ['admin', 'pimpinan', 'teknisi'] },
        { id: 'recommendations', label: 'Rekomendasi Keputusan', icon: Lightbulb, roles: ['admin', 'pimpinan', 'teknisi'] },
      ],
    },
    {
      group: 'Pelaporan',
      items: [
        { id: 'reports', label: 'Laporan', icon: FileText, roles: ['admin', 'pimpinan'] },
      ],
    },
    {
      group: 'Administrasi',
      items: [
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['admin'] },
        { id: 'activity-logs', label: 'Log Aktivitas', icon: ScrollText, roles: ['admin', 'pimpinan'] },
        { id: 'settings', label: 'Pengaturan Sistem', icon: Settings, roles: ['admin'] },
      ],
    },
  ];

  // Filter navigation by role (server-side authority principle)
  const allowedGroups = navigationGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => item.roles.includes(user?.role)),
    }))
    .filter((grp) => grp.items.length > 0);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-success">Administrator</span>;
      case 'pimpinan':
        return <span className="badge badge-info">Pimpinan Lab</span>;
      case 'teknisi':
        return <span className="badge badge-warning">Teknisi Lapangan</span>;
      default:
        return <span className="badge badge-info">{role}</span>;
    }
  };

  return (
    <div className="app-shell-root" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--canvas-soft)' }}>
      {/* Sidebar Navigation (248px desktop conforming to SOT/UI-GUIDELINE.md) */}
      <aside
        className="no-print"
        style={{
          width: '248px',
          backgroundColor: 'var(--brand-forest)',
          color: 'var(--base-white)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transform: mobileMenuOpen ? 'translateX(0)' : undefined,
          transition: 'transform 200ms ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: branding.logo_url ? '#FFFFFF' : 'rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
              overflow: 'hidden',
              padding: branding.logo_url ? '3px' : 0,
            }}
          >
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.app_title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <Server
              size={20}
              color="var(--base-white)"
              style={{ display: branding.logo_url ? 'none' : 'block' }}
            />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--base-white)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {branding.app_title || 'SPK Periferal'}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--surface-sage)', opacity: 0.85, marginTop: '2px' }}>
              {branding.institution_name || 'Ponpes Al Ihsan Baron'}
            </p>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {allowedGroups.map((grp) => (
            <div key={grp.group}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--surface-sage)',
                  opacity: 0.65,
                  letterSpacing: '0.04em',
                  padding: '0 8px 6px 8px',
                }}
              >
                {grp.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-input)',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 400,
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                        color: 'var(--base-white)',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon size={16} color="var(--surface-sage)" style={{ opacity: isActive ? 1 : 0.8 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--base-white)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--base-white)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.full_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--surface-sage)', opacity: 0.8 }}>
                @{user?.username}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {getRoleBadge(user?.role)}
            <button
              onClick={logout}
              title="Keluar dari sistem"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--surface-sage)',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Layout */}
      <div className="app-main-layout" style={{ flex: 1, marginLeft: '248px', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header
          className="no-print"
          style={{
            height: '60px',
            backgroundColor: 'var(--base-white)',
            borderBottom: '1px solid var(--border-soft)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>Navigasi</span>
            <span style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>/</span>
            <strong style={{ fontSize: '14px', color: 'var(--brand-forest)' }}>
              {{
                dashboard: 'Dashboard',
                devices: 'Data Perangkat',
                'damage-docs': 'Dokumentasi Kerusakan',
                'repair-history': 'Riwayat Perbaikan & Upgrade',
                criteria: 'Kriteria & Bobot',
                'scale-guides': 'Skala Penilaian',
                assessments: 'Penilaian Perangkat',
                'saw-results': 'Hasil & Peringkat',
                recommendations: 'Rekomendasi Keputusan',
                reports: 'Laporan',
                users: 'Manajemen Pengguna',
                'activity-logs': 'Log Aktivitas',
                settings: 'Pengaturan Sistem',
                notifications: 'Notifikasi Lab',
              }[activeMenu] || activeMenu}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Notifications Bell */}
            <button
              onClick={() => setActiveMenu('notifications')}
              title="Notifikasi Lab"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: activeMenu === 'notifications' ? 'var(--surface-sage)' : 'transparent',
                border: '1px solid var(--border-soft)',
                cursor: 'pointer',
                color: activeMenu === 'notifications' ? 'var(--brand-forest)' : 'var(--text-primary)',
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-danger)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--surface-sage)',
                color: 'var(--brand-forest)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-badge)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-soft)',
              }}
            >
              <Calendar size={13} />
              <span>Periode 2026 / Ganjil</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#065f46',
                padding: '6px 14px',
                borderRadius: 'var(--radius-badge)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)',
                  display: 'inline-block',
                }}
              />
              <span>Sistem Aktif • v1.0</span>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="container" style={{ flex: 1 }}>
          {activeMenu === 'devices' ? (
            <DeviceManagement />
          ) : activeMenu === 'damage-docs' ? (
            <DamageDocumentationView />
          ) : activeMenu === 'criteria' ? (
            <CriteriaManagement defaultTab="criteria" />
          ) : activeMenu === 'scale-guides' ? (
            <CriteriaManagement defaultTab="scales" />
          ) : activeMenu === 'settings' ? (
            <CriteriaManagement defaultTab="system-settings" />
          ) : activeMenu === 'assessments' ? (
            <AssessmentAndSaw defaultTab="assessments" />
          ) : activeMenu === 'saw-results' ? (
            <AssessmentAndSaw defaultTab="saw-results" />
          ) : activeMenu === 'recommendations' ? (
            <RecommendationsAndFollowUp defaultTab="recommendations" />
          ) : activeMenu === 'repair-history' ? (
            <RecommendationsAndFollowUp defaultTab="follow-up" />
          ) : activeMenu === 'notifications' ? (
            <RecommendationsAndFollowUp defaultTab="notifications" />
          ) : activeMenu === 'reports' ? (
            <ReportsAndExport />
          ) : activeMenu === 'activity-logs' ? (
            <ActivityLogsView />
          ) : activeMenu === 'users' ? (
            <UserManagement />
          ) : activeMenu === 'dashboard' ? (
            <DashboardView onNavigate={(menu) => setActiveMenu(menu)} />
          ) : (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Menu Tidak Ditemukan
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-gray-green)', maxWidth: '540px', margin: '8px auto 20px auto' }}>
                Fitur yang Anda pilih ({activeMenu}) tidak tersedia atau tidak termasuk dalam cakupan sistem.
              </p>
              <button onClick={() => setActiveMenu('dashboard')} className="btn-primary">
                <LayoutDashboard size={15} />
                Kembali ke Dashboard
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          className="no-print"
          style={{
            borderTop: '1px solid var(--border-soft)',
            backgroundColor: 'var(--base-white)',
            padding: '16px 24px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-gray-green)',
          }}
        >
          Sistem Pendukung Keputusan Periferal · Laboratorium Komputer Pondok Pesantren Al Ihsan Baron
        </footer>
      </div>
    </div>
  );
};
