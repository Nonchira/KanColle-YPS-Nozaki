import test from 'node:test';
import assert from 'node:assert/strict';
import {dropView} from '../drop-ui.js';
import {activityFact} from '../activity.js';
const events=Array.from({length:121},(_,i)=>({id:String(i),at:new Date(Date.UTC(2026,8,20,14,59,i)).toISOString(),path:'/api_req_sortie/battleresult',battle:{rank:'S',drop:{name:'艦'+i},location:{area:7,map:2,node:15}}}));
test('50/100 pagination, newest-first and last-page clamping',()=>{
  const first=dropView(events);assert.equal((first.match(/<tr>/g)||[]).length,51);
  assert.ok(first.indexOf('艦120')<first.indexOf('艦119'));assert.doesNotMatch(first,/>艦70</);
  const second=dropView(events,{page:1,size:100});assert.equal((second.match(/<tr>/g)||[]).length,22);assert.match(second,/>艦0</);assert.doesNotMatch(second,/>艦21</);
  assert.match(dropView(events,{page:99}),/3 \/ 3 ページ/);
});
test('JST, node letters, HTML escaping, unknown and empty data',()=>{
  assert.match(dropView(events),/2026\/09\/21/);assert.match(dropView(events),/>M</);
  const html=dropView([{at:'bad',battle:{drop:{name:'<script>'}}}]);
  assert.match(html,/&lt;script&gt;/);assert.match(html,/不明/);assert.doesNotMatch(html,/<script>/);
  assert.match(dropView([]),/保存済みのドロップ記録はありません/);
});
test('history projection retains drop name and master ID and leaves source unchanged',()=>{
  const event={...events[0],battle:{...events[0].battle,drop:{name:'吹雪',masterId:9,private:'not-needed'}}};
  assert.deepEqual(activityFact(event).battle.drop,{name:'吹雪',masterId:9});
  const html=dropView([activityFact(event)],{state:{shipMaster:{9:{type:2}},shipTypes:{2:{name:'駆逐艦'}}}});
  assert.match(html,/<td>駆逐艦<\/td><td>吹雪<\/td>/);
  assert.match(dropView([activityFact(event)]),/<td>不明<\/td><td>吹雪<\/td>/);
  assert.equal(event.battle.drop.private,'not-needed');
});
