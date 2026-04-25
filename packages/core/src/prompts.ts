import type { Annotation } from './types.js';
import type { LoreConfig } from './config.js';
import { renderL3 } from './markdown.js';

export interface SynthesizeInput {
  category: string;
  annotations: Annotation[];
  config: LoreConfig;
  /** optional existing flow body (for incremental updates) */
  existingBody?: string;
  /** unified diff window for "since" mode */
  recentDiff?: string;
}

export interface SynthesizeAllCategoryInput {
  category: string;
  annotations: Annotation[];
  existingBody?: string;
}

export interface SynthesizeAllInput {
  categories: SynthesizeAllCategoryInput[];
  config: LoreConfig;
  flowsDir: string;
  recentDiff?: string;
}

/**
 * Build the synthesize prompt for an L2 flow.
 *
 * Produces a *Claude Code-friendly* prompt: stable section headers,
 * embedded L1 + L3 context, explicit output contract.
 */
export function buildSynthesizePrompt(input: SynthesizeInput): string {
  const { category, annotations, config, existingBody, recentDiff } = input;
  const cat = config.domains[category];
  const label = cat?.label ?? category;
  const subdomains = cat?.subdomains ?? [];

  const l3 = annotations.map(renderL3).join('\n\n');

  return [
    `You are the technical writer for the "${label}" (${category}) flow in the Lore AI documentation system.`,
    '',
    `# 1. Category metadata`,
    `- slug: ${category}`,
    `- label: ${label}`,
    subdomains.length ? `- subdomains: ${subdomains.join(', ')}` : '',
    '',
    `# 2. L1 — Domain map (excerpt)`,
    Object.entries(config.domains)
      .map(([k, v]) => `- \`${k}\` — ${v.label}`)
      .join('\n'),
    '',
    existingBody
      ? `# 3. Existing L2 body (preserve voice + section headers when sensible)\n\n${existingBody}`
      : `# 3. Existing L2 body\n\n_(none — first-time synthesis)_`,
    '',
    `# 4. L3 — symbols & business logic facts`,
    l3,
    '',
    recentDiff ? `# 5. Recent diff window\n\n\`\`\`diff\n${recentDiff}\n\`\`\`` : '',
    '',
    `# Output contract`,
    `- Markdown only, no \`\`\` fences around the document.`,
    `- One H1 (\`#\`), then multiple H2 (\`##\`) sections — each H2 becomes a RAG chunk.`,
    `- Each H2 section ≥ 20 chars body. Make titles useful as chat citation labels.`,
    `- Do NOT emit YAML frontmatter — the CLI prepends it.`,
    `- Korean voice, concise, fact-first.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Build a single multi-category synthesize prompt covering every category in
 * one shot. The LLM is instructed to emit one file block per category using
 * `=== FILE: <path> ===` / `=== END FILE ===` markers, OR (when running inside
 * an agent like Claude Code) to write the files directly with its tools.
 */
export function buildSynthesizeAllPrompt(input: SynthesizeAllInput): string {
  const { categories, config, flowsDir, recentDiff } = input;

  const l1 = Object.entries(config.domains)
    .map(([k, v]) => {
      const subs = v.subdomains?.length ? ` (subdomains: ${v.subdomains.join(', ')})` : '';
      return `- \`${k}\` — ${v.label}${subs}`;
    })
    .join('\n');

  const perCategory = categories
    .map((c) => {
      const meta = config.domains[c.category];
      const label = meta?.label ?? c.category;
      const subs = meta?.subdomains?.length
        ? `\n  - subdomains: ${meta.subdomains.join(', ')}`
        : '';
      const l3 = c.annotations.map(renderL3).join('\n\n');
      const existing = c.existingBody
        ? `\n\n### Existing body (preserve voice + section headers when sensible)\n\n${c.existingBody}`
        : `\n\n### Existing body\n\n_(none — first-time synthesis)_`;
      return [
        `## Category: \`${c.category}\` — ${label}${subs}`,
        existing,
        `\n### L3 — symbols & business logic facts\n`,
        l3 || '_(no annotations extracted — skip this category in your output)_',
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return [
    `You are the technical writer for the Lore AI documentation system.`,
    `Rewrite every L2 flow file below in one pass.`,
    '',
    `# 1. L1 — Domain map (full)`,
    l1,
    '',
    `# 2. Per-category context`,
    '',
    perCategory,
    '',
    recentDiff ? `# 3. Recent diff window\n\n\`\`\`diff\n${recentDiff}\n\`\`\`\n` : '',
    `# Output contract`,
    `- Emit ONE rewritten flow per category, using this exact framing:`,
    '',
    `  === FILE: ${flowsDir}/<category>.md ===`,
    `  # <H1 title>`,
    `  ## <H2 section>`,
    `  ...`,
    `  === END FILE ===`,
    '',
    `- One H1 + multiple H2 sections per file (each H2 becomes a RAG chunk).`,
    `- Each H2 section ≥ 20 chars body. Make H2 titles useful as chat citation labels.`,
    `- Markdown only — no \`\`\` fences wrapping the document, no YAML frontmatter (the CLI prepends it).`,
    `- Korean voice, concise, fact-first.`,
    `- Skip any category whose L3 facts say "(no annotations extracted)".`,
    '',
    `If you are running inside an agent with file-editing tools (e.g. Claude Code),`,
    `prefer writing each category directly to \`${flowsDir}/<category>.md\` instead of`,
    `printing the FILE blocks — but write the body ONLY (no frontmatter).`,
  ]
    .filter(Boolean)
    .join('\n');
}
