---
'lore-ai': patch
'@lore-ai-automation/core': patch
---

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
