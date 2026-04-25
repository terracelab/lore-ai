import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import fastGlob from 'fast-glob';
import {
  loadConfig,
  extractAll,
  groupByCategory,
  buildSynthesizePrompt,
  buildSynthesizeAllPrompt,
} from '@lore-ai-automation/core';
import type {
  Annotation,
  ProjectConfig,
  SynthesizeAllCategoryInput,
} from '@lore-ai-automation/core';
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

async function readExistingFlow(cwd: string, flowsDir: string, category: string) {
  try {
    return await readFile(resolve(cwd, flowsDir, `${category}.md`), 'utf8');
  } catch {
    return undefined;
  }
}

async function gatherAllAnnotations(cwd: string, projects: Record<string, ProjectConfig>) {
  const all: Annotation[] = [];
  for (const key of Object.keys(projects)) {
    const project = projects[key];
    if (!project) continue;
    const files = await gatherFilesFor(project, cwd);
    all.push(...(await extractAll({ files, language: project.language, cwd })));
  }
  return all;
}

export async function synthesizeCommand(
  category: string | undefined,
  options: SynthesizeOptions,
): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  const all = await gatherAllAnnotations(cwd, config.projects);
  const grouped = groupByCategory(all);

  if (category) {
    if (!config.domains[category]) {
      log.error(`Unknown category "${category}". Add it under \`domains:\` in lore.config.yaml.`);
      process.exitCode = 1;
      return;
    }
    const annotations = grouped.get(category) ?? [];
    if (annotations.length === 0) {
      log.warn(`No annotations found for category "${category}".`);
      return;
    }
    const flowPath = resolve(cwd, config.flows.dir, `${category}.md`);
    const existingBody = await readExistingFlow(cwd, config.flows.dir, category);
    const prompt = buildSynthesizePrompt({ category, annotations, config, existingBody });

    if (!options.apply) {
      process.stdout.write(prompt + '\n');
      log.divider();
      log.hint('Copy the prompt above into Claude Code, paste the response back into');
      log.hint(`  ${flowPath}`);
      log.hint('or run again with --apply once API support lands.');
      return;
    }

    log.warn(
      '--apply mode requires Anthropic SDK wiring (planned for v0.2). Showing prompt instead.',
    );
    process.stdout.write(prompt + '\n');
    return;
  }

  const categories: SynthesizeAllCategoryInput[] = [];
  const skipped: string[] = [];
  for (const slug of Object.keys(config.domains)) {
    const annotations = grouped.get(slug) ?? [];
    if (annotations.length === 0) {
      skipped.push(slug);
      continue;
    }
    const existingBody = await readExistingFlow(cwd, config.flows.dir, slug);
    categories.push({ category: slug, annotations, existingBody });
  }

  if (categories.length === 0) {
    log.warn('No categories have any annotations yet — run `lore sync` after annotating code.');
    return;
  }

  const prompt = buildSynthesizeAllPrompt({
    categories,
    config,
    flowsDir: config.flows.dir,
  });

  if (!options.apply) {
    process.stdout.write(prompt + '\n');
    log.divider();
    log.info(
      `Built one prompt covering ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}.`,
    );
    if (skipped.length) {
      log.hint(`Skipped (no annotations): ${skipped.join(', ')}`);
    }
    log.hint('Paste into Claude Code — it can write each .lore/flows/<cat>.md directly.');
    log.hint(
      `Or paste into a chat LLM and split by '=== FILE: ${join(config.flows.dir, '<cat>.md')} ===' markers.`,
    );
    log.hint('Run again with --apply once API support lands.');
    return;
  }

  log.warn(
    '--apply mode requires Anthropic SDK wiring (planned for v0.2). Showing prompt instead.',
  );
  process.stdout.write(prompt + '\n');
}
