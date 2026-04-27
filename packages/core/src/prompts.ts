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

const L2_DOCTRINE = `# Required L2 structure — 보고서 (report) 포맷

이 문서는 사람이 읽는 **카테고리 보고서** 다. 산문 위주 위키가 아니라 **표 · 다이어그램 · 배지 · 번호 단계** 로 한 눈에 들어오는 구조여야 한다. 카테고리에 해당 정보가 전혀 없는 섹션이라도 \`_(해당 없음)_\` 으로 명시하고 섹션 자체는 생략하지 않는다.

## 시각 어휘 (consistent badges)

이 보고서 전체에서 의미가 같은 신호는 같은 배지로 표시한다. 새 배지를 임의로 만들지 말 것.

| 의미 | 배지 |
|------|------|
| 정책 확정 (코드에서 명확히 도출) | 🟢 확정 |
| 검토 필요 (보안 · 금융 · 개인정보 · 의도 불명한 default) | 🟡 확인 필요 |
| 미정 — 담당자 인터뷰 필요 | 🔴 TBD |
| 위험도 (정책 행 옆에) | 🔥 높음 · 🟧 보통 · 🟩 낮음 |
| 권한 (엔드포인트 표) | 🔓 public · 🔒 auth · 🛡️ admin · 💳 paid · 🤖 internal |
| 변경 분류 (History 타임라인) | 🆕 신규 · 🔄 변경 · 🗑 제거 · 🔐 보안 · 💳 결제 · 📜 정책 · 🐛 버그 |

## 9-section skeleton

\`\`\`markdown
# <icon> <slug> — <한국어 라벨> (L2 Flow)

> **카테고리**: \`<slug>\` — [DOMAIN_MAP](../DOMAIN_MAP.md) 참조
> **범위**: <한 줄 요약>
> **검증 필요**: 🟡 표시 항목은 담당자 검토. 🔴 항목은 정책 인터뷰 필요.

## 📊 한눈에 보기

| 지표 | 값 |
|------|----|
| 📁 파일 수 | <서버 + 클라이언트 합산> |
| 🔌 엔드포인트 | <개수 또는 _(해당 없음)_> |
| 🗃️ 핵심 모델 | <개수> |
| ⚙️ 백그라운드 작업 / 시그널 | <개수 또는 _(해당 없음)_> |
| 🟡 확인 필요 정책 | <§7 의 🟡 행 수> |
| 🔴 TBD | <§7 의 🔴 행 수> |
| 🕒 가장 최근 변경 | <§8 의 가장 최근 \`@History\` 날짜> |

이 카드는 §1–§9 의 실제 내용과 정확히 일치해야 한다 (불일치 = 잘못된 보고서).

## 1. 구성 앱/파일
서버/클라이언트 파일 풀리스트. **표 형식 권장**:

\`\`\`markdown
| 영역 | 파일 | 한 줄 책임 |
|------|------|-----------|
| 서버 | [\`payment/views.py\`](payment/views.py) | 결제 엔드포인트 묶음 |
| 클라 | [\`PaymentScreen.tsx\`](src/screens/PaymentScreen.tsx) | 결제 폼 + 결과 처리 |
\`\`\`

## 2. 데이터 모델

### 2.1 ER 다이어그램 (필수)
**Mermaid \`erDiagram\` 우선**, 렌더러 미지원 환경 대비 fenced ASCII 폴백 가능. 예:

\`\`\`mermaid
erDiagram
  User ||--o{ CandidateAIProfile : owns
  CandidateAIProfile {
    int id PK
    int user_id FK
    text embedding
  }
\`\`\`

### 2.2 핵심 필드 제약 표 (필수)
\`| 필드 | 타입 | 제약 / 비고 |\` — 모든 비-자명 필드 (FK · UNIQUE · NULL 정책 · default) 를 한 행씩.

## 3. 엔드포인트 (서버 카테고리에 한함)
**6컬럼 표** — 권한은 위 시각 어휘의 배지를 그대로 사용:

\`\`\`markdown
| Method | Path | View/Handler | 권한 | 핵심 로직 | 비고 |
|--------|------|--------------|------|----------|------|
| POST | \`/user/login/\` | [\`AuthView.post\`](auth/views.py#L42) | 🔓 public | 토큰 발급 | 6시간 TTL |
| GET | \`/me/\` | [\`MeView.get\`](user/views.py#L18) | 🔒 auth | 프로필 조회 | — |
\`\`\`

권한 셀에는 데코레이터 / permission_classes 원문도 한 줄 인용 (예: \`🔒 auth (IsAuthenticated)\`).

## 4. 대표 플로우

### 4.1 시각화 (Mermaid 우선)
주요 플로우당 \`flowchart LR\` 또는 \`sequenceDiagram\` 1개. 예:

\`\`\`mermaid
flowchart LR
  C[Client] -->|POST /login| A[AuthView]
  A --> T[(token store)]
  A -->|200 + tokens| C
  C -->|setTokens| S[authStore]
\`\`\`

### 4.2 단계 설명
\`4.2.1\`, \`4.2.2\` ... 번호 매긴 순차 단계. 각 단계 = 한 함수 / 한 액션 / 한 사이드이펙트. **Connection 매핑 1줄** 을 단계마다 명시:
- \`POST /user/login/ → AuthProvider.login() → authStore.setTokens()\`
- \`Candidate.post_save signal → ai_profile_generator.generate_ai_profile() → CandidateAIProfile.update_or_create\`

\`@Connection\` 어노테이션이 있으면 그 내용을 1차 재료로 사용. 없으면 코드 단서로 추론.

## 5. 권한·데코레이터 패턴
auth / permission 데코레이터 · 미들웨어 · 가드 정리. \`@subscription_required\` 같은 커스텀 데코레이터는 정의 위치까지 링크. 가능하면 표:

\`\`\`markdown
| 데코레이터 / 가드 | 정의 위치 | 의미 | 적용 대상 |
|-------------------|----------|------|----------|
\`\`\`

## 6. 클라이언트 상태 (클라이언트 카테고리에 한함)
store / context / hook / route guard 구조. zustand · redux store 의 상태 트리 + 어느 컴포넌트가 어느 selector 를 쓰는지. 가능하면 \`flowchart\` 또는 트리 표.

## 7. 정책 — 확정 vs 확인 필요 vs TBD
**한 표로 통합** (분류 · 위험도 배지 동시 사용):

\`\`\`markdown
| 분류 | 위험도 | 정책 | 근거 |
|------|--------|------|------|
| 🟢 확정 | 🟩 낮음 | 토큰 TTL 6시간 | [\`AuthView:42\`](auth/views.py#L42) |
| 🟡 확인 필요 | 🔥 높음 | 비밀번호 reset 토큰 1회용 여부 불명 | [\`PasswordReset:88\`](auth/views.py#L88) |
| 🔴 TBD | 🟧 보통 | 다중 디바이스 동시 로그인 정책 | _(코드에서 추론 불가)_ |
\`\`\`

## 8. 변경 이력 (\`@History\`)
카테고리에 속한 모든 \`@History\` 엔트리를 **시간 순으로** 모은 타임라인 (필수 — \`@History\` 가 1건이라도 있으면 절대 생략 금지). 각 행은 변경 분류 배지로 시작:

\`\`\`
- **2025-09-12** 🔄 토큰 TTL 24h → 6h 로 단축 _(심볼: [\`AuthView\`](auth/views.py#L42))_
- **2025-08-01** 🆕 비밀번호 reset 엔드포인트 추가 _(심볼: [\`PasswordReset\`](auth/views.py#L88))_
\`\`\`

같은 날짜·관련 변경은 묶어서 한 줄로. 의사결정 배경 (특허·외부 서비스 등) 도 그대로 보존.

## 9. 관련 파일 인덱스
서버/클라이언트 풀리스트 (\`[file:line](path#Lline)\` 링크). 1번 섹션과 중복돼도 괜찮음 — 1번은 책임 요약, 9번은 라인까지 내려간 풀 인덱스.
\`\`\`

# Style — must

- **§0 메트릭 카드 · 모든 데이터를 표 / 다이어그램으로**. 한두 문장의 평면 산문 H2 는 금지 — 그런 섹션은 표 · 번호 단계 · Mermaid 로 재구조화한다.
- 각 섹션은 L3 facts 가 허용하는 한 최대한 상세하게 (얇은 한두 줄 H2 금지).
- 코드 참조는 \`[symbol:line](path#Lline)\` 마크다운 링크.
- 위 "시각 어휘" 표의 배지만 사용 — 새 이모지를 즉흥으로 만들지 말 것.
- existing body 와 비교해 삭제·이동된 기능은 반드시 제거 (out-of-date 청소).
- existing body 가 이미 보고서 포맷이면 **변경된 사실만 반영** 하여 부분 갱신 (그대로인 표·다이어그램은 보존). 변경이 없는 섹션은 절대 임의 재작성 금지.
- raw annotation 덤프 금지 — 사실을 서술 문장 + 표로 재구성.
- \`@History\` 와 \`@Connection\` 의 텍스트는 **반드시 보존** (요약하더라도 의사결정 배경 단어를 유지).
- Mermaid 블록은 항상 \`\`\`mermaid 펜스 사용. 렌더러가 Mermaid 미지원이라고 판단되는 카테고리에서만 ASCII 폴백.

# Connection 사용

L3 facts 의 \`**Connection**\` 블록 (소스 어노테이션의 \`@Connection\` 태그) 이 1차 재료. 거기 적힌:
- \`FK: ...\`, \`Writer: ...\`, \`Reader: ...\`, \`Caller: ...\` 같은 라인은 4번 (대표 플로우) 또는 9번 (파일 인덱스) 의 직접 자료.
- \`Server-only\` 같은 노트는 7번 (정책) 의 ⚠️ 또는 확정 항목으로 변환.

\`@Connection\` 어노테이션이 없어도 코드 단서로 다음을 추론:
- **엔드포인트 ↔ 화면/페이지/스토어 액션** 매핑
- **모델 ↔ 다른 모델의 FK / 참조** 관계
- **서버 background task / scheduler / signal ↔ 트리거 모델·이벤트**
- **React 컴포넌트 ↔ 사용 hook ↔ API 클라이언트 함수** 체인

추론 근거가 약하면 ⚠️ 와 함께 표시.

# 출력 규약

- \`\`\` 펜스로 문서 전체를 감싸지 않는다.
- **YAML frontmatter 는 무조건 포함** (필수). 기존 파일 상단에 \`---\` 으로 시작하는 frontmatter 블록이 있으면 **그대로 보존** 하고 닫는 \`---\` 아래 본문만 새로 작성한다. frontmatter 가 없거나 신규 파일이면 다음 필드를 직접 작성: \`slug\` (카테고리 키) · \`title\` (한국어 라벨) · \`icon\` (이모지) · \`order\` · \`summary\` (한 줄) · \`tags\` (subdomains) · \`last_reviewed\` (오늘 날짜 YYYY-MM-DD). **frontmatter 가 빠진 출력은 잘못된 결과물.**
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
    `Rewrite \`${input.config.flows.dir}/${category}.md\` body as a **시각 보고서** following the structure below — banner card + 9 sections, tables · Mermaid · 배지 위주. Draw facts from L1 + L3 + existing body + recent git activity.`,
    `If the existing body already follows this structure, do an **incremental update**: keep stable tables / diagrams as-is and only rewrite the rows / steps that the L3 facts say have actually changed.`,
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
      ? `# 3. Existing L2 body (사실 보존 + 변경된 부분만 부분 갱신 — 옛 평면 구조면 보고서 포맷으로 재배치)\n\n${existingBody}`
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
        ? `\n\n### Existing body (사실 보존 + 변경된 부분만 부분 갱신 — 옛 평면 구조면 보고서 포맷으로 재배치)\n\n${c.existingBody}`
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
    `Rewrite every L2 flow file below in one pass as a **시각 보고서** — banner card + 9 sections, tables · Mermaid · 배지 위주. If a category's existing body already follows this structure, do an **incremental update**: only rewrite the rows / steps the L3 facts say have actually changed.`,
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
    `Emit ONE rewritten flow per category, using this exact framing — **frontmatter 포함 필수**:`,
    '',
    `  === FILE: ${flowsDir}/<category>.md ===`,
    `  ---`,
    `  slug: <category>`,
    `  title: <한국어 라벨>`,
    `  icon: <emoji>`,
    `  order: <n>`,
    `  summary: <한 줄 요약>`,
    `  tags: [<subdomains>]`,
    `  last_reviewed: <YYYY-MM-DD>`,
    `  ---`,
    ``,
    `  # <icon> <slug> — <라벨> (L2 Flow)`,
    `  ## 1. 구성 앱/파일`,
    `  ...`,
    `  ## 9. 관련 파일 인덱스`,
    `  ...`,
    `  === END FILE ===`,
    '',
    `Skip any category whose L3 facts say "(no annotations extracted)".`,
    '',
    `If you are running inside an agent with file-editing tools (e.g. Claude Code),`,
    `write each category directly to \`${flowsDir}/<category>.md\` — **preserve the existing`,
    `frontmatter (\`---\` block at top) verbatim and replace only the content below the`,
    `closing \`---\`**. If the file does not yet exist or has no frontmatter, prepend a new`,
    `frontmatter block per the schema above using L1 metadata + today's date.`,
  ]
    .filter(Boolean)
    .join('\n');
}
