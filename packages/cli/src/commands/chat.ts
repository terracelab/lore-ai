import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from '@lore-ai-automation/core';
import { log } from '../util/log.js';

interface ChatOptions {
  provider?: 'anthropic' | 'openai';
}

const SYSTEM_INSTRUCTION = [
  '당신은 이 프로젝트의 비즈니스 로직 어시스턴트입니다.',
  '아래 도메인 맵(L1)과 플로우 문서(L2/L3)에 기반해 한국어로 간결히 답하세요.',
  '플로우를 인용할 때는 파일 경로를 함께 표기하고, 근거가 없으면 추측 대신 "문서에 기록 없음"이라 답하세요.',
].join('\n');

async function loadLoreContext(cwd: string, flowsDir: string): Promise<string> {
  const parts: string[] = [];

  const domainMapPath = resolve(cwd, '.lore/DOMAIN_MAP.md');
  if (existsSync(domainMapPath)) {
    parts.push('# L1 — DOMAIN MAP\n\n' + (await readFile(domainMapPath, 'utf8')));
  }

  const flowsPath = resolve(cwd, flowsDir);
  if (existsSync(flowsPath)) {
    const entries = await readdir(flowsPath, { recursive: true, withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => join(e.parentPath ?? flowsPath, e.name));
    files.sort();
    for (const f of files) {
      const rel = f.replace(cwd + '/', '');
      const content = await readFile(f, 'utf8');
      parts.push(`# ${rel}\n\n${content}`);
    }
  }

  return parts.join('\n\n---\n\n');
}

export async function chatCommand(options: ChatOptions): Promise<void> {
  const cwd = process.cwd();
  const { config } = await loadConfig(cwd);

  const provider = options.provider ?? config.llm.provider;
  if (provider !== 'anthropic') {
    log.error(`Provider "${provider}" is not yet supported. Use --provider anthropic.`);
    process.exitCode = 1;
    return;
  }

  const envName = config.llm.apiKeyEnv;
  const apiKey = process.env[envName];
  if (!apiKey) {
    log.error(`Env var ${envName} is not set.`);
    log.hint(`Run: export ${envName}="sk-ant-..."`);
    process.exitCode = 1;
    return;
  }
  if (apiKey.startsWith('sk-ant-') === false) {
    log.warn(`${envName} value does not look like an Anthropic key. Continuing anyway.`);
  }

  const context = await loadLoreContext(cwd, config.flows.dir);
  if (!context) {
    log.warn(
      'No .lore content found — running without project context. Run `lore sync` first for richer answers.',
    );
  } else {
    log.info(`Loaded ${context.length.toLocaleString()} chars of project context (cached).`);
  }

  log.info(
    `Lore chat — model=${config.llm.model}. Type "exit" to quit, blank line to abort current input.`,
  );
  log.divider();

  const client = new Anthropic({ apiKey });
  const history: Anthropic.MessageParam[] = [];
  const rl = readline.createInterface({ input, output });

  const systemBlocks: Anthropic.TextBlockParam[] = [{ type: 'text', text: SYSTEM_INSTRUCTION }];
  if (context) {
    systemBlocks.push({
      type: 'text',
      text: context,
      cache_control: { type: 'ephemeral' },
    });
  }

  try {
    while (true) {
      let userInput: string;
      try {
        userInput = (await rl.question('\n› ')).trim();
      } catch {
        break;
      }
      if (!userInput) continue;
      if (userInput === 'exit' || userInput === 'quit') break;

      history.push({ role: 'user', content: userInput });

      output.write('\n');
      let assistantText = '';
      try {
        const stream = client.messages.stream({
          model: config.llm.model,
          max_tokens: 4096,
          system: systemBlocks,
          messages: history,
        });
        stream.on('text', (text) => {
          output.write(text);
          assistantText += text;
        });
        await stream.finalMessage();
      } catch (err) {
        output.write('\n');
        log.error(`API error: ${err instanceof Error ? err.message : String(err)}`);
        history.pop();
        continue;
      }
      output.write('\n');

      history.push({ role: 'assistant', content: assistantText });
    }
  } finally {
    rl.close();
  }

  log.info('bye.');
}
