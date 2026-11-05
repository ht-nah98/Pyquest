import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  // GitHub Pages serves the app under /Pyquest/ (deploy job in .github/workflows/ci.yml); everything else under /.
  base: process.env['PQ_BASE'] ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@content': `${repoRoot}content` },
  },
  // Pyodide loads its own wasm and stdlib from /pyodide/ (ADR 0002); Vite must not pre-bundle it.
  optimizeDeps: { exclude: ['pyodide'] },
  worker: { format: 'es' },
  server: { fs: { allow: [repoRoot] } },
});
