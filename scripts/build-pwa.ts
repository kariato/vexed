// SPDX-License-Identifier: GPL-2.0-or-later
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync, deflateSync } from 'node:zlib'
const base = process.env.VITE_BASE_PATH ?? '/'
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('Base must be a root or simple directory path')
const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'"
writeFileSync('dist/index.html', readFileSync('dist/index.html', 'utf8').replace('<head>', '<head>\n    <meta http-equiv="Content-Security-Policy" content="' + policy + '" />'))
function files(directory: string): string[] { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => { if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in release inputs'); return entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)] }) }
// Whitelist corresponding application source. Research fixtures, source archives,
// credentials and development reference data can never enter this archive.
const roots = ['src', 'public', 'LICENSES']
const source = [...roots.flatMap(files), ...['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vitest.config.ts','tsconfig.domain.json','tsconfig.tests.json','tsconfig.tools.json','LICENSE','NOTICE','scripts/build-pwa.ts','scripts/derive-solutions.ts','scripts/native/derive-solution.cpp'].filter(existsSync)]
const chunks: Buffer[] = []
for (const path of source.sort()) {
  const data = readFileSync(path), header = Buffer.alloc(512)
  if (Buffer.byteLength(path) > 100) throw new Error('Source path too long')
  header.write(path); header.write('0000644\0',100); header.write('0000000\0',108); header.write('0000000\0',116); header.write(data.length.toString(8).padStart(11,'0')+'\0',124); header.write('00000000000\0',136); header.fill(32,148,156); header.write('0',156); header.write('ustar\0',257); header.write('00',263)
  const checksum = header.reduce((sum, n) => sum + n, 0)
  header.write(checksum.toString(8).padStart(6,'0')+'\0 ',148)
  chunks.push(header, data, Buffer.alloc((512 - data.length % 512) % 512))
}
const instructions = Buffer.from('Vexed application source — GPL-2.0-or-later.\nInstall Node 24 and npm 11. Run npm ci, then VITE_BASE_PATH=/vexed/ npm run build.\nThe public directory contains cleared Classic boards and newly derived solutions.\nPrivate research fixtures are not needed to build the application. Development audit/test commands require the private research checkout.\n')
const readmeHeader = Buffer.alloc(512); readmeHeader.write('BUILD.txt'); readmeHeader.write('0000644\0',100); readmeHeader.write('0000000\0',108); readmeHeader.write('0000000\0',116); readmeHeader.write(instructions.length.toString(8).padStart(11,'0')+'\0',124); readmeHeader.write('00000000000\0',136); readmeHeader.fill(32,148,156); readmeHeader.write('0',156); readmeHeader.write('ustar\0',257); readmeHeader.write('00',263); readmeHeader.write(readmeHeader.reduce((s,n)=>s+n,0).toString(8).padStart(6,'0')+'\0 ',148)
chunks.push(readmeHeader,instructions,Buffer.alloc((512-instructions.length%512)%512),Buffer.alloc(1024))
writeFileSync('dist/vexed-source.tar.gz',gzipSync(Buffer.concat(chunks),{level:9}))
function crc(data: Buffer): number { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for(let i=0;i<8;i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0) } return (crc ^ 0xffffffff) >>> 0 }
function pngChunk(name: string, data: Buffer): Buffer { const type=Buffer.from(name), size=Buffer.alloc(4), check=Buffer.alloc(4); size.writeUInt32BE(data.length); check.writeUInt32BE(crc(Buffer.concat([type,data]))); return Buffer.concat([size,type,data,check]) }
mkdirSync('dist/icons',{recursive:true})
for (const size of [192,512]) {
  const pixels=Buffer.alloc((size*3+1)*size)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const gx=Math.floor(x*10/size),gy=Math.floor(y*10/size)
    const mark=gy>=2&&gy<=7&&((gy<6&&(gx===2||gx===7))||(gy===6&&(gx===3||gx===6))||(gy===7&&(gx===4||gx===5)))
    const offset=y*(size*3+1)+1+x*3; const color=mark?[237,246,215]:[39,74,57]
    pixels[offset]=color[0]!;pixels[offset+1]=color[1]!;pixels[offset+2]=color[2]!
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2
  writeFileSync('dist/icons/icon-'+size+'.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))]))
}
writeFileSync('dist/manifest.webmanifest',JSON.stringify({id:base,name:'Vexed — Classic puzzles',short_name:'Vexed',description:'59 Classic puzzles. Slide, match and clear the board.',lang:'en',start_url:base,scope:base,display:'standalone',background_color:'#f4f5ef',theme_color:'#274a39',icons:[192,512].map(size=>({src:base+'icons/icon-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any maskable'}))},null,2))
writeFileSync('dist/.nojekyll','')
const assets=files('dist').filter(file=>!file.endsWith('/sw.js')).sort()
const version=createHash('sha256').update(assets.map(file=>file+createHash('sha256').update(readFileSync(file)).digest('hex')).join('\n')).digest('hex').slice(0,16)
const urls=assets.map(file=>base+file.slice(5)).concat(base)
writeFileSync('dist/sw.js',`// Generated Vexed offline worker. No game data is stored in caches.\nconst CACHE = ${JSON.stringify('vexed:'+base+':'+version)};\nconst PREFIX = ${JSON.stringify('vexed:'+base+':')};\nconst ASSETS = ${JSON.stringify(urls)};\nself.addEventListener('install', event => event.waitUntil((async () => { try { const cache = await caches.open(CACHE); await cache.addAll(ASSETS); } catch (error) { await caches.delete(CACHE); throw error; } })()));\nself.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) if(key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()));\nself.addEventListener('message', event => { if(event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting(); if(event.data?.type === 'CHECK_OFFLINE' && event.ports[0]) event.waitUntil((async () => { let ready = false; try { const cache = await caches.open(CACHE); const missing = []; for(const url of ASSETS) if(!(await cache.match(url))) missing.push(url); if(missing.length && event.data.repair) await cache.addAll(missing); ready = !missing.length || !!event.data.repair; } catch {} event.ports[0].postMessage({ ready }); })()); });\nself.addEventListener('fetch', event => { const url = new URL(event.request.url); if(event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(${JSON.stringify(base)})) return; event.respondWith((async () => { const cache = await caches.open(CACHE); const key = event.request.mode === 'navigate' ? ${JSON.stringify(base)} : url.pathname; const cached = await cache.match(key); return cached || fetch(event.request); })()); });\n`)
console.log('PWA '+version+': '+assets.length+' precached files; source archive '+source.length+' files')
