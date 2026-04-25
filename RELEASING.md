# 릴리즈 프로세스 — Lore AI

> 메인테이너가 npm 으로 새 버전을 배포할 때 따르는 체크리스트.

전체 플로우는 [Changesets](https://github.com/changesets/changesets) + GitHub Actions 가 자동 처리합니다. 사람이 개입하는 지점은 **PR 리뷰 두 번** 뿐입니다.

---

## 0. 준비 (1회성)

`DEPLOYMENT.md` 의 §1.4 (`NPM_TOKEN` 시크릿), §3.3 (Automation Token) 이 끝나 있어야 합니다.

---

## 1. 일상 흐름 (자동)

```
기여자: 코드 PR + pnpm changeset
                │
                ▼
       PR review → squash merge
                │
                ▼
   main push triggers release.yml
                │
                ▼
  changesets bot opens "Version Packages" PR
        - bumps versions
        - aggregates CHANGELOG.md
                │
                ▼
   메인테이너: 그 PR 리뷰 → merge
                │
                ▼
  release.yml runs again →
        pnpm publish -r --access public
        creates GitHub Release + git tag
```

메인테이너는 **두 PR 만 리뷰**합니다 (기여자 PR + Version Packages PR).

---

## 2. 첫 릴리즈 (`0.1.0-alpha.0`)

자동 흐름은 한 번 사람의 손이 필요합니다 — npm 에 패키지가 처음 등장하는 시점.

### 2.1 dry-run

```bash
pnpm install
pnpm build
pnpm test
pnpm changeset version          # 버전 bump 결과 미리보기
git diff                        # 의도대로 bump 됐는지 확인
git checkout -- .               # 되돌리기
```

### 2.2 실제 publish

가능하면 자동 워크플로를 쓰는 것이 좋습니다. 하지만 첫 publish 만 수동으로 해야 합니다 (npm 사용자명/2FA confirm 등 주의사항).

```bash
pnpm changeset version          # 버전 bump 커밋용
git add .
git commit -m "chore: 0.1.0-alpha.0"
pnpm build
pnpm changeset publish          # npm publish 실행
git push --follow-tags
```

이후부터는 §1 의 자동 흐름이 작동합니다.

---

## 3. SemVer 가이드

| 변경                                                            | 버전      |
| --------------------------------------------------------------- | --------- |
| public API 깨짐 (`lore.config.yaml` 스키마 변경, CLI 인자 제거) | **major** |
| 신규 커맨드/옵션, frontmatter 필드 추가                         | **minor** |
| 버그 수정, 메시지 개선                                          | **patch** |

`0.x` 동안은 minor 도 깨질 수 있다고 명시 (README · CHANGELOG 헤더에).

`1.0.0` 진입 조건:

- Airpoint dogfooding 완료
- 외부 사용자 5팀 이상에서 안정 보고
- frontmatter contract 동결
- v0 커맨드 5개 (`init/check/sync/synthesize/publish`) 의 인자 시그니처 동결

---

## 4. 보안 패치

CVE 가 보고되면:

1. 비공개 patch 브랜치 (GitHub Security Advisory 의 _Draft fix_)
2. 동시에 패치 PR (changesets `patch`)
3. main 머지 → 즉시 publish (`workflow_dispatch` 로 수동 트리거 가능)
4. Advisory 공개 + 영향받는 버전 표시

---

## 5. 롤백

npm 의 `unpublish` 는 24시간 내에만 가능 (그 외에는 deprecate). 전략:

```bash
# 새 버전을 즉시 올리고, 문제 버전을 deprecate
npm deprecate lore-ai@0.1.5 "Use 0.1.6+ — see CVE-2026-XXXX"
```

`unpublish` 는 외부 의존성 있는 패키지를 깨뜨리므로 최후 수단.

---

## 6. 체크리스트 (Version Packages PR 머지 전)

- [ ] CHANGELOG 가 사람이 읽을 만하게 정리됨
- [ ] 새 패키지 버전 번호가 SemVer 의도와 일치
- [ ] `.changeset/*.md` 가 모두 소진됨 (PR 안에서 삭제됨)
- [ ] 사이트 (`apps/web`, `apps/docs`) 의 버전 표시·예시 코드가 새 버전과 호환
- [ ] 큰 변경이면 [GitHub Discussions](https://github.com/terracelab/lore-ai/discussions) 에 요약 포스트 예약

---

## 7. 자주 보이는 문제

### 7.1 "Tag already exists"

원인: 이전 publish 가 부분 성공.

해결:

```bash
git tag -d <tag>
git push --delete origin <tag>
# changesets bot 이 다시 시도하도록 main 에 빈 커밋
```

### 7.2 "402 Payment Required" on publish

`publishConfig.access: public` 가 모든 패키지 package.json 에 있는지 확인. scoped 패키지는 기본 private 이므로 명시 필수.

### 7.3 monorepo 안의 `workspace:*` 가 그대로 publish 됨

changesets 는 `workspace:` 를 자동으로 실제 버전으로 치환합니다. 안 됐다면:

- `pnpm` 버전이 8+ 인지 확인
- `.changeset/config.json` 의 `updateInternalDependencies: "patch"` 확인

---

## 8. 참고

- [Changesets docs](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
- [SemVer 2.0](https://semver.org/spec/v2.0.0.html)
