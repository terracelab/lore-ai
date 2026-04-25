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
      - "**/views/*.py"
      - "**/models.py"
      - "**/services.py"
      - "**/tasks/*.py"
    exclude:
      - "**/__init__.py"
      - "**/tests.py"
      - "**/migrations/**"

domains:
  auth:
    label: 인증
    subdomains: [profile, session]
  example:
    label: 예시 도메인
    subdomains: [foo, bar]

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

> 프로젝트 전체의 카테고리 지도. 한 줄씩 갱신.

## 인증 (auth)
- profile · session

## 예시 (example)
- foo · bar
`;

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, 'lore.config.yaml');
  const flowsDir = resolve(cwd, '.lore/flows');
  const domainMapPath = resolve(cwd, '.lore/DOMAIN_MAP.md');

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
  log.hint('1. Edit lore.config.yaml — adjust `projects.*.include` and `domains`.');
  log.hint('2. Add @Domain / @BusinessLogic to a few key files.');
  log.hint('3. Run `lore check` then `lore sync`.');
  log.hint('4. To register this project in Lore Board, edit content/projects.json:');
  log.hint('   { "slug": "<your-slug>", "name": "...", "icon": "🔵", "order": 1, "status": "draft" }');
}
