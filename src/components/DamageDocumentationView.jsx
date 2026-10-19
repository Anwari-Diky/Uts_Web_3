import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Camera,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
  Upload,
  X,
  FileText,
  MapPin,
  Calendar,
  User,
  HardDrive,
  CheckCircle2,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
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
      return <span className="badge badge-info">{status || '-'}</span>;
  }
};

export const DamageDocumentationView = () => {
  const { user, token } = useAuth();

  // Data states
  const [docs, setDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [devicesList, setDevicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total_photos: 0, documented_devices: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Upload state
  const [uploadDeviceId, setUploadDeviceId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch filter metadata (categories & devices)
  useEffect(() => {
    if (!token) return;
    const fetchMeta = async () => {
      try {
        const [catRes, devRes] = await Promise.all([
          fetch('/api/v1/device-categories', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/devices?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories(Array.isArray(catJson.data) ? catJson.data : []);
        }
        if (devRes.ok) {
          const devJson = await devRes.json();
          const items = Array.isArray(devJson.data?.items)
            ? devJson.data.items
            : Array.isArray(devJson.data)
            ? devJson.data
            : [];
          setDevicesList(items);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };

    fetchMeta();
  }, [token]);

  // Fetch all damage docs
  const fetchDamageDocs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedCondition) params.append('condition_status', selectedCondition);
      if (selectedDevice) params.append('device_id', selectedDevice);

      const res = await fetch(`/api/v1/damage-documentation?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal memuat dokumentasi kerusakan');
      }

      const json = await res.json();
      const docsList = Array.isArray(json.data) ? json.data : [];
      setDocs(docsList);
      setMeta(json.meta || { total_photos: docsList.length, documented_devices: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedCategory, selectedCondition, selectedDevice]);

  useEffect(() => {
    fetchDamageDocs();
  }, [fetchDamageDocs]);

  // Clean preview URL when modal closes or file changes
  useEffect(() => {
    if (!uploadFile) {
      setUploadPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(uploadFile);
    setUploadPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadFile]);

  // Handle upload submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadDeviceId) {
      setUploadError('Silakan pilih perangkat yang didokumentasikan');
      return;
    }
    if (!uploadFile) {
      setUploadError('Silakan pilih berkas foto kerusakan');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('photo', uploadFile);
      formData.append('device_id', uploadDeviceId);
      if (uploadCaption.trim()) {
        formData.append('caption', uploadCaption.trim());
      }

      const res = await fetch('/api/v1/damage-documentation', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal mengunggah foto dokumentasi');
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadCaption('');
        setUploadDeviceId('');
        setUploadSuccess(false);
        fetchDamageDocs();
      }, 1000);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDeleteDoc = async () => {
    if (!deleteConfirmDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/damage-documentation/${deleteConfirmDoc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal menghapus foto dokumentasi');
      }

      setDeleteConfirmDoc(null);
      if (previewDoc && previewDoc.id === deleteConfirmDoc.id) {
        setPreviewDoc(null);
      }
      fetchDamageDocs();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const isTechnicianOrAdmin = user?.role === 'admin' || user?.role === 'teknisi';
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(32, 91, 67, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-forest)',
              }}
            >
              <Camera size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Dokumentasi Kerusakan Perangkat
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', margin: '3px 0 0 0' }}>
                Galeri visual dan catatan inspeksi fisik kerusakan perangkat laboratorium untuk transparansi penilaian SAW.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchDamageDocs}
            className="btn-secondary"
            title="Muat Ulang Data"
            style={{ padding: '9px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>

          {isTechnicianOrAdmin && (
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadError(null);
                setUploadSuccess(false);
              }}
              className="btn-primary"
              style={{ padding: '9px 16px', fontSize: '13px' }}
            >
              <Plus size={16} />
              <span>Unggah Dokumentasi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderLeft: '4px solid var(--brand-forest)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: 'rgba(32, 91, 67, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-forest)',
            }}
          >
            <Camera size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray-green)', textTransform: 'uppercase' }}>
              Total Foto Kerusakan
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {meta.total_photos}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderLeft: '4px solid #B35300',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#FFF2E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B35300',
            }}
          >
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray-green)', textTransform: 'uppercase' }}>
              Perangkat Terdokumentasi
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {meta.documented_devices}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderLeft: '4px solid var(--status-info)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: 'var(--status-info-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-info)',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray-green)', textTransform: 'uppercase' }}>
              Validasi Berkas
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              JPG, PNG, WEBP (Maks 5MB)
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', minWidth: '200px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-gray-green)',
            }}
          />
          <input
            type="text"
            placeholder="Cari kode, nama perangkat, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border-soft)',
              fontSize: '13px',
              backgroundColor: 'var(--base-white)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Filter Category */}
        <div style={{ flex: '0 1 180px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Condition */}
        <div style={{ flex: '0 1 180px' }}>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
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
            <option value="rusak_ringan">Rusak Ringan</option>
            <option value="rusak_berat">Rusak Berat</option>
            <option value="tidak_berfungsi">Tidak Berfungsi</option>
            <option value="perlu_perhatian">Perlu Perhatian</option>
            <option value="baik">Baik</option>
          </select>
        </div>

        {/* Filter Device */}
        <div style={{ flex: '0 1 200px' }}>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
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
            <option value="">Semua Perangkat</option>
            {(devicesList || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearch('');
            setSelectedCategory('');
            setSelectedCondition('');
            setSelectedDevice('');
          }}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Photo Grid */}
      {loading ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-gray-green)',
            fontSize: '14px',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-soft)',
              borderTopColor: 'var(--brand-forest)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '12px',
            }}
          />
          <div>Memuat galeri dokumentasi kerusakan...</div>
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--status-danger)',
          }}
        >
          <AlertTriangle size={32} style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{error}</div>
          <button
            onClick={fetchDamageDocs}
            className="btn-secondary"
            style={{ marginTop: '16px', display: 'inline-flex' }}
          >
            Coba Lagi
          </button>
        </div>
      ) : docs.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            color: 'var(--text-gray-green)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(32, 91, 67, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--brand-forest)',
            }}
          >
            <Camera size={32} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Belum Ada Dokumentasi Kerusakan Ditemukan
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            {search || selectedCategory || selectedCondition || selectedDevice
              ? 'Tidak ada foto dokumentasi kerusakan yang sesuai dengan kriteria filter saat ini. Coba sesuaikan kata kunci atau bersihkan filter.'
              : 'Belum ada bukti foto kerusakan yang diunggah. Teknisi dan Admin dapat mengunggah foto fisik perangkat yang rusak beserta catatan pemeriksaannya.'}
          </p>

          {isTechnicianOrAdmin && (
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadError(null);
                setUploadSuccess(false);
              }}
              className="btn-primary"
              style={{ display: 'inline-flex', padding: '10px 18px', fontSize: '13px' }}
            >
              <Upload size={16} />
              <span>Unggah Dokumentasi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        /* Visual Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {(docs || []).map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* Photo Box */}
              <div
                onClick={() => setPreviewDoc(doc)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  backgroundColor: '#1E293B',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={doc.storage_path}
                  alt={doc.caption || doc.device_name || 'Dokumentasi kerusakan'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.25s ease',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.style.backgroundColor = '#334155';
                  }}
                />

                {/* Badges on Top of Photo */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(4px)',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    {doc.device_code}
                  </span>
                  {getConditionBadge(doc.condition_status)}
                </div>

                {/* Zoom overlay hint */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: '#FFF',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Maximize2 size={12} />
                  <span>Lihat Foto</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {doc.device_name}
                    </h4>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-gray-green)',
                      marginTop: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{doc.category_name || 'Periferal'}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} />
                      {doc.location_name || '-'}
                    </span>
                  </div>
                </div>

                {/* Caption / Technician Notes */}
                <div
                  style={{
                    backgroundColor: 'var(--canvas-soft)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    border: '1px solid var(--border-soft)',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--brand-forest)',
                      marginBottom: '4px',
                    }}
                  >
                    <FileText size={12} />
                    <span>Catatan Kerusakan:</span>
                  </div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: doc.caption ? 'var(--text-primary)' : 'var(--text-gray-green)',
                      fontStyle: doc.caption ? 'normal' : 'italic',
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {doc.caption || 'Tidak ada catatan kerusakan yang disertakan.'}
                  </p>
                </div>

                {/* Metadata Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11.5px',
                    color: 'var(--text-gray-green)',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-soft)',
                    marginTop: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} />
                    <span>{doc.uploader_name || 'Teknisi'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--border-soft)',
                  }}
                >
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="btn-secondary"
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Eye size={13} />
                    <span>Periksa Detail</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setDeleteConfirmDoc(doc)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--status-danger-border)',
                        color: 'var(--status-danger)',
                        borderRadius: 'var(--radius-button)',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Hapus dokumentasi ini"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Detail & Full Photo Preview Modal */}
      {previewDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--base-white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'var(--brand-forest)',
                      color: '#FFF',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    {previewDoc.device_code}
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {previewDoc.device_name}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                  {[previewDoc.brand, previewDoc.model].filter(Boolean).join(' - ') || previewDoc.category_name} •{' '}
                  {previewDoc.location_name}
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content: Split Photo and Metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(260px, 1fr)',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {/* Photo View */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  minHeight: '360px',
                }}
              >
                <img
                  src={previewDoc.storage_path}
                  alt={previewDoc.caption || 'Foto Dokumentasi Kerusakan'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
              </div>

              {/* Information Panel */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-gray-green)', textTransform: 'uppercase' }}>
                    Kondisi Fisik Saat Ini
                  </div>
                  <div style={{ marginTop: '4px' }}>{getConditionBadge(previewDoc.condition_status)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-gray-green)', textTransform: 'uppercase' }}>
                    Catatan Pemeriksaan Teknisi
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '12px',
                      backgroundColor: 'var(--canvas-soft)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-soft)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: previewDoc.caption ? 'var(--text-primary)' : 'var(--text-gray-green)',
                      fontStyle: previewDoc.caption ? 'normal' : 'italic',
                    }}
                  >
                    {previewDoc.caption || 'Tidak ada catatan kerusakan khusus yang diberikan pada saat pengunggahan.'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--surface-sage)',
                    padding: '12px',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-gray-green)', display: 'block', fontSize: '11px' }}>Pengunggah:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{previewDoc.uploader_name || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-gray-green)', display: 'block', fontSize: '11px' }}>Waktu Unggah:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatDate(previewDoc.created_at)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-gray-green)', display: 'block', fontSize: '11px' }}>Nama File:</span>
                    <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {previewDoc.original_filename || '-'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-gray-green)', display: 'block', fontSize: '11px' }}>Ukuran File:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {formatFileSize(previewDoc.file_size_bytes)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                  <a
                    href={previewDoc.storage_path}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      padding: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    Buka Ukuran Asli
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => setDeleteConfirmDoc(previewDoc)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--status-danger-border)',
                        color: 'var(--status-danger)',
                        borderRadius: 'var(--radius-button)',
                        padding: '8px 14px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload New Damage Documentation Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => {
            if (!uploading) setShowUploadModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--base-white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--brand-forest)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Unggah Dokumentasi Kerusakan
                </h3>
              </div>
              <button
                disabled={uploading}
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} style={{ padding: '20px' }}>
              {uploadError && (
                <div
                  style={{
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger)',
                    border: '1px solid var(--status-danger-border)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div
                  style={{
                    backgroundColor: 'var(--status-success-bg)',
                    color: 'var(--status-success)',
                    border: '1px solid var(--status-success-border)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Foto dokumentasi kerusakan berhasil diunggah!</span>
                </div>
              )}

              {/* Select Device */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Pilih Perangkat Periferal <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <select
                  required
                  value={uploadDeviceId}
                  onChange={(e) => setUploadDeviceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                    backgroundColor: 'var(--base-white)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">-- Pilih Perangkat yang Mengalami Kerusakan --</option>
                  {(devicesList || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.code}] {d.name} ({d.category_name} - {d.condition_status.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11.5px', color: 'var(--text-gray-green)', margin: '4px 0 0 0' }}>
                  Pilih inventaris perangkat yang sedang diperiksa fisiknya oleh teknisi.
                </p>
              </div>

              {/* File Upload Drop Area */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Foto Kerusakan Fisik <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>

                <div
                  style={{
                    border: '2px dashed var(--border-soft)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--canvas-soft)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setUploadError('Ukuran berkas melebihi batas 5MB.');
                          setUploadFile(null);
                          return;
                        }
                        setUploadError(null);
                        setUploadFile(file);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />

                  {uploadPreviewUrl ? (
                    <div>
                      <img
                        src={uploadPreviewUrl}
                        alt="Pratinjau Unggahan"
                        style={{
                          maxHeight: '180px',
                          maxWidth: '100%',
                          borderRadius: '6px',
                          objectFit: 'contain',
                          margin: '0 auto 10px auto',
                          display: 'block',
                        }}
                      />
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-forest)' }}>
                        {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                        Klik atau seret file lain untuk mengganti
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} style={{ margin: '0 auto 8px auto', color: 'var(--brand-forest)', opacity: 0.8 }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Pilih foto atau seret ke sini
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
                        Format diperbolehkan: JPG, PNG, atau WEBP (Maksimal 5 MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Catatan Pemeriksaan Kerusakan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Port HDMI longgar dan layar bergaris vertikal saat dinyalakan..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '13px',
                    backgroundColor: 'var(--base-white)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
                <p style={{ fontSize: '11.5px', color: 'var(--text-gray-green)', margin: '4px 0 0 0' }}>
                  Deskripsikan bagian yang cacat fisik atau anomali yang ditemukan untuk verifikasi SAW.
                </p>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadDeviceId}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => {
            if (!deleting) setDeleteConfirmDoc(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--base-white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-danger)',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Konfirmasi Hapus Dokumentasi
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', lineHeight: 1.5, marginBottom: '20px' }}>
              Apakah Anda yakin ingin menghapus foto dokumentasi kerusakan untuk perangkat{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirmDoc.device_code}</strong> ({deleteConfirmDoc.device_name})?
              Berkas fisik di server akan dihapus secara permanen.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirmDoc(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteDoc}
                style={{
                  backgroundColor: 'var(--status-danger)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
