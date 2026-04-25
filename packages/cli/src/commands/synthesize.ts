import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import {
  loadConfig,
  extractAll,
  groupByCategory,
  buildSynthesizePrompt,
} from '@lore-ai/core';
import type { Annotation, ProjectConfig } from '@lore-ai/core';
import { log } from '../util/log.js';

interface SynthesizeOptions {
  apply?: boolean;
  since?: string;
}

async function gatherFilesFor(project: ProjectConfig, cwd: string): Promise<string[]> {
  return fastGlob(project.include, {
    cwd: resolve(cwd, project.root),
    ignore: project.exclude ?? [],
    absolute: true,
  });
}

export async function synthesizeCommand(category: string, options: SynthesizeOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  if (!config.domains[category]) {
    log.error(`Unknown category "${category}". Add it under \`domains:\` in lore.config.yaml.`);
    process.exitCode = 1;
    return;
  }

  const all: Annotation[] = [];
  for (const key of Object.keys(config.projects)) {
    const project = config.projects[key];
    if (!project) continue;
    const files = await gatherFilesFor(project, cwd);
    all.push(...(await extractAll({ files, language: project.language, cwd })));
  }
  const grouped = groupByCategory(all);
  const annotations = grouped.get(category) ?? [];
  if (annotations.length === 0) {
    log.warn(`No annotations found for category "${category}".`);
    return;
  }

  let existingBody: string | undefined;
  const flowPath = resolve(cwd, config.flows.dir, `${category}.md`);
  try {
    existingBody = await readFile(flowPath, 'utf8');
  } catch {
    /* first time */
  }

  const prompt = buildSynthesizePrompt({ category, annotations, config, existingBody });

  if (!options.apply) {
    process.stdout.write(prompt + '\n');
    log.divider();
    log.hint('Copy the prompt above into Claude Code, paste the response back into');
    log.hint(`  ${flowPath}`);
    log.hint('or run again with --apply once API support lands.');
    return;
  }

  log.warn('--apply mode requires Anthropic SDK wiring (planned for v0.2). Showing prompt instead.');
  process.stdout.write(prompt + '\n');
}
