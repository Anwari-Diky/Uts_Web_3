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
  Tag,
  Sliders,
  Lock,
  Check,
  Layers,
  AlertCircle,
  Info,
  Maximize2,
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

const getConditionBadge = (status, customConditions = []) => {
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
    default: {
      const match = customConditions.find((c) => c.code === status);
      if (match) {
        let badgeClass = 'badge-info';
        if (match.badge_color === 'success') badgeClass = 'badge-success';
        if (match.badge_color === 'warning') badgeClass = 'badge-warning';
        if (match.badge_color === 'danger') badgeClass = 'badge-danger';
        return <span className={`badge ${badgeClass}`}>{match.name}</span>;
      }
      return <span className="badge badge-info">{status}</span>;
    }
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
  const [conditions, setConditions] = useState([]);
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
  const [deletingDevice, setDeletingDevice] = useState(false);
  const [deleteDeviceError, setDeleteDeviceError] = useState(null);
  const [deviceFeedback, setDeviceFeedback] = useState(null);

  // Master Data Management Modal states (Kategori, Lokasi, Kondisi)
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterTab, setMasterTab] = useState('kategori'); // 'kategori' | 'lokasi' | 'kondisi'
  const [masterSearch, setMasterSearch] = useState('');
  const [masterFeedback, setMasterFeedback] = useState(null);

  // Master Category Form State
  const [catForm, setCatForm] = useState({ id: null, name: '', description: '' });
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [submittingCat, setSubmittingCat] = useState(false);

  // Master Location Form State
  const [locForm, setLocForm] = useState({ id: null, name: '', description: '' });
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [submittingLoc, setSubmittingLoc] = useState(false);

  // Master Condition Form State
  const [condForm, setCondForm] = useState({
    id: null,
    code: '',
    name: '',
    description: '',
    badge_color: 'info',
  });
  const [isEditingCond, setIsEditingCond] = useState(false);
  const [submittingCondMaster, setSubmittingCondMaster] = useState(false);

  // Upload state in detail modal
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewDamageDoc, setPreviewDamageDoc] = useState(null);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setUploadPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

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

  // Fetch filter metadata (categories, locations, and conditions)
  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, locRes, condRes] = await Promise.all([
        fetch('/api/v1/device-categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/locations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/device-conditions', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats.data || []);
      }
      if (locRes.ok) {
        const locs = await locRes.json();
        setLocations(locs.data || []);
      }
      if (condRes.ok) {
        const conds = await condRes.json();
        setConditions(conds.data || []);
      }
    } catch (err) {
      console.error('Failed to load categories/locations/conditions:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Master Category Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setMasterFeedback(null);
    if (!catForm.name.trim()) {
      setMasterFeedback({ type: 'error', message: 'Nama kategori wajib diisi' });
      return;
    }
    setSubmittingCat(true);
    try {
      const url = isEditingCat ? `/api/v1/device-categories/${catForm.id}` : '/api/v1/device-categories';
      const method = isEditingCat ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: catForm.name.trim(), description: catForm.description.trim() }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menyimpan kategori');
      setCatForm({ id: null, name: '', description: '' });
      setIsEditingCat(false);
      setMasterFeedback({ type: 'success', message: resJson.message || 'Kategori berhasil disimpan' });
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleEditCategory = (cat) => {
    setMasterFeedback(null);
    setCatForm({ id: cat.id, name: cat.name, description: cat.description || '' });
    setIsEditingCat(true);
  };

  const handleCancelCategoryEdit = () => {
    setCatForm({ id: null, name: '', description: '' });
    setIsEditingCat(false);
    setMasterFeedback(null);
  };

  const handleDeleteCategory = async (cat) => {
    setMasterFeedback(null);
    if (cat.device_count > 0) {
      setMasterFeedback({
        type: 'error',
        message: `Kategori '${cat.name}' tidak dapat dihapus karena masih digunakan oleh ${cat.device_count} perangkat. Silakan ubah atau pindahkan kategori perangkat terkait terlebih dahulu.`,
      });
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/device-categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menghapus kategori');
      setMasterFeedback({ type: 'success', message: resJson.message || 'Kategori berhasil dihapus' });
      if (isEditingCat && catForm.id === cat.id) handleCancelCategoryEdit();
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    }
  };

  // Master Location Handlers
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setMasterFeedback(null);
    if (!locForm.name.trim()) {
      setMasterFeedback({ type: 'error', message: 'Nama lokasi wajib diisi' });
      return;
    }
    setSubmittingLoc(true);
    try {
      const url = isEditingLoc ? `/api/v1/locations/${locForm.id}` : '/api/v1/locations';
      const method = isEditingLoc ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: locForm.name.trim(), description: locForm.description.trim() }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menyimpan lokasi');
      setLocForm({ id: null, name: '', description: '' });
      setIsEditingLoc(false);
      setMasterFeedback({ type: 'success', message: resJson.message || 'Lokasi berhasil disimpan' });
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmittingLoc(false);
    }
  };

  const handleEditLocation = (loc) => {
    setMasterFeedback(null);
    setLocForm({ id: loc.id, name: loc.name, description: loc.description || '' });
    setIsEditingLoc(true);
  };

  const handleCancelLocationEdit = () => {
    setLocForm({ id: null, name: '', description: '' });
    setIsEditingLoc(false);
    setMasterFeedback(null);
  };

  const handleDeleteLocation = async (loc) => {
    setMasterFeedback(null);
    if (loc.device_count > 0) {
      setMasterFeedback({
        type: 'error',
        message: `Lokasi '${loc.name}' tidak dapat dihapus karena masih digunakan oleh ${loc.device_count} perangkat. Silakan ubah atau pindahkan lokasi perangkat terkait terlebih dahulu.`,
      });
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus lokasi "${loc.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/locations/${loc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menghapus lokasi');
      setMasterFeedback({ type: 'success', message: resJson.message || 'Lokasi berhasil dihapus' });
      if (isEditingLoc && locForm.id === loc.id) handleCancelLocationEdit();
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    }
  };

  // Master Condition Handlers
  const handleSaveConditionMaster = async (e) => {
    e.preventDefault();
    setMasterFeedback(null);
    if (!condForm.name.trim()) {
      setMasterFeedback({ type: 'error', message: 'Nama status kondisi wajib diisi' });
      return;
    }
    setSubmittingCondMaster(true);
    try {
      const url = isEditingCond ? `/api/v1/device-conditions/${condForm.id}` : '/api/v1/device-conditions';
      const method = isEditingCond ? 'PUT' : 'POST';
      const payload = isEditingCond
        ? { name: condForm.name.trim(), description: condForm.description.trim(), badge_color: condForm.badge_color }
        : { code: condForm.code.trim() || undefined, name: condForm.name.trim(), description: condForm.description.trim(), badge_color: condForm.badge_color };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menyimpan status kondisi');
      setCondForm({ id: null, code: '', name: '', description: '', badge_color: 'info' });
      setIsEditingCond(false);
      setMasterFeedback({ type: 'success', message: resJson.message || 'Status kondisi berhasil disimpan' });
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmittingCondMaster(false);
    }
  };

  const handleEditCondition = (cond) => {
    setMasterFeedback(null);
    setCondForm({
      id: cond.id,
      code: cond.code,
      name: cond.name,
      description: cond.description || '',
      badge_color: cond.badge_color || 'info',
    });
    setIsEditingCond(true);
  };

  const handleCancelConditionEdit = () => {
    setCondForm({ id: null, code: '', name: '', description: '', badge_color: 'info' });
    setIsEditingCond(false);
    setMasterFeedback(null);
  };

  const handleDeleteConditionMaster = async (cond) => {
    setMasterFeedback(null);
    if (cond.is_default === 1) {
      setMasterFeedback({
        type: 'error',
        message: `Status kondisi '${cond.name}' adalah status bawaan sistem dan tidak dapat dihapus demi integritas data kalkulasi.`,
      });
      return;
    }
    if (cond.device_count > 0) {
      setMasterFeedback({
        type: 'error',
        message: `Status kondisi '${cond.name}' tidak dapat dihapus karena masih digunakan oleh ${cond.device_count} perangkat.`,
      });
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus status kondisi "${cond.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/device-conditions/${cond.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || 'Gagal menghapus status kondisi');
      setMasterFeedback({ type: 'success', message: resJson.message || 'Status kondisi berhasil dihapus' });
      if (isEditingCond && condForm.id === cond.id) handleCancelConditionEdit();
      await fetchMetadata();
      fetchDevices();
    } catch (err) {
      setMasterFeedback({ type: 'error', message: err.message });
    }
  };


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

  // Deactivate device (soft decommission without losing historical records)
  const handleDeactivateDevice = async () => {
    if (!deleteConfirmDevice) return;
    setDeletingDevice(true);
    setDeleteDeviceError(null);
    try {
      const res = await fetch(`/api/v1/devices/${deleteConfirmDevice.id}/condition`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          condition_status: deleteConfirmDevice.condition_status,
          operational_status: 'nonaktif',
          notes: `${deleteConfirmDevice.notes || ''} [Dinonaktifkan oleh ${user?.full_name || 'Admin'}]`.trim(),
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal menonaktifkan perangkat');
      }

      setDeviceFeedback({
        type: 'success',
        message: `Perangkat ${deleteConfirmDevice.code} (${deleteConfirmDevice.name}) berhasil dinonaktifkan dari operasional lab.`,
      });

      if (detailDevice && detailDevice.id === deleteConfirmDevice.id) {
        setDetailDevice(null);
      }
      setDeleteConfirmDevice(null);
      fetchDevices();
    } catch (err) {
      setDeleteDeviceError(err.message);
    } finally {
      setDeletingDevice(false);
    }
  };

  // Delete device (Admin only - permanent cascade deletion)
  const handleDeleteDevice = async () => {
    if (!deleteConfirmDevice) return;
    setDeletingDevice(true);
    setDeleteDeviceError(null);
    try {
      const res = await fetch(`/api/v1/devices/${deleteConfirmDevice.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal menghapus perangkat');
      }

      setDeviceFeedback({
        type: 'success',
        message: resJson.data?.message || `Perangkat ${deleteConfirmDevice.code} berhasil dihapus permanen.`,
      });

      if (detailDevice && detailDevice.id === deleteConfirmDevice.id) {
        setDetailDevice(null);
      }
      setDeleteConfirmDevice(null);
      fetchDevices();
    } catch (err) {
      setDeleteDeviceError(err.message);
    } finally {
      setDeletingDevice(false);
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
            Kelola data inventaris, spesifikasi teknis, dan kondisi fisik periferal.
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setMasterTab('kategori');
                setMasterFeedback(null);
                setShowMasterModal(true);
              }}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
              title="Kelola Master Kategori Perangkat (Input, Edit, Hapus)"
            >
              <Tag size={15} style={{ color: 'var(--electric-blue)' }} />
              Kelola Kategori
            </button>

            <button
              onClick={() => {
                setMasterTab('lokasi');
                setMasterFeedback(null);
                setShowMasterModal(true);
              }}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
              title="Kelola Master Lokasi Lab (Input, Edit, Hapus)"
            >
              <MapPin size={15} style={{ color: '#10B981' }} />
              Kelola Lokasi
            </button>

            <button
              onClick={() => {
                setMasterTab('kondisi');
                setMasterFeedback(null);
                setShowMasterModal(true);
              }}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
              title="Kelola Master Status Kondisi (Input, Edit, Hapus)"
            >
              <Sliders size={15} style={{ color: '#F59E0B' }} />
              Kelola Kondisi
            </button>

            <button onClick={handleOpenCreate} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              <Plus size={16} />
              Tambah Perangkat
            </button>
          </div>
        )}
      </div>

      {/* Page Notification Feedback Banner */}
      {deviceFeedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-card)',
            marginBottom: '16px',
            backgroundColor:
              deviceFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              deviceFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }`,
            color: deviceFeedback.type === 'success' ? '#10B981' : '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {deviceFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{deviceFeedback.message}</span>
          </div>
          <button
            onClick={() => setDeviceFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Tutup pesan"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            {conditions.length > 0 ? (
              conditions.map((c) => (
                <option key={c.id || c.code} value={c.code}>
                  {c.name}
                </option>
              ))
            ) : (
              <>
                <option value="baik">Baik</option>
                <option value="perlu_perhatian">Perlu Perhatian</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
                <option value="tidak_berfungsi">Tidak Berfungsi</option>
              </>
            )}
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
                    <td style={{ padding: '12px 16px' }}>{getConditionBadge(dev.condition_status, conditions)}</td>
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
              <button
                onClick={() => {
                  setDetailDevice(null);
                  setUploadFile(null);
                  setPreviewDamageDoc(null);
                  setUploadError(null);
                }}
                className="btn-secondary"
                style={{ padding: '6px 8px' }}
              >
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
                <div>{getConditionBadge(detailDevice.condition_status, conditions)}</div>
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
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--status-danger)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setUploadError('Ukuran file melebihi batas 5MB.');
                              e.target.value = '';
                              setUploadFile(null);
                              return;
                            }
                            setUploadError(null);
                            setUploadFile(file);
                          }
                        }}
                        style={{ fontSize: '12px', width: '100%' }}
                      />
                    </div>
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Keterangan kerusakan (misal: tombol keyboard patah)"
                      style={{
                        flex: '2 1 240px',
                        padding: '7px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-input)',
                        border: '1px solid var(--border-soft)',
                        backgroundColor: 'var(--base-white)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={uploading || !uploadFile}
                      className="btn-primary"
                      style={{ padding: '7px 16px', fontSize: '12px' }}
                    >
                      <Upload size={13} />
                      {uploading ? 'Mengunggah...' : 'Unggah'}
                    </button>
                  </div>

                  {/* Selected File Preview Box */}
                  {uploadFile && uploadPreviewUrl && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'var(--base-white)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-input)',
                        padding: '8px 12px',
                        marginTop: '10px',
                      }}
                    >
                      <img
                        src={uploadPreviewUrl}
                        alt="Pratinjau Foto"
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--border-soft)',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {uploadFile.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                          {(uploadFile.size / 1024).toFixed(1)} KB • Siap diunggah
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreviewUrl(null);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Batalkan berkas ini"
                      >
                        <X size={12} /> Batal
                      </button>
                    </div>
                  )}
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 210px))',
                    gap: '14px',
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
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Photo Thumbnail Container */}
                      <div
                        onClick={() => setPreviewDamageDoc(doc)}
                        style={{
                          position: 'relative',
                          height: '150px',
                          backgroundColor: '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                        title="Klik untuk melihat foto dalam ukuran besar"
                      >
                        {/* Ambient Blurred Backdrop from image */}
                        <img
                          src={doc.storage_path}
                          alt=""
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: '-8px',
                            width: 'calc(100% + 16px)',
                            height: 'calc(100% + 16px)',
                            objectFit: 'cover',
                            filter: 'blur(12px) brightness(0.65)',
                            opacity: 0.55,
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Crisp Contained Full Image (No Cropping) */}
                        <img
                          src={doc.storage_path}
                          alt={doc.caption || 'Foto kerusakan'}
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            padding: '6px',
                            transition: 'transform 0.2s ease',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.previousElementSibling) {
                              e.currentTarget.previousElementSibling.style.display = 'none';
                            }
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />

                        {/* Fallback Placeholder */}
                        <div
                          style={{
                            display: 'none',
                            position: 'relative',
                            zIndex: 1,
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            textAlign: 'center',
                            color: 'var(--text-gray-green)',
                            fontSize: '11px',
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          <Camera size={22} style={{ marginBottom: '4px', opacity: 0.7 }} />
                          <span>Foto tidak dapat dimuat</span>
                        </div>

                        {/* Zoom overlay badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            zIndex: 2,
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            color: '#FFF',
                            borderRadius: '4px',
                            padding: '3px 7px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <Maximize2 size={10} />
                          <span>Perbesar</span>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div
                        style={{
                          padding: '10px 12px',
                          fontSize: '12px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={doc.caption || doc.original_filename}
                        >
                          {doc.caption || doc.original_filename}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: 'var(--text-gray-green)',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border-soft)',
                          }}
                        >
                          <span>{doc.uploader_name || 'Petugas'}</span>
                          {doc.created_at && (
                            <span>
                              {new Date(doc.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
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

      {/* Lightbox / Zoom Modal for Damage Documentation in DeviceManagement */}
      {previewDamageDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
          onClick={() => setPreviewDamageDoc(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--base-white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {previewDamageDoc.caption || 'Foto Dokumentasi Kerusakan'}
                </h4>
                <div style={{ fontSize: '11.5px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                  Perangkat: {detailDevice?.code} - {detailDevice?.name}
                </div>
              </div>
              <button
                onClick={() => setPreviewDamageDoc(null)}
                className="btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo View with Ambient Blur Backdrop */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#0B1120',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                minHeight: '320px',
                maxHeight: '60vh',
                overflow: 'hidden',
              }}
            >
              <img
                src={previewDamageDoc.storage_path}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  width: 'calc(100% + 40px)',
                  height: 'calc(100% + 40px)',
                  objectFit: 'cover',
                  filter: 'blur(20px) brightness(0.4)',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
              <img
                src={previewDamageDoc.storage_path}
                alt={previewDamageDoc.caption || 'Foto Dokumentasi Kerusakan'}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: '100%',
                  maxHeight: '56vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: 'var(--canvas-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                borderTop: '1px solid var(--border-soft)',
              }}
            >
              <div style={{ color: 'var(--text-gray-green)' }}>
                Oleh: <strong style={{ color: 'var(--text-primary)' }}>{previewDamageDoc.uploader_name || 'Petugas'}</strong>
                {previewDamageDoc.created_at && (
                  <span> • {new Date(previewDamageDoc.created_at).toLocaleString('id-ID')}</span>
                )}
              </div>
              <a
                href={previewDamageDoc.storage_path}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
              >
                Buka Ukuran Penuh
              </a>
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
                    {conditions.length > 0 ? (
                      conditions.map((c) => (
                        <option key={c.id || c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="baik">Baik</option>
                        <option value="perlu_perhatian">Perlu Perhatian</option>
                        <option value="rusak_ringan">Rusak Ringan</option>
                        <option value="rusak_berat">Rusak Berat</option>
                        <option value="tidak_berfungsi">Tidak Berfungsi</option>
                      </>
                    )}
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
                  {conditions.length > 0 ? (
                    conditions.map((c) => (
                      <option key={c.id || c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="baik">Baik</option>
                      <option value="perlu_perhatian">Perlu Perhatian</option>
                      <option value="rusak_ringan">Rusak Ringan</option>
                      <option value="rusak_berat">Rusak Berat</option>
                      <option value="tidak_berfungsi">Tidak Berfungsi</option>
                    </>
                  )}
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
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--status-danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={22} color="var(--status-danger)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Hapus Data Perangkat
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-gray-green)', display: 'block', marginTop: '3px' }}>
                  Konfirmasi penghapusan inventaris periferal lab
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!deletingDevice) {
                    setDeleteConfirmDevice(null);
                    setDeleteDeviceError(null);
                  }
                }}
                disabled={deletingDevice}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: deletingDevice ? 'not-allowed' : 'pointer',
                  color: 'var(--text-gray-green)',
                  padding: '4px',
                }}
                title="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            {deleteDeviceError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{deleteDeviceError}</span>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--canvas-soft)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginBottom: '4px' }}>
                Perangkat yang dipilih:
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--brand-forest)', marginRight: '6px' }}>{deleteConfirmDevice.code}</span>
                {deleteConfirmDevice.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
                Merek/Model: {[deleteConfirmDevice.brand, deleteConfirmDevice.model].filter(Boolean).join(' / ') || '-'}
              </div>
            </div>

            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Perhatian:</strong> Menghapus perangkat ini akan membersihkan data inventaris beserta seluruh riwayat terkait (penilaian, foto kerusakan, riwayat perbaikan, dan hasil kalkulasi SAW) secara permanen.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={handleDeactivateDevice}
                disabled={deletingDevice}
                className="btn-secondary"
                style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  color: 'var(--status-warning)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}
                title="Ubah status operasional menjadi nonaktif tanpa menghapus data riwayat"
              >
                Nonaktifkan Saja
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmDevice(null);
                    setDeleteDeviceError(null);
                  }}
                  disabled={deletingDevice}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDevice}
                  disabled={deletingDevice}
                  style={{
                    backgroundColor: 'var(--status-danger)',
                    color: 'var(--base-white)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-button)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: deletingDevice ? 'not-allowed' : 'pointer',
                    opacity: deletingDevice ? 0.7 : 1,
                  }}
                >
                  <Trash2 size={14} />
                  {deletingDevice ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kelola Master Data (Kategori, Lokasi, Kondisi) */}
      {showMasterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid var(--border-soft)',
              backgroundColor: 'var(--canvas-soft)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-soft)',
                backgroundColor: 'var(--base-white)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--electric-blue)',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Kelola Master Data Perangkat
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-gray-green)', margin: '2px 0 0 0' }}>
                    Tambah, edit, dan hapus Kategori periferal, Lokasi lab, serta Status Kondisi fisik.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowMasterModal(false);
                  handleCancelCategoryEdit();
                  handleCancelLocationEdit();
                  handleCancelConditionEdit();
                }}
                className="btn-secondary"
                style={{ padding: '6px 8px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-soft)',
                backgroundColor: 'var(--base-white)',
                padding: '0 24px',
                gap: '8px',
              }}
            >
              <button
                onClick={() => {
                  setMasterTab('kategori');
                  setMasterFeedback(null);
                  setMasterSearch('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: masterTab === 'kategori' ? '2.5px solid var(--electric-blue)' : '2.5px solid transparent',
                  color: masterTab === 'kategori' ? 'var(--electric-blue)' : 'var(--text-gray-green)',
                  fontWeight: masterTab === 'kategori' ? 700 : 500,
                  fontSize: '13.5px',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <Tag size={16} />
                <span>Kategori Perangkat</span>
                <span
                  style={{
                    backgroundColor: masterTab === 'kategori' ? 'rgba(59, 130, 246, 0.15)' : 'var(--canvas-soft)',
                    color: masterTab === 'kategori' ? 'var(--electric-blue)' : 'var(--text-gray-green)',
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setMasterTab('lokasi');
                  setMasterFeedback(null);
                  setMasterSearch('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: masterTab === 'lokasi' ? '2.5px solid #10B981' : '2.5px solid transparent',
                  color: masterTab === 'lokasi' ? '#10B981' : 'var(--text-gray-green)',
                  fontWeight: masterTab === 'lokasi' ? 700 : 500,
                  fontSize: '13.5px',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <MapPin size={16} />
                <span>Lokasi Lab</span>
                <span
                  style={{
                    backgroundColor: masterTab === 'lokasi' ? 'rgba(16, 185, 129, 0.15)' : 'var(--canvas-soft)',
                    color: masterTab === 'lokasi' ? '#10B981' : 'var(--text-gray-green)',
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  {locations.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setMasterTab('kondisi');
                  setMasterFeedback(null);
                  setMasterSearch('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: masterTab === 'kondisi' ? '2.5px solid #F59E0B' : '2.5px solid transparent',
                  color: masterTab === 'kondisi' ? '#F59E0B' : 'var(--text-gray-green)',
                  fontWeight: masterTab === 'kondisi' ? 700 : 500,
                  fontSize: '13.5px',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <Sliders size={16} />
                <span>Status Kondisi Fisik</span>
                <span
                  style={{
                    backgroundColor: masterTab === 'kondisi' ? 'rgba(245, 158, 11, 0.15)' : 'var(--canvas-soft)',
                    color: masterTab === 'kondisi' ? '#F59E0B' : 'var(--text-gray-green)',
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  {conditions.length}
                </span>
              </button>
            </div>

            {/* Feedback alert banner */}
            {masterFeedback && (
              <div
                style={{
                  margin: '16px 24px 0 24px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-input)',
                  backgroundColor:
                    masterFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${
                    masterFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  color: masterFeedback.type === 'success' ? '#10B981' : '#EF4444',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {masterFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{masterFeedback.message}</span>
                </div>
                <button
                  onClick={() => setMasterFeedback(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'currentColor',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Modal Body / Tab Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* TAB 1: KATEGORI PERANGKAT */}
              {masterTab === 'kategori' && (
                <div>
                  {/* Form Create/Edit Kategori */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-card)',
                      border: isEditingCat ? '1.5px solid var(--electric-blue)' : '1px solid var(--border-soft)',
                      backgroundColor: 'var(--base-white)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={15} style={{ color: 'var(--electric-blue)' }} />
                        {isEditingCat ? `Edit Kategori: ${catForm.name}` : 'Tambah Kategori Perangkat Baru'}
                      </h4>
                      {isEditingCat && (
                        <button
                          type="button"
                          onClick={handleCancelCategoryEdit}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveCategory}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Nama Kategori <span style={{ color: 'var(--status-danger)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={catForm.name}
                            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                            placeholder="Contoh: Webcam, Headset, Printer..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Deskripsi (Opsional)
                          </label>
                          <input
                            type="text"
                            value={catForm.description}
                            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                            placeholder="Keterangan singkat fungsi atau kelompok periferal..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={submittingCat}
                            className="btn-primary"
                            style={{
                              padding: '8px 18px',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {isEditingCat ? <Check size={14} /> : <Plus size={14} />}
                            {submittingCat ? 'Menyimpan...' : (isEditingCat ? 'Simpan' : 'Tambah')}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* List of Categories */}
                  <div
                    style={{
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-card)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--base-white)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Daftar Kategori ({categories.length})
                      </span>
                      <div style={{ position: 'relative', width: '220px' }}>
                        <Search
                          size={14}
                          color="var(--text-gray-green)"
                          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          type="text"
                          value={masterSearch}
                          onChange={(e) => setMasterSearch(e.target.value)}
                          placeholder="Cari kategori..."
                          style={{
                            width: '100%',
                            padding: '6px 10px 6px 30px',
                            borderRadius: 'var(--radius-input)',
                            border: '1px solid var(--border-soft)',
                            fontSize: '12px',
                            backgroundColor: 'var(--canvas-soft)',
                          }}
                        />
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--canvas-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Nama Kategori</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Deskripsi</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'center' }}>Perangkat Terkait</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories
                          .filter((c) => !masterSearch || c.name.toLowerCase().includes(masterSearch.toLowerCase()) || (c.description || '').toLowerCase().includes(masterSearch.toLowerCase()))
                          .map((c) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <Tag size={13} style={{ color: 'var(--electric-blue)' }} />
                                  <span>{c.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 16px', color: 'var(--text-gray-green)', fontSize: '12.5px' }}>
                                {c.description || '-'}
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: (c.device_count || 0) > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--canvas-soft)',
                                    color: (c.device_count || 0) > 0 ? 'var(--electric-blue)' : 'var(--text-gray-green)',
                                    fontSize: '11px',
                                  }}
                                >
                                  {c.device_count || 0} Perangkat
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleEditCategory(c)}
                                    title="Edit Kategori"
                                    className="btn-secondary"
                                    style={{ padding: '5px 8px' }}
                                  >
                                    <Edit size={13} color="var(--status-info)" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(c)}
                                    title={(c.device_count || 0) > 0 ? `Tidak dapat dihapus karena digunakan oleh ${c.device_count} perangkat` : 'Hapus Kategori'}
                                    className="btn-secondary"
                                    style={{
                                      padding: '5px 8px',
                                      opacity: (c.device_count || 0) > 0 ? 0.45 : 1,
                                      cursor: (c.device_count || 0) > 0 ? 'not-allowed' : 'pointer',
                                    }}
                                  >
                                    <Trash2 size={13} color="var(--status-danger)" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {categories.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
                              Belum ada kategori terdaftar. Silakan tambah kategori di atas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: LOKASI LAB */}
              {masterTab === 'lokasi' && (
                <div>
                  {/* Form Create/Edit Lokasi */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-card)',
                      border: isEditingLoc ? '1.5px solid #10B981' : '1px solid var(--border-soft)',
                      backgroundColor: 'var(--base-white)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={15} style={{ color: '#10B981' }} />
                        {isEditingLoc ? `Edit Lokasi: ${locForm.name}` : 'Tambah Lokasi / Ruangan Lab Baru'}
                      </h4>
                      {isEditingLoc && (
                        <button
                          type="button"
                          onClick={handleCancelLocationEdit}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveLocation}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Nama Lokasi / Ruangan <span style={{ color: 'var(--status-danger)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={locForm.name}
                            onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                            placeholder="Contoh: Lab Komputer 1, Ruang Server..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Deskripsi (Opsional)
                          </label>
                          <input
                            type="text"
                            value={locForm.description}
                            onChange={(e) => setLocForm({ ...locForm, description: e.target.value })}
                            placeholder="Keterangan gedung, lantai, atau area lab..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={submittingLoc}
                            className="btn-primary"
                            style={{
                              padding: '8px 18px',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#10B981',
                              borderColor: '#10B981',
                            }}
                          >
                            {isEditingLoc ? <Check size={14} /> : <Plus size={14} />}
                            {submittingLoc ? 'Menyimpan...' : (isEditingLoc ? 'Simpan' : 'Tambah')}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* List of Locations */}
                  <div
                    style={{
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-card)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--base-white)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Daftar Lokasi Lab ({locations.length})
                      </span>
                      <div style={{ position: 'relative', width: '220px' }}>
                        <Search
                          size={14}
                          color="var(--text-gray-green)"
                          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          type="text"
                          value={masterSearch}
                          onChange={(e) => setMasterSearch(e.target.value)}
                          placeholder="Cari lokasi..."
                          style={{
                            width: '100%',
                            padding: '6px 10px 6px 30px',
                            borderRadius: 'var(--radius-input)',
                            border: '1px solid var(--border-soft)',
                            fontSize: '12px',
                            backgroundColor: 'var(--canvas-soft)',
                          }}
                        />
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--canvas-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Nama Lokasi</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Deskripsi</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'center' }}>Perangkat Terkait</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations
                          .filter((l) => !masterSearch || l.name.toLowerCase().includes(masterSearch.toLowerCase()) || (l.description || '').toLowerCase().includes(masterSearch.toLowerCase()))
                          .map((l) => (
                            <tr key={l.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <MapPin size={13} style={{ color: '#10B981' }} />
                                  <span>{l.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 16px', color: 'var(--text-gray-green)', fontSize: '12.5px' }}>
                                {l.description || '-'}
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: (l.device_count || 0) > 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--canvas-soft)',
                                    color: (l.device_count || 0) > 0 ? '#10B981' : 'var(--text-gray-green)',
                                    fontSize: '11px',
                                  }}
                                >
                                  {l.device_count || 0} Perangkat
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleEditLocation(l)}
                                    title="Edit Lokasi"
                                    className="btn-secondary"
                                    style={{ padding: '5px 8px' }}
                                  >
                                    <Edit size={13} color="var(--status-info)" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLocation(l)}
                                    title={(l.device_count || 0) > 0 ? `Tidak dapat dihapus karena digunakan oleh ${l.device_count} perangkat` : 'Hapus Lokasi'}
                                    className="btn-secondary"
                                    style={{
                                      padding: '5px 8px',
                                      opacity: (l.device_count || 0) > 0 ? 0.45 : 1,
                                      cursor: (l.device_count || 0) > 0 ? 'not-allowed' : 'pointer',
                                    }}
                                  >
                                    <Trash2 size={13} color="var(--status-danger)" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {locations.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
                              Belum ada lokasi terdaftar. Silakan tambah lokasi di atas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: STATUS KONDISI FISIK */}
              {masterTab === 'kondisi' && (
                <div>
                  {/* Form Create/Edit Status Kondisi */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-card)',
                      border: isEditingCond ? '1.5px solid #F59E0B' : '1px solid var(--border-soft)',
                      backgroundColor: 'var(--base-white)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={15} style={{ color: '#F59E0B' }} />
                        {isEditingCond ? `Edit Status Kondisi: ${condForm.name}` : 'Tambah Status Kondisi Fisik Baru'}
                      </h4>
                      {isEditingCond && (
                        <button
                          type="button"
                          onClick={handleCancelConditionEdit}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveConditionMaster}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.5fr auto', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Nama Kondisi <span style={{ color: 'var(--status-danger)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={condForm.name}
                            onChange={(e) => setCondForm({ ...condForm, name: e.target.value })}
                            placeholder="Contoh: Sedang Kalibrasi, Afkir..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        {!isEditingCond && (
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                              Kode Sistem (Opsional)
                            </label>
                            <input
                              type="text"
                              value={condForm.code}
                              onChange={(e) => setCondForm({ ...condForm, code: e.target.value })}
                              placeholder="otomatis dari nama"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-input)',
                                border: '1px solid var(--border-soft)',
                                fontSize: '13px',
                                backgroundColor: 'var(--canvas-soft)',
                                fontFamily: 'monospace',
                              }}
                            />
                          </div>
                        )}

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Warna Badge
                          </label>
                          <select
                            value={condForm.badge_color}
                            onChange={(e) => setCondForm({ ...condForm, badge_color: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          >
                            <option value="success">Hijau (Baik / Siap)</option>
                            <option value="warning">Oranye / Kuning (Perhatian)</option>
                            <option value="danger">Merah (Rusak / Afkir)</option>
                            <option value="info">Biru / Abu (Informasi)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Deskripsi Status
                          </label>
                          <input
                            type="text"
                            value={condForm.description}
                            onChange={(e) => setCondForm({ ...condForm, description: e.target.value })}
                            placeholder="Kriteria kondisi fisik..."
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-input)',
                              border: '1px solid var(--border-soft)',
                              fontSize: '13px',
                              backgroundColor: 'var(--canvas-soft)',
                            }}
                          />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={submittingCondMaster}
                            className="btn-primary"
                            style={{
                              padding: '8px 18px',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#F59E0B',
                              borderColor: '#F59E0B',
                            }}
                          >
                            {isEditingCond ? <Check size={14} /> : <Plus size={14} />}
                            {submittingCondMaster ? 'Menyimpan...' : (isEditingCond ? 'Simpan' : 'Tambah')}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* List of Conditions */}
                  <div
                    style={{
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-card)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--base-white)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Standar Kondisi Fisik ({conditions.length})
                      </span>
                      <div style={{ position: 'relative', width: '220px' }}>
                        <Search
                          size={14}
                          color="var(--text-gray-green)"
                          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          type="text"
                          value={masterSearch}
                          onChange={(e) => setMasterSearch(e.target.value)}
                          placeholder="Cari status kondisi..."
                          style={{
                            width: '100%',
                            padding: '6px 10px 6px 30px',
                            borderRadius: 'var(--radius-input)',
                            border: '1px solid var(--border-soft)',
                            fontSize: '12px',
                            backgroundColor: 'var(--canvas-soft)',
                          }}
                        />
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--canvas-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Status / Nama</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Preview Badge</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)' }}>Deskripsi</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'center' }}>Perangkat</th>
                          <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-gray-green)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conditions
                          .filter((c) => !masterSearch || c.name.toLowerCase().includes(masterSearch.toLowerCase()) || (c.code || '').toLowerCase().includes(masterSearch.toLowerCase()))
                          .map((c) => (
                            <tr key={c.id || c.code} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', fontFamily: 'monospace' }}>
                                  {c.code}
                                </div>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                {getConditionBadge(c.code, conditions)}
                              </td>
                              <td style={{ padding: '10px 16px', color: 'var(--text-gray-green)', fontSize: '12.5px' }}>
                                {c.description || '-'}
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: (c.device_count || 0) > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--canvas-soft)',
                                    color: (c.device_count || 0) > 0 ? 'var(--electric-blue)' : 'var(--text-gray-green)',
                                    fontSize: '11px',
                                  }}
                                >
                                  {c.device_count || 0} Perangkat
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleEditCondition(c)}
                                    title="Edit Kondisi"
                                    className="btn-secondary"
                                    style={{ padding: '5px 8px' }}
                                  >
                                    <Edit size={13} color="var(--status-info)" />
                                  </button>
                                  {c.is_default === 1 ? (
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                                        color: '#94A3B8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '11px',
                                        padding: '4px 7px',
                                      }}
                                      title="Status bawaan sistem tidak dapat dihapus demi integritas data"
                                    >
                                      <Lock size={11} /> Bawaan
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleDeleteConditionMaster(c)}
                                      title={(c.device_count || 0) > 0 ? `Tidak dapat dihapus karena digunakan oleh ${c.device_count} perangkat` : 'Hapus Status Kondisi'}
                                      className="btn-secondary"
                                      style={{
                                        padding: '5px 8px',
                                        opacity: (c.device_count || 0) > 0 ? 0.45 : 1,
                                        cursor: (c.device_count || 0) > 0 ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      <Trash2 size={13} color="var(--status-danger)" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
