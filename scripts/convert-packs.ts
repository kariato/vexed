// SPDX-License-Identifier: GPL-2.0-or-later
import { resolve } from 'node:path'
import { generate } from './packs/pipeline'
const args = process.argv.slice(2)
try {
  for (const arg of args) if (arg !== '--check' && !arg.startsWith('--source-dir=')) throw new Error('Unknown argument: ' + arg)
  const source = args.find(arg => arg.startsWith('--source-dir='))?.slice('--source-dir='.length)
  generate(args.includes('--check'), source === undefined ? undefined : resolve(source))
} catch (error) {
  console.error(JSON.stringify({ stage: 'conversion', failures: [String(error)] }))
  process.exitCode = 1
}
