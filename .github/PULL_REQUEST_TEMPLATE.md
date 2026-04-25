<!--
  PR 제목은 Conventional Commits 형식으로:
    feat(cli): add --json output to lore check
    fix(parser): handle multi-line @History entries
    docs: clarify lore.config.yaml `domains` schema
-->

## 무엇을

<!-- 이 PR 이 바꾸는 것을 한두 문단으로 -->

## 왜

<!-- 어떤 문제를 해결하나? 관련 이슈 링크: Closes #123 -->

## 어떻게

<!-- 핵심 구현 결정과 트레이드오프 -->

## 테스트

<!-- 어떻게 검증했나? 새 테스트가 추가됐나? -->

## 체크리스트

- [ ] `pnpm lint && pnpm typecheck && pnpm test` 통과
- [ ] `pnpm changeset` 으로 변경 노트 추가 (문서 · CI-only 변경은 생략 가능)
- [ ] 관련 문서(`apps/docs/content/...`) 업데이트
- [ ] 새 공개 API 는 JSDoc + 단위 테스트 포함
- [ ] UI 변경 시 스크린샷·GIF 첨부

## 스크린샷 (UI 변경 시)
