export const paths = ['/api_start2/getData','/api_port/port','/api_get_member/basic','/api_get_member/slot_item','/api_get_member/material','/api_get_member/questlist','/api_get_member/ndock','/api_get_member/deck','/api_req_map/start','/api_req_map/next','/api_req_sortie/battleresult','/api_req_combined_battle/battleresult','/api_req_mission/result','/api_req_quest/start','/api_req_quest/stop','/api_req_quest/clearitemget','/api_get_member/mission'];
export const resourceNames = ['燃料','弾薬','鋼材','ボーキサイト','高速建造材','高速修復材','開発資材','改修資材'];
const num = x => Number.isFinite(x) ? x : null;
const arr = x => Array.isArray(x) ? x : [];
export function apiPath(url) {
  try { const u = new URL(url); if (!['https:','http:'].includes(u.protocol) || /(^|\.)dmm\.(com|co\.jp)$/i.test(u.hostname)) return null;
    const p = u.pathname.replace(/^\/kcsapi/, ''); return u.pathname.startsWith('/kcsapi/') && paths.includes(p) ? p : null;
  } catch { return null; }
}
export function emptyState() { return {version:1,updatedAt:null,portAt:null,ships:null,equipment:null,fleets:null,docks:null,quests:{},resources:Array(8).fill(null),shipMaster:{},equipmentMaster:{},missionMaster:{},capacity:{ships:null,equipment:null},commanderLevel:null,location:null,observed:{},goals:[]}; }
export function normalize(path, body, at, id) {
  if (!paths.includes(path) || typeof at !== 'string' || !Number.isFinite(Date.parse(at)) || typeof id !== 'string' || !id.length) throw Error('受信メタデータが不正です');
  const json = typeof body === 'string' ? JSON.parse(body.replace(/^svdata=/,'')) : body;
  if (json?.api_result !== 1 || (json.api_data == null && !path.startsWith('/api_req_quest/'))) throw Error('成功したAPIレスポンスではありません');
  const d = json.api_data || {}, patch = {};
  if(path.startsWith('/api_req_quest/'))patch.questAction=path.split('/').at(-1);
  if (path === '/api_start2/getData') {
    for (const [key, source] of [['shipMaster','api_mst_ship'],['equipmentMaster','api_mst_slotitem'],['missionMaster','api_mst_mission']]) {
      if (Array.isArray(d[source])) patch[key] = Object.fromEntries(d[source].filter(x=>Number.isInteger(x.api_id)).map(x=>[x.api_id,{id:x.api_id,name:typeof x.api_name === 'string'?x.api_name:null,type:num(x.api_stype),remodelLevel:num(x.api_afterlv),fuelMax:num(x.api_fuel_max),ammoMax:num(x.api_bull_max),details:typeof x.api_details==='string'?x.api_details:null,dispNo:typeof x.api_disp_no==='string'?x.api_disp_no:null,mapArea:num(x.api_maparea_id),deckNum:num(x.api_deck_num),durationMin:num(x.api_time),resetType:num(x.api_reset_type),sampleFleet:arr(x.api_sample_fleet).map(num),winItem1:arr(x.api_win_item1).map(num),winItem2:arr(x.api_win_item2).map(num)}]));
    }
  }
  if(path==='/api_start2/getData'){
    if(Array.isArray(d.api_mst_ship))for(const x of d.api_mst_ship){const m=patch.shipMaster[x.api_id];if(m){m.speed=num(x.api_soku);m.slotCount=num(x.api_slot_num);m.aircraftCapacity=arr(x.api_maxeq).map(num);m.classId=num(x.api_ctype);m.sortId=num(x.api_sort_id);m.catalogNo=num(x.api_sortno);}}
    if(Array.isArray(d.api_mst_slotitem))for(const x of d.api_mst_slotitem){const m=patch.equipmentMaster[x.api_id];if(m){m.category=num(x.api_type?.[2]);m.firepower=num(x.api_houg);m.torpedo=num(x.api_raig);m.aa=num(x.api_tyku);m.asw=num(x.api_tais);m.bomb=num(x.api_baku);m.los=num(x.api_saku);}}
    if(Array.isArray(d.api_mst_stype))patch.shipTypes=Object.fromEntries(d.api_mst_stype.filter(x=>Number.isInteger(x.api_id)).map(x=>[x.api_id,{name:typeof x.api_name==='string'?x.api_name:null,sortNo:num(x.api_sortno),equipTypes:Object.fromEntries(Object.entries(x.api_equip_type||{}).filter(([k,v])=>/^\d+$/.test(k)&&Number.isFinite(v)))}]));
    if(d.api_mst_equip_ship&&typeof d.api_mst_equip_ship==='object')patch.shipEquipRules=Object.fromEntries(Object.entries(d.api_mst_equip_ship).filter(([k])=>/^\d+$/.test(k)).map(([k,v])=>[k,Object.fromEntries(Object.entries(v.api_equip_type||{}).filter(([t,a])=>/^\d+$/.test(t)&&(a===null||Array.isArray(a))).map(([t,a])=>[t,a===null?null:a.filter(Number.isInteger)]))]));
    if(Array.isArray(d.api_mst_mapinfo))patch.mapMaster=Object.fromEntries(d.api_mst_mapinfo.filter(x=>Number.isInteger(x.api_id)).map(x=>[x.api_id,{id:x.api_id,area:num(x.api_maparea_id),map:num(x.api_no),name:typeof x.api_name==='string'?x.api_name:null}]));
  }
  if (path === '/api_port/port') {
    if (!Array.isArray(d.api_ship) || !Array.isArray(d.api_material)) throw Error('母港データに艦娘または資源がありません');
    patch.portAt = at;
    patch.ships = Object.fromEntries(d.api_ship.filter(x=>Number.isInteger(x.api_id)).map(x=>[x.api_id,{id:x.api_id,masterId:num(x.api_ship_id),level:num(x.api_lv),hp:num(x.api_nowhp),maxHp:num(x.api_maxhp),cond:num(x.api_cond),locked:x.api_locked===0?false:x.api_locked===1?true:null,tag:num(x.api_sally_area),slots:arr(x.api_slot).map(num),extraSlot:num(x.api_slot_ex),exp:arr(x.api_exp).map(num),fuel:num(x.api_fuel),ammo:num(x.api_bull)}]));
    patch.capacity = {ships:num(d.api_basic?.api_max_chara),equipment:num(d.api_basic?.api_max_slotitem)};
    patch.commanderLevel = num(d.api_basic?.api_level);
  }
  const material = path === '/api_get_member/material' ? d : d.api_material;
  const basic = path === '/api_get_member/basic' ? d : path === '/api_port/port' ? d.api_basic : null;
  if (basic && Number.isSafeInteger(basic.api_experience) && basic.api_experience >= 0) patch.commanderExperience = basic.api_experience;
  if (Array.isArray(material)) patch.material = material.filter(x=>Number.isInteger(x.api_id)&&x.api_id>=1&&x.api_id<=8).map(x=>({id:x.api_id,value:num(x.api_value)}));
  if (path === '/api_get_member/slot_item') {
    if (!Array.isArray(d)) throw Error('装備一覧が不正です');
    patch.equipment = Object.fromEntries(d.filter(x=>Number.isInteger(x.api_id)).map(x=>[x.api_id,{id:x.api_id,masterId:num(x.api_slotitem_id),stars:num(x.api_level),proficiency:num(x.api_alv),locked:x.api_locked===0?false:x.api_locked===1?true:null}]));
  }
  const fleets = path === '/api_get_member/deck' ? d : d.api_deck_port;
  if (Array.isArray(fleets)) patch.fleets = fleets.map(x=>({id:num(x.api_id),name:typeof x.api_name==='string'?x.api_name:null,shipIds:arr(x.api_ship).filter(x=>x>0),mission:arr(x.api_mission).map(num)}));
  const docks = path === '/api_get_member/ndock' ? d : d.api_ndock;
  if (Array.isArray(docks)) patch.docks = docks.map(x=>({id:num(x.api_id),shipId:num(x.api_ship_id),state:num(x.api_state),completeAt:num(x.api_complete_time)}));
  if (path === '/api_get_member/questlist') patch.questPage = arr(d.api_list).filter(x=>x&&typeof x==='object'&&Number.isInteger(x.api_no)).map(x=>({id:x.api_no,title:typeof x.api_title==='string'?x.api_title:null,description:typeof x.api_detail==='string'?x.api_detail:null,category:num(x.api_category),type:num(x.api_type),labelType:num(x.api_label_type),state:num(x.api_state),progress:num(x.api_progress_flag),observedAt:at}));
  if (path === '/api_req_map/start' || path === '/api_req_map/next') patch.location = {area:num(d.api_maparea_id),map:num(d.api_mapinfo_no),node:num(d.api_no)};
  if (path.endsWith('/battleresult')) patch.battle = {rank:typeof d.api_win_rank==='string'?d.api_win_rank:null,drop:d.api_get_ship?{masterId:num(d.api_get_ship.api_ship_id),name:typeof d.api_get_ship.api_ship_name==='string'?d.api_get_ship.api_ship_name:null}:null};
  if (path === '/api_get_member/mission' && Array.isArray(d.api_list_items)) patch.missionStatus={at,deadline:Number.isFinite(d.api_limit_time?.[0])?d.api_limit_time[0]*1000:null,items:d.api_list_items.filter(x=>Number.isInteger(x.api_mission_id)).map(x=>({id:x.api_mission_id,state:num(x.api_state)}))};
  if (path === '/api_req_mission/result') patch.expedition = {name:typeof d.api_quest_name==='string'?d.api_quest_name:null,result:[0,1,2].includes(d.api_clear_result)?d.api_clear_result:null};
  return {id,path,at,patch}; // Explicit allowlist: no request body, token, cookie, URL or player name.
}
export function reduce(state, event) {
  const next = structuredClone(state), changes = [], p = event.patch;
  if (Object.hasOwn(p,'commanderExperience')) next.commanderExperience=p.commanderExperience;
  for (const key of ['ships','equipment','fleets','docks','shipMaster','equipmentMaster','missionMaster','shipTypes','shipEquipRules','mapMaster','capacity','commanderLevel','portAt','location','missionStatus']) if (Object.hasOwn(p,key)) next[key] = p[key];
  if(event.path==='/api_req_map/next'&&p.location) next.location={area:p.location.area??state.location?.area??null,map:p.location.map??state.location?.map??null,node:p.location.node};
  if(event.path==='/api_port/port') next.location=null;
  // A result consumes its known position. Another result without a captured move
  // must not inherit the previous battle's node (also applies to drops).
  if(p.battle&&state.location)next.location={...state.location,node:null};
  if(p.responseGap){
    if(['/api_req_map/start','/api_port/port'].includes(p.responseGap))next.location=null;
    else if((p.responseGap==='/api_req_map/next'||p.responseGap.endsWith('/battleresult'))&&state.location)next.location={...state.location,node:null};
  }
  if (p.material) for (const {id,value} of p.material) { const before=state.resources[id-1]; next.resources[id-1]=value; if(before!==value) changes.push({kind:'resource',label:resourceNames[id-1],before,after:value}); }
  if (p.ships) for (const s of Object.values(p.ships)) { const old=state.ships?.[s.id]; if (!old && state.ships!==null) changes.push({kind:'ship',label:`艦 #${s.masterId} を確認`,before:null,after:s.id}); else if(old && old.level!==s.level) changes.push({kind:'level',label:`艦 #${s.masterId} Lv`,before:old.level,after:s.level}); }
  if (p.ships && state.ships) for (const id of Object.keys(state.ships)) if (!p.ships[id]) changes.push({kind:'ship-absent',label:`艦 #${id} が保有一覧から消失（理由不明）`,before:Number(id),after:null});
  if(p.questPage) for(const q of p.questPage) next.quests[q.id]=q;
  next.updatedAt=event.at; next.observed[event.path]=event.at;
  return {state:next,entry:{...event,changes,battle:p.battle?{...p.battle,location:state.location}:null}};
}
export function graph(state) {
  const nodes=[],edges=[]; const add=(id,type,label)=>nodes.push({id,type,label});
  for(const s of Object.values(state.ships||{})){add(`ship:${s.id}`,'Ship',state.shipMaster[s.masterId]?.name||`艦 #${s.masterId}`); for(const id of [...s.slots,s.extraSlot].filter(x=>x>0)) edges.push({from:`ship:${s.id}`,to:`equipment:${id}`,type:'HAS_EQUIPMENT'});}
  for(const e of Object.values(state.equipment||{})) add(`equipment:${e.id}`,'Equipment',state.equipmentMaster[e.masterId]?.name||`装備 #${e.masterId}`);
  for(const f of state.fleets||[]){ add(`fleet:${f.id}`,'Fleet',f.name||`第${f.id}艦隊`); for(const id of f.shipIds) edges.push({from:`ship:${id}`,to:`fleet:${f.id}`,type:'USED_IN'}); }
  state.resources.forEach((v,i)=>{if(v!==null)add(`resource:${i}`,'Resource',resourceNames[i]);});
  for(const g of state.goals){add(`goal:${g.id}`,'Goal',g.title); edges.push({from:`goal:${g.id}`,to:`resource:${g.resource}`,type:'TARGETS'});}
  for(const q of Object.values(state.quests||{}))add(`quest:${q.id}`,'Quest',q.title);
  for(const p of Object.values(state.questPlans||{})){
    if(p.fleetId)edges.push({from:`fleet:${p.fleetId}`,to:`quest:${p.questId}`,type:'PLANNED_FOR'});
    for(const id of p.shipIds)edges.push({from:`ship:${id}`,to:`quest:${p.questId}`,type:'PLANNED_FOR'});
    for(const id of p.equipmentIds)edges.push({from:`equipment:${id}`,to:`quest:${p.questId}`,type:'PLANNED_FOR'});
  }
  return {nodes,edges};
}
export function recommendations(s) {
  const out=[]; const add=(id,title,reason,evidence)=>out.push({id,recommendation:title,reason,evidence,expected_cost:null,expected_gain:null,confidence:1});
  if(!s.portAt) add('waiting','母港の受信を待っています','ゲーム側で通常どおり母港を開くと、取得済みレスポンスから更新します。',[]);
  const room=s.capacity.ships!==null&&s.ships!==null?s.capacity.ships-Object.keys(s.ships).length:null;
  if(room!==null&&room<=20) add('capacity','母港枠を確認してください',`最後の母港観測時点で空きは ${room} 隻です。`,[{source:'/api_port/port',observed_at:s.portAt,value:room}]);
  for(const ship of Object.values(s.ships||{})) if(ship.hp!==null&&ship.maxHp>0&&ship.hp/ship.maxHp<=.25) add(`repair:${ship.id}`,`${s.shipMaster[ship.masterId]?.name||`艦 #${ship.masterId}`} の損傷を確認`, `取得耐久 ${ship.hp}/${ship.maxHp}。出撃判断の前にゲーム画面で確認してください。`,[{source:'/api_port/port',observed_at:s.portAt,ship_id:ship.id}]);
  for(const g of s.goals.filter(g=>g.status==='active').sort((a,b)=>a.priority-b.priority)) {const v=s.resources[g.resource];if(v!==null&&v<g.target)add(`goal:${g.id}`,`${resourceNames[g.resource]}をあと ${(g.target-v).toLocaleString()} 確保`,g.title,[{source:'local-goal',goal_id:g.id,current:v,target:g.target,observed_at:s.updatedAt}]);}
  return out;
}
export function simulate(current,runs,cost,rate) {
  if (![runs,cost,rate].every(Number.isFinite)||!Number.isInteger(runs)||runs<0||cost<0||rate<0||rate>1) throw Error('周回数・消費・確率を確認してください');
  return {remaining:current===null?null:current-runs*cost,probability:1-(1-rate)**runs,runs90:rate===0?null:rate===1?1:Math.ceil(Math.log(.1)/Math.log(1-rate))};
}
export function deckBuilder(s) {
  const data={version:4},warnings=[]; if(s.commanderLevel!==null)data.hqlv=s.commanderLevel;
  for(const f of s.fleets||[]){const fleet={name:f.name||`第${f.id}艦隊`};f.shipIds.forEach((id,index)=>{const ship=s.ships?.[id];if(!ship){warnings.push(`艦 #${id} 未取得`);return;}const item={id:ship.masterId,lv:ship.level,items:{}};[...ship.slots.map((id,i)=>[id,`i${i+1}`]),[ship.extraSlot,'ix']].forEach(([eid,key])=>{if(!(eid>0))return;const e=s.equipment?.[eid];if(!e){warnings.push(`装備 #${eid} 未取得`);return;}const v={id:e.masterId};if(e.stars!==null)v.rf=e.stars;if(e.proficiency!==null)v.mas=e.proficiency;item.items[key]=v;});fleet[`s${index+1}`]=item;});data[`f${f.id}`]=fleet;}
  return {data,warnings};
}
