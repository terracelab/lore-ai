---
'lore-ai': patch
'@lore-ai-automation/core': patch
---

`@Domain` 토큰의 한국어 라벨 지원.

`@Domain: 인증 / 프로필 메뉴 (Client Component)` 같이 **한국어 라벨 + `/` 주변 공백 + 끝의 카테고리 힌트 괄호** 가 포함된 토큰이 전부 `unknown-domain` 으로 떨어지던 문제 해결. 본 프로젝트의 `domains:` 를 영어 key + 한국어 label 로 유지하면서 코드에서 한국어로 적은 토큰도 정상 매칭됩니다.

## 신규 export (`@lore-ai-automation/core`)

- `parseDomainToken(token)` — `head` / `sub` 추출 + `/` 주변 trim + 끝 `(...)` 힌트 제거
- `resolveDomainSlug(head, domains)` — 영어 key 매칭 실패 시 `domain.label` 로 fallback

## 시그니처 변경

- `groupByCategory(annotations, domains?)` — domain config 를 받으면 한국어 라벨 토큰을 영어 slug 버킷으로 자동 정규화 (legacy 호출도 호환).

## 정책: 빈 subdomains = head-only namespace

`domains.<slug>.subdomains` 가 **빈 배열** (`[]`) 이면 sub 검증을 OFF 한다 — head 만 검증하고 sub 는 자유 phrase 허용. 이는 컴포넌트/훅 라벨 같은 자유 한국어 phrase 를 코드에 두면서 도메인 등록은 config 에 유지하기 위한 정책. subdomains 가 비어 있지 않으면 기존대로 strict 하게 검증한다.

```yaml
# 예시
domains:
  auth:
    label: 인증
    subdomains: [] # ← 자유 phrase 모드: @Domain: 인증/임의 한국어 라벨 모두 허용
  signal:
    label: 시그널
    subdomains: [talk, pick] # ← strict 모드: 등록된 sub 만 허용
```

## 적용 범위

- `lore check` — `unknown-domain` 오탐 제거
- `lore sync` — 한국어 토큰도 올바른 카테고리 draft 로 분류
- `lore synthesize` / `lore review` — 카테고리 인자(`auth`)로 한국어 토큰 가진 심볼들도 한꺼번에 묶임

예전엔 코드에 `@Domain: auth/profile` 만 써야 했는데, 이제 `@Domain: 인증 / 프로필 메뉴 (Client Component)` 도 똑같이 동작.
