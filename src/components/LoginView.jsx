import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Server,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  Download,
  Share2,
  Monitor,
  CheckCircle2,
  X,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export const LoginView = () => {
  const { login, authError, setAuthError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Branding state
  const [branding, setBranding] = useState({
    app_title: 'SPK Periferal',
    institution_name: 'Ponpes Al Ihsan Baron',
    logo_url: null,
  });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  // PWA & Mobile Installation state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState('android');

  useEffect(() => {
    let isMounted = true;
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/v1/settings/public-branding');
        if (res.ok) {
          const json = await res.json();
          if (json?.data && isMounted) {
            setBranding({
              app_title: json.data.app_title || 'SPK Periferal',
              institution_name: json.data.institution_name || 'Ponpes Al Ihsan Baron',
              logo_url: json.data.logo_url || null,
            });
          }
        }
      } catch (err) {
        // Fallback to default branding
      }
    };

    fetchBranding();

    // Listen to beforeinstallprompt event (Chrome, Android, Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setAuthError('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    await login(username.trim(), password);
    setSubmitting(false);
  };

  // Direct 1-click PWA install if browser triggered event
  const handleTriggerNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        backgroundImage: `
          radial-gradient(circle at 10% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 90% 85%, rgba(34, 211, 238, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(241, 245, 249, 0.5) 0%, transparent 70%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
        {/* Brand / Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 14px auto',
              borderRadius: '18px',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34, 211, 238, 0.2), 0 2px 6px rgba(15, 23, 42, 0.1)',
              border: '1.5px solid rgba(34, 211, 238, 0.4)',
              overflow: 'hidden',
              transition: 'transform 0.2s ease',
            }}
          >
            {branding.logo_url && !logoLoadFailed ? (
              <img
                src={branding.logo_url}
                alt="Logo Sistem"
                onError={() => setLogoLoadFailed(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '6px',
                }}
              />
            ) : (
              <Server size={32} color="var(--accent-cyan)" />
            )}
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            {branding.app_title || 'SPK Periferal'}
          </h1>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '20px',
              padding: '3px 10px',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--electric-blue)',
            }}
          >
            <span
              className="anim-pulse-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-cyan)',
              }}
            />
            {branding.institution_name || 'Ponpes Al Ihsan Baron'}
          </div>
        </div>

        {/* Login Card */}
        <div
          className="anim-fade-in"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px 26px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Masuk ke Sistem
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
              Silakan masukkan kredensial akun Anda untuk mengakses sistem.
            </p>
          </div>

          {authError && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12.5px', color: '#991B1B', lineHeight: 1.4 }}>
                {authError}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Input Username */}
            <div>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '5px',
                }}
              >
                Nama Pengguna / Email
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <User size={16} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email..."
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '9px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13.5px',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--electric-blue)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Input Password with Eye Toggle */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '5px',
                }}
              >
                Kata Sandi
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 38px',
                    borderRadius: '9px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13.5px',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--electric-blue)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                />

                {/* Eye toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748B',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--electric-blue)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '9px',
                marginTop: '4px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="anim-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* INSTALL / DOWNLOAD MOBILE APP BUTTON */}
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '9px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px dashed rgba(59, 130, 246, 0.4)',
                color: 'var(--electric-blue)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                e.currentTarget.style.borderColor = 'var(--electric-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
            >
              <Smartphone size={16} />
              <span>Install Versi Aplikasi (Mobile / Web App)</span>
              <Download size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />
            </button>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div
          style={{
            marginTop: '18px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="#16A34A" />
            <span>Koneksi Aman &amp; Terenkripsi (PBKDF2)</span>
          </div>
          <span>•</span>
          <span>v1.0</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: PANDUAN & DOWNLOAD APLIKASI VERSI MOBILE (PWA)           */}
      {/* ============================================================== */}
      {showInstallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="anim-fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Smartphone size={20} color="var(--electric-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Install Aplikasi SPK Periferal
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Pasang di HP (Android/iOS) atau Komputer
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Direct 1-Click Install Button if supported by Browser */}
            {isInstallable && deferredPrompt && (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Dukungan Pasang Langsung Siap!
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Browser Anda mendukung instalasi 1-klik ke layar utama.
                  </div>
                </div>
                <button
                  onClick={handleTriggerNativeInstall}
                  className="btn-primary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    borderRadius: '7px',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Download size={13} />
                  Pasang Sekarang
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                backgroundColor: '#F1F5F9',
                padding: '4px',
                borderRadius: '9px',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setActivePlatformTab('android')}
                style={{
                  padding: '6px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activePlatformTab === 'android' ? '#ffffff' : 'transparent',
                  color: activePlatformTab === 'android' ? 'var(--electric-blue)' : '#64748B',
                  boxShadow: activePlatformTab === 'android' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Smartphone size={13} />
                Android
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('ios')}
                style={{
                  padding: '6px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activePlatformTab === 'ios' ? '#ffffff' : 'transparent',
                  color: activePlatformTab === 'ios' ? 'var(--electric-blue)' : '#64748B',
                  boxShadow: activePlatformTab === 'ios' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Share2 size={13} />
                iPhone (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('desktop')}
                style={{
                  padding: '6px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activePlatformTab === 'desktop' ? '#ffffff' : 'transparent',
                  color: activePlatformTab === 'desktop' ? 'var(--electric-blue)' : '#64748B',
                  boxShadow: activePlatformTab === 'desktop' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Monitor size={13} />
                Komputer
              </button>
            </div>

            {/* Instruction Guides */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px', border: '1px solid #E2E8F0', fontSize: '12.5px', lineHeight: 1.6 }}>
              {activePlatformTab === 'android' && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#16A34A" />
                    Cara Pasang di HP Android (Google Chrome):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Buka halaman web ini di browser <strong>Google Chrome</strong> di HP Anda.</li>
                    <li>Ketuk ikon menu titik tiga (<strong>⋮</strong>) di sudut kanan atas browser.</li>
                    <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
                    <li>Ikon aplikasi resmi SPK Periferal akan otomatis terpasang di layar utama HP Anda layaknya aplikasi native.</li>
                  </ol>
                </div>
              )}

              {activePlatformTab === 'ios' && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#16A34A" />
                    Cara Pasang di iPhone / iPad (Safari):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Buka halaman web ini menggunakan browser resmi <strong>Safari</strong>.</li>
                    <li>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas di bilah bawah).</li>
                    <li>Gulir menu ke bawah lalu ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                    <li>Ketuk tombol <strong>"Tambah" (Add)</strong> di pojok kanan atas untuk menyelesaikan.</li>
                  </ol>
                </div>
              )}

              {activePlatformTab === 'desktop' && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#16A34A" />
                    Cara Pasang di Laptop / Komputer (Chrome &amp; Edge):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Buka aplikasi di browser <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.</li>
                    <li>Perhatikan ikon <strong>Instal Aplikasi</strong> (ikon monitor dengan panah ke bawah) di sebelah kanan kolom URL / address bar.</li>
                    <li>Klik ikon tersebut lalu pilih <strong>"Instal"</strong>.</li>
                    <li>Aplikasi akan terbuka di jendela tersendiri tanpa bilah browser.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Benefits Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '11.5px', color: '#64748B' }}>
              <HelpCircle size={14} color="var(--electric-blue)" style={{ flexShrink: 0 }} />
              <span>Aplikasi web progresif (PWA) berjalan sangat cepat, hemat kuota, dan tidak memakan kapasitas memori HP.</span>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 600, borderRadius: '8px' }}
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
