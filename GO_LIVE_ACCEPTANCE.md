# Tiginer Go-Live Acceptance Checklist

Bu dosya, kurumsal satışa cikis oncesi son kabul kontrol listesidir.
Son guncelleme: 2026-02-10 (rapor ile senkron)

## 1) Lisans Sunucusu ve Admin Panel

- [ ] Musteri olusturma, lisans anahtari uretme
- [ ] Modul atama (core, automation, security, config-audit vb.)
- [ ] Askıya alma / tekrar aktive etme
- [ ] 1 yillik lisans sure ve kalan gun kontrolu
- [ ] Gunluk dogrulama endpoint testi (basarili / timeout / hatali)

## 2) Self-Hosted Client Entegrasyonu

- [ ] Ilk aktivasyon akisi (license key giris)
- [ ] Offline grace period davranisi
- [ ] Lisans askiya alindiginda modullerin kapanmasi
- [ ] Temel modulde kapali olmasi gereken ozelliklerin API+UI+background kapali oldugunun testi

## 3) Guncelleme Dagitimi

- [ ] Update manifest: version, checksum, release notes, download URL
- [ ] Yeni surum yayini algilanmasi
- [ ] Bozuk checksum paketinde guvenli hata davranisi

## 4) Guvenlik

- [x] INTERNAL_API_SECRET tek kaynak
- [ ] Role + entitlement + rate-limit tutarliligi
- [ ] Production hata cevaplarinda stack trace sizintisi olmamasi
- [ ] Admin panel security (MFA, session, IP allowlist politikasi)

## 5) Operasyon ve Dokumantasyon

- [ ] Backup/restore dry-run
- [ ] Port/firewall dokumani ile fiili servislerin uyumu
- [x] CI guvenlik politikasi (high/critical fail)
- [ ] Changelog ve upgrade notu sureci

## 6) Son Karar

- [x] PASS / FAIL tablosu tamamlandi
- [x] P0/P1/P2 aksiyon listesi olusturuldu
- [x] Go / No-Go karari verildi
