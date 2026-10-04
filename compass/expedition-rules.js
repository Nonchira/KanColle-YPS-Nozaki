import {EXPEDITION_RULES} from './expedition-data.js';
export {EXPEDITION_RULES};
const types={'駆逐':[2],'駆逐/海防':[1,2],'軽巡':[3],'重巡':[5],'航戦':[10],'空母系/水母':[7,11,16,18],'水母':[16],'軽空母':[7],'潜水':[13,14],'潜水母艦':[20],'練巡':[21]};
export const EXPEDITION_SOURCE={url:'https://wikiwiki.jp/kancolle/遠征',tableUrl:'https://wikiwiki.jp/kancolle/遠征/詳細一覧表',retrievedAt:'2026-10-04'};
export function expeditionRule(m){
 const number=String(m?.dispNo||'').trim().replace(/^0+(?=\d)/,'');
 if(number&&EXPEDITION_RULES[number])return {...EXPEDITION_RULES[number],number};
 // Letter-number display IDs must not be inferred from numeric API IDs.
 if(m?.id>=1&&m.id<=46&&EXPEDITION_RULES[String(m.id)])return {...EXPEDITION_RULES[String(m.id)],number:String(m.id)};
 return null;
}
function matches(state,ship,group){const m=state.shipMaster[ship?.masterId];return types[group]?.includes(m?.type)||(group==='練巡'&&m?.name==='朝日');}
function matchGroups(state,ships,groups){
 if(!groups.length)return true;const [g,...rest]=groups;
 return ships.some((s,i)=>matches(state,s,g)&&matchGroups(state,ships.filter((_,j)=>i!==j),rest));
}
export function expeditionCheck(state,fleet,mission){
 const rule=expeditionRule(mission),ids=(fleet?.shipIds||[]).filter(id=>id>0),ships=ids.map(id=>state.ships?.[id]),checks=[];
 const add=(label,actual,required,unit='')=>checks.push({label,status:actual==null?'unknown':actual>=required?'pass':'fail',text:`${actual??'未取得'}${unit} / 必要 ${required}${unit}以上`});
 let drums=0,drumShips=0,equipmentKnown=true;
 for(const s of ships){let count=0;if(!s||!Array.isArray(s.slots)){equipmentKnown=false;continue;}
  for(const id of [...s.slots,s.extraSlot].filter(x=>x>0)){const item=state.equipment?.[id],master=state.equipmentMaster?.[item?.masterId];if(!master||!Number.isInteger(master.category))equipmentKnown=false;else if(master.category===30)count++;}
  drums+=count;if(count)drumShips++;
 }
 const flagship=ships[0],level=flagship?.level??null,total=ships.length&&ships.every(s=>s?.level!=null)?ships.reduce((n,s)=>n+s.level,0):null,kira=ships.filter(s=>s?.cond>=50).length,kiraKnown=ships.length>0&&ships.every(s=>s?.cond!=null);
 if(rule){
  add('艦数',ids.length,rule.min,'隻');
  if(rule.flagshipLevel!=null)add('旗艦Lv',level,rule.flagshipLevel);
  if(rule.totalLevel!=null)add('合計Lv',total,rule.totalLevel);
  const known=ships.every(s=>state.shipMaster[s?.masterId]?.type!=null),groups=rule.groups.flatMap(([name,count])=>Array(count).fill(name)),fit=known&&matchGroups(state,ships,groups);
  checks.push({label:'艦種',status:!known?'unknown':fit?'pass':rule.alternativeNote?'unknown':'fail',text:fit?'基本編成を満たす':rule.alternativeNote?'基本例と不一致・代替編成は要確認':'必要艦種が不足または未取得'});
  if(rule.flagshipType)checks.push({label:'旗艦艦種',status:!flagship||!known?'unknown':matches(state,flagship,rule.flagshipType)?'pass':'fail',text:`${rule.flagshipType}が必要`});
  if(rule.drums){add('成功用ドラム缶',equipmentKnown?drums:null,rule.drums,'個');add('成功用搭載隻数',equipmentKnown?drumShips:null,rule.drumShips,'隻');}
  if(Object.keys(rule.stats).length)checks.push({label:'必要ステータス',status:'unknown',text:'装備・改修・艦載機補正込みの遠征用値は未判定。上部の必要値と照合してください。'});
  let status='unknown',text='';const g=rule.great;
  if(g.kind==='drums'){
   text=`キラ ${kiraKnown?kira:'未取得'}/4隻、ドラム缶 ${equipmentKnown?drums:'未取得'}/${g.drums}個、搭載 ${equipmentKnown?drumShips:'未取得'}/${g.ships}隻`;
   if(kiraKnown&&equipmentKnown)status=kira>=4&&drums>=g.drums&&drumShips>=g.ships?'pass':'fail';
  }else if(g.kind==='level'){
   text=`旗艦Lv ${level??'未取得'}、キラ ${kiraKnown?kira:'未取得'}隻${g.uncertain?'（出典でも検証中）':''}`;
   if(level!=null&&kiraKnown&&!g.uncertain)status=(level>=33&&kira>=5)||(level>=128&&kira>=4)?'pass':'fail';
  }else if(g.kind==='normal'){
   text=`キラ ${kiraKnown?kira:'未取得'}/6隻（全艦キラで5隻以下は確率）`;
   if(kiraKnown)status=kira===6?'pass':'fail';
  }else text='支援任務は通常遠征の大成功判定の対象外です。';
  checks.push({label:'大成功の確定目安',status,text:text+'。成功条件を満たすことが前提です。'});
 }else checks.push({label:'遠征条件',status:'unknown',text:'条件未登録。受信した説明文のみを表示します。'});
 return {rule,ships:ships.filter(Boolean),checks,drums,drumShips,equipmentKnown,kira,level,total};
}
export function greatCondition(rule){
 if(!rule)return '条件未登録';const g=rule.great;
 if(g.kind==='drums')return `キラ4隻以上 ＋ ドラム缶${g.drums}個以上を${g.ships}隻以上に搭載`;
 if(g.kind==='level')return `旗艦Lv33以上＋キラ5隻以上、または旗艦Lv128以上＋キラ4隻以上${g.uncertain?'（検証中）':''}`;
 if(g.kind==='support')return '支援任務のため対象外';
 return '6隻全艦キラで確定。5隻以下は全艦キラでも確率';
}
