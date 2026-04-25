import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export { run } from './cli.js';

/**
 * Read the actual published version from package.json so `lore --version`
 * stays in sync with the npm-published tarball — no manual bumps needed.
 *
 * Resolved at module load:
 *   - In production (npm tarball): dist/cli.js → ../package.json
 *   - In dev / pnpm-link: same relative path holds
 */
function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = resolve(here, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

export const VERSION = readPackageVersion();
