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
  if (ann.connection?.length) {
    out.push('');
    out.push('**Connection**');
    for (const c of ann.connection) out.push(`- ${c}`);
  }
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
 *
 * Includes the frontmatter spec + L1/L2/L3 layer concept + update guide so the
 * file can stand alone as the dashboard's category entry point.
 */
export function renderIndex(project: string, entries: IndexEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  const lines = [
    '---',
    'slug: index',
    'title: 카테고리 전체 목록',
    'icon: 🗂',
    'order: 0',
    `summary: ${sorted.length}개 L2 플로우 카테고리 진입점`,
    '---',
    '',
    '# 🗂 L2 Flows — Category Index',
    '',
    `> \`${project}\` 프로젝트 · 총 ${sorted.length}개 카테고리 · \`lore sync\` 가 자동 생성`,
    '> 각 파일은 \`frontmatter\` 를 갖추고 있어 대시보드에서 자동 파싱 가능.',
    '',
    '## 전체 카테고리',
    '',
    '| # | Slug | 아이콘 | 이름 | 문서 |',
    '|---|------|-------|-----|------|',
  ];
  sorted.forEach((e, i) => {
    lines.push(
      `| ${i + 1} | \`${e.slug}\` | ${e.icon} | ${e.title} | [${e.slug}.md](${e.slug}.md) |`,
    );
  });
  lines.push(
    '',
    '## Frontmatter 스펙 (대시보드 파서용)',
    '',
    '각 flow 파일 최상단 YAML:',
    '',
    '```yaml',
    '---',
    'slug: <category>          # 카테고리 ID (파일명과 동일)',
    'title: <한국어 라벨>       # 한글 표시명',
    'icon: <emoji>             # 이모지 1개',
    'order: <n>                # 정렬 순서',
    'summary: <한 줄 요약>      # 카드 서브타이틀용',
    'tags: [<sub1>, <sub2>]    # 검색·필터용 (= subdomains)',
    'last_reviewed: YYYY-MM-DD # 마지막 검토일 (synthesize / review 시 갱신)',
    '---',
    '```',
    '',
    '## 레이어 개념',
    '',
    '- **L1** — `lore.config.yaml` 의 `domains:` — 카테고리 지도',
    '- **L2** — 이 디렉터리의 `*.md` — 사람이 읽는 보고서 (`lore synthesize` 자동 + `lore review` 보강)',
    '- **L3** — `.lore/draft/*.md` — 코드 어노테이션에서 추출한 원천 사실 (`lore sync` 자동)',
    '',
    '## 갱신 방법',
    '',
    '```bash',
    'lore sync                       # 코드 → L3 draft 재생성',
    'lore synthesize <category>      # 변경된 L3 → L2 보고서 재생성',
    'lore review <category>          # 보고서 깊이 보강 (코드 발췌 / WHY 사유 / forensics)',
    '```',
  );
  return lines.join('\n') + '\n';
}
