#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/load-local-secrets.sh"

PORT="${PORT:-3100}"
ROUNDS="${ROUNDS:-3}"
BUILD="${BUILD:-1}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="$ROOT_DIR/logs/rehearsal.log"
TMP_DIR="$(mktemp -d)"

mkdir -p "$ROOT_DIR/logs"

if [[ "$BUILD" == "1" ]]; then
  (cd "$ROOT_DIR" && pnpm build)
fi

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -- "-$SERVER_PID" 2>/dev/null || kill "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cd "$ROOT_DIR"
setsid pnpm start --hostname 127.0.0.1 --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/api/health" >"$TMP_DIR/health.json" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 0.5
done
if [[ "$ready" != "1" ]]; then
  echo "FAIL: server did not become ready; see logs/rehearsal.log" >&2
  exit 1
fi

curl -fsS "$BASE_URL/" >"$TMP_DIR/home.html"
grep -q '谢邀' "$TMP_DIR/home.html"

curl -fsS -X POST "$BASE_URL/api/experience" \
  -H 'content-type: application/json' -d '{}' >"$TMP_DIR/experience-1.json"
curl -fsS -X POST "$BASE_URL/api/experience" \
  -H 'content-type: application/json' -d '{}' >"$TMP_DIR/experience-2.json"

for round in $(seq 1 "$ROUNDS"); do
  for resident in resident-gear resident-rice; do
    curl -fsS -X POST "$BASE_URL/api/community/interact" \
      -H 'content-type: application/json' \
      -d "{\"residentId\":\"$resident\"}" \
      >"$TMP_DIR/social-${round}-${resident}.json"
  done
done

python3 - "$TMP_DIR" "$ROUNDS" <<'PY'
import glob
import json
import os
import sys

root = sys.argv[1]
rounds = int(sys.argv[2])

def load(name):
    with open(os.path.join(root, name), encoding="utf-8") as f:
        return json.load(f)

first = load("experience-1.json")
second = load("experience-2.json")
mode = first.get("mode")
if mode not in {"live", "fallback"}:
    raise SystemExit(f"FAIL: invalid experience mode {mode!r}")
if not first.get("card", {}).get("answer"):
    raise SystemExit("FAIL: answer card is empty")
if not str(first.get("question", {}).get("url", "")).startswith("https://www.zhihu.com/question/"):
    raise SystemExit("FAIL: question is not a Zhihu question URL")
if first.get("generatedAt") != second.get("generatedAt"):
    raise SystemExit("FAIL: second experience request did not hit cache")
if first.get("card", {}).get("answer") != second.get("card", {}).get("answer"):
    raise SystemExit("FAIL: cached answer changed")

actions = set()
latest_feed = []
for path in sorted(glob.glob(os.path.join(root, "social-*.json"))):
    payload = load(os.path.basename(path))
    event = payload.get("event", {})
    action = event.get("action")
    if action not in {"visit", "comment", "debate"}:
        raise SystemExit(f"FAIL: invalid social action {action!r}")
    if not event.get("reasons") or not event.get("signals"):
        raise SystemExit("FAIL: social event lacks explainability")
    actions.add(action)
    latest_feed = payload.get("feed", [])

if len(actions) < 2:
    raise SystemExit(f"FAIL: rehearsal only exercised actions {sorted(actions)}")
if len(latest_feed) < rounds * 2:
    raise SystemExit("FAIL: community feed did not accumulate events")

summary = {
    "mode": mode,
    "persona": first.get("persona", {}).get("species"),
    "personaTitle": first.get("card", {}).get("personaTitle"),
    "primaryInterest": first.get("composition", {}).get("primaryInterest"),
    "question": first.get("question", {}).get("title"),
    "knowledgeSource": first.get("knowledge", {}).get("source"),
    "answerChars": len(first.get("card", {}).get("answer", "")),
    "cacheStable": True,
    "socialActions": sorted(actions),
    "feedCount": len(latest_feed),
    "rounds": rounds,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
PY

echo "PASS: demo rehearsal completed (${ROUNDS} rounds, port=${PORT})"
