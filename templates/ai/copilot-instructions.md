# Copilot · Cursor · Claude Code 공통 지시 사항

이 워크스페이스는 [Lore AI](https://lore-ai.vercel.app) 어노테이션을 사용합니다.
**아래 7개 태그만** 사용하고 다른 이름은 만들지 마세요.

## 정식 태그

| 태그             | 등급        | 형식                                      |
| ---------------- | ----------- | ----------------------------------------- |
| `@Domain`        | **필수**    | `<token>` 또는 `<token>/<sub>` (`,` 다중) |
| `@BusinessLogic` | **필수**    | 한 줄 요약 (60자 권장)                    |
| `@History`       | 조건부 필수 | `- YYYY-MM-DD: <변경> (백필 여부)`        |
| `@Context`       | 선택        | 의사결정 배경                             |
| `@Flow`          | 선택        | flow id (`,` 다중)                        |
| `@MigratedFrom`  | 선택        | 이전 위치                                 |
| `@SeeAlso`       | 선택        | 관련 심볼 (`,` 다중)                      |

**금지**: `@lore-*`, `@logic`, `@no-side-effects`, `@since`, `@deprecated`, `@author`
또는 다른 어떤 자가 발명 태그도 만들지 마세요. 필요한 정보는 위 7개 안에서
자연어로 표현합니다.

## 도메인 토큰

`lore.config.yaml` 의 `domains:` 에 등록된 토큰만 사용. 신규 토큰이 필요하면
먼저 `domains:` 에 추가 제안 후 PR.

## `@History` 가 필요한 경우

데이터 의미 변경 (NULL 정책, ENUM 추가/제거, 기본값 변경, 임계값 변경, 백필 없는
마이그레이션). 백필 여부를 반드시 명시.

## 형식 예시

```python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일 (백필 없음)
    """
```

```tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 표기
 */
export default function ProfileCard({ userInfo }: Props) { ... }
```

## 코드 변경 후

`lore check $(git diff --cached --name-only)` 로 즉시 검증. 누락이 있으면
**같은 응답 안에서** 수정.

## 자세한 스펙

전체 규칙: <https://lore-ai-docs.vercel.app/concepts/annotations>
강한 가드레일 (Claude Code hooks): <https://lore-ai-docs.vercel.app/guides/ai-harness>
