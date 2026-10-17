// SPDX-License-Identifier: GPL-2.0-or-later
export interface RuntimeLevel {
  readonly id: string; readonly index: number; readonly title: string
  readonly rows: readonly string[]; readonly par: number | null
}
export interface RuntimePack {
  readonly schemaVersion: 1
  readonly id: string; readonly name: string; readonly author: string
  readonly license: 'GPL-2.0-or-later'
  readonly boardSource: { readonly file: string; readonly sha256: string }
  readonly levels: readonly RuntimeLevel[]
}
export interface PackManifest {
  readonly schemaVersion: 1
  readonly packs: readonly { readonly id: string; readonly name: string; readonly file: string; readonly levels: number; readonly sha256: string }[]
}
