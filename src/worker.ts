/**
 * Tiginer Portal - Cloudflare Worker
 *
 * Replaces the legacy Express server.js. Uses:
 *  - ASSETS binding for static files (public/)
 *  - R2 (UPDATES_BUCKET) for release binaries + manifest
 *  - KV (PORTAL_KV) for customers, demos, admin sessions, audit
 *
 * Endpoints preserved from Express version so the existing
 * public/admin.html, download.html, demo.html continue to work.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';

export interface Env {
  ASSETS: Fetcher;
  UPDATES_BUCKET: R2Bucket;
  PORTAL_KV: KVNamespace;

  // Secrets (wrangler secret put ...)
  ADMIN_USER: string;
  ADMIN_PASS: string;
  SESSION_SECRET: string;
  LICENSE_SIGN_KEY?: string; // HMAC key for signed license JWTs
  LICENSE_SERVER_URL?: string;
  LICENSE_ADMIN_SECRET?: string;
  NMS_WEBHOOK_SECRET?: string;
  NMS_INSTANCES?: string;

  // Vars
  PUBLIC_R2_BASE: string;
  LICENSE_PLAN_MODULES: string;
}

type Variables = {
  isAdmin: boolean;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/* ──────────────────────────────────────────────────────────
   Keys in KV
   ────────────────────────────────────────────────────────── */
const K = {
  customers: 'customers:index',
  customer: (id: string) => `customer:${id}`,
  customerByKey: (key: string) => `customer:key:${key}`,
  demos: 'demos:index',
  demo: (id: string) => `demo:${id}`,
  manifest: 'manifest:releases',
  session: (token: string) => `session:${token}`,
  licenseMeta: (id: string) => `licensemeta:${id}`,
  activations: (id: string) => `activations:${id}`,
};

const PLAN_TO_UI: Record<string, string> = { BASIC: 'starter', PRO: 'professional', ENT: 'enterprise' };
const PLAN_FROM_UI: Record<string, 'BASIC' | 'PRO' | 'ENT'> = { starter: 'BASIC', professional: 'PRO', enterprise: 'ENT' };
const ACTIVATION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 gün görünmeyenler "aktif" sayılmaz

const TIER_ORDER: Record<string, number> = { BASIC: 1, PRO: 2, ENT: 3 };

/* ──────────────────────────────────────────────────────────
   Utilities
   ────────────────────────────────────────────────────────── */
const nowIso = () => new Date().toISOString();

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function licenseKey(): string {
  const hex = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `TGN-${hex()}-${hex()}`;
}

function compareSemver(a: string, b: string): number {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function tierAllows(customerPlan: string, minTier: string): boolean {
  const cust = TIER_ORDER[String(customerPlan || 'BASIC').toUpperCase()] || 0;
  const min = TIER_ORDER[String(minTier || 'BASIC').toUpperCase()] || 0;
  return cust >= min;
}

async function parseJson<T>(req: Request): Promise<Partial<T>> {
  try {
    const data = await req.json<T>();
    return (data ?? {}) as Partial<T>;
  } catch {
    return {} as Partial<T>;
  }
}

/* ──────────────────────────────────────────────────────────
   KV-backed data access
   ────────────────────────────────────────────────────────── */
interface Customer {
  id: string;
  licenseKey: string;
  companyName: string;
  contactEmail: string;
  contactName: string;
  plan: 'BASIC' | 'PRO' | 'ENT';
  status: 'active' | 'suspended' | 'expired';
  deviceLimit: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Demo {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  deviceCount: number;
  message: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  notes: string;
  createdAt: string;
}

interface Release {
  version: string;
  platform: string;
  downloadUrl: string;
  sha256: string;
  sizeBytes: number | null;
  releaseNotes: string;
  minTier: string;
  mandatory: boolean;
  publishedAt: string;
  changelogUrl: string;
}

interface Manifest {
  product: string;
  generatedAt: string;
  releases: Release[];
}

async function listCustomers(kv: KVNamespace): Promise<Customer[]> {
  const idx = (await kv.get<string[]>(K.customers, 'json')) || [];
  if (idx.length === 0) return [];
  const items = await Promise.all(idx.map(id => kv.get<Customer>(K.customer(id), 'json')));
  return items.filter((x): x is Customer => x !== null);
}

async function saveCustomer(kv: KVNamespace, c: Customer): Promise<void> {
  await kv.put(K.customer(c.id), JSON.stringify(c));
  await kv.put(K.customerByKey(c.licenseKey), c.id);
  const idx = (await kv.get<string[]>(K.customers, 'json')) || [];
  if (!idx.includes(c.id)) {
    idx.push(c.id);
    await kv.put(K.customers, JSON.stringify(idx));
  }
}

async function deleteCustomer(kv: KVNamespace, id: string): Promise<boolean> {
  const c = await kv.get<Customer>(K.customer(id), 'json');
  if (!c) return false;
  await kv.delete(K.customer(id));
  await kv.delete(K.customerByKey(c.licenseKey));
  const idx = (await kv.get<string[]>(K.customers, 'json')) || [];
  await kv.put(K.customers, JSON.stringify(idx.filter(x => x !== id)));
  return true;
}

async function findCustomerByKey(kv: KVNamespace, key: string): Promise<Customer | null> {
  const id = await kv.get(K.customerByKey(key));
  if (!id) return null;
  return await kv.get<Customer>(K.customer(id), 'json');
}

async function listDemos(kv: KVNamespace): Promise<Demo[]> {
  const idx = (await kv.get<string[]>(K.demos, 'json')) || [];
  if (idx.length === 0) return [];
  const items = await Promise.all(idx.map(id => kv.get<Demo>(K.demo(id), 'json')));
  return items.filter((x): x is Demo => x !== null);
}

async function saveDemo(kv: KVNamespace, d: Demo): Promise<void> {
  await kv.put(K.demo(d.id), JSON.stringify(d));
  const idx = (await kv.get<string[]>(K.demos, 'json')) || [];
  if (!idx.includes(d.id)) {
    idx.push(d.id);
    await kv.put(K.demos, JSON.stringify(idx));
  }
}

async function deleteDemoRecord(kv: KVNamespace, id: string): Promise<boolean> {
  const d = await kv.get<Demo>(K.demo(id), 'json');
  if (!d) return false;
  await kv.delete(K.demo(id));
  const idx = (await kv.get<string[]>(K.demos, 'json')) || [];
  await kv.put(K.demos, JSON.stringify(idx.filter(x => x !== id)));
  return true;
}

async function readManifest(kv: KVNamespace): Promise<Manifest> {
  const m = await kv.get<Manifest>(K.manifest, 'json');
  if (m && m.releases) return m;
  return { product: 'tiginer-client', generatedAt: nowIso(), releases: [] };
}

async function writeManifest(kv: KVNamespace, m: Manifest): Promise<void> {
  await kv.put(K.manifest, JSON.stringify(m));
}

interface LicenseMeta {
  modules?: string[];
  maxUsers?: number;
}

interface Activation {
  fingerprint: string;
  hostname?: string;
  version?: string;
  ip?: string;
  firstSeen: string;
  lastSeen: string;
}

async function getLicenseMeta(kv: KVNamespace, id: string): Promise<LicenseMeta> {
  return (await kv.get<LicenseMeta>(K.licenseMeta(id), 'json')) || {};
}

async function setLicenseMeta(kv: KVNamespace, id: string, meta: LicenseMeta): Promise<void> {
  await kv.put(K.licenseMeta(id), JSON.stringify(meta));
}

async function getActivations(kv: KVNamespace, id: string): Promise<Activation[]> {
  return (await kv.get<Activation[]>(K.activations(id), 'json')) || [];
}

async function recordActivation(
  kv: KVNamespace,
  id: string,
  patch: Omit<Activation, 'firstSeen' | 'lastSeen'>,
): Promise<void> {
  const list = await getActivations(kv, id);
  const now = nowIso();
  const i = list.findIndex(a => a.fingerprint === patch.fingerprint);
  if (i >= 0) {
    list[i] = { ...list[i], ...patch, lastSeen: now };
  } else {
    list.push({ ...patch, firstSeen: now, lastSeen: now });
  }
  await kv.put(K.activations(id), JSON.stringify(list));
}

function activeActivations(list: Activation[]): Activation[] {
  const cutoff = Date.now() - ACTIVATION_TTL_MS;
  return list.filter(a => new Date(a.lastSeen).getTime() > cutoff);
}

function defaultModulesFor(env: Env, plan: string): string[] {
  try {
    const m = JSON.parse(env.LICENSE_PLAN_MODULES || '{}');
    return m[plan] || m.BASIC || ['core'];
  } catch {
    return ['core'];
  }
}

function latestForPlatform(m: Manifest, platform: string): Release | null {
  const list = (m.releases || []).filter(r => r.platform === platform);
  if (!list.length) return null;
  return [...list].sort((a, b) => compareSemver(b.version, a.version))[0];
}

/* ──────────────────────────────────────────────────────────
   Session / auth middleware
   ────────────────────────────────────────────────────────── */
const SESSION_COOKIE = 'tiginer_admin';
const SESSION_TTL_SEC = 60 * 60 * 8; // 8h

async function createSession(env: Env): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.PORTAL_KV.put(
    K.session(token),
    JSON.stringify({ isAdmin: true, createdAt: nowIso() }),
    { expirationTtl: SESSION_TTL_SEC },
  );
  return token;
}

async function verifySession(env: Env, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const data = await env.PORTAL_KV.get(K.session(token));
  return data !== null;
}

async function destroySession(env: Env, token: string | undefined): Promise<void> {
  if (token) await env.PORTAL_KV.delete(K.session(token));
}

const authRequired = async (c: any, next: () => Promise<void>) => {
  const token = getCookie(c, SESSION_COOKIE);
  const ok = await verifySession(c.env, token);
  if (!ok) return c.json({ error: 'Unauthorized' }, 401);
  c.set('isAdmin', true);
  await next();
};

/* ──────────────────────────────────────────────────────────
   Middleware (global)
   ────────────────────────────────────────────────────────── */
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

/* ──────────────────────────────────────────────────────────
   Health
   ────────────────────────────────────────────────────────── */
app.get('/api/health', (c) => c.json({ ok: true, at: nowIso() }));

/* ──────────────────────────────────────────────────────────
   Public: one-line bootstrap installer
   Usage: curl -fsSL https://tiginer.com/install.sh | sudo bash
          sudo LICENSE_KEY=TGN-... bash -c "$(curl -fsSL https://tiginer.com/install.sh)"
   ────────────────────────────────────────────────────────── */
app.get('/install.sh', async (c) => {
  const script = `#!/usr/bin/env bash
# Tiginer NMS — One-line bootstrap installer
set -euo pipefail

RED='\\033[0;31m'; GREEN='\\033[0;32m'; YELLOW='\\033[1;33m'; BLUE='\\033[0;34m'; NC='\\033[0m'
log()  { echo -e "\${GREEN}[✓]\${NC} $1"; }
warn() { echo -e "\${YELLOW}[!]\${NC} $1"; }
err()  { echo -e "\${RED}[✗]\${NC} $1"; }

if [ "\$EUID" -ne 0 ]; then
  err "Bu script root olarak çalıştırılmalıdır."
  echo "  Örn: sudo bash -c \\"\\$(curl -fsSL https://tiginer.com/install.sh)\\""
  exit 1
fi

echo -e "\${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   Tiginer NMS — Hızlı Kurulum Bootstrap       ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "\${NC}"

# Minimum araçlar
log "Temel araçlar kuruluyor (curl, tar, jq)..."
if command -v apt-get &>/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl tar jq ca-certificates >/dev/null
elif command -v dnf &>/dev/null; then
  dnf install -y -q curl tar jq ca-certificates >/dev/null
elif command -v yum &>/dev/null; then
  yum install -y -q curl tar jq ca-certificates >/dev/null
fi

# Son sürümü al
log "Son sürüm bilgisi alınıyor..."
MANIFEST=\$(curl -fsSL "https://tiginer.com/api/update/latest?platform=linux-x64")
VERSION=\$(echo "\$MANIFEST" | jq -r .version)
URL=\$(echo "\$MANIFEST" | jq -r .downloadUrl)
SHA=\$(echo "\$MANIFEST" | jq -r .sha256)

if [ -z "\$VERSION" ] || [ "\$VERSION" = "null" ]; then
  err "Sürüm bilgisi alınamadı!"
  exit 1
fi
log "En son sürüm: v\${VERSION}"

# Paketi indir
TMPDIR=\$(mktemp -d)
cd "\$TMPDIR"
log "Paket indiriliyor..."
curl -fsSL "\$URL" -o pkg.tar.gz

# SHA doğrula
log "İmza doğrulanıyor..."
ACTUAL_SHA=\$(sha256sum pkg.tar.gz | awk '{print \$1}')
if [ "\$ACTUAL_SHA" != "\$SHA" ]; then
  err "SHA-256 uyuşmadı! Beklenen: \$SHA / Alınan: \$ACTUAL_SHA"
  exit 1
fi
log "İmza doğru ✓"

# Aç
tar xzf pkg.tar.gz
cd "tiginer-nms-v\${VERSION}"

# install.sh'ı çalıştır (LICENSE_KEY env'den geçer)
chmod +x install.sh
exec ./install.sh "\$@"
`;
  return c.body(script, 200, {
    'Content-Type': 'text/x-shellscript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
});

/* ──────────────────────────────────────────────────────────
   Public: One-line update script for existing installations
   Usage:
     curl -fsSL https://tiginer.com/update.sh | sudo bash
     curl -fsSL https://tiginer.com/update.sh | sudo VERSION=1.1.13 bash
   ────────────────────────────────────────────────────────── */
app.get('/update.sh', async (c) => {
  const script = `#!/usr/bin/env bash
# Tiginer NMS — Tek komutluk güncelleme scripti
set -euo pipefail

if [ "\${EUID:-\$(id -u)}" -ne 0 ]; then
  echo "Bu script root yetkisi ister. 'sudo' ile çalıştırın." >&2
  exit 1
fi

# Kurulum dizinini otomatik bul
CANDIDATES=(/opt/tiginer-nms /opt/tiginer /srv/tiginer-nms /srv/tiginer)
INSTALL_DIR=""
for d in "\${CANDIDATES[@]}"; do
  if [ -f "\$d/docker-compose.yml" ] && [ -f "\$d/.env" ]; then
    INSTALL_DIR="\$d"
    break
  fi
done

if [ -z "\$INSTALL_DIR" ]; then
  echo "Tiginer NMS kurulumu bulunamadı (aranan: \${CANDIDATES[*]})" >&2
  echo "Özel dizin için: INSTALL_DIR=/yol curl ... | sudo bash" >&2
  exit 1
fi

# Ortam değişkeninden override
INSTALL_DIR="\${TIGINER_INSTALL_DIR:-\$INSTALL_DIR}"
TARGET_VERSION="\${VERSION:-latest}"

echo "→ Kurulum dizini : \$INSTALL_DIR"
echo "→ Hedef sürüm    : \$TARGET_VERSION"
echo ""

cd "\$INSTALL_DIR"

# APP_VERSION'u güncelle
if grep -q '^APP_VERSION=' .env; then
  sed -i "s/^APP_VERSION=.*/APP_VERSION=\${TARGET_VERSION}/" .env
else
  echo "APP_VERSION=\${TARGET_VERSION}" >> .env
fi

echo "→ Yeni imaj çekiliyor..."
docker compose pull

echo "→ Servisler yeniden başlatılıyor..."
docker compose up -d

# Container sağlıklı hale gelene kadar bekle
echo "→ Servislerin hazır olması bekleniyor..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose exec -T app sh -c 'exit 0' >/dev/null 2>&1; then
    break
  fi
  sleep 3
done

# DB şema göçlerini uygula (yeni sürüm yeni kolonlar eklediyse)
echo "→ Veritabanı göçleri uygulanıyor..."
if docker compose exec -T app npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma 2>&1 | tail -20; then
  echo "  (migrate deploy tamamlandı)"
else
  echo "  Uyarı: migrate deploy başarısız — log'ları kontrol edin: docker compose logs app"
fi

echo "→ App restart..."
docker compose restart app worker

echo ""
echo "✓ Güncelleme tamamlandı."
docker compose ps
`;
  return c.body(script, 200, {
    'Content-Type': 'text/x-shellscript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
});

/* ──────────────────────────────────────────────────────────
   Public: Windows one-line bootstrap installer (PowerShell)
   Usage (PowerShell as Administrator):
     iex ((iwr 'https://tiginer.com/install.ps1').Content)
     $env:LICENSE_KEY='TGN-...'; iex ((iwr 'https://tiginer.com/install.ps1').Content)
   ────────────────────────────────────────────────────────── */
app.get('/install.ps1', async (c) => {
  const script = `# Tiginer NMS — Windows One-line Bootstrap Installer
$ErrorActionPreference = 'Stop'

function Log  ($m) { Write-Host "[OK] $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "[!]  $m" -ForegroundColor Yellow }
function Err  ($m) { Write-Host "[X]  $m" -ForegroundColor Red }

# Yönetici kontrolü
$current = [Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Err "Bu script Yönetici olarak çalıştırılmalıdır."
    Write-Host "  PowerShell'i 'Yönetici olarak çalıştır' ile açıp tekrar deneyin."
    exit 1
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Tiginer NMS — Windows Hızlı Kurulum         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Docker kontrolü
try { docker info *> $null } catch {
    Err "Docker bulunamadı veya çalışmıyor."
    Write-Host "  Docker Desktop for Windows yükleyin: https://www.docker.com/products/docker-desktop"
    exit 1
}
Log "Docker çalışıyor"

# Son sürümü al
Log "Son sürüm bilgisi alınıyor..."
$manifest = Invoke-RestMethod -Uri 'https://tiginer.com/api/update/latest?platform=windows-x64' -TimeoutSec 15 -ErrorAction SilentlyContinue
if (-not $manifest -or -not $manifest.version) {
    # windows-x64 yoksa linux-x64'e düş (aynı paket — sadece dağıtım kanalı için tutuluyor)
    $manifest = Invoke-RestMethod -Uri 'https://tiginer.com/api/update/latest?platform=linux-x64' -TimeoutSec 15
}
$version = $manifest.version
$url     = $manifest.downloadUrl
$sha     = $manifest.sha256
if (-not $version) { Err "Sürüm bilgisi alınamadı!"; exit 1 }
Log "En son sürüm: v$version"

# Geçici dizin
$tmp = Join-Path $env:TEMP "tiginer-nms-$version"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null
Set-Location $tmp

# Paketi indir
Log "Paket indiriliyor..."
$pkg = Join-Path $tmp 'pkg.zip'
Invoke-WebRequest -Uri $url -OutFile $pkg -UseBasicParsing

# SHA doğrula
Log "İmza doğrulanıyor..."
$actual = (Get-FileHash $pkg -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $sha.ToLower()) {
    Err "SHA-256 uyuşmadı! Beklenen: $sha / Alınan: $actual"
    exit 1
}
Log "İmza doğru"

# Aç
Expand-Archive -Path $pkg -DestinationPath $tmp -Force
$pkgDir = Get-ChildItem -Directory $tmp | Where-Object { $_.Name -like 'tiginer-nms-*' } | Select-Object -First 1
if (-not $pkgDir) { Err "Paket içeriği bulunamadı!"; exit 1 }
Set-Location $pkgDir.FullName

# install.ps1'ı çalıştır
if (-not (Test-Path '.\\install.ps1')) {
    Err "Pakette install.ps1 bulunamadı (eski sürüm olabilir)."
    Write-Host "  Bu sürümde sadece Linux kurulumu mevcut. v1.1.11+ ile tekrar deneyin."
    exit 1
}
& powershell -ExecutionPolicy Bypass -File .\\install.ps1 @args
`;
  return c.body(script, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
});

/* ──────────────────────────────────────────────────────────
   Public: demo request
   ────────────────────────────────────────────────────────── */
app.post('/api/demo-request', async (c) => {
  const body = await parseJson<Demo>(c.req.raw);
  const { companyName, contactName, email, phone, deviceCount, message } = body;
  if (!companyName || !contactName || !email) {
    return c.json({ error: 'companyName, contactName ve email zorunludur' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Gecerli bir e-posta adresi giriniz' }, 400);
  }
  const d: Demo = {
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
  await saveDemo(c.env.PORTAL_KV, d);
  return c.json({ ok: true, message: 'Demo talebiniz alindi. En kisa surede donecegiz.' }, 201);
});

/* ──────────────────────────────────────────────────────────
   Admin: auth
   ────────────────────────────────────────────────────────── */
app.post('/api/admin/login', async (c) => {
  const { username, password } = await parseJson<{ username: string; password: string }>(c.req.raw);
  if (username === c.env.ADMIN_USER && password === c.env.ADMIN_PASS) {
    const token = await createSession(c.env);
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: SESSION_TTL_SEC,
      path: '/',
    });
    return c.json({ ok: true });
  }
  return c.json({ error: 'Gecersiz kullanici adi veya sifre' }, 401);
});

app.post('/api/admin/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  await destroySession(c.env, token);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/admin/me', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  const ok = await verifySession(c.env, token);
  return c.json({ authenticated: ok });
});

/* ──────────────────────────────────────────────────────────
   Admin: stats
   ────────────────────────────────────────────────────────── */
app.get('/api/admin/stats', authRequired, async (c) => {
  const [customers, demos] = await Promise.all([listCustomers(c.env.PORTAL_KV), listDemos(c.env.PORTAL_KV)]);
  return c.json({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(x => x.status === 'active').length,
    suspendedCustomers: customers.filter(x => x.status === 'suspended').length,
    expiredCustomers: customers.filter(x => x.status === 'expired').length,
    totalDemos: demos.length,
    pendingDemos: demos.filter(x => x.status === 'pending').length,
  });
});

/* ──────────────────────────────────────────────────────────
   Admin: customers / licenses
   ────────────────────────────────────────────────────────── */
app.get('/api/admin/customers', authRequired, async (c) => {
  let items = await listCustomers(c.env.PORTAL_KV);
  const status = c.req.query('status');
  const search = c.req.query('search');
  if (status) items = items.filter(x => x.status === status);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(x =>
      x.companyName.toLowerCase().includes(s) ||
      x.contactEmail.toLowerCase().includes(s) ||
      x.licenseKey.toLowerCase().includes(s),
    );
  }
  return c.json({ items });
});

app.post('/api/admin/customers', authRequired, async (c) => {
  const body = await parseJson<Customer>(c.req.raw);
  const { companyName, contactEmail, contactName, plan, expiresAt, deviceLimit } = body;
  if (!companyName || !contactEmail) {
    return c.json({ error: 'companyName ve contactEmail zorunludur' }, 400);
  }
  const item: Customer = {
    id: uid('cus'),
    licenseKey: licenseKey(),
    companyName: String(companyName).slice(0, 200),
    contactEmail: String(contactEmail).slice(0, 200),
    contactName: String(contactName || '').slice(0, 200),
    plan: (plan as any) || 'BASIC',
    status: 'active',
    deviceLimit: Number(deviceLimit) || 0,
    expiresAt: expiresAt || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await saveCustomer(c.env.PORTAL_KV, item);
  return c.json(item, 201);
});

app.patch('/api/admin/customers/:id', authRequired, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.PORTAL_KV.get<Customer>(K.customer(id), 'json');
  if (!existing) return c.json({ error: 'Musteri bulunamadi' }, 404);
  const patch = await parseJson<Customer>(c.req.raw);
  const updated: Customer = {
    ...existing,
    ...(patch.plan ? { plan: patch.plan } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(typeof patch.expiresAt === 'string' ? { expiresAt: patch.expiresAt } : {}),
    ...(patch.contactName ? { contactName: patch.contactName } : {}),
    ...(patch.contactEmail ? { contactEmail: patch.contactEmail } : {}),
    ...(typeof patch.deviceLimit === 'number' ? { deviceLimit: patch.deviceLimit } : {}),
    updatedAt: nowIso(),
  };
  await saveCustomer(c.env.PORTAL_KV, updated);
  return c.json(updated);
});

app.delete('/api/admin/customers/:id', authRequired, async (c) => {
  const ok = await deleteCustomer(c.env.PORTAL_KV, c.req.param('id'));
  if (!ok) return c.json({ error: 'Musteri bulunamadi' }, 404);
  return c.json({ ok: true });
});

/* ──────────────────────────────────────────────────────────
   Admin: license management (KV-backed; eski Postgres yerine)
   /api/admin/licenses → customer + meta + activations
   ────────────────────────────────────────────────────────── */
app.get('/api/admin/licenses', authRequired, async (c) => {
  const customers = await listCustomers(c.env.PORTAL_KV);
  const licenses = await Promise.all(customers.map(async (cust) => {
    const meta = await getLicenseMeta(c.env.PORTAL_KV, cust.id);
    const all = await getActivations(c.env.PORTAL_KV, cust.id);
    const active = activeActivations(all);
    return {
      id: cust.id,
      customerId: cust.id,
      customerName: cust.companyName,
      customerEmail: cust.contactEmail,
      licenseKey: cust.licenseKey,
      plan: PLAN_TO_UI[cust.plan] || 'starter',
      planRaw: cust.plan,
      status: cust.status,
      maxDevices: cust.deviceLimit || 0,
      maxUsers: meta.maxUsers || 0,
      modules: meta.modules && meta.modules.length ? meta.modules : defaultModulesFor(c.env, cust.plan),
      validUntil: cust.expiresAt || null,
      createdAt: cust.createdAt,
      updatedAt: cust.updatedAt,
      activations: active.map(a => ({
        fingerprint: a.fingerprint,
        hostname: a.hostname,
        version: a.version,
        lastSeen: a.lastSeen,
        firstSeen: a.firstSeen,
      })),
      totalActivations: all.length,
    };
  }));
  return c.json({ licenses });
});

app.get('/api/admin/licenses/:id', authRequired, async (c) => {
  const id = c.req.param('id');
  const cust = await c.env.PORTAL_KV.get<Customer>(K.customer(id), 'json');
  if (!cust) return c.json({ error: 'License not found' }, 404);
  const meta = await getLicenseMeta(c.env.PORTAL_KV, id);
  const all = await getActivations(c.env.PORTAL_KV, id);
  return c.json({
    id: cust.id,
    customerName: cust.companyName,
    customerEmail: cust.contactEmail,
    licenseKey: cust.licenseKey,
    plan: PLAN_TO_UI[cust.plan] || 'starter',
    status: cust.status,
    maxDevices: cust.deviceLimit || 0,
    maxUsers: meta.maxUsers || 0,
    modules: meta.modules && meta.modules.length ? meta.modules : defaultModulesFor(c.env, cust.plan),
    validUntil: cust.expiresAt || null,
    activations: all,
  });
});

app.patch('/api/admin/licenses/:id', authRequired, async (c) => {
  const id = c.req.param('id');
  const cust = await c.env.PORTAL_KV.get<Customer>(K.customer(id), 'json');
  if (!cust) return c.json({ error: 'License not found' }, 404);
  const patch = await parseJson<{
    plan?: string; status?: string; maxDevices?: number; maxUsers?: number;
    modules?: string[]; validUntil?: string;
  }>(c.req.raw);

  const updated: Customer = { ...cust, updatedAt: nowIso() };
  if (patch.plan) {
    const raw = PLAN_FROM_UI[patch.plan as keyof typeof PLAN_FROM_UI] || (patch.plan.toUpperCase() as Customer['plan']);
    updated.plan = raw;
  }
  if (patch.status && ['active', 'suspended', 'expired'].includes(patch.status)) {
    updated.status = patch.status as Customer['status'];
  }
  if (typeof patch.maxDevices === 'number') updated.deviceLimit = patch.maxDevices;
  if (typeof patch.validUntil === 'string') updated.expiresAt = patch.validUntil;
  await saveCustomer(c.env.PORTAL_KV, updated);

  const meta = await getLicenseMeta(c.env.PORTAL_KV, id);
  if (Array.isArray(patch.modules)) meta.modules = patch.modules.slice(0, 50);
  if (typeof patch.maxUsers === 'number') meta.maxUsers = patch.maxUsers;
  await setLicenseMeta(c.env.PORTAL_KV, id, meta);

  return c.json({ ok: true });
});

app.delete('/api/admin/licenses/:id', authRequired, async (c) => {
  const id = c.req.param('id');
  await c.env.PORTAL_KV.delete(K.licenseMeta(id));
  await c.env.PORTAL_KV.delete(K.activations(id));
  const ok = await deleteCustomer(c.env.PORTAL_KV, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

/* ──────────────────────────────────────────────────────────
   Admin: demo requests
   ────────────────────────────────────────────────────────── */
app.get('/api/admin/demos', authRequired, async (c) => {
  let items = await listDemos(c.env.PORTAL_KV);
  const status = c.req.query('status');
  if (status) items = items.filter(x => x.status === status);
  return c.json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.patch('/api/admin/demos/:id', authRequired, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.PORTAL_KV.get<Demo>(K.demo(id), 'json');
  if (!existing) return c.json({ error: 'Demo talebi bulunamadi' }, 404);
  const patch = await parseJson<Demo>(c.req.raw);
  const updated: Demo = {
    ...existing,
    ...(patch.status ? { status: patch.status } : {}),
    ...(typeof patch.notes === 'string' ? { notes: patch.notes.slice(0, 1000) } : {}),
  };
  await saveDemo(c.env.PORTAL_KV, updated);
  return c.json(updated);
});

app.delete('/api/admin/demos/:id', authRequired, async (c) => {
  const ok = await deleteDemoRecord(c.env.PORTAL_KV, c.req.param('id'));
  if (!ok) return c.json({ error: 'Demo talebi bulunamadi' }, 404);
  return c.json({ ok: true });
});

/* ──────────────────────────────────────────────────────────
   Public: license verify (used by NMS & docs)
   GET ile sadece sorgu, POST ile activation kaydı yapılır.
   ────────────────────────────────────────────────────────── */
async function verifyLicenseCommon(
  c: any,
  key: string,
  activation?: { fingerprint?: string; hostname?: string; version?: string },
) {
  if (!key) return c.json({ valid: false, error: 'key is required' }, 400);
  const customer = await findCustomerByKey(c.env.PORTAL_KV, key);
  if (!customer) return c.json({ valid: false, error: 'license not found' }, 404);
  if (customer.status !== 'active') return c.json({ valid: false, status: customer.status });
  if (customer.expiresAt && new Date(customer.expiresAt) < new Date()) {
    return c.json({ valid: false, status: 'expired' });
  }
  const meta = await getLicenseMeta(c.env.PORTAL_KV, customer.id);
  const modules = meta.modules && meta.modules.length
    ? meta.modules
    : defaultModulesFor(c.env, customer.plan);

  if (activation && activation.fingerprint) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '';
    await recordActivation(c.env.PORTAL_KV, customer.id, {
      fingerprint: String(activation.fingerprint).slice(0, 128),
      hostname: activation.hostname ? String(activation.hostname).slice(0, 200) : undefined,
      version: activation.version ? String(activation.version).slice(0, 32) : undefined,
      ip: String(ip).slice(0, 64),
    });
  }

  return c.json({
    valid: true,
    status: customer.status,
    plan: customer.plan,
    expiresAt: customer.expiresAt,
    deviceLimit: customer.deviceLimit || 0,
    maxUsers: meta.maxUsers || 0,
    modules,
  });
}

app.get('/api/license/verify', async (c) => {
  return verifyLicenseCommon(c, c.req.query('key') || '');
});

app.post('/api/license/verify', async (c) => {
  const body = await parseJson<{ licenseKey?: string; key?: string; fingerprint?: string; hostname?: string; version?: string }>(c.req.raw);
  const key = body.licenseKey || body.key || '';
  return verifyLicenseCommon(c, key, {
    fingerprint: body.fingerprint,
    hostname: body.hostname,
    version: body.version,
  });
});

/* ──────────────────────────────────────────────────────────
   NMS protocol (/v1/license/activate + /v1/license/verify)
   NMS client (apps/web/src/lib/license-client.ts) bu shape'i bekler:
     { valid, plan, modules, maxDevices, maxUsers, expiresAt,
       gracePeriodDays, suspended, expired, instanceId, token? }
   Portal admin panelindeki her plan degisikligi NMS heartbeat'i
   ile anında dogru pakete yansır.
   ────────────────────────────────────────────────────────── */
async function v1LicenseResponse(
  c: any,
  licenseKey: string,
  instanceIdIn: string | undefined,
  version: string | undefined,
  hostname: string | undefined,
) {
  if (!licenseKey) {
    return c.json({ valid: false, error: 'licenseKey is required' }, 400);
  }

  const customer = await findCustomerByKey(c.env.PORTAL_KV, licenseKey);
  if (!customer) {
    return c.json({ valid: false, error: 'Invalid license key' }, 404);
  }

  const now = new Date();
  const suspended = customer.status === 'suspended';
  const expired =
    customer.status === 'expired' ||
    (customer.expiresAt ? new Date(customer.expiresAt) < now : false);
  const valid = !suspended && !expired && customer.status === 'active';

  const meta = await getLicenseMeta(c.env.PORTAL_KV, customer.id);
  const modules =
    !valid ? [] :
    (meta.modules && meta.modules.length
      ? meta.modules
      : defaultModulesFor(c.env, customer.plan));

  // Activation kaydı — instanceId'yi fingerprint olarak kullan
  const instanceId = instanceIdIn || crypto.randomUUID();
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    '';
  await recordActivation(c.env.PORTAL_KV, customer.id, {
    fingerprint: String(instanceId).slice(0, 128),
    hostname: hostname ? String(hostname).slice(0, 200) : undefined,
    version: version ? String(version).slice(0, 32) : undefined,
    ip: String(ip).slice(0, 64),
  });

  return c.json({
    valid,
    licenseId: customer.id,
    instanceId,
    plan: customer.plan, // BASIC | PRO | ENT
    modules,
    maxDevices: customer.deviceLimit || 0,
    maxUsers: meta.maxUsers || 0,
    expiresAt: customer.expiresAt || null,
    gracePeriodDays: 30,
    suspended,
    expired,
  });
}

app.post('/v1/license/activate', async (c) => {
  const body = await parseJson<{
    licenseKey?: string;
    instanceId?: string;
    instanceName?: string;
    version?: string;
  }>(c.req.raw);
  return v1LicenseResponse(
    c,
    body.licenseKey || '',
    body.instanceId,
    body.version,
    body.instanceName,
  );
});

app.post('/v1/license/verify', async (c) => {
  const body = await parseJson<{
    licenseKey?: string;
    instanceId?: string;
    version?: string;
    hostname?: string;
  }>(c.req.raw);
  return v1LicenseResponse(
    c,
    body.licenseKey || '',
    body.instanceId,
    body.version,
    body.hostname,
  );
});

/* ──────────────────────────────────────────────────────────
   UPDATE SYSTEM
   ────────────────────────────────────────────────────────── */
app.get('/api/update/manifest', async (c) => {
  const m = await readManifest(c.env.PORTAL_KV);
  const safe = {
    product: m.product,
    generatedAt: m.generatedAt,
    releases: (m.releases || []).map(r => ({
      version: r.version,
      platform: r.platform,
      downloadUrl: r.downloadUrl,
      sha256: r.sha256,
      sizeBytes: r.sizeBytes,
      releaseNotes: r.releaseNotes,
      minTier: r.minTier,
      publishedAt: r.publishedAt,
      changelogUrl: r.changelogUrl,
    })),
  };
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(safe);
});

app.get('/api/update/latest', async (c) => {
  const platform = c.req.query('platform') || 'linux-x64';
  const m = await readManifest(c.env.PORTAL_KV);
  const latest = latestForPlatform(m, platform);
  if (!latest) return c.json({ error: 'No release for platform' }, 404);
  c.header('Cache-Control', 'public, max-age=60');
  return c.json({
    version: latest.version,
    platform: latest.platform,
    downloadUrl: latest.downloadUrl,
    sha256: latest.sha256,
    sizeBytes: latest.sizeBytes,
    releaseNotes: latest.releaseNotes,
    minTier: latest.minTier,
    publishedAt: latest.publishedAt,
  });
});

app.post('/api/update/check', async (c) => {
  const body = await parseJson<{ licenseKey: string; currentVersion: string; platform: string; instanceId?: string; hostname?: string }>(c.req.raw);
  const { licenseKey: lk, currentVersion, platform } = body;
  if (!lk || !currentVersion || !platform) {
    return c.json({ error: 'licenseKey, currentVersion, platform zorunlu' }, 400);
  }
  const customer = await findCustomerByKey(c.env.PORTAL_KV, lk);
  if (!customer) return c.json({ error: 'invalid_license' }, 403);
  if (customer.status !== 'active') return c.json({ error: `license_${customer.status}` }, 403);
  if (customer.expiresAt && new Date(customer.expiresAt) < new Date()) {
    return c.json({ error: 'license_expired' }, 403);
  }
  // Update check'i de aktivasyon ping'i olarak değerlendir
  if (body.instanceId) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '';
    await recordActivation(c.env.PORTAL_KV, customer.id, {
      fingerprint: String(body.instanceId).slice(0, 128),
      hostname: body.hostname ? String(body.hostname).slice(0, 200) : undefined,
      version: String(currentVersion).slice(0, 32),
      ip: String(ip).slice(0, 64),
    });
  }
  const m = await readManifest(c.env.PORTAL_KV);
  const latest = latestForPlatform(m, platform);
  if (!latest) return c.json({ updateAvailable: false, reason: 'no_release' });
  if (!tierAllows(customer.plan, latest.minTier)) {
    return c.json({
      updateAvailable: false,
      reason: 'tier_insufficient',
      requiredPlan: latest.minTier,
      currentPlan: customer.plan,
    });
  }
  if (compareSemver(latest.version, currentVersion) <= 0) {
    return c.json({ updateAvailable: false, currentVersion, latestVersion: latest.version });
  }
  return c.json({
    updateAvailable: true,
    currentVersion,
    latestVersion: latest.version,
    downloadUrl: latest.downloadUrl,
    sha256: latest.sha256,
    sizeBytes: latest.sizeBytes,
    releaseNotes: latest.releaseNotes,
    publishedAt: latest.publishedAt,
    changelogUrl: latest.changelogUrl,
    mandatory: latest.mandatory === true,
  });
});

/* ──────────────────────────────────────────────────────────
   Admin: manifest management
   ────────────────────────────────────────────────────────── */
app.get('/api/admin/releases', authRequired, async (c) => {
  return c.json(await readManifest(c.env.PORTAL_KV));
});

app.post('/api/admin/releases', authRequired, async (c) => {
  const body = await parseJson<Release>(c.req.raw);
  const { version, platform, downloadUrl, sha256, sizeBytes, releaseNotes, minTier, changelogUrl, mandatory } = body;
  if (!version || !platform || !downloadUrl || !sha256) {
    return c.json({ error: 'version, platform, downloadUrl, sha256 zorunlu' }, 400);
  }
  if (!/^[0-9a-f]{64}$/i.test(sha256)) {
    return c.json({ error: 'sha256 gecersiz (64 hex karakter)' }, 400);
  }
  if (!['linux-x64', 'windows-x64', 'darwin-x64', 'darwin-arm64'].includes(platform)) {
    return c.json({ error: 'gecersiz platform' }, 400);
  }
  const m = await readManifest(c.env.PORTAL_KV);
  m.product ||= 'tiginer-client';
  m.generatedAt = nowIso();
  m.releases ||= [];
  const idx = m.releases.findIndex(r => r.version === version && r.platform === platform);
  const record: Release = {
    version,
    platform,
    downloadUrl,
    sha256: sha256.toLowerCase(),
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : null,
    releaseNotes: String(releaseNotes || '').slice(0, 2000),
    minTier: (minTier || 'BASIC').toUpperCase(),
    mandatory: mandatory === true,
    publishedAt: nowIso(),
    changelogUrl: changelogUrl || 'https://tiginer.com/changelog',
  };
  if (idx >= 0) m.releases[idx] = record;
  else m.releases.push(record);
  await writeManifest(c.env.PORTAL_KV, m);
  return c.json(record, 201);
});

app.delete('/api/admin/releases', authRequired, async (c) => {
  const version = c.req.query('version');
  const platform = c.req.query('platform');
  if (!version || !platform) return c.json({ error: 'version ve platform zorunlu' }, 400);
  const m = await readManifest(c.env.PORTAL_KV);
  const before = (m.releases || []).length;
  m.releases = (m.releases || []).filter(r => !(r.version === version && r.platform === platform));
  if (m.releases.length === before) return c.json({ error: 'Surum bulunamadi' }, 404);
  m.generatedAt = nowIso();
  await writeManifest(c.env.PORTAL_KV, m);
  return c.json({ ok: true });
});

/* ──────────────────────────────────────────────────────────
   Download proxy (optional) - redirect to R2 public URL
   The binaries are already on updates.tiginer.com, so we redirect.
   ────────────────────────────────────────────────────────── */
app.get('/api/download/latest', async (c) => {
  const platform = c.req.query('platform') || 'linux-x64';
  const m = await readManifest(c.env.PORTAL_KV);
  const latest = latestForPlatform(m, platform);
  if (!latest) return c.json({ error: 'Henuz indirilebilir surum yok' }, 404);
  return c.redirect(latest.downloadUrl, 302);
});

app.get('/api/download/list', async (c) => {
  const m = await readManifest(c.env.PORTAL_KV);
  const releases = (m.releases || []).map(r => ({
    name: `${r.version}-${r.platform}`,
    url: r.downloadUrl,
    size: r.sizeBytes,
    date: r.publishedAt,
  }));
  return c.json({ releases });
});

/* ──────────────────────────────────────────────────────────
   Error handler
   ────────────────────────────────────────────────────────── */
app.onError((err, c) => {
  console.error('[portal]', err);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json({ error: 'Internal server error' }, 500);
});

/* ──────────────────────────────────────────────────────────
   Fallback → static assets (handled by ASSETS binding via
   run_worker_first=["/api/*"] so non-API requests fall through)
   ────────────────────────────────────────────────────────── */
app.all('*', async (c) => {
  // Worker receives /api/* and /v1/* first; static assets are served automatically.
  // For any unmatched API path, return 404 JSON.
  if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/v1/')) {
    return c.json({ error: 'Not found' }, 404);
  }
  // Fall through to ASSETS binding
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
