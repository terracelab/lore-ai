import { cpSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const here = dirname(fileURLToPath(import.meta.url));
const monorepoTemplates = resolve(here, '..', '..', 'templates');
const localTemplates = resolve(here, 'templates');

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
  banner: { js: '#!/usr/bin/env node' },
  /**
   * Copy monorepo-root `templates/` into `packages/cli/templates/` so that
   * the published npm tarball contains them (referenced via `files:` and
   * loaded at runtime via `__dirname/../templates` from `dist/cli.js`).
   * Idempotent — full overwrite each build.
   */
  onSuccess: async () => {
    rmSync(localTemplates, { recursive: true, force: true });
    cpSync(monorepoTemplates, localTemplates, { recursive: true });
    // eslint-disable-next-line no-console
    console.log(`✓ Bundled templates → ${localTemplates}`);
  },
});
