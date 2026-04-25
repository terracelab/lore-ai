---
'lore-ai': minor
'@lore-ai-automation/core': minor
---

`lore synthesize` 의 카테고리 인자가 선택사항으로 변경. 인자를 생략하면 모든 카테고리의 컨텍스트를 한 프롬프트에 묶어 출력하며, LLM 은 `=== FILE: .lore/flows/<slug>.md ===` 마커로 카테고리별 응답을 분리하거나 (Claude Code 등 에이전트 환경에서) 파일을 직접 갱신할 수 있다. 카테고리당 한 번씩 명령을 돌리던 v0 워크플로의 마찰을 제거.
