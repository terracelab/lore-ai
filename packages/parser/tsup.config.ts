import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/python.ts', 'src/typescript.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
});
