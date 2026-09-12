#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/load-local-secrets.sh"

mkdir -p "$ROOT_DIR/logs"
PID_FILE="$ROOT_DIR/logs/dev.pid"
LOG_FILE="$ROOT_DIR/logs/dev.log"
PORT="${PORT:-3000}"

if [[ -f "$PID_FILE" ]]; then
  IFS= read -r existing_pid < "$PID_FILE"
  if kill -0 "$existing_pid" 2>/dev/null; then
    echo "dev server already running (pid=$existing_pid)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

cd "$ROOT_DIR"
setsid pnpm dev --hostname 127.0.0.1 --port "$PORT" >>"$LOG_FILE" 2>&1 &
pid=$!
printf '%s\n' "$pid" > "$PID_FILE"
echo "dev server started (pid=$pid, port=$PORT, log=logs/dev.log)"
