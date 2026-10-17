// SPDX-License-Identifier: GPL-2.0-or-later
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { artifact, canonicalPacks, readPinnedPacks, root } from './packs/pipeline'
import { replayPack } from './packs/replay'
import type { EmptyMoveException } from './packs/replay'
try {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--check')) throw new Error('Only --check is supported')
  const sources = readPinnedPacks()
  canonicalPacks(sources)
  const exceptions = (JSON.parse(readFileSync(resolve(root, 'docs/compatibility/source-variants.json'), 'utf8')) as { replayExceptions: EmptyMoveException[] }).replayExceptions
  const packs = sources.map(pack => replayPack(pack, exceptions))
  const actualLegacy = packs.flatMap(pack => pack.legacyEmptyMoves.map(move => move.levelId + ':' + move.step + ':' + pack.sourceSha256)).sort()
  const expectedLegacy = exceptions.flatMap(item => item.sourceSha256.map(hash => item.levelId + ':' + item.step + ':' + hash)).sort()
  if (JSON.stringify(actualLegacy) !== JSON.stringify(expectedLegacy)) throw new Error('Unused, duplicated or unmatched legacy move exception')
  const report = {
    schemaVersion: 1, engineRules: 'palm-2.2-v1',
    method: 'TypeScript applyCommand replay; original reference moves; no animation, browser or native C harness',
    totals: {
      sourcePacks: packs.length, sourceLevelEntries: packs.reduce((sum, pack) => sum + pack.levels, 0),
      replaysPassed: packs.reduce((sum, pack) => sum + pack.passed, 0), atomicSteps: packs.reduce((sum, pack) => sum + pack.steps, 0),
      missingSolutions: packs.reduce((sum, pack) => sum + pack.missingSolutions, 0),
      legacyEmptyMoves: actualLegacy.length,
      failures: packs.reduce((sum, pack) => sum + pack.failures.length, 0),
    },
    packs,
  }
  artifact('docs/compatibility/typescript-pack-audit.json', report, args.includes('--check'))
  console.log(JSON.stringify(report.totals))
  if (report.totals.failures) process.exitCode = 1
} catch (error) {
  console.error(JSON.stringify({ stage: 'reference replay', failures: [String(error)] }))
  process.exitCode = 1
}
