#!/usr/bin/env python3
"""GPL-2.0-or-later. Audit trusted, locally extracted Palm 2.2 sources.
Extract original gameplay functions into a native harness; stub Palm presentation.
Usage: python3 scripts/audit_reference.py /path/to/extracted/vexed
Requires Python 3 and a C compiler (cc). Does not execute archive executables.
"""
import hashlib, json, re, struct, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
CHECK = '--check' in sys.argv[2:]
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((ROOT/'docs/compatibility/source-manifest.json').read_text())
for entry in manifest['sourceFiles']:
    p=SOURCE/entry['path']
    assert p.is_file() and digest(p)==entry['sha256'], f'Source hash mismatch: {p}'
def function(text, name):
    m = re.search(r'^(?:Boolean|void|int) ' + name + r'\([^\n]*\)\s*\{', text, re.M)
    if not m: raise ValueError(name)
    i = m.end(); depth = 1
    while depth:
        depth += (text[i] == '{') - (text[i] == '}'); i += 1
    return text[m.start():i]
shim = r'''
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
typedef int Boolean; typedef signed char Int8; typedef short Int16;
typedef int PlayGround[8][10];
typedef struct { int x,y,direction,distance; } MoveType;
typedef struct { struct {int x,y;} topLeft,extent; } RectangleType;
#define sizeX 10
#define sizeY 8
#define Air 0
#define Wall 9
#define Left 1
#define Right 2
#define Down 4
#define Erase 5
#define BlockSize 16
#define HighBeep 0
#define LowBeep 0
#define HighSweepLow 0
#define BitmapUndo 0
PlayGround current;
Boolean InSolution=true, InSolutionBack=true, DoingReplay=false;
MoveType replay[2][10000]; int ReplayCIndex=0, ReplayCurrent=0;
struct { int PieceMoveAnim,GravityAnim,EliminationAnim; struct { int MoveCountMade; } LevelPack[1]; } VexedPreferences;
void SoundEffect(int a) {} void UpdateStats(void) {} void SysTaskDelay(int a) {}
void WinEraseRectangle(RectangleType *r,int a) {} void DrawBM(int a,int b,int c,int d) {}
void MoveAnimation(Int8 x,Int8 y,Int8 dx,Int8 dy,Boolean a,int speed) {
 current[y+dy][x+dx]=current[y][x]; current[y][x]=0;
}
'''
code=(SOURCE/'game/game.c').read_text()
functions=['MoveBlock','CheckGravity','CheckMatches','CompareLevel','CopyLevel','CountBlocksRemaining','PlayerMakeMove2']
harness=shim+'\n'+'\n'.join(function(code,n) for n in functions)+r'''
int main(void) {
 for(int y=0;y<8;y++) for(int x=0;x<10;x++) if(scanf("%d",&current[y][x])!=1) return 2;
 int x,y,d,dist;
 while(scanf("%d %d %d %d",&x,&y,&d,&dist)==4) {
  int won=PlayerMakeMove2(x,y,d,dist,true);
  printf("%d %d ",won,VexedPreferences.LevelPack[0].MoveCountMade);
  for(int yy=0;yy<8;yy++) for(int xx=0;xx<10;xx++) printf("%d",current[yy][xx]);
  puts("");
 }
}
'''
def parse_board(s):
    rows=[]
    for row in s.split('/'):
        tokens=re.findall(r'[1-9][0-9]*|~|[a-h]',row)
        assert ''.join(tokens)==row, row
        expanded=''.join('#'*int(t) if t.isdigit() else '.' if t=='~' else t for t in tokens)
        assert len(expanded)==10, expanded
        rows.append(expanded)
    assert len(rows)==8
    return rows
def parse_pack(p):
    general={}; levels=[]; cur=general
    for line in p.read_text(encoding='latin1').splitlines():
        line=line.strip()
        if not line or line.startswith(';'): continue
        if line.startswith('['):
            if line=='[Level]': cur={}; levels.append(cur)
            elif line=='[General]': cur=general
            else: raise ValueError((p,line))
        elif '=' in line:
            k,v=line.split('=',1); cur[k.lower()]=v
    return general,levels
def parse_pdb(p):
    data=p.read_bytes(); count=struct.unpack_from('>H',data,76)[0]
    offsets=[struct.unpack_from('>I',data,78+8*i)[0] for i in range(count)]+[len(data)]
    assert offsets==sorted(offsets) and offsets[0]>=78+8*count
    general={}; levels=[]
    for start,end in zip(offsets,offsets[1:]):
        off=start
        while off<end:
            nxt,nprops=struct.unpack_from('>HH',data,off); pos=off+4
            def string():
                nonlocal pos
                stop=data.index(b'\0',pos,end); value=data[pos:stop].decode('latin1'); pos=stop+1
                return value
            section=string(); props={}
            for _ in range(nprops):
                key=string().lower(); props[key]=string()
            if section=='General': general=props
            elif section.startswith('Level'): levels.append(props)
            else: raise ValueError((p,section))
            if not nxt: break
            assert pos<=off+nxt<=end and nxt>4
            off+=nxt
    return general,levels

fixtures=[]; reports=[]
with tempfile.TemporaryDirectory() as tmp:
    c=Path(tmp)/'oracle.c'; exe=Path(tmp)/'oracle'; c.write_text(harness)
    subprocess.run(['cc','-std=c99','-O0',str(c),'-o',str(exe)],check=True)
    def run(rows,commands):
        numbers=['9' if ch=='#' else '0' if ch=='.' else str(ord(ch)-96) for row in rows for ch in row]
        data=' '.join(numbers)+'\n'+'\n'.join(' '.join(map(str,m)) for m in commands)+'\n'
        result=subprocess.run([str(exe)],input=data,text=True,capture_output=True,check=True)
        out=[]
        for line in result.stdout.splitlines():
            won,count,cells=line.split()
            board=''.join('#' if n=='9' else '.' if n=='0' else chr(96+int(n)) for n in cells)
            out.append({'won':won=='1','moves':int(count),'rows':[board[i:i+10] for i in range(0,80,10)]})
        assert len(out)==len(commands)
        return out
    for p in sorted(list((SOURCE/'levelpacks').glob('*.ini'))+list((SOURCE/'levelpacks').glob('*.pdb'))):
        general,levels=(parse_pack(p) if p.suffix=='.ini' else parse_pdb(p)); failures=[]; replays=0
        for index,level in enumerate(levels):
            rows=parse_board(level['board']); encoded=level.get('solution',''); commands=[]
            assert len(encoded)%2==0
            for a,b in zip(encoded[::2],encoded[1::2]):
                assert a.isupper()!=b.isupper(), (p,index,a,b)
                x,y=ord(a.lower())-97,ord(b.lower())-97
                assert 0<=x<10 and 0<=y<8
                commands.append([x,y,1 if a.isupper() else 2,1])
            if not commands: failures.append({'level':index,'reason':'missing solution'}); continue
            states=run(rows,commands); replays+=1
            if not states[-1]['won']: failures.append({'level':index,'reason':'unsolved reference replay'})
            if p.name=='Classic Levels.ini' and index<30:
                fixtures.append({'id':f'classic:{index}','title':level.get('title'), 'sourceFile':p.name,'sourceSha256':digest(p),'initialRows':rows,'encodedSolution':encoded,'par':len(commands),'commands':commands,'expectedAfterEachMove':states})
        reports.append({'file':p.name,'sha256':digest(p),'author':general.get('author'),'levels':len(levels),'replays':replays,'failures':failures})
    # Audit gestures not exercised by one-cell solution strings.
    synthetic=[]
    for name,rows,command in [
        ('multi-cell-score',['##########']*6+['#a.......#','##########'],[1,6,2,3]),
        ('collision-counts-attempt',['##########']*6+['#ab......#','##########'],[1,6,2,2]),
        ('fall-stops-drag',['##########']*5+['#a.......#','#........#','##########'],[1,5,2,5]),
        ('match-stops-drag',['##########']*6+['#a.a.....#','##########'],[1,6,2,5]),
    ]:
        synthetic.append({'id':name,'initialRows':rows,'command':command,'expected':run(rows,[command])[0]})
assert [f['expected']['moves'] for f in synthetic]==[3,1,1,1]
assert synthetic[0]['expected']['rows'][6]=='#...a....#'
assert synthetic[1]['expected']['rows']==synthetic[1]['initialRows']
assert synthetic[2]['expected']['rows'][6]=='#.a......#'
assert synthetic[3]['expected']['won']
report={'method':'Original C gameplay functions compiled with no-op Palm presentation and state-only MoveAnimation; not a Palm emulator or UI test.','packs':reports,'totals':{'iniPacks':sum(p['file'].endswith('.ini') for p in reports),'pdbPacks':sum(p['file'].endswith('.pdb') for p in reports),'levels':sum(p['levels'] for p in reports),'replays':sum(p['replays'] for p in reports),'failures':sum(len(p['failures']) for p in reports)}}
for path,data in [('tests/fixtures/reference/classic.json',fixtures),('tests/fixtures/reference/gestures.json',synthetic),('docs/compatibility/pack-audit.json',report)]:
    dest=ROOT/path; dest.parent.mkdir(parents=True,exist_ok=True); expected=json.dumps(data,indent=2)+'\n'
    if CHECK:
        assert dest.read_text()==expected, f'Reference output changed: {dest}'
    else:
        dest.write_text(expected)
print(json.dumps(report['totals']))
for p in reports:
    if p['failures']: print(p['file'],p['failures'])

if report['totals']['failures']: raise SystemExit(1)
