# lore-ai

## 0.6.1

### Patch Changes

- [#23](https://github.com/terracelab/lore-ai/pull/23) [`ab1c6a3`](https://github.com/terracelab/lore-ai/commit/ab1c6a35db5b3fafd68ec4beb75b22e7bc0cba71) Thanks [@kyong-dev](https://github.com/kyong-dev)! - Republish depth doctrine + `lore review` (0.6.0 → 0.6.1).

  `@lore-ai-automation/core@0.6.0` 와 `lore-ai@0.6.0` npm tarball 은 PR [#20](https://github.com/terracelab/lore-ai/issues/20) 시점의 구버전 코드(이전 `draft-folder + synth-cache` 만 포함)로 게시된 상태입니다. PR [#22](https://github.com/terracelab/lore-ai/issues/22) 에서 머지된 **L2 보고서 깊이 doctrine (D1–D6) + `lore review` 명령** 은 main 에 코드만 들어있고 npm 까지 못 갔습니다 — 같은 0.6.0 버전 번호로 묶여버려 추가 release PR 이 트리거되지 않았기 때문.

  이 patch 릴리즈로 실제 동작 코드를 npm 에 동일 버전 라인(`0.6.x`) 안에서 게시:
  - `core` — `buildReviewPrompt` / `ReviewInput` export, `L2_DOCTRINE` 의 D1–D6 깊이 규칙, 강화된 `renderIndex`
  - `lore-ai` — `lore review <category>` CLI 명령

  추가로 docs 사이트 갱신:
  - 신규 `cli/review.mdx` (9개 검사 항목 C1–C9, 두 출력 모드, 권장 워크플로)
  - `cli/synthesize.mdx` 9-section + D1–D6 doctrine 반영
  - `cli/sync.mdx` `.lore/draft/` ↔ `.lore/flows/` 분리 반영
  - `concepts/three-layers.mdx`, `getting-started/first-sync.mdx`, `getting-started/quickstart.mdx`, `index.mdx`, `reference/frontmatter.mdx` 파이프라인 갱신

  코드 자체에 변경은 없고 (이미 main 에 머지됨) **재배포만**. semver 의미상 minor 가 맞지만 0.6.0 CHANGELOG 에 이미 D1–D6 가 기재되어 있어 patch 로 처리.

- Updated dependencies [[`ab1c6a3`](https://github.com/terracelab/lore-ai/commit/ab1c6a35db5b3fafd68ec4beb75b22e7bc0cba71)]:
  - @lore-ai-automation/core@0.6.1
  - @lore-ai-automation/parser@0.6.1

## 0.6.0

### Minor Changes

- L2 보고서 깊이 강화 + `lore review` 보강 패스 추가.

  **1. L2_DOCTRINE 깊이 규칙 (D1–D6)** — `synthesize` 가 만들어내는 보고서가 표·다이어그램 골격은 잡혀있으나 사람이 읽기엔 얕다는 피드백을 반영. 다음을 의무화:
  - **D1 핵심 코드 인라인 발췌** — §2 (모델) · §3 (엔드포인트) · §5 (권한·데코레이터) 의 정책 결정 코드는 5–15줄 코드 펜스 + ⭐ 한 줄 해설.
  - **D2 하위 섹션 깊이** — 영역 3개 이상이면 `### 2.1`, `### 4.1` ... 분리 (한 H2 에 다 욱여넣지 말 것).
  - **D3 기본값 / Magic 값 forensics** — `password=None` default, `CORS_ALLOW_ALL_ORIGINS=True`, 긴 토큰 TTL, `localhost` 하드코딩, 미구현 enum, `csrf_exempt` 우회, 명명 mismatch, webhook 서명 누락 등 9개 패턴은 §7 정책 표에 자동 행 + 위험도 배지로 추가.
  - **WHY 의무 (§7)** — 모든 🟡 / 🔴 행은 사유 한 줄 (업계 비교 · 실패 영향 · 의존성) 필수. 단순 ⚠️ + 사실만 적힌 행은 잘못된 보고서.
  - **D4 TBD 사유 명시** · **D5 사이드카 docs cross-link** · **D6 cross-cutting 카테고리(`api_infra`, `client_state` 등)는 수직 레이어 다이어그램 1개**.

  §0 메트릭 카드에 `🧩 코드 발췌` 카운트 컬럼 추가.

  **2. `lore review <category>` — 깊이 보강 2차 패스** — `synthesize` 결과물을 D1–D6 기준으로 감사하고, 소스 파일을 직접 읽어 누락된 코드 발췌·WHY 사유·forensics 행을 채우는 별도 명령. Claude Code 같은 파일 편집 도구가 있는 에이전트에서 돌리면 `.lore/flows/<category>.md` 를 직접 보강하고, 일반 LLM 에서는 review report markdown 을 반환한다. 9개 검사 항목 (C1~C9) 으로 통과·보강 필요 항목을 분리.

  ```bash
  lore sync                    # 코드 → L3 draft
  lore synthesize <cat>        # L3 → L2 보고서 (D1–D6 적용)
  lore review <cat>            # 보고서 깊이 보강 (코드 발췌·WHY·forensics)
  ```

  신규 export: `buildReviewPrompt`, `ReviewInput` (from `@lore-ai-automation/core`).

  **3. `INDEX.md` 강화** — `renderIndex` 가 frontmatter `summary` + "Frontmatter 스펙 / 레이어 개념 (L1·L2·L3) / 갱신 방법" 섹션을 포함해 대시보드의 카테고리 진입점으로 단독 사용 가능.

  **Migration**: 호환성 유지. 기존 `synthesize` 캐시는 그대로 사용되며, 강화된 doctrine 은 다음 `synthesize`(또는 `--force`) 부터 적용된다. `lore review` 는 `synthesize` 후 선택적으로 돌리면 된다.

- df4f941: `sync` / `synthesize` 파이프라인 분리 + 변경 감지 + 보고서 포맷 프롬프트.

  **1. 폴더 분리** — 기존엔 `sync` 도 `synthesize` 도 같은 `.lore/flows/` 를 덮어써서, 코드 변경이 없어도 `synthesize` 를 돌릴 때마다 LLM 비용을 들여 전체 카테고리를 재작성하는 문제가 있었다. 이제:
  - `sync` 는 `.lore/draft/<slug>.md` 에 **원천 L3 사실** 만 기록 (기계 생성, 매번 덮어쓰기 OK).
  - `synthesize` 는 `.lore/flows/<slug>.md` 에 **사람이 읽는 L2 보고서** 를 만든다 (`publish` · `chat` 가 읽는 곳).
  - `INDEX.md` 는 카테고리 메타만 담으므로 계속 `flows/` 에 위치.

  **2. 변경 감지 캐시** — `synthesize` 는 카테고리별로 어노테이션 집합의 정규화된 sha256 해시를 계산해 `.lore/.synth-cache/<slug>.json` 과 비교한다. 해시가 같고 flow 파일이 존재하면 그 카테고리는 프롬프트에서 빼고 스킵한다 (LLM 호출 비용 절약). `--force` 플래그로 캐시 무시 가능. 캐시는 프롬프트 emit 시점에 낙관적으로 갱신되며, 사용자 / LLM 이 실제로 flow 파일을 쓰지 않으면 다음 실행에서 자동 회복 (`flowFileExists` 게이트).

  **3. 보고서 포맷 프롬프트** — `synthesize` 가 만들어내는 문서가 평면 산문에서 **시각 보고서** 로 바뀐다:
  - 상단 📊 한눈에 보기 메트릭 카드 (파일 수 · 엔드포인트 · 모델 · 🟡/🔴 정책 카운트 · 최근 변경일)
  - §2 ER 다이어그램 / §4 대표 플로우는 **Mermaid (`erDiagram` · `flowchart`) 우선**, ASCII 폴백
  - §3 엔드포인트 표에 권한 배지 컬럼 (🔓 public · 🔒 auth · 🛡️ admin · 💳 paid · 🤖 internal)
  - §7 정책은 분류 (🟢 확정 · 🟡 확인 필요 · 🔴 TBD) + 위험도 (🔥 / 🟧 / 🟩) 통합 표
  - §8 변경 이력 각 행에 변경 분류 배지 (🆕 / 🔄 / 🗑 / 🔐 / 💳 / 📜 / 🐛)
  - 프롬프트가 명시적으로 "기존 본문이 이미 보고서 포맷이면 변경된 행 / 단계만 부분 갱신" 을 지시 — 변경 없는 섹션은 보존.

  **4. 설정 신규 필드** (모두 기본값 있음, 기존 사용자 무중단):

  ```text
  flows:
    dir: ./.lore/flows                # synthesize 출력 (사람용 보고서)
    draftDir: ./.lore/draft           # sync 출력 (원천 L3)
    cacheDir: ./.lore/.synth-cache    # 카테고리별 해시 매니페스트
    indexFile: INDEX.md
  ```

  **Migration**: 기존 `.lore/flows/*.md` 는 그대로 두고, 다음 `lore sync` 가 새로 `.lore/draft/` 를 채운다. 첫 `lore synthesize` 는 캐시가 비어있으므로 모든 카테고리를 한 번 재합성하고, 이후부터는 변경된 카테고리만 다룬다.

### Patch Changes

- Updated dependencies
- Updated dependencies [df4f941]
  - @lore-ai-automation/core@0.6.0
  - @lore-ai-automation/parser@0.6.0

## 0.5.1

### Patch Changes

- [#18](https://github.com/terracelab/lore-ai/pull/18) [`6da9dc2`](https://github.com/terracelab/lore-ai/commit/6da9dc2bd2971e780516f789784df1528260cac8) Thanks [@kyong-dev](https://github.com/kyong-dev)! - 두 가지 수정:
  1. **synthesize 프롬프트가 frontmatter 를 무조건 포함하도록 강제**: 기존 doctrine 의 "YAML frontmatter 금지 (CLI 가 prepend)" 규칙이 잘못된 가정. Claude Code 처럼 LLM 이 파일을 직접 쓰는 에이전트 환경에서는 CLI 가 prepend 할 기회가 없어 frontmatter 가 통째로 사라지는 문제 발생. 새 규칙은 (a) 기존 파일 상단의 `---` 블록을 verbatim 보존하고 닫는 `---` 아래 본문만 재작성, (b) 신규 파일이면 `slug · title · icon · order · summary · tags · last_reviewed` 필드를 직접 작성하도록 명시. 멀티-파일 framing 의 `=== FILE: ===` 블록 예시에도 frontmatter 골격 추가.
  2. **`lore init` 이 생성하는 `lore.config.yaml` 에 `publish:` 블록 코멘트 시드**: `target` · `project` · `mode` · `branch` · `prefix` 5개 필드를 코멘트 처리된 예시로 항상 포함. 사용자가 `lore publish` 를 처음 쓰려 할 때 무엇을 채워야 하는지 보이도록.

- Updated dependencies [[`6da9dc2`](https://github.com/terracelab/lore-ai/commit/6da9dc2bd2971e780516f789784df1528260cac8)]:
  - @lore-ai-automation/core@0.5.1
  - @lore-ai-automation/parser@0.5.1

## 0.5.0

### Minor Changes

- [#16](https://github.com/terracelab/lore-ai/pull/16) [`aeccb5f`](https://github.com/terracelab/lore-ai/commit/aeccb5fa51032cc834a9c148cf2da55589058b21) Thanks [@kyong-dev](https://github.com/kyong-dev)! - 세 가지 보강:
  1. **`@Connection` 어노테이션 신규**: `FK / Writer / Reader / Caller / Server-only` 같은 심볼 간 연결을 multi-line bullet 으로 적으면 파서가 추출해 L3 의 `**Connection**` 블록으로 렌더링 — synthesize 의 "대표 플로우" / "관련 파일 인덱스" 섹션 1차 재료. 8번째 정식 태그.
  2. **`@History` 날짜 형식 완화**: `YYYY-MM-DD` 만 허용하던 regex 가 `YYYY` (연도 only) · `YYYY-MM` (연-월) 도 받도록 변경. 정확한 일자가 기억나지 않는 과거 사건도 기록 가능.
  3. **카테고리 아이콘 확장**: `pickIcon` 의 하드코딩 5개 매핑을 18개 도메인 키워드 (auth · user · subscription · payment · job · candidate · attendance · security · admin · monitoring · stock · community · content · marketing · api · infra ...) 로 확장 + 미매칭 슬러그는 안정적 해시 기반 fallback 풀 (📦 🧩 🔧 🧱 🗂️ 🧭 🔖 🧪 🧰 🗃️) 에서 선택해 모든 카테고리가 같은 📂 로 무너지던 문제 해결. `lore.config.yaml` 의 `domains.<key>.icon` 으로 명시 지정도 가능.

  L2 doctrine 도 9섹션 골격으로 확장 — `@History` 항목을 시간순 타임라인으로 모으는 "변경 이력" 섹션을 8번 자리에 추가하고, `@Connection` 의 텍스트가 4번 (대표 플로우) / 9번 (관련 파일 인덱스) 의 1차 재료라는 점을 명시.

### Patch Changes

- Updated dependencies [[`aeccb5f`](https://github.com/terracelab/lore-ai/commit/aeccb5fa51032cc834a9c148cf2da55589058b21)]:
  - @lore-ai-automation/core@0.5.0
  - @lore-ai-automation/parser@0.5.0

## 0.4.0

### Minor Changes

- [#14](https://github.com/terracelab/lore-ai/pull/14) [`bdbfae8`](https://github.com/terracelab/lore-ai/commit/bdbfae8aca557906661d72aaa8f0aab9732fa4c5) Thanks [@kyong-dev](https://github.com/kyong-dev)! - `lore synthesize` 의 출력물을 평면 산문에서 8섹션 구조 (구성 파일·데이터 모델·엔드포인트·대표 플로우·권한 패턴·클라이언트 상태·정책·파일 인덱스) 로 강제. 표·ASCII ER 다이어그램·번호 단계 사용을 의무화하고 `⚠️` 마커로 정책 검토 필요 항목을 명시 분리. `--since <range>` 가 실제로 동작하도록 wiring — 카테고리 어노테이션이 위치한 디렉토리의 git log 를 자동 탐지된 git 루트에서 수집해 프롬프트에 함께 번들. 어노테이션 태그가 없어도 LLM 이 엔드포인트↔화면, 모델↔FK, task↔트리거, 컴포넌트↔hook↔API 같은 연결을 코드 단서로 추론하도록 지시 추가.

### Patch Changes

- Updated dependencies [[`bdbfae8`](https://github.com/terracelab/lore-ai/commit/bdbfae8aca557906661d72aaa8f0aab9732fa4c5)]:
  - @lore-ai-automation/core@0.4.0
  - @lore-ai-automation/parser@0.4.0

## 0.3.1

### Patch Changes

- [#11](https://github.com/terracelab/lore-ai/pull/11) [`4d0057f`](https://github.com/terracelab/lore-ai/commit/4d0057fd59aea490d5c7ce90f74b7ffe35c63d33) Thanks [@kyong-dev](https://github.com/kyong-dev)! - `lore init` 이 생성하는 `.lore/COMMANDS.md` 치트시트에 클립보드 복사 예시 추가. `lore bootstrap | pbcopy`, `lore synthesize | pbcopy` 같은 단축 흐름과 macOS / Linux (X11 · Wayland) / WSL / Windows / 크로스플랫폼별 명령 표를 포함.

- [#13](https://github.com/terracelab/lore-ai/pull/13) [`fd14be5`](https://github.com/terracelab/lore-ai/commit/fd14be5a6364772efdb56c6496f3cb60e26518e9) Thanks [@kyong-dev](https://github.com/kyong-dev)! - 문서 도메인을 `docs.lore-ai.vercel.app` 에서 `lore-ai-docs.vercel.app` 으로 변경. `lore init` 이 생성하는 `.lore/COMMANDS.md` 안내, README, AI 에디터 가드레일 템플릿 (`templates/ai/CLAUDE.md`, `copilot-instructions.md`) 의 모든 docs 링크가 새 도메인을 가리키도록 갱신.

- Updated dependencies []:
  - @lore-ai-automation/core@0.3.1
  - @lore-ai-automation/parser@0.3.1

## 0.3.0

### Minor Changes

- [#9](https://github.com/terracelab/lore-ai/pull/9) [`f35e70a`](https://github.com/terracelab/lore-ai/commit/f35e70a84bb44ae6dfb312ae940563e4f4373810) Thanks [@kyong-dev](https://github.com/kyong-dev)! - `lore synthesize` 의 카테고리 인자가 선택사항으로 변경. 인자를 생략하면 모든 카테고리의 컨텍스트를 한 프롬프트에 묶어 출력하며, LLM 은 `=== FILE: .lore/flows/<slug>.md ===` 마커로 카테고리별 응답을 분리하거나 (Claude Code 등 에이전트 환경에서) 파일을 직접 갱신할 수 있다. 카테고리당 한 번씩 명령을 돌리던 v0 워크플로의 마찰을 제거.

### Patch Changes

- Updated dependencies [[`f35e70a`](https://github.com/terracelab/lore-ai/commit/f35e70a84bb44ae6dfb312ae940563e4f4373810)]:
  - @lore-ai-automation/core@0.3.0
  - @lore-ai-automation/parser@0.3.0

## 0.2.0

### Minor Changes

- [`1f49936`](https://github.com/terracelab/lore-ai/commit/1f49936f31d522c0a972192e53c0065c917db2cd) - `lore chat` REPL implemented with Anthropic SDK + prompt caching. Loads `.lore/DOMAIN_MAP.md` (L1) and `.lore/flows/**/*.md` (L2/L3) as the system prompt with `cache_control: ephemeral`, streams responses, rolls back the user turn on API errors. Reads the API key from the env var named in `config.llm.apiKeyEnv`. Adds `@anthropic-ai/sdk` to dependencies.

### Patch Changes

- [`aac0122`](https://github.com/terracelab/lore-ai/commit/aac0122bf61e01364b08a4cef8d52a488c588d15) - Read CLI version from package.json at module load instead of a hardcoded `'0.0.0'` string. `lore --version` now stays in sync with the published tarball automatically — no manual bumps in `src/index.ts` needed.

- Updated dependencies []:
  - @lore-ai-automation/core@0.2.0
  - @lore-ai-automation/parser@0.2.0

## 0.1.0

### Minor Changes

- [`1c2d5a0`](https://github.com/terracelab/lore-ai/commit/1c2d5a0208e3d09be45e26dfb918bf6415481ab7) - Initial release scaffold:
  - `@lore-ai-automation/core` — config loader, regex annotation parser, checker, markdown synthesizer
  - `@lore-ai-automation/parser` — substantive-line detection (regex; tree-sitter planned for v1)
  - `lore-ai` (CLI) — `init / check / sync / synthesize / publish / chat` command skeletons

### Patch Changes

- Updated dependencies [[`1c2d5a0`](https://github.com/terracelab/lore-ai/commit/1c2d5a0208e3d09be45e26dfb918bf6415481ab7)]:
  - @lore-ai-automation/core@0.1.0
  - @lore-ai-automation/parser@0.1.0
