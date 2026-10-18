/* SPDX-License-Identifier: GPL-2.0-or-later
 * New test driver; original handlers are extracted separately from pinned sources.
 * This file is concatenated after the original core and extracted handler wrappers.
 */
#include <assert.h>
void resetCase(void) {
 memset(&VexedPreferences,0,sizeof(VexedPreferences));
 memset(undo,0,sizeof(undo)); memset(stored,0,sizeof(stored));
 for(int y=0;y<8;y++) for(int x=0;x<10;x++) current[y][x]=9;
 for(int x=1;x<9;x++) current[6][x]=0;
 current[6][1]=1;
 VexedPreferences.LevelPack[0].SolvedLevels=-1;
 InSolution=false; InSolutionBack=true; DoingReplay=false;
 UndoCount=UndoIndex=ReplayCurrent=movePending=nextLevelCalls=popupCalls=alertCalls=0;
 mockHasSolution=1; mockAlertResult=0;
}
void releaseAt(int bx,int by,int ex,int ey) {
 playermove.begin.x=bx; playermove.begin.y=by;
 mockPenX=ex*16+8; mockPenY=(ey+1)*16+8;
 HandleRelease();
}
void snapshot(const char *id) {
 LevelPackPrefs *p=&VexedPreferences.LevelPack[0];
 printf("{\"id\":\"%s\",\"moves\":%d,\"undoCount\":%d,\"replayCount\":%d,\"baseMade\":%d,\"score\":%d,\"solutionOpenings\":%d,\"alerts\":%d,\"nextLevelCalls\":%d,\"pending\":%s,\"rows\":[",id,p->MoveCountMade,UndoCount,ReplayCurrent,p->BaseMoveCountMade,CalcScore(0),popupCalls,alertCalls,nextLevelCalls,movePending?"true":"false");
 for(int y=0;y<8;y++) {
  if(y) printf(","); printf("\"");
  for(int x=0;x<10;x++) putchar(current[y][x]==9?'#':current[y][x]==0?'.':'a'+current[y][x]-1);
  printf("\"");
 }
 puts("]}");
}
void handlerCases(void) {
 resetCase(); releaseAt(1,6,4,6);
 assert(current[6][4]==1 && VexedPreferences.LevelPack[0].MoveCountMade==3 && UndoCount==1 && ReplayCurrent==1);
 snapshot("drag-three-cells-one-undo");
 HandleUndo(); assert(current[6][1]==1 && VexedPreferences.LevelPack[0].MoveCountMade==0 && UndoCount==0 && ReplayCurrent==0);
 snapshot("undo-restores-entire-drag");
 HandleUndo(); assert(current[6][1]==1 && UndoCount==0); snapshot("empty-undo-is-safe");

 resetCase(); current[5][4]=0; releaseAt(1,6,1,6); assert(movePending);
 releaseAt(4,5,4,5); assert(current[6][4]==1 && current[5][4]==0 && !movePending && UndoCount==1);
 snapshot("cross-row-tap-uses-column");
 resetCase(); current[5][1]=0; releaseAt(1,6,1,6); releaseAt(1,5,1,5);
 assert(current[6][1]==1 && UndoCount==0 && !movePending); snapshot("same-column-tap-no-move");
 resetCase(); current[6][4]=2; releaseAt(1,6,1,6); releaseAt(4,6,4,6);
 assert(current[6][1]==1 && UndoCount==0 && !movePending); snapshot("occupied-tap-endpoint-rejected");
 resetCase(); current[6][2]=2; releaseAt(1,6,4,6);
 assert(current[6][1]==1 && VexedPreferences.LevelPack[0].MoveCountMade==1 && UndoCount==1);
 snapshot("empty-endpoint-behind-obstacle-counts-attempt");
 resetCase(); current[5][4]=0; releaseAt(1,6,4,5);
 assert(current[6][1]==1 && UndoCount==0); snapshot("cross-row-drag-rejected");
 resetCase(); releaseAt(1,6,4,7); assert(UndoCount==0); snapshot("wall-drag-endpoint-rejected");

 resetCase();
 for(int i=0;i<16;i++) { if(i%2==0) releaseAt(1,6,2,6); else releaseAt(2,6,1,6); }
 assert(UndoCount==15 && VexedPreferences.LevelPack[0].MoveCountMade==16); snapshot("undo-ring-caps-at-fifteen");
 for(int i=0;i<15;i++) HandleUndo();
 assert(UndoCount==0 && VexedPreferences.LevelPack[0].MoveCountMade==1 && current[6][2]==1 && ReplayCurrent==1);
 snapshot("undo-ring-restores-last-fifteen");

 resetCase(); LevelPackPrefs *p=&VexedPreferences.LevelPack[0];
 p->MoveCountPar=5; p->MoveCountMade=7; assert(CalcScore(0)==2); snapshot("unsolved-active-excess-score");
 p->MoveCountMade=3; assert(CalcScore(0)==0); snapshot("unsolved-under-par-not-yet-negative");
 p->SolvedLevels=0; p->CurrentLevel=1; p->Score[0].MoveCountMade=3; p->Score[0].MoveCountPar=5;
 p->MoveCountMade=0; p->MoveCountPar=4; assert(CalcScore(0)==-2); snapshot("completed-under-par-negative-score");
 p->CurrentLevel=0; p->Score[0].MoveCountMade=7; p->MoveCountMade=7; p->MoveCountPar=5;
 assert(CalcScore(0)==4); snapshot("active-completed-level-excess-counted-again");
 p->MoveCountMade=3; assert(CalcScore(0)==2); snapshot("active-better-attempt-keeps-completion-score");

 resetCase(); HandleSolution(); HandleSolution();
 assert(p->BaseMoveCountMade==10 && popupCalls==2); snapshot("solution-repeated-openings-penalized");
 resetCase(); mockAlertResult=1; HandleSolution(); assert(p->BaseMoveCountMade==0 && popupCalls==0); snapshot("solution-cancel-no-penalty");
 resetCase(); mockHasSolution=0; HandleSolution(); assert(p->BaseMoveCountMade==0 && popupCalls==0); snapshot("missing-solution-no-penalty");
 resetCase(); p->SolvedLevels=0; p->Score[0].MoveCountMade=5; p->Score[0].MoveCountPar=5;
 HandleSolution(); assert(p->BaseMoveCountMade==0 && popupCalls==1 && alertCalls==0); snapshot("solution-at-par-exempt");
 resetCase(); p->SolvedLevels=0; p->Score[0].MoveCountMade=4; p->Score[0].MoveCountPar=5;
 HandleSolution(); assert(p->BaseMoveCountMade==0 && popupCalls==1); snapshot("solution-below-par-exempt");
 resetCase(); p->SolvedLevels=0; p->Score[0].MoveCountMade=6; p->Score[0].MoveCountPar=5;
 HandleSolution(); assert(p->BaseMoveCountMade==5 && popupCalls==1); snapshot("solution-above-par-penalized");

 resetCase(); CopyLevel(stored,current); MoveCountMadeStored=3; MoveCountParStored=5;
 current[6][1]=0; current[6][4]=1; p->MoveCountMade=9; p->MoveCountPar=12; p->BaseMoveCountMade=5;
 InSolution=true; memorized=true; ExitSolution();
 assert(current[6][1]==1 && current[6][4]==0 && p->MoveCountMade==3 && p->MoveCountPar==5 && p->BaseMoveCountMade==5 && !InSolution && !memorized && stored[0][0]==0);
 snapshot("exit-solution-restores-board-counts-keeps-penalty");
}
