---
'lore-ai': minor
'@lore-ai-automation/core': minor
---

세 가지 보강:

1. **`@Connection` 어노테이션 신규**: `FK / Writer / Reader / Caller / Server-only` 같은 심볼 간 연결을 multi-line bullet 으로 적으면 파서가 추출해 L3 의 `**Connection**` 블록으로 렌더링 — synthesize 의 "대표 플로우" / "관련 파일 인덱스" 섹션 1차 재료. 8번째 정식 태그.
2. **`@History` 날짜 형식 완화**: `YYYY-MM-DD` 만 허용하던 regex 가 `YYYY` (연도 only) · `YYYY-MM` (연-월) 도 받도록 변경. 정확한 일자가 기억나지 않는 과거 사건도 기록 가능.
3. **카테고리 아이콘 확장**: `pickIcon` 의 하드코딩 5개 매핑을 18개 도메인 키워드 (auth · user · subscription · payment · job · candidate · attendance · security · admin · monitoring · stock · community · content · marketing · api · infra ...) 로 확장 + 미매칭 슬러그는 안정적 해시 기반 fallback 풀 (📦 🧩 🔧 🧱 🗂️ 🧭 🔖 🧪 🧰 🗃️) 에서 선택해 모든 카테고리가 같은 📂 로 무너지던 문제 해결. `lore.config.yaml` 의 `domains.<key>.icon` 으로 명시 지정도 가능.

L2 doctrine 도 9섹션 골격으로 확장 — `@History` 항목을 시간순 타임라인으로 모으는 "변경 이력" 섹션을 8번 자리에 추가하고, `@Connection` 의 텍스트가 4번 (대표 플로우) / 9번 (관련 파일 인덱스) 의 1차 재료라는 점을 명시.
