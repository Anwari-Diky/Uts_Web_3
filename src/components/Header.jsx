import React from 'react';
import { Server, ShieldCheck, Activity } from 'lucide-react';

export const Header = ({ isOnline }) => {
  return (
    <header
      style={{
        backgroundColor: 'var(--brand-forest)',
        color: 'var(--base-white)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Server size={22} color="var(--base-white)" />
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                color: 'var(--base-white)',
              }}
            >
              SPK Perangkat Periferal Lab Komputer
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--surface-sage)',
                marginTop: '2px',
              }}
            >
              Ponpes Al Ihsan Baron, Bogor · Sistem Pendukung Keputusan SAW
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(232, 240, 235, 0.15)',
              color: 'var(--surface-sage)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-badge)',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(232, 240, 235, 0.25)',
            }}
          >
            <ShieldCheck size={14} />
            Fase 1: Fondasi Proyek
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isOnline ? 'rgba(38, 115, 77, 0.35)' : 'rgba(180, 35, 24, 0.35)',
              color: 'var(--base-white)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-badge)',
              fontSize: '12px',
              fontWeight: 500,
              border: `1px solid ${isOnline ? '#26734D' : '#B42318'}`,
            }}
          >
            <Activity size={14} />
            {isOnline ? 'Sistem Aktif' : 'Pemeriksaan Koneksi'}
          </span>
        </div>
      </div>
    </header>
  );
};
