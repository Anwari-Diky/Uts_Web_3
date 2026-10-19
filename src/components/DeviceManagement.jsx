import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  HardDrive,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Camera,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  X,
  FileText,
  DollarSign,
  MapPin,
  Tag
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

const getConditionBadge = (status) => {
  switch (status) {
    case 'baik':
      return <span className="badge badge-success">Baik</span>;
    case 'perlu_perhatian':
      return <span className="badge badge-warning">Perlu Perhatian</span>;
    case 'rusak_ringan':
      return (
        <span
          className="badge"
          style={{ backgroundColor: '#FFF2E6', color: '#B35300', border: '1px solid #FFD8B3' }}
        >
          Rusak Ringan
        </span>
      );
    case 'rusak_berat':
      return <span className="badge badge-danger">Rusak Berat</span>;
    case 'tidak_berfungsi':
      return (
        <span
          className="badge"
          style={{ backgroundColor: '#FBE8E8', color: '#7A1B14', border: '1px solid #F5C2C2' }}
        >
          Tidak Berfungsi
        </span>
      );
    default:
      return <span className="badge badge-info">{status}</span>;
  }
};

const getOperationalBadge = (status) => {
  switch (status) {
    case 'aktif':
      return <span className="badge badge-success">Aktif</span>;
    case 'perlu_pemeriksaan':
      return <span className="badge badge-warning">Perlu Pemeriksaan</span>;
    case 'dalam_perbaikan':
      return <span className="badge badge-info">Dalam Perbaikan</span>;
    case 'di-upgrade':
      return <span className="badge badge-info">Di-upgrade</span>;
    case 'nonaktif':
      return <span className="badge badge-danger">Nonaktif</span>;
    default:
      return <span className="badge badge-info">{status}</span>;
  }
};

export const DeviceManagement = () => {
  const { user, token } = useAuth();

  // Data states
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  // Modals
  const [detailDevice, setDetailDevice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [conditionModalDevice, setConditionModalDevice] = useState(null);
  const [deleteConfirmDevice, setDeleteConfirmDevice] = useState(null);

  // Upload state in detail modal
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Create/Edit form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    location_id: '',
    brand: '',
    model: '',
    specification: '',
    serial_number: '',
    acquisition_date: '',
    condition_status: 'baik',
    operational_status: 'aktif',
    purchase_value: 0,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submittingForm, setSubmittingForm] = useState(false);

  // Condition patch form states
  const [conditionData, setConditionData] = useState({
    condition_status: 'baik',
    operational_status: 'aktif',
    notes: '',
  });
  const [submittingCondition, setSubmittingCondition] = useState(false);

  // Fetch filter metadata (categories & locations)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch('/api/v1/device-categories', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/locations', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (catRes.ok && locRes.ok) {
          const cats = await catRes.json();
          const locs = await locRes.json();
          setCategories(cats.data || []);
          setLocations(locs.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories/locations:', err);
      }
    };

    fetchMetadata();
  }, [token]);

  // Fetch Devices list
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.append('q', search.trim());
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedLocation) params.append('location_id', selectedLocation);
      if (selectedCondition) params.append('condition_status', selectedCondition);

      const res = await fetch(`/api/v1/devices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat data perangkat');
      }

      const resData = await res.json();
      setDevices(resData.data.items || []);
      setTotalPages(resData.data.totalPages || 1);
      setTotalItems(resData.data.total || 0);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, selectedCategory, selectedLocation, selectedCondition]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Fetch single device detail (with damage docs)
  const openDetail = async (id) => {
    try {
      const res = await fetch(`/api/v1/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailDevice(data.data);
        setUploadFile(null);
        setUploadCaption('');
        setUploadError(null);
      }
    } catch (err) {
      console.error('Failed to fetch device detail:', err);
    }
  };

  // Upload damage documentation
  const handleUploadDamageDoc = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Pilih berkas foto terlebih dahulu');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('photo', uploadFile);
      if (uploadCaption.trim()) {
        uploadFormData.append('caption', uploadCaption.trim());
      }

      const res = await fetch(`/api/v1/devices/${detailDevice.id}/damage-documentation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal mengunggah foto');
      }

      // Refresh detail device
      openDetail(detailDevice.id);
      fetchDevices();
      setUploadFile(null);
      setUploadCaption('');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      category_id: categories[0]?.id || '',
      location_id: locations[0]?.id || '',
      brand: '',
      model: '',
      specification: '',
      serial_number: '',
      acquisition_date: '',
      condition_status: 'baik',
      operational_status: 'aktif',
      purchase_value: 0,
      notes: '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dev) => {
    setEditDevice(dev);
    setFormData({
      code: dev.code,
      name: dev.name,
      category_id: dev.category_id,
      location_id: dev.location_id,
      brand: dev.brand || '',
      model: dev.model || '',
      specification: dev.specification || '',
      serial_number: dev.serial_number || '',
      acquisition_date: dev.acquisition_date ? dev.acquisition_date.split('T')[0] : '',
      condition_status: dev.condition_status,
      operational_status: dev.operational_status,
      purchase_value: dev.purchase_value,
      notes: dev.notes || '',
    });
    setFormErrors({});
  };

  // Open Condition Update Modal
  const handleOpenCondition = (dev) => {
    setConditionModalDevice(dev);
    setConditionData({
      condition_status: dev.condition_status,
      operational_status: dev.operational_status,
      notes: dev.notes || '',
    });
  };

  // Submit Create or Edit Device
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFormErrors({});

    try {
      const isEdit = !!editDevice;
      const url = isEdit ? `/api/v1/devices/${editDevice.id}` : '/api/v1/devices';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resJson = await res.json();
      if (!res.ok) {
        if (resJson.error?.details) {
          const errMap = {};
          resJson.error.details.forEach((d) => (errMap[d.field] = d.message));
          setFormErrors(errMap);
        }
        throw new Error(resJson.error?.message || 'Gagal menyimpan perangkat');
      }

      setShowCreateModal(false);
      setEditDevice(null);
      fetchDevices();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  // Submit Condition Status Update (Admin & Teknisi)
  const handleSaveCondition = async (e) => {
    e.preventDefault();
    setSubmittingCondition(true);

    try {
      const res = await fetch(`/api/v1/devices/${conditionModalDevice.id}/condition`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(conditionData),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal memperbarui kondisi');
      }

      setConditionModalDevice(null);
      fetchDevices();
      if (detailDevice && detailDevice.id === conditionModalDevice.id) {
        openDetail(detailDevice.id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingCondition(false);
    }
  };

  // Delete device (Admin only)
  const handleDeleteDevice = async () => {
    if (!deleteConfirmDevice) return;
    try {
      const res = await fetch(`/api/v1/devices/${deleteConfirmDevice.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal menghapus perangkat');
      }

      setDeleteConfirmDevice(null);
      fetchDevices();
    } catch (err) {
      alert(err.message);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isTeknisi = user?.role === 'teknisi';

  return (
    <div>
      {/* Header toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Manajemen Data Perangkat Periferal
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
            Inventarisasi perangkat komputer, spesifikasi teknis, kondisi fisik, dan dokumentasi kerusakan.
          </p>
        </div>

        {isAdmin && (
          <button onClick={handleOpenCreate} className="btn-primary">
            <Plus size={16} />
            Tambah Perangkat
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search
            size={16}
            color="var(--text-gray-green)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari kode, nama, atau merek..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border-soft)',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: 'var(--canvas-soft)',
            }}
          />
        </div>

        {/* Category filter */}
        <div style={{ flex: '0 1 170px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border-soft)',
              fontSize: '13px',
              backgroundColor: 'var(--base-white)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location filter */}
        <div style={{ flex: '0 1 170px' }}>
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border-soft)',
              fontSize: '13px',
              backgroundColor: 'var(--base-white)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Semua Lokasi</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condition status filter */}
        <div style={{ flex: '0 1 170px' }}>
          <select
            value={selectedCondition}
            onChange={(e) => {
              setSelectedCondition(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border-soft)',
              fontSize: '13px',
              backgroundColor: 'var(--base-white)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Semua Kondisi</option>
            <option value="baik">Baik</option>
            <option value="perlu_perhatian">Perlu Perhatian</option>
            <option value="rusak_ringan">Rusak Ringan</option>
            <option value="rusak_berat">Rusak Berat</option>
            <option value="tidak_berfungsi">Tidak Berfungsi</option>
          </select>
        </div>

        {/* Reset filter */}
        <button
          onClick={() => {
            setSearch('');
            setSelectedCategory('');
            setSelectedLocation('');
            setSelectedCondition('');
            setPage(1);
          }}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* Main Devices Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-gray-green)', fontSize: '14px' }}>
            Memuat data perangkat...
          </div>
        ) : error ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--status-danger)' }}>
            <AlertTriangle size={24} style={{ margin: '0 auto 8px auto' }} />
            <div>{error}</div>
            <button onClick={fetchDevices} className="btn-secondary" style={{ marginTop: '12px' }}>
              Coba Lagi
            </button>
          </div>
        ) : devices.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
            <HardDrive size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tidak ada perangkat ditemukan
            </div>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Ubah kriteria pencarian atau tambahkan data perangkat baru.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-sage)', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Kode</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Nama Perangkat</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Kategori</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Lokasi</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Kondisi</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Status Operasional</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    Nilai Perolehan
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                    Foto
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((dev) => (
                  <tr
                    key={dev.id}
                    style={{
                      borderBottom: '1px solid var(--border-soft)',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--canvas-soft)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-forest)' }}>
                      {dev.code}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dev.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>
                        {[dev.brand, dev.model].filter(Boolean).join(' · ') || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{dev.category_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{dev.location_name}</td>
                    <td style={{ padding: '12px 16px' }}>{getConditionBadge(dev.condition_status)}</td>
                    <td style={{ padding: '12px 16px' }}>{getOperationalBadge(dev.operational_status)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {formatRupiah(dev.purchase_value)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => openDetail(dev.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: dev.documentation_count > 0 ? 'var(--brand-forest)' : 'var(--text-gray-green)',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: dev.documentation_count > 0 ? 'var(--surface-sage)' : 'transparent',
                        }}
                      >
                        <Camera size={14} />
                        <span>{dev.documentation_count}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openDetail(dev.id)}
                          title="Lihat Detail & Foto"
                          className="btn-secondary"
                          style={{ padding: '6px 8px' }}
                        >
                          <Eye size={14} color="var(--brand-forest)" />
                        </button>

                        {(isAdmin || isTeknisi) && (
                          <button
                            onClick={() => handleOpenCondition(dev)}
                            title="Perbarui Kondisi"
                            className="btn-secondary"
                            style={{ padding: '6px 8px' }}
                          >
                            <AlertTriangle size={14} color="var(--status-warning)" />
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(dev)}
                              title="Edit Perangkat"
                              className="btn-secondary"
                              style={{ padding: '6px 8px' }}
                            >
                              <Edit size={14} color="var(--status-info)" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmDevice(dev)}
                              title="Hapus Perangkat"
                              className="btn-secondary"
                              style={{ padding: '6px 8px' }}
                            >
                              <Trash2 size={14} color="var(--status-danger)" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--text-gray-green)',
          }}
        >
          <div>
            Menampilkan <strong>{devices.length}</strong> dari <strong>{totalItems}</strong> perangkat
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <ChevronLeft size={14} />
              Sebelumnya
            </button>
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              Selanjutnya
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Device Detail & Damage Documentation */}
      {detailDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  {detailDevice.code}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {detailDevice.name}
                </h3>
              </div>
              <button onClick={() => setDetailDevice(null)} className="btn-secondary" style={{ padding: '6px 8px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Spec grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                backgroundColor: 'var(--canvas-soft)',
                padding: '16px',
                borderRadius: 'var(--radius-input)',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Kategori:</span>
                <div style={{ fontWeight: 600 }}>{detailDevice.category_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Lokasi:</span>
                <div style={{ fontWeight: 600 }}>{detailDevice.location_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Kondisi Fisik:</span>
                <div>{getConditionBadge(detailDevice.condition_status)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Status Operasional:</span>
                <div>{getOperationalBadge(detailDevice.operational_status)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Merek & Model:</span>
                <div style={{ fontWeight: 500 }}>
                  {[detailDevice.brand, detailDevice.model].filter(Boolean).join(' / ') || '-'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-gray-green)' }}>Nilai Perolehan:</span>
                <div style={{ fontWeight: 600 }}>{formatRupiah(detailDevice.purchase_value)}</div>
              </div>
            </div>

            {detailDevice.specification && (
              <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Spesifikasi Teknis:</strong>
                <p style={{ color: 'var(--text-gray-green)' }}>{detailDevice.specification}</p>
              </div>
            )}

            {detailDevice.notes && (
              <div style={{ marginBottom: '20px', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Catatan Pemeriksaan:</strong>
                <p style={{ color: 'var(--text-gray-green)' }}>{detailDevice.notes}</p>
              </div>
            )}

            {/* Damage Documentation Section */}
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="var(--brand-forest)" />
                  <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Foto Dokumentasi Kerusakan</h4>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                  Total: {detailDevice.damage_documentation?.length || 0} foto
                </span>
              </div>

              {/* Upload Form for Admin & Teknisi */}
              {(isAdmin || isTeknisi) && (
                <form
                  onSubmit={handleUploadDamageDoc}
                  style={{
                    backgroundColor: 'var(--surface-sage)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-input)',
                    marginBottom: '16px',
                  }}
                >
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                    Unggah Bukti Kerusakan Baru (JPG/PNG/WEBP maks 5MB)
                  </strong>

                  {uploadError && (
                    <div style={{ fontSize: '12px', color: 'var(--status-danger)', marginBottom: '8px' }}>
                      {uploadError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      style={{ fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Keterangan kerusakan (misal: tombol keyboard patah)"
                      style={{
                        flex: '1 1 200px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-input)',
                        border: '1px solid var(--border-soft)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={uploading}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <Upload size={13} />
                      {uploading ? 'Mengunggah...' : 'Unggah'}
                    </button>
                  </div>
                </form>
              )}

              {/* Photo Gallery */}
              {detailDevice.damage_documentation?.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', textAlign: 'center', padding: '16px' }}>
                  Belum ada foto dokumentasi kerusakan untuk perangkat ini.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {detailDevice.damage_documentation?.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-input)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--base-white)',
                      }}
                    >
                      <div
                        style={{
                          height: '130px',
                          backgroundColor: 'var(--canvas-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <a
                          href={doc.storage_path}
                          target="_blank"
                          rel="noreferrer"
                          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          title="Klik untuk melihat foto resolusi penuh"
                        >
                          <img
                            src={doc.storage_path}
                            alt={doc.caption || 'Foto kerusakan'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div
                            style={{
                              display: 'none',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '12px',
                              textAlign: 'center',
                              color: 'var(--text-gray-green)',
                              fontSize: '11px',
                              width: '100%',
                              height: '100%',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          >
                            <Camera size={22} style={{ marginBottom: '4px', opacity: 0.7 }} />
                            <span>Buka Foto Kerusakan</span>
                          </div>
                        </a>
                      </div>
                      <div style={{ padding: '8px 10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.caption || doc.original_filename}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                          Oleh: {doc.uploader_name || 'Petugas'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Device (Admin only) */}
      {(showCreateModal || editDevice) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editDevice ? `Edit Perangkat (${editDevice.code})` : 'Tambah Perangkat Periferal Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditDevice(null);
                }}
                className="btn-secondary"
                style={{ padding: '6px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDevice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Kode Perangkat *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled={!!editDevice}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: KB-015"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: `1px solid ${formErrors.code ? 'var(--status-danger)' : 'var(--border-soft)'}`,
                      fontSize: '13px',
                    }}
                  />
                  {formErrors.code && (
                    <span style={{ fontSize: '11px', color: 'var(--status-danger)' }}>{formErrors.code}</span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Nama Perangkat *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Keyboard Lab A-05"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: `1px solid ${formErrors.name ? 'var(--status-danger)' : 'var(--border-soft)'}`,
                      fontSize: '13px',
                    }}
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: '11px', color: 'var(--status-danger)' }}>{formErrors.name}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Kategori *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Lokasi Lab *
                  </label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Merek
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Logitech, Samsung, dll."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="K120, S19A10, dll."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Kondisi Fisik
                  </label>
                  <select
                    value={formData.condition_status}
                    onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="baik">Baik</option>
                    <option value="perlu_perhatian">Perlu Perhatian</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                    <option value="tidak_berfungsi">Tidak Berfungsi</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Status Operasional
                  </label>
                  <select
                    value={formData.operational_status}
                    onChange={(e) => setFormData({ ...formData, operational_status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="perlu_pemeriksaan">Perlu Pemeriksaan</option>
                    <option value="dalam_perbaikan">Dalam Perbaikan</option>
                    <option value="di-upgrade">Di-upgrade</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Nilai Perolehan (Rupiah)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Tanggal Perolehan
                  </label>
                  <input
                    type="date"
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-input)',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Catatan / Spesifikasi Tambahan
                </label>
                <textarea
                  rows="2"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="Konektor USB, panjang kabel, kondisi tombol, dll."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditDevice(null);
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={submittingForm} className="btn-primary">
                  {submittingForm ? 'Menyimpan...' : 'Simpan Perangkat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Condition (Admin & Teknisi) */}
      {conditionModalDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pembaruan Kondisi Perangkat
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                  {conditionModalDevice.code} — {conditionModalDevice.name}
                </p>
              </div>
              <button onClick={() => setConditionModalDevice(null)} className="btn-secondary" style={{ padding: '6px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCondition}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Kondisi Fisik Baru
                </label>
                <select
                  value={conditionData.condition_status}
                  onChange={(e) => setConditionData({ ...conditionData, condition_status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                  }}
                >
                  <option value="baik">Baik</option>
                  <option value="perlu_perhatian">Perlu Perhatian</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                  <option value="tidak_berfungsi">Tidak Berfungsi</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Status Operasional
                </label>
                <select
                  value={conditionData.operational_status}
                  onChange={(e) => setConditionData({ ...conditionData, operational_status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                  }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="perlu_pemeriksaan">Perlu Pemeriksaan</option>
                  <option value="dalam_perbaikan">Dalam Perbaikan</option>
                  <option value="di-upgrade">Di-upgrade</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Catatan Pemeriksaan Fisik
                </label>
                <textarea
                  rows="3"
                  value={conditionData.notes}
                  onChange={(e) => setConditionData({ ...conditionData, notes: e.target.value })}
                  placeholder="Jelaskan kondisi kerusakan yang diamati saat inspeksi..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setConditionModalDevice(null)}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={submittingCondition} className="btn-primary">
                  {submittingCondition ? 'Menyimpan...' : 'Perbarui Kondisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete (Admin only) */}
      {deleteConfirmDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--status-danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="var(--status-danger)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Konfirmasi Hapus Perangkat
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>
                  Tindakan ini tidak dapat dibatalkan.
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus perangkat <strong>{deleteConfirmDevice.code}</strong> (
              {deleteConfirmDevice.name})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteConfirmDevice(null)} className="btn-secondary">
                Batal
              </button>
              <button
                onClick={handleDeleteDevice}
                style={{
                  backgroundColor: 'var(--status-danger)',
                  color: 'var(--base-white)',
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-button)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
