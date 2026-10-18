import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validatePack } from '../../src/data/validatePack'
import { validateSolutions } from '../../src/ui/replayData'
const raw = readFileSync('public/packs/classic.json', 'utf8')
const pack = validatePack(JSON.parse(raw))
const solutions = JSON.parse(readFileSync('public/packs/classic-solutions.json', 'utf8'))
describe('newly derived Classic solutions', () => {
  it('pins the exact cleared runtime pack and solves all 59 through the strict engine', () => {
    expect(solutions.packSha256).toBe(createHash('sha256').update(raw).digest('hex'))
    expect(solutions.license).toBe('GPL-2.0-or-later')
    expect(validateSolutions(solutions, pack).size).toBe(59)
  })
  it('rejects incomplete, duplicate, malformed and non-solving playback data', () => {
    const mutate = (change: (data: typeof solutions) => void) => { const data = structuredClone(solutions); change(data); expect(() => validateSolutions(data, pack)).toThrow() }
    mutate(data => { data.levels.pop() })
    mutate(data => { data.levels[1] = data.levels[0] })
    mutate(data => { data.levels[0].commands[0].from.x = 99 })
    mutate(data => { data.levels[0].commands.pop() })
    mutate(data => { data.levels[0].commands[0].distance = 2 })
  })
})
