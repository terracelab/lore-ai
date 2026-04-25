import type { Annotation, AnnotationTag, HistoryEntry, Language } from './types.js';

const TAG_LINE = /^\s*[*#/\s]*@(\w+)\s*[:\s]\s*(.*?)\s*$/;
// Accepts `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` dates so partial-date entries
// (e.g. `- 2025: …`) don't get silently dropped.
const HISTORY_ITEM = /^\s*[*#/\s]*-\s*(\d{4}(?:-\d{2}(?:-\d{2})?)?)\s*:\s*(.+?)\s*$/;
const BULLET_ITEM = /^\s*[*#/\s]*-\s*(.+?)\s*$/;
const VALID_TAGS = new Set<AnnotationTag>([
  'Domain',
  'BusinessLogic',
  'History',
  'Context',
  'Connection',
  'Flow',
  'MigratedFrom',
  'SeeAlso',
]);

interface RawBlock {
  /** raw lines without comment/docstring delimiters */
  lines: string[];
  /** line index (1-based) where the *symbol* starts (block end + 1) */
  symbolLine: number;
}

/**
 * Extract annotation blocks from source text.
 *
 * The block detector is intentionally simple: it picks up
 * Python triple-quoted docstrings and TS JSDoc blocks
 * and returns the trimmed line array.
 */
export function findAnnotationBlocks(source: string, language: Language): RawBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: RawBlock[] = [];

  if (language === 'python') {
    let inBlock = false;
    let buf: string[] = [];
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (!inBlock && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        if (trimmed.length > 3 && (trimmed.endsWith('"""') || trimmed.endsWith("'''"))) {
          // single-line docstring — uninteresting
          continue;
        }
        inBlock = true;
        start = i + 1;
        buf = [];
        continue;
      }
      if (inBlock && (trimmed.endsWith('"""') || trimmed.endsWith("'''"))) {
        inBlock = false;
        blocks.push({ lines: buf, symbolLine: i + 2 });
        continue;
      }
      if (inBlock) {
        buf.push(line);
      }
    }
    void start;
  } else {
    let inBlock = false;
    let buf: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (!inBlock && trimmed.startsWith('/**')) {
        inBlock = true;
        buf = [];
        continue;
      }
      if (inBlock && trimmed.endsWith('*/')) {
        inBlock = false;
        blocks.push({ lines: buf, symbolLine: i + 2 });
        continue;
      }
      if (inBlock) {
        buf.push(line);
      }
    }
  }

  return blocks;
}

/**
 * Parse a single annotation block into an `Annotation`.
 * Returns `null` if neither `@Domain` nor `@BusinessLogic` is present.
 */
export function parseBlock(block: RawBlock, file: string): Annotation | null {
  const tags: Partial<Record<AnnotationTag, string[]>> = {};
  const history: HistoryEntry[] = [];
  const connection: string[] = [];
  let currentTag: AnnotationTag | null = null;

  for (const rawLine of block.lines) {
    const m = rawLine.match(TAG_LINE);
    if (m) {
      const tagName = m[1] as AnnotationTag;
      if (!VALID_TAGS.has(tagName)) {
        currentTag = null;
        continue;
      }
      currentTag = tagName;
      const value = (m[2] ?? '').trim();
      if (value) {
        (tags[tagName] ??= []).push(value);
        if (tagName === 'Connection') connection.push(value);
      }
      continue;
    }
    if (currentTag === 'History') {
      const h = rawLine.match(HISTORY_ITEM);
      if (h && h[1] && h[2]) {
        history.push({ date: h[1], note: h[2].trim() });
      }
      continue;
    }
    if (currentTag === 'Connection') {
      const c = rawLine.match(BULLET_ITEM);
      if (c && c[1]) {
        connection.push(c[1].trim());
      }
    }
  }

  const domains = (tags.Domain?.[0] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const businessLogic = tags.BusinessLogic?.[0] ?? '';
  if (domains.length === 0 && !businessLogic) return null;

  return {
    file,
    line: block.symbolLine,
    domains,
    businessLogic,
    context: tags.Context?.[0],
    history: history.length ? history : undefined,
    connection: connection.length ? connection : undefined,
    flows: tags.Flow?.[0]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    migratedFrom: tags.MigratedFrom?.[0],
    seeAlso: tags.SeeAlso?.[0]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/**
 * Convenience: extract all annotations from a file's source text.
 */
export function parseFile(file: string, source: string, language: Language): Annotation[] {
  const blocks = findAnnotationBlocks(source, language);
  return blocks.map((b) => parseBlock(b, file)).filter((x): x is Annotation => x !== null);
}
