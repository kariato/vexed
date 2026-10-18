import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
export default defineConfig({ plugins: [react()], define: { 'import.meta.env.VEXED_VERSION': JSON.stringify(version) }, base: process.env.VITE_BASE_PATH ?? '/' })
