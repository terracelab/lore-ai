<div align="center">

# Lore AI

**Living business-logic documentation for AI-assisted dev teams.**

코드 옆에 도메인 지식을 적어두면, AI 가 읽는다.

[Website](https://lore-ai.vercel.app) · [Documentation](https://docs.lore-ai.vercel.app) · [npm](https://www.npmjs.com/package/lore-ai) · [Discussions](https://github.com/terracelab/lore-ai/discussions)

[![npm version](https://img.shields.io/npm/v/lore-ai.svg)](https://www.npmjs.com/package/lore-ai)
[![CI](https://github.com/terracelab/lore-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/terracelab/lore-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](./LICENSE)

</div>

---

## What is Lore AI?

Lore AI 는 코드에 박힌 **비즈니스 로직 주석 (@Domain, @BusinessLogic, @History ...)** 을 추출해 AI 코드 에디터 (Claude Code, Copilot, Cursor) 가 **도메인 맥락과 함께** 코드를 이해하게 만드는 CLI + 패키지다.

- **3-Layer 문서 구조**: L1 지도 · L2 서사 · L3 팩트
- **Data Archaeology**: `@History` 태그로 과거 DB 행의 의미를 보존
- **AI 통합**: MCP 서버 · Copilot instruction 파일 · Cursor rules 자동 생성
- **프로젝트 독립**: Django · React / RN Expo · Next.js · 기타 TS 어디서나

## 30초 데모

```bash
# 1. 설치
npm i -g lore-ai

# 2. 프로젝트에 초기화
cd my-project
lore init

# 3. 코드에 주석 추가
#   @Domain: subscription/master
#   @BusinessLogic: valid_until 지나면 is_active=False

# 4. 문서 생성 → AI 가 읽는다
lore sync
```

자세한 내용은 **[Getting Started](https://docs.lore-ai.vercel.app/getting-started/quickstart)** 를 참고하세요.

## 설치

```bash
# 전역 설치 (권장)
npm i -g lore-ai

# 또는 dev dependency
pnpm add -D lore-ai
```

Node.js 18.18+ 필요.

## 핵심 커맨드

| 커맨드                  | 목적                              |
| ----------------------- | --------------------------------- |
| `lore init`             | `lore.config.yaml` 생성 + 훅 설치 |
| `lore check [files...]` | precommit 주석 검증               |
| `lore sync`             | 코드 스캔 → L2/L3 마크다운 생성   |
| `lore synthesize <cat>` | LLM 으로 L2 flow 재구성           |
| `lore publish`          | Lore Board 에 문서 동기화         |
| `lore chat`             | 로컬 RAG Q&A                      |

전체 레퍼런스는 **[CLI Docs](https://docs.lore-ai.vercel.app/cli/init)** 참고.

## 어노테이션 예시

**Python (Django)**

```python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일
      - 2024-11-02: valid_until NOT NULL 강제
    """
```

**TypeScript (React / RN)**

```tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 뱃지 표기
 */
export default function ProfileCard({ userInfo }: Props) { ... }
```

[Annotation Spec →](https://docs.lore-ai.vercel.app/concepts/annotations)

## 모노레포 구조

```
lore-ai/
├── apps/
│   ├── web/          # 브랜딩 사이트
│   └── docs/         # 도큐멘테이션 (Nextra)
├── packages/
│   ├── core/         # 파서·체커·마크다운 빌더
│   ├── parser/       # tree-sitter 래퍼
│   └── cli/          # `lore` CLI
├── templates/        # `lore init` 템플릿
└── examples/         # django-expo · nextjs
```

## 기여하기

PR, 이슈, 아이디어 환영. 시작하기 전에 **[CONTRIBUTING.md](./CONTRIBUTING.md)** 를 읽어주세요.

- 로컬 개발: `pnpm install && pnpm build && pnpm test`
- 버전 노트: `pnpm changeset` 으로 변경 기록 추가
- 행동 규범: [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md)

## 로드맵

- **v0** (현재): `init / check / sync / synthesize / publish` 5개 커맨드
- **v1**: MCP 서버 · 셀프호스트 대시보드 · 다국어 도큐
- **v2**: RBAC · CI 자동 publish · 핸드북 자동화

상세 계획은 [LORE_AI_PACKAGING.md](./LORE_AI_PACKAGING.md) · [OSS_RELEASE_PLAN.md](./OSS_RELEASE_PLAN.md).

## 라이선스

[MIT](./LICENSE) © 2026 Terracelab

## 커뮤니티

- [GitHub Discussions](https://github.com/terracelab/lore-ai/discussions) — 아이디어·Q&A·Show and tell
- 버그 제보: [Issues](https://github.com/terracelab/lore-ai/issues)
- 보안 취약점: [SECURITY.md](./SECURITY.md)

---

<div align="center">
<sub>Made with care by <a href="https://terracelab.co.kr">Terracelab</a>.</sub>
</div>
