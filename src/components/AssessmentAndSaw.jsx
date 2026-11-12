import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ClipboardList,
  BarChart3,
  Table as TableIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Shield,
  Search,
  Eye,
  Sliders,
  Award,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  FileCheck
} from 'lucide-react';

// Format currency Rupiah
const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const AssessmentAndSaw = ({ defaultTab = 'assessments' }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeknisi = user?.role === 'teknisi';
  const isPimpinan = user?.role === 'pimpinan';

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // General State: Periods & Criteria
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [scaleGuides, setScaleGuides] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Tab 1: Assessments State
  const [assessments, setAssessments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [searchDeviceQuery, setSearchDeviceQuery] = useState('');
  const [assessmentFilterStatus, setAssessmentFilterStatus] = useState('all');

  // Active Assessment Form State
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [assessmentScores, setAssessmentScores] = useState({});
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [damageNotes, setDamageNotes] = useState('');
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  // Tab 2 & 3: SAW Calculation & Results State
  const [sawRuns, setSawRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [currentRunDetail, setCurrentRunDetail] = useState(null);
  const [loadingRunDetail, setLoadingRunDetail] = useState(false);
  const [executingSaw, setExecutingSaw] = useState(false);
  const [sawFeedback, setSawFeedback] = useState(null);
  const [detailModalDevice, setDetailModalDevice] = useState(null);

  // 1. Fetch initial configurations (periods, criteria, scales)
  const fetchConfigurations = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const [resPeriods, resCrit, resScales] = await Promise.all([
        fetch('/api/v1/assessment-periods', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/criteria', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/assessment-scales', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resPeriods.ok) {
        const pData = await resPeriods.json();
        const pList = Array.isArray(pData.data) ? pData.data : (pData.data?.items || []);
        setPeriods(pList);
        // Default to active period
        const active = pList.find((p) => p.is_active === 1) || pList[0];
        if (active) setSelectedPeriodId(active.id);
      }

      if (resCrit.ok) {
        const cData = await resCrit.json();
        const cList = Array.isArray(cData.data) ? cData.data : (cData.data?.items || []);
        setCriteria(cList);
      }

      if (resScales.ok) {
        const sData = await resScales.json();
        const sList = Array.isArray(sData.data) ? sData.data : (sData.data?.items || []);
        setScaleGuides(sList);
      }
    } catch (err) {
      console.error('Failed to load configurations:', err);
    } finally {
      setLoadingConfig(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // 2. Fetch Devices & Assessments for selected period
  const fetchPeriodData = useCallback(async () => {
    if (!selectedPeriodId) return;
    setLoadingAssessments(true);
    try {
      const [resDev, resAss] = await Promise.all([
        fetch('/api/v1/devices?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/v1/assessments?period_id=${selectedPeriodId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resDev.ok) {
        const dData = await resDev.json();
        const devList = Array.isArray(dData.data) ? dData.data : (dData.data?.items || []);
        setDevices(devList);
      }

      if (resAss.ok) {
        const aData = await resAss.json();
        const assList = Array.isArray(aData.data) ? aData.data : (aData.data?.items || []);
        setAssessments(assList);
      }
    } catch (err) {
      console.error('Failed to load period data:', err);
    } finally {
      setLoadingAssessments(false);
    }
  }, [token, selectedPeriodId]);

  useEffect(() => {
    fetchPeriodData();
  }, [fetchPeriodData]);

  // 3. Fetch SAW Runs for selected period
  const fetchSawRuns = useCallback(async () => {
    if (!selectedPeriodId) return;
    try {
      const res = await fetch(`/api/v1/saw-runs?period_id=${selectedPeriodId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const runs = json.data || [];
        setSawRuns(runs);
        if (runs.length > 0) {
          setSelectedRunId((prev) => (runs.some((r) => r.id === prev) ? prev : runs[0].id));
        } else {
          setSelectedRunId(null);
          setCurrentRunDetail(null);
        }
      }
    } catch (err) {
      console.error('Failed to load SAW runs:', err);
    }
  }, [token, selectedPeriodId]);

  useEffect(() => {
    fetchSawRuns();
  }, [fetchSawRuns]);

  // 4. Fetch Selected Run Detail
  const fetchRunDetail = useCallback(async (runId) => {
    if (!runId) return;
    setLoadingRunDetail(true);
    try {
      const res = await fetch(`/api/v1/saw-runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setCurrentRunDetail(json.data);
      }
    } catch (err) {
      console.error('Failed to load run detail:', err);
    } finally {
      setLoadingRunDetail(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedRunId) {
      fetchRunDetail(selectedRunId);
    }
  }, [selectedRunId, fetchRunDetail]);

  // Select device to assess
  const handleSelectDevice = (dev) => {
    setSelectedDeviceId(dev.id);
    setFormFeedback(null);

    // Find existing assessment
    const existing = assessments.find((a) => a.device_id === dev.id);
    if (existing) {
      setActiveAssessment(existing);
      setAssessmentDate(existing.assessment_date ? existing.assessment_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setDamageNotes(existing.damage_notes || '');

      const sMap = {};
      criteria.forEach((c) => {
        const val = existing.scores?.[c.criterion_key]?.value;
        sMap[c.id] = val !== undefined ? val : (c.input_type === 'currency_idr' ? 0 : 3);
      });
      setAssessmentScores(sMap);
    } else {
      setActiveAssessment(null);
      setAssessmentDate(new Date().toISOString().slice(0, 10));
      setDamageNotes('');

      // Default scores: 3 for scale_1_5, 0 for currency
      const sMap = {};
      criteria.forEach((c) => {
        sMap[c.id] = c.input_type === 'currency_idr' ? 0 : 3;
      });
      setAssessmentScores(sMap);
    }
  };

  // Save Assessment (Draft or Submitted)
  const handleSaveAssessment = async (targetStatus) => {
    if (!selectedDeviceId) return;
    setSavingAssessment(true);
    setFormFeedback(null);

    try {
      const payload = {
        device_id: selectedDeviceId,
        period_id: selectedPeriodId,
        assessment_date: assessmentDate,
        damage_notes: damageNotes,
        status: targetStatus,
        scores: criteria.map((c) => ({
          criterion_id: c.id,
          numeric_value: assessmentScores[c.id] ?? 0,
        })),
      };

      if (activeAssessment?.id) {
        payload.id = activeAssessment.id;
      }

      const res = await fetch('/api/v1/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal menyimpan penilaian');
      }

      setFormFeedback({
        type: 'success',
        message: targetStatus === 'submitted'
          ? 'Penilaian berhasil dikirim dan siap untuk dimasukkan dalam kalkulasi SAW.'
          : 'Draft penilaian berhasil disimpan.',
      });

      // Refresh list
      await fetchPeriodData();
    } catch (err) {
      setFormFeedback({
        type: 'danger',
        message: err.message,
      });
    } finally {
      setSavingAssessment(false);
    }
  };

  // Execute SAW Run (Admin only)
  const handleExecuteSaw = async () => {
    if (!isAdmin) return;
    setExecutingSaw(true);
    setSawFeedback(null);

    try {
      const res = await fetch('/api/v1/saw-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ period_id: selectedPeriodId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal menjalankan kalkulasi SAW');
      }

      setSawFeedback({
        type: 'success',
        message: `Kalkulasi SAW berhasil dijalankan untuk ${json.data.device_count} perangkat! Peringkat telah diperbarui secara otomatis.`,
      });

      await fetchSawRuns();
      if (json.data?.id) {
        setSelectedRunId(json.data.id);
      }
    } catch (err) {
      setSawFeedback({
        type: 'danger',
        message: err.message,
      });
    } finally {
      setExecutingSaw(false);
    }
  };

  // Devices enriched with their assessment status
  const enrichedDevices = useMemo(() => {
    if (!Array.isArray(devices)) return [];
    const assList = Array.isArray(assessments) ? assessments : [];
    return devices.map((d) => {
      const ass = assList.find((a) => a.device_id === d.id);
      let statusKey = 'unassessed';
      let statusLabel = 'Belum Dinilai';
      let badgeClass = 'badge-warning';

      if (ass) {
        if (ass.status === 'assessed') {
          statusKey = 'assessed';
          statusLabel = 'Selesai Dihitung';
          badgeClass = 'badge-success';
        } else if (ass.status === 'submitted') {
          statusKey = 'submitted';
          statusLabel = 'Siap SAW';
          badgeClass = 'badge-info';
        } else {
          statusKey = 'draft';
          statusLabel = 'Draft';
          badgeClass = 'badge-warning';
        }
      }

      return {
        ...d,
        assessment: ass,
        statusKey,
        statusLabel,
        badgeClass,
      };
    });
  }, [devices, assessments]);

  // Filtered devices for list
  const filteredDevices = useMemo(() => {
    if (!Array.isArray(enrichedDevices)) return [];
    return enrichedDevices.filter((d) => {
      const matchSearch =
        (d.name || '').toLowerCase().includes((searchDeviceQuery || '').toLowerCase()) ||
        (d.code || '').toLowerCase().includes((searchDeviceQuery || '').toLowerCase()) ||
        (d.category_name && d.category_name.toLowerCase().includes((searchDeviceQuery || '').toLowerCase()));

      const matchStatus =
        assessmentFilterStatus === 'all' || d.statusKey === assessmentFilterStatus;

      return matchSearch && matchStatus;
    });
  }, [enrichedDevices, searchDeviceQuery, assessmentFilterStatus]);

  // Statistics for current SAW run
  const runStats = useMemo(() => {
    if (!currentRunDetail?.results || !Array.isArray(currentRunDetail.results)) {
      return { total: 0, tinggi: 0, sedang: 0, rendah: 0, upgrade: 0 };
    }
    const results = currentRunDetail.results;
    return {
      total: results.length,
      tinggi: results.filter((r) => r.priority_band === 'Tinggi').length,
      sedang: results.filter((r) => r.priority_band === 'Sedang').length,
      rendah: results.filter((r) => r.priority_band === 'Rendah').length,
      upgrade: results.filter((r) => (r.recommendation || '').includes('Upgrade')).length,
    };
  }, [currentRunDetail]);

  const activePeriod = Array.isArray(periods) ? periods.find((p) => p.id === parseInt(selectedPeriodId, 10)) : null;
  const selectedDevice = Array.isArray(devices) ? devices.find((d) => d.id === selectedDeviceId) : null;

  // Group scale guides by criterion_id
  const scalesByCrit = useMemo(() => {
    const map = {};
    if (Array.isArray(scaleGuides)) {
      scaleGuides.forEach((g) => {
        if (!map[g.criterion_id]) map[g.criterion_id] = [];
        map[g.criterion_id].push(g);
      });
      // Sort scores ascending
      Object.keys(map).forEach((k) => {
        map[k].sort((a, b) => a.score - b.score);
      });
    }
    return map;
  }, [scaleGuides]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Period Selection Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '18px 24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={22} color="var(--brand-forest)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Penilaian &amp; Perhitungan SAW
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
            Penilaian kondisi perangkat dan kalkulasi peringkat kelayakan metode SAW.
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Periode Penilaian:
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="input-select"
            style={{ minWidth: '220px', padding: '7px 12px', fontSize: '13px' }}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_active ? '(Aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-soft)',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('assessments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'assessments' ? '3px solid var(--electric-blue)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'assessments' ? 'var(--electric-blue)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ClipboardList size={16} />
          <span>Form Penilaian Perangkat</span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: 'var(--electric-blue-light)',
              color: 'var(--electric-blue)',
            }}
          >
            {enrichedDevices.filter((d) => d.statusKey !== 'unassessed').length} / {devices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('saw-results')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'saw-results' ? '3px solid var(--electric-blue)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'saw-results' ? 'var(--electric-blue)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart3 size={16} />
          <span>Hasil & Peringkat SAW</span>
          {sawRuns.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success)',
              }}
            >
              {sawRuns.length} Run
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matrices')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'matrices' ? '3px solid var(--electric-blue)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'matrices' ? 'var(--electric-blue)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <TableIcon size={16} />
          <span>Matriks Keputusan (X & R)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORM PENILAIAN PERANGKAT (Teknisi & Admin)                         */}
      {/* ========================================================================= */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Device Selector List */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Daftar Perangkat Lab
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                {filteredDevices.length} Perangkat
              </span>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-gray-green)' }} />
                <input
                  type="text"
                  placeholder="Cari kode atau nama..."
                  value={searchDeviceQuery}
                  onChange={(e) => setSearchDeviceQuery(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '32px', fontSize: '12px', width: '100%' }}
                />
              </div>

              <select
                value={assessmentFilterStatus}
                onChange={(e) => setAssessmentFilterStatus(e.target.value)}
                className="input-select"
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <option value="all">Semua Status Penilaian</option>
                <option value="unassessed">Belum Dinilai</option>
                <option value="draft">Draft</option>
                <option value="submitted">Siap SAW (Submitted)</option>
                <option value="assessed">Selesai Dihitung</option>
              </select>
            </div>

            {/* Device Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '620px', overflowY: 'auto' }}>
              {loadingAssessments ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-gray-green)', fontSize: '13px' }}>
                  Memuat daftar perangkat...
                </div>
              ) : filteredDevices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-gray-green)', fontSize: '13px' }}>
                  Tidak ada perangkat yang sesuai filter.
                </div>
              ) : (
                filteredDevices.map((dev) => {
                  const isSelected = dev.id === selectedDeviceId;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => handleSelectDevice(dev)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-input)',
                        border: isSelected ? '2px solid var(--brand-forest)' : '1px solid var(--border-soft)',
                        backgroundColor: isSelected ? 'var(--surface-sage)' : 'var(--base-white)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-forest)' }}>
                          {dev.code}
                        </span>
                        <span className={`badge ${dev.badgeClass}`} style={{ fontSize: '10px' }}>
                          {dev.statusLabel}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {dev.name}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', display: 'flex', gap: '8px' }}>
                        <span>{dev.category_name || 'Kategori Umum'}</span>
                        <span>•</span>
                        <span>{dev.location_name || 'Lab Komputer'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Assessment Form for Selected Device */}
          <div className="card" style={{ padding: '24px' }}>
            {!selectedDevice ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-gray-green)' }}>
                <ClipboardList size={40} color="var(--brand-forest)" style={{ opacity: 0.4, marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Pilih Perangkat di Panel Kiri
                </h3>
                <p style={{ fontSize: '13px', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                  Klik salah satu perangkat di sebelah kiri untuk mengisi atau memperbarui 7 kriteria penilaian teknisi.
                </p>
              </div>
            ) : (
              <div>
                {/* Device Summary Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-soft)',
                    marginBottom: '20px',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-forest)' }}>
                        {selectedDevice.code}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        — {selectedDevice.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
                      {selectedDevice.brand || 'Tanpa Merek'} {selectedDevice.model || ''} | Lokasi: {selectedDevice.location_name} | Kondisi Terkini: <strong>{selectedDevice.condition_status}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Tanggal Penilaian:
                    </label>
                    <input
                      type="date"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      disabled={isPimpinan}
                      className="input-text"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                </div>

                {/* Feedback Alert */}
                {formFeedback && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-input)',
                      marginBottom: '20px',
                      backgroundColor: formFeedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                      border: `1px solid ${formFeedback.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
                      color: formFeedback.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {formFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{formFeedback.message}</span>
                  </div>
                )}

                {/* Scoring Fields for Criteria C1 to C7 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
                  {criteria.map((c) => {
                    const currentVal = assessmentScores[c.id] ?? (c.input_type === 'currency_idr' ? 0 : 3);
                    const critScales = scalesByCrit[c.id] || [];

                    return (
                      <div
                        key={c.id}
                        style={{
                          backgroundColor: 'var(--canvas-soft)',
                          border: '1px solid var(--border-soft)',
                          borderRadius: 'var(--radius-input)',
                          padding: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                backgroundColor: 'var(--brand-forest)',
                                color: 'var(--base-white)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {c.criterion_key}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {c.name}
                            </span>
                            <span
                              className={`badge ${c.attribute_type === 'benefit' ? 'badge-info' : 'badge-warning'}`}
                              style={{ fontSize: '10px' }}
                            >
                              {c.attribute_type.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                            Bobot: <strong>{(parseFloat(c.weight) * 100).toFixed(0)}%</strong> ({c.weight})
                          </div>
                        </div>

                        {/* Input Type: Currency IDR for C4 */}
                        {c.input_type === 'currency_idr' ? (
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Rp
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="10000"
                                value={currentVal}
                                onChange={(e) =>
                                  setAssessmentScores({
                                    ...assessmentScores,
                                    [c.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={isPimpinan}
                                className="input-text"
                                style={{ fontSize: '13px', width: '100%' }}
                              />
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '6px' }}>
                              Terbaca: <strong>{formatRupiah(currentVal)}</strong>. Sesuai PRD 6.2, jika biaya Rp 0 (tidak ada biaya), normalisasi cost otomatis bernilai 1,0.
                            </div>
                          </div>
                        ) : (
                          /* Input Type: Scale 1 to 5 with live rubric guides */
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                              {[1, 2, 3, 4, 5].map((scoreNum) => {
                                const guide = critScales.find((g) => g.score === scoreNum);
                                const isSelected = currentVal === scoreNum;

                                return (
                                  <button
                                    key={scoreNum}
                                    type="button"
                                    onClick={() =>
                                      !isPimpinan &&
                                      setAssessmentScores({
                                        ...assessmentScores,
                                        [c.id]: scoreNum,
                                      })
                                    }
                                    disabled={isPimpinan}
                                    style={{
                                      padding: '8px 6px',
                                      borderRadius: '6px',
                                      border: isSelected ? '2px solid var(--brand-forest)' : '1px solid var(--border-soft)',
                                      backgroundColor: isSelected ? 'var(--surface-sage)' : 'var(--base-white)',
                                      textAlign: 'center',
                                      cursor: isPimpinan ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: isSelected ? 'var(--brand-forest)' : 'var(--text-primary)',
                                      }}
                                    >
                                      Skor {scoreNum}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: isSelected ? 'var(--brand-forest)' : 'var(--text-gray-green)',
                                        marginTop: '2px',
                                        lineHeight: 1.2,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                      title={guide?.label || ''}
                                    >
                                      {guide?.label || `Skala ${scoreNum}`}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Damage Notes */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Catatan Kerusakan & Hasil Pemeriksaan Fisik:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsikan kondisi fisik, keluhan teknisi, atau suku cadang yang rusak..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    disabled={isPimpinan}
                    className="input-textarea"
                    style={{ fontSize: '13px', width: '100%' }}
                  />
                </div>

                {/* Action Buttons */}
                {!isPimpinan ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveAssessment('draft')}
                      disabled={savingAssessment}
                      className="btn-secondary"
                      style={{ fontSize: '13px', padding: '9px 18px' }}
                    >
                      <RotateCcw size={14} />
                      Simpan Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAssessment('submitted')}
                      disabled={savingAssessment}
                      className="btn-primary"
                      style={{ fontSize: '13px', padding: '9px 20px' }}
                    >
                      <CheckCircle2 size={15} />
                      Kirim Penilaian (Siap SAW)
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--surface-sage)',
                      borderRadius: 'var(--radius-input)',
                      fontSize: '12px',
                      color: 'var(--brand-forest)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Shield size={16} />
                    <span>Akses peninjauan (View-Only). Penilaian diinput oleh Teknisi atau Admin.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HASIL KALKULASI & PERINGKAT SAW                                    */}
      {/* ========================================================================= */}
      {activeTab === 'saw-results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Control Banner */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: 'var(--base-white)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="var(--brand-forest)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Kalkulasi &amp; Riwayat Peringkat SAW
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
                Periode: <strong>{activePeriod?.name || 'Periode Aktif'}</strong> • Perangkat siap dihitung:{' '}
                <strong>{enrichedDevices.filter((d) => d.statusKey === 'submitted' || d.statusKey === 'assessed').length} Perangkat</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Historical Run Selector */}
              {sawRuns.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="var(--text-gray-green)" />
                  <select
                    value={selectedRunId || ''}
                    onChange={(e) => setSelectedRunId(parseInt(e.target.value, 10))}
                    className="input-select"
                    style={{ fontSize: '12px', padding: '7px 12px' }}
                  >
                    {sawRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        Run #{r.id} ({new Date(r.run_at).toLocaleDateString('id-ID')} {new Date(r.run_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}) — {r.device_count} Perangkat
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Run SAW Button (Admin only) */}
              {isAdmin ? (
                <button
                  onClick={handleExecuteSaw}
                  disabled={executingSaw}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '9px 18px' }}
                >
                  <Play size={15} />
                  {executingSaw ? 'Menghitung SAW...' : 'Jalankan Kalkulasi SAW'}
                </button>
              ) : (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-gray-green)',
                    backgroundColor: 'var(--surface-sage)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shield size={14} color="var(--brand-forest)" />
                  <span>Kalkulasi dijalankan oleh Administrator</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Alert */}
          {sawFeedback && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-input)',
                backgroundColor: sawFeedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${sawFeedback.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
                color: sawFeedback.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {sawFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{sawFeedback.message}</span>
            </div>
          )}

          {/* KPI Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>
                Total Perangkat Dievaluasi
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {runStats.total}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-forest)', marginTop: '2px' }}>
                Run #{currentRunDetail?.id || '-'}
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--status-danger)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>
                Prioritas Tinggi (V &ge; 0.70)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-danger)', marginTop: '4px' }}>
                {runStats.tinggi}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                Perlu perbaikan segera
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--status-warning)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>
                Prioritas Sedang (0.40 - 0.69)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '4px' }}>
                {runStats.sedang}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                Perbaikan terjadwal
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--brand-forest)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>
                Prioritas Rendah (V &le; 0.39)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-forest)', marginTop: '4px' }}>
                {runStats.rendah}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                Pantau rutin / layak pakai
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>
                Kandidat Upgrade
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6', marginTop: '4px' }}>
                {runStats.upgrade}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                Rule 1 (C7 &le; 2 atau C1 &ge; 4 &amp; C6 &le; 2)
              </div>
            </div>
          </div>

          {/* Ranking & Evaluation Table */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tabel Peringkat Kelayakan Rekomendasi
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                Diurutkan berdasarkan Nilai Preferensi (V) Tertinggi secara Deterministik
              </span>
            </div>

            {loadingRunDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
                Memuat rincian hasil kalkulasi...
              </div>
            ) : !currentRunDetail?.results || currentRunDetail.results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-gray-green)' }}>
                <TrendingUp size={36} color="var(--brand-forest)" style={{ opacity: 0.4, marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Belum Ada Hasil Kalkulasi untuk Periode Ini
                </h4>
                <p style={{ fontSize: '13px', maxWidth: '440px', margin: '4px auto 16px auto' }}>
                  {isAdmin
                    ? 'Pastikan teknisi telah mengirim penilaian perangkat, lalu klik "Jalankan Kalkulasi SAW" di atas.'
                    : 'Administrator belum menjalankan kalkulasi SAW untuk periode ini.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
                      <th>Perangkat</th>
                      <th>Kategori &amp; Lokasi</th>
                      <th style={{ textAlign: 'center' }}>Nilai Preferensi (V)</th>
                      <th style={{ textAlign: 'center' }}>Kategori Prioritas</th>
                      <th>Rekomendasi Otomatis</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunDetail.results.map((r) => {
                      const isTopRank = r.rank_position === 1;
                      let bandBadgeClass = 'badge-success';
                      if (r.priority_band === 'Tinggi') bandBadgeClass = 'badge-danger';
                      if (r.priority_band === 'Sedang') bandBadgeClass = 'badge-warning';

                      return (
                        <tr
                          key={r.id}
                          style={{
                            backgroundColor: isTopRank ? 'rgba(32, 91, 67, 0.04)' : undefined,
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '28px',
                                height: '28px',
                                lineHeight: '28px',
                                borderRadius: '50%',
                                backgroundColor: isTopRank ? 'var(--brand-forest)' : 'var(--canvas-soft)',
                                color: isTopRank ? 'var(--base-white)' : 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '12px',
                              }}
                            >
                              {r.rank_position}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--brand-forest)' }}>{r.device_code}</strong>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.device_name}</div>
                          </td>
                          <td>
                            <div>{r.category_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>{r.location_name}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                              {parseFloat(r.preference_value).toFixed(6)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>
                              Display: <strong>{r.display_score}</strong>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${bandBadgeClass}`} style={{ fontSize: '11px' }}>
                              {r.priority_band}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {r.recommendation}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', maxWidth: '300px' }}>
                              {r.recommendation_reason}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => setDetailModalDevice(r)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              title="Lihat Detail Matriks & Perhitungan"
                            >
                              <Eye size={13} />
                              Rincian
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MATRIKS KEPUTUSAN AWAL (X) & TERNORMALISASI (R)                    */}
      {/* ========================================================================= */}
      {activeTab === 'matrices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Matriks Keputusan X */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileSpreadsheet size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Matriks Keputusan Awal (X)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginBottom: '14px' }}>
              Nilai asli hasil pemeriksaan teknisi untuk setiap kriteria (x_ij). C1–C3, C5–C7 bertipe <strong>Benefit</strong> (maksimasi), sedangkan C4 bertipe <strong>Cost</strong> (minimasi biaya).
            </p>

            {!currentRunDetail?.results ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray-green)' }}>
                Jalankan atau pilih riwayat kalkulasi pada tab "Hasil &amp; Peringkat SAW" untuk melihat matriks.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Kode Perangkat</th>
                      <th>Nama Perangkat</th>
                      {criteria.map((c) => (
                        <th key={c.id} style={{ textAlign: 'right' }}>
                          {c.criterion_key}
                          <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-gray-green)' }}>
                            ({c.attribute_type})
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunDetail.results.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.device_code}</strong></td>
                        <td>{r.device_name}</td>
                        {criteria.map((c) => {
                          const val = r.raw_scores?.[c.criterion_key];
                          return (
                            <td key={c.id} style={{ textAlign: 'right', fontWeight: 600 }}>
                              {c.input_type === 'currency_idr' ? formatRupiah(val) : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Matriks Ternormalisasi R */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Matriks Ternormalisasi (R) &amp; Perhitungan Preferensi (V)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginBottom: '14px' }}>
              Hasil normalisasi kriteria benefit &amp; cost serta perolehan total nilai preferensi (V).
            </p>

            {!currentRunDetail?.results ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray-green)' }}>
                Matriks ternormalisasi belum tersedia.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Kode Perangkat</th>
                      {criteria.map((c) => (
                        <th key={c.id} style={{ textAlign: 'right' }}>
                          r({c.criterion_key})
                          <span style={{ fontSize: '10px', display: 'block', color: 'var(--brand-forest)' }}>
                            w = {c.weight}
                          </span>
                        </th>
                      ))}
                      <th style={{ textAlign: 'right', backgroundColor: 'var(--surface-sage)' }}>
                        Nilai V (Total)
                      </th>
                      <th style={{ textAlign: 'center' }}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunDetail.results.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.device_code}</strong></td>
                        {criteria.map((c) => {
                          const normVal = r.normalized_values?.[c.criterion_key] ?? 0;
                          return (
                            <td key={c.id} style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {normVal.toFixed(4)}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--surface-sage)',
                            color: 'var(--brand-forest)',
                          }}
                        >
                          {parseFloat(r.preference_value).toFixed(6)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          #{r.rank_position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PERHITUNGAN PERANGKAT (Formula Breakdown)                    */}
      {/* ========================================================================= */}
      {detailModalDevice && (
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Rincian Matematis SAW — {detailModalDevice.device_code}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                  {detailModalDevice.device_name} • Peringkat #{detailModalDevice.rank_position}
                </div>
              </div>
              <button
                onClick={() => setDetailModalDevice(null)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Tutup
              </button>
            </div>

            {/* Scores & Weights Breakdown Table */}
            <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
              <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Kriteria</th>
                    <th>Tipe</th>
                    <th style={{ textAlign: 'right' }}>Nilai Asli (x)</th>
                    <th style={{ textAlign: 'right' }}>Normalisasi (r)</th>
                    <th style={{ textAlign: 'right' }}>Bobot (w)</th>
                    <th style={{ textAlign: 'right' }}>w × r</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => {
                    const raw = detailModalDevice.raw_scores?.[c.criterion_key] ?? 0;
                    const norm = detailModalDevice.normalized_values?.[c.criterion_key] ?? 0;
                    const w = parseFloat(c.weight);
                    const product = w * norm;

                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.criterion_key}</strong> — {c.name}
                        </td>
                        <td>
                          <span className={`badge ${c.attribute_type === 'benefit' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                            {c.attribute_type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {c.input_type === 'currency_idr' ? formatRupiah(raw) : raw}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          {norm.toFixed(4)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          {w.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: 'var(--brand-forest)' }}>
                          {product.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: 'var(--surface-sage)', fontWeight: 700 }}>
                    <td colSpan={5}>Total Nilai Preferensi (V)</td>
                    <td style={{ textAlign: 'right', color: 'var(--brand-forest)', fontFamily: 'monospace', fontSize: '13px' }}>
                      {parseFloat(detailModalDevice.preference_value).toFixed(6)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rationale & Rules Explanation */}
            <div
              style={{
                backgroundColor: 'var(--canvas-soft)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-input)',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Hasil Rekomendasi: {detailModalDevice.recommendation}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', lineHeight: 1.5 }}>
                {detailModalDevice.recommendation_reason}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--brand-forest)', marginTop: '8px', fontWeight: 600 }}>
                Kategori Prioritas: {detailModalDevice.priority_band} (Display: {detailModalDevice.display_score})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
