// SPDX-License-Identifier: GPL-2.0-or-later
import { createBoard } from '../domain/board'
import type { PackManifest, RuntimePack } from './types'
export const validPackId = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object')
  return value as Record<string, unknown>
}
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const hash = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
export function validatePack(input: unknown): RuntimePack {
  const pack = record(input)
  if (pack.schemaVersion !== 1) throw new Error('Unsupported pack schemaVersion')
  if (!validPackId(pack.id) || !nonempty(pack.name) || !nonempty(pack.author) || pack.license !== 'GPL-2.0-or-later') throw new Error('Invalid pack metadata')
  const source = record(pack.boardSource)
  if (!nonempty(source.file) || !hash(source.sha256)) throw new Error('Invalid board provenance')
  if (!Array.isArray(pack.levels) || !pack.levels.length || pack.levels.length > 10000) throw new Error('Invalid pack levels')
  const ids = new Set<string>()
  for (const [index, raw] of pack.levels.entries()) {
    const level = record(raw)
    if (level.index !== index || level.id !== pack.id + ':' + index || !nonempty(level.title)) throw new Error('Invalid level identity at index ' + index)
    if (ids.has(level.id as string)) throw new Error('Duplicate level ID')
    ids.add(level.id as string)
    if (level.par !== null && (!Number.isSafeInteger(level.par) || (level.par as number) < 0)) throw new Error('Invalid par at level ' + index)
    if (!Array.isArray(level.rows) || !level.rows.every(row => typeof row === 'string')) throw new Error('Invalid rows at level ' + index)
    try { createBoard(level.rows as string[]) }
    catch (error) { throw new Error('Invalid board at level ' + index + ': ' + String(error)) }
  }
  // Own the JSON boundary so callers cannot invalidate a validated pack by alias.
  return structuredClone(input) as RuntimePack
}
export function validateManifest(input: unknown): PackManifest {
  const manifest = record(input)
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.packs)) throw new Error('Invalid pack manifest')
  const ids = new Set<string>()
  for (const raw of manifest.packs) {
    const pack = record(raw)
    if (!validPackId(pack.id) || ids.has(pack.id) || pack.file !== pack.id + '.json' || !nonempty(pack.name)
      || !Number.isSafeInteger(pack.levels) || (pack.levels as number) < 1 || !hash(pack.sha256)) throw new Error('Invalid manifest entry')
    ids.add(pack.id)
  }
  return structuredClone(input) as PackManifest
}
