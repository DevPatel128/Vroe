#!/usr/bin/env bash
# Framework first: before any code change, print the WOLF rules, framework files, past mistakes and docs that apply,
# then stamp .wolf/check so the guard hook allows code edits on this branch.
# Usage: wolf-check.sh "<task>" [paths...]   (no paths: the branch diff, working tree and untracked files)
set -euo pipefail
task=${1:?usage: wolf-check.sh \"<task>\" [paths...]}; shift
root=$(git rev-parse --show-toplevel); cd "$root"
base=$(git rev-parse -q --verify origin/main >/dev/null && echo origin/main || echo HEAD)
if [ $# -gt 0 ]; then paths=$*; else
  paths=$( { git diff --name-only "$base"...HEAD 2>/dev/null || true; git diff --name-only HEAD 2>/dev/null || true; git ls-files -o --exclude-standard; } | sort -u); fi
hay=$(printf '%s\n%s\n' "$task" "$paths" | tr 'A-Z' 'a-z')

# area ; pattern (task words or paths) ; hard rules ; framework files ; project docs to update
areas='data;db\.ts|migration|schema|sql|database|\bd1\b;3 4 5;BUILD.md SECURITY.md;SYSTEM.md
api;/api/|route\.ts|endpoint|webhook|\bapi\b;6 7 8;BUILD.md SECURITY.md CHECKLIST.md;SYSTEM.md
auth;auth|session|login|signup|password|passkey|\botp\b|\brole;3 4 6;SECURITY.md;SYSTEM.md
export;export|csv|xlsx;9;BUILD.md;
telemetry;sentry|posthog|analytics|telemetry|tracking;10;SHIP.md SECURITY.md;LEGAL.md
health;health|uptime|status page;11;SHIP.md;RUNBOOK.md
deploy;wrangler|\.github/|deploy|\bci\b|token;1 12;SHIP.md;RUNBOOK.md
deps;package\.json|package-lock|dependenc|upgrade|\bbump;13;STACK.md SECURITY.md;LEGAL.md
ui;\.(tsx|jsx|html|css|mdx)$|page|component|landing|copy|design;-;PRODUCT.md GROW.md;GROWTH.md LEGAL.md
email;email|resend|newsletter|unsubscribe;8;BUILD.md;LEGAL.md
money;payment|stripe|price|pricing|billing|subscription|refund;8;BUILD.md SECURITY.md;LEGAL.md PRODUCT.md
ai;\bai\b|llm|model|prompt|openai|anthropic;-;BUILD.md;SYSTEM.md'
hit=""; rules="1 2 14"; fw="README.md CHECKLIST.md GOVERN.md"; docs="PRODUCT.md"
while IFS=';' read -r name pat r f d; do
  grep -qE "$pat" <<<"$hay" || continue
  hit="$hit $name"; mpat="${mpat:+$mpat|}$pat"; [ "$r" = - ] || rules="$rules $r"; fw="$fw $f"; docs="$docs $d"
done <<<"$areas"
uniq_words() { tr ' ' '\n' | grep . | sort -u${1:-} | tr '\n' ' ' | sed 's/ $//'; }
rules=$(uniq_words n <<<"$rules"); fw=$(uniq_words <<<"$fw"); docs=$(uniq_words <<<"$docs")

echo "WOLF check: $task"
echo "Areas:${hit:- none matched (general change)}"
echo; echo "Hard rules that apply (AGENTS.md):"
hard=$(awk '/^## Hard rules/{on=1;next} /^## /{on=0} on' AGENTS.md 2>/dev/null || true)
for n in $rules; do grep -E "^$n\. " <<<"$hard" | cut -c1-220 || true; done
grep -m1 -E '^\- \*\*Project rules:\*\*' AGENTS.md 2>/dev/null || true
echo; echo "Read in WOLF before building: $fw"
echo "Update in this PR: $docs"
case " $hit " in *" data "*|*" auth "*|*" money "*) echo "Protected area: build and test, then stop before merge and ask.";; esac
if [ -f MISTAKES.md ] && [ -n "$hit" ]; then
  m=$(grep -E '^\| M[0-9]+ ' MISTAKES.md | grep -iE "$mpat" | cut -c1-200 | head -6 || true)
  [ -z "$m" ] || { echo; echo "Past mistakes in these areas (do not repeat):"; echo "$m"; }
fi

mkdir -p .wolf; ex=$(git rev-parse --git-path info/exclude); grep -qx '.wolf/' "$ex" 2>/dev/null || echo '.wolf/' >> "$ex"
{ echo "branch=$(git branch --show-current)"; echo "head=$(git rev-parse --short HEAD)"; echo "wolf=$(cat .wolf-version 2>/dev/null || echo UNKNOWN)"
  echo "time=$(date -u +%FT%TZ)"; echo "task=$task"; echo "areas=${hit# }"; echo "rules=$rules"; echo "read=$fw"; echo "docs=$docs"; } > .wolf/check
echo; echo "PR body line: WOLF check: rules $rules; read $fw; docs $docs"
echo "Stamped .wolf/check for branch $(git branch --show-current). Build now, within these rules."
