import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Annotation } from './types.js';

export interface SynthCacheEntry {
  /** Category slug. */
  slug: string;
  /** sha256:<hex> of the canonical annotation set used for the last synthesis. */
  draftHash: string;
  /** Number of annotations contributing to the hash (informational). */
  annotationCount: number;
  /** ISO 8601 timestamp of the last `lore synthesize` emission. */
  lastSynthesizedAt: string;
}

/**
 * Produce a stable, daily-noise-free hash of the annotation set for a category.
 *
 * The hash is what `lore synthesize` compares against `.lore/.synth-cache/<slug>.json`
 * to decide whether anything changed since the last synthesis. We intentionally
 * hash the canonical *annotation array* — not the rendered draft markdown —
 * because the draft frontmatter carries a daily `last_reviewed` timestamp that
 * would otherwise invalidate the cache every day.
 */
export function canonicalAnnotationHash(annotations: Annotation[]): string {
  const sorted = [...annotations].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    return (a.symbol ?? '').localeCompare(b.symbol ?? '');
  });
  const canonical = sorted.map((a) => ({
    file: a.file,
    line: a.line,
    symbol: a.symbol ?? null,
    domains: [...a.domains].sort(),
    businessLogic: a.businessLogic,
    context: a.context ?? null,
    history: a.history ?? null,
    connection: a.connection ?? null,
    flows: a.flows ?? null,
    migratedFrom: a.migratedFrom ?? null,
    seeAlso: a.seeAlso ?? null,
  }));
  return 'sha256:' + createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export async function readSynthCache(
  cacheDir: string,
  slug: string,
): Promise<SynthCacheEntry | undefined> {
  try {
    const raw = await readFile(resolve(cacheDir, `${slug}.json`), 'utf8');
    const parsed = JSON.parse(raw) as SynthCacheEntry;
    if (typeof parsed.draftHash !== 'string') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export async function writeSynthCache(
  cacheDir: string,
  slug: string,
  entry: SynthCacheEntry,
): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(resolve(cacheDir, `${slug}.json`), JSON.stringify(entry, null, 2) + '\n', 'utf8');
}
