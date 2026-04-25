# lore-ai

> CLI for [Lore AI](https://lore-ai.vercel.app) — living business-logic documentation for AI-assisted dev teams.

## Install

```bash
npm i -g lore-ai
# or
pnpm add -D lore-ai
```

## Quick start

```bash
cd my-project
lore init               # writes lore.config.yaml + .lore/flows/
# ... add @Domain / @BusinessLogic to a few files ...
lore check $(git ls-files '*.py' '*.tsx')
lore sync               # generates .lore/flows/<category>.md
```

See full docs at <https://docs.lore-ai.vercel.app>.

## Commands

- `lore init` — scaffold config + flows directory
- `lore check [files…]` — validate annotations (precommit)
- `lore sync` — regenerate L2 / L3 markdown
- `lore synthesize [category]` — emit LLM prompt for one flow, or omit category for all-in-one
- `lore publish` — copy `.lore/flows/` to a Lore Board target
- `lore chat` — local RAG REPL (v0.2)

## License

MIT
