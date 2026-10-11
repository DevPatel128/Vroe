#!/usr/bin/env bash
# Framework first, enforced at commit time: catches code changed by any tool (Cursor, shell, a human), not only Claude.
# Fails a commit that stages non-doc files when scripts/wolf-check.sh has not run for this branch since AGENTS.md changed.
set -euo pipefail
root=$(git rev-parse --show-toplevel); cd "$root"
[ -f .wolf-version ] || exit 0
[ -f "$(git rev-parse --git-path MERGE_HEAD)" ] && exit 0   # merge commits carry already-checked work
code=$(git diff --cached --name-only --diff-filter=ACMR | grep -vE '(\.md$|^\.wolf/)' || true)
[ -n "$code" ] || exit 0
msg() { echo "WOLF framework-first: $1. Run: bash scripts/wolf-check.sh \"<task>\", follow what it prints, then commit again." >&2; exit 1; }
[ -f .wolf/check ] || msg "no WOLF check for this branch"
grep -qx "branch=$(git branch --show-current)" .wolf/check || msg "the WOLF check was made on another branch"
for f in AGENTS.md .wolf-version; do [ "$f" -nt .wolf/check ] && msg "$f changed after the WOLF check"; done
exit 0
