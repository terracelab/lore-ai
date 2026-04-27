import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import fastGlob from 'fast-glob';
import {
  loadConfig,
  extractAll,
  groupByCategory,
  buildSynthesizePrompt,
  buildSynthesizeAllPrompt,
  canonicalAnnotationHash,
  readSynthCache,
  writeSynthCache,
} from '@lore-ai-automation/core';
import type {
  Annotation,
  ProjectConfig,
  SynthesizeAllCategoryInput,
} from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface SynthesizeOptions {
  apply?: boolean;
  since?: string;
  force?: boolean;
}

async function gatherFilesFor(project: ProjectConfig, cwd: string): Promise<string[]> {
  return fastGlob(project.include, {
    cwd: resolve(cwd, project.root),
    ignore: project.exclude ?? [],
    absolute: true,
  });
}

async function readExistingFlow(cwd: string, flowsDir: string, category: string) {
  try {
    return await readFile(resolve(cwd, flowsDir, `${category}.md`), 'utf8');
  } catch {
    return undefined;
  }
}

async function gatherAllAnnotations(cwd: string, projects: Record<string, ProjectConfig>) {
  const all: Annotation[] = [];
  for (const key of Object.keys(projects)) {
    const project = projects[key];
    if (!project) continue;
    const files = await gatherFilesFor(project, cwd);
    all.push(...(await extractAll({ files, language: project.language, cwd })));
  }
  return all;
}

/**
 * Bundle `git log --since=<range>` for the directories that hold the given
 * annotations. The git root is auto-discovered per file (via
 * `git rev-parse --show-toplevel`) so this works for monorepos, sub-repos
 * (e.g. project root above the actual code repo), and multi-repo configs.
 */
function gatherGitLog(cwd: string, annotations: Annotation[], since: string): string {
  const rootCache = new Map<string, string | null>();
  const findGitRoot = (dir: string): string | null => {
    const cached = rootCache.get(dir);
    if (cached !== undefined) return cached;
    let result: string | null = null;
    try {
      const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      result = out || null;
    } catch {
      result = null;
    }
    rootCache.set(dir, result);
    return result;
  };

  const dirsByRoot = new Map<string, Set<string>>();
  for (const a of annotations) {
    const fileAbs = resolve(cwd, a.file);
    const idx = fileAbs.lastIndexOf('/');
    const fileDir = idx > 0 ? fileAbs.slice(0, idx) : fileAbs;
    const root = findGitRoot(fileDir);
    if (!root) continue;
    const relDir = relative(root, fileDir) || '.';
    if (!dirsByRoot.has(root)) dirsByRoot.set(root, new Set());
    dirsByRoot.get(root)!.add(relDir);
  }

  const out: string[] = [];
  for (const [root, dirs] of dirsByRoot) {
    try {
      const stdout = execFileSync(
        'git',
        ['log', `--since=${since}`, '--pretty=format:%h %ad %s', '--date=short', '--', ...dirs],
        { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      const trimmed = stdout.trim();
      if (trimmed) {
        out.push(`[git: ${root}]`);
        out.push(trimmed);
        out.push('');
      }
    } catch {
      // git unavailable or no commits in window
    }
  }
  return out.join('\n').trim();
}

interface ChangeDecision {
  changed: boolean;
  hash: string;
  reason: 'no-cache' | 'hash-mismatch' | 'flow-missing' | 'unchanged' | 'forced';
}

function decideChange(
  annotations: Annotation[],
  cached: { draftHash: string } | undefined,
  flowFileExists: boolean,
  force: boolean,
): ChangeDecision {
  const hash = canonicalAnnotationHash(annotations);
  if (force) return { changed: true, hash, reason: 'forced' };
  if (!cached) return { changed: true, hash, reason: 'no-cache' };
  if (cached.draftHash !== hash) return { changed: true, hash, reason: 'hash-mismatch' };
  if (!flowFileExists) return { changed: true, hash, reason: 'flow-missing' };
  return { changed: false, hash, reason: 'unchanged' };
}

export async function synthesizeCommand(
  category: string | undefined,
  options: SynthesizeOptions,
): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  const flowsDir = resolve(cwd, config.flows.dir);
  const cacheDir = resolve(cwd, config.flows.cacheDir);

  const all = await gatherAllAnnotations(cwd, config.projects);
  const grouped = groupByCategory(all);

  if (category) {
    if (!config.domains[category]) {
      log.error(`Unknown category "${category}". Add it under \`domains:\` in lore.config.yaml.`);
      process.exitCode = 1;
      return;
    }
    const annotations = grouped.get(category) ?? [];
    if (annotations.length === 0) {
      log.warn(`No annotations found for category "${category}".`);
      return;
    }
    const flowPath = resolve(flowsDir, `${category}.md`);
    const cached = await readSynthCache(cacheDir, category);
    const decision = decideChange(annotations, cached, existsSync(flowPath), !!options.force);

    if (!decision.changed) {
      log.success(
        `[${category}] unchanged since last synthesize — skipping (hash ${decision.hash.slice(7, 19)}…)`,
      );
      log.hint('Use --force to re-synthesize anyway.');
      return;
    }

    const existingBody = await readExistingFlow(cwd, config.flows.dir, category);
    const recentDiff = options.since ? gatherGitLog(cwd, annotations, options.since) : undefined;
    const prompt = buildSynthesizePrompt({
      category,
      annotations,
      config,
      existingBody,
      recentDiff: recentDiff || undefined,
    });

    if (!options.apply) {
      process.stdout.write(prompt + '\n');
      log.divider();
      log.info(
        `[${category}] reason: ${decision.reason} — emitting prompt (hash ${decision.hash.slice(7, 19)}…)`,
      );
      if (recentDiff) {
        log.info(`Bundled git log since ${options.since}.`);
      }
      log.hint('Copy the prompt above into Claude Code, paste the response back into');
      log.hint(`  ${flowPath}`);
      log.hint('or run again with --apply once API support lands.');

      // Optimistic cache update — assumes the user/LLM will write the flow file.
      // The skip check also gates on `flowFileExists`, so a missed paste-back
      // self-corrects on the next run.
      await writeSynthCache(cacheDir, category, {
        slug: category,
        draftHash: decision.hash,
        annotationCount: annotations.length,
        lastSynthesizedAt: new Date().toISOString(),
      });
      return;
    }

    log.warn(
      '--apply mode requires Anthropic SDK wiring (planned for v0.2). Showing prompt instead.',
    );
    process.stdout.write(prompt + '\n');
    return;
  }

  const categories: SynthesizeAllCategoryInput[] = [];
  const skipped: string[] = [];
  const unchanged: string[] = [];
  const includedDecisions = new Map<string, ChangeDecision>();

  for (const slug of Object.keys(config.domains)) {
    const annotations = grouped.get(slug) ?? [];
    if (annotations.length === 0) {
      skipped.push(slug);
      continue;
    }
    const flowPath = resolve(flowsDir, `${slug}.md`);
    const cached = await readSynthCache(cacheDir, slug);
    const decision = decideChange(annotations, cached, existsSync(flowPath), !!options.force);
    if (!decision.changed) {
      unchanged.push(slug);
      continue;
    }
    const existingBody = await readExistingFlow(cwd, config.flows.dir, slug);
    categories.push({ category: slug, annotations, existingBody });
    includedDecisions.set(slug, decision);
  }

  if (categories.length === 0) {
    if (unchanged.length > 0) {
      log.success(
        `All ${unchanged.length} categor${unchanged.length === 1 ? 'y is' : 'ies are'} unchanged since last synthesize — nothing to do.`,
      );
      log.hint(`Unchanged: ${unchanged.join(', ')}`);
      log.hint('Use --force to re-synthesize anyway.');
      return;
    }
    log.warn('No categories have any annotations yet — run `lore sync` after annotating code.');
    return;
  }

  const annotationsForLog = categories.flatMap((c) => c.annotations);
  const recentDiff = options.since
    ? gatherGitLog(cwd, annotationsForLog, options.since)
    : undefined;

  const prompt = buildSynthesizeAllPrompt({
    categories,
    config,
    flowsDir: config.flows.dir,
    recentDiff: recentDiff || undefined,
  });

  if (!options.apply) {
    process.stdout.write(prompt + '\n');
    log.divider();
    log.info(
      `Built one prompt covering ${categories.length} changed categor${categories.length === 1 ? 'y' : 'ies'}.`,
    );
    if (unchanged.length > 0) {
      log.info(`Unchanged (skipped): ${unchanged.join(', ')}`);
    }
    if (recentDiff) {
      log.hint(`Bundled git log since ${options.since}.`);
    }
    if (skipped.length) {
      log.hint(`No annotations: ${skipped.join(', ')}`);
    }
    log.hint('Paste into Claude Code — it can write each .lore/flows/<cat>.md directly.');
    log.hint(
      `Or paste into a chat LLM and split by '=== FILE: ${join(config.flows.dir, '<cat>.md')} ===' markers.`,
    );
    log.hint('Run again with --apply once API support lands.');

    // Optimistic per-category cache update for every category included in the prompt.
    const now = new Date().toISOString();
    for (const c of categories) {
      const decision = includedDecisions.get(c.category);
      if (!decision) continue;
      await writeSynthCache(cacheDir, c.category, {
        slug: c.category,
        draftHash: decision.hash,
        annotationCount: c.annotations.length,
        lastSynthesizedAt: now,
      });
    }
    return;
  }

  log.warn(
    '--apply mode requires Anthropic SDK wiring (planned for v0.2). Showing prompt instead.',
  );
  process.stdout.write(prompt + '\n');
}
