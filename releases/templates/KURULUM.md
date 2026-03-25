# Tiginer NMS — Kurulum Rehberi

## Sistem Gereksinimleri

| Gereksinim | Minimum | Onerilen |
|-----------|---------|----------|
| CPU | 2 core | 4+ core |
| RAM | 4 GB | 8+ GB |
| Disk | 20 GB | 50+ GB SSD |
| OS | Ubuntu 22+, Windows Server 2019+ | Ubuntu 22.04 LTS |
| Docker | 24+ | Son surum |
| Docker Compose | v2+ | Son surum |

## Veritabani Modu Secimi

Tiginer iki veritabani modunu destekler:

| Mod | Aciklama | Ne Zaman Kullanilmali |
|-----|----------|----------------------|
| **bundled** (varsayilan) | PostgreSQL Docker container icinde gelir | Hizli kurulum, tek sunucu |
| **external** | Musteri kendi PostgreSQL sunucusunu kullanir | Kurumsal, ayri DB sunucusu, HA/replikasyon |

`.env` dosyasinda `DB_MODE` degiskeni ile secim yapilir:
```bash
# Dahili PostgreSQL (varsayilan)
DB_MODE=bundled

# Dis PostgreSQL sunucusu
DB_MODE=external
DATABASE_URL=postgresql://kullanici:sifre@db-sunucu:5432/tiginer
```

### Dis PostgreSQL Gereksinimleri (external mod)
- PostgreSQL 14+ (16 onerilen)
- Tiginer icin bos bir veritabani olusturun
- Baglanti bilgilerini `DATABASE_URL`'ye girin
- Guvenlik duvarindan PostgreSQL portuna erisim acin

### SSL/TLS Veritabani Baglantisi (Istege bagli)
Dis veritabanina SSL ile baglanmak icin `DATABASE_URL`'ye `?sslmode=` parametresi ekleyin:

| SSL Modu | Aciklama |
|----------|----------|
| `disable` | SSL kullanilmaz |
| `prefer` | Mumkunse SSL kullanilir (varsayilan) |
| `require` | SSL zorunlu, sertifika dogrulanmaz |
| `verify-ca` | SSL zorunlu, CA dogrulanir |
| `verify-full` | SSL zorunlu, CA + hostname dogrulanir |

Ornek:
```bash
DATABASE_URL=postgresql://tiginer:sifre@db.firma.com:5432/tiginer?sslmode=require
```

## Hizli Kurulum (Docker)

### 1. Arsivi acin
```bash
# Linux
tar xzf tiginer-client-1.0.0.tar.gz -C /opt/tiginer
cd /opt/tiginer

# Windows
# ZIP dosyasini C:\tiginer klasorune cikartin
```

### 2. Ortam degiskenlerini ayarlayin
```bash
cp .env.example .env
nano .env
```

**Onemli:** Asagidaki degerleri mutlaka degistirin:
- `DB_MODE` — Veritabani modu (`bundled` veya `external`)
- `POSTGRES_PASSWORD` — PostgreSQL sifresi (bundled modda)
- `DATABASE_URL` — Dis DB baglanti adresi (external modda)
- `INFLUXDB_PASSWORD` — InfluxDB sifresi
- `INFLUXDB_TOKEN` — InfluxDB API token
- `NEXTAUTH_SECRET` — Oturum sifresi
- `INTERNAL_API_SECRET` — Dahili API anahtari
- `ENCRYPTION_KEY` — Sifreleme anahtari
- `LICENSE_KEY` — Tiginer lisans anahtariniz

> **Not:** Linux kurulum scripti (`install.sh`) bos birakilan guvenlik anahtarlarini otomatik olusturur.

Rastgele anahtar olusturmak icin:
```bash
openssl rand -hex 32
```

### 3. Kurulum scriptini calistirin
```bash
# Linux/macOS
chmod +x install.sh
./install.sh

# Windows
install.cmd
```

### 4. Uygulamaya erisin
Tarayicinizi acin: `http://SUNUCU_IP:3002`

Varsayilan giris bilgileri:
- **Kullanici:** admin@tiginer.local
- **Sifre:** admin

> **Guvenlik:** Ilk giriste sifreyi mutlaka degistirin!

## Lisans Aktivasyonu

1. Admin panelde **Ayarlar > Lisans** bolumune gidin
2. Lisans anahtarinizi girin (admin panelinizden alinir)
3. "Aktive Et" butonuna basin
4. Paketinize dahil ozellikler otomatik acilacaktir

## Port Gereksinimleri

| Port | Servis | Aciklama |
|------|--------|----------|
| 3002 | Tiginer NMS | Ana uygulama (web arayuzu) |
| 5432 | PostgreSQL | Veritabani (bundled modda, sadece internal) |
| 6379 | Redis | Cache (sadece internal) |
| 8086 | InfluxDB | Metrik DB (sadece internal) |

> **Not:** Sadece 3002 portunu disariya acmaniz yeterlidir. Diger portlar Docker network icinde calisir.

## SSL/HTTPS Kurulumu (Istege Bagli)

Production ortaminda HTTPS kullanmak isterseniz Nginx reverse proxy yapilandirabilirsiniz:

### Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name nms.firmaadi.com;

    ssl_certificate     /etc/ssl/certs/tiginer.crt;
    ssl_certificate_key /etc/ssl/private/tiginer.key;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Yedekleme

### Veritabani Yedegi
```bash
# Bundled mod — Docker icinden yedek al
docker compose exec postgres pg_dump -U tiginer tiginer > backup_$(date +%Y%m%d).sql

# External mod — Dis sunucudan yedek al
pg_dump -h db-sunucu -U tiginer tiginer > backup_$(date +%Y%m%d).sql

# Geri yukle
docker compose exec -T postgres psql -U tiginer tiginer < backup_20240101.sql
```

### Tam Yedek
```bash
docker compose down
tar czf tiginer-backup-$(date +%Y%m%d).tar.gz /opt/tiginer
docker compose up -d
```

## Guncelleme

```bash
cd /opt/tiginer
docker compose down
# Yeni surumu indirin ve acin
docker compose pull
docker compose up -d
docker compose exec app npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma
```

## Sorun Giderme

### Loglar
```bash
docker compose logs -f app        # Uygulama loglari
docker compose logs -f postgres    # Veritabani loglari (bundled mod)
docker compose ps                  # Servis durumlari
```

### Servis Yeniden Baslat
```bash
docker compose restart app
```

### Tamamen Sifirla
```bash
docker compose down -v    # DIKKAT: Tum verileri siler!
./install.sh
```

## Destek

- E-posta: destek@tiginer.com
- Web: https://tiginer.com/demo

# 4. Veritabani schema guncellemesi (varsa yeni tablolar/sutunlar otomatik eklenir)
docker compose exec app npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma
```

> **Not:** Guncelleme icin aktif internet baglantisi ve gecerli registry erisimi gereklidir.
> `prisma migrate deploy` mevcut verilere dokunmaz, sadece yeni tablo/sutun ekler.

## Sorun Giderme

### Loglar
```bash
docker compose logs -f app        # Uygulama loglari
docker compose logs -f postgres    # Veritabani loglari
docker compose ps                  # Servis durumlari
```

### Servis Yeniden Baslat
```bash
docker compose restart app
```

### Tamamen Sifirla
```bash
docker compose down -v    # DİKKAT: Tum verileri siler!
./install.sh
```

## Destek

- E-posta: destek@tiginer.com
- Web: https://tiginer.com/demo
