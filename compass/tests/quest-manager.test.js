import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {questModel,questPeriod,definition,validateQuestCorrection} from '../quest-manager.js';
import {questCatalog} from '../quest-catalog.js';
import {normalize,reduce,emptyState} from '../core.js';
import {monthlyMissionPeriod,questWorkspace} from '../quest-ui.js';
import {ypsQuestProgress} from '../yps-quest-progress.js';

test('legacy numeric counters are read without reset, old daily/weekly counts are excluded',()=>{
 const now=Date.parse('2026-09-19T12:00:00+09:00'),day=Math.floor((now-Date.UTC(2013,3,22,-4))/86400000),week=Math.floor(day/7);
 const scope={$weekly:{daily:day,week,quest_progress:{1:3,2:6,3:{boss:2}}},$quest_complete_daily:{1:5},$quest_complete_weekly:{2:10,3:20}};
 const before=JSON.stringify(scope);assert.deepEqual(ypsQuestProgress(scope,now).map(p=>p.count),[3,6]);assert.equal(JSON.stringify(scope),before);
 scope.$weekly.daily--;assert.deepEqual(ypsQuestProgress(scope,now).map(p=>p.id),[2]);scope.$weekly.week--;assert.deepEqual(ypsQuestProgress(scope,now),[]);
});
const now=Date.parse('2026-09-19T12:00:00+09:00');
const entry=(at,list)=>({id:at,path:'/api_get_member/questlist',at,patch:{questPage:list}});
const q=(id,title,state=2,type=5,labelType=null)=>({id,title,state,type,labelType,progress:1});
const at='2026-09-19T10:00:00+09:00';
test('JST 5am daily/weekly/monthly/quarterly/yearly rollover preserves exact boundaries',()=>{
 assert.equal(questPeriod({period:'month'},'2026-10-01T04:59:59+09:00').key,'2026-09-01');
 assert.equal(questPeriod({period:'month'},'2026-10-01T05:00:00+09:00').key,'2026-10-01');
 assert.equal(questPeriod({period:'week'},'2026-09-21T04:59:59+09:00').key,'2026-09-14');
 assert.equal(questPeriod({period:'week'},'2026-09-21T05:00:00+09:00').key,'2026-09-21');
 assert.equal(questPeriod({period:'quarter'},'2027-01-01T10:00:00+09:00').key,'2026-12-01');
 assert.equal(questPeriod({period:'quarter'},'2027-03-01T05:00:00+09:00').key,'2027-03-01');
 assert.equal(questPeriod({period:'year',month:6},'2027-06-01T04:59:59+09:00').key,'2026-06-01');
 assert.equal(questPeriod({period:'year',month:6},'2027-06-01T05:00:00+09:00').key,'2027-06-01');
 assert.equal(questPeriod({period:'year',month:2},'2027-01-01T10:00:00+09:00').key,'2026-02-01');
 assert.equal(questPeriod({period:'day'},'2026-09-20T04:59:59+09:00').key,'2026-09-19');
 assert.equal(questPeriod({period:'year'},now).key,'unknown');
});
test('catalog keys, yearly months and conservative AND relations are valid',()=>{
 assert.equal(new Set(questCatalog.quests.map(q=>q.key)).size,questCatalog.quests.length);
 assert.ok(questCatalog.quests.length>600);
 assert.ok(questCatalog.quests.filter(q=>q.period==='year').every(q=>q.month>=1&&q.month<=12));
 assert.deepEqual(questCatalog.quests.find(q=>q.key==='Bq10').parents,['Bq2']);
 assert.equal(questCatalog.quests.find(q=>q.key==='Bq12').verified,false);
 assert.equal(definition(q(1,'AL作戦',2,5,106)).month,6);
 assert.equal(definition(q(1,'新規未登録年次任務',2,5,102)).period,'year');
 assert.equal(definition(q(1,'新規不明任務')).period,'unknown');
});
test('observed quest pages survive missing pages; a new session and action mark prior state stale',()=>{
 const e=entry(at,[q(249,'「第五戦隊」出撃せよ！',2,3)]),s={id:'session',path:'local/quest-session',at:'2026-09-19T11:00:00+09:00'};
 let row=questModel([e],now).rows.find(r=>r.id===249);assert.equal(row.status,'active');assert.equal(row.fresh,true);
 row=questModel([e,s,entry('2026-09-19T11:05:00+09:00',[q(999,'other')])],now).rows.find(r=>r.id===249);assert.equal(row.status,'active');assert.equal(row.fresh,false);
 row=questModel([e,s,entry('2026-09-19T11:06:00+09:00',[q(249,'「第五戦隊」出撃せよ！',3,3)])],now).rows.find(r=>r.id===249);assert.equal(row.status,'achieved');assert.equal(row.fresh,true);
 row=questModel([e],Date.parse('2026-10-01T05:00:00+09:00')).rows.find(r=>r.id===249);assert.equal(row.status,'unknown');assert.equal(row.history.length,1);
});
test('same-quarter successor confirms Z front; new quarter and uncertainty do not',()=>{
 const e=entry(at,[q(843,'戦果拡張任務！「Z作戦」後段作戦')]);
 assert.equal(questModel([e],now).rows.find(r=>r.key==='Bq2').status,'complete');
 assert.equal(questModel([e],Date.parse('2026-12-01T05:00:00+09:00')).rows.find(r=>r.key==='Bq2').status,'unknown');
 assert.equal(questModel([entry(at,[q(845,'発令！「西方海域作戦」')])],now).rows.find(r=>r.key==='Bq11').status,'unknown');
 const direct=entry('2026-09-19T11:00:00+09:00',[q(854,'戦果拡張任務！「Z作戦」前段作戦',1)]);
 assert.equal(questModel([e,direct],now).rows.find(r=>r.key==='Bq2').status,'unaccepted');
});
test('monthly successor does not complete this weeks prerequisite; locked requires current compatible evidence',()=>{
 const rows=questModel([entry(at,[q(257,'「水雷戦隊」南西へ！',2,3)])],now).rows;
 assert.equal(rows.find(r=>r.key==='Bw4').status,'unknown');
 const day=questModel([entry(at,[q(218,'敵補給艦を3隻撃沈せよ！',2,1)])],now).rows;
 assert.equal(day.find(r=>r.key==='Bd7').status,'locked');
});
test('manual current-period status is preserved with conflict note, achieved overrides, reset keeps audit',()=>{
 const e=entry(at,[q(249,'「第五戦隊」出撃せよ！',2,3)]),manual={id:'m',at:'2026-09-19T10:30:00+09:00',path:'local/quest-correction',correction:{id:249,period:'2026-09-01',status:'complete',note:'スマホ'}};
 assert.equal(questModel([e,manual],now).rows.find(r=>r.id===249).status,'complete');
 const later=entry('2026-09-19T11:30:00+09:00',[{...q(249,'「第五戦隊」出撃せよ！',2,3),progress:2}]);
 assert.match(questModel([e,manual,later],now).rows.find(r=>r.id===249).reason,/再確認/);
 const achieved=entry('2026-09-19T11:40:00+09:00',[q(249,'「第五戦隊」出撃せよ！',3,3)]);
 assert.equal(questModel([e,manual,later,achieved],now).rows.find(r=>r.id===249).status,'achieved');
 const reset=questModel([e,manual],Date.parse('2026-10-01T05:00:00+09:00')).rows.find(r=>r.id===249);assert.equal(reset.status,'unknown');assert.equal(reset.history.length,2);
 assert.throws(()=>validateQuestCorrection({...manual.correction,period:'unknown'}));
});
test('unobserved wiki corrections reconcile to a later received quest without duplicate state',()=>{
 const m={id:'m',at,path:'local/quest-correction',correction:{id:'wiki:Bm1',period:'2026-09-01',status:'complete',note:'スマホ'}};
 assert.equal(questModel([m],now).rows.find(r=>r.key==='Bm1').status,'complete');
 const r=questModel([m,entry('2026-09-19T11:00:00+09:00',[q(249,'「第五戦隊」出撃せよ！',2,3)])],now).rows.filter(r=>r.key==='Bm1');assert.equal(r.length,1);assert.equal(r[0].history.length,2);assert.equal(r[0].manual.status,'complete');
});
test('legacy reward receipt differs from achieved, newer direct data wins and old snapshots cannot overwrite it',()=>{
 const e=entry(at,[q(249,'「第五戦隊」出撃せよ！',3,3)]),c={id:'c',at:'2026-09-19T11:00:00+09:00',patch:{legacyQuestClear:[{...q(249,'「第五戦隊」出撃せよ！',3,3),at:'2026-09-19T10:30:00+09:00'}]}};
 assert.equal(questModel([e,c],now).rows.find(r=>r.id===249).status,'complete');
 assert.equal(questModel([e,c,entry('2026-09-19T11:30:00+09:00',[q(249,'「第五戦隊」出撃せよ！',1,3)])],now).rows.find(r=>r.id===249).status,'unaccepted');
});
test('monthly expeditions reset at 15th noon separately from monthly quests; response metadata only',()=>{
 assert.equal(new Date(monthlyMissionPeriod(Date.parse('2026-09-15T11:59:59+09:00')).end).toISOString(),'2026-09-15T03:00:00.000Z');
 assert.equal(new Date(monthlyMissionPeriod(Date.parse('2026-09-15T12:00:00+09:00')).end).toISOString(),'2026-10-15T03:00:00.000Z');
 const e=normalize('/api_get_member/mission',{api_result:1,api_data:{api_list_items:[{api_mission_id:42,api_state:2}],api_limit_time:[Date.parse('2026-10-15T12:00:00+09:00')/1000]}},at,'mission');
 assert.equal(reduce(emptyState(),e).state.missionStatus.items[0].state,2);
 const quest=normalize('/api_get_member/questlist',{api_result:1,api_data:{api_list:[{api_no:1,api_title:'Y',api_type:5,api_label_type:109,api_state:2}]}},at,'q');assert.equal(quest.patch.questPage[0].labelType,109);
 assert.throws(()=>normalize('/api_req_quest/clearitemget',{api_result:0},at,'bad'));
 assert.equal(normalize('/api_req_quest/clearitemget',{api_result:1},at,'ok').patch.questAction,'clearitemget');
});
test('UI escapes text, exposes history and correction, and runtime code has no game requests',()=>{
 const html=questWorkspace([entry(at,[q(9999,'<script>unsafe</script>',2,3)])],now);assert.match(html,/&lt;script&gt;/);assert.match(html,/受信・補正の履歴/);assert.match(html,/次回更新/);
 for(const file of ['quest-ui.js','quest-manager.js','collector-integrated.js'])assert.doesNotMatch(readFileSync(new URL('../'+file,import.meta.url),'utf8'),/\bfetch\s*\(|XMLHttpRequest|WebSocket|postData|sendBeacon/);
});

test('indexed definitions preserve full-scan matches, API period filtering and unknown titles',()=>{
 const norm=s=>String(s||'').normalize('NFKC').replace(/[\s!！「」『』、,]/g,'');
 const probes=questCatalog.quests.map((c,i)=>({id:i,title:c.title,type:({day:1,week:2,month:3,once:4})[c.period]||5,labelType:c.period==='year'?100+c.month:undefined}));
 probes.push({id:-1,title:'未定義の任務',type:5},{id:-2,title:questCatalog.quests[0].title,type:3},{id:-3,title:' '+questCatalog.quests[0].title+'！',type:5});
 for(const q of probes){
  const label=q.labelType,fromApi=label>=101&&label<=112?'year':({1:'day',2:'week',3:'month',4:'once'})[q.type];
  const matches=questCatalog.quests.filter(c=>norm(c.title)===norm(q.title)&&(!fromApi||c.period===fromApi));
  const c=matches.length===1?matches[0]:null;
  assert.deepEqual(definition(q),{...c,id:q.id,title:q.title||c?.title||`任務 #${q.id}`,period:fromApi||c?.period||'unknown',month:label>=101&&label<=112?label-100:c?.month||null});
 }
});
