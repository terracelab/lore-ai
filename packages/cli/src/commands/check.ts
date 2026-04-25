import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import fastGlob from 'fast-glob';
import { loadConfig, parseFile, checkAnnotations, formatIssues } from '@lore-ai/core';
import type { Annotation, Language } from '@lore-ai/core';
import { log } from '../util/log.js';

interface CheckOptions {
  json?: boolean;
}

function languageOf(file: string): Language | null {
  const ext = extname(file).toLowerCase();
  if (ext === '.py') return 'python';
  if (ext === '.ts' || ext === '.tsx') return 'typescript';
  return null;
}

export async function checkCommand(files: string[], options: CheckOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  // No args → scan all configured projects
  if (files.length === 0) {
    const collected: string[] = [];
    for (const project of Object.values(config.projects)) {
      const root = resolve(cwd, project.root);
      const matched = await fastGlob(project.include, {
        cwd: root,
        ignore: project.exclude ?? [],
        absolute: true,
        dot: false,
      });
      collected.push(...matched);
    }
    files = collected;
    if (!options.json) {
      log.info(`Scanning ${files.length} file(s) across configured projects…`);
    }
  }

  const annotations: Annotation[] = [];
  for (const f of files) {
    const lang = languageOf(f);
    if (!lang) continue;
    let src: string;
    try {
      src = await readFile(resolve(cwd, f), 'utf8');
    } catch {
      log.warn(`Could not read ${f} — skipping.`);
      continue;
    }
    annotations.push(...parseFile(f, src, lang));
  }

  const issues = checkAnnotations(annotations, config);

  if (options.json) {
    process.stdout.write(JSON.stringify({ issues }, null, 2) + '\n');
  } else {
    process.stdout.write(formatIssues(issues) + '\n');
  }

  if (issues.some((i) => i.severity === 'error')) {
    process.exitCode = 1;
  }
}
