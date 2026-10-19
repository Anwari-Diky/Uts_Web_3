/**
 * Mock API Fallback for Vercel / Standalone Demo Mode
 * 
 * Intercepts window.fetch for /api/v1/* routes:
 * - On Vercel (or non-localhost domains): Instantly serves comprehensive mock data
 *   so login, dashboard, tables, SAW calculation, and reports function 100% offline.
 * - On Localhost: Automatically connects to the real Express + MySQL backend when running.
 */

const STORAGE_KEY_PREFIX = 'spk_demo_mock_';

const initialSettings = {
  app_branding: {
    app_name: 'SPK Periferal Ponpes',
    lab_title: 'Lab Komputer',
    institution_name: 'Pondok Pesantren Al Ihsan Baron Bogor',
    logo_url: null,
  },
  lab_identity: {
    lab_name: 'Lab Komputer',
    institution: 'Pondok Pesantren Al Ihsan Baron Bogor',
    address: 'Jl. Ponpes Baron Rt.03 Rw.13 Cilendek Barat, Kota Bogor, Jawa barat 16112',
    phone: '0812-1898-7172',
    website: 'alihsanbaronbogor.ponpes.id',
    social_ig_fb: 'ponpesbaronbogr',
    location: 'Bogor',
  },
  report_signees: {
    teknisi_name: 'Diki Anwari S.Kom',
    teknisi_nip: 'NIP. 19880412 201402 1 002',
    kepala_lab_name: 'Muhammad Ridwan Abdullah S.Kom',
    kepala_lab_title: 'Kepala Unit IT & Lab Komputer',
  },
};

const initialPeriods = [
  { id: 1, name: 'Penilaian Demo Oktober 2026', start_date: '2026-10-01', end_date: '2026-10-31', is_active: 1 },
  { id: 2, name: 'Tahun Ajaran 2025/2026 Genap', start_date: '2026-01-01', end_date: '2026-06-30', is_active: 0 },
];

const initialCategories = [
  { id: 1, code: 'CAT-01', name: 'Keyboard' },
  { id: 2, code: 'CAT-02', name: 'Monitor' },
  { id: 3, code: 'CAT-03', name: 'Mouse' },
  { id: 4, code: 'CAT-04', name: 'Printer' },
];

const initialLocations = [
  { id: 1, name: 'Lab Utama', building: 'Gedung IT Barat' },
  { id: 2, name: 'Lab Tambahan', building: 'Gedung IT Timur' },
  { id: 3, name: 'Ruang Administrasi', building: 'Kantor Lab' },
];

const initialCriteria = [
  { id: 1, code: 'C1', name: 'Tingkat Kerusakan', type: 'benefit', weight: 0.25 },
  { id: 2, code: 'C2', name: 'Usia Perangkat', type: 'benefit', weight: 0.10 },
  { id: 3, code: 'C3', name: 'Frekuensi Gangguan', type: 'benefit', weight: 0.20 },
  { id: 4, code: 'C4', name: 'Estimasi Biaya Perbaikan', type: 'cost', weight: 0.15 },
  { id: 5, code: 'C5', name: 'Dampak terhadap Kegiatan Laboratorium', type: 'benefit', weight: 0.20 },
  { id: 6, code: 'C6', name: 'Ketersediaan Suku Cadang', type: 'benefit', weight: 0.05 },
  { id: 7, code: 'C7', name: 'Kelayakan Perbaikan', type: 'benefit', weight: 0.05 },
];

const initialScales = [
  { id: 1, criterion_id: 1, criterion_code: 'C1', scale_value: 1, description: 'Ringan/tidak mengganggu' },
  { id: 2, criterion_id: 1, criterion_code: 'C1', scale_value: 2, description: 'Ringan' },
  { id: 3, criterion_id: 1, criterion_code: 'C1', scale_value: 3, description: 'Sedang' },
  { id: 4, criterion_id: 1, criterion_code: 'C1', scale_value: 4, description: 'Berat' },
  { id: 5, criterion_id: 1, criterion_code: 'C1', scale_value: 5, description: 'Kritis/tidak berfungsi' },
  { id: 6, criterion_id: 2, criterion_code: 'C2', scale_value: 1, description: '< 1 tahun' },
  { id: 7, criterion_id: 2, criterion_code: 'C2', scale_value: 2, description: '1–2 tahun' },
  { id: 8, criterion_id: 2, criterion_code: 'C2', scale_value: 3, description: '3–4 tahun' },
  { id: 9, criterion_id: 2, criterion_code: 'C2', scale_value: 4, description: '5–6 tahun' },
  { id: 10, criterion_id: 2, criterion_code: 'C2', scale_value: 5, description: '> 6 tahun' },
];

const initialDevices = [
  {
    id: 1,
    code: 'KB-001',
    name: 'Keyboard Lab A-01',
    category_id: 1,
    category_name: 'Keyboard',
    location_id: 1,
    location_name: 'Lab Utama',
    brand: 'Logitech',
    model: 'K120',
    specification: 'USB, full-size',
    condition_status: 'rusak_berat',
    operational_status: 'aktif',
    purchase_value: 175000,
    acquisition_date: '2021-02-15',
  },
  {
    id: 2,
    code: 'MN-004',
    name: 'Monitor Lab A-04',
    category_id: 2,
    category_name: 'Monitor',
    location_id: 1,
    location_name: 'Lab Utama',
    brand: 'AOC',
    model: 'E970SWN',
    specification: '18.5 inch, VGA',
    condition_status: 'rusak_ringan',
    operational_status: 'perlu_pemeriksaan',
    purchase_value: 950000,
    acquisition_date: '2019-08-10',
  },
  {
    id: 3,
    code: 'MN-011',
    name: 'Monitor Lab B-03',
    category_id: 2,
    category_name: 'Monitor',
    location_id: 2,
    location_name: 'Lab Tambahan',
    brand: 'Samsung',
    model: 'S19A10',
    specification: '19 inch, VGA',
    condition_status: 'rusak_berat',
    operational_status: 'dalam_perbaikan',
    purchase_value: 900000,
    acquisition_date: '2018-01-12',
  },
  {
    id: 4,
    code: 'PR-002',
    name: 'Printer Administrasi',
    category_id: 4,
    category_name: 'Printer',
    location_id: 3,
    location_name: 'Ruang Administrasi',
    brand: 'Epson',
    model: 'L3210',
    specification: 'Ink tank, USB',
    condition_status: 'perlu_perhatian',
    operational_status: 'perlu_pemeriksaan',
    purchase_value: 2450000,
    acquisition_date: '2022-06-20',
  },
  {
    id: 5,
    code: 'MS-008',
    name: 'Mouse Lab A-08',
    category_id: 3,
    category_name: 'Mouse',
    location_id: 1,
    location_name: 'Lab Utama',
    brand: 'Logitech',
    model: 'B100',
    specification: 'USB optical',
    condition_status: 'baik',
    operational_status: 'aktif',
    purchase_value: 85000,
    acquisition_date: '2024-03-02',
  },
  {
    id: 6,
    code: 'MS-012',
    name: 'Mouse Lab B-04',
    category_id: 3,
    category_name: 'Mouse',
    location_id: 2,
    location_name: 'Lab Tambahan',
    brand: 'Fantech',
    model: 'OP1',
    specification: 'USB optical',
    condition_status: 'baik',
    operational_status: 'aktif',
    purchase_value: 120000,
    acquisition_date: '2024-11-18',
  },
];

const initialSawRanking = [
  {
    rank_position: 1,
    device_id: 1,
    device_code: 'KB-001',
    device_name: 'Keyboard Lab A-01',
    category_name: 'Keyboard',
    location_name: 'Lab Utama',
    preference_value: '0.862143',
    priority_band: 'Tinggi',
    recommendation: 'Perlu Diperbaiki — Prioritas Tinggi',
    decision_status: 'DISETUJUI',
    decision_note: 'Segera perbaiki tombol yang macet dan ganti kabel USB.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
  {
    rank_position: 2,
    device_id: 2,
    device_code: 'MN-004',
    device_name: 'Monitor Lab A-04',
    category_name: 'Monitor',
    location_name: 'Lab Utama',
    preference_value: '0.720000',
    priority_band: 'Tinggi',
    recommendation: 'Perlu Diperbaiki — Prioritas Tinggi',
    decision_status: 'DISETUJUI',
    decision_note: 'Perbaiki modul power supply inverter.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
  {
    rank_position: 3,
    device_id: 3,
    device_code: 'MN-011',
    device_name: 'Monitor Lab B-03',
    category_name: 'Monitor',
    location_name: 'Lab Tambahan',
    preference_value: '0.665714',
    priority_band: 'Sedang',
    recommendation: 'Kandidat Upgrade/Penggantian',
    decision_status: 'REKOMENDASI_UPGRADE',
    decision_note: 'Panel LCD bergaris berat, ajukan pengadaan pengganti.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
  {
    rank_position: 4,
    device_id: 4,
    device_code: 'PR-002',
    device_name: 'Printer Administrasi',
    category_name: 'Printer',
    location_name: 'Ruang Administrasi',
    preference_value: '0.580000',
    priority_band: 'Sedang',
    recommendation: 'Perlu Diperbaiki — Terjadwal',
    decision_status: 'DISETUJUI',
    decision_note: 'Jadwalkan pembersihan head printer dan roller.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
  {
    rank_position: 5,
    device_id: 5,
    device_code: 'MS-008',
    device_name: 'Mouse Lab A-08',
    category_name: 'Mouse',
    location_name: 'Lab Utama',
    preference_value: '0.472500',
    priority_band: 'Sedang',
    recommendation: 'Perlu Pemeriksaan Lanjutan',
    decision_status: 'MENUNGGU',
    decision_note: 'Lakukan pembersihan sensor optik.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
  {
    rank_position: 6,
    device_id: 6,
    device_code: 'MS-012',
    device_name: 'Mouse Lab B-04',
    category_name: 'Mouse',
    location_name: 'Lab Tambahan',
    preference_value: '0.420000',
    priority_band: 'Sedang',
    recommendation: 'Perlu Pemeriksaan Lanjutan',
    decision_status: 'MENUNGGU',
    decision_note: 'Pemeriksaan rutin berkala.',
    decision_by_name: 'Muhammad Ridwan Abdullah S.Kom',
    decision_at: '2026-10-19',
  },
];

const initialRepairs = [
  {
    id: 1,
    device_code: 'KB-001',
    device_name: 'Keyboard Lab A-01',
    action_type: 'PERBAIKAN',
    problem_description: 'Beberapa tombol macet dan koneksi USB sering terputus.',
    action_taken: 'Pembersihan membran switch dan solder ulang konektor kabel USB.',
    estimated_cost: 25000,
    actual_cost: 20000,
    status: 'SELESAI',
    handler_name: 'Diki Anwari S.Kom',
  },
  {
    id: 2,
    device_code: 'MN-004',
    device_name: 'Monitor Lab A-04',
    action_type: 'PERBAIKAN',
    problem_description: 'Layar monitor mati tiba-tiba saat digunakan.',
    action_taken: 'Penggantian kapasitor regulator power supply.',
    estimated_cost: 75000,
    actual_cost: 65000,
    status: 'SEDANG_DIKERJAKAN',
    handler_name: 'Diki Anwari S.Kom',
  },
];

function getStoredState(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredState(key, data) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.warn('Mock storage write failed:', err);
  }
}

// Interceptor handler
async function handleMockRequest(url, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const cleanUrl = url.split('?')[0];
  const searchParams = new URL(url, 'http://localhost').searchParams;

  const mockResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Fallback': 'true',
      },
    });
  };

  // 1. Settings & Branding
  if (
    cleanUrl === '/api/v1/settings' ||
    cleanUrl === '/api/v1/settings/public-branding' ||
    cleanUrl.startsWith('/api/v1/settings/')
  ) {
    if (method === 'POST' || method === 'PUT') {
      return mockResponse({ success: true, message: 'Pengaturan berhasil disimpan' });
    }
    const settings = getStoredState('settings', initialSettings);
    return mockResponse({ success: true, data: settings });
  }

  // 2. Auth me
  if (cleanUrl === '/api/v1/auth/me') {
    const currentUser = getStoredState('current_user', {
      id: 1,
      username: 'admin',
      full_name: 'Admin Demo',
      role: 'admin',
      email: 'admin@ponpesbaron.id',
    });
    return mockResponse({ success: true, data: { user: currentUser } });
  }

  // 3. Auth login
  if (cleanUrl === '/api/v1/auth/login' && method === 'POST') {
    let body = {};
    try {
      body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body || {};
    } catch {
      body = {};
    }
    const uname = (body.username || '').toLowerCase();
    let role = 'admin';
    let fullName = 'Admin Demo';

    if (uname.includes('pimpinan')) {
      role = 'pimpinan';
      fullName = 'Muhammad Ridwan Abdullah S.Kom (Pimpinan)';
    } else if (uname.includes('teknisi')) {
      role = 'teknisi';
      fullName = 'Diki Anwari S.Kom (Teknisi)';
    }

    const userData = {
      id: role === 'admin' ? 1 : role === 'pimpinan' ? 2 : 3,
      username: uname || 'admin',
      full_name: fullName,
      role: role,
      email: `${uname || 'admin'}@ponpesbaron.id`,
    };

    setStoredState('current_user', userData);

    return mockResponse({
      success: true,
      data: {
        token: `mock-token-${role}-${Date.now()}`,
        user: userData,
      },
    });
  }

  // 4. Auth logout
  if (cleanUrl === '/api/v1/auth/logout' && method === 'POST') {
    return mockResponse({ success: true, message: 'Berhasil keluar' });
  }

  // 5. Dashboard Stats (Exact match to DashboardView.jsx expectations)
  if (cleanUrl === '/api/v1/dashboard/stats') {
    return mockResponse({
      success: true,
      data: {
        devices: {
          total: 6,
          conditions: { baik: 2, rusak_ringan: 2, rusak_berat: 2 },
          operational: { aktif: 3, dalam_perbaikan: 1, tidak_aktif: 2 },
          categories: [
            { id: 1, name: 'Keyboard', device_count: 1 },
            { id: 2, name: 'Monitor', device_count: 2 },
            { id: 3, name: 'Mouse', device_count: 2 },
            { id: 4, name: 'Printer', device_count: 1 },
          ],
        },
        latest_saw_run: {
          id: 1,
          run_at: '2026-10-19T10:00:00Z',
          period_name: 'Penilaian Demo Oktober 2026',
          total_devices: 6,
          priority_bands: {
            Tinggi: 2,
            Sedang: 4,
            Rendah: 0,
          },
        },
        recommendations: {
          pending: 2,
          approved: 3,
          rejected: 0,
          deferred: 1,
        },
        repairs: {
          counts: { SELESAI: 1, SEDANG_DIKERJAKAN: 1 },
          total_estimated_cost: 100000,
          total_actual_cost: 85000,
        },
        recent_activities: [
          {
            id: 1,
            action: 'SAW_CALCULATION',
            description: 'Perhitungan SAW periode Oktober 2026 selesai dijalankan.',
            created_at: new Date().toISOString(),
            user_name: 'Admin Demo',
          },
          {
            id: 2,
            action: 'DECISION_APPROVAL',
            description: 'Persetujuan rekomendasi perbaikan untuk KB-001 oleh Pimpinan Lab.',
            created_at: new Date().toISOString(),
            user_name: 'Muhammad Ridwan Abdullah S.Kom',
          },
        ],
      },
    });
  }

  // 6. Periods
  if (cleanUrl === '/api/v1/assessment-periods') {
    return mockResponse({ success: true, data: initialPeriods });
  }

  // 7. Categories & Locations
  if (cleanUrl === '/api/v1/device-categories') {
    return mockResponse({ success: true, data: initialCategories });
  }
  if (cleanUrl === '/api/v1/locations') {
    return mockResponse({ success: true, data: initialLocations });
  }

  // 8. Criteria & Scales
  if (cleanUrl === '/api/v1/criteria') {
    return mockResponse({
      success: true,
      data: {
        items: initialCriteria,
        totalWeight: 1.0,
        isValidTotal: true,
      },
    });
  }
  if (cleanUrl === '/api/v1/assessment-scales') {
    return mockResponse({
      success: true,
      data: initialScales,
    });
  }

  // 9. Devices List & detail
  if (cleanUrl.startsWith('/api/v1/devices')) {
    const devices = getStoredState('devices', initialDevices);
    if (method === 'POST') {
      return mockResponse({ success: true, message: 'Perangkat berhasil ditambahkan' });
    }
    if (method === 'PUT' || method === 'PATCH') {
      return mockResponse({ success: true, message: 'Perangkat berhasil diperbarui' });
    }
    if (method === 'DELETE') {
      return mockResponse({ success: true, message: 'Perangkat berhasil dihapus' });
    }
    const singleId = cleanUrl.replace('/api/v1/devices/', '').replace('/damage-documentation', '');
    if (singleId && !isNaN(Number(singleId))) {
      const found = devices.find((d) => d.id === Number(singleId)) || devices[0];
      return mockResponse({ success: true, data: { ...found, damage_documentation: [] } });
    }
    return mockResponse({
      success: true,
      data: {
        items: devices,
        total: devices.length,
        totalPages: 1,
      },
    });
  }

  // 10. Assessments
  if (cleanUrl.startsWith('/api/v1/assessments')) {
    if (method === 'POST') {
      return mockResponse({ success: true, message: 'Penilaian berhasil disimpan' });
    }
    return mockResponse({
      success: true,
      data: initialDevices.map((d) => ({
        device_id: d.id,
        device_code: d.code,
        device_name: d.name,
        category_name: d.category_name,
        status: 'assessed',
        values: { C1: 4, C2: 4, C3: 4, C4: 250000, C5: 4, C6: 4, C7: 4 },
      })),
    });
  }

  // 11. SAW Runs
  if (cleanUrl.startsWith('/api/v1/saw-runs')) {
    if (method === 'POST') {
      return mockResponse({
        success: true,
        message: 'Kalkulasi SAW berhasil dijalankan untuk 6 perangkat!',
        data: { id: 1, device_count: 6 },
      });
    }
    const runResult = {
      id: 1,
      period_id: 1,
      run_at: '2026-10-19T10:00:00Z',
      run_by_name: 'Admin Demo',
      status: 'COMPLETED',
      total_devices: 6,
      results: initialSawRanking,
      matrices: {
        decision_matrix: {
          'KB-001': { C1: 5, C2: 4, C3: 5, C4: 280000, C5: 5, C6: 5, C7: 5 },
          'MN-004': { C1: 4, C2: 5, C3: 4, C4: 450000, C5: 4, C6: 4, C7: 4 },
          'MN-011': { C1: 4, C2: 4, C3: 4, C4: 350000, C5: 4, C6: 2, C7: 2 },
          'PR-002': { C1: 3, C2: 3, C3: 3, C4: 180000, C5: 3, C6: 4, C7: 4 },
          'MS-008': { C1: 2, C2: 2, C3: 1, C4: 80000, C5: 2, C6: 5, C7: 5 },
          'MS-012': { C1: 1, C2: 2, C3: 1, C4: 60000, C5: 1, C6: 5, C7: 5 },
        },
        normalized_matrix: {
          'KB-001': { C1: 1.0, C2: 0.8, C3: 1.0, C4: 0.214, C5: 1.0, C6: 1.0, C7: 1.0 },
          'MN-004': { C1: 0.8, C2: 1.0, C3: 0.8, C4: 0.133, C5: 0.8, C6: 0.8, C7: 0.8 },
          'MN-011': { C1: 0.8, C2: 0.8, C3: 0.8, C4: 0.171, C5: 0.8, C6: 0.4, C7: 0.4 },
          'PR-002': { C1: 0.6, C2: 0.6, C3: 0.6, C4: 0.333, C5: 0.6, C6: 0.8, C7: 0.8 },
          'MS-008': { C1: 0.4, C2: 0.4, C3: 0.2, C4: 0.75, C5: 0.4, C6: 1.0, C7: 1.0 },
          'MS-012': { C1: 0.2, C2: 0.4, C3: 0.2, C4: 1.0, C5: 0.2, C6: 1.0, C7: 1.0 },
        },
      },
    };
    if (cleanUrl === '/api/v1/saw-runs' && method === 'GET') {
      return mockResponse({ success: true, data: [runResult] });
    }
    return mockResponse({ success: true, data: runResult });
  }

  // 12. Recommendations
  if (cleanUrl.startsWith('/api/v1/recommendations')) {
    if (method === 'POST') {
      return mockResponse({ success: true, message: 'Keputusan berhasil disimpan' });
    }
    return mockResponse({ success: true, data: initialSawRanking });
  }

  // 13. Repair History
  if (cleanUrl.startsWith('/api/v1/repair-history')) {
    if (method === 'POST' || method === 'PUT') {
      return mockResponse({ success: true, message: 'Data perbaikan berhasil disimpan' });
    }
    return mockResponse({ success: true, data: initialRepairs });
  }

  // 14. Reports Data (for ReportsAndExport component)
  if (cleanUrl === '/api/v1/reports/data') {
    const type = searchParams.get('type') || 'saw_ranking';
    if (type === 'saw_ranking') {
      return mockResponse({
        success: true,
        data: {
          type: 'saw_ranking',
          title: 'Laporan Hasil Perhitungan SAW dan Pemeringkatan Prioritas',
          columns: [
            { key: 'rank_position', label: 'Peringkat' },
            { key: 'device_code', label: 'Kode Perangkat' },
            { key: 'device_name', label: 'Nama Perangkat' },
            { key: 'category_name', label: 'Kategori' },
            { key: 'location_name', label: 'Lokasi' },
            { key: 'preference_value', label: 'Nilai Preferensi (V)' },
            { key: 'priority_band', label: 'Kategori Prioritas' },
            { key: 'recommendation', label: 'Rekomendasi Sistem' },
          ],
          items: initialSawRanking,
        },
      });
    } else if (type === 'inventory') {
      return mockResponse({
        success: true,
        data: {
          type: 'inventory',
          title: 'Laporan Inventaris dan Kondisi Perangkat Periferal',
          columns: [
            { key: 'code', label: 'Kode Perangkat' },
            { key: 'name', label: 'Nama Perangkat' },
            { key: 'category_name', label: 'Kategori' },
            { key: 'location_name', label: 'Lokasi' },
            { key: 'brand_model', label: 'Merek / Model' },
            { key: 'condition_status', label: 'Kondisi Fisik' },
            { key: 'operational_status', label: 'Status Operasional' },
            { key: 'purchase_value', label: 'Nilai Perolehan (IDR)' },
          ],
          items: initialDevices.map((d) => ({
            ...d,
            brand_model: `${d.brand} ${d.model}`,
          })),
        },
      });
    } else if (type === 'decisions') {
      return mockResponse({
        success: true,
        data: {
          type: 'decisions',
          title: 'Laporan Keputusan Pimpinan atas Rekomendasi SAW',
          columns: [
            { key: 'rank_position', label: 'Peringkat' },
            { key: 'device_code', label: 'Kode Perangkat' },
            { key: 'device_name', label: 'Nama Perangkat' },
            { key: 'priority_band', label: 'Prioritas' },
            { key: 'recommendation', label: 'Rekomendasi Sistem' },
            { key: 'decision_status', label: 'Keputusan Pimpinan' },
            { key: 'decision_note', label: 'Arahan / Catatan' },
            { key: 'decision_by_name', label: 'Ditetapkan Oleh' },
            { key: 'decision_at', label: 'Tanggal Keputusan' },
          ],
          items: initialSawRanking,
        },
      });
    } else if (type === 'repairs') {
      return mockResponse({
        success: true,
        data: {
          type: 'repairs',
          title: 'Laporan Pelaksanaan Tindak Lanjut Perbaikan & Upgrade',
          columns: [
            { key: 'id', label: 'ID Tugas' },
            { key: 'device_code', label: 'Kode Perangkat' },
            { key: 'device_name', label: 'Nama Perangkat' },
            { key: 'action_type', label: 'Jenis Tindakan' },
            { key: 'problem_description', label: 'Permasalahan' },
            { key: 'action_taken', label: 'Tindakan Teknisi' },
            { key: 'estimated_cost', label: 'Estimasi Biaya' },
            { key: 'actual_cost', label: 'Biaya Riil' },
            { key: 'status', label: 'Status' },
            { key: 'handler_name', label: 'Petugas' },
          ],
          items: initialRepairs,
        },
      });
    }
  }

  // 15. Activity logs, Users & Notifications
  if (
    cleanUrl.startsWith('/api/v1/activity-logs') ||
    cleanUrl.startsWith('/api/v1/notifications') ||
    cleanUrl.startsWith('/api/v1/users')
  ) {
    return mockResponse({
      success: true,
      data: [
        {
          id: 1,
          action: 'SAW_CALCULATION',
          description: 'Kalkulasi SAW Periode Oktober 2026 selesai (6 perangkat diperingkatkan).',
          created_at: new Date().toISOString(),
          user_name: 'Admin Demo',
        },
      ],
    });
  }

  // 16. Damage docs
  if (cleanUrl.startsWith('/api/v1/damage-documentation')) {
    return mockResponse({ success: true, data: [] });
  }

  // Generic fallback
  return mockResponse({ success: true, data: [] });
}

// Global window.fetch wrap
const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';

  // Non-API routes proceed normally
  if (!url.startsWith('/api/v1/')) {
    return originalFetch(input, init);
  }

  // CRITICAL FIX FOR VERCEL:
  // When running on Vercel or any public static hosting (non-localhost),
  // there is NO backend server listening at /api/v1. Vercel returns HTTP 405 or 404
  // with an empty body, causing res.json() to fail with "Unexpected end of JSON input".
  // Therefore, all /api/v1 routes on non-localhost domains MUST be resolved directly by handleMockRequest!
  const isStandaloneDomain =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (isStandaloneDomain) {
    return await handleMockRequest(url, init);
  }

  // On localhost, attempt connecting to local Express backend first
  try {
    const response = await originalFetch(input, init);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response;
    }
    // If backend returned HTML or empty, fall back to mock
    return await handleMockRequest(url, init);
  } catch {
    // Backend offline / connection refused on localhost
    return await handleMockRequest(url, init);
  }
};
