import type { SubstantiveResult } from './index.js';

const COMMENT = /^\s*#/;
const IMPORT = /^\s*(from\s+\S+\s+import\s+|import\s+)/;
const PASS = /^\s*pass\s*$/;
const ELLIPSIS = /^\s*\.\.\.\s*$/;
const STRING_DOC = /^\s*("""|''')/;

/**
 * Approximate "substantive line" count for a Python file.
 *
 * The v0 implementation is regex-based: import-only / pass-only /
 * empty-docstring stubs are skipped without invoking tree-sitter.
 * v1 will swap in tree-sitter for proper AST-aware filtering.
 */
export function pythonSubstantive(source: string, threshold: number): SubstantiveResult {
  const lines = source.split(/\r?\n/);
  let count = 0;
  let inDoc = false;
  for (const line of lines) {
    if (inDoc) {
      if (line.includes('"""') || line.includes("'''")) inDoc = false;
      continue;
    }
    if (STRING_DOC.test(line)) {
      // single-line docstring like `"""x"""` doesn't toggle
      const m = line.trim();
      if ((m.startsWith('"""') && m.endsWith('"""') && m.length > 6) || (m.startsWith("'''") && m.endsWith("'''") && m.length > 6)) {
        continue;
      }
      inDoc = true;
      continue;
    }
    if (!line.trim()) continue;
    if (COMMENT.test(line)) continue;
    if (IMPORT.test(line)) continue;
    if (PASS.test(line)) continue;
    if (ELLIPSIS.test(line)) continue;
    count += 1;
  }
  return {
    substantiveLines: count,
    totalLines: lines.length,
    isSubstantive: count >= threshold,
  };
}
