# Copilot / Claude Code instructions

이 워크스페이스는 [Lore AI](https://lore-ai.vercel.app) 로 비즈니스 로직을 문서화합니다. 코드 생성·수정 시 다음을 항상 따릅니다.

## 필수 행동

1. **`.lore/flows/*.md` 와 `.lore/DOMAIN_MAP.md` 를 먼저 읽어** 도메인 모델을 파악할 것.
2. 새 비즈니스 로직 함수/클래스를 추가할 때는 **`@Domain` + `@BusinessLogic`** 주석을 반드시 함께 작성.
3. 데이터 의미가 바뀌는 변경(ENUM 추가/제거, NULL 정책 변경, 기본값 교체 등)은 **`@History`** 항목을 추가.
4. 도메인 토큰은 `lore.config.yaml` 의 `domains:` 에 등록된 것만 사용.

## 어노테이션 예시

```python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일
    """
```

```tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 표기
 */
```

## 코드 변경 후

- `lore check $(git diff --cached --name-only)` 로 검증
- 의미가 큰 변경이면 `lore sync` 후 `.lore/flows/` diff 도 함께 커밋
