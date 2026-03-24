@echo off
rem  Tiginer NMS — Durum Kontrolu
title Tiginer NMS Durum
echo.
echo  ========================================
echo   Tiginer NMS Servis Durumu
echo  ========================================
echo.
docker compose ps
echo.
echo  ────────────────────────────────────────
echo  Saglik Kontrolu:
echo.
for /f "tokens=*" %%i in ('docker inspect --format "{{.Name}} - {{.State.Status}} ({{.State.Health.Status}})" tiginer-app 2^>nul') do (
    echo   Uygulama:   %%i
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
