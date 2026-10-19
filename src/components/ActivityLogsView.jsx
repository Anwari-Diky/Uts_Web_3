import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

export const ActivityLogsView = () => {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionKey, setSelectedActionKey] = useState('');
  const [modalLog, setModalLog] = useState(null);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: '20',
        });
        if (searchQuery) queryParams.set('q', searchQuery);
        if (selectedActionKey) queryParams.set('action_key', selectedActionKey);

        const res = await fetch(`/api/v1/activity-logs?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          setLogs(json.data.items || []);
          setPagination(json.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [token, searchQuery, selectedActionKey]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScrollText size={22} color="var(--brand-forest)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Log Aktivitas &amp; Jejak Audit Sistem
            </h2>
            <span className="badge badge-success" style={{ fontSize: '12px' }}>
              Audit Trail Aktif
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
            Seluruh perubahan kritis (kalkulasi SAW, keputusan Pimpinan, perubahan kriteria, mutasi perangkat) tersimpan permanen untuk transparansi dan audit laboratorium.
          </p>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>
          Total Log Tercatat: <strong>{pagination.total} Aktivitas</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-gray-green)' }} />
            <input
              type="text"
              placeholder="Cari ringkasan atau nama aktor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '32px', fontSize: '12px', width: '100%' }}
            />
          </div>

          <select
            value={selectedActionKey}
            onChange={(e) => setSelectedActionKey(e.target.value)}
            className="input-select"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="saw.run.completed">Kalkulasi SAW (saw.run.completed)</option>
            <option value="recommendation.decision">Keputusan Pimpinan (recommendation.decision)</option>
            <option value="assessment.submitted">Penilaian Terkirim (assessment.submitted)</option>
            <option value="criteria.weights.updated">Pembaruan Bobot (criteria.weights.updated)</option>
            <option value="device.created">Perangkat Baru (device.created)</option>
            <option value="repair_history.updated">Update Perbaikan (repair_history.updated)</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
            Memuat jejak audit...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
            Tidak ada log aktivitas yang cocok dengan pencarian.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Waktu</th>
                  <th>Aktor &amp; Peran</th>
                  <th>Kunci Aksi</th>
                  <th>Entitas</th>
                  <th>Ringkasan Aktivitas</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'center' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let roleBadge = 'badge-success';
                  if (log.actor_role === 'pimpinan') roleBadge = 'badge-info';
                  if (log.actor_role === 'teknisi') roleBadge = 'badge-warning';

                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-gray-green)', whiteSpace: 'nowrap' }}>
                        <div>{new Date(log.created_at).toLocaleDateString('id-ID')}</div>
                        <div style={{ fontSize: '10px' }}>
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{log.actor_name || 'Sistem'}</strong>
                        <div>
                          <span className={`badge ${roleBadge}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                            {log.actor_role || 'system'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            backgroundColor: 'var(--surface-sage)',
                            color: 'var(--brand-forest)',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.action_key}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.entity_type}
                        </div>
                        {log.entity_id && (
                          <div style={{ fontSize: '10px', color: 'var(--text-gray-green)' }}>
                            ID #{log.entity_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', maxWidth: '340px' }}>
                          {log.summary}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-gray-green)', fontFamily: 'monospace', fontSize: '11px' }}>
                        {log.ip_address || '::1'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setModalLog(log)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-soft)',
            fontSize: '12px',
          }}
        >
          <div style={{ color: 'var(--text-gray-green)' }}>
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {modalLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScrollText size={18} color="var(--brand-forest)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Rincian Log Audit #{modalLog.id}
                </h3>
              </div>
              <button onClick={() => setModalLog(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text-primary)' }}>
              <strong>Ringkasan:</strong> {modalLog.summary}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginBottom: '14px' }}>
              Aktor: <strong>{modalLog.actor_name}</strong> ({modalLog.actor_role}) • Waktu: {new Date(modalLog.created_at).toLocaleString('id-ID')}
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Metadata Terlampir (JSON):
            </div>
            <pre
              style={{
                backgroundColor: 'var(--canvas-soft)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                overflowX: 'auto',
                border: '1px solid var(--border-soft)',
              }}
            >
              {JSON.stringify(modalLog.metadata || {}, null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setModalLog(null)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
