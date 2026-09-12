#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-dev}"
PID_FILE="$ROOT_DIR/logs/${MODE}.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "$MODE server is not running"
  exit 0
fi

IFS= read -r pid < "$PID_FILE"
if kill -0 "$pid" 2>/dev/null; then
  kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
fi
rm -f "$PID_FILE"
echo "$MODE server stopped"
