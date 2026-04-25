const features = [
  {
    title: '데이터 아카이올로지',
    body: '`@History` 태그로 과거 DB 행의 의미를 보존. 마이그레이션 의도를 영원히 잊지 않는다.',
  },
  {
    title: 'Precommit 게이트',
    body: '필수 태그 누락 · 알 수 없는 도메인 토큰 → `lore check` 가 자동으로 막아줌.',
  },
  {
    title: 'AI 통합',
    body: 'Claude Code MCP, Copilot instructions, Cursor rules 까지 자동 생성.',
  },
  {
    title: 'Lore Board 동기화',
    body: '`lore publish` 한 번으로 회사 위키에 반영. 여러 프로젝트 한 사이트.',
  },
  {
    title: '프로젝트 독립',
    body: 'Django · React / RN Expo · Next.js · 기타 TS — 어디서나 동일한 스펙.',
  },
  {
    title: '$0 으로 시작',
    body: 'CLI 는 npm 무료, 사이트는 Vercel Hobby, RAG 는 Pagefind. 비용 없음.',
  },
];

export function Features() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight">
          AI 가 읽기 좋은 문서, <span className="text-primary">사람도 읽기 좋다</span>.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
