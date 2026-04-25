# Lore AI — 오픈소스 배포 전반 기획 & 설계

> 본 문서는 [LORE_AI_PACKAGING.md](LORE_AI_PACKAGING.md) 의 **"무료 오픈소스 배포"** 측면을 구체화한 실행 설계서다. 코드·사이트·도큐멘테이션·릴리즈 파이프라인 전반을 $0 비용으로 구축하는 방법을 다룬다.

---

## 0. 한 장 요약

| 레이어          | 선택                                               | 비용 | 근거                                            |
| --------------- | -------------------------------------------------- | ---- | ----------------------------------------------- |
| 코드 호스팅     | GitHub (public)                                    | $0   | 사실상 표준. Actions · Discussions · Pages 포함 |
| 패키지 배포     | npm (public)                                       | $0   | 스코프 없는 공개 패키지는 무료 · 2FA 강제       |
| CI/CD           | GitHub Actions                                     | $0   | public repo 는 분/월 무제한                     |
| 버전·체인지로그 | Changesets                                         | OSS  | PR 기반 버전 자동화 · npm publish 통합          |
| 모노레포        | pnpm + Turborepo                                   | OSS  | 캐시·병렬 빌드·디스크 효율                      |
| 브랜딩 사이트   | Next.js 15 + Tailwind + shadcn                     | $0   | Vercel Hobby 플랜                               |
| 도큐 사이트     | Nextra 3 (Next.js 기반)                            | $0   | 동일 Vercel 배포                                |
| 검색 (도큐)     | Pagefind (정적)                                    | $0   | 서버리스 · Algolia 불필요                       |
| 애널리틱스      | Plausible Community / Umami / Vercel Web Analytics | $0   | self-host 또는 Vercel 번들                      |
| 커뮤니티        | GitHub Discussions + Discord Community Server      | $0   | 둘 다 무료                                      |
| 이슈 트래커     | GitHub Issues + Templates                          | $0   |                                                 |
| 도메인 (MVP)    | `*.vercel.app`                                     | $0   | 유료 도메인은 Product Hunt 론칭 시점에          |
| 로고·디자인     | Excalidraw / Figma Free / tldraw → SVG             | $0   | 벡터 에셋 직접 생성                             |
| 소셜 카드       | `@vercel/og` 다이나믹 OG 이미지                    | $0   | 런타임 생성                                     |

**핵심 원칙**: 모든 구성요소를 Next.js 에코시스템으로 통일 → Vercel 단일 배포 타깃 → 유지보수·학습 곡선 최소화.

---

## 1. 레포지토리 구조

```
lore-ai/                             # ▲ GitHub public repo · npm 은 패키지별로 분리 publish
├── apps/
│   ├── web/                         # 브랜딩 랜딩 — lore-ai.vercel.app
│   │   ├── src/app/                 # Next.js App Router
│   │   ├── src/components/          # Hero, Features, HowItWorks, CTA, Footer
│   │   └── public/                  # logo, og, favicon
│   └── docs/                        # 도큐멘테이션 — lore-ai-docs.vercel.app
│       ├── content/                 # MDX 문서 트리
│       ├── src/app/                 # Nextra App Router
│       └── theme.config.tsx
├── packages/
│   ├── core/                        # @lore-ai-automation/core — 파서·추출·체커·마크다운
│   ├── parser/                      # @lore-ai-automation/parser — tree-sitter 래퍼
│   └── cli/                         # lore-ai — CLI 엔트리 (bin: `lore`)
├── templates/                       # `lore init` 이 복사할 템플릿
│   ├── lore.config.yaml
│   ├── DOMAIN_MAP.md
│   └── hooks/
├── examples/
│   ├── django-expo/                 # 풀스택 데모
│   └── nextjs/                      # 단일 TS 레포 데모
├── .changeset/                      # 버전·changelog 자동화
│   └── config.json
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # PR 게이트 (lint + typecheck + test + build)
│   │   ├── release.yml              # main push → Changesets PR / npm publish
│   │   └── deploy-previews.yml      # (선택) docs PR 프리뷰
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json                     # root · private: true
├── .gitignore
├── .editorconfig
├── .nvmrc
├── LICENSE                          # MIT
├── README.md                        # 30초 데모 · 설치 · 링크
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md               # Contributor Covenant 2.1
├── SECURITY.md                      # 취약점 보고 채널
├── CHANGELOG.md                     # (Changesets 가 자동 생성)
├── LORE_AI_PACKAGING.md             # 기존 handoff 스펙
├── OSS_RELEASE_PLAN.md              # ← 본 문서
├── DEPLOYMENT.md                    # 사이트 + 패키지 배포 러닝북
└── RELEASING.md                     # 버전·npm publish 체크리스트
```

---

## 2. 브랜딩

### 2.1 이름·태그라인

- **제품명**: Lore AI
- **태그라인 (영)**: _Living business-logic documentation for AI-assisted dev teams._
- **태그라인 (한)**: _"코드 옆에 적어두는 도메인 지식. AI 가 읽는다."_

### 2.2 팔레트 (다크 퍼스트)

| 토큰      | 다크                    | 라이트                 | 용도                |
| --------- | ----------------------- | ---------------------- | ------------------- |
| `bg`      | `#0A0A0B`               | `#FAFAF9`              | 배경                |
| `fg`      | `#F4F4F5`               | `#18181B`              | 본문                |
| `muted`   | `#71717A`               | `#52525B`              | 보조 텍스트         |
| `primary` | `#A78BFA` (violet-400)  | `#7C3AED` (violet-600) | 포인트·CTA          |
| `accent`  | `#34D399` (emerald-400) | `#059669`              | 성공·코드 highlight |
| `border`  | `#27272A`               | `#E4E4E7`              | 구분선              |

퍼플은 "knowledge / lore", 에메랄드는 "living / grow" 은유. 모노스페이스 폰트는 **Geist Mono**, 본문은 **Geist Sans**.

### 2.3 로고

- SVG 1종: 3개의 수평 레이어가 L 모양으로 쌓인 형태 (L1/L2/L3 은유)
- `apps/web/public/logo.svg` · 모노크롬 버전 `logo-mono.svg`
- favicon 은 [favicon.io](https://favicon.io) 로 파생

### 2.4 톤

- 개발자 톤: 건조, 팩트 위주, 이모지 자제 (본문), 섹션 헤더에만 1~2개
- 예시 코드 많이 (코드블록 = 주장의 증거)

---

## 3. 랜딩 사이트 (`apps/web`)

### 3.1 기술 스택

- Next.js 15 (App Router)
- Tailwind CSS v3 + CSS variables (다크모드 대응)
- `shadcn/ui` 기반 Button / Card / Tabs
- `next-themes` 다크 토글
- `@vercel/og` 로 `/og` 동적 OG 이미지 라우트
- 애니메이션: `framer-motion` (절제된 fade/slide 만)

### 3.2 페이지 구성

| 섹션     | 내용                                                     | 컴포넌트         |
| -------- | -------------------------------------------------------- | ---------------- |
| Hero     | 태그라인 + "npm i -g lore-ai" 복붙 + 30초 데모 video/gif | `Hero.tsx`       |
| Problem  | "AI 가 왜 이렇게 짰는지 모름" 3줄                        | `Problem.tsx`    |
| How      | 3-Layer (L1 Map / L2 Flow / L3 Fact) 다이어그램          | `HowItWorks.tsx` |
| Features | 필수 태그 · History 아카이올로지 · MCP · Publish 자동화  | `Features.tsx`   |
| Demo     | 실제 `.lore/flows/signal.md` 예시                        | `Demo.tsx`       |
| CTA      | Docs · GitHub · npm 버튼                                 | `CTA.tsx`        |
| Footer   | MIT · Terracelab · 2026                                  | `Footer.tsx`     |

### 3.3 성능 예산

- LCP < 2.0s
- 페이지 무게 < 120KB gzipped (런타임 JS)
- 이미지는 전부 SVG or AVIF

---

## 4. 도큐멘테이션 (`apps/docs`)

### 4.1 도구 선정

Nextra 3 채택 근거:

- Next.js 기반 → 랜딩과 동일 스택 → Vercel 단일 배포
- MDX 우선 → 코드 블록·콜아웃·탭 풍부
- 사이드바 자동 생성 (`_meta.json`)
- 다크모드·검색 (Pagefind) 기본 제공
- 대안 비교: Docusaurus (React 단일)·VitePress (Vite/Vue) 는 스택 불일치로 탈락

### 4.2 문서 트리

```
content/
├── index.mdx                     # 랜딩 → 바로 "What is Lore AI?"
├── getting-started/
│   ├── _meta.json
│   ├── installation.mdx
│   ├── quickstart.mdx
│   └── first-sync.mdx
├── concepts/
│   ├── three-layers.mdx          # L1/L2/L3 설계 철학
│   ├── annotations.mdx           # @Domain, @BusinessLogic, @History 스펙
│   ├── data-archaeology.mdx      # @History 심화
│   └── lore-board.mdx            # 대시보드 파이프라인
├── cli/
│   ├── init.mdx
│   ├── check.mdx
│   ├── sync.mdx
│   ├── synthesize.mdx
│   ├── publish.mdx
│   └── chat.mdx
├── integrations/
│   ├── claude-code.mdx
│   ├── vscode-copilot.mdx
│   ├── cursor.mdx
│   └── mcp.mdx
├── guides/
│   ├── django-project.mdx
│   ├── react-native.mdx
│   ├── nextjs.mdx
│   └── migrating-existing-docs.mdx
├── reference/
│   ├── config.mdx                # lore.config.yaml 전체 스키마
│   ├── frontmatter.mdx           # L2 MD frontmatter contract
│   └── exit-codes.mdx
└── contributing/
    ├── setup.mdx
    ├── architecture.mdx
    └── release-process.mdx
```

### 4.3 검색

- **Pagefind** (정적 인덱스, 빌드 시점 생성) → Algolia 불필요, 무료
- `next build && pagefind --site .next/server/app` 로 후처리

### 4.4 소셜 카드 / OG

- `apps/docs/src/app/og/route.tsx` — `@vercel/og` 로 페이지 제목·섹션을 다이나믹 OG 이미지로
- Open Graph / Twitter Card 메타 자동 주입

---

## 5. 릴리즈 파이프라인

### 5.1 브랜칭·버전

- **trunk-based**: `main` 만. 장기 브랜치 금지
- 기능 개발 → 짧은 토픽 브랜치 → PR → squash merge
- 버전은 **Changesets** 로 자동화
  - 기여자는 PR 에 `pnpm changeset` 으로 마크다운 노트 추가
  - main 푸시 시 봇이 "Version Packages" PR 생성 (모아둔 changeset 소진)
  - 그 PR 머지되면 `release.yml` 이 `pnpm publish -r --access public` 실행

### 5.2 GitHub Actions

**`.github/workflows/ci.yml`** (PR 게이트):

```yaml
on: [pull_request]
jobs:
  test:
    - pnpm install --frozen-lockfile
    - pnpm -r lint
    - pnpm -r typecheck
    - pnpm -r test -- --run
    - pnpm -r build
```

**`.github/workflows/release.yml`** (main push):

```yaml
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
  id-token: write # npm provenance
jobs:
  release:
    - uses: changesets/action@v1
      with:
        publish: pnpm -r publish --access public --no-git-checks
      env:
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5.3 npm Provenance

- `"publishConfig": { "provenance": true }` 각 패키지 package.json 에
- OIDC 로 GitHub Actions → npm 검증 (추가 비용 없음)

### 5.4 사이트 배포 (Vercel)

- GitHub repo 를 Vercel 프로젝트 2개에 연결:
  - `lore-ai-web` → `apps/web` (Root Directory)
  - `lore-ai-docs` → `apps/docs`
- 둘 다 `pnpm build` · `pnpm install --frozen-lockfile` 사용 · Output `.next`
- PR 마다 프리뷰 URL 자동 생성

---

## 6. 커뮤니티·거버넌스

### 6.1 라이선스

**MIT**. 이유:

- 상업 적용 장벽 최소 → 채택률 ↑
- Apache-2.0 의 명시적 특허 조항은 v0 규모에선 오버엔지니어링
- BUSL 은 오픈소스 아님 → "무료 OSS 배포" 목표와 불일치

### 6.2 필수 문서 7종

| 파일                                                    | 목적                                                     |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `LICENSE`                                               | MIT 본문 (2026 Terracelab)                               |
| `README.md`                                             | 한 화면 안에서 "무엇·왜·어떻게 설치"                     |
| `CONTRIBUTING.md`                                       | 개발 환경 · 커밋 규칙 · PR 체크리스트 · changeset 사용법 |
| `CODE_OF_CONDUCT.md`                                    | Contributor Covenant v2.1 한/영                          |
| `SECURITY.md`                                           | 취약점 비공개 보고 경로 (`security@terracelab.co.kr`)    |
| `CHANGELOG.md`                                          | Changesets 가 자동 관리 (수동 편집 금지)                 |
| `.github/ISSUE_TEMPLATE/*` + `PULL_REQUEST_TEMPLATE.md` | 구조화된 이슈·PR                                         |

### 6.3 이슈/PR 템플릿 골자

- Bug: "재현 최소 예제 링크" 필수
- Feature: "해결하려는 문제" 먼저, 해법은 그다음
- PR 체크박스: `pnpm changeset` 추가 여부 · 테스트 · 문서 업데이트

### 6.4 Discussions 카테고리

- 💡 Ideas · 🙋 Q&A · 📣 Show and tell · 🗳 Polls

---

## 7. 홍보·성장

### 7.1 Day 0 론칭 체크리스트

1. npm 이름 선점 (`npm view lore-ai` → 404 확인)
2. GitHub 공개
3. `lore-ai.vercel.app` (랜딩) + `lore-ai-docs.vercel.app` 배포 확인
4. README 에 **30초 GIF** (터미널 `lore init → sync → publish`)
5. 첫 릴리즈 `0.1.0` — Changesets 워크플로 검증용

### 7.2 채널

- **Show HN**: "Show HN: Lore AI — AI 가 읽는 비즈니스 로직 문서"
- **Product Hunt**: 론칭일 자정 KST (한국 오전, 미국 저녁 겹침)
- **X / LinkedIn**: 30초 GIF + 랜딩 링크
- **Korean Dev**: 디스콰이엇 / Velog / 개발자스럽다
- **블로그 포스트 3부작**:
  1. "Why we built Lore AI" — 문제 배경
  2. "3-Layer 문서 시스템" — 설계
  3. "Data Archaeology" — `@History` 의 힘

### 7.3 성공 지표 (v0 3개월)

- GitHub ⭐ 500+
- npm weekly downloads 1k+
- 외부 채택 사례 3건 (블로그/트위터 언급)

---

## 8. 법무·운영 위생

- npm 2FA 필수 (publish token 은 Actions 전용 automation token)
- 기여자 CLA 없음 — MIT 로 충분
- 제출받은 이슈에 민감 정보 있으면 즉시 삭제 + SECURITY.md 경로 안내
- 저장소 설정: Vulnerability reporting ON · Dependabot ON · Secret scanning ON

---

## 9. 구현 순서

본 플랜은 다음 순서로 물리 구현한다 (이 커밋에서 시작):

1. **모노레포 스캐폴드** — pnpm/turbo/tsconfig/.changeset
2. **OSS 필수 문서 7종**
3. **GitHub Actions CI + Release 워크플로**
4. **패키지 skeleton 3종** (core/parser/cli) — 타입 + 엔트리 + build 통과
5. **templates/** — `lore init` 용 시드 파일
6. **apps/web** — 랜딩 (Hero/Features/CTA + OG 라우트)
7. **apps/docs** — Nextra 3 + 초기 문서 20여편
8. **DEPLOYMENT.md / RELEASING.md**
9. **examples/** — stub (django-expo/nextjs)
10. **첫 커밋 + `0.1.0-alpha` changeset**

이후 Airpoint dogfooding → 피드백 → `0.1.0` 정식 릴리즈 (Phase D/E, LORE_AI_PACKAGING.md §6 참조).

---

## 10. 열린 결정 (v0 안에서 확정 필요)

| 항목           | 기본값                     | 대안                                       |
| -------------- | -------------------------- | ------------------------------------------ |
| npm scope      | `lore-ai` (scope 없음)     | `@lore-ai-automation/cli`, `@terracelab/*` |
| GitHub org     | `terracelab/lore-ai`       | 신규 org `lore-ai-org`                     |
| 도메인         | `lore-ai.vercel.app` (MVP) | `lore-ai.dev` (유료 1만원/년)              |
| 영문/국문 도큐 | 국문 먼저 · 영문 요약만    | 이중화                                     |
| 검색           | Pagefind                   | Algolia DocSearch (OSS 무료 티어)          |

결정되는 대로 README / package.json 의 `name` · `repository` · `homepage` 를 일괄 치환.

---

**문서 수명**: 본 문서는 릴리즈 전략이 바뀔 때만 갱신. 실시간 진행률은 GitHub Projects 의 "v0 launch" 보드를 참조.
