#!/usr/bin/env bash
# PreToolUse guard: blocks actions WOLF reserves for a human. Exit 2 = block, with the reason shown to the agent.
in=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$in")
path=$(jq -r '.tool_input.file_path // empty' <<<"$in")
block() { echo "WOLF guard: $1. Ask the human." >&2; exit 2; }
if [ -n "$cmd" ]; then
  grep -qE -- '--no-verify|-c +core\.hooksPath|core\.hooksPath +/dev/null' <<<"$cmd" && block "skipping the local git hooks"
  grep -qE 'git push.*(--force|-f\b|--force-with-lease).*\b(main|master)\b|git push.*\b(main|master)\b.*(--force|-f\b)' <<<"$cmd" && block "force-push to main"
  grep -qE 'wrangler (delete|d1 delete|r2 bucket delete|kv namespace delete)' <<<"$cmd" && block "deleting a Cloudflare resource"
  grep -qiE 'wrangler d1 execute.*(drop|delete from|truncate)' <<<"$cmd" && block "destructive SQL on D1"
  grep -qE '(cat|less|head|tail|source|cp) [^|;]*\.(env|dev\.vars)(\.local)?(\s|$)' <<<"$cmd" && block "reading a secrets file"
  grep -qE 'git push.*(\s--force(\s|$)|\s-f(\s|$))' <<<"$cmd" && block "force-push rewrites remote history (use --force-with-lease on your own branch)"
  grep -qE 'git push.*(\s--delete\s|\s-d\s|\s:[^ ]+)' <<<"$cmd" && block "deleting a remote branch or tag"
  grep -qE 'git (filter-repo|filter-branch)|\bbfg\b' <<<"$cmd" && block "rewriting git history"
  grep -qE 'gh repo (delete|archive|rename)|gh release delete' <<<"$cmd" && block "deleting, archiving or renaming a repo or release"
  grep -qE 'gh repo edit.*--visibility|gh api.*repos/[^ ]+.*visibility' <<<"$cmd" && block "changing repo visibility"
fi
case "$path" in
  *.env.example) ;;
  *.env|*.env.*|*.dev.vars) block "secrets file $path" ;;
esac
# Framework first: a code change in a WOLF repo needs a fresh `scripts/wolf-check.sh` stamp for the current branch.
# Covers editor tools and shell commands that write code files (sed -i, redirects, tee, cp, mv, patch).
tool=$(jq -r '.tool_name // empty' <<<"$in")
case "$tool" in
  Edit|Write|MultiEdit|NotebookEdit)
    [ -n "$path" ] || exit 0
    case "$path" in *.md|*/.wolf/*) exit 0;; esac
    dir=$(dirname "$path"); while [ ! -d "$dir" ]; do dir=$(dirname "$dir"); done ;;
  Bash)
    code='[^ ;|&<>]*\.(ts|tsx|js|jsx|mjs|cjs|css|scss|html|sql|json|jsonc|toml|ya?ml|sh|py|go|rs|swift|kt)'
    grep -qE "((sed -i|perl -[a-z]*i)[^;|&]*$code|>>? *$code|tee (-a )?$code|(cp|mv|install) [^;|&]*$code *($|[;&|])|git apply|(^|[ ;&|])patch )" <<<"$cmd" || exit 0
    dir=$(jq -r '.cwd // empty' <<<"$in"); [ -d "${dir:-}" ] || dir=${CLAUDE_PROJECT_DIR:-.} ;;
  *) exit 0;;
esac
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/.wolf-version" ] || exit 0
stamp="$root/.wolf/check"; run='run `bash scripts/wolf-check.sh "<task>"`, read what it prints, then build within those rules'
gate() { echo "WOLF framework-first: $1. Before changing code, $run." >&2; exit 2; }
[ -f "$stamp" ] || gate "no WOLF check for this task"
grep -qx "branch=$(git -C "$root" branch --show-current)" "$stamp" || gate "the WOLF check was made on another branch"
for f in AGENTS.md .wolf-version; do [ "$root/$f" -nt "$stamp" ] && gate "$f changed after the WOLF check"; done
exit 0
