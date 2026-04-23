#!/usr/bin/env bash
# Seed KV with existing release manifest entries.
# Uses portal admin API to upsert each release via wrangler's deployed Worker.
set -e
cd "$(dirname "$0")/.."

WORKER_URL="${WORKER_URL:-https://tiginer-portal.ysfweb1.workers.dev}"
# shellcheck disable=SC1091
source <(grep -E '^ADMIN_' .secrets/credentials.txt | sed 's/^/export /')

echo "=== Login to $WORKER_URL ==="
COOKIE=$(mktemp)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE" \
  -X POST "$WORKER_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
if [ "$HTTP" != "200" ]; then
  echo "Login failed (HTTP $HTTP). Aborting."
  exit 1
fi
echo "Logged in."

post_release() {
  local version="$1" platform="$2" downloadUrl="$3" sha256="$4" sizeBytes="$5" notes="$6" minTier="$7"
  echo "-- POST $version/$platform"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -b "$COOKIE" \
    -X POST "$WORKER_URL/api/admin/releases" \
    -H "Content-Type: application/json" \
    -d "{
      \"version\": \"$version\",
      \"platform\": \"$platform\",
      \"downloadUrl\": \"$downloadUrl\",
      \"sha256\": \"$sha256\",
      \"sizeBytes\": $sizeBytes,
      \"releaseNotes\": \"$notes\",
      \"minTier\": \"$minTier\"
    }"
}

post_release "1.0.0" "windows-x64" \
  "https://updates.tiginer.com/releases/binaries/windows-x64/tiginer-client-1.0.0.zip" \
  "81816b31f624d62e4726c51e9579328536ecb30cd1bf6f08176b06fb0f3bad45" \
  "46976842" \
  "Initial production release." \
  "BASIC"

post_release "1.0.0" "linux-x64" \
  "https://updates.tiginer.com/releases/binaries/linux-x64/tiginer-client-1.0.0.tar.gz" \
  "7127d719056879340e911c1dfa97f51d6b1a4d63e821fc51957abed43d431f1e" \
  "45461081" \
  "Initial production release." \
  "BASIC"

rm -f "$COOKIE"
echo ""
echo "=== Verify ==="
curl -s "$WORKER_URL/api/update/manifest" | head -c 1200
echo ""
