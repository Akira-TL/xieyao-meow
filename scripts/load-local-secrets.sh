#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRET_FILE="$ROOT_DIR/.secrets/zhihu-access-secret"

if [[ -z "${ZHIHU_ACCESS_SECRET:-}" && -f "$SECRET_FILE" ]]; then
  ZHIHU_ACCESS_SECRET="$(<"$SECRET_FILE")"
  export ZHIHU_ACCESS_SECRET
fi
