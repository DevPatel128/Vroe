#!/usr/bin/env bash
# Checks a built site against LEGAL.md: legal pages exist, every loaded third-party host is listed, every <img> has alt.
# Usage: legal-check.sh <build-dir> [LEGAL.md]. Set SITE_HOST to your own domain so absolute self-links pass.
# shortcut: reads static HTML/CSS/JS only; hosts called from runtime fetch() are not seen. Upgrade: a CSP report-only header.
set -euo pipefail
out=${1:?build dir}; legal=${2:-LEGAL.md}; fail=0
[ -d "$out" ] || { echo "legal-check: no build dir $out"; exit 1; }
[ -f "$legal" ] || { echo "legal-check: $legal missing (copy it from the WOLF kit)"; exit 1; }
rows() { awk -v h="$1" 'index($0,h)==1{on=1;next} on&&/^\|/{if(++n>2)print;next} on&&n{exit}' "$legal"; }
col() { awk -F'|' -v c="$1" '{gsub(/^ +| +$/,"",$c); print $c}'; }

while IFS='|' read -r _ _ path status _; do
  path=$(echo "$path" | xargs); status=$(echo "$status" | xargs)
  case "$status" in n/a*) continue;; esac
  p=${path#/}; { [ -f "$out/$p.html" ] || [ -f "$out/$p/index.html" ] || [ -f "$out/$p" ]; } || { echo "legal-check: missing page $path"; fail=1; }
done < <(rows '## Legal pages')

allowed=$(rows '## Third parties' | col 2; echo "${SITE_HOST:-}")
files=$(find "$out" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.mjs' \))
hosts=$( [ -z "$files" ] || { printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 grep -ohiE \
  '(src|srcset)=["'"'"']https?://[^/"'"'"' ]+|<link[^>]*rel=["'"'"']?(stylesheet|preload|modulepreload|icon)[^>]*>|url\(["'"'"']?https?://[^/"'"'"') ]+|import[ (]*["'"'"']https?://[^/"'"'"' ]+' \
  | grep -oiE 'https?://[^/"'"'"') >]+' | sed -E 's#https?://##I' | tr 'A-Z' 'a-z' | sort -u || true; } )
for h in $hosts; do printf '%s\n' "$allowed" | grep -qxiF "$h" || { echo "legal-check: unlisted third-party host $h (add it to LEGAL.md with data + licence, or remove it)"; fail=1; }; done

noalt=$( [ -z "$files" ] || printf '%s\n' "$files" | grep '\.html$' | tr '\n' '\0' | xargs -0 grep -oiE '<img[^>]*>' | grep -viE '<img[^>]*[[:space:]]alt=' || true)
[ -z "$noalt" ] || { echo "legal-check: <img> without alt:"; printf '%s\n' "$noalt" | head -10; fail=1; }

[ $fail = 0 ] && echo "legal-check: ok"; exit $fail
