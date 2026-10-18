// SPDX-License-Identifier: GPL-2.0-or-later
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const { version } = JSON.parse(readFileSync(here('../package.json'), 'utf8')) as { version: string }
export default defineConfig({
  root: here('./'), base: './', publicDir: here('../public'),
  define: { 'import.meta.env.VEXED_VERSION': JSON.stringify(version) },
  plugins: [react(), {
    name: 'itch-content-policy',
    transformIndexHtml: () => [{ tag: 'meta', attrs: {
      'http-equiv': 'Content-Security-Policy',
      content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'",
    }, injectTo: 'head' }],
  }],
  resolve: { alias: [{ find: './App', replacement: here('./App.tsx') }] },
  build: { outDir: here('./dist'), emptyOutDir: true },
})
