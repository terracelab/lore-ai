# Changesets

이 디렉토리에는 [Changesets](https://github.com/changesets/changesets) 노트가 저장됩니다.

## 새 노트 추가

```bash
pnpm changeset
```

프롬프트:

1. 영향받는 패키지 선택
2. 변경 유형 (`major` / `minor` / `patch`)
3. 한 줄 요약 (CHANGELOG 에 그대로 노출)

생성된 `.md` 파일을 PR 에 포함시키세요.

## 자동화

- main 푸시 → `release.yml` → 봇이 모인 changeset 으로 "Version Packages" PR 생성
- 그 PR 머지 → `npm publish` 자동 실행

자세한 흐름은 [RELEASING.md](../RELEASING.md) 참고.
