---
'@lore-ai-automation/core': patch
---

fix(synthesize): augment frontmatter with summary/tags/last_reviewed before LLM

기존 flow 파일에 frontmatter 가 4-필드 (slug/title/icon/order) 만 있을 때 LLM 이
"frontmatter 그대로 보존" 규칙을 따라 4-필드로 그대로 출력하던 버그 수정.
빌더가 existingBody 를 LLM 에 넘기기 전에 누락된 summary/tags/last_reviewed 를
L1 metadata + 오늘 날짜로 자동 보강해서, 다음 synthesize 한 번이면 자동으로
7-필드로 업그레이드되도록 함. doctrine 도 충돌 해소를 위해 업데이트.
