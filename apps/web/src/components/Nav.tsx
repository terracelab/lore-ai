'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Nav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur border-b border-border/60 bg-bg/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold">
          <Logo />
          <span>lore-ai</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="https://docs.lore-ai.vercel.app" className="text-muted hover:text-fg">
            Docs
          </a>
          <a
            href="https://github.com/terracelab/lore-ai"
            className="text-muted hover:text-fg"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/lore-ai"
            className="text-muted hover:text-fg"
          >
            npm
          </a>
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-fg"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? '☀' : '☾'}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="text-primary"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="3" rx="1" />
      <rect x="3" y="10.5" width="14" height="3" rx="1" />
      <rect x="3" y="17" width="10" height="3" rx="1" />
    </svg>
  );
}
