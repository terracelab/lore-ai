export * from './python.js';
export * from './typescript.js';

export interface SubstantiveResult {
  /** logical lines excluding pure imports/comments/whitespace */
  substantiveLines: number;
  /** total lines */
  totalLines: number;
  /** decision (>= threshold) */
  isSubstantive: boolean;
}
