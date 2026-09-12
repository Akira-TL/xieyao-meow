#!/usr/bin/env bash
set -euo pipefail

missing=0

check_present() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    printf 'OK      %s is configured\n' "$name"
  else
    printf 'PENDING %s is not configured\n' "$name"
    missing=1
  fi
}

check_present ZHIHU_OAUTH_APP_ID
check_present ZHIHU_OAUTH_APP_KEY
check_present ZHIHU_OAUTH_REDIRECT_URI

redirect_uri="${ZHIHU_OAUTH_REDIRECT_URI:-}"
if [[ -n "$redirect_uri" ]]; then
  if [[ "$redirect_uri" == */api/auth/zhihu/callback ]]; then
    printf 'OK      redirect path matches /api/auth/zhihu/callback\n'
  else
    printf 'ERROR   redirect URI must end with /api/auth/zhihu/callback\n'
    exit 2
  fi

  if [[ "$redirect_uri" == https://* ]]; then
    printf 'OK      redirect URI uses HTTPS\n'
  elif [[ "$redirect_uri" == http://127.0.0.1:* || "$redirect_uri" == http://localhost:* ]]; then
    printf 'NOTICE  localhost callback configured; official acceptance remains to be tested\n'
  else
    printf 'NOTICE  redirect URI is not HTTPS; confirm this is intentionally being tested\n'
  fi
fi

if (( missing )); then
  printf '\nOAuth application credentials are still pending. No secret values were printed.\n'
  exit 1
fi

printf '\nOAuth configuration shape is ready for live authorization testing. No secret values were printed.\n'
