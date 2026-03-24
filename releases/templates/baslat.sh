#!/usr/bin/env bash
# Tiginer NMS — Servisi Baslat

# Docker kontrolu
if ! docker info &> /dev/null; then
    echo ""
    echo "  HATA: Docker calismiyyor!"
    echo "  Servisi baslatin: sudo systemctl start docker"
    echo ""
    exit 1
fi

# .env otomatik olusturma
if [ ! -f ".env" ]; then
    if [ ! -f ".env.example" ]; then
        echo "  HATA: .env.example dosyasi bulunamadi!"
        exit 1
    fi
    echo ""
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
    echo "  .env dosyasi guclu sifrelerle olusturuldu!"
fi

echo ""
echo "  Tiginer NMS baslatiliyor..."
echo ""
if docker compose up -d; then
    echo ""
    echo "  Servis baslatildi!"
    echo "  Uygulama: http://localhost:3002"
    echo "  Hazir olmasi icin 30 saniye kadar bekleyin."
else
    echo ""
    echo "  HATA: Servis baslatilamadi!"
    echo "  Docker servisinin calistigindan emin olun."
fi
echo ""
