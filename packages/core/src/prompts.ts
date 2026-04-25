import type { Annotation } from './types.js';
import type { LoreConfig } from './config.js';
import { renderL3 } from './markdown.js';

export interface SynthesizeInput {
  category: string;
  annotations: Annotation[];
  config: LoreConfig;
  /** optional existing flow body (for incremental updates) */
  existingBody?: string;
  /** unified diff window for "since" mode */
  recentDiff?: string;
}

export interface SynthesizeAllCategoryInput {
  category: string;
  annotations: Annotation[];
  existingBody?: string;
}

export interface SynthesizeAllInput {
  categories: SynthesizeAllCategoryInput[];
  config: LoreConfig;
  flowsDir: string;
  recentDiff?: string;
}

const L2_DOCTRINE = `# Required L2 structure (8-section skeleton)

각 flow 파일은 아래 8섹션 골격을 그대로 따른다. 카테고리에 해당 정보가 전혀 없는 섹션이라도 \`_(해당 없음)_\` 으로 명시하고 섹션 자체는 생략하지 않는다.

\`\`\`markdown
# <icon> <slug> — <한국어 라벨> (L2 Flow)

> **카테고리**: \`<slug>\` — [DOMAIN_MAP](../DOMAIN_MAP.md) 참조
> **범위**: <한 줄 요약>
> **검증 필요**: 이 문서의 일부는 코드에서 추출/추론된 초안. ⚠️ 표시 항목은 담당자 검토 필요.

## 1. 구성 앱/파일
서버/클라이언트 파일 풀리스트. 파일당 한 줄 책임 요약. 각 파일은 \`[name](path)\` 마크다운 링크.

## 2. 데이터 모델
- ASCII ER 다이어그램 (테이블·FK·UNIQUE 제약 표시)
- 핵심 필드 제약 표: \`| 필드 | 규칙/비고 |\`

## 3. 엔드포인트 (서버 카테고리에 한함)
5컬럼 표: \`| Method | Path | View/Handler | 권한 | 핵심 로직 |\`. 한 행 = 한 엔드포인트.

## 4. 대표 플로우
\`4.1\`, \`4.2\` ... 번호 매긴 순차 단계. 각 단계 = 한 함수 / 한 액션 / 한 사이드이펙트. 단계 안에서 서버 ↔ 클라이언트 호출 매핑을 명시 (예: \`POST /user/login/ → AuthProvider.login()\`).

## 5. 권한·데코레이터 패턴
auth/permission 데코레이터·미들웨어·가드 정리.

## 6. 클라이언트 상태 (클라이언트 카테고리에 한함)
store / context / hook / route guard 구조.

## 7. 정책 — 확정 vs 확인 필요 vs TBD
세 분류로 명시 분리:
- **확정** — 코드에서 명시적으로 추론 가능한 정책
- **⚠️ 확인 필요** — 코드만으로 단정 어려움 / 보안·금융·개인정보 리스크 후보 / 의도 불명한 default
- **TBD** — 담당자 정책 인터뷰 필요

## 8. 관련 파일 인덱스
서버/클라이언트 풀리스트 (\`[file:line](path#Lline)\` 링크).
\`\`\`

# Style — must

- 표 · ASCII 다이어그램 · 번호 매긴 단계 적극 사용. **한두 문장의 평면 산문 H2 금지** — 그런 섹션은 표나 번호 단계로 재구조화한다.
- 각 섹션은 L3 facts 가 허용하는 한 최대한 상세하게 (얇은 한두 줄 H2 금지).
- 코드 참조는 \`[symbol:line](path#Lline)\` 마크다운 링크.
- ⚠️ 마커는 정책 검토 필요 / 보안·금융·개인정보 리스크 후보 / 의도 불명한 default 에만. 남발 금지.
- existing body 와 비교해 삭제·이동된 기능은 반드시 제거 (out-of-date 청소).
- raw annotation 덤프 금지 — 사실을 서술 문장 + 표로 재구성.

# Connection 추론 (어노테이션 태그가 없어도 derive)

다음 연결은 어노테이션이 없어도 코드 단서로 추론해 4번 (대표 플로우) 또는 8번 (파일 인덱스) 섹션에 명시한다:

- **엔드포인트 ↔ 화면/페이지/스토어 액션** 매핑 (예: \`POST /user/login/ → LoginPageContent / AuthProvider.login\`)
- **모델 ↔ 다른 모델의 FK / 참조** 관계
- **서버 background task / scheduler ↔ 트리거 모델·이벤트**
- **React 컴포넌트 ↔ 사용 hook ↔ API 클라이언트 함수** 체인

추론 근거가 약하면 ⚠️ 와 함께 표시.

# 출력 규약

- 마크다운 본문만, \`\`\` 펜스로 문서를 감싸지 않는다.
- YAML frontmatter 금지 (CLI 가 prepend 한다).
- Korean voice, 사실 우선, 두루뭉실 회피.`;

/**
 * Build the synthesize prompt for an L2 flow.
 *
 * Produces a *Claude Code-friendly* prompt: stable section headers,
 * embedded L1 + L3 context, explicit output contract.
 */
export function buildSynthesizePrompt(input: SynthesizeInput): string {
  const { category, annotations, config, existingBody, recentDiff } = input;
  const cat = config.domains[category];
  const label = cat?.label ?? category;
  const subdomains = cat?.subdomains ?? [];

  const l3 = annotations.map(renderL3).join('\n\n');

  return [
    `You are the technical writer for the "${label}" (${category}) flow in the Lore AI documentation system.`,
    `Rewrite \`.lore/flows/${category}.md\` body using the strict 8-section structure below, drawing facts from L1 + L3 + existing body + recent git activity.`,
    '',
    `# 1. Category metadata`,
    `- slug: ${category}`,
    `- label: ${label}`,
    subdomains.length ? `- subdomains: ${subdomains.join(', ')}` : '',
    '',
    `# 2. L1 — Domain map (excerpt)`,
    Object.entries(config.domains)
      .map(([k, v]) => `- \`${k}\` — ${v.label}`)
      .join('\n'),
    '',
    existingBody
      ? `# 3. Existing L2 body (사실 보존, 8섹션으로 재구성 — 옛 평면 구조면 재배치)\n\n${existingBody}`
      : `# 3. Existing L2 body\n\n_(none — first-time synthesis)_`,
    '',
    `# 4. L3 — symbols & business logic facts`,
    l3 || '_(no annotations extracted for this category)_',
    '',
    recentDiff
      ? `# 5. Recent git activity (\`--since\` window)\n\n\`\`\`\n${recentDiff}\n\`\`\``
      : '',
    '',
    L2_DOCTRINE,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Build a single multi-category synthesize prompt covering every category in
 * one shot. The LLM is instructed to emit one file block per category using
 * `=== FILE: <path> ===` / `=== END FILE ===` markers, OR (when running inside
 * an agent like Claude Code) to write the files directly with its tools.
 */
export function buildSynthesizeAllPrompt(input: SynthesizeAllInput): string {
  const { categories, config, flowsDir, recentDiff } = input;

  const l1 = Object.entries(config.domains)
    .map(([k, v]) => {
      const subs = v.subdomains?.length ? ` (subdomains: ${v.subdomains.join(', ')})` : '';
      return `- \`${k}\` — ${v.label}${subs}`;
    })
    .join('\n');

  const perCategory = categories
    .map((c) => {
      const meta = config.domains[c.category];
      const label = meta?.label ?? c.category;
      const subs = meta?.subdomains?.length
        ? `\n  - subdomains: ${meta.subdomains.join(', ')}`
        : '';
      const l3 = c.annotations.map(renderL3).join('\n\n');
      const existing = c.existingBody
        ? `\n\n### Existing body (사실 보존, 8섹션으로 재구성 — 옛 평면 구조면 재배치)\n\n${c.existingBody}`
        : `\n\n### Existing body\n\n_(none — first-time synthesis)_`;
      return [
        `## Category: \`${c.category}\` — ${label}${subs}`,
        existing,
        `\n### L3 — symbols & business logic facts\n`,
        l3 || '_(no annotations extracted — skip this category in your output)_',
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return [
    `You are the technical writer for the Lore AI documentation system.`,
    `Rewrite every L2 flow file below in one pass using the strict 8-section structure.`,
    '',
    `# 1. L1 — Domain map (full)`,
    l1,
    '',
    `# 2. Per-category context`,
    '',
    perCategory,
    '',
    recentDiff
      ? `# 3. Recent git activity (\`--since\` window)\n\n\`\`\`\n${recentDiff}\n\`\`\`\n`
      : '',
    L2_DOCTRINE,
    '',
    `# Multi-file output framing`,
    '',
    `Emit ONE rewritten flow per category, using this exact framing:`,
    '',
    `  === FILE: ${flowsDir}/<category>.md ===`,
    `  # <icon> <slug> — <라벨> (L2 Flow)`,
    `  ## 1. 구성 앱/파일`,
    `  ...`,
    `  ## 8. 관련 파일 인덱스`,
    `  ...`,
    `  === END FILE ===`,
    '',
    `Skip any category whose L3 facts say "(no annotations extracted)".`,
    '',
    `If you are running inside an agent with file-editing tools (e.g. Claude Code),`,
    `prefer writing each category directly to \`${flowsDir}/<category>.md\` — body only, no frontmatter.`,
  ]
    .filter(Boolean)
    .join('\n');
}
