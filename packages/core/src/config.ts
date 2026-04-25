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
 * Validate a domain token (`token` or `token/subtoken`)
 * against the configured domain map.
 */
export function isDomainKnown(token: string, domains: LoreConfig['domains']): boolean {
  const [head, sub] = token.split('/', 2);
  if (!head) return false;
  const entry = domains[head];
  if (!entry) return false;
  if (!sub) return true;
  return entry.subdomains?.includes(sub) ?? false;
}
