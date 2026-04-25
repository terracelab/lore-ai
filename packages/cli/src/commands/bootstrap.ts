import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  loadConfig,
  gatherEvidence,
  buildBootstrapPrompt,
  buildHeuristicDraft,
} from '@lore-ai/core';
import { log } from '../util/log.js';

interface BootstrapOptions {
  apply?: boolean;
  heuristicOnly?: boolean;
  out?: string;
}

export async function bootstrapCommand(options: BootstrapOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);
  const evidence = await gatherEvidence(config, cwd);

  const totalApps = evidence.reduce((n, e) => n + e.apps.length, 0);
  const totalGroups = evidence.reduce((n, e) => n + e.groups.length, 0);
  if (totalApps === 0 && totalGroups === 0) {
    log.error('No source evidence found.');
    log.hint('Check `projects.*.include` globs in lore.config.yaml.');
    log.hint('Common patterns:');
    log.hint('  python:     ["**/views.py", "**/models.py", "**/services.py"]');
    log.hint('  typescript: ["src/pages/**/*.{ts,tsx}", "src/stores/**/*.ts"]');
    process.exitCode = 1;
    return;
  }

  if (options.heuristicOnly) {
    const { yaml, domainMap } = buildHeuristicDraft(evidence);
    process.stdout.write(
      '# Paste the following into lore.config.yaml (replace existing `domains:` block):\n\n',
    );
    process.stdout.write(yaml);
    process.stdout.write('\n# Save the following as .lore/DOMAIN_MAP.md:\n\n');
    process.stdout.write(domainMap);
    return;
  }

  const prompt = buildBootstrapPrompt(evidence);

  if (options.apply) {
    log.warn('--apply is reserved for v0.2 (Anthropic SDK wiring). Showing prompt instead.');
  }

  if (options.out) {
    await writeFile(resolve(cwd, options.out), prompt, 'utf8');
    log.success(`Wrote prompt to ${options.out}`);
    log.hint('Paste it into Claude Code (or any AI editor) — it returns two file diffs.');
    return;
  }

  process.stdout.write(prompt);
  process.stderr.write('\n');
  log.divider();
  log.hint(`Discovered ${totalApps} app(s) + ${totalGroups} frontend group(s).`);
  log.hint('Paste the prompt above into Claude Code or your AI editor.');
  log.hint('After approval:');
  log.hint('  • Replace `domains:` in lore.config.yaml');
  log.hint('  • Overwrite .lore/DOMAIN_MAP.md');
  log.hint('Then run `lore check` and `lore sync`.');
}
