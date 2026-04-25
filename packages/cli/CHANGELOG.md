# lore-ai

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
