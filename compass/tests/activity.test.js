import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,reduce,emptyState,apiPath} from '../core.js';
import {activityFact,activityRows,activityView} from '../activity.js';
const start='/api_req_map/start',next='/api_req_map/next',battle='/api_req_sortie/battleresult',port='/api_port/port',mission='/api_req_mission/result';
function records(packets){let state=emptyState();return packets.map(([path,data],i)=>{const result=reduce(state,normalize(path,{api_result:1,api_data:data},new Date(Date.UTC(2026,8,19,1,0,i)).toISOString(),String(i)));state=result.state;return result.entry;});}
const home={api_ship:[],api_material:[]};
test('legacy C/B,C/S,C/S without next retains rank but rejects stale node',()=>{
  const events=records([[start,{api_maparea_id:4,api_mapinfo_no:5,api_no:3}],[battle,{api_win_rank:'B'}],[battle,{api_win_rank:'S'}],[battle,{api_win_rank:'S'}],[port,home]]);
  for(const e of events)if(e.battle)e.battle.location={area:4,map:5,node:3};
  const snapshot=JSON.stringify(events),r=activityRows(events)[0];
  assert.equal(r.result,'S');assert.equal(r.name,'4-5');assert.match(r.note,/マス 不明.*進撃記録欠落/);assert.equal(JSON.stringify(events),snapshot);
});
test('4-5 two T results remain T; trace exposes missing results and conflicting locations',()=>{
  const packets=[[start,{api_maparea_id:4,api_mapinfo_no:5,api_no:3}],[battle,{api_win_rank:'S'}],[next,{api_no:32}],[battle,{api_win_rank:'S'}],[port,home]];
  const events=records([...packets,...packets]),rows=activityRows(events);
  assert.deepEqual(rows.map(r=>r.note),['帰港 / 最終戦・マス T','帰港 / 最終戦・マス T']);
  assert.match(rows[1].trace.join('\n'),/進撃 4-5 \/ マス T/);
  const missing=activityRows(events.filter((e,i)=>i!==8))[1];
  assert.match(missing.note,/以降の到達 T.*結果未受信/);
  const conflict=structuredClone(events);conflict[8].battle.location.node=3;
  assert.match(activityRows(conflict)[1].note,/位置記録の不一致/);
  assert.match(activityView(rows),/記録詳細/);
});
test('one sortie row for multiple battles, including 7-2 gauges, with daily indexes',()=>{
  const events=records([[start,{api_maparea_id:5,api_mapinfo_no:1,api_no:1}],[battle,{api_win_rank:'S'}],[next,{api_no:10}],[battle,{api_win_rank:'A'}],[port,home],[start,{api_maparea_id:7,api_mapinfo_no:2,api_no:7}],[battle,{api_win_rank:'S'}],[port,home],[start,{api_maparea_id:7,api_mapinfo_no:2,api_no:15}],[battle,{api_win_rank:'S'}],[port,home]]);
  const rows=activityRows(events.map(activityFact));
  assert.deepEqual(rows.map(r=>[r.name,r.result,r.number]),[['5-1','A',1],['7-2-1','S',2],['7-2-2','S',3]]);
  assert.equal(rows[0].time,'10:00:00');assert.match(rows[0].note,/帰港.*最終戦・マス J/);
  assert.match(rows[1].note,/マス G/);assert.match(rows[2].note,/マス M/);
  assert.equal(activityRows([...events,...events]).length,3);
});
test('unknown, partial, retreat, unfinished, event area and interrupted records are honest',()=>{
  const events=records([[battle,{api_win_rank:'B'}],[port,home],[start,{api_maparea_id:7,api_mapinfo_no:2,api_no:1}],[port,home],[start,{api_maparea_id:50,api_mapinfo_no:1}],[battle,{api_win_rank:'S'}],[port,home],[start,{api_maparea_id:1,api_mapinfo_no:5,api_no:1}],[battle,{api_win_rank:'A'}]]);
  const rows=activityRows(events);
  assert.equal(rows.length,3);assert.equal(rows[0].name,'海域不明');assert.match(rows[0].note,/出撃開始未受信/);
  assert.equal(rows[1].name,'7-2');assert.equal(rows[1].result,'—');assert.match(rows[2].note,/帰港未確認/);
});
test('expedition normalization uses only response name/result and unknown stays unknown',()=>{
  assert.equal(apiPath('https://game.example/kcsapi'+mission),mission);
  const events=records([0,1,2,99].map(result=>[mission,{api_quest_name:'東京急行',api_clear_result:result,api_token:'SECRET',api_deck_id:4}]));
  assert.deepEqual(activityRows(events).map(r=>r.result),['失敗','成功','大成功','不明']);
  assert.doesNotMatch(JSON.stringify(events),/SECRET|api_token|deck_id/);
  assert.deepEqual(Object.keys(events[0].patch.expedition),['name','result']);
});
test('JST date rollover, filters retain indexes, pagination and HTML escaping',()=>{
  const events=Array.from({length:61},(_,i)=>({id:String(i),at:new Date(Date.UTC(2026,8,19,14,59,i)).toISOString(),path:mission,patch:{expedition:{name:'<img onerror="x">',result:2}}}));
  const rows=activityRows(events);assert.equal(rows[59].number,60);assert.equal(rows[60].day,'2026-09-20');assert.equal(rows[60].number,1);
  const html=activityView(rows,{kind:'expedition',day:'2026-09-19',page:1});
  assert.match(html,/2 \/ 2 ページ/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
  assert.equal((html.match(/<tr>/g)||[]).length,11);
  assert.match(activityView(rows,{kind:'sortie'}),/該当する履歴はありません/);
});
test('new start closes missed port, reload separates sessions, expedition does not split a sortie',()=>{
  const events=records([[start,{api_maparea_id:5,api_mapinfo_no:4}],[mission,{api_quest_name:'海上護衛任務',api_clear_result:1}],[battle,{api_win_rank:'A'}],[start,{api_maparea_id:5,api_mapinfo_no:4}],[battle,{api_win_rank:'S'}],['/api_start2/getData',{}],[start,{api_maparea_id:1,api_mapinfo_no:5}]]);
  const rows=activityRows(events);assert.equal(rows.length,4);assert.equal(rows[0].result,'A');assert.match(rows[0].note,/帰港未確認/);assert.equal(rows[1].kind,'expedition');assert.match(rows[2].note,/記録中断/);
  assert.deepEqual(rows.map(r=>r.number),[1,1,2,3]);
});

test('expedition tab displays received display ID including legacy records and alphanumeric IDs',()=>{
 const events=records([['/api_req_mission/result',{api_quest_name:'ブルネイ泊地沖哨戒',api_clear_result:1}],['/api_req_mission/result',{api_quest_name:'海峡警備行動',api_clear_result:2}]]);
 const before=JSON.stringify(events),master={41:{name:'ブルネイ泊地沖哨戒',dispNo:'41'},101:{name:'海峡警備行動',dispNo:'A2'}};
 const rows=activityRows(events,master);assert.deepEqual(rows.map(r=>r.missionId),['41','A2']);assert.equal(JSON.stringify(events),before);
 const html=activityView(rows,{kind:'expedition'});assert.match(html,/>ID<\/th>/);assert.match(html,/>41<\/td>/);assert.match(html,/>A2<\/td>/);assert.doesNotMatch(html,/>種類<\/th>/);
 assert.equal(activityRows(events)[0].missionId,null);
 assert.equal(activityRows(events,{...master,999:{name:'ブルネイ泊地沖哨戒',dispNo:'99'}})[0].missionId,null);
 assert.equal(activityRows(events,{41:{name:'ブルネイ泊地沖哨戒',id:41}})[0].missionId,null);
});

test('sortie tab labels normal/EO seas and received names without dropping gauge numbers',()=>{
 const packets=['1-1','1-2','1-5','1-6','2-5','3-5','4-5','5-5','6-5','7-5','7-2'].flatMap(v=>{const [a,m]=v.split('-').map(Number);return [[start,{api_maparea_id:a,api_mapinfo_no:m,api_no:15}],[battle,{api_win_rank:'S'}],[port,home]];});
 const events=records(packets),before=JSON.stringify(events);
 const master={11:{area:1,map:1,name:'鎮守府正面海域'},12:{area:1,map:2,name:'南西諸島沖'},72:{area:7,map:2,name:'タウイタウイ泊地沖'}};
 const rows=activityRows(events,{},master);
 assert.equal(rows[0].displayName,'1-1.鎮守府正面海域');assert.equal(rows[1].displayName,'1-2.南西諸島沖');assert.equal(rows[0].seaType,'通常海域');
 assert.ok(rows.slice(2,10).every(r=>r.seaType==='追加海域（EO）'));assert.equal(rows[10].displayName,'7-2-2.タウイタウイ泊地沖');assert.equal(rows[10].seaType,'通常海域');
 const html=activityView(rows);assert.match(html,/>海域<\/th>/);assert.match(html,/1-1\.鎮守府正面海域/);assert.doesNotMatch(html,/>種類<\/th>/);
 assert.equal(activityRows(events)[0].displayName,'1-1');assert.equal(JSON.stringify(events),before);
});
