/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

// GitHub Pages serves this project site under /Emberwing/, so the built asset
// URLs need that base. Locally (dev/preview) we serve from root.
const base = process.env.GITHUB_ACTIONS ? '/Emberwing/' : '/';

export default defineConfig({
  base,
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    // All unit-tested logic is pure (no DOM/WebGL), so the fast node env is enough.
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
