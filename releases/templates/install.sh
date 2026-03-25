#!/usr/bin/env bash
# ============================================================
#  Tiginer NMS — Linux/macOS Kurulum Scripti
#  Desteklenen modlar:
#    DB_MODE=bundled  → PostgreSQL Docker ile birlikte (varsayilan)
#    DB_MODE=external → Dis PostgreSQL sunucusu
# ============================================================
set -e

echo ""
echo "========================================"
echo " Tiginer NMS Kurulum"
echo "========================================"
echo ""

# ── Gereksinim kontrolu ──
echo "[1/7] Gereksinimler kontrol ediliyor..."

if ! command -v docker &> /dev/null; then
    echo "HATA: Docker bulunamadi!"
    echo "Kurun: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "HATA: Docker calismiyyor! Servisi baslatin: sudo systemctl start docker"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "HATA: Docker Compose bulunamadi!"
    exit 1
fi

echo "  Docker: OK"

# ── .env dosyasi ──
echo "[2/7] Ortam degiskenleri kontrol ediliyor..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "ONEMLI: .env dosyasini duzenleyip guclu sifreler girin!"
    echo "Dosya: $(pwd)/.env"
    echo ""
    echo "Sifre olusturmak icin:"
    echo '  node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))"'
    echo "  veya: openssl rand -hex 32"
    echo ""
    read -p "Devam etmek icin Enter'a basin..."
fi

# ── .env dosyasini oku ──
source .env

DB_MODE="${DB_MODE:-bundled}"
echo "  Veritabani modu: $DB_MODE"

# ── Guvenlik anahtarlarini otomatik olustur ──
echo "[3/7] Guvenlik anahtarlari kontrol ediliyor..."
generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 64
}

NEEDS_UPDATE=0
for KEY in NEXTAUTH_SECRET INTERNAL_API_SECRET ENCRYPTION_KEY; do
    VAL=$(grep "^${KEY}=" .env | cut -d'=' -f2-)
    if [ "$VAL" = "BURAYA_RASTGELE_32_BYTE_HEX" ] || [ -z "$VAL" ]; then
        NEW_SECRET=$(generate_secret)
        sed -i "s|^${KEY}=.*|${KEY}=${NEW_SECRET}|" .env
        echo "  $KEY otomatik olusturuldu"
        NEEDS_UPDATE=1
    fi
done

if [ "$DB_MODE" = "bundled" ]; then
    PG_PASS=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2-)
    if [ "$PG_PASS" = "BURAYA_GUCLU_SIFRE_GIRIN" ] || [ -z "$PG_PASS" ]; then
        NEW_PASS=$(generate_secret | head -c 24)
        sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${NEW_PASS}|" .env
        echo "  POSTGRES_PASSWORD otomatik olusturuldu"
        NEEDS_UPDATE=1
    fi
fi

REDIS_PASS=$(grep "^REDIS_PASSWORD=" .env | cut -d'=' -f2-)
if [ "$REDIS_PASS" = "BURAYA_REDIS_SIFRESI" ] || [ -z "$REDIS_PASS" ]; then
    NEW_PASS=$(generate_secret | head -c 24)
    sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${NEW_PASS}|" .env
    echo "  REDIS_PASSWORD otomatik olusturuldu"
    NEEDS_UPDATE=1
fi

if [ $NEEDS_UPDATE -eq 1 ]; then
    source .env
fi

# ── Private Registry Login ──
echo "[4/7] Tiginer imaj deposuna giris yapiliyor..."
echo "  Tiginer tarafindan size verilen erisim tokenini girin."
docker login ghcr.io
if [ $? -ne 0 ]; then
    echo "HATA: Registry giris basarisiz! Token bilgilerinizi kontrol edin."
    exit 1
fi
echo "  Registry: OK"

# ── Docker imajlari ──
echo "[5/7] Docker imajlari indiriliyor..."
docker compose pull

# ── Servisleri baslat ──
echo "[6/7] Servisler baslatiliyor..."

if [ "$DB_MODE" = "bundled" ]; then
    echo "  PostgreSQL (bundled) baslatiliyor..."
    docker compose --profile bundled-db up -d postgres redis influxdb
else
    echo "  Dis PostgreSQL kullaniliyor: $DATABASE_URL"
    if [ -z "$DATABASE_URL" ]; then
        echo "HATA: DB_MODE=external ama DATABASE_URL bos!"
        echo ".env dosyasinda DATABASE_URL degerini doldurun."
        exit 1
    fi
    docker compose up -d redis influxdb
fi

echo "  Servisler hazir olana kadar bekleniyor..."
sleep 15

# ── Migration ──
echo "[7/7] Veritabani schemasi olusturuluyor..."
docker compose up -d app
sleep 10
docker compose exec app npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

# ── Tamam ──
echo ""
echo "========================================"
echo " Tiginer NMS basariyla kuruldu!"
echo ""
echo " Uygulama: http://localhost:3002"
echo " Veritabani modu: $DB_MODE"
echo ""
echo " Varsayilan giris:"
echo "   Kullanici: admin@tiginer.local"
echo "   Sifre: admin (ilk giriste degistirin!)"
echo ""
echo " ── Servis Yonetimi ──"
echo "   ./tiginer.sh    Yonetim paneli (menu)"
echo "   ./baslat.sh     Servisi baslat"
echo "   ./durdur.sh     Servisi durdur"
echo "   ./durum.sh      Durum kontrolu"
echo "========================================"
echo ""
