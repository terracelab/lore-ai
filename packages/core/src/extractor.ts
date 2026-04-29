import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type { Annotation, Language } from './types.js';
import type { LoreConfig } from './config.js';
import { parseDomainToken, resolveDomainSlug } from './config.js';
import { parseFile } from './parser.js';

export interface ExtractInput {
  /** absolute file paths to scan */
  files: string[];
  /** language to apply for the whole batch */
  language: Language;
  /** workspace root — used to relativize `Annotation.file` */
  cwd: string;
}

/**
 * Read each file from disk and return all annotations found.
 *
 * The function preserves order (file order × annotation order)
 * so downstream output is stable across runs.
 */
export async function extractAll(input: ExtractInput): Promise<Annotation[]> {
  const out: Annotation[] = [];
  for (const file of input.files) {
    let source: string;
    try {
      source = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    const rel = relative(input.cwd, file);
    out.push(...parseFile(rel, source, input.language));
  }
  return out;
}

/**
 * Group annotations by their `@Domain` head token (= L1 category).
 * Symbols with multiple domains contribute to *each* head token bucket.
 *
 * If `domains` is provided, head tokens are normalized via
 * `parseDomainToken` (whitespace + trailing-paren stripped) and resolved
 * to their config slug — so Korean labels like `"인증 / 프로필 (Client Component)"`
 * land in the same bucket as English `"auth"`. Without `domains`, falls back
 * to the legacy behavior (raw head, split on `/`).
 */
export function groupByCategory(
  annotations: Annotation[],
  domains?: LoreConfig['domains'],
): Map<string, Annotation[]> {
  const groups = new Map<string, Annotation[]>();
  for (const ann of annotations) {
    const heads = new Set<string>();
    for (const d of ann.domains) {
      if (domains) {
        const { head } = parseDomainToken(d);
        if (!head) continue;
        const slug = resolveDomainSlug(head, domains) ?? head;
        heads.add(slug);
      } else {
        const head = (d.split('/', 1)[0] ?? '').trim();
        if (head) heads.add(head);
      }
    }
    for (const head of heads) {
      const bucket = groups.get(head) ?? [];
      bucket.push(ann);
      groups.set(head, bucket);
    }
  }
  return groups;
}
