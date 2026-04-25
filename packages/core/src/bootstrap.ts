import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
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

function trimList(items: string[], max: number): string {
  if (items.length <= max) return items.join(', ');
  return items.slice(0, max).join(', ') + `, … (+${items.length - max})`;
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

export function buildBootstrapPrompt(evidence: ProjectEvidence[]): string {
  return `You are bootstrapping the Lore AI domain map for this workspace.

# Evidence (auto-collected from lore.config.yaml include globs)

${renderEvidence(evidence)}

# Rules

1. Domain key — English lowercase singular noun (e.g. \`auth\`, \`candidate\`, \`job\`, \`attendance\`).
2. Subdomains — must be words actually present in the evidence above. **No guessing, no invention.**
3. Do NOT include placeholder domains like \`example\`, \`foo\`, \`bar\`.
4. The yaml domain key set MUST exactly match the keys in DOMAIN_MAP.md (no missing, no extra).
5. Use Korean labels (\`label:\`) and English keys.

# Output — diff-only, two file blocks

## File 1 — \`lore.config.yaml\` (replace the entire \`domains:\` block)

\`\`\`yaml
domains:
  <key1>:
    label: <한국어 라벨>
    subdomains: [<a>, <b>, <c>]
  <key2>:
    label: ...
    subdomains: [...]
\`\`\`

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

- Output ONLY the two file blocks above. No commentary, no extra prose.
- yaml domain set == DOMAIN_MAP domain set (exact match, same order).
- Korean labels, English keys, lowercase singular.
`;
}

export function buildHeuristicDraft(evidence: ProjectEvidence[]): {
  yaml: string;
  domainMap: string;
} {
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

  const mapLines = [
    '# 도메인 맵 (L1)',
    '',
    '> `lore.config.yaml` 의 `domains:` 와 일치 유지.',
    '',
  ];
  for (const [key, val] of sorted) {
    mapLines.push(`## ${val.label} (${key})`);
    mapLines.push('TODO: 한 줄 역할/책임 설명');
    mapLines.push(`- ${val.subdomains.join(' · ') || '(subdomains 채우기)'}`);
    mapLines.push('');
  }

  return {
    yaml: yamlLines.join('\n') + '\n',
    domainMap: mapLines.join('\n').trimEnd() + '\n',
  };
}
