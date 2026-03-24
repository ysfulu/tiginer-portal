#!/usr/bin/env bash
# Tiginer NMS — Servisi Durdur
echo ""
echo "  Tiginer NMS durduruluyor..."
echo ""
if docker compose down; then
    echo ""
    echo "  Servis durduruldu."
else
    echo ""
    echo "  HATA: Servis durdurulamadi!"
fi
echo ""
