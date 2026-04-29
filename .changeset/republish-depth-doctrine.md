---
'lore-ai': patch
'@lore-ai-automation/core': patch
---

Republish depth doctrine + `lore review` (0.6.0 → 0.6.1).

`@lore-ai-automation/core@0.6.0` 와 `lore-ai@0.6.0` npm tarball 은 PR #20 시점의 구버전 코드(이전 `draft-folder + synth-cache` 만 포함)로 게시된 상태입니다. PR #22 에서 머지된 **L2 보고서 깊이 doctrine (D1–D6) + `lore review` 명령** 은 main 에 코드만 들어있고 npm 까지 못 갔습니다 — 같은 0.6.0 버전 번호로 묶여버려 추가 release PR 이 트리거되지 않았기 때문.

이 patch 릴리즈로 실제 동작 코드를 npm 에 동일 버전 라인(`0.6.x`) 안에서 게시:

- `core` — `buildReviewPrompt` / `ReviewInput` export, `L2_DOCTRINE` 의 D1–D6 깊이 규칙, 강화된 `renderIndex`
- `lore-ai` — `lore review <category>` CLI 명령

추가로 **frontmatter 자동 보강** 수정: `synthesize` 가 기존 flow 파일의 frontmatter 를 LLM 으로 넘기기 전에 누락된 `summary` / `tags` / `last_reviewed` 를 L1 metadata + 오늘 날짜로 자동 채워줍니다. 4-필드 frontmatter (`slug` · `title` · `icon` · `order`) 만 있던 파일도 다음 `synthesize` 한 번이면 자동으로 7-필드로 업그레이드됩니다 — LLM 의 "기존 frontmatter 그대로 보존" 규칙과 "7개 필드 모두 포함" 규칙이 충돌해서 4-필드만 출력되던 버그 수정.

추가로 docs 사이트 갱신:

- 신규 `cli/review.mdx` (9개 검사 항목 C1–C9, 두 출력 모드, 권장 워크플로)
- `cli/synthesize.mdx` 9-section + D1–D6 doctrine 반영
- `cli/sync.mdx` `.lore/draft/` ↔ `.lore/flows/` 분리 반영
- `concepts/three-layers.mdx`, `getting-started/first-sync.mdx`, `getting-started/quickstart.mdx`, `index.mdx`, `reference/frontmatter.mdx` 파이프라인 갱신

코드 자체에 변경은 없고 (이미 main 에 머지됨) **재배포만**. semver 의미상 minor 가 맞지만 0.6.0 CHANGELOG 에 이미 D1–D6 가 기재되어 있어 patch 로 처리.
