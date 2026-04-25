---
'lore-ai': minor
---

`lore chat` REPL implemented with Anthropic SDK + prompt caching. Loads `.lore/DOMAIN_MAP.md` (L1) and `.lore/flows/**/*.md` (L2/L3) as the system prompt with `cache_control: ephemeral`, streams responses, rolls back the user turn on API errors. Reads the API key from the env var named in `config.llm.apiKeyEnv`. Adds `@anthropic-ai/sdk` to dependencies.
