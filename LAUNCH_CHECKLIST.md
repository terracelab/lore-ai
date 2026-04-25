# Lore AI 출시 체크리스트

> 코드가 `main` 에 머지된 시점부터 **첫 npm publish + 사이트 라이브** 까지를 시간 순서로 정리한 체크리스트.
>
> 참고 문서:
> - 전반 설계 → [OSS_RELEASE_PLAN.md](./OSS_RELEASE_PLAN.md)
> - GitHub · Vercel · npm 셋업 디테일 → [DEPLOYMENT.md](./DEPLOYMENT.md)
> - 릴리즈 자동화 흐름 → [RELEASING.md](./RELEASING.md)
>
> 본 문서는 위 셋의 **실행 순서**를 한 화면에 보여주는 **러닝북** 입니다. 각 Phase 끝에는 검증 명령이 있습니다.

---

## Phase 0 — 로컬 Dogfooding (publish 하기 전 필수)

> 목적: 코드 변경 없이 npm 에 올라갈 패키지가 **다른 실제 프로젝트에서** 의도대로 동작하는지 검증.

### 0.1 빌드

```bash
cd ~/dev/projects/lore-ai
pnpm install --frozen-lockfile
pnpm build           # turbo 가 모든 패키지 빌드
pnpm test
```

### 0.2 다른 프로젝트에서 사용 가능하게 만들기 — 3가지 방법

#### 방법 A — `pnpm link --global` (가장 빠름)

```bash
cd ~/dev/projects/lore-ai/packages/cli
pnpm link --global
# 어디서나 `lore` 사용 가능
lore --version
```

복원:

```bash
pnpm uninstall --global lore-ai
```

**장점**: 즉시 사용. 코드 수정 → 다시 `pnpm build` 만 하면 반영.
**단점**: 워크스페이스 의존성 (`workspace:*`) 이 그대로 노출 → 실제 npm 설치 시 안 보일 수 있는 문제 못 잡음.

#### 방법 B — `pnpm pack` (실제 npm 설치 흐름 재현 · 권장)

```bash
pnpm -r build
mkdir -p /tmp/lore-tarballs && rm -f /tmp/lore-tarballs/*

pnpm --filter @lore-ai-automation/core    pack --pack-destination /tmp/lore-tarballs
pnpm --filter @lore-ai-automation/parser  pack --pack-destination /tmp/lore-tarballs
pnpm --filter lore-ai          pack --pack-destination /tmp/lore-tarballs

ls /tmp/lore-tarballs
# lore-ai-0.0.0.tgz
# lore-ai-core-0.0.0.tgz
# lore-ai-parser-0.0.0.tgz
```

대상 프로젝트에서:

```bash
cd ~/dev/projects/airpoint-back

# 의존성 순서로 설치 (workspace:* 가 실제 .tgz 로 풀려야 함)
npm i -D /tmp/lore-tarballs/lore-ai-core-0.0.0.tgz
npm i -D /tmp/lore-tarballs/lore-ai-parser-0.0.0.tgz
npm i -D /tmp/lore-tarballs/lore-ai-0.0.0.tgz

npx lore --version
npx lore init --template django-expo
```

> ⚠ **`workspace:*` 주의**: `pnpm pack` 은 기본적으로 `workspace:*` 를 그대로 둡니다. publish 직전에는 `pnpm publish` 가 자동 치환하지만, `pack` 만으로는 안 됩니다. 검증 목적이라면 위처럼 **순서대로** 설치하면 됩니다.

**장점**: 실제 사용자가 `npm i` 했을 때와 거의 동일.
**단점**: 코드 수정마다 다시 pack → reinstall 반복.

#### 방법 C — `pnpm publish --dry-run`

```bash
pnpm --filter lore-ai     publish --dry-run --no-git-checks
pnpm --filter @lore-ai-automation/core    publish --dry-run --no-git-checks
pnpm --filter @lore-ai-automation/parser  publish --dry-run --no-git-checks
```

publish 직전 검증용. 실제 등록은 안 됨. 출력에서:

- `published files:` 목록 확인 → `dist/`, `templates/`, `README.md`, `LICENSE` 가 들어있어야 함
- `unpublished files:` 에 `src/`, `*.test.ts`, `tsup.config.ts` 등이 있는지 확인 (있으면 정상 — `files` 필드가 정확)

### 0.3 시나리오 — Airpoint 백엔드에서 검증

```bash
cd ~/dev/projects/airpoint-back

# 1. 초기화
lore init --template django-expo
# → lore.config.yaml · .lore/flows/ · .lore/DOMAIN_MAP.md 생성 확인

# 2. 실제 include 패턴 맞추기
$EDITOR lore.config.yaml
#   projects.server.include 를 airpoint 의 실제 경로로 (apps/**/views.py 등)
#   domains: 에 airpoint 의 13개 카테고리 등록

# 3. 검증
lore check apps/auth/views.py apps/subscription/views.py
# → 0 issues 또는 의미있는 에러 메시지

# 4. 동기화
lore sync
ls .lore/flows/
# → auth.md · subscription.md · signal.md ... · INDEX.md

# 5. 회귀 비교 (선택)
diff -ru .lore/flows/  ~/dev/projects/onboarding/lore-board/content/projects/airpoint/flows/
# → 기존 수동 작성본과 의미 차이가 큰가?

# 6. publish dry-run
lore publish --target ~/dev/projects/onboarding/lore-board --dry-run
# → 변경 예정 파일 목록 출력만, 실제 쓰기 없음
```

### 0.4 사이트 dogfood

```bash
# 별도 터미널 2개에서
pnpm --filter web  dev   # http://localhost:3000
pnpm --filter docs dev   # http://localhost:3001
```

체크 항목:
- 웹 — Hero/Features/Demo/CTA 모두 렌더, 다크 토글, "복사" 버튼, GitHub/npm/Docs 링크
- 도큐 — 사이드바 (`Getting Started` → `Concepts` → `CLI Reference` …), 검색창, 다크모드, `/cli/sync`·`/concepts/annotations` 같은 라우트 200

### 0.5 해결할 것 (있으면 publish 미루기)

- [ ] CLI 가 실제 워크스페이스에서 일관된 결과를 냄
- [ ] frontmatter 가 [reference/frontmatter](apps/docs/pages/reference/frontmatter.mdx) 와 1:1 일치
- [ ] 사이트의 모든 외부 링크 클릭 가능 (`https://docs.lore-ai.vercel.app` 등)
  → 아직 라이브 전이라 404 가 정상. publish 후 재확인 (Phase 5)
- [ ] `pnpm publish --dry-run` 출력에 의도하지 않은 파일이 없음

---

## Phase 1 — npm 이름 선점

### 1.1 가용성 확인

```bash
npm view lore-ai
npm view @lore-ai-automation/core
npm view @lore-ai-automation/parser
```

세 명령 모두 **`npm error 404`** 응답이어야 합니다. 누군가 가져갔다면 → [OSS_RELEASE_PLAN.md §10](./OSS_RELEASE_PLAN.md#10-열린-결정-v0-안에서-확정-필요) 의 대안 후보 (`@terracelab/lore-ai` 등) 검토.

### 1.2 (선택) npm Organization

scoped 패키지를 쓸 거면:

- <https://www.npmjs.com/org/create>
- Plan: **Free** (public 패키지만 publish 한다면 무료)
- 이름: `lore-ai` (이미 가져간 경우 `lore-ai-org`, `terracelab` 등)

> 본 프로젝트는 `lore-ai` (unscoped) + `@lore-ai-automation/core`, `@lore-ai-automation/parser` (scoped) 혼합. org 생성 필요.

### 1.3 Automation Token 발급

1. npmjs.com → 우상단 아바타 → **Access Tokens**
2. **Generate New Token** → **Classic Token** → **Automation**
3. 이름: `lore-ai-github-actions`
4. 토큰 값 복사 → 즉시 다음 단계 (한 번만 보임)

> Type 을 **Automation** 으로 골라야 2FA OTP 없이 CI 가 publish 가능. **Publish** 타입으로 만들면 OTP 요구로 자동화 실패.

---

## Phase 2 — GitHub 공개

### 2.1 리포 생성

<https://github.com/organizations/terracelab/repositories/new> (또는 개인 계정)

- Repository name: `lore-ai`
- Visibility: **Public**
- "Initialize with README/LICENSE/.gitignore" → 모두 **OFF** (이미 로컬에 있음)

### 2.2 첫 push

```bash
cd ~/dev/projects/lore-ai
git remote add origin git@github.com:terracelab/lore-ai.git
git push -u origin main
```

### 2.3 GitHub Secrets 등록

리포지토리 **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|------|-------|
| `NPM_TOKEN` | Phase 1.3 에서 발급한 Automation 토큰 |

`GITHUB_TOKEN` 은 자동 (별도 등록 불필요).

### 2.4 리포 설정

**Settings → General → Features**

- ✅ Issues
- ✅ **Discussions**
- ⬜ Wiki

**Settings → Code security and analysis** (전부 ON)

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Push protection

**Settings → Actions → General**

- Workflow permissions: **Read and write**
- ✅ "Allow GitHub Actions to create and approve pull requests"

**Settings → Branches → Add rule** (target: `main`)

- ✅ Require a pull request before merging
- ✅ Require status checks: `CI` (Phase 4 에서 첫 실행 후 선택 가능)
- ⬜ Allow force pushes

### 2.5 Discussions 카테고리 (옵션)

Discussions 탭 → ⚙ → 기본 카테고리에 추가:

- 💡 Ideas
- 🙋 Q&A
- 📣 Show and tell
- 🗳 Polls

---

## Phase 3 — Vercel 사이트 배포

### 3.1 `lore-ai-web` 프로젝트

1. <https://vercel.com/new>
2. **Import Git Repository** → `terracelab/lore-ai`
3. 프로젝트명: `lore-ai-web`
4. **Framework Preset**: Next.js
5. **Root Directory**: `apps/web`
6. **Build & Output Settings** → 다음 셋만 명시 (나머지는 default):
   - Install Command: `corepack enable && pnpm install --frozen-lockfile`
   - Build Command: `pnpm --filter web... build`
   - Output Directory: `apps/web/.next` (Vercel 이 자동 감지)
7. Deploy

### 3.2 `lore-ai-docs` 프로젝트

같은 절차로 한 번 더, 차이점만:

- 프로젝트명: `lore-ai-docs`
- Root Directory: `apps/docs`
- Build Command: `pnpm --filter docs... build`

### 3.3 도메인 alias

각 프로젝트 → Settings → Domains:

- `lore-ai-web`  → `lore-ai.vercel.app` 추가 (기본 alias 면 자동)
- `lore-ai-docs` → `docs.lore-ai.vercel.app` (또는 `lore-ai-docs.vercel.app`)

### 3.4 배포 검증

```bash
curl -I https://lore-ai.vercel.app
# HTTP/2 200

curl -I https://docs.lore-ai.vercel.app/getting-started/quickstart
# HTTP/2 200

curl -I https://docs.lore-ai.vercel.app/cli/sync
# HTTP/2 200
```

브라우저에서:

- 다크/라이트 토글
- "npm i -g lore-ai" 복사 버튼
- 도큐 사이드바 / 검색 / 모든 카테고리 라우트
- README 의 외부 링크 (`docs.lore-ai.vercel.app`, `github.com/terracelab/lore-ai`) 클릭 가능

---

## Phase 4 — 첫 npm publish

> 본 프로젝트는 첫 publish 도 자동입니다. `.changeset/first-release.md` 가 이미 커밋되어 있으므로 main push 한 번에 워크플로가 트리거됩니다.

### 4.1 첫 트리거 확인

Phase 2.2 에서 main 을 push 한 순간 `release.yml` 이 동작합니다.

- GitHub → Actions → **Release** 워크플로
- 첫 실행은 "Version Packages" PR 을 만듭니다 (publish 는 아직 안 함)

### 4.2 "Version Packages" PR 검토

봇이 자동 생성한 PR 의 변경 내용:

- `packages/*/package.json` 의 버전 → `0.1.0`
- `packages/*/CHANGELOG.md` 에 changeset 노트 누적
- `.changeset/first-release.md` 삭제

확인:

- [ ] 버전 번호가 의도된 SemVer 인가
- [ ] CHANGELOG 가 사람이 읽을 만한가
- [ ] CI 그린

**Squash and merge.**

### 4.3 publish 자동 실행

merge 직후 `release.yml` 이 다시 돕니다 — 이번엔 publish 단계까지:

- Actions → Release 의 "Create release PR or publish" job
- 마지막 단계 로그에 다음이 보여야 함:
  ```
  npm notice
  npm notice 📦  lore-ai@0.1.0
  npm notice
  + lore-ai@0.1.0
  + @lore-ai-automation/core@0.1.0
  + @lore-ai-automation/parser@0.1.0
  ```

### 4.4 검증

```bash
npm view lore-ai version           # 0.1.0
npm view @lore-ai-automation/core version     # 0.1.0
npm view @lore-ai-automation/parser version   # 0.1.0

# 글로벌 설치 (실제 사용자 흐름)
npm i -g lore-ai
lore --version                     # 0.1.0
which lore                         # 어딘가 .nvm/.../bin/lore

# 임시 디렉토리에서 init 시뮬레이션
mkdir /tmp/lore-test && cd /tmp/lore-test
lore init
ls -la lore.config.yaml .lore/
```

### 4.5 GitHub Release

`changesets/action` 이 자동으로:

- 태그: `lore-ai@0.1.0`, `@lore-ai-automation/core@0.1.0`, `@lore-ai-automation/parser@0.1.0`
- GitHub Release 페이지에 changelog 본문 노출

확인: <https://github.com/terracelab/lore-ai/releases>

---

## Phase 5 — Day 0 후속

### 5.1 README 배지 동작 확인

`README.md` 상단의 세 배지가 정상 렌더되는지:

- ![npm version](https://img.shields.io/npm/v/lore-ai.svg) — 0.1.0
- ![CI](https://github.com/terracelab/lore-ai/actions/workflows/ci.yml/badge.svg) — passing
- ![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)

깨졌다면 → `repository.url` · 슬러그 일치 확인.

### 5.2 첫 announcement (선택)

GitHub Discussions → **📣 Show and tell** → 새 토론:

```md
# Lore AI 0.1.0 alpha — released today 🎉

코드 옆에 적어두는 도메인 지식 (@Domain / @BusinessLogic / @History) 을
추출해 AI 에디터가 도메인 맥락을 이해하게 만드는 CLI 입니다.

- npm i -g lore-ai
- 5분 Quickstart: https://docs.lore-ai.vercel.app/getting-started/quickstart
- GitHub: https://github.com/terracelab/lore-ai

설계 배경 / 3-Layer 구조 / 데이터 아카이올로지 의 의미는 위 docs 에…

피드백 환영합니다.
```

### 5.3 외부 채널 (선택)

날짜·문구는 자유. 예시:

- **Show HN**: "Show HN: Lore AI — AI 가 읽는 비즈니스 로직 문서"
- **X/Threads**: 30초 GIF (`lore init → sync` 터미널) + 랜딩 링크
- **디스콰이엇 / Velog**: 한국어 블로그 포스트 1편 — "왜 만들었나"
- **Product Hunt**: 정식 1.0 시점이 더 적합 (alpha 는 PH 트래픽 받기 이름)

### 5.4 사용자 onboarding 모니터

- npm-stat 에서 다운로드 추적: <https://npm-stat.com/charts.html?package=lore-ai>
- GitHub Insights → Traffic
- Vercel Analytics → 사이트 방문

---

## Phase 6 — 후속 (선택, v0 이후)

| 항목 | 비용 | 시점 |
|------|------|------|
| 유료 도메인 (`lore-ai.dev` 등) | ~₩15,000/년 | Product Hunt 론칭 직전 |
| Discord 커뮤니티 서버 | $0 | ⭐ 200+ 또는 외부 채택 3건 이상 |
| Algolia DocSearch (Pagefind 대체) | $0 (OSS 무료 신청) | 도큐 페이지 50+ |
| Open Collective | $0 | 후원 의사 표시 받았을 때 |
| MCP 서버 (`packages/mcp`) 출시 | — | v1 (Phase F) |
| 셀프호스트 dashboard (`packages/dashboard`) | — | v1 (Phase F) |

---

## 트러블슈팅

### "Tag already exists" (release.yml 실패)

이전 publish 가 부분 성공한 흔적입니다.

```bash
git tag -d lore-ai@0.1.0
git push --delete origin lore-ai@0.1.0
# (다른 패키지 태그도 동일)

# main 에 빈 커밋으로 재트리거
git commit --allow-empty -m "chore: re-trigger release"
git push
```

### "402 Payment Required" on publish

scoped 패키지 (`@lore-ai-automation/*`) 가 publishConfig 없이 publish 시도된 경우. 확인:

```bash
cat packages/core/package.json | grep -A2 publishConfig
# "publishConfig": { "access": "public", "provenance": true }
```

이미 셋팅되어 있어야 함 (스캐폴드 시 추가됨).

### Vercel "ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE"

로컬에서 `pnpm-lock.yaml` 이 커밋 안 된 상태입니다.

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: lockfile"
git push
```

### Vercel "pnpm: command not found"

Install Command 를 다음으로 명시:

```
corepack enable && pnpm install --frozen-lockfile
```

### "Version Packages" PR 이 안 열림

- `release.yml` 의 `permissions:` 블록 확인 (`contents: write`, `pull-requests: write`)
- Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests" ✅
- `NPM_TOKEN` 시크릿 누락 시 publish 단계만 실패해도 PR 단계는 동작해야 정상

### `lore-ai` 가 npm 에 이미 존재

[OSS_RELEASE_PLAN.md §10](./OSS_RELEASE_PLAN.md#10-열린-결정-v0-안에서-확정-필요) 의 대안:

- `@terracelab/lore-ai`
- `@<your-username>/lore-ai`
- `lore-cli`, `lore-doc` 등

이름을 바꾸면 다음 일괄 치환:

```bash
# 모든 package.json 의 name
# 모든 README · 도큐의 npm 링크
# 사이트 (apps/web/src/components/Hero.tsx 등) 의 명령어 예시
```

---

## 한 줄 요약

```
Phase 0 (dogfood)
  → Phase 1 (npm 이름)
    → Phase 2 (GitHub push + Secret)
      → Phase 3 (Vercel 두 프로젝트)
        → Phase 4 (Version PR merge → publish 자동)
          → Phase 5 (배지 · announcement)
```

각 Phase 의 검증을 모두 통과해야 다음 단계로 넘어갑니다. 막히면 [DEPLOYMENT.md](./DEPLOYMENT.md) 의 동일 섹션이 더 자세한 설명을 담고 있습니다.

---

**다음 액션 (지금 바로 할 일)**

```bash
# 1. dogfood
cd ~/dev/projects/lore-ai
pnpm install --frozen-lockfile
pnpm build
cd packages/cli && pnpm link --global
cd ~/dev/projects/airpoint-back   # 또는 임의의 다른 프로젝트
lore init && lore check $(git ls-files '*.py' | head -5)

# 2. npm 이름
npm view lore-ai @lore-ai-automation/core @lore-ai-automation/parser

# 3. 문제 없으면 → Phase 2 로 진행
```
