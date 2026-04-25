export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          © 2026{' '}
          <a href="https://terracelab.co.kr" className="hover:text-fg">
            Terracelab
          </a>
          . MIT licensed.
        </div>
        <div className="flex gap-5">
          <a href="https://docs.lore-ai.vercel.app" className="hover:text-fg">
            Docs
          </a>
          <a href="https://github.com/terracelab/lore-ai" className="hover:text-fg">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/lore-ai" className="hover:text-fg">
            npm
          </a>
          <a
            href="https://github.com/terracelab/lore-ai/blob/main/SECURITY.md"
            className="hover:text-fg"
          >
            Security
          </a>
        </div>
      </div>
    </footer>
  );
}
