#!/usr/bin/env bash
# Fails when code changes need a doc update that is missing from the same PR. Usage: docs-impact.sh <base-ref>
set -euo pipefail
f=$(git diff --name-only "${1:-origin/main}"...HEAD)
has() { printf '%s\n' "$f" | grep -qE "$1"; }
fail=0
if has '(db\.ts|schema\.sql|migrations/|/api/)' && ! has '^SYSTEM\.md$'; then echo "docs-impact: schema/API changed, update SYSTEM.md"; fail=1; fi
if has '(^|/)(pages|app|routes)/' && has '\.(html|tsx|mdx?)$' && ! has '^GROWTH\.md$'; then echo "docs-impact: public page changed, log it in GROWTH.md (SEO/AEO)"; fail=1; fi
if has '(wrangler\.(toml|jsonc?)|\.github/workflows/)' && ! has '^RUNBOOK\.md$'; then echo "docs-impact: ops changed, update RUNBOOK.md"; fail=1; fi
if git diff "${1:-origin/main}"...HEAD -- . ':!LEGAL.md' | grep -qiE '^\+.*(<script[^>]+src=.https?://|<link[^>]+href=.https?://|"(@?posthog[a-z-]*|@sentry/[a-z-]+|@?stripe[a-z/-]*|resend|mixpanel[a-z-]*|@vercel/analytics|react-ga4?)": *")' && ! has '^LEGAL\.md$'; then echo "docs-impact: third party added, record it in LEGAL.md"; fail=1; fi
if git diff "${1:-origin/main}"...HEAD -- 'wrangler.*' | grep -qE '^\+.*"(d1_databases|kv_namespaces|r2_buckets|services|queues|durable_objects|ai|vectorize|hyperdrive)"' && ! has '^SYSTEM\.md$'; then echo "docs-impact: new binding or service, update the SYSTEM.md diagrams"; fail=1; fi
[ $fail = 0 ] && echo "docs-impact: ok"; exit $fail
