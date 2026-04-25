const layers = [
  {
    tag: 'L1',
    title: '도메인 지도',
    desc: '카테고리 토큰 한 장. 어떤 영역이 존재하는지.',
    sample: 'subscription · auth · signal',
  },
  {
    tag: 'L2',
    title: '서사 (Flow)',
    desc: '카테고리당 마크다운 1편. AI 가 RAG 로 H2 단위 인덱싱.',
    sample: '## 1. trial → paid 전환\n## 2. 이탈 grace 정책',
  },
  {
    tag: 'L3',
    title: '팩트 (Symbol)',
    desc: '코드에 붙은 주석에서 자동 추출. 항상 최신.',
    sample: '@Domain: subscription/master\n@BusinessLogic: ...',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border/60 bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight">3-Layer 문서 구조</h2>
        <p className="mt-3 max-w-prose text-muted">
          단순 문서 생성기가 아닙니다. 사람·AI 모두 빠르게 도메인을 이해하도록 세 층으로 분리합니다.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {layers.map((l) => (
            <div
              key={l.tag}
              className="rounded-lg border border-border bg-bg p-6 shadow-sm"
            >
              <div className="font-mono text-xs text-primary">{l.tag}</div>
              <div className="mt-1 text-xl font-semibold">{l.title}</div>
              <p className="mt-2 text-sm text-muted">{l.desc}</p>
              <pre className="mt-4 rounded bg-fg/[.04] p-3 font-mono text-xs leading-6 text-muted">
                {l.sample}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
