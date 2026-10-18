import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateManifest, validatePack } from '../../src/data/validatePack'
import { validateSolutions } from '../../src/ui/replayData'
import { sha256 } from '../../scripts/packs/import'
const manifest = validateManifest(JSON.parse(readFileSync('public/packs/manifest.json', 'utf8')))
describe('complete archived runtime content', () => {
  it('ships 48 distinct packs and 2,878 entries with pinned hashes and complete strict playback', () => {
    expect(manifest.packs).toHaveLength(48)
    expect(manifest.packs.reduce((sum, pack) => sum + pack.levels, 0)).toBe(2878)
    for (const entry of manifest.packs) {
      const raw = readFileSync('public/packs/' + entry.file, 'utf8')
      const pack = validatePack(JSON.parse(raw))
      expect(sha256(raw)).toBe(entry.sha256)
      expect(pack.id).toBe(entry.id)
      expect(pack.levels).toHaveLength(entry.levels)
      const solutions = JSON.parse(readFileSync('public/packs/' + entry.id + '-solutions.json', 'utf8'))
      expect(solutions.packSha256).toBe(entry.sha256)
      expect(validateSolutions(solutions, pack).size).toBe(entry.levels)
      if (entry.id !== 'classic') expect(solutions.license).toBe('NOASSERTION')
      if (!['classic', 'classic-ii'].includes(entry.id)) expect(pack.license).toBe('NOASSERTION')
    }
  })
  it('omits only the known Classic II empty-origin no-op and preserves historical par', () => {
    const pack = validatePack(JSON.parse(readFileSync('public/packs/classic-ii.json', 'utf8')))
    const data = JSON.parse(readFileSync('public/packs/classic-ii-solutions.json', 'utf8'))
    expect(data.omitted).toEqual([{ levelId: 'classic-ii:20', step: 36 }])
    expect(data.levels[20].commands.length).toBe(pack.levels[20]!.par! - 1)
    expect(pack.levels[3]!.par).toBe(36)
    expect(pack.license).toBe('LicenseRef-Upstream-GPL')
  })
})
