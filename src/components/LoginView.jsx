import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Server, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView = () => {
  const { login, authError, setAuthError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [branding, setBranding] = useState({
    app_title: 'SPK Periferal',
    institution_name: 'Ponpes Al Ihsan Baron',
    logo_url: null,
  });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

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
    return () => {
      isMounted = false;
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--canvas-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand / Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 16px auto',
              borderRadius: '16px',
              backgroundColor: 'var(--brand-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
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
              <Server size={30} color="var(--base-white)" />
            )}
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {branding.app_title || 'SPK Periferal'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
            {branding.institution_name || 'Ponpes Al Ihsan Baron'}
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Masuk ke Sistem</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
              Gunakan akun terdaftar sesuai peran wewenang Anda.
            </p>
          </div>

          {authError && (
            <div
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-input)',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={16} color="var(--status-danger)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--status-danger)', lineHeight: 1.4 }}>
                {authError}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
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
                    color: 'var(--text-gray-green)',
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
                  placeholder="Masukkan nama pengguna / email"
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--canvas-soft)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--brand-forest)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-soft)')}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
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
                    color: 'var(--text-gray-green)',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--canvas-soft)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--brand-forest)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-soft)')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-gray-green)',
          }}
        >
          <ShieldCheck size={14} color="var(--brand-forest)" />
          <span>Autentikasi PBKDF2-HMAC-SHA256 & Otorisasi RBAC Aktif</span>
        </div>
      </div>
    </div>
  );
};
