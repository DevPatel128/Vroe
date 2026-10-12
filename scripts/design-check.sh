#!/usr/bin/env bash
# Design gate: see design-check.mjs. Usage: design-check.sh <build-dir> [DESIGN.md]
exec node "$(dirname "$0")/design-check.mjs" "$@"
