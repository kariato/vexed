import { readFileSync, cpSync, mkdtempSync, appendFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeBoard, importPack, parseIni, parsePdb, packId } from '../../scripts/packs/import'
import { canonicalPacks, readPinnedPacks, root, sourceVariants } from '../../scripts/packs/pipeline'

const classicIni = readFileSync(resolve(root, 'tests/fixtures/source/packs/Classic Levels.ini'))
const classicPdb = readFileSync(resolve(root, 'tests/fixtures/source/packs/Classic Levels.pdb'))
describe('real original pack formats', () => {
  it('preserves repeated sections, full metadata, indices and original solutions', () => {
    const ini = importPack(classicIni, 'Classic Levels.ini'), pdb = importPack(classicPdb, 'Classic Levels.pdb')
    expect(ini.levels).toHaveLength(59)
    expect(ini.general.author).toBe('James A. McCombe')
    expect(ini.levels[0]).toMatchObject({ id: 'classic:0', index: 0, title: 'Good Night', encodedSolution: 'eCdFdCeC', par: 4 })
    expect(ini.levels.map(({ rows, properties }) => ({ rows, properties }))).toEqual(pdb.levels.map(({ rows, properties }) => ({ rows, properties })))
    expect(ini.levels[0]?.location).toContain('line')
    expect(pdb.levels[0]?.location).toContain('offset')
    expect(ini.levels[0]?.rawBoard.startsWith('10/10/')).toBe(true)
  })
  it('handles CRLF, equals signs, literal punctuation and Latin-1 text without invented escape rules', () => {
    const sections = parseIni('[General]\r\nAuthor=Éva\r\n; comment\r\n[Level]\r\ntitle=A=B; # literal\r\n[Level]\r\ntitle=Second', 'example.ini')
    expect(sections).toHaveLength(3)
    expect(sections[0]?.properties.author?.value).toBe('Éva')
    expect(sections[1]?.properties.title?.value).toBe('A=B; # literal')
  })
  it('derives stable pack IDs including Classic II and apostrophes', () => {
    expect(packId('Classic II Levels.pdb')).toBe('classic-ii')
    expect(packId("Children's Pack.ini")).toBe('childrens-pack')
    expect(packId('Variety 10 Pack.pdb')).toBe('variety-10-pack')
  })
  it.each(['a', '10/10', '10/10/10/10/10/10/10/0', '10/10/10/10/10/10/10/11', '10/10/10/10/10/10/10/9x', '10/10/10/10/10/10/10/9~a'])('rejects corrupt board notation %s', board => {
    expect(() => decodeBoard(board, 'bad.ini:line 9')).toThrow('bad.ini:line 9')
  })
  it('decodes multi-digit wall runs and distinguishes walls, air and blocks', () => {
    expect(decodeBoard('10/10/10/10/10/10/1~a6~/10', 'example')[6]).toBe('#.a######.')
  })
  it.each([
    ['board=10', 'line 1'],
    ['[General]\nAuthor=A\nauthor=B', 'duplicate property'],
    ['[General]\nAuthor=A\n[Level]\nsolution=fF', 'missing board'],
    ['[General]\nAuthor=A\n[Other]\nboard=10', 'unknown section'],
    ['[General]\nAuthor=A\n[General]\nAuthor=B', 'exactly one General'],
  ])('rejects malformed INI with contextual diagnostics', (text, message) => {
    expect(() => importPack(Buffer.from(text), 'broken.ini')).toThrow(message)
  })
  it('does not invent missing solutions/par metadata', () => {
    const data = '[General]\nAuthor=A\n[Level]\nboard=10/10/10/10/10/10/10/10'
    expect(importPack(Buffer.from(data), 'empty.ini').levels[0]).toMatchObject({ encodedSolution: null, par: null })
  })
})
describe('PDB bounds and corruption', () => {
  const corrupt = (edit: (data: Buffer) => void) => {
    const data = Buffer.from(classicPdb); edit(data)
    expect(() => parsePdb(data, 'broken.pdb')).toThrow('broken.pdb')
  }
  it('rejects short headers', () => expect(() => parsePdb(Buffer.alloc(20), 'short.pdb')).toThrow('truncated'))
  it('rejects invalid record counts', () => corrupt(data => data.writeUInt16BE(65535, 76)))
  it('rejects offsets outside the file', () => corrupt(data => data.writeUInt32BE(0xffffffff, 78)))
  it('rejects resource databases', () => corrupt(data => data.writeUInt16BE(1, 32)))
  it('rejects wrong creator/type', () => corrupt(data => data.write('BAD!', 64, 'ascii')))
  it('rejects chained record lists', () => corrupt(data => data.writeUInt32BE(1, 72)))
  it('rejects invalid section offsets', () => corrupt(data => data.writeUInt16BE(5, data.readUInt32BE(78))))
  it('rejects unterminated strings instead of reading beyond a section', () => corrupt(data => data.fill(97, data.readUInt32BE(78) + 4)))
})
describe('pinned inventories and source variants', () => {
  it('coalesces 19 pairs into 48 canonical packs while pinning the Classic II solution variant', () => {
    const sources = readPinnedPacks(), canonical = canonicalPacks(sources)
    expect(sources).toHaveLength(67)
    expect(canonical).toHaveLength(48)
    expect(canonical.reduce((sum, pack) => sum + pack.levels.length, 0)).toBe(2878)
    expect(canonical.find(pack => pack.id === 'classic-ii')?.levels[3]?.par).toBe(36)
    expect(sources.find(pack => pack.id === 'classic-ii' && pack.source.format === 'ini')?.levels[3]?.par).toBe(64)
    expect(() => canonicalPacks(sources, [])).toThrow('unexplained')
    expect(() => canonicalPacks(sources, [...sourceVariants(), ...sourceVariants()])).toThrow('Unused or duplicate')
  })
  it('fails on changed boards even when a solution exception is registered', () => {
    const sources = structuredClone(readPinnedPacks())
    sources.find(pack => pack.id === 'classic-ii' && pack.source.format === 'ini')!.levels[3]!.rows[0] = '#........#'
    expect(() => canonicalPacks(sources)).toThrow('board/title')
  })
  it('rejects duplicate canonical IDs', () => {
    const sources = readPinnedPacks()
    expect(() => canonicalPacks([...sources, sources.find(pack => pack.id === 'classic' && pack.source.format === 'pdb')!])).toThrow('Duplicate')
  })
  it('rejects changed source bytes even if the pack still parses', () => {
    const directory = mkdtempSync(resolve(tmpdir(), 'vexed-pack-hash-'))
    try {
      cpSync(resolve(root, 'tests/fixtures/source/packs'), directory, { recursive: true })
      appendFileSync(resolve(directory, 'Classic Levels.ini'), '\n; tampered\n')
      expect(() => readPinnedPacks(directory)).toThrow('SHA-256 mismatch')
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
