#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACCESS_SECRET_FILE="$ROOT_DIR/.secrets/zhihu-access-secret"
OAUTH_SECRET_FILE="$ROOT_DIR/.secrets/zhihu-oauth.env"

if [[ -z "${ZHIHU_ACCESS_SECRET:-}" && -f "$ACCESS_SECRET_FILE" ]]; then
  ZHIHU_ACCESS_SECRET="$(<"$ACCESS_SECRET_FILE")"
  export ZHIHU_ACCESS_SECRET
fi

if [[ -f "$OAUTH_SECRET_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$OAUTH_SECRET_FILE"
  set +a
fi