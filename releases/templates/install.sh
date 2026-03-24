#!/usr/bin/env bash
# ============================================================
#  Tiginer NMS — Linux/macOS Kurulum Scripti
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
    echo "  .env dosyasi bulunamadi, otomatik olusturuluyor..."
    cp .env.example .env
    gen() { head -c 32 /dev/urandom | xxd -p | tr -d '\n'; }
    sed -i "s/BURAYA_GUCLU_SIFRE_GIRIN/$(gen)/" .env
    sed -i "s/BURAYA_REDIS_SIFRESI/$(gen)/" .env
    sed -i "s/BURAYA_INFLUX_SIFRESI/$(gen)/" .env
    sed -i "s/BURAYA_INFLUX_TOKEN_GIRIN/$(gen)/" .env
    sed -i "s/NEXTAUTH_SECRET=BURAYA_RASTGELE_32_BYTE_HEX/NEXTAUTH_SECRET=$(gen)/" .env
    sed -i "s/INTERNAL_API_SECRET=BURAYA_RASTGELE_32_BYTE_HEX/INTERNAL_API_SECRET=$(gen)/" .env
    sed -i "s/ENCRYPTION_KEY=BURAYA_RASTGELE_32_BYTE_HEX/ENCRYPTION_KEY=$(gen)/" .env
    echo "  .env dosyasi guclu sifrelerle otomatik olusturuldu!"
fi

# ── Private Registry Login ──
echo "[3/7] Tiginer imaj deposuna giris yapiliyor..."
echo "  Tiginer tarafindan size verilen erisim tokenini girin."
docker login ghcr.io
if [ $? -ne 0 ]; then
    echo "HATA: Registry giris basarisiz! Token bilgilerinizi kontrol edin."
    exit 1
fi
echo "  Registry: OK"

# ── Docker imajlari ──
echo "[4/7] Docker imajlari indiriliyor..."
docker compose pull
if [ $? -ne 0 ]; then
    echo "HATA: Imajlar indirilemedi! Internet baglantinizi ve lisansinizi kontrol edin."
    exit 1
fi

# ── Servisleri baslat ──
echo "[5/7] Servisler baslatiliyor..."
docker compose up -d postgres redis influxdb
echo "  Veritabani hazir olana kadar bekleniyor..."
sleep 15

# ── Migration ──
echo "[6/7] Veritabani schemasi olusturuluyor..."
docker compose up -d app
sleep 10
docker compose exec app npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

# ── Tamam ──
echo "[7/7] Kurulum tamamlandi!"
echo ""
echo "========================================"
echo " Tiginer NMS basariyla kuruldu!"
echo ""
echo " Uygulama: http://localhost:3002"
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
