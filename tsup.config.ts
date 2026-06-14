import { defineConfig } from 'tsup';
import { writeFileSync, readFileSync } from 'node:fs';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  shims: true,
  onSuccess: async () => {
    // Prepend shebang to the built file for global CLI usage
    const filePath = 'dist/cli.js';
    const content = readFileSync(filePath, 'utf-8');
    writeFileSync(filePath, `#!/usr/bin/env node\n${content}`);
  },
});
