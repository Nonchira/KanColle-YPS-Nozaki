import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../core.js';
import {canEquip,equipmentPlanFor} from '../generator.js';

function carrier(){
 const s=emptyState();
 s.shipMaster={278:{name:'加賀改',type:11,slotCount:4,aircraftCapacity:[20,20,46,12]}};
 s.ships={1:{id:1,masterId:278,slots:[1,-1,-1,-1],extraSlot:2,hp:50,maxHp:50}};
 s.shipTypes={11:{equipTypes:{6:1,7:1,8:1,39:1,48:1}}}; // Deliberately too permissive general rules.
 s.shipEquipRules={278:{6:null,7:null,8:null,39:null}};
 s.equipment={};s.equipmentMaster={};
 const add=(id,masterId,category,stats={})=>{s.equipment[id]={id,masterId,stars:0,proficiency:0};s.equipmentMaster[masterId]={name:`test${masterId}`,category,...stats};};
 add(1,129,39);add(2,412,39);add(3,700,48,{aa:99}); // synthetic land-based Ho-like interceptor
 add(4,1001,8,{torpedo:6,asw:20});s.equipment[4].proficiency=7;s.equipment[4].stars=10;
 add(5,1002,8,{torpedo:14,asw:0});
 add(6,1003,7,{bomb:13});add(7,1004,6,{aa:12});add(8,1005,6,{aa:10});
 return s;
}
test('ship-specific allowlist excludes omitted types even if ship-type master allows them',()=>{
 const s=carrier(),ship=s.ships[1];assert.equal(canEquip(s,ship,s.equipment[3],1).allowed,false);
 s.shipEquipRules[278][8]=[1001];assert.equal(canEquip(s,ship,s.equipment[5],1).allowed,false);assert.equal(canEquip(s,ship,s.equipment[4],1).allowed,true);
 ship.slots[0]=5;assert.equal(canEquip(s,ship,s.equipment[5],0).allowed,false); // stale current equipment cannot override explicit denial.
});
test('carrier proposes carrier aircraft, strong torpedo bomber, separate dive bomber; lookout stays expansion only',()=>{
 const s=carrier(),before=JSON.stringify(s),r=equipmentPlanFor(s,[s.ships[1]],{policy:'対潜優先'})[0];
 assert.deepEqual(r.items.map(x=>[x.slot,x.id]),[['i1',5],['i2',7],['i3',6],['i4',8],['ix',2]]);
 assert.ok(!r.items.some(x=>[1,3,4].includes(x.id)));assert.equal(JSON.stringify(s),before);
});
test('aircraft shortage leaves a gap, never fills attack slots with lookout or land-based plane',()=>{
 const s=carrier();delete s.equipment[4];delete s.equipment[5];delete s.equipment[6];
 const r=equipmentPlanFor(s,[s.ships[1]])[0];assert.ok(!r.items.some(x=>x.slot==='i1'||x.slot==='i3'));assert.equal(r.gaps.length,2);assert.ok(r.items.some(x=>x.slot==='ix'&&x.id===2));
});
test('zero or unknown aircraft capacity is not populated with aircraft',()=>{
 const s=carrier();s.shipMaster[278].aircraftCapacity=[0,20,46,0];
 const r=equipmentPlanFor(s,[s.ships[1]])[0];assert.ok(r.items.every(x=>!['i1','i4'].includes(x.slot)));assert.equal(r.items.find(x=>x.slot==='i2').id,5);
 delete s.shipMaster[278].aircraftCapacity;assert.ok(equipmentPlanFor(s,[s.ships[1]])[0].items.every(x=>x.slot==='ix'));
});
test('special compatibility category for large radar does not use generic radar permission',()=>{
 const s=carrier();s.equipment[9]={id:9,masterId:142};s.equipmentMaster[142]={category:13};s.shipEquipRules[278]={13:null};
 assert.equal(canEquip(s,s.ships[1],s.equipment[9],0).allowed,false);s.shipEquipRules[278][93]=null;assert.equal(canEquip(s,s.ships[1],s.equipment[9],0).allowed,true);
});
test('equipment on another waiting ship only participates with explicit transfer option',()=>{
 const s=carrier();s.ships[2]={id:2,masterId:278,slots:[5],extraSlot:-1,hp:50,maxHp:50};
 assert.equal(equipmentPlanFor(s,[s.ships[1]])[0].items.find(x=>x.slot==='i1').id,4);
 assert.equal(equipmentPlanFor(s,[s.ships[1]],{allowTransfers:true})[0].items.find(x=>x.slot==='i1').id,5);
 s.docks=[{shipId:2}];assert.equal(equipmentPlanFor(s,[s.ships[1]],{allowTransfers:true})[0].items.find(x=>x.slot==='i1').id,4);
});
