import { CopyableCommand } from './CopyableCommand';

export function CTA() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">5분이면 시작합니다.</h2>
        <p className="mt-3 text-muted">MIT · 무료 · 의존성 최소. 첫 sync 까지 60초가 목표입니다.</p>
        <div className="mt-8 flex justify-center">
          <CopyableCommand command="npx lore-ai init" />
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="https://docs.lore-ai.vercel.app"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            전체 문서 →
          </a>
          <a
            href="https://github.com/terracelab/lore-ai/discussions"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:border-fg"
          >
            Discussions
          </a>
        </div>
      </div>
    </section>
  );
}
