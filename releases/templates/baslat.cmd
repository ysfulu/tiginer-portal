@echo off
rem  Tiginer NMS — Servisi Baslat
setlocal enabledelayedexpansion
title Tiginer NMS Baslatiliyor...

rem ── Docker kontrolu ──
docker info >nul 2>nul
if errorlevel 1 (
    echo.
    echo  HATA: Docker calismiyyor!
    echo  Docker Desktop'u baslatin ve tekrar deneyin.
    echo.
    pause
    exit /b 1
)

rem ── .env kontrolu ──
if not exist ".env" (
    echo.
    echo  .env dosyasi bulunamadi, otomatik olusturuluyor...
    echo.
    if not exist ".env.example" (
        echo  HATA: .env.example dosyasi bulunamadi!
        echo  Kurulum paketinizin eksiksiz oldugundan emin olun.
        echo.
        pause
        exit /b 1
    )
    rem Guclu rastgele sifreler olustur
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
)

echo.
echo  Tiginer NMS baslatiliyor...
echo.
docker compose up -d
if errorlevel 1 (
    echo.
    echo  HATA: Servis baslatilamadi!
    echo  Docker Desktop'un calistigindan emin olun.
) else (
    echo.
    echo  Servis baslatildi!
    echo  Uygulama: http://localhost:3002
    echo  Hazir olmasi icin 30 saniye kadar bekleyin.
)
echo.
pause
