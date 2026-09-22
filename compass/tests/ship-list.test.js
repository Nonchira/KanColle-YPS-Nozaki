import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,emptyState,reduce} from '../core.js';
import {shipIdentity,sortShips,groupShips} from '../ship-list.js';
import {shipWorkspace} from '../workspace-ui.js';
import {demoData} from '../demo.js';

test('received class, standard and encyclopedia numbers remain distinct and missing stays unknown',()=>{
  const event=normalize('/api_start2/getData',{api_result:1,api_data:{api_mst_ship:[{api_id:1,api_ctype:28,api_sort_id:110,api_sortno:31,api_stype:2},{api_id:2}],api_mst_stype:[{api_id:2,api_name:'駆逐艦',api_sortno:7}]}},'2026-09-07T00:00:00Z','class-master');
  const state=reduce(emptyState(),event).state,info=shipIdentity(state,{masterId:1});
  assert.equal(info.className,'睦月型');assert.equal(info.originalNo,110);assert.equal(info.catalogNo,31);assert.equal(info.typeOrder,7);
  assert.equal(shipIdentity(state,{masterId:2}).classId,null);assert.equal(shipIdentity(state,{masterId:2}).originalNo,null);
});
test('standard and catalog sort independently of owned IDs and level with unknowns last',()=>{
  const state={shipMaster:{1:{sortId:300,catalogNo:1},2:{sortId:100,catalogNo:3},3:{sortId:200,catalogNo:2},4:{}}};
  const ships=[{id:1,masterId:1,level:20},{id:99,masterId:2,level:10},{id:3,masterId:3,level:90},{id:4,masterId:4,level:100}];
  const ids=mode=>sortShips(state,ships,mode).map(s=>s.id);
  assert.deepEqual(ids('original'),[99,3,1,4]);assert.deepEqual(ids('catalog'),[1,3,99,4]);assert.deepEqual(ids('level'),[4,3,1,99]);assert.equal(ships[0].id,1);
});
test('class groups preserve sisters and duplicate owned ships without mixing current ship types',()=>{
  const {state}=demoData();state.ships[101]={...state.ships[7],id:101};
  const groups=groupShips(state,sortShips(state,Object.values(state.ships)));
  const dd=groups.find(g=>g.id==='2'),mutsuki=dd.classes.find(g=>g.id==='28');
  assert.deepEqual(mutsuki.ships.map(s=>s.id),[7,101,8]);
  assert.equal(groups.flatMap(g=>g.ships).length,13);
  delete state.shipMaster[7].classId;
  assert.ok(groupShips(state,Object.values(state.ships)).find(g=>g.id==='2').classes.some(c=>c.name==='艦型未取得'));
  assert.equal(groupShips(state,Object.values(state.ships),'none')[0].ships.length,13);
});
test('class names are searchable and beginner headings include members; all views preserve equipment links',()=>{
  const {state}=demoData(),html=shipWorkspace(state,{query:'睦月型'});
  assert.match(html,/この一覧: 睦月改二・如月改二/);assert.doesNotMatch(html,/href="#ships\/5"/);
  assert.match(shipWorkspace(state,{type:'9'}),/大和型/);assert.doesNotMatch(shipWorkspace(state,{type:'9'}),/href="#ships\/7"/);
  assert.match(shipWorkspace(state,{group:'none'}),/href="#equipment\/9"/);
  state.shipTypes[2].name='<script>bad</script>';assert.doesNotMatch(shipWorkspace(state),/<script>bad/);assert.match(shipWorkspace(state),/&lt;script&gt;/);
});
