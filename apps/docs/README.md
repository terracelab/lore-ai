# Lore AI · Docs

Documentation site powered by [Nextra 3](https://nextra.site).

## Local

```bash
pnpm install
pnpm --filter docs dev
# → http://localhost:3001
```

## Add a page

1. Create `pages/<section>/<page>.mdx`
2. Add the page key to `pages/<section>/_meta.ts`
3. (Optional) Add a hand-written nav title or alias

## Deploy (Vercel)

1. New Project → Import GitHub repo `terracelab/lore-ai`
2. Root Directory: `apps/docs`
3. Framework Preset: Next.js
4. Build / Install: defaults

자세한 절차는 루트의 [DEPLOYMENT.md](../../DEPLOYMENT.md).
