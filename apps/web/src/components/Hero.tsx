'use client';

import { motion } from 'framer-motion';
import { CopyableCommand } from './CopyableCommand';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          v0.1 alpha · MIT licensed
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          AI 가 <span className="text-primary">왜 이렇게 짰는지</span> 알게 하라
        </h1>
        <p className="mx-auto mt-6 max-w-prose text-pretty text-lg text-muted">
          Lore AI 는 코드 옆 비즈니스 로직 주석을 추출해 Claude Code · Copilot · Cursor 가
          도메인 맥락을 이해하게 만드는 CLI + 패키지입니다.
        </p>

        <div className="mt-10 flex justify-center">
          <CopyableCommand command="npm i -g lore-ai" />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="https://docs.lore-ai.vercel.app/getting-started/quickstart"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white shadow hover:opacity-90"
          >
            Quickstart →
          </a>
          <a
            href="https://github.com/terracelab/lore-ai"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:border-fg"
          >
            GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}
