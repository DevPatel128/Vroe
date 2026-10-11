#!/usr/bin/env bash
# Repo presentation and hygiene: README covers what a reader needs, no template placeholders, relative links resolve,
# SYSTEM.md has diagrams, GitHub description/topics/licence are set, public repos have GitHub's free scanning on.
# Usage: repo-check.sh [owner/repo]   (GitHub checks need gh; they report NOT RUN instead of passing when unavailable)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"; fail=0; notrun=""
bad() { echo "repo-check: $1"; fail=1; }

# README: one heading per topic a reader needs (any wording from the list).
if [ -f README.md ]; then
  heads=$(grep -iE '^#{2,3} ' README.md || true)
  for t in 'status|where it stands|current state' 'what it does|features|capabilities' 'stack|built with|technolog' \
           'architecture|how it works' 'structure|layout' 'setup|getting started|install|quick ?start|run locally' \
           'environment|configuration' 'test|develop' 'deploy|release' 'security' 'limitation|roadmap|known issues'; do
    grep -qiE "$t" <<<"$heads" || bad "README has no section for: ${t%%|*}"
  done
else bad "README.md missing"; fi

# Template placeholders left behind (<like this: …>), outside code fences and ordinary HTML tags.
for f in README.md SYSTEM.md .github/SECURITY.md .github/CONTRIBUTING.md; do
  [ -f "$f" ] || continue
  left=$(awk '/^```/{c=!c;next} !c' "$f" | grep -nE '<[A-Za-z][^<>]*[ :][^<>]*>' | grep -viE '<(img|a|br|p|div|picture|source|details|summary|sub|sup|kbd|video|span|!--)[ >/]' | head -3 || true)
  [ -z "$left" ] || bad "$f still has template placeholders: $(echo "$left" | cut -c1-80 | tr '\n' ' ')"
done

# Relative links in the docs a visitor reads resolve to real files.
for f in README.md SYSTEM.md .github/*.md docs/*.md; do
  [ -f "$f" ] || continue
  for l in $(grep -oE '\]\([^)#:]+(#[^)]*)?\)' "$f" | sed -E 's/^\]\(//; s/\)$//; s/#.*//' | sort -u); do
    [ -e "$(dirname "$f")/$l" ] || bad "$f links to missing $l"
  done
done

grep -q '```mermaid' SYSTEM.md 2>/dev/null || bad "SYSTEM.md has no Mermaid diagram"
{ [ -f LICENSE ] || [ -f LICENSE.md ] || grep -qi 'licen' DECISIONS.md 2>/dev/null; } || bad "no LICENSE and no licence decision in DECISIONS.md"

# GitHub metadata and, for public repos, the free scanning features.
repo=${1:-$( (git remote get-url origin 2>/dev/null || true) | sed -nE 's#.*github\.com[:/]([^/]+/[^/.]+)(\.git)?$#\1#p')}
if [ -n "$repo" ] && command -v gh >/dev/null && meta=$(gh api "repos/$repo" 2>/dev/null); then
  [ -n "$(jq -r '.description // empty' <<<"$meta")" ] || bad "GitHub description empty ($repo)"
  [ "$(jq '.topics | length' <<<"$meta")" -gt 0 ] || bad "GitHub topics empty ($repo)"
  if [ "$(jq -r .visibility <<<"$meta")" = public ]; then
    if jq -e '.security_and_analysis' <<<"$meta" >/dev/null; then
      for k in secret_scanning secret_scanning_push_protection; do
        [ "$(jq -r ".security_and_analysis.$k.status" <<<"$meta")" = enabled ] || bad "public repo without $k ($repo)"
      done
    else notrun="secret scanning status (token cannot read security settings)"; fi
    if cs=$(gh api "repos/$repo/code-scanning/default-setup" --jq .state 2>/dev/null); then
      [ "$cs" = configured ] || bad "public repo without CodeQL default setup (state: $cs)"
    else notrun="${notrun:+$notrun; }CodeQL setup (token cannot read code scanning)"; fi
  fi
else notrun="GitHub metadata (no gh, no access, or no github remote)"; fi

[ -z "$notrun" ] || echo "repo-check: NOT RUN: $notrun"
[ $fail = 0 ] && echo "repo-check: ok${notrun:+ (partial)}"; exit $fail
