# Tiginer Go-Live Acceptance Report

Tarih: 2026-02-10  
Durum: On inceleme tamamlandi, final kabul bekliyor

Uygulama notu: Uygulanacak adimlar `GO_LIVE_TEST_STEPS.md` dosyasinda detayli tanimlidir.

## PASS / FAIL Ozeti

| Alan | Durum | Not |
|---|---|---|
| Lisans sunucusu + admin panel | PENDING | Uctan uca canli test kaniti bekleniyor |
| Self-hosted aktivasyon + grace | PENDING | Offline senaryo kayitlari eklenmeli |
| Update dagitimi | PENDING | Manifest/checksum negatif test raporu bekleniyor |
| Guvenlik sertlestirme | PARTIAL PASS | Secret ayrimi ve CI policy guncellemeleri dogrulandi; tum route matrisi raporu eklenecek |
| Operasyon dokumantasyonu | PARTIAL PASS | Dokumanlar var; dry-run kaniti bekleniyor |

## P0 / P1 / P2 Aksiyonlari

### P0

- Lisans dogrulama akisinin canli endpoint kanitlari (basari, timeout, suspended)
- Entitlement kapali modullerde API seviyesinde 403 kaniti

### P1

- Update manifest checksum bozma testi ve guvenli rollback davranisi
- Backup/restore dry-run ciktilari ve adim adim ispat

### P2

- Pentest planinin tarih ve sorumlu atamasi
- Operasyon runbook son format duzenlemesi

## Aksiyon Takip Tablosu (Kapanis Icin)

| Oncelik | Aksiyon | Sorumlu | Hedef Tarih | Durum | Kanit |
|---|---|---|---|---|---|
| P0 | Lisans dogrulama canli endpoint kanitlari (basari/timeout/suspended) | TBA | 2026-02-12 | OPEN | license-verify-success.png, license-verify-suspended.png, license-verify.log |
| P0 | Entitlement kapali modullerde API 403 kaniti | TBA | 2026-02-12 | OPEN | entitlement-403.log |
| P1 | Update manifest checksum bozma testi ve guvenli rollback | TBA | 2026-02-13 | OPEN | update-manifest-checksum-fail.png |
| P1 | Backup/restore dry-run ciktilari | TBA | 2026-02-13 | OPEN | backup-restore-dryrun.log |
| P2 | Pentest plan tarih/sorumlu atamasi | TBA | 2026-02-14 | OPEN | pentest-plan.md (veya ticket linki) |
| P2 | Operasyon runbook son format | TBA | 2026-02-14 | OPEN | runbook-vfinal.md |

Not: TBA alanlari ilgili ekip liderleri tarafindan ataninca guncellenecek.

## Bugun Baslanacak Net Siralama

1. P0 lisans dogrulama 3 senaryo (basari/suspended/timeout)
2. P0 entitlement 403 API+UI kaniti
3. Kanit dosyalarinin `evidence/2026-02-10/` altina toplanmasi
4. PASS/FAIL tablosunun P0 sonucuna gore yeniden hesaplanmasi

## Go / No-Go

Su an: **NO-GO (gecici)**  
Kosullu GO icin: P0 maddeleri kapanmali ve kanit eklenmeli.

## Kanit Ekleme Alani

- Ekran goruntuleri:
  - [ ] lisans-admin-create.png
  - [ ] license-verify-success.png
  - [ ] license-verify-suspended.png
  - [ ] update-manifest-checksum-fail.png
- Loglar:
  - [ ] license-verify.log
  - [ ] entitlement-403.log
  - [ ] backup-restore-dryrun.log
