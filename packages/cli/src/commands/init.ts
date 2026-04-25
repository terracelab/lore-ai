import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../util/log.js';

interface InitOptions {
  template?: string;
  yes?: boolean;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolve(__dirname, '..', '..', 'templates');

const SEED_CONFIG = `version: 1

projects:
  server:
    root: ./
    language: python
    include:
      - "**/views.py"
      - "**/views/**/*.py"
      - "**/models.py"
      - "**/models/**/*.py"
      - "**/services.py"
      - "**/services/**/*.py"
      - "**/tasks.py"
      - "**/tasks/**/*.py"
    exclude:
      - "**/__init__.py"
      - "**/tests.py"
      - "**/tests/**"
      - "**/migrations/**"
      - "**/admin.py"
      - "**/admins/**"

domains: {}
  # 비워두고 \`lore bootstrap\` 으로 자동 채우거나 직접 추가:
  # auth:
  #   label: 인증
  #   subdomains: [profile, session]

flows:
  dir: ./.lore/flows
  indexFile: INDEX.md

extract:
  requireDomain: true
  requireBusinessLogic: true
  requireHistoryOnDataChange: warn
  minSubstantiveLines: 5

llm:
  provider: anthropic
  model: claude-opus-4-7
  apiKeyEnv: ANTHROPIC_API_KEY
  temperature: 0.3
`;

const SEED_DOMAIN_MAP = `# 도메인 맵 (L1)

> 프로젝트 전체의 카테고리 지도. \`lore.config.yaml\` 의 \`domains:\` 와 일치 유지.
>
> 비어있다면 \`lore bootstrap\` 으로 자동 채워보세요 (코드 폴더 구조 기반 초안).

<!-- bootstrap 후 다음 형식으로 채워집니다:
## 인증 (auth)
인증·세션 관리 도메인.
- profile · session · oauth
-->
`;

const SEED_COMMANDS_MD = `# Lore AI — 사용 명령어 가이드

> 이 워크스페이스에 Lore AI 가 셋업됐습니다. 자주 쓰는 명령과 어노테이션 규격을
> 한 화면에 정리. 자세한 내용은 <https://docs.lore-ai.vercel.app>

## 5단계 흐름

\`\`\`text
lore init       ← config + .lore/ 생성  (이미 완료)
   ↓
lore bootstrap  ← 코드에서 도메인 맵 초안 자동 작성
   ↓
어노테이션 작성  (사람 또는 AI — 아래 7개 태그만)
   ↓
lore check      ← 누락 · 알 수 없는 토큰 검증
   ↓
lore sync       ← .lore/flows/<카테고리>.md 생성
\`\`\`

## 명령어 한 줄 요약

| 명령 | 역할 |
|------|------|
| \`lore init\` | 워크스페이스 셋업 |
| \`lore bootstrap\` | 코드 → 도메인 맵 + projects: 초안 (LLM 프롬프트 출력) |
| \`lore bootstrap > prompt.md\` | 프롬프트를 파일로 저장 (Claude Code 에 붙여넣기용) |
| \`lore bootstrap \\| pbcopy\` | 프롬프트를 바로 클립보드로 (macOS) |
| \`lore bootstrap --heuristic-only\` | AI 없이 정적 초안 |
| \`lore check\` | 모든 configured projects 전체 검증 |
| \`lore check <files…>\` | 명시 파일만 검증 (precommit 용) |
| \`lore sync\` | L2 / L3 마크다운 재생성 |
| \`lore synthesize\` | 모든 카테고리를 한 프롬프트로 출력 (전체 모드) |
| \`lore synthesize <카테고리>\` | 단일 L2 flow 재구성 프롬프트 |
| \`lore synthesize \\| pbcopy\` | 합쳐진 프롬프트를 바로 클립보드로 (macOS) |
| \`lore publish\` | Lore Board 에 동기화 |
| \`lore chat\` | 로컬 RAG REPL (v0.2 예정) |

## 어노테이션 7개 (다른 이름 만들지 마세요)

| 태그 | 등급 | 용도 |
|------|------|------|
| \`@Domain\` | 필수 | \`<token>\` 또는 \`<token>/<sub>\`. lore.config.yaml 의 \`domains:\` 에 등록된 토큰만 |
| \`@BusinessLogic\` | 필수 | 한 줄 요약 |
| \`@History\` | 조건부 | 데이터/정책 의미 변경 시. \`- YYYY-MM-DD: <변경> (백필 여부)\` |
| \`@Context\` | 선택 | 의사결정 배경 |
| \`@Flow\` | 선택 | flow id |
| \`@MigratedFrom\` | 선택 | 이전 위치 |
| \`@SeeAlso\` | 선택 | 관련 심볼 |

❌ \`@lore-*\`, \`@logic\`, \`@no-side-effects\`, \`@since\`, \`@deprecated\`, \`@author\` 등 자가 발명 금지.

## 형식 예시

### Python (Django)

\`\`\`python
class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일 (백필 없음)
    """
\`\`\`

### TypeScript (React / RN)

\`\`\`tsx
/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 표기
 */
export default function ProfileCard({ userInfo }: Props) { ... }
\`\`\`

## 일상 워크플로

\`\`\`bash
# 도메인 맵 초안 (최초 셋업)
lore bootstrap > prompt.md                # → Claude Code 에 붙여넣기
lore bootstrap | pbcopy                   # macOS — 바로 클립보드로

# 코드 변경 후
lore check                                # 전체 스캔
lore sync                                 # .lore/flows/ 갱신

# L2 flow 재작성 (LLM 사용)
lore synthesize | pbcopy                  # 모든 카테고리 합쳐서 클립보드 (macOS)
                                          # → Claude Code 에 붙여넣기 → 파일 자동 갱신
lore synthesize signal | pbcopy           # 단일 카테고리만

# precommit (husky)
lore check $(git diff --cached --name-only)

# 디버그
LORE_DEBUG=1 lore <command>               # stack trace 출력
\`\`\`

## 클립보드로 바로 복사 — 플랫폼별

| OS | 명령 |
|----|------|
| macOS | \`\\| pbcopy\` (기본 내장) |
| Linux (X11) | \`\\| xclip -selection clipboard\` 또는 \`\\| xsel -b -i\` |
| Linux (Wayland) | \`\\| wl-copy\` |
| WSL | \`\\| clip.exe\` |
| Windows PowerShell | \`\\| Set-Clipboard\` (또는 \`\\| clip\`) |
| 크로스플랫폼 | \`npm i -g clipboard-cli\` 후 \`\\| clipboard\` |

\`\`\`bash
# 예 — Linux 사용자
lore bootstrap | xclip -selection clipboard
lore synthesize | wl-copy
\`\`\`

## AI 에디터 가드레일 (선택)

vibe coding 중 AI 가 어노테이션을 빠뜨리거나 자가 발명 태그를 만들지 못하게:

- \`CLAUDE.md\` 워크스페이스 루트 (Claude Code 자동 참조)
- \`.cursor/rules/lore.mdc\` (Cursor)
- \`.github/copilot-instructions.md\` (Copilot)

템플릿: <https://github.com/terracelab/lore-ai/tree/main/templates/ai>
강한 가드레일 (Hook 자동 교정 루프): <https://docs.lore-ai.vercel.app/guides/ai-harness>

## 도움

- 도큐: <https://docs.lore-ai.vercel.app>
- 어노테이션 스펙: <https://docs.lore-ai.vercel.app/concepts/annotations>
- 이슈 / 질문: <https://github.com/terracelab/lore-ai/discussions>
`;

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, 'lore.config.yaml');
  const flowsDir = resolve(cwd, '.lore/flows');
  const domainMapPath = resolve(cwd, '.lore/DOMAIN_MAP.md');
  const commandsPath = resolve(cwd, '.lore/COMMANDS.md');

  log.info(`Initializing Lore AI in ${cwd}`);

  if (existsSync(configPath) && !options.yes) {
    log.warn('lore.config.yaml already exists — skipping (re-run with --yes to overwrite).');
  } else {
    await writeFile(configPath, SEED_CONFIG, 'utf8');
    log.success('Created lore.config.yaml');
  }

  await mkdir(flowsDir, { recursive: true });
  log.success('Created .lore/flows/');

  if (!existsSync(domainMapPath)) {
    await writeFile(domainMapPath, SEED_DOMAIN_MAP, 'utf8');
    log.success('Created .lore/DOMAIN_MAP.md');
  }

  if (!existsSync(commandsPath)) {
    await writeFile(commandsPath, SEED_COMMANDS_MD, 'utf8');
    log.success('Created .lore/COMMANDS.md');
  }

  // Try to seed the chosen template (optional, best-effort)
  if (options.template && options.template !== 'custom') {
    const templateConfig = resolve(TEMPLATE_ROOT, options.template, 'lore.config.yaml');
    if (existsSync(templateConfig)) {
      const tpl = await readFile(templateConfig, 'utf8');
      await writeFile(configPath, tpl, 'utf8');
      log.success(`Applied template: ${options.template}`);
    } else {
      log.hint(`Template "${options.template}" not bundled yet — using default seed.`);
    }
  }

  log.divider();
  log.info('Next steps:');
  log.hint('1. lore bootstrap          # 코드 → 도메인 맵 초안');
  log.hint('2. (코드에 @Domain · @BusinessLogic 어노테이션 작성)');
  log.hint('3. lore check && lore sync  # 검증 + .lore/flows/<카테고리>.md 생성');
  log.hint('');
  log.hint('명령어 / 어노테이션 7개 / 워크플로 한눈에 — `.lore/COMMANDS.md` 참고.');
  log.hint('');
  log.hint('AI 에디터 가드레일 (선택):');
  log.hint('  CLAUDE.md (Claude Code), .cursor/rules/lore.mdc, .github/copilot-instructions.md');
  log.hint('  템플릿: https://github.com/terracelab/lore-ai/tree/main/templates/ai');
  log.hint('');
  log.hint('Lore Board 등록은 별도 — content/projects.json 에 한 항목 추가:');
  log.hint(
    '   { "slug": "<your-slug>", "name": "...", "icon": "🔵", "order": 1, "status": "draft" }',
  );
}
