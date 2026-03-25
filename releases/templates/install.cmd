@echo off
rem ============================================================
rem  Tiginer NMS — Windows Kurulum Scripti
rem  Bu scripti yonetici olarak calistirin.
rem
rem  Desteklenen modlar:
rem    DB_MODE=bundled  → PostgreSQL Docker ile birlikte (varsayilan)
rem    DB_MODE=external → Dis PostgreSQL sunucusu
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
    echo .env dosyasi bulunamadi, ornek dosyadan olusturuluyor...
    copy ".env.example" ".env"
    echo.
    echo ONEMLI: .env dosyasini duzenleyip guclu sifreler girin!
    echo Dosya: %cd%\.env
    echo.
    echo Sifre olusturmak icin:
    echo   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    echo.
    pause
)

rem ── DB_MODE oku ──
set DB_MODE=bundled
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_MODE" set DB_MODE=%%b
)
echo   Veritabani modu: %DB_MODE%

rem ── Guvenlik anahtarlarini kontrol et ──
echo [3/7] Guvenlik anahtarlari kontrol ediliyor...
echo   Eger .env'deki degerler varsayilan ise lutfen degistirin.

rem ── Docker imajlarini cek ──
echo [4/7] Docker imajlari indiriliyor...
docker compose pull

rem ── Servisleri baslat ──
echo [5/7] Servisler baslatiliyor...

if /i "%DB_MODE%"=="external" (
    echo   Dis PostgreSQL kullaniliyor...
    set DB_URL=
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DATABASE_URL" set DB_URL=%%b
    )
    if "!DB_URL!"=="" (
        echo HATA: DB_MODE=external ama DATABASE_URL bos!
        echo .env dosyasinda DATABASE_URL degerini doldurun.
        exit /b 1
    )
    docker compose up -d redis influxdb
) else (
    echo   PostgreSQL (bundled) baslatiliyor...
    docker compose --profile bundled-db up -d postgres redis influxdb
)

echo   Servisler hazir olana kadar bekleniyor...
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
echo  Veritabani modu: %DB_MODE%
echo.
echo  Varsayilan giris:
echo    Kullanici: admin@tiginer.local
echo    Sifre: admin (ilk giriste degistirin!)
echo.
echo  Durum kontrolu:
echo    docker compose ps
echo.
echo  Loglari izle:
echo    docker compose logs -f app
echo.
echo  Durdur:
echo    docker compose down
echo ========================================
echo.
pause
