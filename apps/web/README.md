# Lore AI · Web

Branding landing site for [Lore AI](https://lore-ai.vercel.app). Next.js 15 (App Router) + Tailwind CSS.

## Local

```bash
pnpm install
pnpm --filter web dev
# → http://localhost:3000
```

## Deploy (Vercel)

1. Vercel → New Project → Import GitHub repo `terracelab/lore-ai`
2. Root Directory: `apps/web`
3. Build Command: `pnpm build` (default)
4. Install Command: `pnpm install --frozen-lockfile`
5. Output: `.next` (default)

자세한 절차는 루트의 [DEPLOYMENT.md](../../DEPLOYMENT.md) 를 참고하세요.

## License

MIT
