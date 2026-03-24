@echo off
rem ============================================================
rem  Tiginer NMS — Windows Kurulum Scripti
rem  Bu scripti yonetici olarak calistirin.
rem ============================================================
setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Tiginer NMS Kurulum
echo ========================================
echo.

rem ── Gereksinim kontrolu ──
echo [1/7] Gereksinimler kontrol ediliyor...

where docker >nul 2>nul
if errorlevel 1 (
    echo HATA: Docker bulunamadi!
    echo Docker Desktop'u kurun: https://www.docker.com/products/docker-desktop/
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo HATA: Docker calismiyyor! Docker Desktop'u baslatin.
    exit /b 1
)

echo   Docker: OK

rem ── .env dosyasi kontrolu ──
echo [2/7] Ortam degiskenleri kontrol ediliyor...
if not exist ".env" (
    echo .env dosyasi bulunamadi, otomatik olusturuluyor...
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set PG_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set RD_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set IF_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set IF_TOK=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set NA_SEC=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set IA_SEC=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set EN_KEY=%%a
    powershell -Command "(Get-Content '.env.example') -replace 'BURAYA_GUCLU_SIFRE_GIRIN','!PG_PASS!' -replace 'BURAYA_REDIS_SIFRESI','!RD_PASS!' -replace 'BURAYA_INFLUX_SIFRESI','!IF_PASS!' -replace 'BURAYA_INFLUX_TOKEN_GIRIN','!IF_TOK!' -replace 'NEXTAUTH_SECRET=BURAYA_RASTGELE_32_BYTE_HEX','NEXTAUTH_SECRET=!NA_SEC!' -replace 'INTERNAL_API_SECRET=BURAYA_RASTGELE_32_BYTE_HEX','INTERNAL_API_SECRET=!IA_SEC!' -replace 'ENCRYPTION_KEY=BURAYA_RASTGELE_32_BYTE_HEX','ENCRYPTION_KEY=!EN_KEY!' | Set-Content '.env' -Encoding UTF8"
    echo   .env dosyasi guclu sifrelerle otomatik olusturuldu!
    echo.
)

rem ── Private Registry Login ──
echo [3/7] Tiginer imaj deposuna giris yapiliyor...
echo   Tiginer tarafindan size verilen erisim tokenini girin.
docker login ghcr.io
if errorlevel 1 (
    echo HATA: Registry giris basarisiz! Token bilgilerinizi kontrol edin.
    echo   Kullanici adi: musteriniz@email.com
    echo   Sifre: size verilen erisim tokeni
    exit /b 1
)
echo   Registry: OK

rem ── Docker imajlarini cek ──
echo [4/7] Docker imajlari indiriliyor...
docker compose pull
if errorlevel 1 (
    echo HATA: Imajlar indirilemedi! Internet baglantinizi ve lisansinizi kontrol edin.
    exit /b 1
)

rem ── Veritabani olustur ──
echo [5/7] Servisler baslatiliyor...
docker compose up -d postgres redis influxdb
echo   Veritabani hazir olana kadar bekleniyor...
timeout /t 15 /nobreak >nul

rem ── Database migration ──
echo [6/7] Veritabani schemasi olusturuluyor...
docker compose up -d app
timeout /t 10 /nobreak >nul
docker compose exec app npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

rem ── Tamam ──
echo [7/7] Kurulum tamamlandi!
echo.
echo ========================================
echo  Tiginer NMS basariyla kuruldu!
echo.
echo  Uygulama: http://localhost:3002
echo  Varsayilan giris:
echo    Kullanici: admin@tiginer.local
echo    Sifre: admin (ilk giriste degistirin!)
echo.
echo  ── Servis Yonetimi ──
echo    tiginer.cmd    Yonetim paneli (menu)
echo    baslat.cmd     Servisi baslat
echo    durdur.cmd     Servisi durdur
echo    durum.cmd      Durum kontrolu
echo ========================================
echo.
pause
