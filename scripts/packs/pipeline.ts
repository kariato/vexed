// SPDX-License-Identifier: GPL-2.0-or-later
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importPack, sha256 } from './import'
import type { ReferencePack } from './import'
import { validatePack } from '../../src/data/validatePack'
import type { RuntimePack } from '../../src/data/types'

export const root = fileURLToPath(new URL('../../', import.meta.url))
export const json = (data: unknown): string => JSON.stringify(data, null, 2) + '\n'
export function artifact(path: string, data: unknown, check: boolean): void {
  const target = resolve(root, path), text = json(data)
  if (check) {
    if (readFileSync(target, 'utf8') !== text) throw new Error('Generated artifact is stale: ' + path)
  } else { mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, text) }
}
export function readPinnedPacks(sourceDir = resolve(root, 'tests/fixtures/source/packs')): ReferencePack[] {
  const manifest = JSON.parse(readFileSync(resolve(root, 'docs/compatibility/source-manifest.json'), 'utf8')) as {
    sourceFiles: { path: string; sha256: string }[]
  }
  const expected = manifest.sourceFiles.filter(f => /^levelpacks\/[^/]+\.(ini|pdb)$/.test(f.path))
    .map(file => ({ filename: file.path.slice('levelpacks/'.length), sha256: file.sha256 }))
    .sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0)
  const actual = readdirSync(sourceDir).filter(name => /\.(ini|pdb)$/i.test(name)).sort()
  if (json(actual) !== json(expected.map(f => f.filename))) throw new Error('Source pack inventory differs from the pinned Phase 0 manifest')
  const native = JSON.parse(readFileSync(resolve(root, 'docs/compatibility/pack-audit.json'), 'utf8')) as { packs: { file: string; levels: number }[] }
  return expected.map(({ filename, sha256: expectedHash }) => {
    const data = readFileSync(resolve(sourceDir, filename))
    if (sha256(data) !== expectedHash) throw new Error(filename + ': source SHA-256 mismatch')
    const pack = importPack(data, filename)
    if (pack.levels.length !== native.packs.find(entry => entry.file === filename)?.levels) throw new Error(filename + ': level count differs from native audit')
    return pack
  })
}
export interface SourceVariant {
  levelId: string; iniSourceSha256: string; pdbSourceSha256: string
  iniSolutionSha256: string; pdbSolutionSha256: string; iniPar: number; pdbPar: number; reason: string
}
export const sourceVariants = (): SourceVariant[] => (JSON.parse(readFileSync(resolve(root, 'docs/compatibility/source-variants.json'), 'utf8')) as { exceptions: SourceVariant[] }).exceptions
const extraProperties = (level: ReferencePack['levels'][number]): unknown => Object.fromEntries(
  Object.entries(level.properties).filter(([key]) => !['board', 'title', 'solution'].includes(key)),
)
export function canonicalPacks(packs: readonly ReferencePack[], exceptions = sourceVariants()): ReferencePack[] {
  const canonical = packs.filter(pack => pack.source.format === 'pdb')
  if (new Set(canonical.map(pack => pack.id)).size !== canonical.length) throw new Error('Duplicate canonical pack ID')
  const used = new Set<string>()
  for (const ini of packs.filter(pack => pack.source.format === 'ini')) {
    const pdb = canonical.find(pack => pack.id === ini.id)
    if (!pdb) throw new Error(ini.source.filename + ': missing PDB counterpart')
    if (json(ini.general) !== json(pdb.general) || ini.levels.length !== pdb.levels.length) throw new Error(ini.id + ': unexpected metadata or level count discrepancy')
    for (const [index, left] of ini.levels.entries()) {
      const right = pdb.levels[index]!
      if (json(left.rows) !== json(right.rows) || left.title !== right.title || left.rawBoard !== right.rawBoard
        || json(extraProperties(left)) !== json(extraProperties(right))) throw new Error(left.id + ': unexpected board/title/property discrepancy')
      if (left.encodedSolution !== right.encodedSolution || left.par !== right.par) {
        const exception = exceptions.find(item => item.levelId === left.id)
        if (!exception || ini.source.sha256 !== exception.iniSourceSha256 || pdb.source.sha256 !== exception.pdbSourceSha256
          || sha256(left.encodedSolution ?? '') !== exception.iniSolutionSha256 || sha256(right.encodedSolution ?? '') !== exception.pdbSolutionSha256
          || left.par !== exception.iniPar || right.par !== exception.pdbPar) throw new Error(left.id + ': unexplained reference solution discrepancy')
        used.add(left.id)
      }
    }
  }
  if (used.size !== exceptions.length) throw new Error('Unused or duplicate source-variant exception')
  return canonical
}
export function classicRuntime(packs: readonly ReferencePack[]): RuntimePack {
  const classic = packs.find(pack => pack.id === 'classic' && pack.source.format === 'ini')
  if (!classic) throw new Error('Missing pinned Classic INI')
  const provenance = JSON.parse(readFileSync(resolve(root, 'docs/compatibility/classic-provenance.json'), 'utf8')) as {
    sourceFiles: Record<string, string>; matchedLevelIndices: number[]; mismatches: unknown[]
  }
  if (provenance.mismatches.length || json(provenance.matchedLevelIndices) !== json(classic.levels.map(level => level.index))) throw new Error('Classic board provenance does not cover every level')
  return validatePack({
    schemaVersion: 1, id: 'classic', name: 'Classic', author: classic.general.author,
    license: 'GPL-2.0-or-later',
    boardSource: { file: 'Vexed 1.3 globals.c', sha256: provenance.sourceFiles['globals.c'] },
    levels: classic.levels.map(level => ({ id: level.id, index: level.index, title: 'Level ' + (level.index + 1), rows: level.rows, par: level.par })),
  })
}
export function generate(check: boolean, sourceDir?: string): void {
  const packs = readPinnedPacks(sourceDir), canonical = canonicalPacks(packs), runtime = classicRuntime(packs)
  const runtimeText = json(runtime)
  artifact('tests/fixtures/packs/reference-catalogue.json', { schemaVersion: 1, usage: 'development-only original reference data; not a runtime asset', packs: canonical }, check)
  artifact('public/packs/classic.json', runtime, check)
  artifact('public/packs/manifest.json', { schemaVersion: 1, packs: [{
    id: runtime.id, name: runtime.name, file: 'classic.json', levels: runtime.levels.length, sha256: sha256(runtimeText),
  }] }, check)
  const report = {
    schemaVersion: 1,
    totals: { sourceFiles: packs.length, iniPacks: packs.filter(pack => pack.source.format === 'ini').length,
      pdbPacks: canonical.length, sourceLevelEntries: packs.reduce((sum, pack) => sum + pack.levels.length, 0),
      canonicalPacks: canonical.length, canonicalLevelEntries: canonical.reduce((sum, pack) => sum + pack.levels.length, 0),
      equivalentIniPdbPairs: packs.length - canonical.length - new Set(sourceVariants().map(item => item.levelId.split(':')[0])).size, documentedSourceVariants: sourceVariants().length, runtimePacks: 1, runtimeLevels: runtime.levels.length },
    sources: packs.map(pack => ({ ...pack.source, id: pack.id, levels: pack.levels.length })),
    documentedSourceVariants: sourceVariants(),
    generated: { runtimeSha256: sha256(runtimeText), referenceCatalogueSha256: sha256(json({ schemaVersion: 1, usage: 'development-only original reference data; not a runtime asset', packs: canonical })) },
    failures: [],
  }
  artifact('docs/compatibility/conversion-report.json', report, check)
  console.log(JSON.stringify(report.totals))
}
