// SPDX-License-Identifier: GPL-2.0-or-later
import { readSave as read, writeSave as write } from '../src/storage/database'
import type { SavedGame } from '../src/storage/save'
// The CDN serves games below arbitrary directories. Never share a ./classic key
// with another export or the GitHub Pages installation on the same origin.
function key(value: string): string {
  return 'vexed-itch:' + new URL('./', location.href).pathname + ':' + value
}
export const readSave = (value: string): Promise<unknown> => read(key(value))
export const writeSave = (value: string, save: SavedGame): Promise<void> => write(key(value), save)
// Reloading the outer itch.io page recreates the iframe with its original URL.
// Remember the selected pack here instead of relying only on iframe history.
export function readSelectedPack(): string | null {
  try { return localStorage.getItem(key('selected-pack')) } catch { return null }
}
export function rememberPack(id: string): void {
  try { localStorage.setItem(key('selected-pack'), id) } catch { /* Storage may be denied in third-party embeds. */ }
}
