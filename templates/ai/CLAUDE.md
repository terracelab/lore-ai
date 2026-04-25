# Lore AI 어노테이션 규칙 — 워크스페이스 강제

이 워크스페이스는 [Lore AI](https://lore-ai.vercel.app) 어노테이션을 사용합니다.
새/수정되는 비즈니스 로직 코드 (모델·뷰·서비스·핸들러·React 컴포넌트 등) 는
**아래 7개 태그만** 사용해야 합니다. **다른 이름은 절대 만들지 마세요.**

## 정식 태그 (이 7개만 허용)

| 태그 | 등급 | 형식 | 예시 |
|------|------|------|------|
| `@Domain` | **필수** | `<token>` 또는 `<token>/<sub>` (`,` 다중) | `@Domain: subscription/master` |
| `@BusinessLogic` | **필수** | 한 줄 (60자 권장) | `@BusinessLogic: valid_until 지나면 is_active=False` |
| `@History` | **조건부 필수** | `- YYYY-MM-DD: <변경> (백필 여부)` 다중 | `@History:`<br/>`  - 2024-03-15: trial 7일 → 14일` |
| `@Context` | 선택 | 의사결정 배경 한 줄 | `@Context: trial 후 자동 결제 실패 시 3일 grace` |
| `@Flow` | 선택 | flow id (`,` 다중) | `@Flow: auto-renewal, grace-period` |
| `@MigratedFrom` | 선택 | 이전 위치/이름 | `@MigratedFrom: legacy.PaymentService` |
| `@SeeAlso` | 선택 | 관련 심볼 (`,` 다중) | `@SeeAlso: SubscriptionRenewer, NotifyService` |

**위 7개 외의 태그 (`@lore-*`, `@logic`, `@no-side-effects`, `@since`, `@deprecated`,
`@author` 등) 를 직접 만들거나 다른 시스템의 관습을 가져오지 마세요.**
필요한 정보는 위 7개 안에서 자연어로 표현합니다.

## `@Domain` 토큰 사용 규칙

1. `lore.config.yaml` 의 `domains:` 에 등록된 토큰만 사용. 새 토큰이 필요하면
   먼저 `domains:` 에 추가 제안 (코드 변경 PR 과 함께).
2. `<token>` 또는 `<token>/<subtoken>` 형식. subtoken 은 카테고리 안의 의미 분류.
3. 한 심볼이 여러 도메인을 다루면 쉼표로: `@Domain: subscription/master, notification/trigger`

## `@History` 가 필요한 경우 (조건부 필수)

추가하세요:
- 컬럼의 NULL 정책 변경
- ENUM/Choice 값 추가/제거/리네임
- 기본값 변경 (신규/구 row 의미가 달라짐)
- 비즈니스 임계값 변경 (trial 일수, grace 기간 등)
- **백필 없는** 마이그레이션

스킵 가능:
- 순수 리팩토링·이름 변경·성능 개선
- 의미 변화 없는 인덱스 추가

형식:
```python
@History:
  - 2024-03-15: trial 7일 → 14일 (이전 가입자는 7일 기준, 백필 없음)
  - 2024-11-02: valid_until NOT NULL 강제 (migration 0042)
```

**백필 여부를 반드시 명시.** ("백필 없음" / "전체 백필" / "조건부 백필: <조건>")

## 형식 예시

### Python (Django) — docstring

```python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False, Celery 자동 갱신
    @Context: trial 후 결제 실패 시 3일 grace 제공 (CS 요청 #1203)
    @History:
      - 2024-03-15: trial 7일 → 14일 (백필 없음)
    @Flow: auto-renewal, grace-period
    """
```

### Python — APIView / function

```python
class CandidateQuestionsAPIView(APIView):
    """
    @Domain: chat/question
    @BusinessLogic: is_active=True 질문만 question_order ASC 로 반환
    @Flow: chat-prequestions
    """
```

### TypeScript (React / RN) — JSDoc

```tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 + 투자 성향 뱃지 표기
 * @Flow profile-display
 */
export default function ProfileCard({ userInfo }: Props) { ... }
```

### TypeScript — 함수 / 훅

```ts
/**
 * @Domain notification/delivery
 * @BusinessLogic FCM 토큰 만료 시 silent refresh, 실패 3회면 토큰 무효화
 * @History
 *   - 2025-08-12: 재시도 5회 → 3회 (서버 부하 이슈)
 */
export async function refreshPushToken() { ... }
```

## 절대 금지

- ❌ 7개 외의 태그 명 (`@lore-*`, `@logic`, `@no-side-effects` 등 자가 발명)
- ❌ 등록되지 않은 도메인 토큰 (`lore.config.yaml` 에 없는 값)
- ❌ `@History` 누락한 의미 변경 PR (조건부 필수)
- ❌ `@BusinessLogic` 의 멀티-라인 (한 줄 요약. 길어지면 `@Context` 분리)
- ❌ 한국어 / 영어 혼용 일관성 없음 (한 파일 안에서는 한 언어 통일)

## 편집 워크플로

1. 비즈니스 로직 파일 수정 전, 관련 `.lore/flows/<카테고리>.md` 를 먼저 읽기
2. 새 비즈니스 함수/모델/엔드포인트 추가 시 위 형식 그대로 주석 작성
3. 데이터 의미 변경이면 `@History` 추가
4. 편집 후 즉시 (사용자 응답 *전*) 검증:
   ```bash
   lore check <편집한 파일>
   ```
5. 의미가 큰 변경이면 `lore sync` 후 변경된 `.lore/flows/` 도 커밋 후보에 포함

## 참고

- 전체 스펙: <https://docs.lore-ai.vercel.app/concepts/annotations>
- 데이터 아카이올로지 (`@History` 깊이): <https://docs.lore-ai.vercel.app/concepts/data-archaeology>
- 가드레일 셋업 (Hook): <https://docs.lore-ai.vercel.app/guides/ai-harness>
