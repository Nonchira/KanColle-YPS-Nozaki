import test from 'node:test';
import assert from 'node:assert/strict';
import {expeditionRewards,orderedMissions,expeditionWorkspace,itemRewardHtml,hourlyReward} from '../expedition-ui.js';
import {EXPEDITION_RULES} from '../expedition-data.js';
import {EXPEDITION_REWARDS,EXPEDITION_ITEM_REWARDS} from '../expedition-rewards-data.js';
test('item rewards distinguish random first slot and guaranteed great-only second slot',()=>{
 assert.deepEqual(Object.keys(EXPEDITION_ITEM_REWARDS).sort(),Object.keys(EXPEDITION_REWARDS).sort());
 assert.deepEqual(EXPEDITION_ITEM_REWARDS['2'],[{name:'高速修復材',normal:[0,1],great:[0,1],mode:'random'}]);
 assert.deepEqual(EXPEDITION_ITEM_REWARDS['32'][1],{name:'開発資材',normal:[0,0],great:[1,3],mode:'great-only'});
 assert.equal(EXPEDITION_ITEM_REWARDS['D2'][0].name,'給糧艦「伊良湖」');
 assert.equal(EXPEDITION_ITEM_REWARDS['A6'][1].name,'改修資材');
 assert.deepEqual(EXPEDITION_ITEM_REWARDS['1'],[]);
 assert.match(itemRewardHtml({id:32}),/1～3個/);
 assert.match(itemRewardHtml({id:32}),/必ず入手/);
 assert.match(itemRewardHtml({id:2}),/ランダム/);
 assert.match(itemRewardHtml({id:1}),/ありません/);
 assert.match(itemRewardHtml({id:999}),/未登録/);
 assert.match(itemRewardHtml({id:33}),/対象外/);
 for(const items of Object.values(EXPEDITION_ITEM_REWARDS))for(const item of items){
  assert.ok(item.great[1]>=item.great[0]);
  assert.deepEqual(item.normal,item.mode==='random'?item.great:[0,0]);
 }
});
test('reward catalog covers all non-support missions and integer resource values',()=>{
 assert.deepEqual(Object.keys(EXPEDITION_REWARDS).sort(),Object.keys(EXPEDITION_RULES).filter(k=>!['33','34'].includes(k)).sort());
 for(const values of Object.values(EXPEDITION_REWARDS)){assert.equal(values.length,4);assert.ok(values.every(n=>Number.isInteger(n)&&n>=0));}
});
test('normal and great rewards include verified odd amount and numeric zero',()=>{
 assert.deepEqual(expeditionRewards({id:37}),{normal:[0,380,270,0],great:[0,570,405,0],daihatsu4:[0,456,324,0],daihatsu4Great:[0,684,486,0]});
 assert.deepEqual(expeditionRewards({id:38}),{normal:[420,0,200,0],great:[630,0,300,0],daihatsu4:[504,0,240,0],daihatsu4Great:[756,0,360,0]});
 assert.deepEqual(expeditionRewards({id:101,dispNo:'A1'}),{normal:[45,45,0,0],great:[68,68,0,0],daihatsu4:[54,54,0,0],daihatsu4Great:[81,81,0,0]});
 assert.equal(expeditionRewards({id:999}),null);assert.equal(expeditionRewards({id:33}),null);
 const a=expeditionRewards({id:37});a.normal[1]=999;assert.equal(expeditionRewards({id:37}).normal[1],380);
});
test('each resource sorts descending with unknown last and stable area/id tie break',()=>{
 const state={missionMaster:{a:{id:37,mapArea:5},b:{id:38,mapArea:5},c:{id:999,mapArea:1},d:{id:5,mapArea:1},e:{id:6,mapArea:1}}};
 for(const [key,expected] of Object.entries({fuel:[38,5,6,37,999],ammo:[37,5,6,38,999],steel:[37,38,5,6,999],bauxite:[6,5,37,38,999]}))assert.deepEqual(orderedMissions(state,key).map(m=>m.id),expected);
 assert.deepEqual(Object.keys(state.missionMaster),['a','b','c','d','e']);
});
test('detail renders separate success columns and explicit unknown/support descriptions',()=>{
 const s={missionMaster:{37:{id:37,name:'東京急行'}},fleets:[]};
 const page=expeditionWorkspace(s,37);assert.match(page,/通常成功/);assert.match(page,/大成功/);assert.match(page,/>570</);assert.match(page,/補給消費/);
 assert.match(expeditionWorkspace({missionMaster:{999:{id:999}},fleets:[]},999),/資源報酬は未登録/);
 assert.match(expeditionWorkspace({missionMaster:{33:{id:33}},fleets:[]},33),/支援遠征は資源報酬の対象外/);
});
test('hourly rates reverse total reward order and keep unavailable data last without rounding sort values',()=>{
 const state={missionMaster:{5:{id:5,durationMin:90,mapArea:1},38:{id:38,durationMin:175,mapArea:5},1:{id:1,durationMin:15,mapArea:1},9:{id:9,mapArea:1}}};
 assert.deepEqual(orderedMissions(state,'fuel').map(m=>m.id),[38,9,5,1]);
 assert.deepEqual(orderedMissions(state,'fuel','hour').map(m=>m.id),[38,5,1,9]);
 const ammo={missionMaster:{2:{id:2,durationMin:30},37:{id:37,durationMin:165}}};
 assert.deepEqual(orderedMissions(ammo,'ammo').map(m=>m.id),[37,2]);
 assert.deepEqual(orderedMissions(ammo,'ammo','hour').map(m=>m.id),[2,37]);
 assert.equal(hourlyReward({id:2,durationMin:30},'ammo'),200);
 assert.equal(hourlyReward({id:5,durationMin:90},'fuel'),200*60/90);
 assert.equal(hourlyReward({id:1,durationMin:15},'fuel'),0);
 for(const durationMin of [undefined,null,0,-1,NaN,Infinity,'30'])assert.equal(hourlyReward({id:2,durationMin},'ammo'),null);
 assert.equal(hourlyReward({id:999,durationMin:30},'ammo'),null);
 assert.equal(hourlyReward({id:33,durationMin:30},'ammo'),null);
 for(const key of ['fuel','ammo','steel','bauxite']){
  const rows=orderedMissions(state,key,'hour').map(m=>hourlyReward(m,key));
  assert.equal(rows.at(-1),null);assert.ok(rows.slice(0,-1).every((v,i,a)=>!i||a[i-1]>=v));
 }
 assert.match(expeditionWorkspace(state,38),/1時間あたり/);
});
