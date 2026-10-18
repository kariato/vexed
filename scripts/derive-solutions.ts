// SPDX-License-Identifier: GPL-2.0-or-later
// Offline content authoring. Reads cleared boards only, never historical solutions.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyCommand, createBoard, createSession } from '../src/domain/index'
import type { MoveRequest } from '../src/domain/types'
import type { RuntimePack } from '../src/data/types'
const file = 'public/packs/classic-solutions.json'
const raw = readFileSync('public/packs/classic.json', 'utf8')
const pack = JSON.parse(raw) as RuntimePack
const folder = mkdtempSync(join(tmpdir(), 'vexed-solutions-'))
try {
  const binary = join(folder, 'derive')
  execFileSync('c++', ['-O3', '-std=c++17', 'scripts/native/derive-solution.cpp', '-o', binary], { stdio: 'inherit' })
  const levels = pack.levels.map(level => {
    let output: string
    try { output = execFileSync(binary, ['0'], { input: level.rows.join(''), encoding: 'utf8', timeout: 180000 }) }
    catch { output = execFileSync(binary, ['1'], { input: level.rows.join(''), encoding: 'utf8', timeout: 180000 }) }
    const commands: MoveRequest[] = output.trim().split('\n').filter(Boolean).map(line => {
      const [cell, direction] = line.split(' ').map(Number)
      if (cell === undefined || (direction !== -1 && direction !== 1)) throw new Error('Malformed search output')
      return { from: { x: cell % 10, y: Math.floor(cell / 10) }, direction, distance: 1 }
    })
    let state = createSession({ id: level.id, packId: pack.id, index: level.index, par: level.par, initialBoard: createBoard(level.rows) })
    for (const command of commands) {
      const result = applyCommand(state, { type: 'move', ...command })
      if (!result.accepted) throw new Error('Rejected derived move for ' + level.id)
      state = result.state
    }
    if (state.status !== 'won') throw new Error('Derived solution failed ' + level.id)
    console.log(level.id, commands.length)
    return { levelId: level.id, commands }
  })
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, rulesVersion: 1, packId: pack.id, license: 'GPL-2.0-or-later', origin: 'New offline search over GPL Classic layouts; no original solution input.', packSha256: createHash('sha256').update(raw).digest('hex'), levels }, null, 2) + '\n')
} finally { rmSync(folder, { recursive: true, force: true }) }
