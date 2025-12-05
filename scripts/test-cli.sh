#!/usr/bin/env bash
set -euo pipefail

CLI="bun src/index.ts"
SERVER="bun node_modules/.bin/mcp-server-filesystem"

out="$($CLI run "$SERVER /tmp" list_allowed_directories)"
if ! echo "$out" | grep -q "Allowed directories"; then
  echo "Expected output to contain 'Allowed directories'"
  exit 1
fi

# should fail with invalid format
$CLI run "$SERVER ." list_directory <<<"not-json-or-query" 2>/dev/null && exit 1

echo "All tests passed."
