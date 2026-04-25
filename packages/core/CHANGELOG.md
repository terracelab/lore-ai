# @lore-ai-automation/core

## 0.5.0

### Minor Changes

- [#16](https://github.com/terracelab/lore-ai/pull/16) [`aeccb5f`](https://github.com/terracelab/lore-ai/commit/aeccb5fa51032cc834a9c148cf2da55589058b21) Thanks [@kyong-dev](https://github.com/kyong-dev)! - 세 가지 보강:
  1. **`@Connection` 어노테이션 신규**: `FK / Writer / Reader / Caller / Server-only` 같은 심볼 간 연결을 multi-line bullet 으로 적으면 파서가 추출해 L3 의 `**Connection**` 블록으로 렌더링 — synthesize 의 "대표 플로우" / "관련 파일 인덱스" 섹션 1차 재료. 8번째 정식 태그.
  2. **`@History` 날짜 형식 완화**: `YYYY-MM-DD` 만 허용하던 regex 가 `YYYY` (연도 only) · `YYYY-MM` (연-월) 도 받도록 변경. 정확한 일자가 기억나지 않는 과거 사건도 기록 가능.
  3. **카테고리 아이콘 확장**: `pickIcon` 의 하드코딩 5개 매핑을 18개 도메인 키워드 (auth · user · subscription · payment · job · candidate · attendance · security · admin · monitoring · stock · community · content · marketing · api · infra ...) 로 확장 + 미매칭 슬러그는 안정적 해시 기반 fallback 풀 (📦 🧩 🔧 🧱 🗂️ 🧭 🔖 🧪 🧰 🗃️) 에서 선택해 모든 카테고리가 같은 📂 로 무너지던 문제 해결. `lore.config.yaml` 의 `domains.<key>.icon` 으로 명시 지정도 가능.

  L2 doctrine 도 9섹션 골격으로 확장 — `@History` 항목을 시간순 타임라인으로 모으는 "변경 이력" 섹션을 8번 자리에 추가하고, `@Connection` 의 텍스트가 4번 (대표 플로우) / 9번 (관련 파일 인덱스) 의 1차 재료라는 점을 명시.

## 0.4.0

### Minor Changes

- [#14](https://github.com/terracelab/lore-ai/pull/14) [`bdbfae8`](https://github.com/terracelab/lore-ai/commit/bdbfae8aca557906661d72aaa8f0aab9732fa4c5) Thanks [@kyong-dev](https://github.com/kyong-dev)! - `lore synthesize` 의 출력물을 평면 산문에서 8섹션 구조 (구성 파일·데이터 모델·엔드포인트·대표 플로우·권한 패턴·클라이언트 상태·정책·파일 인덱스) 로 강제. 표·ASCII ER 다이어그램·번호 단계 사용을 의무화하고 `⚠️` 마커로 정책 검토 필요 항목을 명시 분리. `--since <range>` 가 실제로 동작하도록 wiring — 카테고리 어노테이션이 위치한 디렉토리의 git log 를 자동 탐지된 git 루트에서 수집해 프롬프트에 함께 번들. 어노테이션 태그가 없어도 LLM 이 엔드포인트↔화면, 모델↔FK, task↔트리거, 컴포넌트↔hook↔API 같은 연결을 코드 단서로 추론하도록 지시 추가.

## 0.3.1

## 0.3.0

### Minor Changes

- [#9](https://github.com/terracelab/lore-ai/pull/9) [`f35e70a`](https://github.com/terracelab/lore-ai/commit/f35e70a84bb44ae6dfb312ae940563e4f4373810) Thanks [@kyong-dev](https://github.com/kyong-dev)! - `lore synthesize` 의 카테고리 인자가 선택사항으로 변경. 인자를 생략하면 모든 카테고리의 컨텍스트를 한 프롬프트에 묶어 출력하며, LLM 은 `=== FILE: .lore/flows/<slug>.md ===` 마커로 카테고리별 응답을 분리하거나 (Claude Code 등 에이전트 환경에서) 파일을 직접 갱신할 수 있다. 카테고리당 한 번씩 명령을 돌리던 v0 워크플로의 마찰을 제거.

## 0.2.0

## 0.1.0

### Minor Changes

- [`1c2d5a0`](https://github.com/terracelab/lore-ai/commit/1c2d5a0208e3d09be45e26dfb918bf6415481ab7) - Initial release scaffold:
  - `@lore-ai-automation/core` — config loader, regex annotation parser, checker, markdown synthesizer
  - `@lore-ai-automation/parser` — substantive-line detection (regex; tree-sitter planned for v1)
  - `lore-ai` (CLI) — `init / check / sync / synthesize / publish / chat` command skeletons
