import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/config.ts',
    'src/parser.ts',
    'src/checker.ts',
    'src/markdown.ts',
    'src/extractor.ts',
    'src/prompts.ts',
    'src/bootstrap.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
});
