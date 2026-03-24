@echo off
rem ============================================================
rem  Tiginer NMS — Servis Yonetim Paneli
rem  Bu scripti cift tiklayarak calistirabilirsiniz.
rem ============================================================
setlocal enabledelayedexpansion
title Tiginer NMS Yonetim Paneli

rem ── Baslangic kontrolleri ──
docker info >nul 2>nul
if errorlevel 1 (
    echo.
    echo  HATA: Docker calismiyyor!
    echo  Docker Desktop'u baslatin ve tekrar deneyin.
    echo.
    pause
    exit /b 1
)

rem ── .env otomatik olusturma ──
if not exist ".env" (
    if not exist ".env.example" (
        echo.
        echo  HATA: .env.example dosyasi bulunamadi!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  .env dosyasi bulunamadi, otomatik olusturuluyor...
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set PG_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set RD_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N')"') do set IF_PASS=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set IF_TOK=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set NA_SEC=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set IA_SEC=%%a
    for /f "delims=" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set EN_KEY=%%a
    powershell -Command "(Get-Content '.env.example') -replace 'BURAYA_GUCLU_SIFRE_GIRIN','!PG_PASS!' -replace 'BURAYA_REDIS_SIFRESI','!RD_PASS!' -replace 'BURAYA_INFLUX_SIFRESI','!IF_PASS!' -replace 'BURAYA_INFLUX_TOKEN_GIRIN','!IF_TOK!' -replace 'NEXTAUTH_SECRET=BURAYA_RASTGELE_32_BYTE_HEX','NEXTAUTH_SECRET=!NA_SEC!' -replace 'INTERNAL_API_SECRET=BURAYA_RASTGELE_32_BYTE_HEX','INTERNAL_API_SECRET=!IA_SEC!' -replace 'ENCRYPTION_KEY=BURAYA_RASTGELE_32_BYTE_HEX','ENCRYPTION_KEY=!EN_KEY!' | Set-Content '.env' -Encoding UTF8"
    echo  .env dosyasi guclu sifrelerle olusturuldu!
    echo.
    timeout /t 3 /nobreak >nul
)

:menu
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      Tiginer NMS Yonetim Paneli          ║
echo  ╚══════════════════════════════════════════╝
echo.
echo   [1] Servisi Baslat
echo   [2] Servisi Durdur
echo   [3] Durum Kontrolu
echo   [4] Loglari Goruntule
echo   [5] Servisi Yeniden Baslat
echo   [6] Guncelleme (Imajlari Cek)
echo   [0] Cikis
echo.
set /p secim="  Seciminiz: "

if "%secim%"=="1" goto baslat
if "%secim%"=="2" goto durdur
if "%secim%"=="3" goto durum
if "%secim%"=="4" goto loglar
if "%secim%"=="5" goto yenidenbaslat
if "%secim%"=="6" goto guncelle
if "%secim%"=="0" goto cikis

echo.
echo  Gecersiz secim! Tekrar deneyin.
timeout /t 2 /nobreak >nul
goto menu

:baslat
cls
echo.
echo  Servis baslatiliyor...
echo.
docker compose up -d
if errorlevel 1 (
    echo.
    echo  HATA: Servis baslatilamadi!
    echo  Docker Desktop'un calistigindan emin olun.
) else (
    echo.
    echo  Servis basariyla baslatildi!
    echo.
    echo  Uygulama: http://localhost:3002
    echo  Hazir olmasi icin 30 saniye kadar bekleyin.
)
echo.
pause
goto menu

:durdur
cls
echo.
echo  Servis durduruluyor...
echo.
docker compose down
if errorlevel 1 (
    echo.
    echo  HATA: Servis durdurulamadi!
) else (
    echo.
    echo  Servis basariyla durduruldu.
)
echo.
pause
goto menu

:durum
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Servis Durumu                     ║
echo  ╚══════════════════════════════════════════╝
echo.
docker compose ps
echo.
echo  ──────────────────────────────────────────
echo  Saglik Kontrolu:
echo.
for /f "tokens=*" %%i in ('docker inspect --format "{{.Name}} - {{.State.Status}} ({{.State.Health.Status}})" tiginer-app 2^>nul') do (
    echo   Uygulama:  %%i
)
for /f "tokens=*" %%i in ('docker inspect --format "{{.Name}} - {{.State.Status}} ({{.State.Health.Status}})" tiginer-postgres 2^>nul') do (
    echo   PostgreSQL: %%i
)
for /f "tokens=*" %%i in ('docker inspect --format "{{.Name}} - {{.State.Status}} ({{.State.Health.Status}})" tiginer-redis 2^>nul') do (
    echo   Redis:      %%i
)
for /f "tokens=*" %%i in ('docker inspect --format "{{.Name}} - {{.State.Status}} ({{.State.Health.Status}})" tiginer-influxdb 2^>nul') do (
    echo   InfluxDB:   %%i
)
echo.
pause
goto menu

:loglar
cls
echo.
echo  Son loglar gosteriliyor (cikmak icin Ctrl+C)...
echo.
docker compose logs --tail 50 -f app
echo.
pause
goto menu

:yenidenbaslat
cls
echo.
echo  Servis yeniden baslatiliyor...
echo.
docker compose restart
if errorlevel 1 (
    echo.
    echo  HATA: Yeniden baslatma basarisiz!
) else (
    echo.
    echo  Servis yeniden baslatildi!
    echo  Uygulama: http://localhost:3002
)
echo.
pause
goto menu

:guncelle
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Guncelleme                        ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Yeni imajlar indiriliyor...
echo.
docker compose pull
if errorlevel 1 (
    echo.
    echo  HATA: Imajlar indirilemedi!
    echo  Internet baglantinizi kontrol edin.
    echo.
    pause
    goto menu
)
echo.
echo  Servis guncelleniyor (verileriniz korunur)...
echo.
docker compose up -d
echo.
echo  Guncelleme tamamlandi!
echo  Uygulama: http://localhost:3002
echo.
pause
goto menu

:cikis
echo.
echo  Iyi calismalar!
echo.
timeout /t 2 /nobreak >nul
exit /b 0
