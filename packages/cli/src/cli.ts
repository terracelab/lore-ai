import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { bootstrapCommand } from './commands/bootstrap.js';
import { checkCommand } from './commands/check.js';
import { syncCommand } from './commands/sync.js';
import { synthesizeCommand } from './commands/synthesize.js';
import { publishCommand } from './commands/publish.js';
import { chatCommand } from './commands/chat.js';
import { VERSION } from './index.js';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('lore')
    .description('Lore AI — living business-logic documentation for AI-assisted dev teams')
    .version(VERSION)
    .showHelpAfterError();

  program
    .command('init')
    .description('Initialize lore.config.yaml + flows scaffold in the current workspace')
    .option('--template <name>', 'starter template (django-expo | nextjs | custom)', 'custom')
    .option('-y, --yes', 'accept all defaults')
    .action(initCommand);

  program
    .command('bootstrap')
    .description('Build a domain-map prompt (or heuristic draft) from your codebase')
    .option('--apply', 'directly call the LLM API and write the result (v0.2)')
    .option('--heuristic-only', 'skip the LLM and emit a static draft from folder structure')
    .option('--out <path>', 'write the prompt to a file instead of stdout')
    .action(bootstrapCommand);

  program
    .command('check [files...]')
    .description('Validate annotations on the given files (precommit entrypoint)')
    .option('--json', 'emit machine-readable output')
    .option('--no-color', 'disable color output')
    .action(checkCommand);

  program
    .command('sync')
    .description('Scan the workspace and regenerate .lore/draft/*.md (raw L3 facts)')
    .option('--project <name>', 'limit to a single project key from lore.config.yaml')
    .option('--dry-run', 'print planned writes without touching disk')
    .action(syncCommand);

  program
    .command('synthesize [category]')
    .description('Refresh changed L2 flow(s) — skips categories whose drafts are unchanged')
    .option('--apply', 'call the LLM API directly and overwrite the flow file')
    .option('--since <range>', 'limit to commits in this range (e.g. 2.weeks)')
    .option('--force', 'ignore the synth cache and re-synthesize all categories')
    .action(synthesizeCommand);

  program
    .command('publish')
    .description('Push generated .lore/flows to a Lore Board target (path or git URL)')
    .option('--target <path>', 'override publish.target from config')
    .option('--mode <mode>', 'direct | pr', 'direct')
    .option('--branch <name>', 'branch to push to', 'main')
    .option('--dry-run', 'print plan without writing or pushing')
    .action(publishCommand);

  program
    .command('chat')
    .description('Local RAG REPL over L1 + L2 + L3 (Anthropic / OpenAI key required)')
    .option('--provider <name>', 'anthropic | openai')
    .action(chatCommand);

  return program;
}

export async function run(argv: string[] = process.argv): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}

const invokedDirectly =
  !!process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  run().catch((err) => {
    if (err instanceof Error) {
      console.error(`✗ ${err.message}`);
      if (process.env.LORE_DEBUG) console.error(err.stack);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}
