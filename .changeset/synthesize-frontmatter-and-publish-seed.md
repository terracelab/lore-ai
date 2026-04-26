---
'lore-ai': patch
'@lore-ai-automation/core': patch
---

두 가지 수정:

1. **synthesize 프롬프트가 frontmatter 를 무조건 포함하도록 강제**: 기존 doctrine 의 "YAML frontmatter 금지 (CLI 가 prepend)" 규칙이 잘못된 가정. Claude Code 처럼 LLM 이 파일을 직접 쓰는 에이전트 환경에서는 CLI 가 prepend 할 기회가 없어 frontmatter 가 통째로 사라지는 문제 발생. 새 규칙은 (a) 기존 파일 상단의 `---` 블록을 verbatim 보존하고 닫는 `---` 아래 본문만 재작성, (b) 신규 파일이면 `slug · title · icon · order · summary · tags · last_reviewed` 필드를 직접 작성하도록 명시. 멀티-파일 framing 의 `=== FILE: ===` 블록 예시에도 frontmatter 골격 추가.
2. **`lore init` 이 생성하는 `lore.config.yaml` 에 `publish:` 블록 코멘트 시드**: `target` · `project` · `mode` · `branch` · `prefix` 5개 필드를 코멘트 처리된 예시로 항상 포함. 사용자가 `lore publish` 를 처음 쓰려 할 때 무엇을 채워야 하는지 보이도록.
