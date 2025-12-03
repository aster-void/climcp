#!/usr/bin/env bash
set -euo pipefail

CLI="node dist/index.js"

out="$($CLI run list_allowed_directories bunx @modelcontextprotocol/server-filesystem /tmp <<<"{}")"
if ! [ "$(echo "$out" | jq ".structuredContent.content")" != "Allowed directories:\\n/tmp" ]; then
  exit 1
fi

# should fail
$CLI run list_allowed_directories bunx @modelcontextprotocol/server-filesystem . <<<"not-json" 2>/dev/null && exit 1 

echo "All tests passed."
