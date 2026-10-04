// Local candidate search; scores are preferences, never combat power or win rates.
export const POLICIES=['通常','対空優先','対潜優先','通常＋対空＋対潜'];
import {MAP_PROFILES} from './map-profiles.js';
export {MAP_PROFILES};
const surface=[1,2,3,4,5,6,7,8,9,10,11,16,18,21];
export function profileFor(state,id,now=Date.now()){
  if(['7-2','7-3','7-5','5-6'].includes(id))id+='-1'; // Legacy callers default to the explicitly named first gauge.
  const known=MAP_PROFILES.find(p=>p.id===id);
  if(known&&now<=Date.parse(known.valid_until+'T23:59:59+09:00'))return known;
  const received=Object.values(state.mapMaster||{}).find(p=>`${p.area}-${p.map}`===id);
  if(!known&&!received&&id!=='custom')throw Error('海域を選択してください');
  return {id,area:received?.area||'custom',name:known?.name||received?.name||'任意海域',templates:[],threat:'通常',source:null,confidence:null,registered:false,note:known?'編成参考の有効期限切れです。攻略条件を確認してから再生成してください。':'この海域の分岐条件は未登録です。自動候補は作成せず、遠征条件は「遠征」欄で確認してください。'};
}
export function availableMaps(state){return [...MAP_PROFILES.map(p=>({id:p.id,area:p.area,name:p.name})),...Object.values(state.mapMaster||{}).filter(p=>p.area!=null&&p.map!=null&&!MAP_PROFILES.some(x=>x.id===`${p.area}-${p.map}`||x.id.startsWith(`${p.area}-${p.map}-`))).map(p=>({id:`${p.area}-${p.map}`,area:String(p.area),name:`${p.area}-${p.map} ${p.name||''}`})),{id:'custom',area:'custom',name:'任意海域 / 条件未登録'}];}
const type=(state,ship)=>state.shipMaster[ship.masterId]?.type;
function blocked(state,ship){if(!ship)return '保有未確認';if(!(ship.maxHp>0)||ship.hp==null)return '耐久未取得';if(ship.hp/ship.maxHp<=.25)return '大破';if((state.docks||[]).some(d=>d.shipId===ship.id))return '入渠中';if((state.fleets||[]).some(f=>f.shipIds.includes(ship.id)&&f.mission[0]===1))return '遠征中';return null;}
function scoreShip(state,s,policy,threat){const t=type(state,s);return (s.level??0)*.45+(s.cond??0)*.15+(s.hp/s.maxHp)*12+((policy.includes('対潜')||threat==='対潜')&&[1,2,3,4,21].includes(t)?45:0)+(policy.includes('対空')&&[2,7,11,18].includes(t)?30:0)+(policy.includes('通常')&&[5,6,8,9,10,11,18].includes(t)?24:0);}
function slotMatches(state,ship,slot){
  const master=state.shipMaster[ship.masterId],types=Array.isArray(slot)?slot:slot.types;
  return types.includes(master?.type)&&(!slot.name||master?.name===slot.name||master?.name?.startsWith(slot.name+'改'));
}
function matchFixed(state,ships,slots,fast){
  if(!ships.length)return slots;const [ship,...rest]=ships;
  if(fast&&!(state.shipMaster[ship.masterId]?.speed>=10))return null;
  for(let i=0;i<slots.length;i++)if(slotMatches(state,ship,slots[i])){const result=matchFixed(state,rest,slots.filter((_,j)=>j!==i),fast);if(result)return result;}return null;
}
function flagshipMatches(state,ships,template){return !ships.length||!template.flagshipTypes||template.flagshipTypes.includes(type(state,ships[0]));}
// Equipment-specific normal-slot categories, verified against KC3Kai Meta.js.
// These IDs have a different compatibility category from their display category.
const specialEquipTypes={128:38,142:93,151:94,281:38,460:93,465:38,467:95,561:91};
export function canEquip(state,ship,item,slot){
  const category=state.equipmentMaster[item.masterId]?.category;
  if(!category)return {allowed:false,basis:'装備種別未取得'};
  const equipType=specialEquipTypes[item.masterId]??category;
  const rule=state.shipEquipRules?.[ship.masterId];
  // A ship-specific map is a complete allowlist, not additions to its ship type.
  if(rule){const ids=rule[equipType];return {allowed:Object.hasOwn(rule,equipType)&&(ids===null||Array.isArray(ids)&&ids.includes(item.masterId)),basis:'艦別装備マスター'};}
  if(ship.slots?.[slot]===item.id)return {allowed:true,basis:'現在の同一スロットで観測'};
  return {allowed:state.shipTypes?.[type(state,ship)]?.equipTypes?.[equipType]===1,basis:'艦種別装備マスター'};
}
const groups={gun:[1,2,3],torpedo:[5,22,32],fighter:[6],torpedoBomber:[8],diveBomber:[7],scout:[10],seaplane:[11,45],radar:[12,13],sonar:[14,40],depth:[15],charge:[44],aa:[21]};
const aircraftRoles=new Set(['fighter','torpedoBomber','diveBomber','scout','seaplane']);
function equipmentWeight(state,item,role,policy){
  const m=state.equipmentMaster[item.masterId];if(!m)return -Infinity;
  const stat={gun:'firepower',torpedo:'torpedo',fighter:'aa',torpedoBomber:'torpedo',diveBomber:'bomb',scout:'los',seaplane:'aa',radar:'los',sonar:'asw',depth:'asw',charge:'asw',aa:'aa'}[role];
  // Primary role performance comes first. Proficiency/upgrade breaks close ties;
  // ASW/AA preferences must not turn a weak torpedo bomber into the strongest one.
  return (m[stat]??0)*100+(item.stars??0)*.3+(item.proficiency??0)*.4+
    (policy.includes('対空')?(m.aa??0)*.2:0)+(policy.includes('対潜')?(m.asw??0)*.2:0);
}
function rolesFor(state,ship,policy,threat){const t=type(state,ship),antiSub=policy.includes('対潜')||threat==='対潜';
  if([7,11,18].includes(t)){
    const count=state.shipMaster[ship.masterId]?.slotCount??ship.slots.length;
    const capacity=state.shipMaster[ship.masterId]?.aircraftCapacity||[];
    const roles=Array(count).fill('fighter');
    const positive=Array.from({length:count},(_,i)=>i).filter(i=>capacity[i]>0);
    if(positive.length){roles[positive[0]]='torpedoBomber';
      if(policy!=='対空優先'&&positive.length>1){const next=positive.slice(1).sort((a,b)=>capacity[b]-capacity[a]||a-b)[0];roles[next]='diveBomber';}}
    return roles;
  }
  if([13,14].includes(t))return ['torpedo','torpedo','torpedo','torpedo'];
  if(antiSub&&[1,2,3,4,21].includes(t))return policy==='通常＋対空＋対潜'&&threat!=='対潜'?['sonar','gun','radar','depth']:['sonar','depth','charge','sonar'];
  if(policy.includes('対空'))return ['gun','gun','radar','aa'];
  if([5,6,8,9,10].includes(t))return ['gun','gun','scout','radar'];
  if(t===16)return ['seaplane','seaplane','scout','radar'];
  return ['gun','gun','torpedo','radar'];
}
function allocateEquipment(state,ships,policy,profile,allowTransfers){
  const ids=new Set(ships.map(s=>s.id)),used=new Set(),owners=new Map();
  for(const s of Object.values(state.ships||{}))for(const id of [...(s.slots||[]),s.extraSlot].filter(x=>x>0))owners.set(id,s);
  const items=Object.values(state.equipment||{}).filter(item=>{const owner=owners.get(item.id);return !owner||ids.has(owner.id)||(allowTransfers&&!blocked(state,owner));});
  const rows=ships.map(ship=>({shipId:ship.id,items:[],gaps:[],roles:rolesFor(state,ship,policy,profile.threat)}));
  // Retain expansion equipment exactly; never guess special expansion eligibility.
  for(const [i,s] of ships.entries())if(s.extraSlot>0){const item=state.equipment?.[s.extraSlot];used.add(s.extraSlot);if(item)rows[i].items.push({...item,slot:'ix',name:state.equipmentMaster[item.masterId]?.name||`装備 #${item.masterId}`,basis:'現在の増設枠で観測',from:s.id,role:'保持'});else rows[i].gaps.push('増設装備が未取得');}
  for(let slot=0;slot<5;slot++)for(const [i,s] of ships.entries()){
    const count=state.shipMaster[s.masterId]?.slotCount;
    if(slot>=s.slots.length||(Number.isInteger(count)&&slot>=count))continue;const row=rows[i],role=row.roles[slot%row.roles.length];
    if(!Number.isInteger(count)&&!(s.slots[slot]>0)){row.gaps.push(`枠${slot+1}: 通常枠数が未取得`);continue;}
    if(aircraftRoles.has(role)&&!(state.shipMaster[s.masterId]?.aircraftCapacity?.[slot]>0)){
      row.gaps.push(`枠${slot+1}: 搭載数が0または未取得のため航空機を提案しません`);continue;
    }
    const sorted=items.filter(x=>!used.has(x.id)&&groups[role]?.includes(state.equipmentMaster[x.masterId]?.category)&&canEquip(state,s,x,slot).allowed).map(x=>({item:x,score:equipmentWeight(state,x,role,policy)})).sort((a,b)=>b.score-a.score||a.item.id-b.item.id);
    const pick=sorted[0];
    if(!pick){row.gaps.push(`枠${slot+1}: ${role}候補なし（使用可能な所持装備が不足）`);continue;}
    const x=pick.item;used.add(x.id);row.items.push({...x,slot:`i${slot+1}`,name:state.equipmentMaster[x.masterId]?.name||`装備 #${x.masterId}`,basis:canEquip(state,s,x,slot).basis,from:owners.get(x.id)?.id??null,role});
  }
  for(const row of rows)row.items.sort((a,b)=>(a.slot==='ix'?99:Number(a.slot.slice(1)))-(b.slot==='ix'?99:Number(b.slot.slice(1))));
  return rows;
}
export function equipmentPlanFor(state,ships,{policy='通常',threat='通常',allowTransfers=false}={}){
  const profile={threat};
  return allocateEquipment(state,ships||[],policy,profile,allowTransfers);
}
export function generateFleet(state,{mapId='1-5',mode='auto',policy='通常',selectedIds=[],allowTransfers=false,templateId='',now=Date.now()}={}){
  if(!POLICIES.includes(policy)||!['auto','manual','hybrid'].includes(mode))throw Error('モードと優先方針を選択してください');
  const profile=profileFor(state,mapId,now),fixed=mode==='auto'?[]:selectedIds.map(Number);
  if(profile.registered===false&&mode!=='manual')return {profile,policy,mode,observedAt:state.updatedAt,generatedAt:new Date(now).toISOString(),warnings:[profile.note,'攻略条件未登録のため、艦種を推測した候補は表示しません。'],candidates:[],limitations:['この海域のルート分岐・必要艦種が未登録です','遠征の必要艦種は「遠征」欄の受信済み条件を参照してください','候補生成は登録済みの通常海域プロファイルに限ります']};
  if(new Set(fixed).size!==fixed.length||fixed.some(x=>!Number.isInteger(x)))throw Error('固定艦に重複または不正なIDがあります');
  if(mode!=='auto'&&!fixed.length)throw Error('固定する艦娘を1隻以上選択してください');if(fixed.length>6)throw Error('固定艦は6隻以内で選択してください');
  for(const id of fixed){const problem=blocked(state,state.ships?.[id]);if(problem)throw Error(`固定艦 #${id}: ${problem}のため候補生成を停止しました`);}
  const pool=Object.values(state.ships||{}).filter(s=>!blocked(state,s)&&type(state,s)!=null).sort((a,b)=>scoreShip(state,b,policy,profile.threat)-scoreShip(state,a,policy,profile.threat)||a.id-b.id);
  const fixedShips=fixed.map(id=>state.ships[id]),results=[],warnings=[];
  if(!profile.source)warnings.push(profile.note);if(!Object.keys(state.shipTypes||{}).length)warnings.push('装備可否マスターが未取得です。観測済みの同一スロット装備だけを保持します。');
  const choices=profile.templates.filter(t=>!templateId||t.id===templateId);
  if(templateId&&!choices.length)throw Error('編成パターンを選び直してください');
  const templates=mode==='manual'&&!choices.some(t=>!t.referenceOnly&&flagshipMatches(state,fixedShips,t)&&matchFixed(state,fixedShips,t.slots,t.fast))?[{name:'手動固定（海域の編成例に不適合）',slots:fixedShips.map(s=>[type(state,s)])}]:choices;
  if(templates!==choices)warnings.push('固定した編成は登録済み海域条件に適合しません。艦娘を入れ替えず装備案だけを提示します。');
  for(const template of templates){
    if(template.referenceOnly){warnings.push(`${template.name}：${template.referenceOnly}`);continue;}
    if(!flagshipMatches(state,fixedShips,template))continue;
    const remaining=matchFixed(state,fixedShips,template.slots,template.fast);if(!remaining)continue;
    let beam=[{ships:fixedShips,score:0}];
    if(mode==='manual'){if(remaining.length)warnings.push(`${template.name}は${template.slots.length}隻の例です。固定した${fixed.length}隻だけで生成します。`);}
    else for(const allowed of remaining){const next=[];for(const b of beam){const options=pool.filter(s=>!b.ships.some(x=>x.id===s.id)&&slotMatches(state,s,allowed)&&(!template.fast||state.shipMaster[s.masterId]?.speed>=10)).slice(0,10);for(const s of options)next.push({ships:[...b.ships,s],score:b.score+scoreShip(state,s,policy,profile.threat)});}
      const unique=new Map();for(const b of next.sort((a,b)=>b.score-a.score)){const key=b.ships.map(s=>s.id).sort((a,b)=>a-b).join(',');if(!unique.has(key))unique.set(key,b);}
      beam=[...unique.values()].slice(0,18);if(!beam.length)break;
    }
    for(const b of beam.slice(0,3)){const key=b.ships.map(s=>s.id).sort((a,b)=>a-b).join(',');if(results.some(x=>x.key===key&&x.template===template.name))continue;const equipment=allocateEquipment(state,b.ships,policy,profile,allowTransfers);results.push({key,templateId:template.id,notes:template.notes||'',template:mode==='manual'?`指定した${fixed.length}隻を固定`:template.name,ships:b.ships.map(s=>({id:s.id,masterId:s.masterId,level:s.level,hp:s.hp,maxHp:s.maxHp,name:state.shipMaster[s.masterId]?.name||`艦 #${s.masterId}`})),equipment,score:b.ships.reduce((n,s)=>n+scoreShip(state,s,policy,profile.threat),0),reason:mode==='manual'?`選択艦と順序を保持し、${policy}の方針で保有装備を配分。`:`${template.name}の艦種条件と${policy}の役割優先、Lv・耐久率・Condで比較。`,gaps:equipment.flatMap(x=>x.gaps.map(g=>`艦 #${x.shipId} ${g}`))});}
  }
  if(!results.length)warnings.push('この海域の編成例を満たす候補がありません。固定艦・艦種・高速条件・遠征/入渠/損傷状態を確認してください。');
  const ranked=results.sort((a,b)=>b.score-a.score);
  let candidates=ranked.slice(0,3);
  if(mode!=='manual'){
    // Compare different registered compositions before substitutions within one composition.
    candidates=[];
    for(const template of templates){
      const best=ranked.find(c=>c.template===template.name&&!candidates.some(x=>x.key===c.key));
      if(best&&!candidates.some(c=>c.ships.map(s=>type(state,s)).sort((a,b)=>a-b).join(',')===best.ships.map(s=>type(state,s)).sort((a,b)=>a-b).join(',')))candidates.push({...best,variant:candidates.length?'別編成案':'基本編成'});
      if(candidates.length===3)break;
    }

  }
  return {profile,policy,mode,observedAt:state.updatedAt,generatedAt:new Date(now).toISOString(),warnings:[...new Set(warnings)],candidates,limitations:['必須の対地装備・ドラム缶・特殊攻撃・高速化装備は自動充足しません。各案の条件を確認してください','ルート到達・制空値・索敵・対空CI・先制対潜の成立は未判定','個別装備の特殊制約・装備ボーナス・特効・札制限は別途確認','評価点は候補比較用の独自指標。戦闘ダメージや勝率ではありません']};
}
export function candidateDeck(candidate,state){const out={version:4,f1:{name:'艦隊コンパス候補'}};if(state.commanderLevel!=null)out.hqlv=state.commanderLevel;candidate.ships.forEach((s,i)=>{const items={};for(const x of candidate.equipment.find(x=>x.shipId===s.id)?.items||[]){items[x.slot]={id:x.masterId};if(x.stars!=null)items[x.slot].rf=x.stars;if(x.proficiency!=null)items[x.slot].mas=x.proficiency;}out.f1[`s${i+1}`]={id:s.masterId,lv:s.level,items};});return out;}
export function policyOptions(){return POLICIES;}
