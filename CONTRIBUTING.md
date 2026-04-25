# Contributing to Lore AI

Lore AI 에 관심을 가져주셔서 감사합니다. 이 문서는 기여 워크플로, 로컬 개발 환경, PR 체크리스트를 설명합니다.

모든 기여자는 [Code of Conduct](./CODE_OF_CONDUCT.md) 를 따라주세요.

---

## 기여 종류

- 🐛 **버그 리포트**: [이슈 템플릿](https://github.com/terracelab/lore-ai/issues/new?template=bug_report.yml) 으로 제출. **재현 최소 예제**가 없으면 우선순위가 낮습니다.
- ✨ **기능 제안**: [Discussion → Ideas](https://github.com/terracelab/lore-ai/discussions/new?category=ideas) 에 먼저 토론. 합의 후 이슈로 승격.
- 📝 **문서 개선**: `apps/docs/content/` 하위 MDX 편집. 오타도 환영.
- 🧪 **코드 기여**: 아래 "개발 플로우" 참고.

---

## 개발 플로우

### 1. 요구 사항

- Node.js 18.18+
- pnpm 9+
- Git

```bash
# macOS
brew install node pnpm
corepack enable  # pnpm 버전 pinning
```

### 2. 포크 & 클론

```bash
git clone https://github.com/<your-username>/lore-ai.git
cd lore-ai
pnpm install
```

### 3. 빌드 & 테스트

```bash
# 전체 패키지 빌드
pnpm build

# 테스트
pnpm test

# 단일 패키지만
pnpm --filter @lore-ai/core test

# 개발 서버 (사이트)
pnpm --filter web dev        # 랜딩 localhost:3000
pnpm --filter docs dev       # 도큐 localhost:3001
```

### 4. 브랜치 & 커밋

```bash
git checkout -b fix/parser-edge-case
# ... 코드 편집 ...
pnpm changeset     # 변경 노트 작성 (필수)
git add .
git commit -m "fix(parser): handle multi-line @History entries"
git push origin fix/parser-edge-case
```

- **커밋 컨벤션**: [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` 기능 · `fix:` 버그 · `docs:` 문서 · `refactor:` · `test:` · `chore:`
- **scope**: `core` · `parser` · `cli` · `web` · `docs` · `release` 중 하나
- **size**: 한 PR = 한 논리적 변경. 대규모 리팩토링은 먼저 이슈 열기.

### 5. PR 체크리스트

PR 을 열기 전 확인:

- [ ] `pnpm lint && pnpm typecheck && pnpm test` 통과
- [ ] `pnpm changeset` 으로 변경 노트 추가 (문서·CI-only 변경은 제외)
- [ ] 관련 문서 (`apps/docs/content/...`) 업데이트
- [ ] 새 공개 API 는 JSDoc + 단위 테스트 포함
- [ ] 스크린샷/GIF (UI 변경 시)

CI 가 자동으로 lint · typecheck · test · build 를 돌립니다.

---

## Changesets — 버전·Changelog 자동화

우리는 [Changesets](https://github.com/changesets/changesets) 로 버전을 관리합니다. **PR 마다 changeset 하나를 추가**하세요:

```bash
pnpm changeset
```

프롬프트:
1. 영향받는 패키지 선택 (스페이스바)
2. 변경 유형 선택: `major` / `minor` / `patch`
3. 한 줄 요약 (유저가 읽음 → changelog 에 그대로 들어감)

`.changeset/<name>.md` 파일이 생기면 커밋에 포함시키세요.

**patch 예시**:
```
---
'@lore-ai/core': patch
---

Fix @History block parsing when date contains hyphens.
```

---

## 패키지별 가이드

### `packages/core`

- 순수 TypeScript · 의존성 최소
- 각 모듈은 `src/<name>.ts` + `src/<name>.test.ts` 짝으로
- 테스트는 `vitest`, fixture 는 `__fixtures__/` 아래

### `packages/parser`

- `tree-sitter` 네이티브 바인딩 다룸 → prebuilt 바이너리 제공 여부 확인
- Python + TypeScript 문법 둘 다 지원. 하나 추가 시 test matrix 확장

### `packages/cli`

- `commander` 기반 · side effect 는 전부 `packages/core` 에 위임
- 에러 메시지는 항상 **고칠 방법** 제안 포함

### `apps/web`

- Next.js 15 App Router
- Tailwind + `next-themes`
- 디자인 토큰은 `src/lib/tokens.ts` 한 곳에서만 수정

### `apps/docs`

- Nextra 3 (App Router)
- MDX 작성 시 H1 은 페이지당 1개 · H2 단위로 RAG 인덱싱됨
- `_meta.json` 으로 사이드바 순서 조절

---

## 디버깅 팁

- CLI 실행: `pnpm --filter lore-ai dev -- init` (커맨드 인자는 `--` 뒤에)
- 단일 테스트 파일: `pnpm --filter @lore-ai/core test -- src/parser.test.ts`
- Turbo 캐시 무효화: `pnpm turbo run build --force`
- pnpm 잠금 재생성: `rm pnpm-lock.yaml && pnpm install` (가능한 피할 것)

---

## 릴리즈 프로세스

릴리즈는 메인테이너만 수행합니다. 자세한 절차는 [RELEASING.md](./RELEASING.md).

요약:
1. main 에 머지된 changeset 이 쌓임
2. `changesets/action` 봇이 "Version Packages" PR 자동 생성
3. 메인테이너가 PR 리뷰 후 머지
4. `release.yml` 이 npm publish 실행

---

## 질문·피드백

- 일반 Q&A: [GitHub Discussions](https://github.com/terracelab/lore-ai/discussions)
- 비공개 보안 이슈: [SECURITY.md](./SECURITY.md)
- 기여자 채널: (추후 Discord 링크)

감사합니다. 여러분의 기여가 Lore AI 를 만듭니다. 🌱
