#!/usr/bin/env bash
# ============================================================
#  Tiginer NMS — Servis Yonetim Paneli
# ============================================================

# ── Baslangic kontrolleri ──
if ! docker info &> /dev/null; then
    echo ""
    echo "  HATA: Docker calismiyyor!"
    echo "  Servisi baslatin: sudo systemctl start docker"
    echo ""
    exit 1
fi

# ── .env otomatik olusturma ──
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
    sleep 2
fi

show_menu() {
    clear
    echo ""
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║      Tiginer NMS Yonetim Paneli          ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo ""
    echo "   [1] Servisi Baslat"
    echo "   [2] Servisi Durdur"
    echo "   [3] Durum Kontrolu"
    echo "   [4] Loglari Goruntule"
    echo "   [5] Servisi Yeniden Baslat"
    echo "   [6] Guncelleme (Imajlari Cek)"
    echo "   [0] Cikis"
    echo ""
}

baslat() {
    echo ""
    echo "  Servis baslatiliyor..."
    echo ""
    if docker compose up -d; then
        echo ""
        echo "  Servis basariyla baslatildi!"
        echo ""
        echo "  Uygulama: http://localhost:3002"
        echo "  Hazir olmasi icin 30 saniye kadar bekleyin."
    else
        echo ""
        echo "  HATA: Servis baslatilamadi!"
        echo "  Docker servisinin calistigindan emin olun."
    fi
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

durdur() {
    echo ""
    echo "  Servis durduruluyor..."
    echo ""
    if docker compose down; then
        echo ""
        echo "  Servis basariyla durduruldu."
    else
        echo ""
        echo "  HATA: Servis durdurulamadi!"
    fi
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

durum() {
    echo ""
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║         Servis Durumu                     ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo ""
    docker compose ps
    echo ""
    echo "  ──────────────────────────────────────────"
    echo "  Saglik Kontrolu:"
    echo ""
    for container in tiginer-app tiginer-postgres tiginer-redis tiginer-influxdb; do
        status=$(docker inspect --format '{{.Name}} - {{.State.Status}} ({{if .State.Health}}{{.State.Health.Status}}{{else}}no healthcheck{{end}})' "$container" 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "   $status"
        fi
    done
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

loglar() {
    echo ""
    echo "  Son loglar gosteriliyor (cikmak icin Ctrl+C)..."
    echo ""
    docker compose logs --tail 50 -f app
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

yenidenbaslat() {
    echo ""
    echo "  Servis yeniden baslatiliyor..."
    echo ""
    if docker compose restart; then
        echo ""
        echo "  Servis yeniden baslatildi!"
        echo "  Uygulama: http://localhost:3002"
    else
        echo ""
        echo "  HATA: Yeniden baslatma basarisiz!"
    fi
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

guncelle() {
    echo ""
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║         Guncelleme                        ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo ""
    echo "  Yeni imajlar indiriliyor..."
    echo ""
    if ! docker compose pull; then
        echo ""
        echo "  HATA: Imajlar indirilemedi!"
        echo "  Internet baglantinizi kontrol edin."
        echo ""
        read -p "  Devam etmek icin Enter'a basin..."
        return
    fi
    echo ""
    echo "  Servis guncelleniyor (verileriniz korunur)..."
    echo ""
    docker compose up -d
    echo ""
    echo "  Guncelleme tamamlandi!"
    echo "  Uygulama: http://localhost:3002"
    echo ""
    read -p "  Devam etmek icin Enter'a basin..."
}

# ── Ana dongu ──
while true; do
    show_menu
    read -p "  Seciminiz: " secim
    case $secim in
        1) baslat ;;
        2) durdur ;;
        3) durum ;;
        4) loglar ;;
        5) yenidenbaslat ;;
        6) guncelle ;;
        0) echo ""; echo "  Iyi calismalar!"; echo ""; exit 0 ;;
        *) echo "  Gecersiz secim!"; sleep 2 ;;
    esac
done
