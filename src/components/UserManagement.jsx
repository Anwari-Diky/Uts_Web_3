import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Users,
  User,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Lock,
  Key,
  Edit,
  UserX,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  X
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

export const UserManagement = ({ defaultTab = 'all-users' }) => {
  const { user, token, updateUserSession } = useAuth();
  const isAdmin = user?.role === 'admin';

  // For non-admin, always force active tab to 'profile'
  const [activeTab, setActiveTab] = useState(isAdmin ? (defaultTab === 'profile' ? 'profile' : 'all-users') : 'profile');

  // Synchronize when defaultTab prop changes (e.g. navigation clicked)
  useEffect(() => {
    if (isAdmin) {
      setActiveTab(defaultTab === 'profile' ? 'profile' : 'all-users');
    } else {
      setActiveTab('profile');
    }
  }, [defaultTab, isAdmin]);

  // ==========================================
  // STATE: Tab "Semua Pengguna" (Admin Only)
  // ==========================================
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modals for Admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusTargetUser, setStatusTargetUser] = useState(null);

  // Form states for Admin actions
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    role: 'teknisi',
    is_active: 1,
    password: '',
    new_password: '',
    confirm_password: '',
  });

  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!isAdmin) return;
      setLoadingUsers(true);
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
        setLoadingUsers(false);
      }
    },
    [token, searchQuery, selectedRole, isAdmin]
  );

  useEffect(() => {
    if (isAdmin && activeTab === 'all-users') {
      fetchUsers(1);
    }
  }, [fetchUsers, isAdmin, activeTab]);

  // ==========================================
  // STATE: Tab "Profil Saya" (All Roles)
  // ==========================================
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Sync profile form when user session loads
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Handle Profile Update submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    // Client-side validations
    if (!profileForm.full_name.trim()) {
      setProfileError('Nama lengkap wajib diisi');
      return;
    }
    if (!profileForm.username.trim()) {
      setProfileError('Nama pengguna (username) wajib diisi');
      return;
    }
    if (!profileForm.email.trim()) {
      setProfileError('Alamat email wajib diisi');
      return;
    }

    if (profileForm.new_password) {
      if (profileForm.new_password.length < 6) {
        setProfileError('Kata sandi baru minimal 6 karakter');
        return;
      }
      if (profileForm.new_password !== profileForm.confirm_password) {
        setProfileError('Konfirmasi kata sandi baru tidak cocok');
        return;
      }
    }

    setProfileLoading(true);
    try {
      const payload = {
        full_name: profileForm.full_name.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      };
      if (profileForm.new_password) {
        payload.new_password = profileForm.new_password;
        if (profileForm.current_password) {
          payload.current_password = profileForm.current_password;
        }
      }

      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal memperbarui profil');
      }

      // Update session in context
      if (json?.data?.user) {
        updateUserSession(json.data.user, json.data.token);
      }

      setProfileSuccess(json?.data?.message || 'Profil akun Anda berhasil diperbarui');
      setProfileForm((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));

      // If admin, also refresh users table
      if (isAdmin) {
        fetchUsers(pagination.page);
      }
    } catch (err) {
      setProfileError(err.message || 'Terjadi kesalahan saat menyimpan profil');
    } finally {
      setProfileLoading(false);
    }
  };

  // ==========================================
  // ADMIN HANDLERS: Create, Edit, Reset Pass
  // ==========================================
  const openCreateModal = () => {
    setAdminActionError(null);
    setAdminActionSuccess(null);
    setFormData({
      full_name: '',
      username: '',
      email: '',
      role: 'teknisi',
      is_active: 1,
      password: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAdminActionError(null);

    if (!formData.full_name || !formData.username || !formData.email || !formData.password) {
      setAdminActionError('Seluruh bidang wajib diisi');
      return;
    }
    if (formData.password.length < 6) {
      setAdminActionError('Kata sandi minimal 6 karakter');
      return;
    }

    setAdminActionLoading(true);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal membuat akun');
      }

      setShowCreateModal(false);
      setAdminActionSuccess('Akun pengguna baru berhasil ditambahkan');
      fetchUsers(1);
    } catch (err) {
      setAdminActionError(err.message || 'Gagal menambahkan akun');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const openEditModal = (targetUser) => {
    setSelectedUser(targetUser);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    setFormData({
      full_name: targetUser.full_name,
      username: targetUser.username,
      email: targetUser.email || '',
      role: targetUser.role,
      is_active: targetUser.is_active ? 1 : 0,
      new_password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAdminActionError(null);

    setAdminActionLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        is_active: Number(formData.is_active),
      };
      if (formData.new_password) {
        if (formData.new_password.length < 6) {
          throw new Error('Kata sandi baru minimal 6 karakter');
        }
        payload.new_password = formData.new_password;
      }

      const res = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal memperbarui akun pengguna');
      }

      setShowEditModal(false);
      setAdminActionSuccess(`Data akun ${formData.username} berhasil diperbarui`);
      fetchUsers(pagination.page);

      // If admin updated their own profile through the table, sync session
      if (selectedUser.id === user.id) {
        updateUserSession(json.data.user);
      }
    } catch (err) {
      setAdminActionError(err.message || 'Gagal memperbarui akun');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const openPasswordModal = (targetUser) => {
    setSelectedUser(targetUser);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    setFormData((prev) => ({
      ...prev,
      new_password: '',
      confirm_password: '',
    }));
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAdminActionError(null);

    if (!formData.new_password || formData.new_password.length < 6) {
      setAdminActionError('Kata sandi baru minimal 6 karakter');
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      setAdminActionError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_password: formData.new_password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mereset kata sandi');
      }

      setShowPasswordModal(false);
      setAdminActionSuccess(`Kata sandi untuk akun @${selectedUser.username} berhasil diubah.`);
    } catch (err) {
      setAdminActionError(err.message || 'Gagal mereset kata sandi');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const openStatusModal = (targetUser) => {
    setStatusTargetUser(targetUser);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    setShowStatusModal(true);
  };

  const handleToggleStatus = async () => {
    if (!statusTargetUser) return;
    setAdminActionError(null);
    setAdminActionLoading(true);

    try {
      const newStatus = statusTargetUser.is_active ? 0 : 1;
      const res = await fetch(`/api/v1/users/${statusTargetUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mengubah status akun');
      }

      setShowStatusModal(false);
      setAdminActionSuccess(
        `Akun @${statusTargetUser.username} berhasil ${newStatus === 1 ? 'diaktifkan kembali' : 'dinonaktifkan'}.`
      );
      fetchUsers(pagination.page);
    } catch (err) {
      setAdminActionError(err.message || 'Gagal mengubah status akun');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: '#DCFCE7',
              color: '#166534',
              border: '1px solid #BBF7D0',
            }}
          >
            <ShieldCheck size={12} />
            Administrator
          </span>
        );
      case 'pimpinan':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--electric-blue)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Shield size={12} />
            Pimpinan Lab
          </span>
        );
      case 'teknisi':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
            }}
          >
            <UserCheck size={12} />
            Teknisi Lapangan
          </span>
        );
      default:
        return <span className="badge badge-info">{role}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Card */}
      <div
        className="anim-fade-in"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            {isAdmin && activeTab === 'all-users' ? (
              <Users size={22} color="var(--electric-blue)" />
            ) : (
              <UserCheck size={22} color="var(--electric-blue)" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isAdmin && activeTab === 'all-users' ? 'Manajemen Pengguna Sistem' : 'Profil Akun Saya'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {isAdmin && activeTab === 'all-users'
                ? 'Kelola data seluruh akun, hak akses peran, serta reset kata sandi pengguna.'
                : 'Ubah nama lengkap, username, email, dan perbarui kata sandi akun Anda.'}
            </p>
          </div>
        </div>

        {/* Tab Buttons (Admin Only) */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all-users')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'all-users' ? '#ffffff' : 'transparent',
                color: activeTab === 'all-users' ? 'var(--electric-blue)' : '#64748B',
                boxShadow: activeTab === 'all-users' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Users size={14} />
              Semua Pengguna
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'profile' ? '#ffffff' : 'transparent',
                color: activeTab === 'profile' ? 'var(--electric-blue)' : '#64748B',
                boxShadow: activeTab === 'profile' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UserCheck size={14} />
              Profil Saya
            </button>
          </div>
        )}
      </div>

      {/* Global Success Alert for Admin */}
      {adminActionSuccess && (
        <div
          style={{
            backgroundColor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#16A34A" />
            <span>{adminActionSuccess}</span>
          </div>
          <button
            onClick={() => setAdminActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: TAB PROFIL SAYA (For Teknisi, Pimpinan, & Admin)        */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {/* Identity Info Card */}
          <div
            className="anim-fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--electric-blue)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {user?.full_name}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
                    @{user?.username}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {getRoleBadge(user?.role)}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Status Akun:</span>
                  <span style={{ fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} /> Aktif Operasional
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Email Terdaftar:</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user?.email || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Hak Akses:</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                gap: '10px',
              }}
            >
              <Info size={16} color="var(--electric-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                Perubahan pada <strong>Nama Pengguna (Username)</strong> atau <strong>Kata Sandi</strong> akan otomatis memperbarui sesi login tanpa perlu keluar dari sistem.
              </div>
            </div>
          </div>

          {/* Edit Form Card */}
          <div
            className="anim-fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={16} color="var(--electric-blue)" />
              Formulir Perubahan Data Akun
            </h3>

            {profileError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} color="#DC2626" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div
                style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  color: '#166534',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={15} color="#16A34A" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nama Lengkap */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Nama Lengkap / Nama Tampilan
                </label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                />
              </div>

              {/* Username & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Nama Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="input-field"
                    placeholder="Username..."
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input-field"
                    placeholder="email@domain.com..."
                    required
                  />
                </div>
              </div>

              {/* Password Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="var(--electric-blue)" />
                    Perbarui Kata Sandi (Opsional)
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Kosongkan jika tidak ingin mengganti
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Current Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>
                      Kata Sandi Saat Ini
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrPass ? 'text' : 'password'}
                        value={profileForm.current_password}
                        onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                        className="input-field"
                        placeholder="Masukkan kata sandi lama jika ingin mengganti..."
                        style={{ paddingRight: '38px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrPass(!showCurrPass)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748B',
                        }}
                      >
                        {showCurrPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirm Password */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>
                        Kata Sandi Baru
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={profileForm.new_password}
                          onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                          className="input-field"
                          placeholder="Minimal 6 karakter..."
                          style={{ paddingRight: '38px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748B',
                          }}
                        >
                          {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={profileForm.confirm_password}
                          onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                          className="input-field"
                          placeholder="Ulangi kata sandi baru..."
                          style={{ paddingRight: '38px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748B',
                          }}
                        >
                          {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {profileLoading ? <RefreshCw size={15} className="anim-spin" /> : <Save size={15} />}
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: TAB SEMUA PENGGUNA (Admin Only)                         */}
      {/* ============================================================== */}
      {isAdmin && activeTab === 'all-users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Security Notice */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid var(--electric-blue)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} color="var(--electric-blue)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Otoritas Manajemen Pengguna Terpusat (Admin)
                </strong>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Hanya Administrator yang memiliki akses untuk melihat seluruh akun, mengubah identitas pengguna, dan mereset kata sandi.
                </p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UserPlus size={15} />
              Tambah Akun Pengguna
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '14px 18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                size={16}
                color="#64748B"
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
              <Filter size={15} color="#64748B" />
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
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Nama &amp; Pengguna</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Email</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Peran (Role)</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Status Akun</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Sesi Terakhir</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                        <RefreshCw size={20} className="anim-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        Memuat data akun pengguna...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                        Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.full_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>@{u.username}</span>
                            {u.id === user?.id && (
                              <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--electric-blue)', fontWeight: 600 }}>
                                Akun Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} color="#64748B" />
                            <span>{u.email || '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {getRoleBadge(u.role)}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {u.is_active ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontSize: '12px', fontWeight: 600 }}>
                              <CheckCircle2 size={14} /> Aktif
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', fontWeight: 600 }}>
                              <XCircle size={14} /> Nonaktif
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} />
                            <span>{formatDate(u.last_login_at)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => openEditModal(u)}
                              title="Ubah profil / status akun"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#ffffff',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <Edit size={13} color="var(--electric-blue)" />
                              Edit
                            </button>

                            <button
                              onClick={() => openPasswordModal(u)}
                              title="Reset kata sandi pengguna"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#ffffff',
                                color: '#92400E',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF3C7')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <Key size={13} color="#D97706" />
                              Password
                            </button>

                            {u.is_active ? (
                              <button
                                onClick={() => openStatusModal(u)}
                                disabled={u.id === user?.id}
                                title={u.id === user?.id ? 'Tidak dapat menonaktifkan akun sendiri' : 'Nonaktifkan akun pengguna'}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #FCA5A5',
                                  backgroundColor: '#ffffff',
                                  color: '#DC2626',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                                  opacity: u.id === user?.id ? 0.45 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                onMouseEnter={(e) => {
                                  if (u.id !== user?.id) e.currentTarget.style.backgroundColor = '#FEE2E2';
                                }}
                                onMouseLeave={(e) => {
                                  if (u.id !== user?.id) e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                              >
                                <UserX size={13} color="#DC2626" />
                                Nonaktifkan
                              </button>
                            ) : (
                              <button
                                onClick={() => openStatusModal(u)}
                                title="Aktifkan kembali akses login pengguna"
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #86EFAC',
                                  backgroundColor: '#ffffff',
                                  color: '#16A34A',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DCFCE7')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                              >
                                <CheckCircle2 size={13} color="#16A34A" />
                                Aktifkan
                              </button>
                            )}
                          </div>
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
                padding: '14px 18px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                Menampilkan {users.length} dari {pagination.total} akun terdaftar
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loadingUsers}
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
                  disabled={pagination.page >= pagination.totalPages || loadingUsers}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: EDIT AKUN PENGGUNA (Admin Only)                        */}
      {/* ============================================================== */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit size={18} color="var(--electric-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Edit Akun Pengguna
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>ID: {selectedUser.id} • @{selectedUser.username}</span>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {adminActionError && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {adminActionError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Peran (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="admin">Administrator</option>
                    <option value="pimpinan">Pimpinan Lab</option>
                    <option value="teknisi">Teknisi Lapangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Status Akun
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                  className="input-field"
                >
                  <option value={1}>Aktif (Dapat Login)</option>
                  <option value={0}>Nonaktif (Diblokir Sementara)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Reset Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="input-field"
                  placeholder="Kosongkan jika tidak ingin mereset password..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 600 }}
                >
                  {adminActionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: RESET PASSWORD KHUSUS (Admin Only)                     */}
      {/* ============================================================== */}
      {showPasswordModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              borderRadius: '14px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="#D97706" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Ubah Kata Sandi Pengguna
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Untuk: {selectedUser.full_name} (@{selectedUser.username})</span>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {adminActionError && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {adminActionError}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="input-field"
                  placeholder="Minimal 6 karakter..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="input-field"
                  placeholder="Ulangi kata sandi baru..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 600 }}
                >
                  {adminActionLoading ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TAMBAH PENGGUNA BARU (Admin Only)                      */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} color="var(--electric-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Tambah Akun Pengguna Baru
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Buat akses baru untuk admin, pimpinan, atau teknisi</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {adminActionError && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {adminActionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Nama lengkap petugas..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                    placeholder="Username login..."
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Peran (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="teknisi">Teknisi Lapangan</option>
                    <option value="pimpinan">Pimpinan Lab</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="email@alihsanbaron.ponpes.id..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Minimal 6 karakter..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 600 }}
                >
                  {adminActionLoading ? 'Membuat...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: KONFIRMASI STATUS NONAKTIF/AKTIF (Admin Only)          */}
      {/* ============================================================== */}
      {showStatusModal && statusTargetUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              borderRadius: '14px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: statusTargetUser.is_active ? '#FEE2E2' : '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {statusTargetUser.is_active ? (
                  <UserX size={22} color="#DC2626" />
                ) : (
                  <CheckCircle2 size={22} color="#16A34A" />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {statusTargetUser.is_active ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun Pengguna?'}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Akun: <strong>{statusTargetUser.full_name}</strong> (@{statusTargetUser.username})
                </span>
              </div>
            </div>

            {adminActionError && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {adminActionError}
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {statusTargetUser.is_active
                ? `Apakah Anda yakin ingin menonaktifkan akun @${statusTargetUser.username}? Pengguna ini tidak akan dapat login ke sistem sampai akun diaktifkan kembali oleh Administrator.`
                : `Aktifkan kembali akun @${statusTargetUser.username}? Pengguna akan dapat kembali login dan menggunakan fitur sistem sesuai hak akses perannya.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={adminActionLoading}
                style={{
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  backgroundColor: statusTargetUser.is_active ? '#DC2626' : 'var(--electric-blue)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {adminActionLoading ? (
                  <RefreshCw size={14} className="anim-spin" />
                ) : statusTargetUser.is_active ? (
                  <UserX size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {statusTargetUser.is_active ? 'Ya, Nonaktifkan Akun' : 'Ya, Aktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
