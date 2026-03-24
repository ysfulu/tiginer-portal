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

## Hizli Kurulum (Docker)

### 1. Kurulum paketini acin
```bash
unzip tiginer-nms-setup.zip -d /opt/tiginer
cd /opt/tiginer
```

### 2. Ortam degiskenlerini ayarlayin
```bash
cp .env.example .env
nano .env
```

**Onemli:** Asagidaki degerleri mutlaka degistirin:
- `POSTGRES_PASSWORD` — PostgreSQL sifresi
- `INFLUXDB_PASSWORD` — InfluxDB sifresi
- `INFLUXDB_TOKEN` — InfluxDB API token
- `NEXTAUTH_SECRET` — Oturum sifresi
- `INTERNAL_API_SECRET` — Dahili API anahtari
- `ENCRYPTION_KEY` — Sifreleme anahtari
- `LICENSE_KEY` — Tiginer lisans anahtariniz

Rastgele anahtar olusturmak icin:
```bash
openssl rand -hex 32
```

### 3. Docker Registry Girisi
Tiginer tarafindan size verilen erisim bilgileriyle giris yapin:
```bash
docker login ghcr.io
```
- **Kullanici adi:** Size verilen kullanici adi
- **Sifre:** Size verilen erisim tokeni

> **Not:** Bu adim olmadan uygulama imaji indirilemez.

### 4. Kurulum scriptini calistirin
```bash
# Linux/macOS
chmod +x install.sh tiginer.sh baslat.sh durdur.sh durum.sh
./install.sh

# Windows
install.cmd
```

### 5. Uygulamaya erisin
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

## Servis Yonetimi

Kurulum sonrasi servisi kolayca yonetmek icin hazir scriptler sunulmustur:

### Yonetim Paneli (Tavsiye Edilen)
Tek bir menuden tum islemleri yapabilirsiniz:
```bash
# Windows — cift tiklayin
tiginer.cmd

# Linux/macOS
./tiginer.sh
```

Menu secenekleri:
1. Servisi Baslat
2. Servisi Durdur
3. Durum Kontrolu
4. Loglari Goruntule
5. Servisi Yeniden Baslat
6. Guncelleme

### Hizli Erisim Scriptleri
Tek bir islem icin dogrudan scriptleri kullanabilirsiniz:

| Windows | Linux/macOS | Aciklama |
|---------|-------------|----------|
| `baslat.cmd` | `./baslat.sh` | Servisi baslat |
| `durdur.cmd` | `./durdur.sh` | Servisi durdur |
| `durum.cmd` | `./durum.sh` | Durum kontrolu |

> **Ipucu:** Windows'ta scriptleri cift tiklayarak calistirabilirsiniz.

## Port Gereksinimleri

| Port | Servis | Aciklama |
|------|--------|----------|
| 3002 | Tiginer NMS | Ana uygulama (web arayuzu) |
| 5432 | PostgreSQL | Veritabani (sadece internal) |
| 6379 | Redis | Cache (sadece internal) |
| 8086 | InfluxDB | Metrik DB (sadece internal) |

> **Not:** Sadece 3002 portunu disariya acmaniz yeterlidir. Diger portlar Docker network icinde calisir.

## Veri Guvenligi (Guncelleme & Restart)

Asagidaki veriler Docker **volume**'larda saklanir ve container guncelleme/yeniden baslatma sirasinda **KORUNUR**:

| Veri | Volume | Aciklama |
|------|--------|----------|
| Cihazlar, kullanicilar, ayarlar | `postgres_data` | Ana veritabani — tum isletme verileri |
| SNMP metrikleri, trafik kayitlari | `influxdb_data` | Zaman serisi verileri (90 gun) |
| Oturum cache, rate-limit | `redis_data` | Cache verileri |
| Yuklenen dosyalar (resim vb.) | `app_uploads` | Findings resimleri vs. |
| Uygulama loglari | `app_logs` | Error ve combined loglar |

**Ne kaybolur:** Yalnizca gecici cache dosyalari (WebSocket kuyrugu, SSL tarama durumu).
Bunlar server basladiginda otomatik yeniden olusturulur, veri kaybi YOKTUR.

## SSL/HTTPS Kurulumu (Onerilen)

Production ortaminda HTTPS kullanmanizi siddetle oneriyoruz:

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
# Yedek al
docker compose exec postgres pg_dump -U tiginer tiginer > backup_$(date +%Y%m%d).sql

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

> **Verileriniz guvendedir:** Guncelleme sirasinda veritabaniniz, metrikleriniz
> ve yuklenen dosyalariniz Docker volume'larda saklanir ve SILINMEZ.
> Yalnizca uygulama container'i yeni imajla degistirilir.

```bash
cd /opt/tiginer

# 1. Guncelleme oncesi yedek alin (onerilen)
docker compose exec postgres pg_dump -U tiginer tiginer > backup_$(date +%Y%m%d).sql

# 2. .env dosyasinda TIGINER_VERSION degerini yeni surumle degistirin
# Ornek: TIGINER_VERSION=2.1.0

# 3. Guncelle
docker compose down
docker compose pull        # Yeni imaji indir (registry login gerekir)
docker compose up -d

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
