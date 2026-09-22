// Deterministic local analysis. No game actions or external requests.
export const SCORE_SOURCE={source:'https://wikiwiki.jp/kancolle/称号・戦果',retrieved_at:'2026-09-07',valid_from:null,valid_until:null,confidence:0.95,scope:'通常戦果の経験値換算。非公式攻略Wikiによる。'};
export function fleetOf(state,id){return (state.fleets||[]).find(f=>f.shipIds.includes(id));}
export function equipmentOf(state,ship){return [...ship.slots.map((id,i)=>({id,slot:String(i+1)})),{id:ship.extraSlot,slot:'増設'}].filter(x=>x.id!==0&&x.id!=null).map(x=>({...x,item:state.equipment?.[x.id]||null,name:x.id===-1?'空き':state.equipmentMaster[state.equipment?.[x.id]?.masterId]?.name||`装備 #${x.id} 未取得`}));}
export function shipActions(state,ship){
  const m=state.shipMaster[ship.masterId]||{},f=fleetOf(state,ship.id),out=[];
  const add=(kind,label,reason)=>out.push({kind,label,reason,shipId:ship.id,observedAt:state.portAt});
  if((state.docks||[]).some(d=>d.shipId===ship.id))add('dock','入渠中','入渠一覧に記録されています。');
  else if(ship.hp!==null&&ship.maxHp>0&&ship.hp<ship.maxHp)add(ship.hp/ship.maxHp<=.25?'danger':'repair','修理を確認',`耐久 ${ship.hp}/${ship.maxHp}。出撃前に損傷を確認。`);
  if(f?.mission[0]===1)add('mission','遠征中',`${f.name}に所属。帰投予定を確認できます。`);
  if((m.fuelMax>0&&ship.fuel!=null&&ship.fuel<m.fuelMax)||(m.ammoMax>0&&ship.ammo!=null&&ship.ammo<m.ammoMax))add('supply','補給を確認',`燃料 ${ship.fuel??'不明'}/${m.fuelMax??'不明'}・弾薬 ${ship.ammo??'不明'}/${m.ammoMax??'不明'}`);
  if(ship.cond!==null&&ship.cond<40)add('rest','疲労を確認',`取得Cond ${ship.cond}。40未満を休息検討の目安とするツール独自ルール。`);
  if(ship.level!=null&&m.remodelLevel>0){if(ship.level>=m.remodelLevel)add('remodel','改装Lv到達',`Lv ${ship.level} ≥ ${m.remodelLevel}。設計図・資材など他条件は未判定。`);else add('level','育成候補',`改装Lv ${m.remodelLevel}まであと ${m.remodelLevel-ship.level} Lv。`);}
  if(ship.slots.some(id=>id===-1))add('equipment','空き装備枠', '通常装備枠に空きがあります。必要装備は任務や編成計画で確認。');
  return out;
}
export function questContext(state,quest){
  const plan=state.questPlans?.[quest.id]||null,fleet=plan?(state.fleets||[]).find(f=>f.id===plan.fleetId):null;
  const ids=[...new Set([...(fleet?.shipIds||[]),...(plan?.shipIds||[])])];
  const text=`${quest.title||''} ${quest.description||''}`;
  const mentions=Object.values(state.ships||{}).filter(s=>{const name=state.shipMaster[s.masterId]?.name;return name&&name.length>=2&&text.includes(name);});
  const ships=ids.map(id=>state.ships?.[id]).filter(Boolean);
  const assigned=new Set(ships.flatMap(s=>[...s.slots,s.extraSlot]).filter(id=>id>0));
  const equipment=(plan?.equipmentIds||[]).map(id=>({id,item:state.equipment?.[id]||null,equipped:assigned.has(id)}));
  return {plan,fleet,ships,missingShips:ids.filter(id=>!state.ships?.[id]),mentions,equipment,actions:ships.flatMap(s=>shipActions(state,s)),status:quest.state===3?'ゲーム上で達成表示':plan?'編成計画あり・達成条件は要確認':'計画未設定'};
}
export function linkedQuests(state,ship){return Object.values(state.quests).flatMap(q=>{const c=questContext(state,q);return c.ships.some(s=>s.id===ship.id)?[{quest:q,kind:'計画'}]:c.mentions.some(s=>s.id===ship.id)?[{quest:q,kind:'説明文一致'}]:[];});}
export function validatePlan(value){
  if(!Number.isInteger(value.questId)||value.questId<=0||!(value.fleetId===null||Number.isInteger(value.fleetId)&&value.fleetId>0)||!['shipIds','equipmentIds'].every(k=>Array.isArray(value[k])&&value[k].length<=100&&value[k].every(n=>Number.isInteger(n)&&n>0))||typeof value.note!=='string'||value.note.length>500)throw Error('任務計画の入力を確認してください');
  return {...value,source:'user-plan',observedAt:new Date().toISOString()};
}
// Shift UTC by JST + two hours: last day 22:00 JST belongs to next operation month.
export function operationMonth(at){return new Date(Date.parse(at)+11*3600000).toISOString().slice(0,7);}
export function validateBonus(b){if(!Number.isFinite(b.value)||b.value===0||Math.abs(b.value)>100000||!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month)||typeof b.note!=='string'||!b.note.trim()||b.note.length>200||!['EO','任務','繰越','訂正'].includes(b.kind))throw Error('戦果・対象月・根拠を確認してください');if(b.value<0&&b.kind!=='訂正')throw Error('負の値は訂正として記録してください');return {...b,source:'user-entry'};}
export function scoreSeries(records,month='all'){
  const rows=[],seen=new Set();let previous=null,normal=0,bonus=0,gaps=0,baseline=null;
  for(const e of [...records].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
    if(seen.has(e.id))continue;seen.add(e.id);
    if(e.bonus){if(month!=='all'&&e.bonus.month!==month)continue;bonus+=e.bonus.value;rows.push({at:e.at,normal,bonus,total:normal+bonus,delta:e.bonus.value,kind:e.bonus.kind,note:e.bonus.note,experience:null});continue;}
    const xp=e.patch?.commanderExperience;if(!Number.isSafeInteger(xp)||xp<0)continue;
    const current={xp,at:e.at,month:operationMonth(e.at)},included=month==='all'||current.month===month;
    if(!previous){previous=current;if(included){baseline=e.at;rows.push({at:e.at,normal,bonus,total:normal+bonus,delta:0,kind:'観測開始',experience:xp});}continue;}
    if(included){let delta=0,kind='通常戦果';if(baseline===null)baseline=e.at;
      if(xp<previous.xp){gaps++;kind='経験値減少・再基準化';}
      else if(month!=='all'&&previous.month!==current.month){gaps++;kind='月境界・配分不明';}
      else delta=(xp-previous.xp)*7/10000;
      normal+=delta;rows.push({at:e.at,normal,bonus,total:normal+bonus,delta,kind,experience:xp});
    }
    previous=current;
  }
  return {rows,normal,bonus,total:normal+bonus,gaps,baseline,observations:rows.filter(r=>r.experience!==null).length};
}
