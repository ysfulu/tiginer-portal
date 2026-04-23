const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

/* ── Data files ──────────────────────────────────────── */
const dataDir = path.join(__dirname, 'data');
const customersFile = path.join(dataDir, 'customers.json');
const demosFile = path.join(dataDir, 'demos.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(customersFile)) fs.writeFileSync(customersFile, '[]', 'utf8');
if (!fs.existsSync(demosFile)) fs.writeFileSync(demosFile, '[]', 'utf8');

/* ── Middleware ───────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.use('/assets', express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

/* ── Helpers ─────────────────────────────────────────── */
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function readCustomers() { return readJSON(customersFile); }
function writeCustomers(c) { writeJSON(customersFile, c); }
function readDemos() { return readJSON(demosFile); }
function writeDemos(d) { writeJSON(demosFile, d); }

function authRequired(req, res, next) {
  if (!req.session?.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}
function nowIso() { return new Date().toISOString(); }
function uid(prefix) { return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`; }
function licenseKey() { return `TGN-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }

/* ── Public pages ────────────────────────────────────── */
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/demo', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'demo.html')));
app.get('/download', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'download.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* ── Public: download files ──────────────────────────── */
const releasesDir = path.join(__dirname, 'releases');

app.get('/api/download/latest', (_req, res) => {
  try {
    // Prefer the clean setup package (no source code)
    const setupZip = path.join(releasesDir, 'tiginer-nms-setup.zip');
    if (fs.existsSync(setupZip)) return res.download(setupZip, 'tiginer-nms-setup.zip');
    const files = fs.readdirSync(releasesDir).filter(f => f.endsWith('.zip')).sort().reverse();
    if (files.length === 0) return res.status(404).json({ error: 'Henuz indirilebilir surum yok' });
    const filePath = path.join(releasesDir, files[0]);
    res.download(filePath, files[0]);
  } catch (_) {
    res.status(404).json({ error: 'Henuz indirilebilir surum yok' });
  }
});

app.get('/api/download/docs', (_req, res) => {
  const docPath = path.join(releasesDir, 'templates', 'KURULUM.md');
  if (!fs.existsSync(docPath)) return res.status(404).json({ error: 'Dokuman bulunamadi' });
  res.download(docPath, 'Tiginer-Kurulum-Rehberi.md');
});

app.get('/api/download/list', (_req, res) => {
  try {
    const files = fs.readdirSync(releasesDir)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const stat = fs.statSync(path.join(releasesDir, f));
        return { name: f, size: stat.size, date: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    res.json({ releases: files });
  } catch (_) {
    res.json({ releases: [] });
  }
});

/* ── Public: demo request ────────────────────────────── */
app.post('/api/demo-request', (req, res) => {
  const { companyName, contactName, email, phone, deviceCount, message } = req.body || {};
  if (!companyName || !contactName || !email) {
    return res.status(400).json({ error: 'companyName, contactName ve email zorunludur' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Gecerli bir e-posta adresi giriniz' });
  }
  const demos = readDemos();
  const item = {
    id: uid('demo'),
    companyName: String(companyName).slice(0, 200),
    contactName: String(contactName).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: String(phone || '').slice(0, 30),
    deviceCount: Number(deviceCount) || 0,
    message: String(message || '').slice(0, 1000),
    status: 'pending',
    notes: '',
    createdAt: nowIso(),
  };
  demos.push(item);
  writeDemos(demos);
  return res.status(201).json({ ok: true, message: 'Demo talebiniz alindi. En kisa surede donecegiz.' });
});

/* ── Admin: auth ─────────────────────────────────────── */
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'change-me';
  if (username === adminUser && password === adminPass) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Gecersiz kullanici adi veya sifre' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/me', (req, res) => {
  res.json({ authenticated: !!req.session?.isAdmin });
});

/* ── Admin: dashboard stats ──────────────────────────── */
app.get('/api/admin/stats', authRequired, (_req, res) => {
  const customers = readCustomers();
  const demos = readDemos();
  res.json({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    suspendedCustomers: customers.filter(c => c.status === 'suspended').length,
    expiredCustomers: customers.filter(c => c.status === 'expired').length,
    totalDemos: demos.length,
    pendingDemos: demos.filter(d => d.status === 'pending').length,
  });
});

/* ── Admin: customers / licenses ─────────────────────── */
app.get('/api/admin/customers', authRequired, (req, res) => {
  let items = readCustomers();
  const { status, search } = req.query;
  if (status) items = items.filter(c => c.status === status);
  if (search) {
    const s = String(search).toLowerCase();
    items = items.filter(c =>
      c.companyName.toLowerCase().includes(s) ||
      c.contactEmail.toLowerCase().includes(s) ||
      c.licenseKey.toLowerCase().includes(s)
    );
  }
  res.json({ items });
});

app.post('/api/admin/customers', authRequired, (req, res) => {
  const { companyName, contactEmail, contactName, plan = 'BASIC', expiresAt = '', deviceLimit = 0 } = req.body || {};
  if (!companyName || !contactEmail) {
    return res.status(400).json({ error: 'companyName ve contactEmail zorunludur' });
  }
  const customers = readCustomers();
  const item = {
    id: uid('cus'),
    licenseKey: licenseKey(),
    companyName: String(companyName).slice(0, 200),
    contactEmail: String(contactEmail).slice(0, 200),
    contactName: String(contactName || '').slice(0, 200),
    plan,
    status: 'active',
    deviceLimit: Number(deviceLimit) || 0,
    expiresAt: expiresAt || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  customers.push(item);
  writeCustomers(customers);
  return res.status(201).json(item);
});

app.patch('/api/admin/customers/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const { plan, status, expiresAt, contactName, contactEmail, deviceLimit } = req.body || {};
  const customers = readCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Musteri bulunamadi' });

  if (plan) customers[idx].plan = plan;
  if (status) customers[idx].status = status;
  if (typeof expiresAt === 'string') customers[idx].expiresAt = expiresAt;
  if (contactName) customers[idx].contactName = contactName;
  if (contactEmail) customers[idx].contactEmail = contactEmail;
  if (typeof deviceLimit === 'number') customers[idx].deviceLimit = deviceLimit;
  customers[idx].updatedAt = nowIso();
  writeCustomers(customers);
  return res.json(customers[idx]);
});

app.delete('/api/admin/customers/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const customers = readCustomers();
  const next = customers.filter(c => c.id !== id);
  if (next.length === customers.length) return res.status(404).json({ error: 'Musteri bulunamadi' });
  writeCustomers(next);
  return res.json({ ok: true });
});

/* ── Admin: demo requests ────────────────────────────── */
app.get('/api/admin/demos', authRequired, (req, res) => {
  let items = readDemos();
  const { status } = req.query;
  if (status) items = items.filter(d => d.status === status);
  res.json({ items });
});

app.patch('/api/admin/demos/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body || {};
  const demos = readDemos();
  const idx = demos.findIndex(d => d.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Demo talebi bulunamadi' });
  if (status) demos[idx].status = status;
  if (typeof notes === 'string') demos[idx].notes = notes.slice(0, 1000);
  writeDemos(demos);
  return res.json(demos[idx]);
});

app.delete('/api/admin/demos/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const demos = readDemos();
  const next = demos.filter(d => d.id !== id);
  if (next.length === demos.length) return res.status(404).json({ error: 'Demo talebi bulunamadi' });
  writeDemos(next);
  return res.json({ ok: true });
});

/* ── License Server Proxy (admin → license-server:4100) ─ */
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:4100';
const LICENSE_ADMIN_SECRET = process.env.LICENSE_ADMIN_SECRET || 'tiginer-admin-2026-secret';

// NMS instances to notify on license change (comma-separated URLs)
// e.g. "http://localhost:3002,http://192.168.1.100:3002"
const NMS_INSTANCES = (process.env.NMS_INSTANCES || 'http://localhost:3002').split(',').map(u => u.trim()).filter(Boolean);
// Must match NMS container's INTERNAL_API_SECRET
const NMS_WEBHOOK_SECRET = process.env.NMS_WEBHOOK_SECRET || 'super-secret-key-change-me';

async function proxyToLicenseServer(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': LICENSE_ADMIN_SECRET },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${LICENSE_SERVER_URL}${path}`, opts);
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

/** Notify all NMS instances to refresh their license immediately */
async function notifyNmsInstances() {
  const results = await Promise.allSettled(
    NMS_INSTANCES.map(url =>
      fetch(`${url}/api/license/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': NMS_WEBHOOK_SECRET,
          'x-license-webhook-secret': NMS_WEBHOOK_SECRET,
        },
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json())
    )
  );
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[NMS Notify] ${NMS_INSTANCES[i]}: plan=${r.value.plan}, modules=[${r.value.modules}]`);
    } else {
      console.warn(`[NMS Notify] ${NMS_INSTANCES[i]}: ${r.reason?.message || 'failed'}`);
    }
  });
}

app.get('/api/admin/licenses', authRequired, async (_req, res) => {
  try {
    const { status, data } = await proxyToLicenseServer('GET', '/v1/admin/licenses');
    res.status(status).json(data);
  } catch { res.status(502).json({ error: 'Lisans sunucusuna baglanilamadi' }); }
});

app.get('/api/admin/licenses/:id', authRequired, async (req, res) => {
  try {
    const { status, data } = await proxyToLicenseServer('GET', `/v1/admin/licenses/${req.params.id}`);
    res.status(status).json(data);
  } catch { res.status(502).json({ error: 'Lisans sunucusuna baglanilamadi' }); }
});

app.patch('/api/admin/licenses/:id', authRequired, async (req, res) => {
  try {
    const { status, data } = await proxyToLicenseServer('PATCH', `/v1/admin/licenses/${req.params.id}`, req.body);
    res.status(status).json(data);
    // Notify NMS instances in background (don't block response)
    if (status >= 200 && status < 300) {
      notifyNmsInstances().catch(() => {});
    }
  } catch { res.status(502).json({ error: 'Lisans sunucusuna baglanilamadi' }); }
});

app.delete('/api/admin/licenses/:id', authRequired, async (req, res) => {
  try {
    const { status, data } = await proxyToLicenseServer('DELETE', `/v1/admin/licenses/${req.params.id}`);
    res.status(status).json(data);
  } catch { res.status(502).json({ error: 'Lisans sunucusuna baglanilamadi' }); }
});

app.get('/api/admin/license-stats', authRequired, async (_req, res) => {
  try {
    const { status, data } = await proxyToLicenseServer('GET', '/v1/admin/stats');
    res.status(status).json(data);
  } catch { res.status(502).json({ error: 'Lisans sunucusuna baglanilamadi' }); }
});

/* ── Public: license verification ────────────────────── */
app.get('/api/license/verify', (req, res) => {
  const key = String(req.query.key || '');
  if (!key) return res.status(400).json({ valid: false, error: 'key is required' });
  const customer = readCustomers().find(c => c.licenseKey === key);
  if (!customer) return res.status(404).json({ valid: false, error: 'license not found' });
  if (customer.status !== 'active') return res.json({ valid: false, status: customer.status });
  if (customer.expiresAt && new Date(customer.expiresAt) < new Date()) {
    return res.json({ valid: false, status: 'expired' });
  }

  const planModules = {
    BASIC: ['core'],
    PRO: ['core', 'automation', 'config_backup', 'config_audit'],
    ENT: ['core', 'automation', 'config_backup', 'config_audit', 'security_compliance', 'netflow', 'reports'],
  };
  return res.json({
    valid: true,
    status: customer.status,
    plan: customer.plan,
    expiresAt: customer.expiresAt,
    deviceLimit: customer.deviceLimit || 0,
    modules: planModules[customer.plan] || planModules.BASIC,
  });
});

/* ══════════════════════════════════════════════════════════════
   UPDATE SYSTEM — Release manifest + license-gated update check
   ══════════════════════════════════════════════════════════════ */

const updateDir = path.join(__dirname, 'update');
const releasesManifest = path.join(updateDir, 'releases.json');

// Plan hiyerarşisi — yüksek tier daha düşük tier'ı kapsar
const TIER_ORDER = { BASIC: 1, PRO: 2, ENT: 3 };

function readManifest() {
  try {
    let raw = fs.readFileSync(releasesManifest, 'utf8');
    // UTF-8 BOM varsa temizle (PowerShell'in ürettiği dosyalar için)
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return { product: 'tiginer-client', releases: [] };
  }
}

function compareSemver(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function latestForPlatform(manifest, platform) {
  const list = (manifest.releases || []).filter(r => r.platform === platform);
  if (list.length === 0) return null;
  return list.sort((a, b) => compareSemver(b.version, a.version))[0];
}

function tierAllows(customerPlan, minTier) {
  const cust = TIER_ORDER[String(customerPlan || 'BASIC').toUpperCase()] || 0;
  const min = TIER_ORDER[String(minTier || 'BASIC').toUpperCase()] || 0;
  return cust >= min;
}

/* ── Public: manifest (download.html kullanır) ─────────── */
app.get('/api/update/manifest', (_req, res) => {
  const manifest = readManifest();
  // Sadece public alanları dön — sha256, URL, versiyon
  const safe = {
    product: manifest.product,
    generatedAt: manifest.generatedAt,
    releases: (manifest.releases || []).map(r => ({
      version: r.version,
      platform: r.platform,
      downloadUrl: r.downloadUrl,
      sha256: r.sha256,
      sizeBytes: r.sizeBytes || null,
      releaseNotes: r.releaseNotes,
      minTier: r.minTier,
      publishedAt: r.publishedAt,
      changelogUrl: r.changelogUrl,
    })),
  };
  res.set('Cache-Control', 'public, max-age=60');
  res.json(safe);
});

/* ── Public: latest version info (hafif) ───────────────── */
app.get('/api/update/latest', (req, res) => {
  const platform = String(req.query.platform || 'linux-x64');
  const manifest = readManifest();
  const latest = latestForPlatform(manifest, platform);
  if (!latest) return res.status(404).json({ error: 'No release for platform' });
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    version: latest.version,
    platform: latest.platform,
    downloadUrl: latest.downloadUrl,
    sha256: latest.sha256,
    sizeBytes: latest.sizeBytes || null,
    releaseNotes: latest.releaseNotes,
    minTier: latest.minTier,
    publishedAt: latest.publishedAt,
  });
});

/* ── NMS Client: lisans doğrulamalı güncelleme kontrolü ── */
// NMS her 24 saatte bir bu endpoint'e gelir.
// Body: { licenseKey, currentVersion, platform, instanceId? }
app.post('/api/update/check', (req, res) => {
  const { licenseKey, currentVersion, platform, instanceId } = req.body || {};

  if (!licenseKey || !currentVersion || !platform) {
    return res.status(400).json({
      error: 'licenseKey, currentVersion, platform zorunlu',
    });
  }

  // 1) Lisans doğrula
  const customer = readCustomers().find(c => c.licenseKey === licenseKey);
  if (!customer) {
    return res.status(403).json({ error: 'invalid_license' });
  }
  if (customer.status !== 'active') {
    return res.status(403).json({ error: 'license_' + customer.status });
  }
  if (customer.expiresAt && new Date(customer.expiresAt) < new Date()) {
    return res.status(403).json({ error: 'license_expired' });
  }

  // 2) Manifest'ten en son versiyonu bul
  const manifest = readManifest();
  const latest = latestForPlatform(manifest, platform);
  if (!latest) {
    return res.json({ updateAvailable: false, reason: 'no_release' });
  }

  // 3) Plan tier kontrolü
  if (!tierAllows(customer.plan, latest.minTier)) {
    return res.json({
      updateAvailable: false,
      reason: 'tier_insufficient',
      requiredPlan: latest.minTier,
      currentPlan: customer.plan,
    });
  }

  // 4) Versiyon karşılaştır
  const cmp = compareSemver(latest.version, currentVersion);
  if (cmp <= 0) {
    return res.json({
      updateAvailable: false,
      currentVersion,
      latestVersion: latest.version,
    });
  }

  // 5) Güncelleme mevcut
  return res.json({
    updateAvailable: true,
    currentVersion,
    latestVersion: latest.version,
    downloadUrl: latest.downloadUrl,
    sha256: latest.sha256,
    sizeBytes: latest.sizeBytes || null,
    releaseNotes: latest.releaseNotes,
    publishedAt: latest.publishedAt,
    changelogUrl: latest.changelogUrl,
    mandatory: latest.mandatory === true,
  });
});

/* ── Admin: manifest yönetimi ──────────────────────────── */
app.get('/api/admin/releases', authRequired, (_req, res) => {
  res.json(readManifest());
});

app.post('/api/admin/releases', authRequired, (req, res) => {
  const { version, platform, downloadUrl, sha256, sizeBytes, releaseNotes, minTier, changelogUrl, mandatory } = req.body || {};
  if (!version || !platform || !downloadUrl || !sha256) {
    return res.status(400).json({ error: 'version, platform, downloadUrl, sha256 zorunlu' });
  }
  if (!/^[0-9a-f]{64}$/i.test(sha256)) {
    return res.status(400).json({ error: 'sha256 geçersiz (64 hex karakter)' });
  }
  if (!['linux-x64', 'windows-x64', 'darwin-x64', 'darwin-arm64'].includes(platform)) {
    return res.status(400).json({ error: 'geçersiz platform' });
  }
  if (!fs.existsSync(updateDir)) fs.mkdirSync(updateDir, { recursive: true });

  const manifest = readManifest();
  manifest.product = manifest.product || 'tiginer-client';
  manifest.generatedAt = nowIso();
  manifest.releases = manifest.releases || [];

  // Aynı version+platform varsa üzerine yaz, yoksa ekle
  const idx = manifest.releases.findIndex(r => r.version === version && r.platform === platform);
  const record = {
    version: String(version),
    platform,
    downloadUrl: String(downloadUrl),
    sha256: String(sha256).toLowerCase(),
    sizeBytes: Number(sizeBytes) || null,
    releaseNotes: String(releaseNotes || '').slice(0, 2000),
    minTier: (minTier || 'BASIC').toUpperCase(),
    mandatory: mandatory === true,
    publishedAt: nowIso(),
    changelogUrl: changelogUrl || 'https://tiginer.com/changelog',
  };
  if (idx >= 0) manifest.releases[idx] = record;
  else manifest.releases.push(record);

  fs.writeFileSync(releasesManifest, JSON.stringify(manifest, null, 2), 'utf8');
  res.status(201).json(record);
});

app.delete('/api/admin/releases', authRequired, (req, res) => {
  const { version, platform } = req.query;
  if (!version || !platform) {
    return res.status(400).json({ error: 'version ve platform zorunlu' });
  }
  const manifest = readManifest();
  const before = (manifest.releases || []).length;
  manifest.releases = (manifest.releases || []).filter(
    r => !(r.version === version && r.platform === platform)
  );
  if (manifest.releases.length === before) {
    return res.status(404).json({ error: 'Sürüm bulunamadı' });
  }
  manifest.generatedAt = nowIso();
  fs.writeFileSync(releasesManifest, JSON.stringify(manifest, null, 2), 'utf8');
  res.json({ ok: true });
});

/* ── Start ───────────────────────────────────────────── */
app.listen(port, () => {
  console.log(`Tiginer portal ready at http://localhost:${port}`);
});
