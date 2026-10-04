import {expeditionRule,expeditionCheck,greatCondition,EXPEDITION_SOURCE} from './expedition-rules.js';
export {EXPEDITION_SOURCE};
const e=v=>String(v??'不明').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaNames={1:'鎮守府海域',2:'南西諸島海域',3:'北方海域',4:'西方海域',5:'南方海域',6:'中部海域',7:'南西海域'};
let missionOrder='area';
const duration=m=>Number.isFinite(m.durationMin)&&m.durationMin>=0?m.durationMin:Infinity;
const durationLabel=m=>duration(m)===Infinity?'時間未取得':`${Math.floor(m.durationMin/60)}時間${m.durationMin%60}分`;
export const orderedMissions=(state,order='area')=>Object.values(state.missionMaster||{}).sort((a,b)=>(order==='time'?(duration(a)===duration(b)?0:duration(a)-duration(b)):0)||((a.mapArea??999)-(b.mapArea??999))||((a.id??0)-(b.id??0)));
const missionOptions=(state,selected)=>orderedMissions(state,missionOrder).map(x=>`<option value="${x.id}" ${String(x.id)===String(selected)?'selected':''}>${missionOrder==='time'?e(durationLabel(x)):e(areaNames[x.mapArea]||'海域未取得')} · ${e(x.dispNo||x.id)} ${e(x.name)}${x.resetType>0?' ※マンスリー遠征':''}</option>`).join('');
const missionList=state=>Object.values(state.missionMaster||{}).sort((a,b)=>(a.mapArea??999)-(b.mapArea??999)||(a.id??0)-(b.id??0));
function conditionHtml(m){
 const r=expeditionRule(m);if(!r)return '<p class="warning">成功・大成功条件は未登録です。</p>';
 return `<div class="requirement-grid"><div><h3>成功条件</h3><p><b>${r.min}隻以上：${e(r.fleet)}</b><br>旗艦Lv ${r.flagshipLevel??'指定なし'}${r.totalLevel!=null?`以上 ／ 合計Lv ${r.totalLevel}以上`:r.flagshipLevel!=null?'以上 ／ 合計Lv指定なし':''}${r.flagshipType?`<br>旗艦：${e(r.flagshipType)}`:''}<br>${r.drums?`ドラム缶 ${r.drums}個以上を${r.drumShips}隻以上に搭載`:'成功用ドラム缶の指定なし'}${Object.keys(r.stats).length?`<br>艦隊合計：${Object.entries(r.stats).map(([k,v])=>`${k}${v}以上`).join(' ／ ')}`:''}</p>${r.alternativeNote?`<small>${e(r.alternativeNote)}</small>`:''}</div><div><h3>大成功条件</h3><p>${e(greatCondition(r))}</p><small>成功条件を満たしたうえでの条件です。キラは出発時のCond50以上。確定目安に届かなくても大成功する場合があります。</small></div></div>`;
}
function renderCheck(state,fleet,mission){
 if(!fleet)return '<p class="compact-empty">照合する艦隊を選択してください。</p>';
 const c=expeditionCheck(state,fleet,mission),labels={pass:'○',fail:'不足',unknown:'未判定'};
 return `<p><b>${e(fleet.name)}</b> · ${c.ships.length}隻 ／ ドラム缶 ${c.equipmentKnown?c.drums:'未取得'}個・搭載${c.equipmentKnown?c.drumShips:'未取得'}隻<br><small>${c.ships.map(s=>e(state.shipMaster[s.masterId]?.name||`艦 #${s.masterId}`)).join('・')}</small></p><div class="table-wrap"><table><thead><tr><th>項目</th><th>判定</th><th>現在値・必要値</th></tr></thead><tbody>${c.checks.map(x=>`<tr><td>${e(x.label)}</td><td class="${x.status==='pass'?'success':'warning'}">${labels[x.status]}</td><td>${e(x.text)}</td></tr>`).join('')}</tbody></table></div><p class="page-note">現在の受信値で照合しています。遠征中は出発時の装備・キラと異なる場合があります。補給状態と出発可能かもゲーム内で確認してください。</p>`;
}
function currentEquipment(state,fleet){
 if(!fleet)return '';
 return `<details class="expedition-plan"><summary>現在装備（条件照合の対象）</summary>${fleet.shipIds.filter(id=>id>0).map(id=>{const s=state.ships[id];if(!s)return '';return `<p><b>${e(state.shipMaster[s.masterId]?.name)}</b><br>${[...(s.slots||[]),s.extraSlot].filter(x=>x>0).map(id=>e(state.equipmentMaster[state.equipment[id]?.masterId]?.name||'装備未取得')).join(' ／ ')||'装備なし'}</p>`;}).join('')}</details>`;
}
export function expeditionWorkspace(state,focus){
 const missions=missionList(state),m=missions.find(m=>m.id===Number(focus))||missions[0];if(!m)return '<p class="compact-empty">遠征マスターの受信を待っています。</p>';
 const fleet=(state.fleets||[]).find(f=>f.mission?.[0]===1);
 return `<section class="card compact-card expedition-lab"><h2>遠征ジェネレーター</h2><label>表示順<select id="expedition-order"><option value="area" ${missionOrder==='area'?'selected':''}>海域順</option><option value="time" ${missionOrder==='time'?'selected':''}>時間順（短い順）</option></select></label><label>遠征<select id="expedition-select">${missionOptions(state,m.id)}</select></label><p class="page-note">所要時間：${m.durationMin==null?'不明':`${Math.floor(m.durationMin/60)}時間${m.durationMin%60}分`} ／ <a href="${EXPEDITION_SOURCE.tableUrl}" target="_blank" rel="noreferrer">出典：艦これWiki</a>（確認 ${EXPEDITION_SOURCE.retrievedAt}）</p>${conditionHtml(m)}<label>照合する艦隊<select id="expedition-fleet"><option value="">現在の遠征艦隊</option>${(state.fleets||[]).map(f=>`<option value="${f.id}">${e(f.name)}</option>`).join('')}</select></label><div id="expedition-check">${renderCheck(state,fleet,m)}</div><div id="expedition-equipment">${currentEquipment(state,fleet)}</div><details><summary>ゲーム内の遠征説明</summary><p>${e(m.details||'未取得').replace(/&lt;br\s*\/?&gt;/gi,'<br>')}</p></details></section>`;
}
export function bindExpedition(state){
 document.querySelector('#expedition-order')?.addEventListener('change',ev=>{missionOrder=ev.target.value==='time'?'time':'area';const select=document.querySelector('#expedition-select');select.innerHTML=missionOptions(state,select.value);});
 document.querySelector('#expedition-select')?.addEventListener('change',ev=>{location.hash=`#expeditions/${ev.target.value}`;});
 document.querySelector('#expedition-fleet')?.addEventListener('change',ev=>{
  const mission=missionList(state).find(m=>m.id===Number(document.querySelector('#expedition-select').value));
  const fleet=(state.fleets||[]).find(f=>f.id===Number(ev.target.value))||(state.fleets||[]).find(f=>f.mission?.[0]===1);
  document.querySelector('#expedition-check').innerHTML=renderCheck(state,fleet,mission);
  document.querySelector('#expedition-equipment').innerHTML=currentEquipment(state,fleet);
 });
}
