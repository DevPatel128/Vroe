#!/usr/bin/env bash
# Install or update WOLF in a project.
#   wolf-sync.sh <project-dir>        existing product: framework only (docs, skills, scripts, guard, wolf.yml gate). Never adds app code or app CI.
#   wolf-sync.sh <project-dir> --new  new app: also the D1 app skeleton, package.json, CI, Dependabot, pre-push hook.
# Framework-owned files are always updated. Project docs and the project block of AGENTS.md are never overwritten.
set -euo pipefail
src=$(cd "$(dirname "$0")/.." && pwd); wolf=$(dirname "$src"); dst=${1:?project dir}; mode=${2:-}
v=$(cat "$wolf/VERSION")
[ "$(cat "$dst/.wolf-version" 2>/dev/null || true)" = "$v" ] && { echo "wolf-sync: already $v"; exit 0; }
copy_missing() { for f in "$@"; do [ -e "$dst/$f" ] || { mkdir -p "$(dirname "$dst/$f")"; cp -R "$src/$f" "$dst/$f"; }; done; }

# Framework-owned: always updated. A project's own script with the same name is kept.
mkdir -p "$dst/scripts" "$dst/.claude/hooks" "$dst/.claude/skills" "$dst/.cursor/rules"
# A script is WOLF's when it is byte-identical to any version WOLF ever shipped (git history); edited copies are kept.
shipped() { git -C "$wolf" log --format= --raw --no-abbrev -- "kit/scripts/$1" 2>/dev/null | awk '{print $4}'; }
for f in "$src"/scripts/*.sh; do
  n=$(basename "$f"); t="$dst/scripts/$n"
  if [ -e "$t" ] && ! cmp -s "$f" "$t" && ! shipped "$n" | grep -qx "$(git hash-object "$t")"; then echo "wolf-sync: kept project's own scripts/$n (differs from every WOLF version)"; else cp "$f" "$t"; fi
done
cp "$src/.claude/hooks/guard.sh" "$dst/.claude/hooks/"; cp -R "$wolf/skills/." "$dst/.claude/skills/"
cp "$src/.cursor/rules/wolf.mdc" "$dst/.cursor/rules/"
mkdir -p "$dst/.github/workflows"; cp "$src/.github/workflows/wolf.yml" "$dst/.github/workflows/"   # framework gate only; app CI untouched

# Guard hook: merged into an existing .claude/settings.json, never replacing it.
s="$dst/.claude/settings.json"
if [ -f "$s" ]; then
  if ! grep -q 'hooks/guard.sh' "$s"; then
    jq --slurpfile k "$src/.claude/settings.json" '.hooks.PreToolUse = ((.hooks.PreToolUse // []) + $k[0].hooks.PreToolUse)
      | .permissions.deny = (((.permissions.deny // []) + $k[0].permissions.deny) | unique)' "$s" > "$s.new" && mv "$s.new" "$s"
  fi
else cp "$src/.claude/settings.json" "$s"; fi

# Project-owned docs: copied only when missing.
copy_missing PRODUCT.md SYSTEM.md RUNBOOK.md GROWTH.md LEGAL.md TASK.md DECISIONS.md MISTAKES.md sell README.md LICENSE
# GitHub community files: only when the repo has none in any place GitHub reads (root, docs/, .github/; any case).
has_any() { for d in . docs .github; do ls "$dst/$d" 2>/dev/null | grep -qix "$1" && return 0; done; return 1; }
for f in SECURITY.md CONTRIBUTING.md pull_request_template.md; do has_any "$f" || copy_missing ".github/$f"; done
has_any ISSUE_TEMPLATE || copy_missing .github/ISSUE_TEMPLATE
# An existing PR template gets the framework-first line it lacks (pr-gate requires it).
for t in "$dst"/.github/[Pp][Uu][Ll][Ll]_[Rr][Ee][Qq][Uu][Ee][Ss][Tt]_[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee].md "$dst"/[Pp][Uu][Ll][Ll]_[Rr][Ee][Qq][Uu][Ee][Ss][Tt]_[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee].md "$dst"/docs/[Pp][Uu][Ll][Ll]_[Rr][Ee][Qq][Uu][Ee][Ss][Tt]_[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee].md; do
  [ -f "$t" ] && ! grep -q '^WOLF check:' "$t" && { printf 'WOLF check: <paste the PR body line printed by scripts/wolf-check.sh>\n\n' | cat - "$t" > "$t.new" && mv "$t.new" "$t"; }
done
# .gitignore: a new app gets the full baseline. Every repo gets the secret and .wolf/ lines it lacks; nothing is removed.
[ "$mode" = "--new" ] && copy_missing .gitignore
need=$( { awk '/^# Secrets/{on=1;next} /^# /{on=0} on' "$src/.gitignore"; echo '.wolf/'; } | while IFS= read -r l; do grep -qxF -- "$l" "$dst/.gitignore" 2>/dev/null || echo "$l"; done)
[ -z "$need" ] || printf '\n# WOLF: secrets and local tool state (wolf-sync)\n%s\n' "$need" >> "$dst/.gitignore"
# CLAUDE.md: keep the project's own, and make sure it points at AGENTS.md.
if [ -f "$dst/CLAUDE.md" ]; then grep -q 'AGENTS.md' "$dst/CLAUDE.md" || printf '\nRead and follow `AGENTS.md` (WOLF rules).\n' >> "$dst/CLAUDE.md"
else cp "$src/CLAUDE.md" "$dst/CLAUDE.md"; fi

# AGENTS.md: new framework text around the project block. A pre-WOLF AGENTS.md becomes the project block.
merge_agents() { awk -v f="$1" '/wolf:project:start/{while ((getline l < f) > 0) print l; skip=1} /wolf:project:end/{skip=0; next} !skip' "$src/AGENTS.md" > "$dst/AGENTS.md.new" && mv "$dst/AGENTS.md.new" "$dst/AGENTS.md"; }
block=$(mktemp)
if [ -f "$dst/AGENTS.md" ] && grep -q 'wolf:project:start' "$dst/AGENTS.md"; then
  sed -n '/wolf:project:start/,/wolf:project:end/p' "$dst/AGENTS.md" > "$block"; merge_agents "$block"
elif [ -f "$dst/AGENTS.md" ]; then
  { echo '<!-- wolf:project:start — wolf-sync never overwrites this block -->'; echo '## Project'; cat "$dst/AGENTS.md"; echo '<!-- wolf:project:end -->'; } > "$block"; merge_agents "$block"
else cp "$src/AGENTS.md" "$dst/AGENTS.md"; fi

if [ "$mode" = "--new" ]; then
  mkdir -p "$dst/hooks"; cp "$src/hooks/pre-push" "$src/hooks/pre-commit" "$dst/hooks/"
  copy_missing src/db.ts migrations test/isolation.test.ts package.json package-lock.json tsconfig.json \
    .env.example .github/workflows/ci.yml .github/dependabot.yml
  # Never replace an existing hooks setup (e.g. husky).
  [ -n "$(git -C "$dst" config core.hooksPath 2>/dev/null || true)" ] || git -C "$dst" config core.hooksPath hooks 2>/dev/null || true
fi
# Commit-time framework-first check, wired into whatever hook setup the repo already uses. Never replaces a hook and
# never creates a hooks folder: a core.hooksPath that points at a missing folder (husky not installed) is only warned about.
if git -C "$dst" rev-parse --git-dir >/dev/null 2>&1; then
  hp=$(git -C "$dst" config core.hooksPath 2>/dev/null || true); hd=""
  if [ -z "$hp" ]; then hd=$(git -C "$dst" rev-parse --git-path hooks); [ "${hd#/}" = "$hd" ] && hd="$dst/$hd"   # common dir, also inside a worktree
  else
    case "$hp" in */.husky/_|*/.husky/_/|.husky/_|.husky/_/) hp=${hp%/}; hp=${hp%/_} ;; esac   # husky 9 keeps user hooks one level up
    hd=$hp; [ "${hd#/}" = "$hd" ] && hd="$dst/$hd"
  fi
  if [ -d "$hd" ]; then
    hook="$hd/pre-commit"; [ -f "$hook" ] || printf '#!/usr/bin/env bash\n' > "$hook"
    grep -q 'wolf-precommit.sh' "$hook" || printf 'bash scripts/wolf-precommit.sh   # WOLF framework first\n' >> "$hook"
    chmod +x "$hook"
  else echo "wolf-sync: WARNING commit hook not installed: hooks folder $hd does not exist (run the repo's hook setup, e.g. npm install, then sync again)"; fi
fi
# A .gitignore line like `Wolf/` also hides .claude/skills/wolf/ on case-insensitive filesystems (macOS).
if git -C "$dst" rev-parse --git-dir >/dev/null 2>&1 && git -C "$dst" check-ignore -q .claude/skills/wolf/SKILL.md; then
  echo "wolf-sync: WARNING .claude/skills/wolf is git-ignored by: $(git -C "$dst" check-ignore -v .claude/skills/wolf/SKILL.md | cut -f1)"
  echo "wolf-sync: anchor that pattern to the repo root (e.g. /Wolf/) so the skills get committed"
fi
echo "$v" > "$dst/.wolf-version"
echo "wolf-sync: $dst now on WOLF $v (${mode:-framework only})"
