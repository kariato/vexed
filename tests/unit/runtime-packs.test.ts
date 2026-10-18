import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadManifest, loadPack } from '../../src/data/packLoader'
import { validateManifest, validatePack } from '../../src/data/validatePack'
import { sha256 } from '../../scripts/packs/import'
import { root } from '../../scripts/packs/pipeline'

const text = readFileSync(resolve(root, 'public/packs/classic.json'), 'utf8')
const pack = validatePack(JSON.parse(text))
const manifest = validateManifest(JSON.parse(readFileSync(resolve(root, 'public/packs/manifest.json'), 'utf8')))
describe('runtime schema and release boundary', () => {
  it('contains only the 59 provenance-covered Classic layouts, generic labels and numeric par', () => {
    expect(pack.levels).toHaveLength(59)
    expect(manifest.packs).toHaveLength(1)
    expect(manifest.packs[0]?.sha256).toBe(sha256(text))
    expect(pack.boardSource.sha256).toBe('e2e9bf95d226ecd5944875ce3785ceef3013086f2d68c7f50b9f72379d126460')
    for (const [i, level] of pack.levels.entries()) {
      expect(Object.keys(level).sort()).toEqual(['id', 'index', 'par', 'rows', 'title'])
      expect(level.title).toBe('Level ' + (i + 1))
    }
    expect(text).not.toContain('encodedSolution')
    expect(text).not.toContain('Good Night')
  })
  it.each([
    (data: Record<string, unknown>) => { data.schemaVersion = 2 },
    (data: Record<string, unknown>) => { data.id = '../classic' },
    (data: Record<string, unknown>) => { data.levels = [] },
    (data: Record<string, unknown>) => { data.boardSource = { file: 'unknown', sha256: 'bad' } },
  ])('rejects malformed runtime metadata', mutate => {
    const data = JSON.parse(text) as Record<string, unknown>
    mutate(data)
    expect(() => validatePack(data)).toThrow()
  })
  it('rejects duplicate IDs, corrupt rows, invalid par and mismatched indices', () => {
    for (const mutate of [
      (level: Record<string, unknown>) => { level.id = 'classic:4' },
      (level: Record<string, unknown>) => { level.rows = ['bad'] },
      (level: Record<string, unknown>) => { level.par = -1 },
      (level: Record<string, unknown>) => { level.index = 1.5 },
    ]) {
      const data = JSON.parse(text) as { levels: Record<string, unknown>[] }
      mutate(data.levels[0]!)
      expect(() => validatePack(data)).toThrow()
    }
  })
  it('does not alias the untrusted parsed JSON', () => {
    const data = JSON.parse(text) as { levels: { rows: string[] }[] }
    const validated = validatePack(data)
    data.levels[0]!.rows[0] = 'bad'
    expect(validated.levels[0]?.rows[0]).toBe('##########')
  })
  it('rejects manifest path traversal and duplicate pack IDs', () => {
    expect(() => validateManifest({ ...manifest, packs: [{ ...manifest.packs[0], file: '../secret.json' }] })).toThrow()
    expect(() => validateManifest({ ...manifest, packs: [manifest.packs[0], manifest.packs[0]] })).toThrow()
  })
})
describe('static pack loading beneath GitHub Pages base paths', () => {
  it.each(['/', '/vexed/', '/vexed'])('loads validated packs and manifest from %s', async base => {
    const urls: string[] = []
    const fetcher = async (url: string) => {
      urls.push(url)
      return { ok: true, status: 200, json: async () => url.endsWith('manifest.json') ? manifest : pack }
    }
    expect((await loadPack('classic', base, fetcher)).levels).toHaveLength(59)
    expect((await loadManifest(base, fetcher)).packs[0]?.id).toBe('classic')
    const prefix = base.replace(/\/?$/, '/')
    expect(urls).toEqual([prefix + 'packs/classic.json', prefix + 'packs/manifest.json'])
  })
  it('rejects IDs before requesting files and propagates HTTP failure', async () => {
    let requests = 0
    const fetcher = async () => { requests++; return { ok: false, status: 404, json: async () => null } }
    await expect(loadPack('../private', '/vexed/', fetcher)).rejects.toThrow('Invalid requested')
    expect(requests).toBe(0)
    await expect(loadPack('classic', '/vexed/', fetcher)).rejects.toThrow('404')
  })
  it('rejects a mismatched pack identity instead of loading the wrong save target', async () => {
    const wrong = { ...pack, id: 'other', levels: pack.levels.map(level => ({ ...level, id: 'other:' + level.index })) }
    await expect(loadPack('classic', '/', async () => ({ ok: true, status: 200, json: async () => wrong }))).rejects.toThrow('does not match')
  })
})
