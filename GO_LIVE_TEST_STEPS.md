# Tiginer Go-Live Test Steps

Bu dosya, kabul raporundaki P0/P1 maddelerini kanitla kapatmak icin uygulanacak net adimlari icerir.

## Hazirlik

- Ortamlar:
  - `LICENSE_SERVER_URL` erisilebilir olmali
  - Self-hosted Tiginer ortami calisir durumda olmali
- Test kullanicilari:
  - Admin kullanici
  - Operator kullanici
- Kanit dizini:
  - `tiginer.com/evidence/2026-02-10/`

## P0-1 Lisans Dogrulama Kaniti

### Senaryo A: Basarili Dogrulama
1. Admin panelde aktif lisans olustur.
2. Client uygulamada lisans anahtarini kaydet.
3. Dogrulama endpoint cagrisini tetikle (manuel veya scheduler).
4. Beklenen:
   - `valid=true`
   - `status=active`
   - `expiresAt` dolu
5. Kanit:
   - `license-verify-success.png`
   - `license-verify.log`

### Senaryo B: Suspended
1. Admin panelden ilgili lisansi `suspended` yap.
2. Client tarafinda dogrulama tetikle.
3. Beklenen:
   - `valid=false` veya `suspended=true`
   - Moduller entitlement'a gore kapanir
4. Kanit:
   - `license-verify-suspended.png`
   - `license-verify.log`

### Senaryo C: Timeout / Erisilemez Lisans Sunucusu
1. `LICENSE_SERVER_URL` erisimi gecici kes.
2. Dogrulama tetikle.
3. Beklenen:
   - Grace period devreye girer
   - Uygulama kontrollu uyari verir, crash olmaz
4. Kanit:
   - `license-verify-timeout.png`
   - `license-verify.log`

## P0-2 Entitlement API 403 Kaniti

1. Config audit/config backup gibi lisansli bir modul icin entitlement'i kapat.
2. Ilgili API endpoint'e istek at:
   - Beklenen: `403`, `upgrade=true` benzeri cevap
3. UI tarafinda ilgili aksiyon/ekran kapali veya upsell'e yonlenmis olmali.
4. Kanit:
   - `entitlement-403.log`
   - `entitlement-ui-blocked.png`

## P1-1 Update Manifest Checksum Negatif Testi

1. Manifestte gecersiz checksum ile test paketi yayinla.
2. Client guncelleme kontrolu yaptiginda paketi dogrulayamamali.
3. Beklenen:
   - Guvenli hata mesaji
   - Uygulama mevcut surumde calismaya devam eder (rollback/no-change)
4. Kanit:
   - `update-manifest-checksum-fail.png`
   - `update-checksum.log`

## P1-2 Backup/Restore Dry-Run

1. DB backup al.
2. Uygulama ayar yedegi al.
3. Temiz test ortamina restore et.
4. Beklenen:
   - Login, dashboard, lisans durumu, kritik tablolar aciliyor
5. Kanit:
   - `backup-restore-dryrun.log`
   - `restore-validation.png`

## Kapanis Kriteri

- Tum P0 maddeleri `DONE` + kanitlari ekli ise `NO-GO` -> `GO` degerlendirmesi yapilabilir.
- P1/P2 maddeleri planli acik risk olarak not dusulerek kosullu GO verilebilir.
