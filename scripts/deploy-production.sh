#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_VERSION="${NODE_VERSION:-24.16.0}"
NODE_DIR="${NODE_DIR:-$HOME/.nvm/versions/node/v${NODE_VERSION}/bin}"
RUNTIME_ROOT="$ROOT_DIR/.runtime"
RUNTIME_DIR="$RUNTIME_ROOT/production"
STAGE_DIR="$RUNTIME_ROOT/.production-next"
PREVIOUS_DIR="$RUNTIME_ROOT/.production-previous"
SKIP_BUILD="${SKIP_BUILD:-0}"
RESTART_SERVICE="${RESTART_SERVICE:-1}"

if [[ ! -x "$NODE_DIR/node" ]]; then
  echo "Node ${NODE_VERSION} is not installed at $NODE_DIR" >&2
  exit 1
fi

export PATH="$NODE_DIR:$PATH"
cd "$ROOT_DIR"

if [[ "$SKIP_BUILD" != "1" ]]; then
  pnpm build
fi

if [[ ! -f .next/standalone/server.js || ! -d .next/static ]]; then
  echo "Missing standalone build output; run a successful production build first." >&2
  exit 1
fi

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/.next"
cp -a .next/standalone/. "$STAGE_DIR/"
rm -rf "$STAGE_DIR/.next/static"
cp -a .next/static "$STAGE_DIR/.next/static"
if [[ -d public ]]; then
  rm -rf "$STAGE_DIR/public"
  cp -a public "$STAGE_DIR/public"
fi

rm -rf "$PREVIOUS_DIR"
if [[ -d "$RUNTIME_DIR" ]]; then
  mv "$RUNTIME_DIR" "$PREVIOUS_DIR"
fi
mv "$STAGE_DIR" "$RUNTIME_DIR"

if [[ "$RESTART_SERVICE" == "1" ]]; then
  if ! sudo systemctl restart xieyao-meow.service; then
    rm -rf "$RUNTIME_DIR"
    if [[ -d "$PREVIOUS_DIR" ]]; then mv "$PREVIOUS_DIR" "$RUNTIME_DIR"; fi
    echo "Production restart failed; restored the previous runtime directory." >&2
    exit 1
  fi
  sleep 1
  if ! systemctl is-active --quiet xieyao-meow.service; then
    sudo systemctl stop xieyao-meow.service || true
    rm -rf "$RUNTIME_DIR"
    if [[ -d "$PREVIOUS_DIR" ]]; then mv "$PREVIOUS_DIR" "$RUNTIME_DIR"; fi
    sudo systemctl start xieyao-meow.service || true
    echo "Production health check failed; restored the previous runtime directory." >&2
    exit 1
  fi
  rm -rf "$PREVIOUS_DIR"
fi

echo "Production runtime staged at .runtime/production using Node $(node -v)."
