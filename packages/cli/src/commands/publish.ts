import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { loadConfig } from '@lore-ai/core';
import { log } from '../util/log.js';

interface PublishOptions {
  target?: string;
  mode?: 'direct' | 'pr';
  branch?: string;
  dryRun?: boolean;
}

function isLocalPath(target: string): boolean {
  return target.startsWith('/') || target.startsWith('.') || target.startsWith('~');
}

async function listFlowFiles(flowsDir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(flowsDir);
  } catch {
    return [];
  }
  for (const e of entries) {
    if (!e.endsWith('.md')) continue;
    const p = join(flowsDir, e);
    const s = await stat(p);
    if (s.isFile()) out.push(p);
  }
  return out;
}

export async function publishCommand(options: PublishOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);
  const target = options.target ?? config.publish?.target;
  const project = config.publish?.project;

  if (!target) {
    log.error('No publish target. Pass --target or set publish.target in lore.config.yaml.');
    process.exitCode = 1;
    return;
  }
  if (!project) {
    log.error('publish.project missing in lore.config.yaml.');
    process.exitCode = 1;
    return;
  }

  const flowsDir = resolve(cwd, config.flows.dir);
  const files = await listFlowFiles(flowsDir);
  if (files.length === 0) {
    log.warn('No flow files to publish — run `lore sync` first.');
    return;
  }

  if (!isLocalPath(target)) {
    log.warn('Git URL targets are not implemented in v0 CLI skeleton.');
    log.hint('Workaround: clone the lore-board repo locally and pass the local path:');
    log.hint(`  lore publish --target ~/dev/projects/onboarding/lore-board`);
    return;
  }

  const destDir = resolve(target.replace(/^~/, process.env.HOME ?? '~'), 'content', 'projects', project, 'flows');

  if (options.dryRun) {
    log.info(`[dry-run] would copy ${files.length} file(s) to:`);
    log.hint(`  ${destDir}`);
    for (const f of files) log.hint(`  • ${f.split('/').pop()}`);
    return;
  }

  await mkdir(destDir, { recursive: true });
  for (const f of files) {
    const dest = join(destDir, f.split('/').pop()!);
    await cp(f, dest);
    log.success(`copied ${dest}`);
  }
  log.divider();
  log.info('Next: cd into the lore-board repo, review the diff, commit and push manually.');
  log.hint(`  cd ${target}`);
  log.hint('  git add content/projects/' + project + '/');
  log.hint(`  git commit -m "${config.publish?.prefix ?? 'chore(docs): sync'} ${project}"`);
  log.hint('  git push');
}
