#!/usr/bin/env python3
"""SPDX-License-Identifier: GPL-2.0-or-later.
Compare original GPL-covered Classic board arrays with the 2.2 INI boards.
Usage: audit_classic_provenance.py /extracted/vexed13 /extracted/vexed22 [--check]
"""
import ast
import hashlib
import json
import re
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
old,new=Path(sys.argv[1]),Path(sys.argv[2])
expected={
    'globals.c':'e2e9bf95d226ecd5944875ce3785ceef3013086f2d68c7f50b9f72379d126460',
    'License.txt':'91df39d1816bfb17a4dda2d3d2c83b1f6f2d38d53e53e41e8f97ad5ac46a0cad',
}
for name,sha in expected.items():
    assert hashlib.sha256((old/name).read_bytes()).hexdigest()==sha, name
pack=new/'levelpacks/Classic Levels.ini'
assert hashlib.sha256(pack.read_bytes()).hexdigest()=='b1fb1aad0c6e57f2f746213bc0c850e79abf0e1706d4c8eefb866807a8b09c28'
source=(old/'globals.c').read_text()
assert 'either version 2' in source and 'any later version' in source
literal=source.split('int level [59] [9] [11] =',1)[1].split(';',1)[0]
boards=ast.literal_eval(literal.replace('{','[').replace('}',']').strip())
converted=[]
for line in pack.read_text().splitlines():
    if not line.startswith('board='): continue
    board=[]
    for row in line[6:].split('/'):
        tokens=re.findall(r'[1-9][0-9]*|~|[a-h]',row)
        assert ''.join(tokens)==row
        values=[]
        for t in tokens:
            values.extend([9]*int(t) if t.isdigit() else [0] if t=='~' else [ord(t)-96])
        assert len(values)==10
        board.append(values)
    assert len(board)==8
    converted.append(board)
assert len(boards)==len(converted)==59
matches=[a==b for a,b in zip(boards,converted)]
assert all(matches)
report={
    'originalSourceUrl':'https://palmdb.net/content/files/games-puzzle/vexed/vexed13src.zip',
    'archiveSha256':'889f4c52ee1528e84c1bc32753ba7a8bc9cb250b6bf69c3c83674e040bbbb2f3',
    'sourceFiles':expected,
    'licenseNotice':'GPL-2.0-or-later, globals.c lines 1-17, James McCombe (1999)',
    'comparison':'59 original 8x10 explicit board arrays vs 2.2 Classic Levels.ini, ignoring C storage padding',
    'matchedLevelIndices':[i for i,match in enumerate(matches) if match],
    'mismatches':[],
    'scope':'Board layouts only. This does not establish terms for later titles, encoded solutions, or other packs.'
}
path=root/'docs/compatibility/classic-provenance.json'
text=json.dumps(report,indent=2)+'\n'
if '--check' in sys.argv[3:]: assert path.read_text()==text
else: path.write_text(text)
print('Classic board provenance: 59/59 exact matches to explicitly GPL-covered source arrays')
