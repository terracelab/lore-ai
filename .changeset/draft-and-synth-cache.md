---
'lore-ai': minor
'@lore-ai-automation/core': minor
---

`sync` / `synthesize` 파이프라인 분리 + 변경 감지 + 보고서 포맷 프롬프트.

**1. 폴더 분리** — 기존엔 `sync` 도 `synthesize` 도 같은 `.lore/flows/` 를 덮어써서, 코드 변경이 없어도 `synthesize` 를 돌릴 때마다 LLM 비용을 들여 전체 카테고리를 재작성하는 문제가 있었다. 이제:

- `sync` 는 `.lore/draft/<slug>.md` 에 **원천 L3 사실** 만 기록 (기계 생성, 매번 덮어쓰기 OK).
- `synthesize` 는 `.lore/flows/<slug>.md` 에 **사람이 읽는 L2 보고서** 를 만든다 (`publish` · `chat` 가 읽는 곳).
- `INDEX.md` 는 카테고리 메타만 담으므로 계속 `flows/` 에 위치.

**2. 변경 감지 캐시** — `synthesize` 는 카테고리별로 어노테이션 집합의 정규화된 sha256 해시를 계산해 `.lore/.synth-cache/<slug>.json` 과 비교한다. 해시가 같고 flow 파일이 존재하면 그 카테고리는 프롬프트에서 빼고 스킵한다 (LLM 호출 비용 절약). `--force` 플래그로 캐시 무시 가능. 캐시는 프롬프트 emit 시점에 낙관적으로 갱신되며, 사용자 / LLM 이 실제로 flow 파일을 쓰지 않으면 다음 실행에서 자동 회복 (`flowFileExists` 게이트).

**3. 보고서 포맷 프롬프트** — `synthesize` 가 만들어내는 문서가 평면 산문에서 **시각 보고서** 로 바뀐다:

- 상단 📊 한눈에 보기 메트릭 카드 (파일 수 · 엔드포인트 · 모델 · 🟡/🔴 정책 카운트 · 최근 변경일)
- §2 ER 다이어그램 / §4 대표 플로우는 **Mermaid (`erDiagram` · `flowchart`) 우선**, ASCII 폴백
- §3 엔드포인트 표에 권한 배지 컬럼 (🔓 public · 🔒 auth · 🛡️ admin · 💳 paid · 🤖 internal)
- §7 정책은 분류 (🟢 확정 · 🟡 확인 필요 · 🔴 TBD) + 위험도 (🔥 / 🟧 / 🟩) 통합 표
- §8 변경 이력 각 행에 변경 분류 배지 (🆕 / 🔄 / 🗑 / 🔐 / 💳 / 📜 / 🐛)
- 프롬프트가 명시적으로 "기존 본문이 이미 보고서 포맷이면 변경된 행 / 단계만 부분 갱신" 을 지시 — 변경 없는 섹션은 보존.

**4. 설정 신규 필드** (모두 기본값 있음, 기존 사용자 무중단):

```text
flows:
  dir: ./.lore/flows                # synthesize 출력 (사람용 보고서)
  draftDir: ./.lore/draft           # sync 출력 (원천 L3)
  cacheDir: ./.lore/.synth-cache    # 카테고리별 해시 매니페스트
  indexFile: INDEX.md
```

**Migration**: 기존 `.lore/flows/*.md` 는 그대로 두고, 다음 `lore sync` 가 새로 `.lore/draft/` 를 채운다. 첫 `lore synthesize` 는 캐시가 비어있으므로 모든 카테고리를 한 번 재합성하고, 이후부터는 변경된 카테고리만 다룬다.
