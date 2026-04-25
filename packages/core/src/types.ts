/**
 * Shared types for Lore AI core.
 *
 * The annotation grammar is defined in
 * docs/concepts/annotations.mdx and frozen at v0.
 */

export type Language = 'python' | 'typescript';

/** Tags allowed in source annotations. */
export type AnnotationTag =
  | 'Domain'
  | 'BusinessLogic'
  | 'History'
  | 'Context'
  | 'Connection'
  | 'Flow'
  | 'MigratedFrom'
  | 'SeeAlso';

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  note: string;
}

export interface Annotation {
  /** Source file (workspace-relative). */
  file: string;
  /** 1-based line where the symbol is declared. */
  line: number;
  /** Symbol name, e.g. class / function / component. */
  symbol?: string;

  // Required tags
  domains: string[]; // ["subscription/master", "notification/trigger"]
  businessLogic: string;

  // Optional tags
  context?: string;
  history?: HistoryEntry[];
  /** `@Connection` bullets — endpoint↔screen, model↔FK, task↔trigger mappings. */
  connection?: string[];
  flows?: string[];
  migratedFrom?: string;
  seeAlso?: string[];
}

export interface DomainConfig {
  label: string;
  /** Optional emoji shown in the L2 frontmatter and INDEX.md. Falls back to a built-in heuristic. */
  icon?: string;
  subdomains?: string[];
}

export interface ProjectConfig {
  root: string;
  language: Language;
  include: string[];
  exclude?: string[];
  output?: string; // legacy single-file output
}

export interface ExtractRules {
  requireDomain: boolean;
  requireBusinessLogic: boolean;
  requireHistoryOnDataChange: 'strict' | 'warn' | 'off';
  minSubstantiveLines: number;
}

export interface PublishConfig {
  target: string;
  branch: string;
  project: string;
  mode: 'direct' | 'pr';
  authorName: string;
  authorEmail: string;
  prefix: string;
  skipPaths: string[];
}

export interface FlowMeta {
  slug: string;
  title: string;
  icon: string;
  order: number;
  summary?: string;
  tags?: string[];
  last_reviewed?: string;
  source_commit?: string;
  source_files?: number;
}

export interface CheckIssue {
  file: string;
  line: number;
  severity: 'error' | 'warn';
  rule: string;
  message: string;
  fix?: string;
}
