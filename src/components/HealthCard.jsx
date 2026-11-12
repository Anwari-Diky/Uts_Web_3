import React from 'react';
import { Database, Cpu, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const HealthCard = ({ healthData, loading, error, onRefresh }) => {
  const isHealthy = healthData?.status === 'ok';
  const isDegraded = healthData?.status === 'degraded';
  const apiStatus = healthData?.services?.api?.status;
  const dbStatus = healthData?.services?.database?.status;
  const dbMessage = healthData?.services?.database?.message;
  const uptime = healthData?.services?.api?.uptimeSeconds;
  const dbLatency = healthData?.services?.database?.responseTimeMs;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-soft)',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Status Koneksi Layanan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
            Pemantauan status server backend dan database.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Memeriksa...' : 'Periksa Ulang'}
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-input)',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <XCircle size={18} color="var(--status-danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--status-danger)' }}>Backend API Tidak Terjangkau</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
              {error}. Pastikan server Express berjalan di <code>http://localhost:5000</code>.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Service 1: Express REST API */}
        <div
          style={{
            backgroundColor: 'var(--canvas-soft)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-input)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={18} color="var(--brand-forest)" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Backend Express API</span>
            </div>

            {loading ? (
              <span className="badge badge-info">Memeriksa...</span>
            ) : apiStatus === 'healthy' ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Sehat
              </span>
            ) : (
              <span className="badge badge-danger">
                <XCircle size={12} /> Offline
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-gray-green)', display: 'grid', gap: '6px' }}>
            <div>
              <span>Uptime: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {uptime !== undefined ? `${uptime} detik` : '-'}
              </strong>
            </div>
            <div>
              <span>Prefix: </span>
              <code style={{ fontSize: '12px', backgroundColor: 'var(--surface-sage)', padding: '2px 6px', borderRadius: '4px' }}>
                /api/v1
              </code>
            </div>
          </div>
        </div>

        {/* Service 2: MySQL Connection Pool */}
        <div
          style={{
            backgroundColor: 'var(--canvas-soft)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-input)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={18} color="var(--brand-forest)" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>MySQL Database Pool</span>
            </div>

            {loading ? (
              <span className="badge badge-info">Memeriksa...</span>
            ) : dbStatus === 'connected' ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Terhubung
              </span>
            ) : (
              <span className="badge badge-warning">
                <AlertTriangle size={12} /> Terputus
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-gray-green)', display: 'grid', gap: '6px' }}>
            <div>
              <span>Status: </span>
              <strong style={{ color: dbStatus === 'connected' ? 'var(--status-success)' : 'var(--status-warning)' }}>
                {dbStatus === 'connected' ? 'Operasional' : 'Tidak Terhubung'}
              </strong>
            </div>
            <div>
              <span>Keterangan: </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {dbMessage || (loading ? 'Sedang melakukan ping pool...' : 'Koneksi belum diinisialisasi')}
              </span>
            </div>
            {dbLatency !== undefined && (
              <div>
                <span>Latensi: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{dbLatency} ms</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {healthData?.timestamp && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-gray-green)',
          }}
        >
          <Clock size={13} />
          <span>Terakhir dicek: {new Date(healthData.timestamp).toLocaleString('id-ID')}</span>
          <span style={{ margin: '0 4px' }}>·</span>
          <span>Environment: <strong>{healthData.environment || 'development'}</strong></span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
