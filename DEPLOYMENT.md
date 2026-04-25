# 배포 러닝북 — Lore AI

> 사이트(랜딩·도큐)·npm 패키지·GitHub repo 를 **무료**로 운영하는 전체 절차.

본 문서는 일회성 셋업과 일상 운영을 모두 다룹니다. 첫 셋업은 §1, §2 만 따르면 끝입니다.

---

## 1. GitHub 리포지토리

### 1.1 리포 생성

1. <https://github.com/organizations/terracelab/repositories/new> (또는 개인 계정)
2. Name: `lore-ai`
3. Visibility: **Public**
4. "Initialize with README/LICENSE" 모두 **OFF** (이미 로컬에 있음)

### 1.2 첫 push

```bash
git remote add origin git@github.com:terracelab/lore-ai.git
git branch -M main
git push -u origin main
```

### 1.3 리포 설정 (Settings)

- **General → Features**:
  - Issues ✅
  - Discussions ✅
  - Projects (선택)
  - Wiki ❌
- **Code security and analysis**:
  - Dependency graph ✅
  - Dependabot alerts ✅
  - Dependabot security updates ✅
  - Secret scanning ✅
  - Push protection ✅
- **Actions → General**:
  - Workflow permissions: **Read and write**
  - "Allow GitHub Actions to create and approve pull requests" ✅
- **Branches**: `main` 보호 규칙
  - Require PR before merging ✅
  - Require status checks (CI) ✅
  - Allow force pushes ❌

### 1.4 시크릿

- `Settings → Secrets and variables → Actions → New secret`
  - `NPM_TOKEN` — npmjs.com 의 _Automation_ 타입 토큰

GitHub Token 은 자동 (`secrets.GITHUB_TOKEN`).

---

## 2. Vercel (사이트 2개)

### 2.1 첫 프로젝트 — 랜딩

1. <https://vercel.com/new> → GitHub repo `terracelab/lore-ai` 선택
2. **Project Name**: `lore-ai-web`
3. **Framework Preset**: Next.js
4. **Root Directory**: `apps/web`
5. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter web build`
   - 또는 Vercel 의 monorepo 자동 감지 사용
6. **Output Directory**: `apps/web/.next`
7. **Environment Variables**: 없음 (정적)

배포 후 `lore-ai-web.vercel.app` 또는 `lore-ai.vercel.app` 으로 도메인 alias 설정.

### 2.2 두 번째 프로젝트 — 도큐

1. 같은 절차로 새 프로젝트 생성
2. **Project Name**: `lore-ai-docs`
3. **Root Directory**: `apps/docs`
4. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter docs build`
5. 도메인: `docs.lore-ai.vercel.app` alias

### 2.3 (선택) 커스텀 도메인

향후 `lore-ai.dev` 등 유료 도메인 구입 시:

- Vercel 프로젝트 → Settings → Domains 에서 추가
- DNS 는 Vercel 의 nameserver 사용 권장 (CNAME 보다 안정)

---

## 3. npm 계정

### 3.1 패키지 이름 선점 확인

```bash
npm view lore-ai
npm view @lore-ai-automation/core
npm view @lore-ai-automation/parser
```

세 명령 모두 `404` 가 떠야 합니다. 누군가 이미 가져갔다면 `OSS_RELEASE_PLAN.md §10` 의 대안 이름 후보를 재검토.

### 3.2 organization (선택)

- `npm` 의 무료 org 가 필요하면: <https://www.npmjs.com/org/create> → org name `lore-ai` (이미 가져간 경우 `lore-ai-org` 등)
- public 패키지만 publish 한다면 org 무료

### 3.3 Automation Token

1. `npmjs.com → Profile → Access Tokens → Generate New Token`
2. Type: **Automation** (2FA 우회용 — CI 전용)
3. 이름: `lore-ai-github-actions`
4. 토큰 값 → GitHub Secrets `NPM_TOKEN`

---

## 4. 일상 운영

### 4.1 새 PR

기여자는 항상 `pnpm changeset` 을 함께 추가합니다 ([RELEASING.md](./RELEASING.md) 참고).

### 4.2 사이트 업데이트

`apps/web` 또는 `apps/docs` 변경이 머지되면 Vercel 이 자동 빌드·배포 (PR 마다 프리뷰 URL 자동 생성).

### 4.3 패키지 릴리즈

자동입니다. main 푸시 → 봇이 "Version Packages" PR 생성 → 메인테이너가 머지 → npm publish.

### 4.4 hotfix

치명적 버그가 main 에 들어간 경우:

1. 패치 PR (작게)
2. `pnpm changeset` 에서 patch 선택
3. main 머지 → 자동 publish

---

## 5. 모니터링 (무료)

| 대상          | 도구                               | URL                                      |
| ------------- | ---------------------------------- | ---------------------------------------- |
| GitHub        | 자체 (Insights · Dependency graph) | repo                                     |
| npm 다운로드  | npm-stat                           | npm-stat.com/charts.html?package=lore-ai |
| 사이트 트래픽 | Vercel Web Analytics (Hobby 무료)  | Vercel dashboard                         |
| 빌드 상태     | Vercel + GitHub Actions            | repo Actions 탭                          |
| 보안 advisory | GitHub Security (자동)             | repo Security 탭                         |

---

## 6. 비용 0 보장 체크리스트

- [ ] GitHub repo public (private 으로 만들면 Actions 분 한도)
- [ ] npm 패키지 public (`publishConfig.access: public`)
- [ ] Vercel 프로젝트 personal 계정 (Team Pro 로 자동 업그레이드 안 됨 — 명시적으로 Hobby 유지)
- [ ] 사이트 트래픽 100 GB/mo, 빌드 6000 분/mo 한도 확인 (Hobby)
- [ ] 도메인 미사용 (`*.vercel.app` 으로 시작)

100% 무료로 시작 가능, Product Hunt / HN 트래픽 스파이크 정도는 문제 없습니다.

---

## 7. 트러블슈팅

### 7.1 Vercel 모노레포 빌드 실패

**증상**: `pnpm: command not found` 또는 `lockfile mismatch`

**해결**: Vercel 의 _Install Command_ 를:

```bash
corepack enable && pnpm install --frozen-lockfile
```

### 7.2 changesets bot PR 이 안 생김

- `permissions: contents: write, pull-requests: write` 가 워크플로에 있는지 확인
- Actions 설정에서 "Allow GitHub Actions to create and approve pull requests" 가 켜졌는지 확인

### 7.3 npm publish 가 401

- `NPM_TOKEN` 이 _Automation_ 타입인지 (Publish 타입은 OTP 요구)
- 토큰의 scope 가 `lore-ai`, `@lore-ai-automation/*` 를 포함하는지

### 7.4 Pagefind 검색 빈 결과

- `apps/docs` 의 `next build` 후 `pagefind` 가 `.next/server/app` 을 인덱싱했는지 확인
- Nextra 3 의 내장 search 가 켜져 있는지 (`search: { codeblocks: false }`)

---

## 8. 다음 단계 (필요 시)

- 유료 도메인 (`lore-ai.dev` 등)
- 커뮤니티 Discord 서버 (무료 — Server Boost 불필요)
- Algolia DocSearch (OSS 무료 신청)
- Open Collective 후원 받기
