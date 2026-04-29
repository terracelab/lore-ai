import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const projectSchema = z.object({
  root: z.string(),
  language: z.enum(['python', 'typescript']),
  include: z.array(z.string()).min(1),
  exclude: z.array(z.string()).default([]),
  output: z.string().optional(),
});

const domainSchema = z.object({
  label: z.string(),
  icon: z.string().optional(),
  subdomains: z.array(z.string()).default([]),
});

const extractSchema = z
  .object({
    requireDomain: z.boolean().default(true),
    requireBusinessLogic: z.boolean().default(true),
    requireHistoryOnDataChange: z.enum(['strict', 'warn', 'off']).default('warn'),
    minSubstantiveLines: z.number().int().nonnegative().default(5),
  })
  .default({});

const llmSchema = z
  .object({
    provider: z.enum(['anthropic', 'openai']).default('anthropic'),
    model: z.string().default('claude-opus-4-7'),
    apiKeyEnv: z.string().default('ANTHROPIC_API_KEY'),
    temperature: z.number().min(0).max(1).default(0.3),
  })
  .default({});

const publishSchema = z
  .object({
    target: z.string(),
    branch: z.string().default('main'),
    project: z.string(),
    mode: z.enum(['direct', 'pr']).default('direct'),
    authorName: z.string().default('Lore Bot'),
    authorEmail: z.string().email().default('lore@terracelab.co.kr'),
    prefix: z.string().default('chore(docs): sync'),
    skipPaths: z.array(z.string()).default(['content/handbook/**', 'content/projects.json']),
  })
  .optional();

export const loreConfigSchema = z.object({
  version: z.literal(1).default(1),
  projects: z.record(projectSchema).default({}),
  domains: z.record(domainSchema).default({}),
  flows: z
    .object({
      dir: z.string().default('./.lore/flows'),
      draftDir: z.string().default('./.lore/draft'),
      cacheDir: z.string().default('./.lore/.synth-cache'),
      indexFile: z.string().default('INDEX.md'),
    })
    .default({}),
  extract: extractSchema,
  llm: llmSchema,
  publish: publishSchema,
  dashboard: z
    .object({
      enabled: z.boolean().default(false),
      port: z.number().default(4321),
    })
    .default({}),
});

export type LoreConfig = z.infer<typeof loreConfigSchema>;

export class ConfigError extends Error {
  constructor(
    public readonly path: string,
    message: string,
    public readonly issues?: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Load and validate `lore.config.yaml`.
 *
 * @param cwd workspace root
 * @returns parsed config + absolute path
 */
export async function loadConfig(cwd: string): Promise<{
  config: LoreConfig;
  configPath: string;
}> {
  const configPath = resolve(cwd, 'lore.config.yaml');
  let raw: string;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch {
    throw new ConfigError(
      configPath,
      `lore.config.yaml not found in ${cwd}. Run \`lore init\` first.`,
    );
  }

  const parsed = parseYaml(raw);
  const result = loreConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new ConfigError(configPath, 'Invalid lore.config.yaml', result.error.issues);
  }
  return { config: result.data, configPath };
}

/**
 * Parse a `@Domain` token into `{ head, sub }` with whitespace trimmed and
 * any trailing parenthesized hint stripped.
 *
 * Examples:
 *   `"auth"`                                    → `{ head: "auth", sub: undefined }`
 *   `"auth / profile"`                          → `{ head: "auth", sub: "profile" }`
 *   `"인증 / 프로필 메뉴 (Client Component)"`   → `{ head: "인증", sub: "프로필 메뉴" }`
 *
 * The trailing-parens convention treats `(Client Component)`, `(Client)`,
 * `(Server)` etc. as a *category hint* attached to the symbol, not part of
 * the domain itself.
 */
export function parseDomainToken(token: string): { head: string; sub: string | undefined } {
  const stripped = token.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const [headRaw, subRaw] = stripped.split('/', 2);
  return {
    head: (headRaw ?? '').trim(),
    sub: subRaw === undefined ? undefined : subRaw.trim() || undefined,
  };
}

/**
 * Resolve a domain head (English slug *or* Korean label) to its config key.
 * Returns the slug, or `undefined` if no match.
 */
export function resolveDomainSlug(
  head: string,
  domains: LoreConfig['domains'],
): string | undefined {
  if (!head) return undefined;
  if (domains[head]) return head;
  for (const [slug, entry] of Object.entries(domains)) {
    if (entry.label === head) return slug;
  }
  return undefined;
}

/**
 * Validate a domain token (`token` or `token/subtoken`) against the configured
 * domain map. Accepts both English slugs and Korean labels for `head`, allows
 * whitespace around `/`, and strips a trailing `(hint)` suffix.
 */
export function isDomainKnown(token: string, domains: LoreConfig['domains']): boolean {
  const { head, sub } = parseDomainToken(token);
  if (!head) return false;
  const slug = resolveDomainSlug(head, domains);
  if (!slug) return false;
  if (!sub) return true;
  return domains[slug]?.subdomains?.includes(sub) ?? false;
}
