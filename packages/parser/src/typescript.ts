import type { SubstantiveResult } from './index.js';

const LINE_COMMENT = /^\s*\/\//;
const IMPORT = /^\s*(import\s+|export\s+\*\s+from\s+|export\s+\{[^}]*\}\s+from\s+)/;
const TYPE_ONLY = /^\s*(export\s+)?type\s+\w+\s*=/;
const INTERFACE = /^\s*(export\s+)?interface\s+\w+/;

/**
 * Approximate substantive-line count for a TS / TSX file.
 *
 * Skips: blank lines, line comments, block comment bodies,
 * imports, pure type/interface declarations.
 *
 * Tree-sitter-based replacement is planned for v1 — see
 * docs/contributing/architecture.mdx.
 */
export function typescriptSubstantive(source: string, threshold: number): SubstantiveResult {
  const lines = source.split(/\r?\n/);
  let count = 0;
  let inBlock = false;
  for (const line of lines) {
    if (inBlock) {
      if (line.includes('*/')) inBlock = false;
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('/*')) {
      if (!trimmed.endsWith('*/')) inBlock = true;
      continue;
    }
    if (LINE_COMMENT.test(line)) continue;
    if (IMPORT.test(line)) continue;
    if (TYPE_ONLY.test(line)) continue;
    if (INTERFACE.test(line)) continue;
    count += 1;
  }
  return {
    substantiveLines: count,
    totalLines: lines.length,
    isSubstantive: count >= threshold,
  };
}
