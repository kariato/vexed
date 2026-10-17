// SPDX-License-Identifier: GPL-2.0-or-later
// Format audited against Palm pack.c, ini.c and vexpdb/main.cpp (see Phase 0).
import { createHash } from 'node:crypto'
import { createBoard } from '../../src/domain/board'
import { decodeReferenceSolution } from '../../src/domain/solutionCodec'

export interface Property { value: string; location: string }
export interface Section { name: string; location: string; properties: Record<string, Property> }
export interface ReferenceLevel {
  id: string; index: number; title: string | null; rows: string[]; par: number | null
  encodedSolution: string | null; rawBoard: string; location: string; properties: Record<string, string>
}
export interface ReferencePack {
  schemaVersion: 1; id: string; name: string; general: Record<string, string>
  source: { filename: string; sha256: string; format: 'ini' | 'pdb' }
  levels: ReferenceLevel[]
}
export const sha256 = (data: Uint8Array | string): string => createHash('sha256').update(data).digest('hex')
function fail(context: string, message: string): never { throw new Error(context + ': ' + message) }
function addProperty(section: Section, key: string, value: string, location: string): void {
  key = key.toLowerCase()
  if (Object.hasOwn(section.properties, key)) fail(location, 'duplicate property ' + key)
  section.properties[key] = { value, location }
}
export function parseIni(text: string, filename: string): Section[] {
  const sections: Section[] = []
  let section: Section | undefined
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const line = raw.trim(), location = filename + ':line ' + (index + 1)
    if (!line || line.startsWith(';')) continue
    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header) {
      section = { name: header[1]!, location, properties: Object.create(null) as Record<string, Property> }
      sections.push(section)
      continue
    }
    const equals = line.indexOf('=')
    if (!section || equals < 1) fail(location, 'expected a section or key=value')
    const key = line.slice(0, equals).trim()
    if (!key) fail(location, 'empty property name')
    addProperty(section, key, line.slice(equals + 1).trim(), location)
  }
  return sections
}
export function parsePdb(data: Buffer, filename: string): Section[] {
  if (data.length < 78) fail(filename, 'truncated PDB header')
  if (data.readUInt16BE(32) & 1) fail(filename, 'resource databases are not level packs')
  if (data.toString('ascii', 60, 64) !== 'DATA' || data.toString('ascii', 64, 68) !== 'Vexd') fail(filename, 'expected DATA/Vexd database')
  if (data.readUInt32BE(72) !== 0) fail(filename, 'chained PDB record lists are unsupported')
  const count = data.readUInt16BE(76), tableEnd = 78 + count * 8
  if (!count || tableEnd > data.length) fail(filename, 'truncated or empty PDB record table')
  const offsets = Array.from({ length: count }, (_, i) => data.readUInt32BE(78 + i * 8))
  offsets.push(data.length)
  for (let i = 0; i < count; i++) if (offsets[i]! < tableEnd || offsets[i]! >= offsets[i + 1]!) fail(filename, 'invalid PDB record offsets')
  const sections: Section[] = []
  for (let record = 0; record < count; record++) {
    let offset = offsets[record]!
    const end = offsets[record + 1]!
    while (offset < end) {
      const location = filename + ':record ' + record + ':offset 0x' + offset.toString(16)
      if (offset + 4 > end) fail(location, 'truncated section header')
      const next = data.readUInt16BE(offset), properties = data.readUInt16BE(offset + 2)
      const limit = next ? offset + next : end
      if ((next && (next < 6 || next % 2)) || limit > end || properties > 256) fail(location, 'invalid section bounds')
      let position = offset + 4
      const string = (): string => {
        const stop = data.indexOf(0, position)
        if (stop < position || stop >= limit) fail(location, 'unterminated property string')
        const value = data.toString('latin1', position, stop)
        position = stop + 1
        return value
      }
      const section: Section = { name: string(), location, properties: Object.create(null) as Record<string, Property> }
      for (let i = 0; i < properties; i++) {
        const key = string(), value = string()
        if (!key) fail(location, 'empty property name')
        addProperty(section, key, value, location)
      }
      if (!data.subarray(position, limit).every(byte => byte === 0)) fail(location, 'unexpected trailing section data')
      sections.push(section)
      if (!next) break
      offset = limit
    }
  }
  return sections
}
export function decodeBoard(notation: string, context: string): string[] {
  const encodedRows = notation.split('/')
  if (encodedRows.length !== 8) fail(context, 'board must contain eight rows')
  const rows = encodedRows.map((row, y) => {
    let result = '', i = 0
    while (i < row.length) {
      const ch = row[i]!
      if (/[1-9]/.test(ch)) {
        const token = /^[1-9][0-9]*/.exec(row.slice(i))![0]
        const walls = Number(token)
        if (walls > 10 - result.length) fail(context, 'wall run exceeds row ' + y)
        result += '#'.repeat(walls); i += token.length
      } else if (ch === '~' || /^[a-h]$/.test(ch)) {
        result += ch === '~' ? '.' : ch; i++
      } else fail(context, 'unknown board character ' + JSON.stringify(ch) + ' at row ' + y + ', column ' + i)
      if (result.length > 10) fail(context, 'row ' + y + ' exceeds ten cells')
    }
    if (result.length !== 10) fail(context, 'row ' + y + ' must contain ten cells')
    return result
  })
  createBoard(rows)
  return rows
}
export function packId(filename: string): string {
  const name = filename.replace(/\.(ini|pdb)$/i, '')
  if (name === 'Classic Levels') return 'classic'
  if (name === 'Classic II Levels') return 'classic-ii'
  const id = name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!id) fail(filename, 'cannot derive stable pack ID')
  return id
}
const propertiesOf = (section: Section): Record<string, string> => Object.fromEntries(
  Object.keys(section.properties).sort().map(key => [key, section.properties[key]!.value]),
)
export function importPack(data: Buffer, filename: string): ReferencePack {
  const format = filename.toLowerCase().endsWith('.ini') ? 'ini' : filename.toLowerCase().endsWith('.pdb') ? 'pdb' : fail(filename, 'unknown pack format')
  const sections = format === 'ini' ? parseIni(data.toString('latin1'), filename) : parsePdb(data, filename)
  const general = sections.filter(s => s.name.toLowerCase() === 'general')
  if (general.length !== 1) fail(filename, 'expected exactly one General section')
  for (const section of sections) if (!['general', 'level'].includes(section.name.toLowerCase())) fail(section.location, 'unknown section ' + section.name)
  const id = packId(filename)
  const levels = sections.filter(s => s.name.toLowerCase() === 'level').map((section, index): ReferenceLevel => {
    const board = section.properties.board
    if (!board) fail(section.location, 'missing board')
    const encodedSolution = section.properties.solution?.value ?? null
    let par: number | null = null
    if (encodedSolution !== null) {
      try { par = decodeReferenceSolution(encodedSolution).length }
      catch (error) { fail(section.properties.solution!.location, String(error)) }
    }
    return { id: id + ':' + index, index, title: section.properties.title?.value ?? null,
      rows: decodeBoard(board.value, board.location), par, encodedSolution, rawBoard: board.value,
      location: section.location, properties: propertiesOf(section) }
  })
  if (!levels.length) fail(filename, 'pack has no levels')
  return { schemaVersion: 1, id, name: filename.replace(/\.(ini|pdb)$/i, ''), general: propertiesOf(general[0]!),
    source: { filename, sha256: sha256(data), format }, levels }
}
