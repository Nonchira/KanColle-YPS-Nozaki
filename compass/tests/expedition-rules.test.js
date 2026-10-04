import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPEDITION_RULES,expeditionRule,expeditionCheck,greatCondition} from '../expedition-rules.js';
import {expeditionWorkspace} from '../expedition-ui.js';
import {emptyState} from '../core.js';
function tokyo(){
 const s=emptyState();s.ships={};s.equipment={};s.fleets=[{id:2,name:'第二艦隊',shipIds:[1,2,3,4,5,6],mission:[1]}];s.missionMaster={37:{id:37,name:'東京急行',dispNo:'37',durationMin:165}};
 s.equipmentMaster={30:{category:30,name:'ドラム缶(輸送用)'},24:{category:24,name:'上陸用舟艇'}};
 for(let i=1;i<=6;i++){s.shipMaster[i]={type:i===1?3:2,name:`艦${i}`};s.ships[i]={id:i,masterId:i,level:i===1?50:30,cond:i<=4?50:49,slots:[]};}
 for(let i=1;i<=5;i++){s.equipment[i]={id:i,masterId:30};s.ships[i<3?1:i-1].slots.push(i);}
 return s;
}
const check=s=>expeditionCheck(s,s.fleets[0],s.missionMaster[37]);
test('all 63 listed expeditions include levels and separate success/great-success rules',()=>{
 assert.equal(Object.keys(EXPEDITION_RULES).length,63);
 for(const [id,r] of Object.entries(EXPEDITION_RULES)){assert.ok(r.min>=2&&r.min<=6,id);if(!['33','34'].includes(id))assert.ok(r.flagshipLevel>=1,id);assert.ok(r.great.kind,id);}
 assert.equal(expeditionRule({id:101,dispNo:'A1'}).flagshipLevel,5);
 assert.equal(expeditionRule({id:101}),null);
 assert.equal(expeditionRule({id:1,dispNo:'01'}).number,'1');
});
test('Tokyo Express checks flagship, sum, drum count and carriers of drums independently',()=>{
 const s=tokyo(),before=JSON.stringify(s),r=check(s);
 assert.equal(r.total,200);assert.equal(r.drums,5);assert.equal(r.drumShips,4);assert.equal(r.kira,4);assert.ok(r.checks.every(x=>x.status==='pass'));assert.equal(JSON.stringify(s),before);
 s.ships[1].level=49;assert.equal(check(s).checks.find(x=>x.label==='旗艦Lv').status,'fail');
 s.ships[1].level=50;s.ships[4].slots=[]; // Four drums remain, satisfying success but not guaranteed great success.
 assert.equal(check(s).checks.find(x=>x.label==='成功用ドラム缶').status,'pass');
 assert.equal(check(s).checks.at(-1).status,'fail');
 for(const ship of Object.values(s.ships))ship.slots=[];s.ships[1].slots=[1,2,3,4,5];
 assert.equal(check(s).checks.find(x=>x.label==='成功用搭載隻数').status,'fail');
});
test('only drum category 30 counts; missing equipment remains unknown',()=>{
 const s=tokyo();s.equipment[1].masterId=24;assert.equal(check(s).drums,4);
 delete s.equipment[2];assert.equal(check(s).equipmentKnown,false);assert.equal(check(s).checks.find(x=>x.label==='成功用ドラム缶').status,'unknown');
});
test('24 and 40 need drums for great success, not ordinary success; monthly minimums stay distinct',()=>{
 assert.equal(EXPEDITION_RULES['24'].drums,0);assert.equal(EXPEDITION_RULES['24'].great.drums,2);
 assert.equal(EXPEDITION_RULES['40'].drums,0);assert.equal(EXPEDITION_RULES['40'].great.drums,4);
 for(const [id,success,great,ships] of [['21',3,4,3],['37',4,5,3],['38',8,10,4],['44',6,8,3],['E2',4,6,3]]){
  const r=EXPEDITION_RULES[id];assert.equal(r.drums,success);assert.equal(r.great.drums,great);assert.equal(r.drumShips,ships);
 }
});
test('level-type and uncertain great success do not become universal guarantees',()=>{
 const s=tokyo(),f=s.fleets[0];s.ships[1].level=127;
 assert.equal(expeditionCheck(s,f,{id:41}).checks.at(-1).status,'fail');
 s.ships[1].level=128;assert.equal(expeditionCheck(s,f,{id:41}).checks.at(-1).status,'pass');
 assert.equal(expeditionCheck(s,f,{id:32}).checks.at(-1).status,'unknown');
 assert.match(greatCondition(EXPEDITION_RULES['B6']),/検証中/);
});
test('UI consolidates conditions at top and does not repeat bottom block or fabricate an equipment plan',()=>{
 const html=expeditionWorkspace(tokyo(),'37');
 assert.match(html,/旗艦Lv 50以上.*合計Lv 200以上/);
 assert.match(html,/ドラム缶 4個以上を3隻以上/);assert.match(html,/ドラム缶5個以上を3隻以上/);
 assert.doesNotMatch(html,/必要条件と判定範囲|遠征用の装備組み合わせ/);
 assert.match(html,/現在装備/);
});
