'use client';

import { motion } from 'framer-motion';

interface Persona {
  id: string;
  number: string;
  english: string;
  korean: string;
  tagline: string;
  body: string[];
  pullquote?: string;
}

const personas: Persona[] = [
  {
    id: 'context-keeper',
    number: '01',
    english: 'The Context Keeper',
    korean: '맥락 보관자',
    tagline:
      '어제까지 시니어의 머릿속에 있던 "왜 이렇게 짰는지" 가, 오늘부터 코드 옆에 박혀 있습니다.',
    body: [
      'README 는 썩고, Notion 은 갱신을 못 따라가고, git blame 은 *왜* 를 말해주지 않습니다. 이 셋의 공통점 — 도메인 지식이 코드와 분리된 어딘가에 있다는 것.',
      'Lore 는 `@Domain` · `@BusinessLogic` · `@History` 어노테이션을 통해 휘발되는 맥락을 **코드 옆에 물리적으로 결합 (Inline)** 합니다. precommit 훅이 누락을 차단하므로, 기록은 선택이 아니라 의무가 됩니다.',
    ],
    pullquote: '@History: - 2024-03-15: trial 7일 → 14일 (기존 가입자 백필 없음)',
  },
  {
    id: 'chronicler',
    number: '02',
    english: 'The Chronicler',
    korean: '역사가',
    tagline: '문서는 코드의 속도를 못 따라갑니다. 그래서 따라가지 않고, 자동 생성합니다.',
    body: [
      '"문서를 항상 최신으로 유지하라" 는 의지의 문제가 아닙니다. 한 번 어긋나면 회복 불가능한 시스템 설계의 문제입니다.',
      'Lore 는 역할을 분리합니다 — **추출은 기계가** (`lore sync`), **합성은 AI 가** (`lore synthesize`), **검토는 사람이**. 매 PR 마다 자동 추출이 돌고, 의미가 큰 변경에만 사람이 개입합니다.',
    ],
    pullquote: 'lore sync   →  .lore/flows/<카테고리>.md 가 항상 최신',
  },
  {
    id: 'cartographer',
    number: '03',
    english: 'The Cartographer',
    korean: '지도 제작자',
    tagline: 'AI 에이전트가 도메인 정책을 어기지 않도록, 위계질서 있는 지식 지도를 제공합니다.',
    body: [
      'AI 에디터에 마크다운 한 묶음을 던져준다고 해서 좋은 코드가 나오지 않습니다. 단순한 텍스트 덤프는 AI 의 추측을 막지 못합니다.',
      'Lore 의 **L1 도메인 지도 / L2 플로우 서사 / L3 심볼 팩트** 위계는 AI 에게 의미 단위로 청킹된 지식을 제공합니다. 결과: AI 가 도메인 가드레일 안에서 추론합니다 — 정책을 어기는 멍청한 제안 차단.',
    ],
    pullquote: 'L1 → L2 → L3.   지도가 있으면 AI 도 길을 잃지 않습니다.',
  },
];

export function Story() {
  return (
    <section className="border-t border-border/60 bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            why it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            세 명의 페르소나, <span className="text-primary">하나의 시스템</span>
          </h2>
          <p className="mt-4 text-pretty text-muted">
            Lore 는 단일 도구가 아닙니다. 코드베이스에서 휘발되는 세 가지를 각각 붙잡는 세 개의 힘이
            한 시스템 안에서 함께 작동합니다.
          </p>
        </div>

        <div className="mt-16 space-y-14">
          {personas.map((p, i) => (
            <Vignette key={p.id} persona={p} index={i} />
          ))}
        </div>

        <div className="mt-20 rounded-lg border border-border bg-fg/[.02] p-8">
          <p className="text-balance text-lg leading-relaxed">
            셋이 합쳐지면 AI 에디터는 비로소 <span className="font-mono text-primary">why</span> 를
            안다.
            <span className="text-muted">
              {' '}
              — 그리고 6개월 뒤의 분석가도, 새로 합류한 동료도, 마이그레이션을 디버깅하는 시니어도.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function Vignette({ persona, index }: { persona: Persona; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="grid gap-8 md:grid-cols-[1fr_2fr]"
    >
      <div>
        <div className="font-mono text-xs text-muted">{persona.number}</div>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight">{persona.english}</h3>
        <div className="mt-1 text-sm text-muted">{persona.korean}</div>
      </div>
      <div className="space-y-4">
        <p className="text-pretty text-lg italic text-fg/90">{persona.tagline}</p>
        {persona.body.map((para, j) => (
          <p key={j} className="text-pretty text-muted">
            {renderInline(para)}
          </p>
        ))}
        {persona.pullquote && (
          <pre className="mt-2 overflow-x-auto rounded border border-border bg-fg/[.04] px-4 py-3 font-mono text-xs leading-6 text-fg/80">
            {persona.pullquote}
          </pre>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Lightweight inline markdown — supports `code` and *italic* / **bold**.
 * Keeps the body strings in `personas` readable.
 */
function renderInline(text: string) {
  const parts: Array<string | React.ReactNode> = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [m] = match;
    if (m.startsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-fg/[.06] px-1.5 py-0.5 font-mono text-[0.9em] text-fg"
        >
          {m.slice(1, -1)}
        </code>,
      );
    } else if (m.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-fg">
          {m.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={key++} className="text-fg/90">
          {m.slice(1, -1)}
        </em>,
      );
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
