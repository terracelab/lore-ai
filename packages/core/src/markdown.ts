import type { Annotation, FlowMeta } from './types.js';

/**
 * Render an L3 (per-symbol fact) markdown section.
 */
export function renderL3(ann: Annotation): string {
  const head = `### \`${ann.symbol ?? `${ann.file}:${ann.line}`}\``;
  const meta = `_${ann.file}:${ann.line}_`;
  const out: string[] = [head, '', meta, ''];
  if (ann.domains.length)
    out.push(`- **Domain**: ${ann.domains.map((d) => `\`${d}\``).join(', ')}`);
  if (ann.businessLogic) out.push(`- **Logic**: ${ann.businessLogic}`);
  if (ann.context) out.push(`- **Context**: ${ann.context}`);
  if (ann.flows?.length) out.push(`- **Flows**: ${ann.flows.map((f) => `\`${f}\``).join(', ')}`);
  if (ann.migratedFrom) out.push(`- **MigratedFrom**: ${ann.migratedFrom}`);
  if (ann.seeAlso?.length) out.push(`- **SeeAlso**: ${ann.seeAlso.join(', ')}`);
  if (ann.history?.length) {
    out.push('');
    out.push('**History**');
    for (const h of ann.history) out.push(`- \`${h.date}\` — ${h.note}`);
  }
  return out.join('\n');
}

/**
 * Render frontmatter for an L2 flow file.
 *
 * Contract is fixed at v0 — see docs/reference/frontmatter.mdx.
 */
export function renderFrontmatter(meta: FlowMeta): string {
  const lines = ['---'];
  lines.push(`slug: ${meta.slug}`);
  lines.push(`title: ${meta.title}`);
  lines.push(`icon: ${meta.icon}`);
  lines.push(`order: ${meta.order}`);
  if (meta.summary) lines.push(`summary: ${meta.summary}`);
  if (meta.tags?.length) lines.push(`tags: [${meta.tags.join(', ')}]`);
  if (meta.last_reviewed) lines.push(`last_reviewed: ${meta.last_reviewed}`);
  if (meta.source_commit) lines.push(`source_commit: ${meta.source_commit}`);
  if (typeof meta.source_files === 'number') lines.push(`source_files: ${meta.source_files}`);
  lines.push('---');
  return lines.join('\n');
}

/**
 * Build an L2 flow markdown document for a category.
 */
export function renderFlow(meta: FlowMeta, body: string): string {
  return `${renderFrontmatter(meta)}\n\n${body.trim()}\n`;
}

interface IndexEntry extends Pick<FlowMeta, 'slug' | 'icon' | 'title'> {
  description?: string;
}

/**
 * Render the auto-generated INDEX.md for a project's `.lore/flows/`.
 */
export function renderIndex(project: string, entries: IndexEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  const lines = [
    '---',
    'slug: index',
    'title: 카테고리 전체 목록',
    'icon: 🗂',
    'order: 0',
    '---',
    '',
    '# 🗂 L2 Flows — Category Index',
    '',
    `> \`${project}\` 프로젝트 · 총 ${sorted.length}개 카테고리 · \`lore sync\` 가 자동 생성`,
    '',
    '| # | Slug | 아이콘 | 이름 | 문서 |',
    '|---|------|-------|-----|------|',
  ];
  sorted.forEach((e, i) => {
    lines.push(
      `| ${i + 1} | \`${e.slug}\` | ${e.icon} | ${e.title} | [${e.slug}.md](${e.slug}.md) |`,
    );
  });
  return lines.join('\n') + '\n';
}
