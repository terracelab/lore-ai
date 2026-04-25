import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, relative, resolve, sep } from 'node:path';
import fg from 'fast-glob';
import type { LoreConfig } from './config.js';
import type { ProjectConfig } from './types.js';

const PY_CLASS_RE = /^class\s+(\w+)/gm;
const PY_DEF_RE = /^def\s+(\w+)/gm;
const VIEW_SUFFIX_RE = /(View|APIView|ViewSet)$/;

/**
 * Top-level frontend directories worth surfacing to the prompt.
 * Anything outside this list is collapsed into "(other)".
 */
const TS_CATEGORY_DIRS = new Set([
  'pages',
  'app',
  'components',
  'stores',
  'hooks',
  'api',
  'schemas',
  'controllers',
  'router',
  'features',
  'screens',
  'modules',
]);

export interface AppEvidence {
  name: string;
  models: string[];
  views: string[];
  services: string[];
}

export interface FrontendGroup {
  group: string;
  items: string[];
}

export interface ProjectEvidence {
  key: string;
  language: 'python' | 'typescript';
  apps: AppEvidence[];
  groups: FrontendGroup[];
}

export type SiblingKind = 'expo' | 'react-native' | 'next' | 'react' | 'django' | 'unknown';

export interface MonorepoSibling {
  /** path relative to the bootstrap cwd, e.g. "../nuri-app" */
  path: string;
  kind: SiblingKind;
  /** human-readable reason this dir was classified */
  signal: string;
  /** top-level dirs found inside (helps suggest include globs) */
  topDirs: string[];
}

export interface WorkspaceEvidence {
  projects: ProjectEvidence[];
  siblings: MonorepoSibling[];
}

const PY_CATEGORY_DIRS = new Set([
  'views',
  'models',
  'services',
  'tasks',
  'celery_beat',
  'admins',
  'serializers',
  'urls',
  'forms',
  'apis',
  'managers',
  'permissions',
]);

function detectAppName(relPath: string): string | null {
  const parts = relPath.split(sep).filter(Boolean);
  if (parts.length < 2) return null;
  // Walk from the end, looking for a category dir; the segment before it = app.
  for (let i = parts.length - 1; i >= 1; i--) {
    const seg = parts[i] ?? '';
    if (PY_CATEGORY_DIRS.has(seg)) return parts[i - 1] ?? null;
  }
  // No category dir found → file is at app root (`<app>/something.py`).
  return parts[parts.length - 2] ?? null;
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

async function gatherPython(project: ProjectConfig, cwd: string): Promise<AppEvidence[]> {
  const root = resolve(cwd, project.root);
  const files = await fg(project.include, {
    cwd: root,
    ignore: project.exclude ?? [],
    absolute: false,
    dot: false,
  });

  const byApp = new Map<string, AppEvidence>();

  for (const f of files) {
    const app = detectAppName(f);
    if (!app || app.startsWith('.') || app === 'config' || app === 'core') continue;

    let entry = byApp.get(app);
    if (!entry) {
      entry = { name: app, models: [], views: [], services: [] };
      byApp.set(app, entry);
    }

    let content: string;
    try {
      content = await readFile(resolve(root, f), 'utf8');
    } catch {
      continue;
    }

    if (f.endsWith('models.py')) {
      for (const m of content.matchAll(PY_CLASS_RE)) {
        const name = m[1];
        if (name) entry.models.push(name);
      }
    } else if (/(^|\/)views?(\.py$|\/)/.test(f)) {
      for (const m of content.matchAll(PY_CLASS_RE)) {
        const name = m[1];
        if (name && VIEW_SUFFIX_RE.test(name)) entry.views.push(name);
      }
      for (const m of content.matchAll(PY_DEF_RE)) {
        const name = m[1];
        if (name && !name.startsWith('_')) entry.views.push(name);
      }
    } else if (/(^|\/)(services|tasks|celery_beat)(\.py$|\/)/.test(f)) {
      for (const m of content.matchAll(PY_CLASS_RE)) {
        const name = m[1];
        if (name) entry.services.push(name);
      }
      for (const m of content.matchAll(PY_DEF_RE)) {
        const name = m[1];
        if (name && !name.startsWith('_')) entry.services.push(name);
      }
    }
  }

  for (const e of byApp.values()) {
    e.models = unique(e.models).sort();
    e.views = unique(e.views).sort();
    e.services = unique(e.services).sort();
  }

  return [...byApp.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function gatherTypescript(project: ProjectConfig, cwd: string): Promise<FrontendGroup[]> {
  const root = resolve(cwd, project.root);
  const files = await fg(project.include, {
    cwd: root,
    ignore: project.exclude ?? [],
    absolute: false,
    dot: false,
  });

  const byGroup = new Map<string, Set<string>>();

  for (const f of files) {
    const parts = f.split(sep).filter(Boolean);
    let group: string | undefined;
    let item: string | undefined;

    if (parts[0] === 'src' && parts.length > 1) {
      group = parts[1];
      item = parts[2];
    } else {
      group = parts[0];
      item = parts[1];
    }

    if (!group || !TS_CATEGORY_DIRS.has(group)) continue;

    const set = byGroup.get(group) ?? new Set<string>();
    if (item) {
      const cleaned = item.replace(/\.(tsx?|jsx?)$/, '');
      set.add(cleaned);
    }
    byGroup.set(group, set);
  }

  return [...byGroup.entries()]
    .map(([group, items]) => ({ group, items: [...items].sort() }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

export async function gatherEvidence(config: LoreConfig, cwd: string): Promise<ProjectEvidence[]> {
  const out: ProjectEvidence[] = [];

  for (const [key, project] of Object.entries(config.projects)) {
    const evidence: ProjectEvidence = {
      key,
      language: project.language,
      apps: [],
      groups: [],
    };

    if (project.language === 'python') {
      evidence.apps = await gatherPython(project, cwd);
    } else {
      evidence.groups = await gatherTypescript(project, cwd);
    }

    out.push(evidence);
  }

  return out;
}

/**
 * Top-level dir candidates we'll look inside a sibling for, when proposing
 * include globs to the LLM.
 */
const SIBLING_PROBE_DIRS = [
  // JS/TS layouts
  'src/pages',
  'src/app',
  'src/components',
  'src/stores',
  'src/hooks',
  'src/api',
  'src/schemas',
  'src/router',
  'src/features',
  'src/screens',
  'src/modules',
  'app',
  'pages',
  'components',
  'stores',
  'hooks',
  'api',
  // Python layouts
  'apps',
];

const SIBLING_SKIP = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  '__pycache__',
  '.venv',
  'venv',
  'env',
]);

async function readJsonOrNull(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function listExistingDirs(root: string): Promise<string[]> {
  const found: string[] = [];
  for (const dir of SIBLING_PROBE_DIRS) {
    try {
      const s = await stat(resolve(root, dir));
      if (s.isDirectory()) found.push(dir);
    } catch {
      /* not present */
    }
  }
  return found;
}

async function classifyDir(absolute: string): Promise<{
  kind: SiblingKind;
  signal: string;
} | null> {
  // package.json takes precedence (frontend signals are most specific)
  const pkg = await readJsonOrNull(resolve(absolute, 'package.json'));
  if (pkg) {
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
      ...(pkg.peerDependencies as Record<string, string> | undefined),
    };
    if (deps.expo) return { kind: 'expo', signal: 'package.json has "expo"' };
    if (deps['react-native']) {
      return { kind: 'react-native', signal: 'package.json has "react-native"' };
    }
    if (deps.next) return { kind: 'next', signal: 'package.json has "next"' };
    if (deps.react) return { kind: 'react', signal: 'package.json has "react"' };
  }

  // Django backend signal
  try {
    await stat(resolve(absolute, 'manage.py'));
    return { kind: 'django', signal: 'has manage.py' };
  } catch {
    /* not Django */
  }

  return null;
}

async function inspectCandidates(
  candidateDirs: string[],
  cwdAbs: string,
  configuredAbsRoots: Set<string>,
): Promise<MonorepoSibling[]> {
  const out: MonorepoSibling[] = [];
  for (const abs of candidateDirs) {
    if (configuredAbsRoots.has(abs)) continue;
    if (abs === cwdAbs) continue;
    const name = basename(abs);
    if (name.startsWith('.') || SIBLING_SKIP.has(name)) continue;

    let s;
    try {
      s = await stat(abs);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;

    const cls = await classifyDir(abs);
    if (!cls) continue;

    const topDirs = await listExistingDirs(abs);
    out.push({
      path: relative(cwdAbs, abs) || '.',
      kind: cls.kind,
      signal: cls.signal,
      topDirs,
    });
  }
  return out;
}

/**
 * Detect monorepo siblings — directories adjacent to (or inside) the
 * workspace that look like a separate project but are NOT covered by
 * the current `lore.config.yaml`. Surfaces them as evidence so the
 * bootstrap prompt can ask the LLM to propose `projects:` additions.
 *
 * Looks at:
 *   - immediate children of cwd (turbo-style monorepo at root)
 *   - immediate siblings of cwd (separate-repo style: ../nuri-app)
 */
export async function detectMonorepoSiblings(
  config: LoreConfig,
  cwd: string,
): Promise<MonorepoSibling[]> {
  const cwdAbs = resolve(cwd);
  const configuredAbsRoots = new Set(
    Object.values(config.projects).map((p) => resolve(cwdAbs, p.root)),
  );

  const candidates: string[] = [];

  // children of cwd
  try {
    const children = await readdir(cwdAbs);
    for (const c of children) candidates.push(resolve(cwdAbs, c));
  } catch {
    /* ignore */
  }

  // siblings (cwd's parent's children, minus cwd itself)
  try {
    const parent = resolve(cwdAbs, '..');
    const siblings = await readdir(parent);
    for (const s of siblings) {
      const abs = resolve(parent, s);
      if (abs === cwdAbs) continue;
      candidates.push(abs);
    }
  } catch {
    /* ignore */
  }

  return inspectCandidates(candidates, cwdAbs, configuredAbsRoots);
}

/**
 * One-call workspace bootstrap evidence: projects (configured) + siblings (untracked).
 */
export async function gatherWorkspaceEvidence(
  config: LoreConfig,
  cwd: string,
): Promise<WorkspaceEvidence> {
  const [projects, siblings] = await Promise.all([
    gatherEvidence(config, cwd),
    detectMonorepoSiblings(config, cwd),
  ]);
  return { projects, siblings };
}

function trimList(items: string[], max: number): string {
  if (items.length <= max) return items.join(', ');
  return items.slice(0, max).join(', ') + `, … (+${items.length - max})`;
}

export function renderSiblings(siblings: MonorepoSibling[]): string {
  if (siblings.length === 0) return '';
  const lines: string[] = [
    '# Untracked siblings (NOT in current `lore.config.yaml.projects:`)',
    '',
    '> 동일 모노레포 / 인접 저장소에 존재하는 다른 프로젝트로 보입니다. ' +
      '도메인이 겹친다면 `projects:` 블록에 추가 정의하는 것을 제안하세요.',
    '',
  ];
  for (const s of siblings) {
    const dirsStr = s.topDirs.length > 0 ? ` · 발견된 디렉토리: ${s.topDirs.join(', ')}` : '';
    lines.push(`- **${s.path}/** — ${s.kind} (${s.signal})${dirsStr}`);
  }
  return lines.join('\n');
}

export function renderEvidence(evidence: ProjectEvidence[]): string {
  const lines: string[] = [];

  for (const proj of evidence) {
    lines.push(`## ${proj.key} (${proj.language})`);
    lines.push('');

    if (proj.language === 'python') {
      if (proj.apps.length === 0) {
        lines.push('_(No Django-style apps detected from include globs.)_');
      } else {
        for (const app of proj.apps) {
          const parts: string[] = [];
          if (app.models.length) parts.push(`models: ${trimList(app.models, 8)}`);
          if (app.views.length) parts.push(`views: ${trimList(app.views, 8)}`);
          if (app.services.length) parts.push(`services: ${trimList(app.services, 5)}`);
          lines.push(`- **${app.name}/** — ${parts.join(' | ') || '(empty)'}`);
        }
      }
    } else {
      if (proj.groups.length === 0) {
        lines.push('_(No top-level frontend groups matched.)_');
      } else {
        for (const g of proj.groups) {
          lines.push(`- **${g.group}/** — ${trimList(g.items, 12)}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function buildBootstrapPrompt(workspace: WorkspaceEvidence): string {
  const { projects, siblings } = workspace;
  const hasSiblings = siblings.length > 0;
  const siblingBlock = hasSiblings ? `\n\n${renderSiblings(siblings)}\n` : '';

  const projectsRule = hasSiblings
    ? `6. **Untracked siblings** — Some adjacent projects (above) are not yet in \`lore.config.yaml.projects:\`. ` +
      `If their evidence implies overlapping or complementary domains (e.g., a frontend that consumes the backend's data), ` +
      `propose adding them as a new project entry (\`client\`, \`app\`, \`web\`, etc.) with reasonable include/exclude globs ` +
      `derived from the "발견된 디렉토리" listing. Pick the language (\`python\` or \`typescript\`) from the sibling's kind.`
    : '';

  const fileOneExtras = hasSiblings
    ? `

If untracked siblings warrant new project entries, also include the
\`projects:\` block addition INSIDE the same yaml fence — do not split
into two yaml blocks. Example shape:

\`\`\`yaml
projects:
  server:
    # ... existing block, keep as-is unless it must change ...
  client:                                    # ← new project entry
    root: ../<sibling-relative-path>
    language: typescript
    include:
      - "src/pages/**/*.{ts,tsx}"
      - "src/stores/**/*.ts"
      # ... derived from sibling's 발견된 디렉토리
    exclude:
      - "**/*.test.*"
      - "**/node_modules/**"

domains:
  ...
\`\`\``
    : '';

  return `You are bootstrapping the Lore AI domain map for this workspace.

# Evidence (auto-collected from lore.config.yaml include globs)

${renderEvidence(projects)}${siblingBlock}

# Rules

1. Domain key — English lowercase singular noun (e.g. \`auth\`, \`candidate\`, \`job\`, \`attendance\`).
2. Subdomains — must be words actually present in the evidence above. **No guessing, no invention.**
3. Do NOT include placeholder domains like \`example\`, \`foo\`, \`bar\`.
4. The yaml domain key set MUST exactly match the keys in DOMAIN_MAP.md (no missing, no extra).
5. Use Korean labels (\`label:\`) and English keys.${projectsRule ? '\n' + projectsRule : ''}

# Output — diff-only

## File 1 — \`lore.config.yaml\`

Replace the existing \`domains:\` block (and \`projects:\` block if you are
adding entries per Rule 6):

\`\`\`yaml
domains:
  <key1>:
    label: <한국어 라벨>
    subdomains: [<a>, <b>, <c>]
  <key2>:
    label: ...
    subdomains: [...]
\`\`\`${fileOneExtras}

## File 2 — \`.lore/DOMAIN_MAP.md\` (replace the entire file)

\`\`\`markdown
# 도메인 맵 (L1)

> 프로젝트 전체의 카테고리 지도. \`lore.config.yaml\` 의 \`domains:\` 와 일치 유지.

## <한국어 라벨> (<key1>)
<한 줄 역할/책임 설명>
- <sub> · <sub> · <sub>

## <한국어 라벨> (<key2>)
<한 줄 역할/책임 설명>
- <sub> · <sub> · <sub>
\`\`\`

# Constraints

- Output ONLY the file blocks above. No commentary, no extra prose.
- yaml domain set == DOMAIN_MAP domain set (exact match, same order).
- Korean labels, English keys, lowercase singular.
`;
}

export function buildHeuristicDraft(workspace: WorkspaceEvidence | ProjectEvidence[]): {
  yaml: string;
  domainMap: string;
  projectsAddition?: string;
} {
  const evidence = Array.isArray(workspace) ? workspace : workspace.projects;
  const siblings = Array.isArray(workspace) ? [] : workspace.siblings;
  const candidates = new Map<string, { label: string; subdomains: string[] }>();

  for (const proj of evidence) {
    if (proj.language === 'python') {
      for (const app of proj.apps) {
        const subs: string[] = [];
        if (app.models.length) subs.push('master');
        if (app.services.length) subs.push('service');
        if (app.views.length) subs.push('api');
        candidates.set(app.name, { label: app.name, subdomains: subs });
      }
    } else {
      for (const g of proj.groups) {
        if (g.group === 'pages' || g.group === 'app') continue;
        if (!candidates.has(g.group)) {
          candidates.set(g.group, {
            label: g.group,
            subdomains: g.items.slice(0, 4),
          });
        }
      }
    }
  }

  if (candidates.size === 0) {
    return {
      yaml: 'domains: {}\n',
      domainMap: '# 도메인 맵 (L1)\n\n_No evidence detected — fill manually._\n',
    };
  }

  const sorted = [...candidates.entries()].sort(([a], [b]) => a.localeCompare(b));

  const yamlLines = ['domains:'];
  for (const [key, val] of sorted) {
    yamlLines.push(`  ${key}:`);
    yamlLines.push(`    label: ${val.label}    # TODO: 한국어 라벨로`);
    yamlLines.push(`    subdomains: [${val.subdomains.join(', ')}]    # TODO: 정제`);
  }

  const mapLines = ['# 도메인 맵 (L1)', '', '> `lore.config.yaml` 의 `domains:` 와 일치 유지.', ''];
  for (const [key, val] of sorted) {
    mapLines.push(`## ${val.label} (${key})`);
    mapLines.push('TODO: 한 줄 역할/책임 설명');
    mapLines.push(`- ${val.subdomains.join(' · ') || '(subdomains 채우기)'}`);
    mapLines.push('');
  }

  // Optional projects: addition draft for untracked siblings
  let projectsAddition: string | undefined;
  if (siblings.length > 0) {
    const addLines: string[] = ['# 추가 후보 — `projects:` 블록에 다음 항목 추가 검토:', ''];
    for (const s of siblings) {
      const language: 'python' | 'typescript' = s.kind === 'django' ? 'python' : 'typescript';
      const includeGuess: string[] =
        language === 'typescript'
          ? s.topDirs
              .filter((d) => !d.startsWith('apps'))
              .slice(0, 6)
              .map((d) => `      - "${d}/**/*.{ts,tsx}"`)
          : [
              '      - "**/views.py"',
              '      - "**/views/**/*.py"',
              '      - "**/models.py"',
              '      - "**/models/**/*.py"',
              '      - "**/services/**/*.py"',
            ];

      const slug =
        basename(s.path)
          .replace(/^\.+/, '')
          .replace(/[^a-z0-9]+/gi, '-')
          .toLowerCase() || 'sibling';
      addLines.push(`  ${slug}:`);
      addLines.push(`    root: ${s.path}`);
      addLines.push(`    language: ${language}`);
      addLines.push('    include:');
      if (includeGuess.length === 0) {
        addLines.push('      # TODO: 패턴 채우기');
      } else {
        addLines.push(...includeGuess);
      }
      addLines.push('    exclude:');
      if (language === 'typescript') {
        addLines.push('      - "**/*.test.*"');
        addLines.push('      - "**/node_modules/**"');
      } else {
        addLines.push('      - "**/__init__.py"');
        addLines.push('      - "**/migrations/**"');
        addLines.push('      - "**/tests.py"');
      }
      addLines.push('');
    }
    projectsAddition = addLines.join('\n').trimEnd() + '\n';
  }

  return {
    yaml: yamlLines.join('\n') + '\n',
    domainMap: mapLines.join('\n').trimEnd() + '\n',
    projectsAddition,
  };
}
