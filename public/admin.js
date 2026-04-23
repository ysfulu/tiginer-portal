/* ── DOM refs ──────────────────────────────────────── */
const loginBox = document.getElementById('loginBox');
const panelBox = document.getElementById('panelBox');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

// Stats
const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statSuspended = document.getElementById('statSuspended');
const statDemos = document.getElementById('statDemos');

// Customer tab
const cusBody = document.getElementById('cusBody');
const cusEmpty = document.getElementById('cusEmpty');
const cusSearch = document.getElementById('cusSearch');
const cusFilter = document.getElementById('cusFilter');
const addCustomerBtn = document.getElementById('addCustomerBtn');

// Demo tab
const demoBody = document.getElementById('demoBody');
const demoEmpty = document.getElementById('demoEmpty');
const demoFilter = document.getElementById('demoFilter');

// Customer modal
const customerModal = document.getElementById('customerModal');
const customerForm = document.getElementById('customerForm');
const modalTitle = document.getElementById('modalTitle');
const cancelModal = document.getElementById('cancelModal');

// Demo modal
const demoModal = document.getElementById('demoModal');
const demoDetail = document.getElementById('demoDetail');
const demoNotes = document.getElementById('demoNotes');
const cancelDemoModal = document.getElementById('cancelDemoModal');
const saveDemoNotes = document.getElementById('saveDemoNotes');

let currentDemoId = null;

/* ── API helper ───────────────────────────────────── */
async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Istek basarisiz');
  return data;
}

/* ── Tabs ──────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'releases') loadReleases();
  });
});

/* ── Stats ─────────────────────────────────────────── */
async function loadStats() {
  try {
    const s = await api('/api/admin/stats');
    statTotal.textContent = s.totalCustomers;
    statActive.textContent = s.activeCustomers;
    statSuspended.textContent = s.suspendedCustomers;
    statDemos.textContent = s.pendingDemos;
  } catch (_) { /* skip */ }
}

/* ── Customers ─────────────────────────────────────── */
function statusBadge(status) {
  const map = {
    active: ['Aktif', 'badge-green'],
    suspended: ['Askida', 'badge-yellow'],
    expired: ['Suresi Dolmus', 'badge-red'],
  };
  const [label, cls] = map[status] || [status, 'badge-gray'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function planBadge(plan) {
  const map = { BASIC: 'badge-gray', PRO: 'badge-blue', ENT: 'badge-blue' };
  return `<span class="badge ${map[plan] || 'badge-gray'}">${plan}</span>`;
}

function customerRow(c) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><strong>${esc(c.companyName)}</strong></td>
    <td>${esc(c.contactName || '-')}</td>
    <td>${esc(c.contactEmail)}</td>
    <td>${planBadge(c.plan)}</td>
    <td>${statusBadge(c.status)}</td>
    <td><code>${esc(c.licenseKey)}</code></td>
    <td>${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('tr-TR') : '-'}</td>
    <td>
      ${c.status === 'active'
        ? `<button class="btn btn-sm btn-warn" data-action="suspend" data-id="${c.id}">Askiya Al</button>`
        : `<button class="btn btn-sm btn-success" data-action="activate" data-id="${c.id}">Aktifle</button>`
      }
      <button class="btn btn-sm btn-outline" data-action="edit" data-id="${c.id}">Duzenle</button>
      <button class="btn btn-sm btn-danger" data-action="delete" data-id="${c.id}">Sil</button>
    </td>
  `;
  return tr;
}

let allCustomers = [];

async function loadCustomers() {
  try {
    const data = await api('/api/admin/customers');
    allCustomers = data.items;
    renderCustomers();
  } catch (err) {
    console.error(err);
  }
}

function renderCustomers() {
  let items = allCustomers;
  const search = cusSearch.value.toLowerCase().trim();
  const status = cusFilter.value;
  if (status) items = items.filter((c) => c.status === status);
  if (search) {
    items = items.filter(
      (c) =>
        c.companyName.toLowerCase().includes(search) ||
        c.contactEmail.toLowerCase().includes(search) ||
        c.licenseKey.toLowerCase().includes(search)
    );
  }
  cusBody.innerHTML = '';
  if (items.length === 0) {
    cusEmpty.classList.remove('hidden');
  } else {
    cusEmpty.classList.add('hidden');
    items.forEach((c) => cusBody.appendChild(customerRow(c)));
  }
}

cusSearch.addEventListener('input', renderCustomers);
cusFilter.addEventListener('change', renderCustomers);

/* Customer actions */
cusBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { id, action } = btn.dataset;
  try {
    if (action === 'delete') {
      if (!confirm('Bu musteriyi silmek istediginize emin misiniz?')) return;
      await api(`/api/admin/customers/${id}`, { method: 'DELETE' });
    } else if (action === 'suspend') {
      await api(`/api/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) });
    } else if (action === 'activate') {
      await api(`/api/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
    } else if (action === 'edit') {
      openEditModal(id);
      return;
    }
    await loadCustomers();
    await loadStats();
  } catch (err) {
    alert(err.message);
  }
});

/* ── Customer Modal ───────────────────────────────── */
addCustomerBtn.addEventListener('click', () => openAddModal());

function openAddModal() {
  modalTitle.textContent = 'Musteri Ekle';
  document.getElementById('editId').value = '';
  document.getElementById('mCompany').value = '';
  document.getElementById('mContact').value = '';
  document.getElementById('mEmail').value = '';
  document.getElementById('mPlan').value = 'BASIC';
  document.getElementById('mExpires').value = '';
  document.getElementById('mDeviceLimit').value = '0';
  customerModal.classList.remove('hidden');
}

function openEditModal(id) {
  const c = allCustomers.find((x) => x.id === id);
  if (!c) return;
  modalTitle.textContent = 'Musteri Duzenle';
  document.getElementById('editId').value = c.id;
  document.getElementById('mCompany').value = c.companyName;
  document.getElementById('mContact').value = c.contactName || '';
  document.getElementById('mEmail').value = c.contactEmail;
  document.getElementById('mPlan').value = c.plan;
  document.getElementById('mExpires').value = c.expiresAt ? c.expiresAt.split('T')[0] : '';
  document.getElementById('mDeviceLimit').value = c.deviceLimit || 0;
  customerModal.classList.remove('hidden');
}

cancelModal.addEventListener('click', () => customerModal.classList.add('hidden'));
customerModal.addEventListener('click', (e) => {
  if (e.target === customerModal) customerModal.classList.add('hidden');
});

customerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const payload = {
    companyName: document.getElementById('mCompany').value.trim(),
    contactName: document.getElementById('mContact').value.trim(),
    contactEmail: document.getElementById('mEmail').value.trim(),
    plan: document.getElementById('mPlan').value,
    expiresAt: document.getElementById('mExpires').value,
    deviceLimit: Number(document.getElementById('mDeviceLimit').value) || 0,
  };
  try {
    if (editId) {
      await api(`/api/admin/customers/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      await api('/api/admin/customers', { method: 'POST', body: JSON.stringify(payload) });
    }
    customerModal.classList.add('hidden');
    await loadCustomers();
    await loadStats();
  } catch (err) {
    alert(err.message);
  }
});

/* ── Demo Requests ─────────────────────────────────── */
function demoStatusBadge(status) {
  const map = {
    pending: ['Bekliyor', 'badge-yellow'],
    contacted: ['Iletisime Gecildi', 'badge-blue'],
    converted: ['Donusturuldu', 'badge-green'],
    rejected: ['Reddedildi', 'badge-red'],
  };
  const [label, cls] = map[status] || [status, 'badge-gray'];
  return `<span class="badge ${cls}">${label}</span>`;
}

let allDemos = [];

async function loadDemos() {
  try {
    const data = await api('/api/admin/demos');
    allDemos = data.items;
    renderDemos();
  } catch (err) {
    console.error(err);
  }
}

function renderDemos() {
  let items = allDemos;
  const status = demoFilter.value;
  if (status) items = items.filter((d) => d.status === status);
  demoBody.innerHTML = '';
  if (items.length === 0) {
    demoEmpty.classList.remove('hidden');
  } else {
    demoEmpty.classList.add('hidden');
    items.forEach((d) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${esc(d.companyName)}</strong></td>
        <td>${esc(d.contactName)}</td>
        <td>${esc(d.email)}</td>
        <td>${esc(d.phone || '-')}</td>
        <td>${d.deviceCount || '-'}</td>
        <td>${demoStatusBadge(d.status)}</td>
        <td>${new Date(d.createdAt).toLocaleDateString('tr-TR')}</td>
        <td>
          <button class="btn btn-sm btn-outline" data-demo-action="detail" data-id="${d.id}">Detay</button>
          ${d.status === 'pending' ? `<button class="btn btn-sm btn-success" data-demo-action="contacted" data-id="${d.id}">Iletisime Gecildi</button>` : ''}
          ${d.status === 'contacted' ? `<button class="btn btn-sm btn-success" data-demo-action="converted" data-id="${d.id}">Donustur</button>` : ''}
          <button class="btn btn-sm btn-danger" data-demo-action="delete" data-id="${d.id}">Sil</button>
        </td>
      `;
      demoBody.appendChild(tr);
    });
  }
}

demoFilter.addEventListener('change', renderDemos);

demoBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { id } = btn.dataset;
  const action = btn.dataset.demoAction;
  try {
    if (action === 'delete') {
      if (!confirm('Bu demo talebini silmek istediginize emin misiniz?')) return;
      await api(`/api/admin/demos/${id}`, { method: 'DELETE' });
      await loadDemos();
      await loadStats();
    } else if (action === 'contacted' || action === 'converted' || action === 'rejected') {
      await api(`/api/admin/demos/${id}`, { method: 'PATCH', body: JSON.stringify({ status: action }) });
      await loadDemos();
      await loadStats();
    } else if (action === 'detail') {
      openDemoDetail(id);
    }
  } catch (err) {
    alert(err.message);
  }
});

function openDemoDetail(id) {
  const d = allDemos.find((x) => x.id === id);
  if (!d) return;
  currentDemoId = id;
  demoDetail.innerHTML = `
    <p><strong>Firma:</strong> ${esc(d.companyName)}</p>
    <p><strong>Yetkili:</strong> ${esc(d.contactName)}</p>
    <p><strong>E-posta:</strong> ${esc(d.email)}</p>
    <p><strong>Telefon:</strong> ${esc(d.phone || '-')}</p>
    <p><strong>Cihaz Sayisi:</strong> ${d.deviceCount || '-'}</p>
    <p><strong>Mesaj:</strong> ${esc(d.message || '-')}</p>
    <p><strong>Durum:</strong> ${demoStatusBadge(d.status)}</p>
    <p><strong>Tarih:</strong> ${new Date(d.createdAt).toLocaleString('tr-TR')}</p>
  `;
  demoNotes.value = d.notes || '';
  demoModal.classList.remove('hidden');
}

cancelDemoModal.addEventListener('click', () => demoModal.classList.add('hidden'));
demoModal.addEventListener('click', (e) => {
  if (e.target === demoModal) demoModal.classList.add('hidden');
});

saveDemoNotes.addEventListener('click', async () => {
  if (!currentDemoId) return;
  try {
    await api(`/api/admin/demos/${currentDemoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: demoNotes.value }),
    });
    demoModal.classList.add('hidden');
    await loadDemos();
  } catch (err) {
    alert(err.message);
  }
});

/* ── License Server Management ─────────────────────── */
const licBody = document.getElementById('licBody');
const licEmpty = document.getElementById('licEmpty');
const licSearch = document.getElementById('licSearch');
const licFilter = document.getElementById('licFilter');
const licenseModal = document.getElementById('licenseModal');
const licenseForm = document.getElementById('licenseForm');
const cancelLicenseModal = document.getElementById('cancelLicenseModal');

let allLicenses = [];

function licPlanBadge(plan) {
  const map = { starter: ['STARTER', 'badge-gray'], professional: ['PRO', 'badge-blue'], enterprise: ['ENT', 'badge-blue'] };
  const [label, cls] = map[plan] || [plan, 'badge-gray'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function modulesList(modules) {
  if (!modules || !modules.length) return '<span style="color:#64748b">-</span>';
  return modules.map(m => `<span class="badge badge-gray" style="font-size:10px;padding:2px 6px;">${esc(m)}</span>`).join(' ');
}

function licenseRow(l) {
  const tr = document.createElement('tr');
  const activationInfo = l.activations && l.activations.length > 0
    ? `<span class="badge badge-green" style="font-size:10px;">${l.activations.length} aktif</span>`
    : '<span style="color:#64748b;font-size:12px;">Yok</span>';
  const validDate = l.validUntil ? new Date(l.validUntil).toLocaleDateString('tr-TR') : '-';
  tr.innerHTML = `
    <td><strong>${esc(l.customerName)}</strong><br><small style="color:#64748b">${esc(l.customerEmail)}</small></td>
    <td><code style="font-size:11px;">${esc(l.licenseKey)}</code></td>
    <td>${licPlanBadge(l.plan)}</td>
    <td>${modulesList(l.modules)}</td>
    <td>${statusBadge(l.status)}</td>
    <td>${l.maxDevices || '-'}</td>
    <td>${validDate}</td>
    <td>${activationInfo}</td>
    <td>
      <button class="btn btn-sm btn-outline" data-lic-action="edit" data-id="${l.id}">Duzenle</button>
    </td>
  `;
  return tr;
}

async function loadLicenses() {
  try {
    const data = await api('/api/admin/licenses');
    allLicenses = data.licenses || [];
    renderLicenses();
  } catch (err) {
    console.error('License server error:', err);
    allLicenses = [];
    renderLicenses();
  }
}

function renderLicenses() {
  let items = allLicenses;
  const search = licSearch.value.toLowerCase().trim();
  const status = licFilter.value;
  if (status) items = items.filter(l => l.status === status);
  if (search) {
    items = items.filter(l =>
      (l.customerName || '').toLowerCase().includes(search) ||
      (l.customerEmail || '').toLowerCase().includes(search) ||
      (l.licenseKey || '').toLowerCase().includes(search)
    );
  }
  licBody.innerHTML = '';
  if (items.length === 0) {
    licEmpty.classList.remove('hidden');
  } else {
    licEmpty.classList.add('hidden');
    items.forEach(l => licBody.appendChild(licenseRow(l)));
  }
}

licSearch.addEventListener('input', renderLicenses);
licFilter.addEventListener('change', renderLicenses);

/* License actions */
licBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { id } = btn.dataset;
  const action = btn.dataset.licAction;
  if (action === 'edit') openLicenseEditModal(id);
});

function openLicenseEditModal(id) {
  const l = allLicenses.find(x => x.id === id);
  if (!l) return;
  document.getElementById('licEditId').value = l.id;
  document.getElementById('licCustomerName').value = l.customerName || '';
  document.getElementById('licCustomerEmail').value = l.customerEmail || '';
  document.getElementById('licPlan').value = l.plan || 'starter';
  document.getElementById('licStatus').value = l.status || 'active';
  document.getElementById('licMaxDevices').value = l.maxDevices || 50;
  document.getElementById('licMaxUsers').value = l.maxUsers || 3;
  document.getElementById('licValidUntil').value = l.validUntil ? l.validUntil.split('T')[0] : '';
  // Set module checkboxes
  const mods = l.modules || [];
  document.querySelectorAll('#licModules input[type="checkbox"]').forEach(cb => {
    cb.checked = mods.includes(cb.value);
  });
  licenseModal.classList.remove('hidden');
}

cancelLicenseModal.addEventListener('click', () => licenseModal.classList.add('hidden'));
licenseModal.addEventListener('click', (e) => { if (e.target === licenseModal) licenseModal.classList.add('hidden'); });

licenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('licEditId').value;
  const modules = [];
  document.querySelectorAll('#licModules input[type="checkbox"]:checked').forEach(cb => modules.push(cb.value));
  const payload = {
    plan: document.getElementById('licPlan').value,
    status: document.getElementById('licStatus').value,
    maxDevices: Number(document.getElementById('licMaxDevices').value) || 50,
    maxUsers: Number(document.getElementById('licMaxUsers').value) || 3,
    modules,
    validUntil: document.getElementById('licValidUntil').value || undefined,
  };
  try {
    await api(`/api/admin/licenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    licenseModal.classList.add('hidden');
    await loadLicenses();
    alert('Lisans guncellendi! NMS anlik olarak yeni lisans bilgilerini aldi.');
  } catch (err) {
    alert('Hata: ' + err.message);
  }
});

/* ── Auth ──────────────────────────────────────────── */
async function bootstrap() {
  try {
    const me = await api('/api/admin/me');
    if (me.authenticated) {
      loginBox.classList.add('hidden');
      panelBox.classList.remove('hidden');
      await Promise.all([loadStats(), loadCustomers(), loadDemos(), loadLicenses()]);
    } else {
      loginBox.classList.remove('hidden');
      panelBox.classList.add('hidden');
    }
  } catch (_) {
    loginBox.classList.remove('hidden');
    panelBox.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
      }),
    });
    await bootstrap();
  } catch (err) {
    alert(err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  await bootstrap();
});

/* ── XSS prevention ──────────────────────────────── */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ── Start ─────────────────────────────────────────── */
bootstrap().catch(console.error);

/* ══════════════════════════════════════════════════════════════
   RELEASE MANAGEMENT TAB
   ══════════════════════════════════════════════════════════════ */

const relBody = document.getElementById('relBody');
const relEmpty = document.getElementById('relEmpty');
const addReleaseBtn = document.getElementById('addReleaseBtn');
const releaseModal = document.getElementById('releaseModal');
const releaseForm = document.getElementById('releaseForm');
const releaseCancel = document.getElementById('releaseCancel');

function formatRelSize(n) {
  if (!n) return '-';
  const mb = n / 1024 / 1024;
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return mb.toFixed(1) + ' MB';
}

async function loadReleases() {
  try {
    const data = await api('/api/admin/releases');
    const releases = (data.releases || []).slice().sort((a, b) => {
      const c = String(b.version).localeCompare(String(a.version), undefined, { numeric: true });
      return c !== 0 ? c : String(a.platform).localeCompare(String(b.platform));
    });

    if (releases.length === 0) {
      relBody.innerHTML = '';
      relEmpty.classList.remove('hidden');
      return;
    }
    relEmpty.classList.add('hidden');
    relBody.innerHTML = releases.map(r => `
      <tr>
        <td><strong>v${esc(r.version)}</strong></td>
        <td><code style="font-size:12px;">${esc(r.platform)}</code></td>
        <td><span class="badge badge-gray">${esc(r.minTier || 'BASIC')}</span></td>
        <td>${formatRelSize(r.sizeBytes)}</td>
        <td>${r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('tr-TR') : '-'}</td>
        <td>${r.mandatory ? '<span class="badge badge-red">Zorunlu</span>' : '-'}</td>
        <td><code style="font-size:11px;" title="${esc(r.sha256 || '')}">${r.sha256 ? esc(r.sha256.slice(0, 12)) + '…' : '-'}</code></td>
        <td>
          <button class="btn-link" onclick="copyUrl('${esc(r.downloadUrl || '')}')" title="URL kopyala">URL</button>
          <button class="btn-link btn-danger" onclick="deleteRelease('${esc(r.version)}','${esc(r.platform)}')">Sil</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    relBody.innerHTML = '';
    relEmpty.textContent = 'Sürümler yüklenemedi: ' + err.message;
    relEmpty.classList.remove('hidden');
  }
}

window.copyUrl = function(url) {
  navigator.clipboard.writeText(url).then(() => alert('Kopyalandı: ' + url));
};

window.deleteRelease = async function(version, platform) {
  if (!confirm(`v${version} ${platform} silinsin mi?`)) return;
  try {
    await api(`/api/admin/releases?version=${encodeURIComponent(version)}&platform=${encodeURIComponent(platform)}`, {
      method: 'DELETE',
    });
    await loadReleases();
  } catch (err) {
    alert('Silinemedi: ' + err.message);
  }
};

if (addReleaseBtn) {
  addReleaseBtn.addEventListener('click', () => {
    releaseForm.reset();
    releaseModal.classList.remove('hidden');
  });
}

if (releaseCancel) {
  releaseCancel.addEventListener('click', () => releaseModal.classList.add('hidden'));
}

if (releaseForm) {
  releaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      version: document.getElementById('relVersion').value.trim(),
      platform: document.getElementById('relPlatform').value,
      downloadUrl: document.getElementById('relUrl').value.trim(),
      sha256: document.getElementById('relSha').value.trim().toLowerCase(),
      sizeBytes: parseInt(document.getElementById('relSize').value, 10) || null,
      minTier: document.getElementById('relTier').value,
      releaseNotes: document.getElementById('relNotes').value.trim(),
      mandatory: document.getElementById('relMandatory').checked,
    };
    try {
      await api('/api/admin/releases', { method: 'POST', body: JSON.stringify(payload) });
      releaseModal.classList.add('hidden');
      await loadReleases();
    } catch (err) {
      alert('Kaydedilemedi: ' + err.message);
    }
  });
}
