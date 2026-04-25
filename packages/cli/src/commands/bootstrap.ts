import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  loadConfig,
  gatherWorkspaceEvidence,
  buildBootstrapPrompt,
  buildHeuristicDraft,
} from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface BootstrapOptions {
  apply?: boolean;
  heuristicOnly?: boolean;
  out?: string;
}

export async function bootstrapCommand(options: BootstrapOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);
  const workspace = await gatherWorkspaceEvidence(config, cwd);

  const totalApps = workspace.projects.reduce((n, e) => n + e.apps.length, 0);
  const totalGroups = workspace.projects.reduce((n, e) => n + e.groups.length, 0);
  const totalSiblings = workspace.siblings.length;

  if (totalApps === 0 && totalGroups === 0 && totalSiblings === 0) {
    log.error('No source evidence found.');
    log.hint('Check `projects.*.include` globs in lore.config.yaml.');
    log.hint('Common patterns:');
    log.hint('  python:     ["**/views.py", "**/models.py", "**/services.py"]');
    log.hint('  typescript: ["src/pages/**/*.{ts,tsx}", "src/stores/**/*.ts"]');
    process.exitCode = 1;
    return;
  }

  if (options.heuristicOnly) {
    const { yaml, domainMap, projectsAddition } = buildHeuristicDraft(workspace);
    process.stdout.write(
      '# Paste the following into lore.config.yaml (replace existing `domains:` block):\n\n',
    );
    process.stdout.write(yaml);
    if (projectsAddition) {
      process.stdout.write('\n');
      process.stdout.write(projectsAddition);
    }
    process.stdout.write('\n# Save the following as .lore/DOMAIN_MAP.md:\n\n');
    process.stdout.write(domainMap);
    return;
  }

  const prompt = buildBootstrapPrompt(workspace);

  if (options.apply) {
    log.warn('--apply is reserved for v0.2 (Anthropic SDK wiring). Showing prompt instead.');
  }

  if (options.out) {
    await writeFile(resolve(cwd, options.out), prompt, 'utf8');
    log.success(`Wrote prompt to ${options.out}`);
    log.hint('Paste it into Claude Code (or any AI editor) — it returns the file diff(s).');
    return;
  }

  process.stdout.write(prompt);
  process.stderr.write('\n');
  log.divider();
  log.hint(
    `Discovered ${totalApps} app(s) + ${totalGroups} frontend group(s)` +
      (totalSiblings > 0 ? ` + ${totalSiblings} untracked sibling(s)` : '') +
      '.',
  );
  log.hint('Paste the prompt above into Claude Code (or your AI editor).');
  log.hint('AI 가 diff 응답을 주면, 그 다음에 AI 에게 한 번 더 지시:');
  log.hint('  → "위 diff 를 lore.config.yaml 과 .lore/DOMAIN_MAP.md 에 직접 적용해줘"');
  log.hint('확인:');
  log.hint('  git diff lore.config.yaml .lore/DOMAIN_MAP.md');
  log.hint('  lore check         # ✓ 면 정상');
  log.hint('  lore sync          # .lore/flows/<카테고리>.md 생성');
}
