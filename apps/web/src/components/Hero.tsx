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
          시니어의 머릿속에만 있던 도메인 지식을 코드 옆에 박제하고, 자동 추출해 Claude Code ·
          Copilot · Cursor 에 컨텍스트로 흘려보내는 CLI + 패키지.
        </p>
        <p className="mx-auto mt-3 max-w-prose text-sm text-muted/80">
          <span className="font-mono text-primary">@Domain</span>
          <span className="mx-2">·</span>
          <span className="font-mono text-primary">@BusinessLogic</span>
          <span className="mx-2">·</span>
          <span className="font-mono text-primary">@History</span>
          <span className="ml-2">— 세 태그면 충분합니다.</span>
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
