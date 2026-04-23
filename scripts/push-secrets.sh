#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source <(grep -E '^[A-Z_]+=' .secrets/credentials.txt | sed 's/^/export /')

echo "=== Pushing secrets to Cloudflare Workers ==="
echo "$ADMIN_USER" | npx wrangler secret put ADMIN_USER
echo "$ADMIN_PASS" | npx wrangler secret put ADMIN_PASS
echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET
echo "$LICENSE_SIGN_KEY" | npx wrangler secret put LICENSE_SIGN_KEY
echo "=== Done ==="
