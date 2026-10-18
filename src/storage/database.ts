// SPDX-License-Identifier: GPL-2.0-or-later
const DATABASE = 'vexed-web-v1'
const STORE = 'saves'
let opening: Promise<IDBDatabase> | null = null
function database(): Promise<IDBDatabase> {
  if (opening) return opening
  opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Storage unavailable')); return }
    const request = indexedDB.open(DATABASE, 1)
    let settled = false
    const fail = (error: unknown) => { if (!settled) { settled = true; clearTimeout(timer); reject(error) } }
    const timer = setTimeout(() => fail(new Error('Storage blocked')), 3000)
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE) }
    request.onerror = () => fail(request.error)
    request.onblocked = () => fail(new Error('Storage blocked'))
    request.onsuccess = () => { clearTimeout(timer); const db = request.result; if (settled) { db.close(); return } settled = true; db.onversionchange = () => { db.close(); opening = null }; resolve(db) }
  }).catch(error => { opening = null; throw error })
  return opening
}
export async function readSave(key: string): Promise<unknown> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).get(key)
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
let writes: Promise<void> = Promise.resolve()
export function writeSave(key: string, value: unknown): Promise<void> {
  const write = async () => {
    const db = await database()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  }
  const result = writes.catch(() => {}).then(write)
  writes = result
  return result
}
