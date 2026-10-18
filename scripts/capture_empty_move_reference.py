#!/usr/bin/env python3
"""GPL-2.0-or-later. Capture the original C trace for Classic II's empty move.
Requires the Phase 0 sources at .reference/source/vexed and a C compiler.
Use --check to compare, rather than overwrite, the frozen trace.
"""
import json
import runpy
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
check = '--check' in sys.argv[1:]
# Reuse the hash-checked original C extraction and presentation stubs, not a new model.
sys.argv = [str(root/'scripts/audit_reference.py'), str(root/'.reference/source/vexed'), '--check']
native = runpy.run_path(sys.argv[0])
catalogue = json.loads((root/'tests/fixtures/packs/reference-catalogue.json').read_text())
pack = next(p for p in catalogue['packs'] if p['id'] == 'classic-ii')
level = pack['levels'][20]
encoded = level['encodedSolution']
commands = [[ord(x.lower())-97, ord(y.lower())-97, 1 if x.isupper() else 2, 1]
            for x, y in zip(encoded[::2], encoded[1::2])]
numbers = ['9' if c == '#' else '0' if c == '.' else str(ord(c)-96)
           for row in level['rows'] for c in row]
data = ' '.join(numbers)+'\n'+'\n'.join(' '.join(map(str, m)) for m in commands)+'\n'
with tempfile.TemporaryDirectory() as temporary:
    c, exe = Path(temporary)/'oracle.c', Path(temporary)/'oracle'
    c.write_text(native['harness'])
    subprocess.run(['cc', '-std=c99', '-O0', str(c), '-o', str(exe)], check=True)
    result = subprocess.run([str(exe)], input=data, text=True, capture_output=True, check=True)
states = []
for line in result.stdout.splitlines():
    won, moves, cells = line.split()
    board = ''.join('#' if c == '9' else '.' if c == '0' else chr(96+int(c)) for c in cells)
    states.append({'won': won == '1', 'moves': int(moves), 'rows': [board[i:i+10] for i in range(0,80,10)]})
assert len(states) == len(commands)
assert states[35]['rows'] == states[36]['rows']
assert states[36]['moves'] == states[35]['moves'] + 1
assert states[-1]['won'] and states[-1]['moves'] == level['par']
fixture = {'id': level['id'], 'sourceFile': pack['source']['filename'], 'sourceSha256': pack['source']['sha256'],
           'initialRows': level['rows'], 'encodedSolution': encoded, 'par': level['par'],
           'emptyMoveIndex': 36, 'commands': commands, 'expectedAfterEachMove': states}
path = root/'tests/fixtures/reference/classic-ii-empty-move.json'
text = json.dumps(fixture, indent=2)+'\n'
if check:
    assert path.read_text() == text
else:
    path.write_text(text)
print('Original C confirms empty origin at zero-based step 36: unchanged board, one counted step')
