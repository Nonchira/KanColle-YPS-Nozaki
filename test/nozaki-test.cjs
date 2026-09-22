const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {Timer, inspect, estimate, INTERVAL, ESTIMATE_MARGIN} = require('../nozaki.js');
const ship = (id, name='駆逐艦', extra={}) => ({id,name,cond:49,hp:8,maxHp:8,fuel:10,ammo:10,fuelMax:10,ammoMax:10,docked:false,...extra});
const deck = (ships, id=1) => ({id, mission:false, ships});
const state = (...decks) => ({decks, fuel:100});
const base = () => state(deck([ship(1,'野埼'),ship(2)]));
test('unknown until observed formation; shared timer resets only affected Nozaki fleets', () => {
 const t=new Timer(); assert.equal(t.startedAt,null);
 const after=base(); t.formation(state(deck([ship(2)])),after,1,100); assert.equal(t.startedAt,100);
 t.formation(after,state(after.decks[0],deck([ship(3)],2)),3,200); assert.equal(t.startedAt,100);
 t.formation(after,state(deck([ship(1,'野埼'),ship(3)])),3,300); assert.equal(t.startedAt,300);
 t.formation(base(),state(deck([ship(1,'野埼')])),-2,400); assert.equal(t.startedAt,300);
 t.formation(base(),state(deck([ship(1,'南海'),ship(3)])),3,500); assert.equal(t.startedAt,300);
});
test('second position, seventh target, remodel and cap',()=>{
 const f=inspect(deck([ship(2),ship(1,'野埼改'),...Array.from({length:5},(_,i)=>ship(i+3,'駆逐艦',{cond:53}))]));
 assert.equal(f.targets.length,6); assert.equal(f.gain,3); assert.equal(f.targets[5].next,54);
 assert.equal(inspect(deck([ship(2),ship(3),ship(1,'野埼')])),null);
 assert.equal(inspect(base().decks[0]).targets[0].next,51);
});
test('successful edited-deck event resets even with already updated cached ships',()=>{
 const t=new Timer();t.startedAt=100;
 const s=base();
 t.formation(s,s,1,5000,1);assert.equal(t.startedAt,5000);
 t.formation(s,s,-2,9000,1);assert.equal(t.startedAt,5000);
 t.formation(s,s,3,10000,2);assert.equal(t.startedAt,5000);
});
test('HP and cond boundaries, fuel and ammo, expedition, dock and missing data',()=>{
 const check=(extra,mission=false)=>inspect({...deck([ship(1,'野埼',extra),ship(2)]),mission}).reasons;
 assert.equal(check({hp:7,cond:30}).length,0);
 for(const extra of [{hp:6},{cond:29},{fuel:9},{ammo:9},{docked:true},{docked:null},{fuelMax:undefined},{cond:null}]) assert.ok(check(extra).length);
 assert.ok(check({},true).length); assert.ok(check({},null).length);
 const f=inspect(deck([ship(1,'野埼'),ship(2,'大破艦',{hp:1}),ship(3,'入渠艦',{docked:true}),ship(4,'キラ艦',{cond:85})]));
 assert.equal(f.targets[0].reason,''); assert.equal(f.targets[1].reason,'入渠中'); assert.equal(f.targets[2].next,85);
});
test('15 minute boundary; natural recovery and blocked port do not restart; observed food does',()=>{
 const t=new Timer(); t.startedAt=0;
 const before=base(), after=base(); after.decks[0].ships[1].cond=51;
 t.port(before,after,INTERVAL-1); assert.equal(t.startedAt,0);
 t.port(before,before,INTERVAL); assert.equal(t.startedAt,0);
 t.port(before,after,INTERVAL); assert.equal(t.startedAt,INTERVAL);
 const u=new Timer(); before.decks[0].ships[1].cond=40;
 u.port(before,base(),INTERVAL); assert.equal(u.startedAt,null);
 after.decks[0].ships[0].docked=true;u.port(before,after,INTERVAL);assert.equal(u.startedAt,null);
 after.decks[0].ships[0].docked=false;u.port(before,after,INTERVAL);assert.equal(u.startedAt,INTERVAL);
});
test('cap observation restarts once; no gain, no catch-up or fabricated cond',()=>{
 const t=new Timer();t.startedAt=0;
 const before=base(),after=base();before.decks[0].ships[1].cond=53;after.decks[0].ships[1].cond=54;
 t.port(before,after,INTERVAL*4);assert.equal(t.startedAt,INTERVAL*4);
 t.port(after,after,INTERVAL*5);assert.equal(t.startedAt,INTERVAL*4);
 assert.equal(after.decks[0].ships[1].cond,54);
});
test('real API callback: success without api_data, failure, preset, bulk and cross-fleet swap',async()=>{
 let listener, now=1000; const sent=[],errors=[];
 const ctx=vm.createContext({console:{...console,error:(...args)=>errors.push(args)},setTimeout,clearTimeout,Date:class extends Date {static now(){return now;}},localStorage:{},setInterval:()=>0,chrome:{
  runtime:{sendMessage:m=>sent.push(m)},storage:{sync:{get:()=>{},set:()=>{}}},
  devtools:{network:{onRequestFinished:{addListener:fn=>listener=fn}}}
 }});
 for(const file of ['nozaki.js','senka.js','senka-network.js','devtools.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 ctx.print_port=()=>{};
 ctx.$mst_ship={1:{api_name:'野埼',api_fuel_max:10,api_bull_max:10},2:{api_name:'駆逐艦'}};
 ctx.$ship_list={1:{id:1,ship_id:1},2:{id:2,ship_id:2},3:{id:3,ship_id:2}};
 ctx.$fdeck_list={1:{api_id:1,api_ship:[2,-1,-1]},2:{api_id:2,api_ship:[1,3,-1]}};
 const send=async(name,params,result={api_result:1})=>{listener({request:{url:'https://example.invalid/kcsapi'+name,postData:{params:vm.runInContext('JSON.parse('+JSON.stringify(JSON.stringify(Object.entries(params).map(([name,value])=>({name,value:String(value)}))))+')',ctx)}},response:{headers:[{name:'Date',value:new Date().toUTCString()}]},startedDateTime:new Date().toISOString(),getContent:cb=>cb('svdata='+JSON.stringify(result))});await new Promise(resolve=>setImmediate(resolve));};
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:1,api_ship_idx:0},{api_result:0});
 assert.equal(ctx.$nozaki_timer.startedAt,null);assert.equal(ctx.$fdeck_list[1].api_ship[0],2);
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:1,api_ship_idx:0});
 assert.ok(ctx.$nozaki_timer.startedAt);assert.equal(ctx.$fdeck_list[2].api_ship[0],2);
 const began=ctx.$nozaki_timer.startedAt;
 await send('/api_req_hensei/preset_select',{api_deck_id:1},{api_result:1,api_data:{api_id:1,api_ship:[1,3,-1]}});
 assert.equal(ctx.$nozaki_timer.startedAt,began);
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:-2,api_ship_idx:-1});
 assert.equal(ctx.$nozaki_timer.startedAt,began);assert.equal(ctx.$fdeck_list[1].api_ship[1],-1);
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:-1,api_ship_idx:0});
 assert.equal(ctx.$nozaki_timer.view(ctx.nozaki_snapshot()).fleets.length,0);
 assert.equal(ctx.$nozaki_timer.startedAt,began);
 now=9000;
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:1,api_ship_idx:0});
 assert.equal(ctx.$nozaki_timer.startedAt,9000);
 assert.equal(sent.filter(m=>m.nozakiTimer).at(-1).nozakiTimer.startedAt,9000);
 now=12000;
 // A failure in the unrelated port renderer must not prevent the timer update.
 ctx.print_port=()=>{throw new Error('port renderer fixture');};
 await send('/api_req_hensei/change',{api_id:1,api_ship_id:3,api_ship_idx:1});
 assert.match(String(errors.at(-1)),/port renderer fixture/);
 assert.equal(sent.filter(m=>m.nozakiTimer).at(-1).nozakiTimer.startedAt,12000);
 assert.ok(sent.some(m=>m.nozakiTimer));
});
test('compact panel: elapsed time, minimum cond, unknown and non-overlapping layout',()=>{
 let receiver, tick, now=0;
 const panel={hidden:false,open:false,appendChild:()=>{},addEventListener:()=>{},getBoundingClientRect:()=>({height:240})};
 const makeStyle=()=>({setProperty(k,v){this[k]=v;}});
 const element=()=>({children:[],ownText:'',appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];this.ownText='';},setAttribute(){},
  set textContent(value){this.ownText=String(value);this.children=[];},get textContent(){return this.ownText+this.children.map(c=>c.textContent).join('');}});
 const summary={appendChild:()=>{},style:makeStyle()},heading={style:makeStyle()},details=element();let created=0;
 const div={style:{}},hst={style:{}};
 const ctx=vm.createContext({document:{createElement:()=>[panel,summary,heading,details][created++] || element(),body:{insertBefore:()=>{}}},div,hst,
  Date:{now:()=>now},setInterval:fn=>tick=fn,ResizeObserver:class {observe(){}},
  chrome:{runtime:{onMessage:{addListener:fn=>receiver=fn}}}});
 for (const file of ['nozaki.js','nozaki-ui.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 const t=new Timer();t.startedAt=0;const s=base();s.fuel=0;
 receiver({nozakiTimer:t.view(s)});assert.match(heading.textContent,/経過 0:00/);assert.match(heading.textContent,/49（最大54）/);assert.doesNotMatch(heading.textContent,/駆逐艦/);
 assert.match(details.textContent,/推定cond艦名49駆逐艦/);
 assert.equal(details.children[1].children[1].children[0].children.length,3);
 assert.doesNotMatch(details.textContent,/集約値は/);
 assert.equal(heading.style['font-weight'],'700');
 assert.equal(panel.open,false);panel.open=true;tick();assert.equal(panel.open,true);
  assert.equal(div.style.top,'312px');assert.equal(hst.style.top,'312px');
  receiver({nozakiTimer:t.view(s),nozakiAtPort:false});
  assert.equal(panel.hidden,true);assert.equal(div.style.top,'64px');
  now=60000;tick();assert.equal(panel.hidden,true);
  receiver({nozakiTimer:t.view(s),nozakiAtPort:true});
  assert.equal(panel.hidden,false);assert.match(heading.textContent,/経過 1:00/);
  assert.equal(t.startedAt,0);
 now=INTERVAL;tick();assert.match(heading.textContent,/経過 15:00/);assert.match(summary.title,/途切れ/);
 receiver({nozakiTimer:new Timer().view(s)});assert.match(heading.textContent,/経過 不明/);
 receiver({nozakiTimer:t.view(state())});
 assert.equal(heading.textContent,'野崎タイマー: 経過 -:--, 対象艦隊なし');
 assert.equal(panel.hidden,false);assert.equal(div.style.top,'312px');
 now=INTERVAL*2;tick();assert.equal(heading.textContent,'野崎タイマー: 経過 -:--, 対象艦隊なし');
 assert.equal(t.startedAt,0);
 receiver({nozakiTimer:t.view(state(deck([ship(1,'野埼')])))});
 assert.equal(heading.textContent,'野崎タイマー: 経過 -:--, 給糧対象艦なし');
 receiver({nozakiTimer:t.view(s)});assert.match(heading.textContent,/経過 30:00/);
 receiver({nozakiTimer:new Timer().view(state())});assert.equal(panel.hidden,false);
 assert.equal(heading.textContent,'野崎タイマー: 経過 -:--, 対象艦隊なし');
 const colorState=base();colorState.decks[0].ships[1].cond=52;
 now=0;receiver({nozakiTimer:t.view(colorState)});assert.equal(summary.className,'');
 now=INTERVAL+ESTIMATE_MARGIN;tick();assert.equal(summary.className,'yps-nozaki-max');
 colorState.decks[0].ships[1].cond=49;
 receiver({nozakiTimer:t.view(colorState)});assert.equal(summary.className,'');
 colorState.decks[0].ships[1].cond=54;
 receiver({nozakiTimer:t.view(colorState)});assert.equal(summary.className,'yps-nozaki-max');
 receiver({nozakiTimer:t.view(state())});assert.equal(summary.className,'');
});
test('estimated cond has a 30s margin and never accumulates unobserved cycles',()=>{
 const t=new Timer();t.startedAt=0;const s=base();s.decks[0].ships[0].name='野埼改';
 const v=t.view(s), original=JSON.stringify(v);
 const cond=now=>estimate(v,now)[0].targets[0].estimatedCond;
 assert.equal(cond(INTERVAL),49);
 assert.equal(cond(INTERVAL+ESTIMATE_MARGIN-1),49);
 assert.equal(cond(INTERVAL+ESTIMATE_MARGIN),52);
 assert.equal(cond(INTERVAL*10),52);
 assert.equal(JSON.stringify(v),original);
 assert.equal(estimate(new Timer().view(s),INTERVAL*10)[0].targets[0].estimatedCond,49);
});
test('estimates preserve values on blocked, docked, missing fuel and shared fuel shortage',()=>{
 const t=new Timer();t.startedAt=0;const now=INTERVAL+ESTIMATE_MARGIN;
 for(const extra of [{fuel:0},{cond:29},{hp:6}]) {
  const s=base();Object.assign(s.decks[0].ships[0],extra);
  assert.equal(estimate(t.view(s),now)[0].targets[0].estimatedCond,49);
 }
 for(const fuel of [0,null,undefined]) {
  const s=base();s.fuel=fuel;assert.equal(estimate(t.view(s),now)[0].targets[0].estimatedCond,49);
 }
 const s=base();s.decks.push(deck([ship(3,'野埼'),ship(4)],2));s.fuel=1;
 assert.deepEqual(estimate(t.view(s),now).map(f=>f.targets[0].estimatedCond),[49,49]);
 s.decks[0].ships[1].docked=true;assert.equal(estimate(t.view(s),now)[0].targets[0].estimatedCond,49);
});
test('server values rebase estimates, cap at54, and UI displays a single estimated value',()=>{
 const t=new Timer();t.startedAt=0;const before=base(), after=base();
 after.decks[0].ships[1].cond=51;t.port(before,after,INTERVAL);
 assert.equal(estimate(t.view(after),INTERVAL+ESTIMATE_MARGIN)[0].targets[0].estimatedCond,51);
 assert.equal(estimate(t.view(after),2*INTERVAL+ESTIMATE_MARGIN)[0].targets[0].estimatedCond,53);
 after.decks[0].ships[1].cond=53;
 assert.equal(estimate(t.view(after),2*INTERVAL+ESTIMATE_MARGIN)[0].targets[0].estimatedCond,54);
 after.decks[0].ships[1].cond=85;
 assert.equal(estimate(t.view(after),2*INTERVAL+ESTIMATE_MARGIN)[0].targets[0].estimatedCond,85);
 const ui=fs.readFileSync(path.join(__dirname,'../nozaki-ui.js'),'utf8');
 assert.match(ui,/推定cond/);assert.doesNotMatch(ui,/→/);
});
