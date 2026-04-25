import type { Annotation, CheckIssue } from './types.js';
import type { LoreConfig } from './config.js';
import { isDomainKnown } from './config.js';

/**
 * Validate an array of annotations against config rules.
 * Returns a list of issues (empty = OK).
 */
export function checkAnnotations(annotations: Annotation[], config: LoreConfig): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const rules = config.extract;

  for (const ann of annotations) {
    if (rules.requireDomain && ann.domains.length === 0) {
      issues.push({
        file: ann.file,
        line: ann.line,
        severity: 'error',
        rule: 'require-domain',
        message: `Missing @Domain at ${ann.file}:${ann.line}`,
        fix: 'Add `@Domain: <token>` (e.g. `@Domain: subscription/master`).',
      });
    }
    if (rules.requireBusinessLogic && !ann.businessLogic) {
      issues.push({
        file: ann.file,
        line: ann.line,
        severity: 'error',
        rule: 'require-business-logic',
        message: `Missing @BusinessLogic at ${ann.file}:${ann.line}`,
        fix: 'Add `@BusinessLogic: <one-line summary>`.',
      });
    }
    for (const domain of ann.domains) {
      if (!isDomainKnown(domain, config.domains)) {
        issues.push({
          file: ann.file,
          line: ann.line,
          severity: 'error',
          rule: 'unknown-domain',
          message: `Unknown @Domain token "${domain}" at ${ann.file}:${ann.line}`,
          fix: `Register "${domain}" under \`domains:\` in lore.config.yaml or fix the token.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Pretty-format issues for terminal output.
 *
 * Used by `lore check` and the precommit hook.
 */
export function formatIssues(issues: CheckIssue[]): string {
  if (issues.length === 0) return '✓ Lore check passed.';
  const lines: string[] = [];
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warns = issues.filter((i) => i.severity === 'warn').length;
  for (const i of issues) {
    const tag = i.severity === 'error' ? 'ERROR' : 'WARN ';
    lines.push(`${tag} [${i.rule}] ${i.message}`);
    if (i.fix) lines.push(`       fix: ${i.fix}`);
  }
  lines.push('');
  lines.push(`✗ ${errors} error(s), ${warns} warning(s).`);
  return lines.join('\n');
}
