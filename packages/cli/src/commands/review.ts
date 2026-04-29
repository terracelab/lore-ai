import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import {
  loadConfig,
  extractAll,
  groupByCategory,
  buildReviewPrompt,
} from '@lore-ai-automation/core';
import type { Annotation, ProjectConfig } from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface ReviewOptions {
  apply?: boolean;
}

async function gatherFilesFor(project: ProjectConfig, cwd: string): Promise<string[]> {
  return fastGlob(project.include, {
    cwd: resolve(cwd, project.root),
    ignore: project.exclude ?? [],
    absolute: true,
  });
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

async function readFlow(cwd: string, flowsDir: string, category: string) {
  try {
    return await readFile(resolve(cwd, flowsDir, `${category}.md`), 'utf8');
  } catch {
    return undefined;
  }
}

export async function reviewCommand(category: string, options: ReviewOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  if (!config.domains[category]) {
    log.error(`Unknown category "${category}". Add it under \`domains:\` in lore.config.yaml.`);
    process.exitCode = 1;
    return;
  }

  const existingBody = await readFlow(cwd, config.flows.dir, category);
  if (!existingBody) {
    log.error(
      `No flow file found at ${config.flows.dir}/${category}.md — run \`lore synthesize ${category}\` first.`,
    );
    process.exitCode = 1;
    return;
  }

  const all = await gatherAllAnnotations(cwd, config.projects);
  const grouped = groupByCategory(all, config.domains);
  const annotations = grouped.get(category) ?? [];

  if (annotations.length === 0) {
    log.warn(`No annotations found for "${category}" — review will rely on existing body alone.`);
  }

  const prompt = buildReviewPrompt({ category, annotations, config, existingBody });

  if (!options.apply) {
    process.stdout.write(prompt + '\n');
    log.divider();
    log.info(
      `[${category}] review prompt built (${annotations.length} annotation(s), ${existingBody.length} byte body).`,
    );
    log.hint('Paste this prompt into Claude Code (or another agent with file-read tools).');
    log.hint('The agent will open the source files cited in §4 and either:');
    log.hint(`  • directly edit ${config.flows.dir}/${category}.md (in agent mode), or`);
    log.hint('  • return a Review report you can apply manually (prompt mode).');
    log.hint('Run again with --apply once API support lands.');
    return;
  }

  log.warn(
    '--apply mode requires Anthropic SDK wiring (planned alongside synthesize --apply). Showing prompt instead.',
  );
  process.stdout.write(prompt + '\n');
}
