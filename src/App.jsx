import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoginView } from './components/LoginView.jsx';
import { AppShell } from './components/AppShell.jsx';
import { Server, AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--canvas-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: 'var(--base-white)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-danger-bg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={28} color="var(--status-danger)" />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Terjadi Kendala Memuat Komponen
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', lineHeight: 1.5, marginBottom: '20px' }}>
              Aplikasi mengalami kesalahan saat merender tampilan. Silakan muat ulang halaman untuk menyegarkan data.
            </p>

            {this.state.error && (
              <pre
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--status-danger)',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '20px',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
            >
              <RotateCcw size={15} />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--canvas-soft)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--brand-forest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Server size={24} color="var(--base-white)" />
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-gray-green)' }}>
          Memuat sesi pengguna...
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <LoginView />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
