#!/usr/bin/env python3
"""SPDX-License-Identifier: GPL-2.0-or-later. Package the isolated itch.io build."""
from pathlib import Path
import hashlib
import json
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DIST = HERE / 'dist'
RELEASES = HERE / 'releases'
EXCLUDED = {'dist', 'releases', 'node_modules', 'test-results', '__pycache__', '.git', '.reference', '.DS_Store'}

def files(folder):
    for path in sorted(folder.rglob('*')):
        if any(part in EXCLUDED for part in path.relative_to(folder).parts):
            continue
        if path.is_symlink():
            raise ValueError('Symlink in package inputs: ' + str(path))
        if path.is_file():
            yield path

def add(archive, name, data):
    info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)

if not (DIST / 'index.html').is_file():
    raise SystemExit('Build itch/dist first: npm --prefix itch run build')
if (DIST / 'sw.js').exists() or (DIST / 'manifest.webmanifest').exists():
    raise SystemExit('itch export must not contain a PWA worker or installation manifest')
notice = (DIST / 'NOTICE.txt').read_text().replace('vexed-source.tar.gz', 'vexed-source.zip')
(DIST / 'NOTICE.txt').write_text(notice + '\nitch.io variant: relative asset paths, path-scoped local saves, no service worker.\nFor installation and offline play: https://kariato.github.io/vexed/\n')
source_files = []
for name in ['src', 'public', 'LICENSES', 'itch']:
    source_files.extend(files(ROOT / name))
for pattern in ['package*.json', 'tsconfig*.json', 'vite.config.ts', 'vitest.config.ts', '.nvmrc', 'LICENSE', 'NOTICE']:
    source_files.extend(path for path in ROOT.glob(pattern) if path.is_file())
source_files.extend(ROOT / name for name in ['scripts/build-pwa.ts', 'scripts/derive-solutions.ts', 'scripts/native/derive-solution.cpp', 'docs/compatibility/PACK-LICENSE-REVIEW.md', 'docs/development/ARCHIVED-PACKS.md'])
with zipfile.ZipFile(DIST / 'vexed-source.zip', 'w') as archive:
    for path in sorted(set(source_files)):
        add(archive, path.relative_to(ROOT).as_posix(), path.read_bytes())
    add(archive, 'BUILD-ITCH.txt', b'Use Node 24, npm 11 and Python 3. Run npm ci in this source root, then npm --prefix itch run package. Dependencies are pinned in the root package-lock.json. See itch/README.md. Historical research fixtures are not needed. The application code license does not relicense all archived pack data: see public/PACK_NOTICES.txt.\n')
manifest = json.loads((DIST / 'packs/manifest.json').read_text())
assert len(manifest['packs']) == 48
assert sum(entry['levels'] for entry in manifest['packs']) == 2878
for entry in manifest['packs']:
    raw = (DIST / 'packs' / entry['file']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == entry['sha256']
    solutions = json.loads((DIST / 'packs' / (entry['id'] + '-solutions.json')).read_text())
    assert solutions['packSha256'] == entry['sha256']
    assert len(solutions['levels']) == entry['levels']
output = list(files(DIST))
if len(output) > 1000 or sum(path.stat().st_size for path in output) > 500 * 1024**2:
    raise SystemExit('itch.io extracted file count or size limit exceeded')
for path in output:
    if len(path.relative_to(DIST).as_posix()) > 240 or path.stat().st_size > 200 * 1024**2:
        raise SystemExit('itch.io individual file/path limit exceeded')
RELEASES.mkdir(exist_ok=True)
target = RELEASES / 'vexed-itch.zip'
with zipfile.ZipFile(target, 'w') as archive:
    for path in output:
        add(archive, path.relative_to(DIST).as_posix(), path.read_bytes())
with zipfile.ZipFile(target) as archive:
    assert 'index.html' in archive.namelist()
    assert archive.testzip() is None
print(json.dumps({'zip': str(target), 'files': len(output), 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
