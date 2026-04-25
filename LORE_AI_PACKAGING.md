# 📦 Lore AI — 패키지화 & 배포 가이드

> **목적**: Airpoint 내부 파이프라인인 Lore AI 를, 타 프로젝트(Django + React/RN Expo/TS 프레임워크) 에서 **최소 effort** 로 도입 가능한 **npm 패키지 + CLI** 로 독립시키고, Claude Code / VSCode Copilot 과 맞물려 돌아가게 만든다. 대시보드까지 포함한 v1 계획을 담는다.
>
> 이 문서는 **Claude Code 에게 넘겨 스캐폴딩·구현을 수행시키기 위한 handoff spec** 이다. 읽기 전에 [LORE_AI.md](LORE_AI.md) / [AUTHORING_GUIDE.md](AUTHORING_GUIDE.md) 를 먼저 볼 것.

---

## 0. 결정 요약 (TL;DR)

| 항목                | 결정                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **패키지 이름**     | `lore-ai` (npm)                                                                                                      |
| **배포 채널**       | npm (primary) + GitHub Actions + (v1) MCP Server                                                                     |
| **언어**            | TypeScript (CLI & 파서) — tree-sitter 로 Python+TS 둘 다 처리                                                        |
| **레포 구조**       | pnpm workspace 모노레포 (core / cli / parser / mcp / dashboard)                                                      |
| **타겟 스택**       | Django (Python) + React / RN Expo / Next.js / 기타 TS                                                                |
| **공식 대시보드**   | 별도 프로젝트 **Lore Board** (`onboarding/lore-board`). `packages/dashboard` 는 셀프호스트 fallback (§7)             |
| **출력 규격**       | L2 MD 카테고리당 1개 + 고정 frontmatter (`slug/title/icon/order/...`) — §2.5                                         |
| **프로젝트 등록**   | `lore-board/content/projects.json` 단일 manifest. 코드 수정 없이 한 파일 편집으로 프로젝트 추가/수정 — §2.6          |
| **배포 파이프라인** | `lore publish` — 기본은 **로컬 rsync + main 직접 push** (PR 없음). Git PR 은 opt-in — §5.5                           |
| **권한 모델**       | v0 에선 미구현. 현재는 **수동 publish (복붙·직접 push)** + Lore Board 의 단순 `user.projects` 필터. RBAC 는 v2 — §12 |
| **AI 통합**         | Claude Code (MCP), VSCode Copilot (MD 파일 읽기 자동 수혜)                                                           |
| **어노테이션 스펙** | 필수 2개 + 조건부 1개 + 선택 4개 (§2)                                                                                |
| **v0 MVP 범위**     | `lore init / check / sync / synthesize / publish` 5개 커맨드                                                         |
| **v1 범위**         | MCP 서버 + 셀프호스트 `packages/dashboard` (RAG 포함)                                                                |

---

## 1. 제품 포지셔닝

> **"Living business-logic documentation for AI-assisted dev teams."**

- **해결하는 문제**: AI 코드 에디터(Claude Code / Cursor / Copilot) 가 "왜 이렇게 짰는지" 를 모름. README/Notion 은 썩고, git blame 은 의미 변화를 못 말함.
- **접근**: 코드 옆 규격 주석 → 자동 추출 → AI 에게 도메인 맥락 공급.
- **차별점**: 단순 문서 생성기가 아니라 **3-Layer (L1 지도 / L2 서사 / L3 팩트) 구조** + **데이터 아카이올로지 (`@History`)**.

---

## 2. 어노테이션 표준 (패키지 스펙)

### 2.1 태그 등급

| 태그             | 등급            | 용도                                        |
| ---------------- | --------------- | ------------------------------------------- |
| `@Domain`        | **필수**        | L1 카테고리 토큰. config 검증 대상          |
| `@BusinessLogic` | **필수**        | 한 줄 로직 요약                             |
| `@History`       | **조건부 필수** | 데이터/정책 의미 변경 시. 과거 DB 행 해석용 |
| `@Context`       | 선택            | 의사결정 배경 ("왜")                        |
| `@Flow`          | 선택            | L2 flow-id 링크                             |
| `@MigratedFrom`  | 선택            | V1→V2 마이그레이션 추적                     |
| `@SeeAlso`       | 선택            | 관련 심볼 참조                              |

### 2.2 `@History` 작성 규칙

**추가해야 할 때**: 과거 DB 덤프 / 캐시 / 이벤트 로그 열었을 때 지금 코드와 다른 세계관이면 무조건.
**스킵 가능**: 순수 리팩토링, 이름 변경, 성능 개선.

### 2.3 포맷 예시

**Python (docstring)**:

```python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False, Celery 자동 갱신
    @Context: trial 종료 후 자동 결제 실패 시 3일 grace 제공 (CS 요청 #1203)
    @History:
      - 2024-03-15: trial 7일 → 14일 (이전 가입자는 7일 기준, 백필 없음)
      - 2024-11-02: valid_until NOT NULL 강제 (migration 0042)
    @Flow: auto-renewal, grace-period
    """
```

**TypeScript (JSDoc)**:

```tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 + 투자 성향 뱃지 표기
 * @Flow profile-display
 */
export default function ProfileCard({ userInfo }: Props) { ... }
```

### 2.4 Config 검증 규칙

- `@Domain` 값은 `lore.config.yaml` 의 `domains` 에 등록된 토큰이어야 함
- `token/subtoken` 형식, 쉼표로 다중 허용 (`subscription/master, notification/trigger`)
- 필수 태그 누락 시 precommit fail

---

## 2.5 Lore Board 출력 규격 (필수)

`lore sync` 의 산출물은 별도 대시보드 프로젝트 **Lore Board** (`onboarding/lore-board`) 가 그대로 읽을 수 있는 구조를 따른다. 이 규격이 맞아야 사이드바·RAG·링크 네비게이션이 전부 작동한다.

### 2.5.1 파일 레이아웃

```
.lore/
├── DOMAIN_MAP.md              # L1, 최상위 지도 (사람·AI 읽기용)
└── flows/
    ├── INDEX.md               # 카테고리 목차 (자동 생성, slug=index)
    ├── auth.md                # L2 × 1개, 카테고리당 MD 하나
    ├── signal.md
    ├── subscription.md
    └── ...
```

- **단일 `BUSINESS_LOGIC_<PROJECT>.md` 통파일은 생성하지 않는다.** Lore Board 는 카테고리를 개별 라우트(`/flows/<project>/<slug>`) 로 렌더하므로 반드시 **카테고리 = 파일** 1:1 매핑.
- `INDEX.md` 는 `domains` config 의 순서·메타를 기반으로 매 `sync` 때 재생성.

### 2.5.2 L2 Flow 파일 frontmatter (Lore Board 파서 contract)

```yaml
---
slug: signal # 필수 · 파일명과 동일 · 라우트 /flows/<project>/signal
title: 시그널 # 필수 · 한글 표시명
icon: 📘 # 필수 · 이모지 1개 (lore-board 사이드바 아이콘)
order: 2 # 필수 · 사이드바/카드 정렬
summary: 시그널 톡·픽·리포트·투표 # 카드 서브타이틀 (1줄)
tags: [talk, realtime, pick, vote] # 검색·필터용 소문자-대시
last_reviewed: 2026-04-25 # `lore sync` 실행일 자동 주입
source_commit: abc1234 # 원본 레포 git HEAD 단축 해시 (traceability)
source_files: 23 # 본 카테고리에 기여한 소스 파일 수 (참고용)
---
```

필드는 Lore Board 의 [`src/lib/content.ts`](onboarding/lore-board/src/lib/content.ts) `FlowMeta` 와 **이름·의미 동일**. 추가 필드는 파서가 무시.

### 2.5.3 본문 구조 (RAG 친화 규칙)

Lore Board 의 RAG 인덱서 ([`src/lib/flow-index.ts`](onboarding/lore-board/src/lib/flow-index.ts)) 는 **H2 (`##`) 단위로 섹션을 쪼개서** 인덱싱한다. 따라서 L2 본문은:

- `# 제목` (H1) **1회** → `## 섹션` (H2) **여러 번** 구조를 반드시 따름
- H2 제목은 챗봇 응답 참고자료 칩의 라벨이 됨 → **질문 키워드가 걸릴 수 있는 말**로 (`"1. 도메인 맵"`, `"4. 대표 플로우"` 같은 식)
- H3 이하는 인덱싱 단위에 포함되지 않음 (본문 검색만)
- 길이: 섹션당 20자 이상 본문 (너무 짧으면 인덱싱 skip)

### 2.5.4 INDEX.md 자동 생성 템플릿

```md
---
slug: index
title: 카테고리 전체 목록
icon: 🗂
order: 0
---

# 🗂 L2 Flows — Category Index

> `{{project}}` 프로젝트 · 총 {{N}}개 카테고리 · `lore sync` 가 자동 생성

| #   | Slug     | 아이콘 | 이름      | 문서                   |
| --- | -------- | ------ | --------- | ---------------------- |
| 1   | `auth`   | 🔐     | 인증/계정 | [auth.md](auth.md)     |
| 2   | `signal` | 📘     | 시그널    | [signal.md](signal.md) |

...
```

Lore Board 의 `getAllFlows()` 는 `slug === "index"` 인 문서는 **파싱만 하고 뷰에 노출하지 않는다**. INDEX 는 사람/Claude Code 의 네비게이션 용.

### 2.5.5 DOMAIN_MAP.md 생성

L1 도메인 카테고리 지도. `.lore/DOMAIN_MAP.md` 로 출력하되 Lore Board 에는 **공개하지 않음** (소스 레포 내부 문서). Lore Board 에 올리려면 별도 handbook 문서로 수동 큐레이션 권장.

---

## 2.6 프로젝트 레지스트리 — `lore-board/content/projects.json`

Lore Board 에 어떤 프로젝트가 존재하는지·표시 이름·아이콘·순서를 **단일 JSON manifest** 로 관리한다. 사이드바 라벨·홈 카드 제목·프로젝트 페이지 헤더 모두 이 파일을 참조하므로, **신규 프로젝트 등록은 이 manifest 편집 한 번으로 끝난다** (코드 수정 없음).

### 2.6.1 스키마

```json
{
  "version": 1,
  "projects": [
    {
      "slug": "airpoint",
      "name": "에어포인트",
      "icon": "🔵",
      "order": 1,
      "description": "금융 시그널·구독 커뮤니티",
      "status": "active"
    },
    {
      "slug": "foodcook",
      "name": "식자재쿡",
      "icon": "🍚",
      "order": 2,
      "description": "B2B 식자재 주문·배송",
      "status": "draft"
    }
  ]
}
```

| 필드          | 필수 | 설명                                                                        |
| ------------- | ---- | --------------------------------------------------------------------------- |
| `slug`        | ✅   | `content/projects/<slug>/` 디렉토리 이름과 일치. 라우트 `/flows/<slug>/...` |
| `name`        | ✅   | 한글 표시명 (사이드바·홈 카드)                                              |
| `icon`        | ✅   | 이모지 1개                                                                  |
| `order`       | ✅   | 사이드바 정렬                                                               |
| `description` | —    | 홈 페이지 카드 서브타이틀                                                   |
| `status`      | —    | `active` · `draft` · `archived`. `archived` 는 사이드바에서 흐리게 (선택)   |

### 2.6.2 업데이트 플로우

- 새 프로젝트 추가: manifest 에 한 항목 append + `content/projects/<slug>/flows/` 디렉토리 생성 (첫 `lore publish` 가 채움)
- 이름/아이콘 변경: manifest 편집만. 코드 수정 없음
- 프로젝트 보관: `status: "archived"` 로 변경 (삭제는 비권장 — 링크 유실)

### 2.6.3 `lore init` 의 역할

`lore init` 은 Lore Board 의 manifest 를 **자동으로 건드리지 않는다**. 이유: 소스 레포와 Lore Board 레포가 분리되어 있어 소스 쪽이 상위 레지스트리를 함부로 수정하면 안 됨. 대신 `lore init` 은 다음을 콘솔에 안내:

```
✓ lore.config.yaml 생성 완료

다음 단계 — Lore Board 에 이 프로젝트를 등록하려면:
  1. lore-board 레포에서 content/projects.json 을 열고 아래 항목을 추가하세요:

     {
       "slug": "foodcook",
       "name": "식자재쿡",
       "icon": "🍚",
       "order": 2,
       "status": "draft"
     }

  2. lore publish 로 첫 동기화
```

---

## 3. 패키지 아키텍처

### 3.1 모노레포 레이아웃

```
lore-ai/
├── packages/
│   ├── core/           # 어노테이션 파서, config 로더, L3 생성기, 프롬프트 빌더
│   ├── parser/         # tree-sitter 래퍼 (py + ts)
│   ├── cli/            # `lore` CLI 엔트리
│   ├── mcp/            # MCP 서버 (v1)
│   └── dashboard/      # 셀프호스트 fallback 대시보드 (v1+, optional)
│                       #   ※ 메인 유즈케이스는 별도 프로젝트 `lore-board` 사용 (§7)
├── templates/          # `lore init` 이 복사할 템플릿
│   ├── lore.config.yaml
│   ├── DOMAIN_MAP.md
│   ├── flows/INDEX.md
│   ├── prompts/synthesize.md
│   └── hooks/
│       ├── husky-pre-commit
│       └── pre-commit-config.yaml
├── examples/
│   ├── django-expo/    # 데모 프로젝트
│   └── nextjs/
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── .changeset/
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

### 3.2 기술 선택

| 용도     | 선택                        | 이유                                                     |
| -------- | --------------------------- | -------------------------------------------------------- |
| 런타임   | Node 18+                    | npx 1-stop 배포                                          |
| 언어     | TypeScript                  | 타입 안전, 파서 라이브러리 풍부                          |
| 파싱     | regex + tree-sitter         | @tag 추출은 regex, "substantive file" 판별은 tree-sitter |
| CLI      | `commander`                 | 표준, 가볍다                                             |
| Config   | `zod` + YAML                | 런타임 validation                                        |
| Build    | `tsup`                      | ESM/CJS 동시 출력                                        |
| Test     | `vitest`                    | 빠름                                                     |
| Monorepo | `pnpm` + `turbo`            | 캐시 빌드                                                |
| Release  | `changesets`                | 버전·changelog 자동화                                    |
| MCP (v1) | `@modelcontextprotocol/sdk` | 공식 SDK                                                 |

---

## 4. Config 스키마 (`lore.config.yaml`)

```yaml
version: 1

projects:
  server:
    root: ./backend
    language: python
    include:
      - '**/views.py'
      - '**/views/*.py'
      - '**/models.py'
      - '**/services.py'
      - '**/tasks/*.py'
      - '**/celery_beat/tasks/*.py'
    exclude:
      - '**/__init__.py'
      - '**/tests.py'
      - '**/migrations/**'
    output: ./backend/docs/BUSINESS_LOGIC_SERVER.md

  client:
    root: ./app
    language: typescript
    include:
      - 'app/**/*.{ts,tsx}'
      - 'components/**/*.{ts,tsx}'
      - 'hooks/**/*.ts'
      - 'stores/**/*.ts'
      - 'controllers/**/*.ts'
    exclude:
      - '**/*.test.*'
      - '**/node_modules/**'
    output: ./app/docs/BUSINESS_LOGIC_CLIENT.md

# L1 — 카테고리 토큰 (validation 대상)
domains:
  auth:
    label: 인증
    subdomains: [profile, session, oauth]
  subscription:
    label: 구독
    subdomains: [master, renewal, trial]
  signal:
    label: 시그널
    subdomains: [detection, publishing]
  # ... 프로젝트에 맞춰 추가

# L2 — flows 디렉토리
flows:
  dir: ./.lore/flows
  indexFile: INDEX.md

# L3 — 추출 규칙
extract:
  requireDomain: true
  requireBusinessLogic: true
  requireHistoryOnDataChange: warn # strict | warn | off
  minSubstantiveLines: 5 # 이하면 체크 skip

# LLM (synthesize 단계)
llm:
  provider: anthropic
  model: claude-opus-4-7
  apiKeyEnv: ANTHROPIC_API_KEY
  temperature: 0.3

# 대시보드 (v1, optional)
dashboard:
  enabled: false
  port: 4321
```

---

## 5. CLI 커맨드 스펙

### 5.1 `lore init`

```bash
npx lore-ai init [--template django-expo|nextjs|custom]
```

- 워크스페이스에 `lore.config.yaml`, `.lore/flows/`, `DOMAIN_MAP.md` 생성
- 감지된 프로젝트 구조 기반 `projects:` 자동 채움 (package.json/manage.py 검색)
- husky 또는 pre-commit 훅 자동 설치 물어봄
- `.mcp.json` 생성 제안 (Claude Code 연동)

### 5.2 `lore check [files...]`

- precommit 엔트리. 스테이징 파일 받아 필수 태그 검사
- 실패 시 exit 1, 색깔 diff 로 누락 위치 표시
- `--fix` 는 지원 안 함 (주석은 사람이 써야 함)

### 5.3 `lore sync [--project server|client|all]`

- 전체 스캔 → L3 MD + §2.5 규격에 맞는 L2 `.lore/flows/<category>.md` 재생성
- `INDEX.md` 자동 regenerate, 각 flow 파일의 `last_reviewed` · `source_commit` · `source_files` frontmatter 자동 주입
- 변경 없으면 no-op (git diff 0)
- **출력은 단일 통파일이 아닌 카테고리별 MD** (§2.5.1 참조). 기존 `BUSINESS_LOGIC_<PROJECT>.md` 통파일은 deprecated.

### 5.4 `lore synthesize <category> [--since 2.weeks] [--apply]`

- L1 + L2(기존) + L3(해당 카테고리) 번들링
- `--apply` 없으면: 프롬프트를 stdout 에 출력 (Claude Code 에 수동 붙여넣기)
- `--apply` 있으면: Anthropic SDK 직접 호출 → `flows/<category>.md` 덮어쓰기 (백업 생성)

### 5.5 `lore publish [--target <path|git>] [--mode direct|pr] [--dry-run]`

생성된 `.lore/flows/*.md` 를 **Lore Board** 의 `content/projects/<project>/flows/` 로 동기화하는 배포 커맨드. 기본 철학: **빠르고 가볍게 — PR 없이 main 에 직접 반영**. 리뷰가 필요한 조직은 `--mode pr` 로 명시적 opt-in.

#### 5.5.1 기본 모드: `direct` (권장 · v0 기본값)

1. **로컬 경로 (개발·모노레포)**

   ```bash
   lore publish --target ~/dev/projects/onboarding/lore-board
   ```

   - `.lore/flows/` 전체를 target 의 `content/projects/{config.publish.project}/flows/` 로 rsync
   - 기존 파일은 덮어씀 (단, `handbook/` · `projects.json` 은 절대 건드리지 않음)
   - 커밋/푸시 없음 — 이후 수동으로 `git add && git commit && git push` 하거나 에디터에서 복붙

2. **Git 직접 push (CI 또는 원격 실행)**

   ```bash
   lore publish --target git@github.com:terracelab/lore-board.git --branch main
   ```

   - 임시 클론 → 파일 교체 → commit → **`git push origin main` 으로 바로 반영**
   - 커밋 메시지: `chore(docs): sync {project} @ {source_commit}`
   - `GITHUB_TOKEN` 또는 SSH 키 필요
   - Lore Board 가 Vercel 자동배포면 push 즉시 live

3. **Dry run**

   ```bash
   lore publish --dry-run
   ```

   - 변경될 파일 경로·크기 diff 만 출력, 아무것도 쓰지 않음

#### 5.5.2 Opt-in 모드: `pr` (리뷰 강제 조직용)

```bash
lore publish --mode pr --target git@github.com:terracelab/lore-board.git
```

- 임시 브랜치 (`lore-sync/{project}-{timestamp}`) 생성 → push → PR open
- PR body 에 변경된 flow slug 리스트 자동 나열
- **v0 기본값 아님**. 팀이 main 보호 규칙을 쓰면 명시적으로 설정.

#### 5.5.3 Config

```yaml
publish:
  target: git@github.com:terracelab/lore-board.git # or 로컬 경로
  branch: main
  project: airpoint # content/projects/<project>/ 디렉토리 이름
  mode: direct # direct(기본) | pr
  authorName: 'Lore Bot'
  authorEmail: 'lore@terracelab.co.kr'
  prefix: 'chore(docs): sync'
  skipPaths: # 절대 건드리지 않는 경로 (handbook · manifest 보호)
    - content/handbook/**
    - content/projects.json
```

#### 5.5.4 복붙 워크플로 (권한 시스템 전 임시 운영)

v0 에선 CI 자동 publish 권한 부여를 건너뛰고 **개발자가 로컬에서 수동 publish → 수동 push** 가 기본 운영 모델:

```bash
# 소스 레포 (airpoint-back) 에서
lore sync
lore publish --target ~/dev/projects/onboarding/lore-board

# lore-board 레포에서 diff 검토
cd ~/dev/projects/onboarding/lore-board
git add content/projects/airpoint/
git commit -m "docs(airpoint): sync flows"
git push
```

`projects.json` 편집은 사람이 수동으로 (§2.6 참조). v2 에서 권한 부여 + CI 자동화 도입 예정.

#### 5.5.5 멱등성 보장

- `sync` → `publish` 는 같은 소스 커밋에 대해 결과가 동일해야 함 (MD 내 `last_reviewed` 는 날짜만이라 자연 멱등)
- 같은 커밋을 두 번 publish 하면 두 번째는 "no changes" 로 종료

### 5.6 `lore chat`

- L1+L2+L3 를 system prompt 로 로드 + prompt caching 활성화
- REPL 모드, 로컬 Q&A

### 5.7 `lore mcp` (v1)

- MCP 서버 모드로 실행. stdio 또는 HTTP
- resources: `lore://domain-map`, `lore://flows/<cat>`, `lore://business-logic/<project>`
- tools: `search_flows`, `get_history(symbol)`, `validate_change(diff)`

### 5.8 `lore dashboard` (v1+, 셀프호스트 fallback)

- Next.js 앱을 `.lore/dashboard/` 에 생성/실행 — **Lore Board 가 없는 유저** 를 위한 대안
- 팀이 Lore Board 를 쓰는 경우 이 커맨드는 불필요. §7 참조.

---

## 6. 구현 순서 (Claude 에게 넘길 때 이 순서로)

### Phase A — 스캐폴딩 (0.5일)

1. `mkdir lore-ai && cd lore-ai && pnpm init`
2. `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
3. `packages/{core,parser,cli}` 디렉토리 + 각 `package.json`
4. `.changeset` 설정
5. `.github/workflows/ci.yml` (lint + test)

### Phase B — 코어 구현 (3~4일)

6. `packages/core/src/config.ts` — zod 스키마 + loader
7. `packages/core/src/parser.ts` — regex 기반 어노테이션 추출
8. `packages/parser/src/python.ts`, `typescript.ts` — tree-sitter 로 substantive file 판별
9. `packages/core/src/extractor.ts` — 파일 → Annotation[] 집계
10. `packages/core/src/markdown.ts` — Annotation[] → L3 MD
11. `packages/core/src/checker.ts` — precommit 검증 로직 (필수 태그 + 도메인 토큰)
12. `packages/core/src/prompts.ts` — L2 synthesize 프롬프트 빌더
13. 단위 테스트 (vitest)

### Phase C — CLI (1~2일)

14. `packages/cli/src/index.ts` — commander 라우팅
15. 각 커맨드 핸들러 (`init/check/sync/synthesize/chat`)
16. `templates/` 디렉토리 작성 (lore.config.yaml, DOMAIN_MAP.md, 훅 스니펫)
17. E2E 스모크 테스트 (임시 디렉토리에서 init → sync 돌려보기)

### Phase D — Dogfooding (1주)

18. Airpoint 에 설치: `pnpm add -D lore-ai` (링크 or local tarball)
19. 기존 `.CLAUDE/business_logic/*.sh` 와 `scripts/check_business_logic.*` 를 CLI 로 교체
20. 현존 주석을 `lore sync` 로 돌려 **§2.5 규격의 L2 flow 파일** 로 재생성, Lore Board 현 `content/projects/airpoint/flows/` 와 diff 확인 (regression 0 목표)
21. `lore publish --target ~/dev/projects/onboarding/lore-board --dry-run` 으로 변경 범위 확인
22. 실제 publish → Lore Board dev 에서 사이드바·RAG·챗봇 모두 정상 동작 확인
23. 버그 수정, 스펙 조정

### Phase E — 배포 (0.5일)

24. README, LICENSE (MIT), CHANGELOG 초기화
25. npm 계정 확인 + 이름 선점 (`npm view lore-ai`)
26. `pnpm changeset` → `pnpm changeset version` → `npm publish --access public`
27. GitHub public + Release tag

### Phase F — v1 확장 (옵션, 2~3주)

28. `packages/mcp` — MCP 서버 (resources + tools)
29. `packages/dashboard` — **셀프호스트 fallback** Next.js 앱 (Lore Board 미사용 유저용)
    - 플로우 시각화 (react-flow)
    - 도메인 히트맵 (Recharts)
    - @History 타임라인 뷰
    - RAG 검색 (pgvector 또는 local SQLite + embeddings)
    - ⚠ 메인 유즈케이스는 Lore Board (§7). 이 패키지는 소규모 오픈소스 프로젝트용.
30. `examples/django-expo` 데모 프로젝트 — `lore init → sync → publish (로컬 lore-board)` 전 과정 포함
31. 블로그 포스트 / Product Hunt

---

## 7. Lore Board 연동 (공식 대시보드)

`lore-ai` 는 **대시보드를 자체 포함하지 않는다** (§5.8 의 `lore dashboard` 는 셀프호스트 fallback 전용). 대시보드 역할은 별도 Next.js 프로젝트 **Lore Board** (`onboarding/lore-board`) 가 담당:

- 여러 프로젝트의 L2 flows 통합 렌더링 (사이드바 그룹핑 + 문서 뷰)
- 회사 핸드북 (lore-ai 범위 밖, 수동 관리)
- AI 챗봇 (RAG over flows + handbook, Claude/GPT 제공자 선택)
- 권한 기반 프로젝트 필터링 (Django `user.projects` 연동)
- 온보딩 UI (Day pill, 사이드바 Collapse, 진행률 표시)

### 7.1 파이프라인 전체 그림

```
 ┌──────────────────┐       ┌─────────────┐                    ┌──────────────────┐
 │ airpoint-back    │ @tag  │  lore-ai    │  lore publish      │  Lore Board      │
 │ (Django)         │ ────▶ │  CLI        │ ─────────────────▶ │  content/        │
 │ + lore.config    │       │  .lore/flows│     (PR to git      │    projects/     │
 └──────────────────┘       └─────────────┘      or rsync)      │      airpoint/   │
 ┌──────────────────┐             │                             │        flows/    │
 │ airpoint-app     │ @tag        │  ── L2 MD (§2.5)            │                  │
 │ (RN Expo)        │ ────▶ ──────┘                             │    handbook/     │
 │ + lore.config    │                                           │      (수동)      │
 └──────────────────┘                                           └──────────────────┘
 ┌──────────────────┐                                                   │
 │ foodcook-*       │ @tag                                              ▼
 │ (별도 프로젝트)  │ ────▶ (같은 패턴, publish target=foodcook)     Lore Board 렌더
 └──────────────────┘                                              (사이드바·검색·챗)
```

각 소스 프로젝트는 **자체 lore.config.yaml + publish target** 를 가지며 독립적으로 문서화·배포된다. Lore Board 는 여러 프로젝트가 쌓아놓은 `content/projects/<slug>/flows/*.md` 를 단일 UI 로 묶어 보여주는 **수동 장치**에 가깝다 (생성 로직 없음, 렌더만).

### 7.2 프로젝트 신규 등록 절차 (manifest 기반)

신규 프로젝트(`foodcook` 등)를 Lore Board 에 노출하려면 **코드 수정 없이** 다음만 하면 된다:

1. **소스 레포에서** `lore init` 실행 → `lore.config.yaml` 생성, `publish.project` 를 원하는 slug 로 설정
2. 어노테이션 작성 → `lore check` 통과 확인
3. `lore sync` → `.lore/flows/*.md` 로컬 생성, §2.5 규격 준수 확인
4. **첫 `lore publish`** — Lore Board 의 `content/projects/<slug>/flows/` 가 채워짐
5. **Lore Board 의 `content/projects.json` 편집** (§2.6 참조) — 프로젝트 항목 append:
   ```json
   { "slug": "foodcook", "name": "식자재쿡", "icon": "🍚", "order": 2, "status": "draft" }
   ```
6. (권한 시스템 도입 후) Django `User.projects` 에 slug 부여 — v0 에선 Mock 유저의 `projects` 배열 편집

**코드 변경 Zero**: 과거처럼 `sidebar.tsx` 의 `PROJECT_LABELS` 하드코딩을 고칠 필요 없음. Sidebar / 홈 / 프로젝트 페이지 모두 manifest 를 읽는다.

### 7.3 Handbook 은 lore-ai 범위 밖 (일부 자동화 여지)

Lore Board 의 `content/handbook/*.md` (연차·근무·장비 등 회사 정책) 는 **코드에서 추출 가능한 정보가 아니다** — 기본적으로 HR/운영팀이 MD 를 직접 작성·PR. `lore publish` 는 이 디렉토리를 항상 스킵.

#### 7.3.1 범용 정책 자동 sync (v1+, 선택)

다만 **"모든 회사에 공통인 범용 정책"** (근무시간 템플릿, 장비 지급 원칙, 보안 기본 정책 등) 은 별도 npm 패키지 (`@lore/handbook-essentials`) 로 추상화해 자동 sync 가능성 열어둠:

```bash
lore handbook sync --preset kr-startup-standard
```

- 범용 템플릿을 `content/handbook/_generated/` 에 쓰고, 회사 특화 정책은 `content/handbook/*.md` 에 그대로 유지
- **지금(v0) 은 전부 수동**. v1+ 에서 수요 보고 추가.

#### 7.3.2 보호 경로

`lore publish` 의 default `skipPaths` (§5.5.3) 에 `content/handbook/**`, `content/projects.json` 이 포함됨 — 소스 레포가 이 경로를 덮어쓸 수 없다. Manifest / handbook 손실 방지.

### 7.4 신규 Lore Board 만으로 충분한가?

| 유즈케이스                     | Lore Board | 셀프호스트 `lore dashboard` |
| ------------------------------ | ---------- | --------------------------- |
| 자사 여러 프로젝트 통합 온보딩 | ✅ 기본    | —                           |
| 단일 오픈소스 프로젝트 문서화  | 과도함     | ✅ 적합                     |
| 회사 핸드북 필요               | ✅         | —                           |
| Django 세션 인증 기반 권한     | ✅         | —                           |
| 완전 로컬/에어갭               | —          | ✅                          |

v0 에서는 Lore Board 를 기본 권장, v1 의 `packages/dashboard` 는 보조.

### 7.5 Lore Board 의 RAG 와 lore-ai 의 `lore chat` 의 관계

둘 다 RAG 기반이지만 역할 분리:

- `lore chat` (CLI): **개발자 로컬** 에서 단일 프로젝트의 L1~L3 전체를 컨텍스트로 Q&A. 코드 작성 중 빠른 참조용.
- Lore Board RAG: **브라우저** 에서 여러 프로젝트 + handbook 통합 Q&A. 비개발자 / 신입도 접근.

---

## 8. Claude Code / Copilot 연동

### 8.1 VSCode Copilot

- 별도 설정 불필요. `lore sync` 로 생성된 `BUSINESS_LOGIC_*.md` 가 워크스페이스에 있으면 Copilot 이 자동 참조.
- Tip: `.vscode/settings.json` 에 `"github.copilot.chat.codeGeneration.useInstructionFiles": true` + `.github/copilot-instructions.md` 에 "항상 `BUSINESS_LOGIC_*.md` 를 참조할 것" 명시.

### 8.2 Claude Code

`lore init` 이 `.mcp.json` 을 워크스페이스에 추가:

```json
{
  "mcpServers": {
    "lore": {
      "command": "npx",
      "args": ["-y", "lore-ai", "mcp"]
    }
  }
}
```

Claude Code 재시작하면 `@lore` 로 L1/L2/L3 자동 투입.

### 8.3 Cursor

`.cursor/rules/lore.mdc` 자동 생성 — "항상 `BUSINESS_LOGIC_*.md` 참조" 규칙.

---

## 9. 품질 기준

### 9.1 테스트

- **Unit**: 파서·checker·config 로더 100% 커버
- **Integration**: 샘플 py/tsx 파일로 sync → MD diff 검증
- **E2E**: 임시 디렉토리에 `init → 코드 추가 → sync → check` 시나리오

### 9.2 벤치마크

- 파이썬 1000 파일 sync < 5초
- TS 5000 파일 sync < 10초
- (병렬 처리 + 파일 해시 캐시)

### 9.3 DX

- 첫 `init` 부터 첫 `sync` 성공까지 **60초 이내**
- 에러 메시지에 항상 fix 제안 포함
- `--verbose`, `--json`, `--no-color` 지원

---

## 10. 공개 체크리스트

- [ ] npm 이름 `lore-ai` 사용 가능 여부 확인
- [ ] GitHub org / repo 준비
- [ ] README 에 30초 데모 GIF
- [ ] MIT LICENSE
- [ ] CODE_OF_CONDUCT / CONTRIBUTING
- [ ] `examples/django-expo` 가 즉시 clone & run 가능
- [ ] 블로그 포스트: "Why we built Lore AI" + 사용법
- [ ] Product Hunt / HN 포스팅 (선택)

---

## 11. Claude Code 에게 넘기는 방법

### 11.1 새 워크스페이스 생성

```bash
mkdir ~/dev/projects/lore-ai && cd ~/dev/projects/lore-ai
code .   # VSCode + Claude Code 열기
```

### 11.2 첫 프롬프트 (이 문서 통째로 컨텍스트 투입)

> 이 문서 ([.CLAUDE/LORE_AI_PACKAGING.md](.CLAUDE/LORE_AI_PACKAGING.md)) 와 [LORE_AI.md](.CLAUDE/LORE_AI.md), [AUTHORING_GUIDE.md](.CLAUDE/AUTHORING_GUIDE.md) 를 읽고,
> §6 의 Phase A 부터 순서대로 실행해줘.
> Phase A 끝나면 멈추고 결과 보고해. 내가 승인하면 Phase B 진행.

### 11.3 참고 원본 (포팅 대상)

Airpoint 내부의 다음 스크립트들이 v0 의 **기능 명세서** 역할을 함. 포팅 시 1:1 동작 보존:

| Airpoint 원본                                                                                         | 패키지 내 대응                                                         |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [airpoint-back/scripts/check_business_logic.py](../airpoint-back/scripts/check_business_logic.py)     | `packages/core/src/checker.ts` (Python 쪽)                             |
| [airpoint-app/scripts/check-business-logic.js](../airpoint-app/scripts/check-business-logic.js)       | `packages/core/src/checker.ts` (TS 쪽)                                 |
| [airpoint-back/scripts/extract_business_logic.py](../airpoint-back/scripts/extract_business_logic.py) | `packages/core/src/extractor.ts` + `packages/parser/src/python.ts`     |
| [airpoint-app/scripts/extract-business-logic.js](../airpoint-app/scripts/extract-business-logic.js)   | `packages/core/src/extractor.ts` + `packages/parser/src/typescript.ts` |
| [.CLAUDE/business_logic/sync.sh](business_logic/sync.sh)                                              | `lore sync`                                                            |
| [.CLAUDE/business_logic/update-flows.sh](business_logic/update-flows.sh)                              | `lore synthesize`                                                      |
| [.CLAUDE/business_logic/chat.py](business_logic/chat.py)                                              | `lore chat`                                                            |

### 11.4 작업 중 유의

- **스크립트를 그대로 베끼지 말 것** — TS 로 재구현하면서 엣지케이스 테스트 보강
- **Airpoint 의존성(경로 하드코딩, 13개 카테고리 고정)** 은 전부 config 로 이주
- **v0 에선 MCP/Dashboard 스킵**. Phase A~E 만 먼저.

---

## 12. 결정 기록 & 열린 항목

### 12.1 결정된 사항 (2026-04-25)

- ✅ **`lore publish` 기본 모드** → **`direct` (main 직접 push)**. PR 모드는 `--mode pr` 로 opt-in. 소규모 팀 · Vercel 자동배포 기준 최단 리드타임. §5.5.1
- ✅ **프로젝트 레지스트리** → **`lore-board/content/projects.json` 단일 manifest**. 사이드바 하드코딩 제거, 신규 프로젝트 등록은 JSON 편집만으로 완료. §2.6
- ✅ **Handbook 자동화 범위** → **수동 기본 + 일부 범용 정책 자동화 여지**. v0 전부 수동, v1+ 에 `lore handbook sync --preset` 옵션 검토. §7.3
- ✅ **권한 모델** → **v0 연기**. 지금은 수동 publish (복붙 or 직접 push) + Lore Board 의 단순 `user.projects` 필터로 충분. RBAC·CI 자동 권한은 v2. §5.5.4

### 12.2 열린 항목 (v0 구현 전 결정 필요)

- **npm scope**: `lore-ai` vs `@terracelab/lore-ai` vs `@<username>/lore-ai`
- **GitHub org**: 개인 / terracelab / 신규
- **라이선스**: MIT / Apache-2.0 / BUSL
- **Airpoint 첫 유저 전환 시점**: v0 Airpoint 잔재(`.CLAUDE/business_logic/*`) 유지 vs 완전 교체
- **Multi-프로젝트 publish 충돌**: 두 프로젝트가 동시에 direct push 하면 race. 초기엔 문제 적지만 향후 `git pull --rebase` 자동화 필요할 수 있음

---

## 13. 참고 문서

- [LORE_AI.md](LORE_AI.md) — 파이프라인 개요 (이 패키지의 존재 이유)
- [AUTHORING_GUIDE.md](AUTHORING_GUIDE.md) — 어노테이션 규격 원본 (v0 스펙으로 축소 필요)
- [business_logic/UPDATE_GUIDE.md](business_logic/UPDATE_GUIDE.md) — L2 갱신·병합 전략
- MCP: https://modelcontextprotocol.io
- tree-sitter: https://tree-sitter.github.io
- changesets: https://github.com/changesets/changesets

---

**문서 버전 규칙**: 이 문서는 패키지 설계·범위 변경 시에만 갱신. Phase 별 진행 상황은 `lore-ai` 레포의 ROADMAP.md 에서 관리.
