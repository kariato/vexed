// SPDX-License-Identifier: GPL-2.0-or-later
// Source-informed: CalcScore and ItemSolution; Palm int truncation is not reproduced.
export interface Completion { readonly moves: number; readonly par: number | null }
export interface PackProgress {
  readonly baseMade: number
  readonly basePar: number
  readonly completions: Readonly<Record<number, Completion>>
}
export interface ActiveScore { readonly index: number; readonly moves: number; readonly par: number | null }
export const emptyProgress = (): PackProgress => ({ baseMade: 0, basePar: 0, completions: {} })
export function calculatePackScore(progress: PackProgress, active: ActiveScore): number {
  let score = progress.baseMade - progress.basePar
  for (const record of Object.values(progress.completions)) if (record.moves !== 0 && record.par !== null) score += record.moves - record.par
  const record = progress.completions[active.index]
  const moves = record ? Math.min(active.moves, record.moves) : active.moves
  if (active.par !== null) score += Math.max(0, moves - active.par)
  return score
}
export function recordCompletion(progress: PackProgress, level: ActiveScore): PackProgress {
  const previous = progress.completions[level.index]
  const best = previous ? Math.min(previous.moves, level.moves) : level.moves
  return { ...progress, completions: { ...progress.completions, [level.index]: { moves: best, par: level.par } } }
}
/** Call only after UI confirmation; missing/cancelled viewing has no side effects. */
export function openSolution(progress: PackProgress, index: number, available: boolean, confirmed: boolean): {
  progress: PackProgress; opened: boolean; penaltyApplied: boolean
} {
  if (!available) return { progress, opened: false, penaltyApplied: false }
  const best = progress.completions[index]
  const exempt = best !== undefined && best.par !== null && best.moves <= best.par
  if (exempt) return { progress, opened: true, penaltyApplied: false }
  if (!confirmed) return { progress, opened: false, penaltyApplied: false }
  return { progress: { ...progress, baseMade: progress.baseMade + 5 }, opened: true, penaltyApplied: true }
}
