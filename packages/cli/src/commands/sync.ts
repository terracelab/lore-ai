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
import type { Annotation, DomainConfig, FlowMeta, ProjectConfig } from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface SyncOptions {
  project?: string;
  dryRun?: boolean;
}

const BUILTIN_ICONS: Record<string, string> = {
  auth: '🔐',
  user: '👤',
  account: '👤',
  subscription: '💳',
  payment: '💸',
  billing: '💸',
  signal: '📘',
  notification: '🔔',
  notice: '📢',
  job: '💼',
  candidate: '🧑‍💼',
  attendance: '🗓️',
  schedule: '🗓️',
  scheduler: '⏰',
  security: '🛡️',
  admin: '🛠️',
  monitoring: '📊',
  analytics: '📊',
  stock: '📈',
  market: '📈',
  community: '💬',
  chat: '💬',
  content: '📰',
  marketing: '📣',
  api: '🔌',
  infra: '🏗️',
  default: '📂',
};

// Stable hash-based fallback so each unmapped slug still gets a distinct icon
// (vs. every category collapsing onto 📂).
const FALLBACK_POOL = ['📦', '🧩', '🔧', '🧱', '🗂️', '🧭', '🔖', '🧪', '🧰', '🗃️'];

function fallbackIcon(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return FALLBACK_POOL[h % FALLBACK_POOL.length]!;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickIcon(slug: string, domain?: DomainConfig): string {
  if (domain?.icon) return domain.icon;
  return BUILTIN_ICONS[slug] ?? fallbackIcon(slug);
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

  const projectKeys = options.project ? [options.project] : Object.keys(config.projects);
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

  const draftDir = resolve(cwd, config.flows.draftDir);
  const flowsDir = resolve(cwd, config.flows.dir);
  if (!options.dryRun) {
    await mkdir(draftDir, { recursive: true });
    await mkdir(flowsDir, { recursive: true });
  }

  const groups = groupByCategory(allAnnotations);
  const indexEntries: Array<{ slug: string; icon: string; title: string }> = [];

  for (const [slug, anns] of groups) {
    const domain = config.domains[slug];
    const meta: FlowMeta = {
      slug,
      title: domain?.label ?? slug,
      icon: pickIcon(slug, domain),
      order: indexEntries.length + 1,
      summary: `${domain?.label ?? slug} 카테고리 (${anns.length}개 심볼)`,
      tags: domain?.subdomains,
      last_reviewed: today(),
      source_files: new Set(anns.map((a) => a.file)).size,
    };
    indexEntries.push({ slug, icon: meta.icon, title: meta.title });

    const body = [
      `# ${meta.icon} ${meta.title} (Draft — raw L3 facts)`,
      '',
      `> 이 파일은 \`lore sync\` 가 코드 어노테이션에서 자동 생성한 **원천 사실** 입니다.`,
      `> 사람이 읽는 보고서는 \`lore synthesize\` 가 \`${config.flows.dir}/${slug}.md\` 로 만들어냅니다.`,
      `> 이 draft 를 직접 편집하지 마세요 — 다음 \`lore sync\` 가 덮어씁니다.`,
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
    const path = resolve(draftDir, `${slug}.md`);
    if (options.dryRun) {
      log.info(`[dry-run] would write ${path} (${out.length} bytes)`);
    } else {
      await writeFile(path, out, 'utf8');
      log.success(`Wrote ${path}`);
    }
  }

  // Auto-generate INDEX.md (lives in flowsDir — it's category nav, not a synthesis target)
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
