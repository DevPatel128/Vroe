#!/usr/bin/env bash
# Secret scan: full git history (every ref), tracked files that must never be committed, and the client build.
# Usage: secret-scan.sh [client-build-dir]   (client output only: Vite dist, Next .next/static or out, Pages out)
# False positives: add the gitleaks fingerprint to .gitleaksignore with a comment saying why it is not a secret.
# Never prints a secret: gitleaks runs with --redact and the bundle check prints file + rule only.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"; fail=0; skipped=""

# 1. History: every commit on every branch and tag.
if [ "${WOLF_HISTORY:-}" = skip ]; then echo "secret-scan: history scanned by the gitleaks job, not here"
elif command -v gitleaks >/dev/null; then
  rep=$(mktemp); trap 'rm -f "$rep"' EXIT
  if ! gitleaks git --redact --no-banner --log-level error --log-opts="--all" --report-format json --report-path "$rep" . >/dev/null 2>&1; then
    echo "secret-scan: gitleaks found $(jq length "$rep") leak(s) in history (values redacted):"
    jq -r '.[] | "  \(.RuleID)  \(.File):\(.StartLine)  commit \(.Commit[0:8])  \(.Date[0:10])"' "$rep" | head -40
    fail=1
  else echo "secret-scan: history clean ($(git rev-list --all | wc -l | xargs) commits, all refs)"; fi
else skipped="history (gitleaks not installed)"; fi

# 2. Files that must never be in git, now or in any commit on any ref (.gitignore does not erase history).
bad=$( { git ls-files; git log --all --pretty=format: --name-only; } | sort -u | grep -E '(^|/)(\.env(\.[^/]*)?|\.dev\.vars|id_(rsa|ed25519|ecdsa)|[^/]*\.(pem|key|p12|pfx|keystore|sqlite3?|db)|[^/]*(service-account|credentials)[^/]*\.json|[^/]*\.(sql|dump)\.gz)$' | grep -vE '\.env\.[^/]*(example|template|sample)$' || true)
[ -z "$bad" ] || { echo "secret-scan: files that must not be in git, tracked now or in history (untrack, rotate if real, plan a history clean):"; echo "$bad"; fail=1; }

# 3. Client build: no source maps, no token-shaped strings, no server-only env names.
out=${1:-}
if [ -n "$out" ]; then
  [ -d "$out" ] || { echo "secret-scan: no build dir $out"; exit 1; }
  maps=$(find "$out" -name '*.map' | head -5)
  [ -z "$maps" ] || { echo "secret-scan: source maps shipped to the client (disable them or upload to Sentry only):"; echo "$maps"; fail=1; }
  tokens='sk_live_[0-9A-Za-z]{10,}|rk_live_[0-9A-Za-z]{10,}|re_[0-9A-Za-z_]{20,}|gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abprs]-[0-9A-Za-z-]{10,}|sk-ant-[0-9A-Za-z_-]{20,}|sk-(proj-)?[0-9A-Za-z_-]{32,}|phx_[0-9A-Za-z]{20,}|sntrys_[0-9A-Za-z_=+/]{20,}'
  hits=$(grep -rlE "$tokens" "$out" 2>/dev/null | head -10 || true)
  [ -z "$hits" ] || { echo "secret-scan: token-shaped strings in client files (values not shown):"; echo "$hits"; fail=1; }
  if [ -f .env.example ]; then
    for n in $(grep -oE '^[A-Z][A-Z0-9_]+=' .env.example | tr -d = | grep -vE '^(NEXT_PUBLIC_|VITE_|PUBLIC_)'); do
      f=$(grep -rlw "$n" "$out" 2>/dev/null | head -1 || true)
      [ -z "$f" ] || { echo "secret-scan: server-only variable $n is referenced in client file $f"; fail=1; }
    done
  fi
fi

[ -z "$skipped" ] || echo "secret-scan: NOT RUN: $skipped. Do not report this repo as scanned."
[ $fail = 0 ] && echo "secret-scan: ok${skipped:+ (partial)}"; exit $fail
