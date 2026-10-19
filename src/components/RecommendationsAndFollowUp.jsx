import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Lightbulb,
  History,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Check,
  X,
  UserCheck,
  Wrench,
  ArrowRight,
  Shield,
  Plus,
  Edit3,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const RecommendationsAndFollowUp = ({ defaultTab = 'recommendations' }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isPimpinan = user?.role === 'pimpinan';
  const isTeknisi = user?.role === 'teknisi';

  const [activeTab, setActiveTab] = useState(defaultTab);

  // Common state: Periods & Users (Technicians)
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [technicians, setTechnicians] = useState([]);

  // Tab 1: Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [filterDecisionStatus, setFilterDecisionStatus] = useState('all');
  const [filterPriorityBand, setFilterPriorityBand] = useState('all');
  const [searchRecQuery, setSearchRecQuery] = useState('');
  const [decisionModalItem, setDecisionModalItem] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    decision_status: 'approved',
    decision_note: '',
    create_follow_up: true,
    action_type: 'repair',
    handler_id: '',
    estimated_cost: 0,
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  // Tab 2: Repair History state
  const [repairHistory, setRepairHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterHistoryStatus, setFilterHistoryStatus] = useState('all');
  const [filterActionType, setFilterActionType] = useState('all');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [editHistoryModalItem, setEditHistoryModalItem] = useState(null);
  const [editHistoryForm, setEditHistoryForm] = useState({
    status: 'in_progress',
    action_taken: '',
    actual_cost: '',
    handler_id: '',
    new_condition_status: 'baik',
  });
  const [submittingHistoryUpdate, setSubmittingHistoryUpdate] = useState(false);
  const [historyFeedback, setHistoryFeedback] = useState(null);

  // Manual new repair task modal state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [devicesList, setDevicesList] = useState([]);
  const [newTaskForm, setNewTaskForm] = useState({
    device_id: '',
    action_type: 'repair',
    problem_description: '',
    estimated_cost: 0,
    status: 'planned',
    handler_id: '',
  });
  const [submittingNewTask, setSubmittingNewTask] = useState(false);

  // Tab 3: Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // 1. Fetch periods & technicians
  const fetchInitialData = useCallback(async () => {
    try {
      const [resPeriods, resDevs] = await Promise.all([
        fetch('/api/v1/assessment-periods', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/devices?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resPeriods.ok) {
        const pData = await resPeriods.json();
        const pList = pData.data || [];
        setPeriods(pList);
        const active = pList.find((p) => p.is_active === 1) || pList[0];
        if (active) setSelectedPeriodId(active.id);
      }

      if (resDevs.ok) {
        const dData = await resDevs.json();
        const dList = Array.isArray(dData.data) ? dData.data : (dData.data?.items || []);
        setDevicesList(dList);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. Fetch Recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!selectedPeriodId) return;
    setLoadingRecs(true);
    try {
      const res = await fetch(`/api/v1/recommendations?period_id=${selectedPeriodId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [token, selectedPeriodId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // 3. Fetch Repair History
  const fetchRepairHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/v1/repair-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRepairHistory(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load repair history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRepairHistory();
  }, [fetchRepairHistory]);

  // 4. Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data?.items || []);
        setUnreadNotifCount(json.data?.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filtered Recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      const matchSearch =
        r.device_code.toLowerCase().includes(searchRecQuery.toLowerCase()) ||
        r.device_name.toLowerCase().includes(searchRecQuery.toLowerCase()) ||
        (r.recommendation && r.recommendation.toLowerCase().includes(searchRecQuery.toLowerCase()));

      const matchStatus =
        filterDecisionStatus === 'all' || r.decision_status === filterDecisionStatus;

      const matchBand =
        filterPriorityBand === 'all' || r.priority_band === filterPriorityBand;

      return matchSearch && matchStatus && matchBand;
    });
  }, [recommendations, searchRecQuery, filterDecisionStatus, filterPriorityBand]);

  // Recommendation KPIs
  const recStats = useMemo(() => {
    return {
      total: recommendations.length,
      pending: recommendations.filter((r) => r.decision_status === 'pending').length,
      approved: recommendations.filter((r) => r.decision_status === 'approved').length,
      rejected: recommendations.filter((r) => r.decision_status === 'rejected').length,
      deferred: recommendations.filter((r) => r.decision_status === 'deferred').length,
    };
  }, [recommendations]);

  // Filtered Repair History
  const filteredHistory = useMemo(() => {
    return repairHistory.filter((h) => {
      const matchSearch =
        h.device_code.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
        h.device_name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
        h.problem_description.toLowerCase().includes(searchHistoryQuery.toLowerCase());

      const matchStatus =
        filterHistoryStatus === 'all' || h.status === filterHistoryStatus;

      const matchAction =
        filterActionType === 'all' || h.action_type === filterActionType;

      return matchSearch && matchStatus && matchAction;
    });
  }, [repairHistory, searchHistoryQuery, filterHistoryStatus, filterActionType]);

  // Open Decision Modal
  const handleOpenDecisionModal = (item) => {
    setDecisionModalItem(item);
    setDecisionFeedback(null);

    let defaultAction = 'repair';
    if (item.recommendation.toLowerCase().includes('upgrade')) {
      defaultAction = 'upgrade';
    } else if (item.recommendation.toLowerCase().includes('pemeriksaan')) {
      defaultAction = 'inspection';
    }

    setDecisionForm({
      decision_status: item.decision_status === 'pending' ? 'approved' : item.decision_status,
      decision_note: item.decision_note || '',
      create_follow_up: true,
      action_type: defaultAction,
      handler_id: '',
      estimated_cost: 0,
    });
  };

  // Submit Decision
  const handleSubmitDecision = async () => {
    if (!decisionModalItem) return;
    setSubmittingDecision(true);
    setDecisionFeedback(null);

    try {
      const res = await fetch(`/api/v1/recommendations/${decisionModalItem.id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(decisionForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal menyimpan keputusan');
      }

      setDecisionFeedback({
        type: 'success',
        message: `Keputusan untuk ${decisionModalItem.device_code} berhasil disimpan (${decisionForm.decision_status.toUpperCase()}).`,
      });

      // Refresh data
      await fetchRecommendations();
      await fetchRepairHistory();
      await fetchNotifications();

      setTimeout(() => {
        setDecisionModalItem(null);
      }, 900);
    } catch (err) {
      setDecisionFeedback({
        type: 'danger',
        message: err.message,
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Open Edit History Modal
  const handleOpenEditHistory = (h) => {
    setEditHistoryModalItem(h);
    setHistoryFeedback(null);
    setEditHistoryForm({
      status: h.status,
      action_taken: h.action_taken || '',
      actual_cost: h.actual_cost !== null ? h.actual_cost : h.estimated_cost || '',
      handler_id: h.handler_id || '',
      new_condition_status: 'baik',
    });
  };

  // Submit History Update
  const handleSubmitHistoryUpdate = async () => {
    if (!editHistoryModalItem) return;
    setSubmittingHistoryUpdate(true);
    setHistoryFeedback(null);

    try {
      const res = await fetch(`/api/v1/repair-history/${editHistoryModalItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editHistoryForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal memperbarui status tindak lanjut');
      }

      setHistoryFeedback({
        type: 'success',
        message: `Status tindak lanjut ${editHistoryModalItem.device_code} berhasil diperbarui menjadi ${editHistoryForm.status.toUpperCase()}.`,
      });

      await fetchRepairHistory();

      setTimeout(() => {
        setEditHistoryModalItem(null);
      }, 900);
    } catch (err) {
      setHistoryFeedback({
        type: 'danger',
        message: err.message,
      });
    } finally {
      setSubmittingHistoryUpdate(false);
    }
  };

  // Submit Manual New Task
  const handleSubmitNewTask = async () => {
    setSubmittingNewTask(true);
    setHistoryFeedback(null);

    try {
      const res = await fetch('/api/v1/repair-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTaskForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal membuat tugas baru');
      }

      await fetchRepairHistory();
      setShowNewTaskModal(false);
      setNewTaskForm({
        device_id: '',
        action_type: 'repair',
        problem_description: '',
        estimated_cost: 0,
        status: 'planned',
        handler_id: '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingNewTask(false);
    }
  };

  // Mark notification read
  const handleMarkNotifRead = async (id) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
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
            <Lightbulb size={22} color="var(--brand-forest)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Rekomendasi Keputusan &amp; Tindak Lanjut
            </h2>
            <span className="badge badge-success" style={{ fontSize: '12px' }}>
              Fase 6 Aktif
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '4px' }}>
            Peninjauan dan penetapan keputusan akhir oleh Pimpinan Lab (Setujui, Tolak, Tunda) serta pelacakan riwayat tindak lanjut teknisi.
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
          onClick={() => setActiveTab('recommendations')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'recommendations' ? '3px solid var(--brand-forest)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'recommendations' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Lightbulb size={16} />
          <span>Keputusan Rekomendasi Pimpinan</span>
          {recStats.pending > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: 'var(--status-warning-bg)',
                color: 'var(--status-warning)',
                fontWeight: 700,
              }}
            >
              {recStats.pending} Menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('follow-up')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'follow-up' ? '3px solid var(--brand-forest)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'follow-up' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <History size={16} />
          <span>Riwayat Perbaikan &amp; Upgrade</span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-sage)',
              color: 'var(--brand-forest)',
            }}
          >
            {repairHistory.length} Tugas
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'notifications' ? '3px solid var(--brand-forest)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'notifications' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bell size={16} />
          <span>Notifikasi Lab</span>
          {unreadNotifCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger)',
                fontWeight: 700,
              }}
            >
              {unreadNotifCount} Baru
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KEPUTUSAN REKOMENDASI PIMPINAN                                     */}
      {/* ========================================================================= */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>Total Rekomendasi</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {recStats.total}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>Hasil kalkulasi SAW</div>
            </div>

            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--status-warning)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>Menunggu Keputusan</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '4px' }}>
                {recStats.pending}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>Perlu tinjauan Pimpinan</div>
            </div>

            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--status-success)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>Disetujui (Approved)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-success)', marginTop: '4px' }}>
                {recStats.approved}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>Siap dieksekusi teknisi</div>
            </div>

            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--status-info)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>Ditangguhkan (Deferred)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-info)', marginTop: '4px' }}>
                {recStats.deferred}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>Tunda periode/anggaran</div>
            </div>

            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--status-danger)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', fontWeight: 600 }}>Ditolak (Rejected)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-danger)', marginTop: '4px' }}>
                {recStats.rejected}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>Tidak disetujui tindakan</div>
            </div>
          </div>

          {/* Table & Filter Toolbar */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-gray-green)' }} />
                  <input
                    type="text"
                    placeholder="Cari perangkat atau rekomendasi..."
                    value={searchRecQuery}
                    onChange={(e) => setSearchRecQuery(e.target.value)}
                    className="input-text"
                    style={{ paddingLeft: '32px', fontSize: '12px', width: '100%' }}
                  />
                </div>

                <select
                  value={filterDecisionStatus}
                  onChange={(e) => setFilterDecisionStatus(e.target.value)}
                  className="input-select"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <option value="all">Semua Status Keputusan</option>
                  <option value="pending">Menunggu Keputusan (Pending)</option>
                  <option value="approved">Disetujui (Approved)</option>
                  <option value="deferred">Ditangguhkan (Deferred)</option>
                  <option value="rejected">Ditolak (Rejected)</option>
                </select>

                <select
                  value={filterPriorityBand}
                  onChange={(e) => setFilterPriorityBand(e.target.value)}
                  className="input-select"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="Tinggi">Tinggi (&ge; 0.70)</option>
                  <option value="Sedang">Sedang (0.40 - 0.69)</option>
                  <option value="Rendah">Rendah (&le; 0.39)</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                Menampilkan <strong>{filteredRecs.length}</strong> dari {recommendations.length} rekomendasi
              </div>
            </div>

            {/* Recommendations Table */}
            {loadingRecs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
                Memuat daftar rekomendasi keputusan...
              </div>
            ) : filteredRecs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
                Tidak ada data rekomendasi yang sesuai filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                      <th>Perangkat</th>
                      <th>Prioritas &amp; Skor SAW</th>
                      <th>Rekomendasi Sistem (Aturan PRD 6.5)</th>
                      <th style={{ textAlign: 'center' }}>Status Keputusan</th>
                      <th>Catatan Pimpinan</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecs.map((r) => {
                      let statusBadgeClass = 'badge-warning';
                      let statusText = 'Pending (Menunggu)';
                      if (r.decision_status === 'approved') {
                        statusBadgeClass = 'badge-success';
                        statusText = 'Disetujui';
                      } else if (r.decision_status === 'rejected') {
                        statusBadgeClass = 'badge-danger';
                        statusText = 'Ditolak';
                      } else if (r.decision_status === 'deferred') {
                        statusBadgeClass = 'badge-info';
                        statusText = 'Ditangguhkan';
                      }

                      let bandBadgeClass = 'badge-success';
                      if (r.priority_band === 'Tinggi') bandBadgeClass = 'badge-danger';
                      if (r.priority_band === 'Sedang') bandBadgeClass = 'badge-warning';

                      return (
                        <tr key={r.id}>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            #{r.rank_position}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--brand-forest)' }}>{r.device_code}</strong>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.device_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>
                              {r.category_name} • {r.location_name}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span className={`badge ${bandBadgeClass}`} style={{ fontSize: '11px' }}>
                                {r.priority_band}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                V = {parseFloat(r.preference_value).toFixed(4)}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>
                              Kondisi: {r.condition_status}
                            </div>
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
                            <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '11px' }}>
                              {statusText}
                            </span>
                            {r.decision_by_name && (
                              <div style={{ fontSize: '10px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                                oleh {r.decision_by_name}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', maxWidth: '240px' }}>
                              {r.decision_note || <span style={{ color: 'var(--text-gray-green)', fontStyle: 'italic' }}>Belum ada catatan</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isPimpinan ? (
                              <button
                                onClick={() => handleOpenDecisionModal(r)}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                <UserCheck size={13} />
                                {r.decision_status === 'pending' ? 'Tinjau & Putuskan' : 'Ubah Keputusan'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenDecisionModal(r)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                <ExternalLink size={13} />
                                Rincian
                              </button>
                            )}
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
      {/* TAB 2: RIWAYAT PERBAIKAN & UPGRADE                                        */}
      {/* ========================================================================= */}
      {activeTab === 'follow-up' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Toolbar */}
          <div
            className="card"
            style={{
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-gray-green)' }} />
                <input
                  type="text"
                  placeholder="Cari perangkat, perbaikan..."
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '32px', fontSize: '12px', width: '100%' }}
                />
              </div>

              <select
                value={filterHistoryStatus}
                onChange={(e) => setFilterHistoryStatus(e.target.value)}
                className="input-select"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <option value="all">Semua Status</option>
                <option value="planned">Direncanakan (Planned)</option>
                <option value="in_progress">Sedang Dikerjakan (In Progress)</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>

              <select
                value={filterActionType}
                onChange={(e) => setFilterActionType(e.target.value)}
                className="input-select"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <option value="all">Semua Jenis Tindakan</option>
                <option value="repair">Perbaikan (Repair)</option>
                <option value="upgrade">Upgrade</option>
                <option value="replacement">Penggantian</option>
                <option value="maintenance">Pemeliharaan</option>
                <option value="inspection">Inspeksi</option>
              </select>
            </div>

            {(isAdmin || isTeknisi) && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                <Plus size={15} />
                Catat Tindak Lanjut Baru
              </button>
            )}
          </div>

          {/* Follow-up Tasks Table */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Daftar Tugas Perbaikan &amp; Pemeliharaan Lab
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                {filteredHistory.length} Riwayat Tindak Lanjut
              </span>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
                Memuat riwayat perbaikan...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-gray-green)' }}>
                <History size={36} color="var(--brand-forest)" style={{ opacity: 0.4, marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Belum Ada Tugas Tindak Lanjut
                </h4>
                <p style={{ fontSize: '13px', maxWidth: '440px', margin: '4px auto 0 auto' }}>
                  Tugas tindak lanjut otomatis dibuat saat Pimpinan menyetujui rekomendasi SAW, atau dapat dibuat manual oleh Teknisi/Admin.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID Tugas</th>
                      <th>Perangkat</th>
                      <th>Jenis Tindakan</th>
                      <th>Permasalahan / Instruksi</th>
                      <th>Tindakan Dilakukan</th>
                      <th>Biaya (Estimasi / Riil)</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th>Petugas</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((h) => {
                      let statusBadge = 'badge-warning';
                      let statusLabel = 'Direncanakan';
                      if (h.status === 'in_progress') {
                        statusBadge = 'badge-info';
                        statusLabel = 'Sedang Dikerjakan';
                      } else if (h.status === 'completed') {
                        statusBadge = 'badge-success';
                        statusLabel = 'Selesai';
                      } else if (h.status === 'cancelled') {
                        statusBadge = 'badge-danger';
                        statusLabel = 'Dibatalkan';
                      }

                      return (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 700, color: 'var(--brand-forest)' }}>
                            #{h.id}
                          </td>
                          <td>
                            <strong>{h.device_code}</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{h.device_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>{h.location_name}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--surface-sage)',
                                color: 'var(--brand-forest)',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {h.action_type}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', maxWidth: '280px' }}>
                              {h.problem_description}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                              Dibuka: {new Date(h.opened_at).toLocaleDateString('id-ID')}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', maxWidth: '260px' }}>
                              {h.action_taken || <span style={{ color: 'var(--text-gray-green)', fontStyle: 'italic' }}>Belum ada tindakan</span>}
                            </div>
                            {h.completed_at && (
                              <div style={{ fontSize: '10px', color: 'var(--brand-forest)', marginTop: '2px' }}>
                                Selesai: {new Date(h.completed_at).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              Est: <strong>{formatRupiah(h.estimated_cost)}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: h.actual_cost ? 'var(--brand-forest)' : 'var(--text-gray-green)' }}>
                              Riil: <strong>{h.actual_cost ? formatRupiah(h.actual_cost) : '-'}</strong>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${statusBadge}`} style={{ fontSize: '11px' }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>
                              {h.handler_name || <span style={{ color: 'var(--text-gray-green)', fontWeight: 400 }}>Belum ditugaskan</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {(isAdmin || isTeknisi) ? (
                              <button
                                onClick={() => handleOpenEditHistory(h)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                <Edit3 size={13} />
                                Update
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-gray-green)' }}>View Only</span>
                            )}
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
      {/* TAB 3: PUSAT NOTIFIKASI LAB                                               */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} color="var(--brand-forest)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pemberitahuan &amp; Notifikasi Lab
              </h3>
            </div>
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllNotifsRead}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <CheckCircle2 size={13} />
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          {loadingNotifs ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray-green)' }}>
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-gray-green)' }}>
              <CheckCircle2 size={36} color="var(--brand-forest)" style={{ opacity: 0.4, marginBottom: '10px' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tidak Ada Notifikasi Baru
              </h4>
              <p style={{ fontSize: '13px', maxWidth: '400px', margin: '4px auto 0 auto' }}>
                Semua pemberitahuan dan tugas lab telah Anda tinjau.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkNotifRead(n.id)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-input)',
                      border: isUnread ? '1px solid var(--brand-forest)' : '1px solid var(--border-soft)',
                      backgroundColor: isUnread ? 'rgba(32, 91, 67, 0.04)' : 'var(--base-white)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      cursor: isUnread ? 'pointer' : 'default',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          {n.title}
                        </strong>
                        {isUnread && (
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            Baru
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '6px' }}>
                        {new Date(n.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkNotifRead(n.id);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KEPUTUSAN PIMPINAN                                                  */}
      {/* ========================================================================= */}
      {decisionModalItem && (
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
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="var(--brand-forest)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Keputusan Pimpinan Lab — {decisionModalItem.device_code}
                </h3>
              </div>
              <button onClick={() => setDecisionModalItem(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            {/* Recommendation Context */}
            <div
              style={{
                backgroundColor: 'var(--canvas-soft)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-input)',
                padding: '14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {decisionModalItem.device_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                Prioritas: <strong>{decisionModalItem.priority_band}</strong> (Skor SAW V = {parseFloat(decisionModalItem.preference_value).toFixed(4)})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--brand-forest)', marginTop: '6px', fontWeight: 600 }}>
                Rekomendasi Sistem: {decisionModalItem.recommendation}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                {decisionModalItem.recommendation_reason}
              </div>
            </div>

            {/* Decision Status Buttons */}
            {isPimpinan ? (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Pilih Penetapan Keputusan:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDecisionForm({ ...decisionForm, decision_status: 'approved' })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-input)',
                      border: decisionForm.decision_status === 'approved' ? '2px solid var(--status-success)' : '1px solid var(--border-soft)',
                      backgroundColor: decisionForm.decision_status === 'approved' ? 'var(--status-success-bg)' : 'var(--base-white)',
                      color: decisionForm.decision_status === 'approved' ? 'var(--status-success)' : 'var(--text-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span style={{ fontSize: '12px' }}>Setujui Tindakan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionForm({ ...decisionForm, decision_status: 'deferred' })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-input)',
                      border: decisionForm.decision_status === 'deferred' ? '2px solid var(--status-info)' : '1px solid var(--border-soft)',
                      backgroundColor: decisionForm.decision_status === 'deferred' ? 'var(--status-info-bg)' : 'var(--base-white)',
                      color: decisionForm.decision_status === 'deferred' ? 'var(--status-info)' : 'var(--text-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={18} />
                    <span style={{ fontSize: '12px' }}>Tangguhkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionForm({ ...decisionForm, decision_status: 'rejected' })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-input)',
                      border: decisionForm.decision_status === 'rejected' ? '2px solid var(--status-danger)' : '1px solid var(--border-soft)',
                      backgroundColor: decisionForm.decision_status === 'rejected' ? 'var(--status-danger-bg)' : 'var(--base-white)',
                      color: decisionForm.decision_status === 'rejected' ? 'var(--status-danger)' : 'var(--text-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <XCircle size={18} />
                    <span style={{ fontSize: '12px' }}>Tolak Tindakan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--surface-sage)',
                  borderRadius: 'var(--radius-input)',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: 'var(--brand-forest)',
                }}
              >
                Keputusan saat ini: <strong>{decisionModalItem.decision_status.toUpperCase()}</strong>. Hanya Pimpinan Lab yang berwenang mengubah status keputusan.
              </div>
            )}

            {/* Decision Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Catatan / Arahan Pimpinan:
              </label>
              <textarea
                rows={3}
                placeholder="Berikan catatan, alasan persetujuan/penundaan, instruksi penganggaran, atau instruksi kerja teknisi..."
                value={decisionForm.decision_note}
                onChange={(e) => setDecisionForm({ ...decisionForm, decision_note: e.target.value })}
                disabled={!isPimpinan}
                className="input-textarea"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            {/* Follow-up Checklist (If Approved) */}
            {isPimpinan && decisionForm.decision_status === 'approved' && (
              <div
                style={{
                  backgroundColor: 'var(--surface-sage)',
                  border: '1px solid var(--status-success-border)',
                  borderRadius: 'var(--radius-input)',
                  padding: '14px',
                  marginBottom: '18px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--brand-forest)' }}>
                  <input
                    type="checkbox"
                    checked={decisionForm.create_follow_up}
                    onChange={(e) => setDecisionForm({ ...decisionForm, create_follow_up: e.target.checked })}
                  />
                  <span>Jadwalkan Tugas Tindak Lanjut Otomatis di Riwayat Perbaikan</span>
                </label>

                {decisionForm.create_follow_up && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray-green)' }}>
                      Jenis Tindakan: <strong>{decisionForm.action_type.toUpperCase()}</strong>. Tugas akan dibuat dengan status <strong>Direncanakan (Planned)</strong> dan notifikasi otomatis dikirim ke Teknisi Lab.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDecisionModalItem(null)}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Tutup
              </button>

              {isPimpinan && (
                <button
                  type="button"
                  onClick={handleSubmitDecision}
                  disabled={submittingDecision}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  <Check size={14} />
                  {submittingDecision ? 'Menyimpan...' : 'Simpan Keputusan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE STATUS TINDAK LANJUT                                        */}
      {/* ========================================================================= */}
      {editHistoryModalItem && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} color="var(--brand-forest)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Perbarui Tindak Lanjut — {editHistoryModalItem.device_code}
                </h3>
              </div>
              <button onClick={() => setEditHistoryModalItem(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            {/* Problem description */}
            <div
              style={{
                backgroundColor: 'var(--canvas-soft)',
                padding: '12px',
                borderRadius: 'var(--radius-input)',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              <strong>Permasalahan / Tugas: </strong> {editHistoryModalItem.problem_description}
            </div>

            {/* Status Select */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Status Pengerjaan:
              </label>
              <select
                value={editHistoryForm.status}
                onChange={(e) => setEditHistoryForm({ ...editHistoryForm, status: e.target.value })}
                className="input-select"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="planned">Direncanakan (Planned)</option>
                <option value="in_progress">Sedang Dikerjakan (In Progress)</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>
            </div>

            {/* Action taken */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Tindakan yang Dilakukan (Catatan Teknisi):
              </label>
              <textarea
                rows={3}
                placeholder="Deskripsikan komponen yang diganti, perbaikan jalur, pembersihan, atau instalasi..."
                value={editHistoryForm.action_taken}
                onChange={(e) => setEditHistoryForm({ ...editHistoryForm, action_taken: e.target.value })}
                className="input-textarea"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            {/* Actual Cost */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Biaya Aktual / Riil (IDR):
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                placeholder="Contoh: 150000"
                value={editHistoryForm.actual_cost}
                onChange={(e) => setEditHistoryForm({ ...editHistoryForm, actual_cost: e.target.value })}
                className="input-text"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            {/* Condition Restore Checkbox if Completed */}
            {editHistoryForm.status === 'completed' && (
              <div
                style={{
                  backgroundColor: 'var(--surface-sage)',
                  padding: '12px',
                  borderRadius: 'var(--radius-input)',
                  marginBottom: '18px',
                  fontSize: '12px',
                  color: 'var(--brand-forest)',
                }}
              >
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                <span>Dengan menandai <strong>Selesai</strong>, kondisi perangkat akan otomatis diperbarui menjadi <strong>Baik</strong> dan status operasional menjadi <strong>Aktif</strong>.</span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEditHistoryModalItem(null)}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitHistoryUpdate}
                disabled={submittingHistoryUpdate}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {submittingHistoryUpdate ? 'Menyimpan...' : 'Simpan Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL CATAT TINDAK LANJUT BARU                                    */}
      {/* ========================================================================= */}
      {showNewTaskModal && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Catat Tugas Tindak Lanjut Baru
              </h3>
              <button onClick={() => setShowNewTaskModal(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Pilih Perangkat:
              </label>
              <select
                value={newTaskForm.device_id}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, device_id: e.target.value })}
                className="input-select"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="">-- Pilih Perangkat Lab --</option>
                {devicesList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name} ({d.condition_status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Jenis Tindakan:
              </label>
              <select
                value={newTaskForm.action_type}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, action_type: e.target.value })}
                className="input-select"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="repair">Perbaikan (Repair)</option>
                <option value="upgrade">Upgrade</option>
                <option value="replacement">Penggantian (Replacement)</option>
                <option value="maintenance">Pemeliharaan (Maintenance)</option>
                <option value="inspection">Inspeksi (Inspection)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Deskripsi Masalah / Instruksi Kerja:
              </label>
              <textarea
                rows={3}
                placeholder="Rincian kerusakan atau pekerjaan yang harus diselesaikan..."
                value={newTaskForm.problem_description}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, problem_description: e.target.value })}
                className="input-textarea"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Estimasi Biaya (IDR):
              </label>
              <input
                type="number"
                min="0"
                value={newTaskForm.estimated_cost}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, estimated_cost: e.target.value })}
                className="input-text"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitNewTask}
                disabled={submittingNewTask || !newTaskForm.device_id || !newTaskForm.problem_description}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {submittingNewTask ? 'Menyimpan...' : 'Simpan Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
