---
'lore-ai': patch
---

Read CLI version from package.json at module load instead of a hardcoded `'0.0.0'` string. `lore --version` now stays in sync with the published tarball automatically — no manual bumps in `src/index.ts` needed.
