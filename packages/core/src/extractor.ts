import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type { Annotation, Language } from './types.js';
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
 * Group annotations by their first `@Domain` head token (= L1 category).
 * Symbols with multiple domains contribute to *each* head token bucket.
 */
export function groupByCategory(annotations: Annotation[]): Map<string, Annotation[]> {
  const groups = new Map<string, Annotation[]>();
  for (const ann of annotations) {
    const heads = new Set(ann.domains.map((d) => d.split('/', 1)[0] ?? ''));
    for (const head of heads) {
      if (!head) continue;
      const bucket = groups.get(head) ?? [];
      bucket.push(ann);
      groups.set(head, bucket);
    }
  }
  return groups;
}
