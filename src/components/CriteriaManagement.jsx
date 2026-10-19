import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Sliders,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Save,
  RotateCcw,
  Plus,
  Play,
  Info,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  Settings as SettingsIcon,
  Building,
  UserCheck,
  Server,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

const SOT_DEFAULT_WEIGHTS = {
  C1: 0.25,
  C2: 0.10,
  C3: 0.20,
  C4: 0.15,
  C5: 0.20,
  C6: 0.05,
  C7: 0.05,
};

export const CriteriaManagement = ({ defaultTab = 'criteria' }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeknisi = user?.role === 'teknisi';

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Criteria & Weights state
  const [criteria, setCriteria] = useState([]);
  const [totalWeight, setTotalWeight] = useState(1.0);
  const [isValidTotal, setIsValidTotal] = useState(true);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [weightsEditState, setWeightsEditState] = useState({});
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightsMessage, setWeightsMessage] = useState(null);

  // Scale Guides state
  const [scaleGuides, setScaleGuides] = useState([]);
  const [selectedCriterionFilter, setSelectedCriterionFilter] = useState('');
  const [loadingScales, setLoadingScales] = useState(true);

  // Periods state
  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: 0,
  });
  const [submittingPeriod, setSubmittingPeriod] = useState(false);

  // System Settings (Branding Logo, Penandatangan Laporan & Identitas Lab)
  const [settingsForm, setSettingsForm] = useState({
    app_title: 'SPK Periferal',
    institution_name: 'Ponpes Al Ihsan Baron',
    logo_url: null,
    teknisi_name: 'Diki Anwari',
    teknisi_nip: 'NIP. 19880412 201402 1 002',
    kepala_lab_name: 'Ridwan Abdullah S.Kom',
    kepala_lab_title: 'Kepala Unit IT & Lab Komputer',
    lab_name: 'Lab Komputer Ponpes Al Ihsan Baron',
    lab_location: 'Bogor',
  });
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  // Fetch Criteria
  const fetchCriteria = useCallback(async () => {
    setLoadingCriteria(true);
    try {
      const res = await fetch('/api/v1/criteria', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const items = json.data.items || [];
        setCriteria(items);
        setTotalWeight(json.data.totalWeight);
        setIsValidTotal(json.data.isValidTotal);

        // Populate edit state
        const editMap = {};
        items.forEach((c) => {
          editMap[c.id] = c.weight;
        });
        setWeightsEditState(editMap);
      }
    } catch (err) {
      console.error('Failed to load criteria:', err);
    } finally {
      setLoadingCriteria(false);
    }
  }, [token]);

  // Fetch Scale Guides
  const fetchScales = useCallback(async () => {
    setLoadingScales(true);
    try {
      const url = selectedCriterionFilter
        ? `/api/v1/assessment-scales?criterion_id=${selectedCriterionFilter}`
        : '/api/v1/assessment-scales';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setScaleGuides(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load scales:', err);
    } finally {
      setLoadingScales(false);
    }
  }, [token, selectedCriterionFilter]);

  // Fetch Periods
  const fetchPeriods = useCallback(async () => {
    setLoadingPeriods(true);
    try {
      const res = await fetch('/api/v1/assessment-periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPeriods(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load periods:', err);
    } finally {
      setLoadingPeriods(false);
    }
  }, [token]);

  // Fetch System Settings
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/v1/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const s = json.data || {};
        const signees = s.report_signees || {};
        const lab = s.lab_identity || {};
        const branding = s.app_branding || {};
        setSettingsForm({
          app_title: branding.app_title || 'SPK Periferal',
          institution_name: branding.institution_name || 'Ponpes Al Ihsan Baron',
          logo_url: branding.logo_url || null,
          teknisi_name: signees.teknisi_name || 'Diki Anwari',
          teknisi_nip: signees.teknisi_nip || 'NIP. 19880412 201402 1 002',
          kepala_lab_name: signees.kepala_lab_name || 'Ridwan Abdullah S.Kom',
          kepala_lab_title: signees.kepala_lab_title || 'Kepala Unit IT & Lab Komputer',
          lab_name: lab.name || 'Lab Komputer Ponpes Al Ihsan Baron',
          lab_location: lab.location || 'Bogor',
        });
        setLogoPreviewUrl(branding.logo_url || null);
        setSelectedLogoFile(null);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, [token]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas logo maksimal 5MB.');
        return;
      }
      setSelectedLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResetLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    setSettingsForm((prev) => ({ ...prev, logo_url: null }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      let finalLogoUrl = settingsForm.logo_url;

      // Upload logo if new file was chosen
      if (selectedLogoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', selectedLogoFile);

        const uploadRes = await fetch('/api/v1/settings/logo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: logoFormData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Gagal mengunggah berkas logo.');
        }

        const uploadJson = await uploadRes.json();
        finalLogoUrl = uploadJson.data?.logo_url || null;
      }

      const brandingPayload = {
        app_title: settingsForm.app_title.trim() || 'SPK Periferal',
        institution_name: settingsForm.institution_name.trim() || 'Ponpes Al Ihsan Baron',
        logo_url: finalLogoUrl,
      };

      const signeesPayload = {
        teknisi_name: settingsForm.teknisi_name.trim(),
        teknisi_nip: settingsForm.teknisi_nip.trim(),
        kepala_lab_name: settingsForm.kepala_lab_name.trim(),
        kepala_lab_title: settingsForm.kepala_lab_title.trim(),
      };
      const labPayload = {
        name: settingsForm.lab_name.trim(),
        location: settingsForm.lab_location.trim(),
      };

      const [resB, resS, resL] = await Promise.all([
        fetch('/api/v1/settings/app_branding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: brandingPayload }),
        }),
        fetch('/api/v1/settings/report_signees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: signeesPayload }),
        }),
        fetch('/api/v1/settings/lab_identity', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: labPayload }),
        }),
      ]);

      if (!resB.ok || !resS.ok || !resL.ok) {
        throw new Error('Gagal menyimpan pengaturan sistem.');
      }

      setSettingsMessage({
        type: 'success',
        text: 'Logo, nama branding aplikasi, dan data penandatangan berhasil disimpan ke database!',
      });

      // Dispatch global event for instantaneous AppShell update
      window.dispatchEvent(
        new CustomEvent('app-branding-updated', {
          detail: brandingPayload,
        })
      );

      fetchSettings();
    } catch (err) {
      setSettingsMessage({ type: 'danger', text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
    fetchScales();
    fetchPeriods();
    fetchSettings();
  }, [fetchCriteria, fetchScales, fetchPeriods, fetchSettings]);

  // Compute live sum of weights in edit state
  const computedEditSum = Math.round(
    Object.values(weightsEditState).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) * 100000
  ) / 100000;
  const isEditSumValid = Math.abs(computedEditSum - 1.0) < 0.0001;

  // Handle single weight input change
  const handleWeightChange = (id, newVal) => {
    const val = parseFloat(newVal);
    setWeightsEditState((prev) => ({
      ...prev,
      [id]: Number.isNaN(val) ? 0 : val,
    }));
    setWeightsMessage(null);
  };

  // Reset to SOT defaults (0.25, 0.10, 0.20, 0.15, 0.20, 0.05, 0.05)
  const handleResetToSot = () => {
    const newEditMap = {};
    criteria.forEach((c) => {
      newEditMap[c.id] = SOT_DEFAULT_WEIGHTS[c.criterion_key] ?? c.weight;
    });
    setWeightsEditState(newEditMap);
    setWeightsMessage({ type: 'info', text: 'Bobot disetel ke konfigurasi standar SOT PRD v1.0 (Total: 1,00)' });
  };

  // Submit batch weights update (Admin only)
  const handleSaveWeights = async () => {
    if (!isEditSumValid) {
      alert(`Total bobot harus tepat 1,00 (100%). Total saat ini: ${computedEditSum}`);
      return;
    }

    setSavingWeights(true);
    setWeightsMessage(null);

    try {
      const payload = Object.entries(weightsEditState).map(([id, weight]) => ({
        id: parseInt(id, 10),
        weight: parseFloat(weight),
      }));

      const res = await fetch('/api/v1/criteria/weights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weights: payload }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal memperbarui bobot');
      }

      setWeightsMessage({ type: 'success', text: 'Bobot kriteria berhasil diperbarui dan divalidasi berjumlah tepat 1,00!' });
      fetchCriteria();
    } catch (err) {
      setWeightsMessage({ type: 'danger', text: err.message });
    } finally {
      setSavingWeights(false);
    }
  };

  // Activate period (Admin only)
  const handleActivatePeriod = async (periodId) => {
    try {
      const res = await fetch(`/api/v1/assessment-periods/${periodId}/activate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPeriods();
      }
    } catch (err) {
      console.error('Failed to activate period:', err);
    }
  };

  // Submit new period (Admin only)
  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    setSubmittingPeriod(true);
    try {
      const res = await fetch('/api/v1/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(periodForm),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Gagal membuat periode');
      }

      setShowPeriodModal(false);
      setPeriodForm({ name: '', start_date: '', end_date: '', is_active: 0 });
      fetchPeriods();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPeriod(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Konfigurasi Model SAW & Panduan Penilaian
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
          Manajemen kriteria Simple Additive Weighting (SAW), kontrol total bobot 1,00, rubrik operasional, dan periode penilaian.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-soft)',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setActiveTab('criteria')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderBottom: activeTab === 'criteria' ? '2px solid var(--brand-forest)' : '2px solid transparent',
            color: activeTab === 'criteria' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            backgroundColor: 'transparent',
          }}
        >
          <Sliders size={16} />
          Kriteria & Bobot SAW
        </button>

        <button
          onClick={() => setActiveTab('scales')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderBottom: activeTab === 'scales' ? '2px solid var(--brand-forest)' : '2px solid transparent',
            color: activeTab === 'scales' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            backgroundColor: 'transparent',
          }}
        >
          <Award size={16} />
          Panduan Rubrik Skala (1-5)
        </button>

        <button
          onClick={() => setActiveTab('periods')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderBottom: activeTab === 'periods' ? '2px solid var(--brand-forest)' : '2px solid transparent',
            color: activeTab === 'periods' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            backgroundColor: 'transparent',
          }}
        >
          <Calendar size={16} />
          Periode Penilaian
        </button>

        <button
          onClick={() => setActiveTab('system-settings')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderBottom: activeTab === 'system-settings' ? '2px solid var(--brand-forest)' : '2px solid transparent',
            color: activeTab === 'system-settings' ? 'var(--brand-forest)' : 'var(--text-gray-green)',
            backgroundColor: 'transparent',
          }}
        >
          <SettingsIcon size={16} />
          Pengaturan Sistem &amp; Pejabat
        </button>
      </div>

      {/* Tab 1: Kriteria & Bobot */}
      {activeTab === 'criteria' && (
        <div>
          {/* Total Weight Status Banner */}
          <div
            style={{
              backgroundColor: isValidTotal ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              border: `1px solid ${isValidTotal ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
              borderRadius: 'var(--radius-input)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isValidTotal ? (
                <CheckCircle2 size={20} color="var(--status-success)" />
              ) : (
                <AlertTriangle size={20} color="var(--status-danger)" />
              )}
              <div>
                <strong style={{ fontSize: '14px', color: isValidTotal ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  Total Bobot: {(totalWeight * 100).toFixed(0)}% ({totalWeight.toFixed(5)}) —{' '}
                  {isValidTotal ? 'Valid (Sesuai Aturan SAW)' : 'Tidak Valid (Harus Tepat 1,00)'}
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  Sesuai ketentuan <code>SOT/PRD.md</code>, perhitungan SAW hanya diizinkan berjalan jika jumlah bobot seluruh kriteria tepat bernilai 1,00.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleResetToSot} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <RotateCcw size={13} />
                  Reset Standar SOT
                </button>
              </div>
            )}
          </div>

          {weightsMessage && (
            <div
              style={{
                backgroundColor: weightsMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${weightsMessage.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
                color: weightsMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                borderRadius: 'var(--radius-input)',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {weightsMessage.text}
            </div>
          )}

          {/* Criteria Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-sage)', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Kode</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nama Kriteria</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tipe Atribut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tipe Input</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Bobot Tersimpan</th>
                  {isAdmin && (
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>
                      Ubah Bobot (Editor)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-forest)' }}>
                      {c.criterion_key}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '2px' }}>
                        {c.description}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.attribute_type === 'benefit' ? (
                        <span className="badge badge-success">Benefit</span>
                      ) : (
                        <span className="badge badge-warning">Cost</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-gray-green)' }}>
                      {c.input_type === 'scale_1_5' ? 'Skala Skor (1–5)' : 'Nominal Rupiah (IDR)'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--surface-sage)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          color: 'var(--brand-forest)',
                        }}
                      >
                        {(c.weight * 100).toFixed(0)}% ({c.weight.toFixed(2)})
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={weightsEditState[c.id] ?? c.weight}
                          onChange={(e) => handleWeightChange(c.id, e.target.value)}
                          style={{
                            width: '90px',
                            padding: '6px 8px',
                            textAlign: 'right',
                            borderRadius: 'var(--radius-input)',
                            border: '1px solid var(--border-soft)',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Admin Live Weight Editor Footer */}
            {isAdmin && (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--canvas-soft)',
                  borderTop: '1px solid var(--border-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>Total Bobot Editor:</span>
                  <strong
                    style={{
                      fontSize: '14px',
                      color: isEditSumValid ? 'var(--status-success)' : 'var(--status-danger)',
                    }}
                  >
                    {(computedEditSum * 100).toFixed(1)}% ({computedEditSum.toFixed(4)})
                  </strong>
                  {isEditSumValid ? (
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      Tepat 1,00
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                      Selisih: {((computedEditSum - 1.0) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveWeights}
                    disabled={savingWeights || !isEditSumValid}
                    className="btn-primary"
                  >
                    <Save size={15} />
                    {savingWeights ? 'Menyimpan...' : 'Simpan Perubahan Bobot'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SOT Weight Notes Card */}
          <div
            style={{
              backgroundColor: 'var(--base-white)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-card)',
              padding: '18px 22px',
              fontSize: '13px',
              color: 'var(--text-gray-green)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Info size={16} color="var(--brand-forest)" />
              <strong style={{ color: 'var(--brand-forest)' }}>Catatan Penting SOT PRD Bagian 6.1:</strong>
            </div>
            <p style={{ lineHeight: 1.5 }}>
              Pada draft awal terdapat ambigu C7 "Kelayakan Perbaikan = 0.5". Karena enam bobot lain berjumlah 0,95, maka paket SOT secara resmi menggunakan <strong>C7 = 0,05</strong> agar jumlah tepat 1,00. Nilai ini tersimpan pada sistem dan dapat diubah secara aman oleh Admin selama total akhir tetap 1,00.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Panduan Rubrik Skala (1-5) */}
      {activeTab === 'scales' && (
        <div>
          {/* C4 Cost Clarification Alert */}
          <div
            style={{
              backgroundColor: 'var(--surface-sage)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-input)',
              padding: '16px 20px',
              marginBottom: '20px',
              fontSize: '13px',
            }}
          >
            <strong style={{ color: 'var(--brand-forest)', display: 'block', marginBottom: '4px' }}>
              Aturan Khusus Kriteria Biaya (C4 — Estimasi Biaya Perbaikan):
            </strong>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Kriteria C4 diisi nominal Rupiah aktual (Rp 0 ke atas), bertipe <strong>Cost</strong> (biaya lebih rendah dinormalisasi lebih tinggi).
              Jika nilai minimum adalah 0, biaya Rp 0 mendapat normalisasi 1,0 dan biaya positif dinormalisasi proporsional untuk mencegah pembagian dengan nol.
            </p>
          </div>

          {/* Filter by criterion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Pilih Kriteria:</span>
            <select
              value={selectedCriterionFilter}
              onChange={(e) => setSelectedCriterionFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-input)',
                border: '1px solid var(--border-soft)',
                fontSize: '13px',
              }}
            >
              <option value="">Semua Kriteria Skala</option>
              {criteria
                .filter((c) => c.input_type === 'scale_1_5')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.criterion_key} — {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Rubrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {scaleGuides.map((guide) => (
              <div
                key={guide.id}
                className="card"
                style={{
                  padding: '16px 18px',
                  borderLeft: `4px solid ${guide.score >= 4 ? 'var(--status-danger)' : guide.score === 3 ? 'var(--status-warning)' : 'var(--status-success)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>
                    {guide.criterion_key} · {guide.criterion_name}
                  </span>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--surface-sage)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--brand-forest)',
                    }}
                  >
                    {guide.score}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {guide.label}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-gray-green)', marginTop: '4px', lineHeight: 1.4 }}>
                  {guide.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Periode Penilaian */}
      {activeTab === 'periods' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Daftar Periode Penilaian Laboratorium
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-gray-green)' }}>
                Setiap siklus penilaian dan eksekusi SAW dikaitkan dengan satu periode aktif.
              </p>
            </div>

            {isAdmin && (
              <button onClick={() => setShowPeriodModal(true)} className="btn-primary">
                <Plus size={15} />
                Tambah Periode Baru
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-sage)', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nama Periode</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tanggal Mulai</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tanggal Selesai</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Penilaian</th>
                  {isAdmin && <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-gray-green)' }}>
                      {new Date(p.start_date).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-gray-green)' }}>
                      {new Date(p.end_date).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.is_active ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Periode Aktif
                        </span>
                      ) : (
                        <span className="badge badge-info">Selesai / Nonaktif</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                      {p.assessment_count || 0}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {!p.is_active && (
                          <button
                            onClick={() => handleActivatePeriod(p.id)}
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            <Play size={12} />
                            Jadikan Aktif
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Create Period */}
          {showPeriodModal && (
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
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>
                  Buat Periode Penilaian Baru
                </h3>
                <form onSubmit={handleCreatePeriod}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      Nama Periode *
                    </label>
                    <input
                      type="text"
                      value={periodForm.name}
                      onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                      placeholder="Contoh: Semester Ganjil 2026/2027"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-input)',
                        border: '1px solid var(--border-soft)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        Tanggal Mulai *
                      </label>
                      <input
                        type="date"
                        value={periodForm.start_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        Tanggal Selesai *
                      </label>
                      <input
                        type="date"
                        value={periodForm.end_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={periodForm.is_active === 1}
                        onChange={(e) => setPeriodForm({ ...periodForm, is_active: e.target.checked ? 1 : 0 })}
                      />
                      <span>Langsung tetapkan sebagai periode aktif</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPeriodModal(false)}
                      className="btn-secondary"
                    >
                      Batal
                    </button>
                    <button type="submit" disabled={submittingPeriod} className="btn-primary">
                      {submittingPeriod ? 'Memproses...' : 'Simpan Periode'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Pengaturan Sistem & Pejabat Penandatangan Laporan */}
      {activeTab === 'system-settings' && (
        <div style={{ maxWidth: '880px' }}>
          {settingsMessage && (
            <div
              style={{
                backgroundColor: settingsMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                color: settingsMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                border: `1px solid ${settingsMessage.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
                borderRadius: 'var(--radius-input)',
                padding: '12px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {settingsMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{settingsMessage.text}</span>
            </div>
          )}

          {loadingSettings ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-gray-green)' }}>
              Memuat pengaturan sistem...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              {/* Card 0: Identitas Branding & Logo Aplikasi */}
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <ImageIcon size={20} color="var(--brand-forest)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Branding &amp; Logo Aplikasi (Bilah Navigasi Sidebar)
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginBottom: '20px' }}>
                  Sesuaikan logo institusi, judul aplikasi, dan subjudul lembaga yang tampil di sudut kiri atas sistem.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(260px, 320px) 1fr',
                    gap: '24px',
                    alignItems: 'start',
                  }}
                >
                  {/* Visual Preview Box matching exactly the Sidebar Header */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Pratinjau Tampilan Header Sidebar:
                    </label>
                    <div
                      style={{
                        backgroundColor: '#205B43',
                        padding: '18px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: logoPreviewUrl ? '#FFFFFF' : 'rgba(255, 255, 255, 0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                          padding: logoPreviewUrl ? '3px' : 0,
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                        }}
                      >
                        {logoPreviewUrl ? (
                          <img
                            src={logoPreviewUrl}
                            alt="Logo Pratinjau"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <Server size={22} color="var(--base-white)" />
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {settingsForm.app_title || 'SPK Periferal'}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--surface-sage)',
                            opacity: 0.9,
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {settingsForm.institution_name || 'Ponpes Al Ihsan Baron'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      {(logoPreviewUrl || settingsForm.logo_url) && (
                        <button
                          type="button"
                          onClick={handleResetLogo}
                          className="btn-secondary"
                          style={{ fontSize: '11.5px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <RotateCcw size={12} />
                          <span>Gunakan Ikon Default (Server)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs for Branding */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Nama / Judul Aplikasi *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.app_title}
                        onChange={(e) => setSettingsForm({ ...settingsForm, app_title: e.target.value })}
                        placeholder="Contoh: SPK Periferal"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Nama Lembaga / Subjudul *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.institution_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, institution_name: e.target.value })}
                        placeholder="Contoh: Ponpes Al Ihsan Baron"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Unggah Berkas Logo Baru
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoChange}
                          style={{
                            fontSize: '12px',
                            padding: '6px 10px',
                            border: '1px solid var(--border-soft)',
                            borderRadius: 'var(--radius-input)',
                            backgroundColor: 'var(--base-white)',
                            flex: 1,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-gray-green)', margin: '4px 0 0 0' }}>
                        Format diperbolehkan: PNG, JPG, atau WEBP transparan (Rasio 1:1 direkomendasikan, maks 5 MB).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 1: Pejabat Penandatangan Laporan Resmi */}
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <UserCheck size={20} color="var(--brand-forest)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Pejabat Penandatangan Dokumen Resmi (Lembar Pengesahan)
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginBottom: '20px' }}>
                  Nama dan NIP/jabatan yang tersimpan di sini otomatis tercetak pada lembar pengesahan laporan resmi (Hasil SAW, Rekomendasi Pimpinan, Inventaris, dan Riwayat Perbaikan).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Bagian Kiri: Teknisi Pemeriksa */}
                  <div
                    style={{
                      backgroundColor: 'var(--canvas-soft)',
                      padding: '18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-forest)', textTransform: 'uppercase', marginBottom: '14px' }}>
                      1. Teknisi Laboratorium (Verifikator)
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Nama Lengkap Teknisi *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.teknisi_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, teknisi_name: e.target.value })}
                        placeholder="Contoh: Diki Anwari"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        NIP / Nomor Identitas Teknisi
                      </label>
                      <input
                        type="text"
                        value={settingsForm.teknisi_nip}
                        onChange={(e) => setSettingsForm({ ...settingsForm, teknisi_nip: e.target.value })}
                        placeholder="Contoh: NIP. 19880412 201402 1 002"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Bagian Kanan: Kepala Laboratorium */}
                  <div
                    style={{
                      backgroundColor: 'var(--canvas-soft)',
                      padding: '18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-forest)', textTransform: 'uppercase', marginBottom: '14px' }}>
                      2. Kepala Laboratorium Komputer (Penyetuju)
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Nama Lengkap Kepala Lab *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.kepala_lab_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, kepala_lab_name: e.target.value })}
                        placeholder="Contoh: Ridwan Abdullah S.Kom"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Jabatan / Gelar Satuan Kerja
                      </label>
                      <input
                        type="text"
                        value={settingsForm.kepala_lab_title}
                        onChange={(e) => setSettingsForm({ ...settingsForm, kepala_lab_title: e.target.value })}
                        placeholder="Contoh: Kepala Unit IT & Lab Komputer"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-input)',
                          border: '1px solid var(--border-soft)',
                          fontSize: '13px',
                          backgroundColor: 'var(--base-white)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Identitas Lembaga & Laboratorium */}
              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Building size={20} color="var(--brand-forest)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Identitas Lembaga &amp; Laboratorium
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-gray-green)', marginBottom: '16px' }}>
                  Nama unit laboratorium dan kota penetapan penandatanganan berkas resmi.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Nama Laboratorium
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.lab_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lab_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-input)',
                        border: '1px solid var(--border-soft)',
                        fontSize: '13px',
                        backgroundColor: 'var(--base-white)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Kota Lokasi Dokumen
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.lab_location}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lab_location: e.target.value })}
                      placeholder="Contoh: Bogor"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-input)',
                        border: '1px solid var(--border-soft)',
                        fontSize: '13px',
                        backgroundColor: 'var(--base-white)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={fetchSettings}
                    className="btn-secondary"
                    disabled={savingSettings}
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Batal / Muat Ulang</span>
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn-primary"
                    style={{ padding: '9px 22px', fontSize: '13px' }}
                  >
                    <Save size={15} />
                    <span>{savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Pejabat & Sistem'}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
