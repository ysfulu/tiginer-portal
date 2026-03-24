# tiginer.com — Musteri Portali ve Admin Paneli

Tiginer urun tanitim sitesi, demo talep formu, indirme sayfasi ve lisans yonetim admin paneli.

## Sayfalar

| Sayfa | URL | Aciklama |
|-------|-----|----------|
| Ana Sayfa | `/` | Urun tanitimi, ozellikler, paketler |
| Demo Talep | `/demo` | Musteri demo talep formu |
| Indirme | `/download` | Uygulama indirme linkleri ve kurulum adimlari |
| Admin Panel | `/admin` | Dashboard, musteri/lisans yonetimi, demo talep yonetimi |

## API Endpoints

| Yol | Yetki | Aciklama |
|-----|-------|----------|
| `POST /api/demo-request` | Herkese acik | Demo talebi gonder |
| `POST /api/admin/login` | — | Admin giris |
| `POST /api/admin/logout` | Admin | Cikis |
| `GET /api/admin/me` | — | Oturum kontrolu |
| `GET /api/admin/stats` | Admin | Dashboard istatistikleri |
| `GET /api/admin/customers` | Admin | Musteri listesi (?status=, ?search=) |
| `POST /api/admin/customers` | Admin | Musteri ekle |
| `PATCH /api/admin/customers/:id` | Admin | Musteri guncelle |
| `DELETE /api/admin/customers/:id` | Admin | Musteri sil |
| `GET /api/admin/demos` | Admin | Demo talepleri listesi |
| `PATCH /api/admin/demos/:id` | Admin | Demo talebi guncelle |
| `DELETE /api/admin/demos/:id` | Admin | Demo talebi sil |
| `GET /api/license/verify?key=` | Herkese acik | Lisans dogrulama |

## Kurulum

```bash
cd tiginer.com
npm install
cp .env.example .env   # degerleri guncelle
npm start
```

Varsayilan adres: `http://localhost:8080`

## Ortam Degiskenleri

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `PORT` | 8080 | Sunucu portu |
| `SESSION_SECRET` | change-me | Oturum sifresi |
| `ADMIN_USER` | admin | Admin kullanici adi |
| `ADMIN_PASS` | change-me | Admin sifresi |
| `NODE_ENV` | — | production icin `production` |

## Production Onerileri

- Reverse proxy (nginx/Caddy) + HTTPS
- `SESSION_SECRET` ve `ADMIN_PASS` guclu deger
- `NODE_ENV=production` (secure cookie aktif olur)
- Yedekleme: `data/` klasoru duzenli yedeklensin
- MFA veya IP kisitlamasi eklenmesi onerilir
