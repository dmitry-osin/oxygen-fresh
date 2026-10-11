#!/bin/sh
set -eu
export PORT="${PORT:-8000}"
export KV_PATH="${KV_PATH:-/data/blog/kv.sqlite3}"
export UPLOAD_DIR="${UPLOAD_DIR:-/data/uploads}"
mkdir -p "$(dirname "$KV_PATH")" "$UPLOAD_DIR"
# New Railway environments support IPv4 private networking.
# Set HOST=[::] only when using a legacy IPv6-only environment.
exec deno serve --host "${HOST:-0.0.0.0}" --port "$PORT" --allow-net --allow-env --allow-read --allow-write _fresh/server.js
