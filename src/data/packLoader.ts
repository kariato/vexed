// SPDX-License-Identifier: GPL-2.0-or-later
import { validateManifest, validatePack, validPackId } from './validatePack'
import type { PackManifest, RuntimePack } from './types'
type FetchJson = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>
async function getJson(file: string, base: string, fetcher: FetchJson): Promise<unknown> {
  const response = await fetcher(base.replace(/\/?$/, '/') + 'packs/' + file)
  if (!response.ok) throw new Error('Pack request failed: HTTP ' + response.status)
  return response.json()
}
export async function loadPack(id: string, base = import.meta.env.BASE_URL, fetcher: FetchJson = fetch): Promise<RuntimePack> {
  if (!validPackId(id)) throw new Error('Invalid requested pack ID')
  const pack = validatePack(await getJson(id + '.json', base, fetcher))
  if (pack.id !== id) throw new Error('Loaded pack ID does not match request')
  return pack
}
export async function loadManifest(base = import.meta.env.BASE_URL, fetcher: FetchJson = fetch): Promise<PackManifest> {
  return validateManifest(await getJson('manifest.json', base, fetcher))
}
