@echo off
rem  Tiginer NMS — Servisi Durdur
title Tiginer NMS Durduruluyor...
echo.
echo  Tiginer NMS durduruluyor...
echo.
docker compose down
if errorlevel 1 (
    echo.
    echo  HATA: Servis durdurulamadi!
) else (
    echo.
    echo  Servis durduruldu.
)
echo.
pause
