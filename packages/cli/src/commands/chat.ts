import { log } from '../util/log.js';

interface ChatOptions {
  provider?: 'anthropic' | 'openai';
}

export async function chatCommand(_options: ChatOptions): Promise<void> {
  log.warn('`lore chat` is reserved for v0.2 — Anthropic SDK + prompt caching wiring pending.');
  log.hint('Workaround: copy the output of `lore synthesize <category>` into Claude Code.');
}
