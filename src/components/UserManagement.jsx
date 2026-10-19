import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  UserCheck,
  Lock,
  Info
} from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const UserManagement = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: '20',
        });
        if (searchQuery) queryParams.set('q', searchQuery);
        if (selectedRole) queryParams.set('role', selectedRole);

        const res = await fetch(`/api/v1/users?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          setUsers(json.data.items || []);
          setPagination(json.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    },
    [token, searchQuery, selectedRole]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-soft)',
            }}
          >
            <Users size={22} color="var(--brand-forest)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Manajemen Pengguna Sistem
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>
              Daftar akun berwenang dan pemetaan peran sesuai matriks hak akses RBAC Lab Komputer Ponpes Al Ihsan Baron.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px' }}>
            <ShieldCheck size={14} style={{ marginRight: '6px' }} />
            Otorisasi Administrator Server-Side Aktif
          </span>
        </div>
      </div>

      {/* Security Best Practice Notice */}
      <div
        style={{
          backgroundColor: 'var(--base-white)',
          border: '1px solid var(--border-soft)',
          borderLeft: '4px solid var(--brand-forest)',
          borderRadius: 'var(--radius-input)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Lock size={18} color="var(--brand-forest)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--brand-forest)' }}>
            Protokol Keamanan Kredensial Produksi (Hardening Fase 8)
          </strong>
          <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '2px', lineHeight: 1.5 }}>
            Seluruh kata sandi dienkripsi menggunakan algoritma standar industri <strong>PBKDF2-HMAC-SHA256</strong> (100.000 iterasi dengan salt acak unik). Kata sandi akun demo bawaan (<code>admin.demo</code>, <code>pimpinan.demo</code>, <code>teknisi.demo</code>) wajib diganti sebelum sistem digunakan pada lingkungan operasional pondok pesantren sesungguhnya.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search
            size={16}
            color="var(--text-gray-green)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Cari nama lengkap, username, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-gray-green)" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field"
            style={{ fontSize: '13px', width: 'auto', minWidth: '160px' }}
          >
            <option value="">Semua Peran</option>
            <option value="admin">Administrator</option>
            <option value="pimpinan">Pimpinan Lab</option>
            <option value="teknisi">Teknisi Lapangan</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--canvas-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Nama &amp; Pengguna</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Email</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Peran (Role)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Status Akun</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Sesi Terakhir</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
                    Memuat data pengguna sistem...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-soft)',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-sage)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                        @{u.username}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="var(--text-gray-green)" />
                        <span>{u.email || '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getRoleBadge(u.role)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {u.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-success)', fontSize: '12px', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Aktif
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-danger)', fontSize: '12px', fontWeight: 600 }}>
                          <XCircle size={14} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-gray-green)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} />
                        <span>{formatDate(u.last_login_at)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-gray-green)', fontSize: '12px' }}>
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'var(--canvas-soft)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
            Menampilkan {users.length} dari {pagination.total} akun terdaftar
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Sebelumnya
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
