# 도메인 맵 (L1)

> 프로젝트 전체의 카테고리 지도. `lore.config.yaml` 의 `domains:` 와 일치시킬 것.

## 인증 (auth)

- profile · session · oauth

## 구독 (subscription)

- master · renewal · trial

> 새 도메인을 추가할 때:
>
> 1. `lore.config.yaml` 의 `domains:` 에 토큰을 등록
> 2. 본 문서에 1~2줄 설명 추가
> 3. 코드에 `@Domain: <token>` 주석을 달면 `lore sync` 가 자동으로 `.lore/flows/<token>.md` 생성
