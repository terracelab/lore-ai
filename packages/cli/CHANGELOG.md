# lore-ai

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
