import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import {
  loadConfig,
  extractAll,
  groupByCategory,
  renderFlow,
  renderIndex,
  renderL3,
} from '@lore-ai-automation/core';
import type { Annotation, FlowMeta, ProjectConfig } from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface SyncOptions {
  project?: string;
  dryRun?: boolean;
}

const ICONS: Record<string, string> = {
  auth: '🔐',
  subscription: '💳',
  signal: '📘',
  notification: '🔔',
  payment: '💸',
  default: '📂',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickIcon(slug: string): string {
  return ICONS[slug] ?? ICONS.default!;
}

async function gatherFilesFor(project: ProjectConfig, cwd: string): Promise<string[]> {
  const root = resolve(cwd, project.root);
  return fastGlob(project.include, {
    cwd: root,
    ignore: project.exclude ?? [],
    absolute: true,
    dot: false,
  });
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  const projectKeys = options.project
    ? [options.project]
    : Object.keys(config.projects);
  if (projectKeys.length === 0) {
    log.error('No projects defined in lore.config.yaml');
    process.exitCode = 1;
    return;
  }

  // Gather across all projects so domain coverage is unified
  const allAnnotations: Annotation[] = [];
  for (const key of projectKeys) {
    const project = config.projects[key];
    if (!project) {
      log.warn(`Project "${key}" not found in config — skipping`);
      continue;
    }
    const files = await gatherFilesFor(project, cwd);
    log.info(`[${key}] scanning ${files.length} file(s)`);
    const ann = await extractAll({ files, language: project.language, cwd });
    allAnnotations.push(...ann);
  }

  log.success(`Found ${allAnnotations.length} annotation(s)`);

  const flowsDir = resolve(cwd, config.flows.dir);
  if (!options.dryRun) await mkdir(flowsDir, { recursive: true });

  const groups = groupByCategory(allAnnotations);
  const indexEntries: Array<{ slug: string; icon: string; title: string }> = [];

  for (const [slug, anns] of groups) {
    const domain = config.domains[slug];
    const meta: FlowMeta = {
      slug,
      title: domain?.label ?? slug,
      icon: pickIcon(slug),
      order: indexEntries.length + 1,
      summary: `${domain?.label ?? slug} 카테고리 (${anns.length}개 심볼)`,
      tags: domain?.subdomains,
      last_reviewed: today(),
      source_files: new Set(anns.map((a) => a.file)).size,
    };
    indexEntries.push({ slug, icon: meta.icon, title: meta.title });

    const body = [
      `# ${meta.icon} ${meta.title}`,
      '',
      `## 1. 개요`,
      '',
      meta.summary ?? '',
      '',
      `## 2. 심볼 목록`,
      '',
      ...anns.map(renderL3),
    ].join('\n');

    const out = renderFlow(meta, body);
    const path = resolve(flowsDir, `${slug}.md`);
    if (options.dryRun) {
      log.info(`[dry-run] would write ${path} (${out.length} bytes)`);
    } else {
      await writeFile(path, out, 'utf8');
      log.success(`Wrote ${path}`);
    }
  }

  // Auto-generate INDEX.md
  const projectName = projectKeys[0] ?? 'project';
  const indexBody = renderIndex(projectName, indexEntries);
  const indexPath = resolve(flowsDir, config.flows.indexFile);
  if (options.dryRun) {
    log.info(`[dry-run] would write ${indexPath}`);
  } else {
    await writeFile(indexPath, indexBody, 'utf8');
    log.success(`Wrote ${indexPath}`);
  }

  log.divider();
  log.success('lore sync complete.');
}
