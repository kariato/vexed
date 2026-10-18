// SPDX-License-Identifier: GPL-2.0-or-later
// New offline search. Input: one 80-cell board; output: source-index/direction pairs.
#include <algorithm>
#include <array>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_set>
#include <vector>
using namespace std;
struct Node { string b; int parent, move, depth; double cost; };
struct Item { double cost; int index; bool operator<(const Item& other) const { return cost > other.cost; } };
bool block(char c) { return c >= 'a' && c <= 'h'; }
bool compatible[80][80];
void init(const string& board) {
  bool reach[80][80] = {};
  for (int origin=0; origin<80; origin++) if (board[origin]!='#') {
    vector<int> queue{origin}; reach[origin][origin]=true;
    for (size_t at=0; at<queue.size(); at++) { int i=queue[at]; for(int d: {-1,1,10}) {int j=i+d; if(j<0||j>=80||(d==-1&&i%10==0)||(d==1&&i%10==9)||board[j]=='#'||reach[origin][j])continue;reach[origin][j]=true;queue.push_back(j);} }
  }
  for(int a=0;a<80;a++)for(int b=0;b<80;b++) for(int i=0;i<80&&!compatible[a][b];i++) if(reach[a][i])for(int d: {-10,-1,1,10}) {int j=i+d;if(j>=0&&j<80&&!(d==-1&&i%10==0)&&!(d==1&&i%10==9)&&reach[b][j])compatible[a][b]=true;}
}
bool settle(string& b) {
  while(true) {
    bool changed=true;
    while(changed) { changed=false; for(int y=6;y>=0;y--)for(int x=9;x>=0;x--) {int i=y*10+x;if(block(b[i])&&b[i+10]=='.'){b[i+10]=b[i];b[i]='.';changed=true;}} }
    array<bool,80> remove{}; bool any=false;
    for(int i=0;i<80;i++)if(block(b[i])) {if(i%10<9&&b[i]==b[i+1])remove[i]=remove[i+1]=any=true;if(i<70&&b[i]==b[i+10])remove[i]=remove[i+10]=any=true;}
    if(!any)break;for(int i=0;i<80;i++)if(remove[i])b[i]='.';
  }
  for(int i=0;i<80;i++)if(block(b[i])) {bool can=false;for(int j=0;j<80;j++)if(i!=j&&b[i]==b[j]&&compatible[i][j]){can=true;break;}if(!can)return false;}
  return true;
}
double heuristic(const string& b, int mode) {
  double total=0; int blocks=0;
  for(int i=0;i<80;i++)if(block(b[i])) {blocks++;double best=100;for(int j=0;j<80;j++)if(i!=j&&b[i]==b[j])best=min(best, double(abs(i%10-j%10)) + abs(i/10-j/10)*(mode==0?0.7:1.5));total+=best;}
  return blocks*(mode==0?50:15)+total*(mode==0?3:8);
}
int main(int argc,char** argv) {
  string start;cin>>start;if(start.size()!=80)return 2;init(start);int mode=argc>1?stoi(argv[1]):0;
  vector<Node> nodes;nodes.reserve(500000);nodes.push_back({start,-1,-1,0,0});priority_queue<Item> pending;pending.push({0,0});unordered_set<string> seen;seen.insert(start);
  while(!pending.empty()) {
    int index=pending.top().index;pending.pop();Node node=nodes[index];
    if(node.b.find_first_of("abcdefgh")==string::npos) {vector<int> path;while(index>0){path.push_back(nodes[index].move);index=nodes[index].parent;}reverse(path.begin(),path.end());for(int m:path)cout<<(m/2)<<' '<<(m%2?1:-1)<<'\n';return 0;}
    if(nodes.size()>6000000){cerr<<"Search bound reached\n";return 3;}
    for(int i=0;i<80;i++)if(block(node.b[i]))for(int dir:{-1,1}) {
      int j=i+dir;if(j<0||j>=80||(dir==-1&&i%10==0)||(dir==1&&i%10==9)||node.b[j]!='.')continue;
      string next=node.b;swap(next[i],next[j]);if(!settle(next)||seen.count(next))continue;seen.insert(next);
      double priority=(node.depth+1)*(mode==0?0.25:1)+heuristic(next,mode);
      nodes.push_back({std::move(next),index,i*2+(dir==1),node.depth+1,priority});pending.push({priority,int(nodes.size()-1)});
    }
  }
  return 4;
}
