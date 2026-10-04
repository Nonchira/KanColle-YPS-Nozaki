import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP_PROFILES,generateFleet,availableMaps,profileFor} from '../generator.js';
import {emptyState} from '../core.js';
import {templateOptions} from '../generator-ui.js';
const now=Date.parse('2026-10-04T12:00:00+09:00');
function inventory(){
 const s=emptyState();s.ships={};let id=0;
 const add=(type,name)=>{id++;s.shipMaster[id]={id,type,name:name||`test${id}`,speed:10,slotCount:0};s.ships[id]={id,masterId:id,level:50,cond:49,hp:30,maxHp:30,slots:[]};};
 for(const type of [1,2,3,4,5,6,7,8,9,10,11,13,14,16,18,20,21,22])for(let j=0;j<6;j++)add(type);
 for(const [type,name] of [[5,'羽黒改二'],[5,'足柄改二'],[2,'神風改'],[16,'秋津洲改'],[11,'翔鶴改二'],[18,'瑞鶴改二甲']])add(type,name);
 return s;
}
test('all 37 normal maps have source-backed profiles and isolated stages',()=>{
 const mapIds=new Set(MAP_PROFILES.map(p=>p.id.split('-').slice(0,2).join('-')));
 assert.equal(mapIds.size,37);assert.equal(new Set(MAP_PROFILES.map(p=>p.id)).size,MAP_PROFILES.length);
 for(const [area,count] of [[1,6],[2,5],[3,5],[4,5],[5,6],[6,5],[7,5]])for(let i=1;i<=count;i++)assert.ok(mapIds.has(`${area}-${i}`));
 const s=inventory();
 for(const id of ['7-2','7-3','7-5','5-6']){assert.equal(profileFor(s,id,now).id,id+'-1');assert.ok(!availableMaps(s).some(m=>m.id===id));}
 assert.ok(availableMaps(s).some(m=>m.id==='7-5-M'));
});
test('each registered usable pattern generates a complete fleet; named slots and type counts match',()=>{
 const s=inventory(),before=JSON.stringify(s);
 for(const p of MAP_PROFILES)for(const t of p.templates){
  const r=generateFleet(s,{mapId:p.id,templateId:t.id,now});
  if(t.referenceOnly){assert.equal(r.candidates.length,0);assert.match(r.warnings.join(),/高速＋/);continue;}
  assert.equal(r.candidates.length,1,t.id+' '+t.name);const c=r.candidates[0];
  assert.equal(c.ships.length,t.slots.length);assert.equal(new Set(c.ships.map(s=>s.id)).size,c.ships.length);
  for(const slot of t.slots.filter(x=>x.name))assert.ok(c.ships.some(x=>x.name.startsWith(slot.name)),t.name);
  if(t.flagshipTypes)assert.ok(t.flagshipTypes.includes(s.shipMaster[c.ships[0].masterId].type));
 }
 assert.equal(JSON.stringify(s),before);
});
test('automatic comparisons never repeat a ship-type composition to fill three results',()=>{
 const s=inventory();
 for(const p of MAP_PROFILES){const r=generateFleet(s,{mapId:p.id,now});const signatures=r.candidates.map(c=>c.ships.map(x=>s.shipMaster[x.masterId].type).sort((a,b)=>a-b).join(','));assert.equal(new Set(signatures).size,signatures.length,p.id);}
});
test('named historical fleets cannot use arbitrary same-type replacements',()=>{
 const s=inventory();for(const [id,m] of Object.entries(s.shipMaster))if(/羽黒|足柄|神風/.test(m.name))delete s.ships[id];
 assert.equal(generateFleet(s,{mapId:'7-3-2',now}).candidates.length,0);
 assert.ok(generateFleet(s,{mapId:'7-3-1',now}).candidates.length); // Separate non-historical route remains.
});
test('flagship constraints reject hybrid order and fourth pattern is directly selectable',()=>{
 const s=inventory(),dd=Object.values(s.ships).find(x=>s.shipMaster[x.masterId].type===2);
 const t=MAP_PROFILES.find(p=>p.id==='6-4').templates[0];
 assert.equal(generateFleet(s,{mapId:'6-4',templateId:t.id,mode:'hybrid',selectedIds:[dd.id],now}).candidates.length,0);
 const p=MAP_PROFILES.find(p=>p.id==='4-4');assert.match(templateOptions(p),/重巡主体/);
 assert.match(generateFleet(s,{mapId:'4-4',templateId:p.templates[3].id,now}).candidates[0].template,/重巡主体/);
});
