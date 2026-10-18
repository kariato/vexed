import { describe, expect, it } from 'vitest'
import { applyCommand, applyGesture, createBoard, createSession, emptyProgress } from '../../src/domain'
import { assertSaveBounds, decodeSave, encodeSave } from '../../src/storage/save'
import type { RuntimePack } from '../../src/data/types'
const rows=['##########','#........#','#........#','#........#','#........#','#........#','#a.a.....#','##########']
const pack: RuntimePack={schemaVersion:1,id:'classic',name:'Classic',author:'Test',license:'GPL-2.0-or-later',boardSource:{file:'test',sha256:'a'.repeat(64)},levels:[{id:'classic:0',index:0,title:'Level 1',rows,par:1}]}
const fresh=()=>createSession({id:'classic:0',packId:'classic',index:0,par:1,initialBoard:createBoard(rows)})
const preferences={theme:'modern' as const,motion:'off' as const,practice:false}
describe('versioned game storage',()=>{
  it('refuses writes that could not be safely restored instead of claiming durability',()=>{
    const saved=encodeSave('classic',fresh(),null,emptyProgress(),preferences)
    expect(()=>assertSaveBounds(saved)).not.toThrow()
    const move={from:{x:1,y:6},direction:1 as const,distance:1}
    expect(()=>assertSaveBounds({...saved,game:{...saved.game,commands:Array(5001).fill(move)}})).toThrow()
  })
  it('restores board, moves, undo, checkpoint, previous replay and preferences through engine replay',()=>{
    let game=applyCommand(fresh(),{type:'memorize'}).state
    game=applyGesture(game,{from:{x:1,y:6},target:{x:2,y:6},method:'tap'}).state
    const decoded=decodeSave(JSON.parse(JSON.stringify(encodeSave('classic',game,game,emptyProgress(),preferences))),pack)
    expect(decoded.game).toEqual(game);expect(decoded.previous).toEqual(game);expect(decoded.preferences).toEqual(preferences)
  })
  it('preserves empty history after recall rather than inventing undo entries',()=>{
    let game=applyGesture(fresh(),{from:{x:1,y:6},target:{x:2,y:6},method:'tap'}).state
    game=applyCommand(game,{type:'memorize'}).state
    game=applyCommand(game,{type:'recall'}).state
    expect(decodeSave(encodeSave('classic',game,null,emptyProgress(),preferences),pack).game).toEqual(game)
  })
  it('rejects unknown versions, invalid score records, illegal moves and malformed history',()=>{
    const original=encodeSave('classic',fresh(),null,emptyProgress(),preferences)
    const invalid=[null,{...original,schemaVersion:2},{...original,rulesVersion:2},{...original,packId:'other'},{...original,game:{...original.game,history:[4]}},{...original,progress:{...original.progress,baseMade:-5}},{...original,game:{...original.game,commands:[{from:{x:0,y:0},direction:1,distance:1}]}}]
    for(const data of invalid)expect(()=>decodeSave(data,pack)).toThrow()
  })
})
