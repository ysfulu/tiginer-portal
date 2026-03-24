#!/usr/bin/env bash
# Tiginer NMS — Durum Kontrolu
echo ""
echo "  ========================================"
echo "   Tiginer NMS Servis Durumu"
echo "  ========================================"
echo ""
docker compose ps
echo ""
echo "  ────────────────────────────────────────"
echo "  Saglik Kontrolu:"
echo ""
for container in tiginer-app tiginer-postgres tiginer-redis tiginer-influxdb; do
    status=$(docker inspect --format '{{.Name}} - {{.State.Status}} ({{if .State.Health}}{{.State.Health.Status}}{{else}}no healthcheck{{end}})' "$container" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   $status"
    fi
done
echo ""
