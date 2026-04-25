#!/usr/bin/env bash
# Lore AI precommit hook
# Install:
#   cp templates/hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# Or use husky:
#   npx husky add .husky/pre-commit "npx lore-ai check $(git diff --cached --name-only --diff-filter=ACM | tr '\n' ' ')"

set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(py|ts|tsx)$' || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

if ! command -v lore >/dev/null 2>&1; then
  echo "lore CLI not found — skipping check. (npm i -g lore-ai)"
  exit 0
fi

lore check $STAGED
