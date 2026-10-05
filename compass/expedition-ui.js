import {expeditionRule,expeditionCheck,greatCondition,EXPEDITION_SOURCE} from './expedition-rules.js';
import {EXPEDITION_REWARDS,EXPEDITION_ITEM_REWARDS,REWARD_SOURCE} from './expedition-rewards-data.js';
export {EXPEDITION_SOURCE};
const e=v=>String(v??'不明').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaNames={1:'鎮守府海域',2:'南西諸島海域',3:'北方海域',4:'西方海域',5:'南方海域',6:'中部海域',7:'南西海域'};
let missionOrder='area',rewardBasis='trip';
export const rewardResources=[['fuel','燃料'],['ammo','弾薬'],['steel','鋼材'],['bauxite','ボーキサイト']];
const orderLabels=[['area','海域順'],['time','時間順（短い順）'],...rewardResources.map(([key,label])=>[key,`${label}獲得量順（多い順）`])];
export function expeditionRewards(m){
 const number=expeditionRule(m)?.number,normal=EXPEDITION_REWARDS[number];
 if(!normal)return null;
 return {normal:[...normal],great:normal.map(n=>Math.ceil(n*1.5)),daihatsu4:normal.map(n=>Math.floor(n*6/5)),daihatsu4Great:normal.map(n=>Math.floor(n*9/5))};
}
const rewardValue=(m,key)=>expeditionRewards(m)?.normal[rewardResources.findIndex(([k])=>k===key)]??null;
export function hourlyReward(m,key){
 const value=rewardValue(m,key);
 return value==null||!Number.isFinite(m.durationMin)||m.durationMin<=0?null:value*60/m.durationMin;
}
const sortValue=(m,key,basis)=>basis==='hour'?hourlyReward(m,key):rewardValue(m,key);
function rewardOrder(a,b,key,basis){const x=sortValue(a,key,basis),y=sortValue(b,key,basis);return x===y?0:x==null?1:y==null?-1:y-x;}
const duration=m=>Number.isFinite(m.durationMin)&&m.durationMin>=0?m.durationMin:Infinity;
const durationLabel=m=>duration(m)===Infinity?'時間未取得':`${Math.floor(m.durationMin/60)}時間${m.durationMin%60}分`;
export const orderedMissions=(state,order='area',basis='trip')=>Object.values(state.missionMaster||{}).sort((a,b)=>(rewardResources.some(([k])=>k===order)?rewardOrder(a,b,order,basis):order==='time'?(duration(a)===duration(b)?0:duration(a)-duration(b)):0)||((a.mapArea??999)-(b.mapArea??999))||((a.id??0)-(b.id??0)));
function rewardLabel(m){const value=sortValue(m,missionOrder,rewardBasis);return rewardResources.find(([k])=>k===missionOrder)[1]+' '+(value==null?'未登録／対象外':value.toLocaleString('ja-JP',{maximumFractionDigits:2})+(rewardBasis==='hour'?'/時':'/回'));}
const missionOptions=(state,selected)=>orderedMissions(state,missionOrder,rewardBasis).map(x=>`<option value="${x.id}" ${String(x.id)===String(selected)?'selected':''}>${rewardResources.some(([k])=>k===missionOrder)?e(rewardLabel(x)):missionOrder==='time'?e(durationLabel(x)):e(areaNames[x.mapArea]||'海域未取得')} · ${e(x.dispNo||x.id)} ${e(x.name)}${x.resetType>0?' ※マンスリー遠征':''}</option>`).join('');
const missionList=state=>Object.values(state.missionMaster||{}).sort((a,b)=>(a.mapArea??999)-(b.mapArea??999)||(a.id??0)-(b.id??0));
export function itemRewardHtml(m){
 const number=expeditionRule(m)?.number,items=EXPEDITION_ITEM_REWARDS[number];
 if(!items)return `<p>${number==='33'||number==='34'?'支援遠征はアイテム報酬の対象外です。':'アイテム報酬は未登録です。'}</p>`;
 if(!items.length)return '<p>この遠征のアイテム報酬はありません。</p>';
 const count=range=>range[0]===range[1]?`${range[0]}個`:`${range[0]}～${range[1]}個`;
 return `<h4>資材・家具箱など</h4><div class="table-wrap"><table class="expedition-item-rewards"><thead><tr><th>アイテム</th><th>通常成功</th><th>大成功</th></tr></thead><tbody>${items.map(item=>`<tr><th scope="row">${e(item.name)}</th><td>${count(item.normal)}${item.mode==='random'?'<br><small>ランダム</small>':''}</td><td>${count(item.great)}<br><small>${item.mode==='random'?'ランダム':'必ず入手'}</small></td></tr>`).join('')}</tbody></table></div><p class="page-note">0個を含む報酬は入手できない場合があります。「必ず入手」でも複数個の範囲は個数が変動します。大発★0×4個でもアイテムの個数は増えません。</p>`;
}
function rewardHtml(m){
 const rewards=expeditionRewards(m),number=expeditionRule(m)?.number;
 const table=(title,normal,great)=>`<div><h4>${title}</h4><div class="table-wrap"><table class="expedition-rewards"><thead><tr><th scope="col">資源</th><th scope="col">通常成功</th><th scope="col">大成功</th></tr></thead><tbody>${rewardResources.map(([,name],i)=>`<tr><th scope="row">${name}</th><td>${normal[i].toLocaleString('ja-JP')}</td><td>${great[i].toLocaleString('ja-JP')}</td></tr>`).join('')}</tbody></table></div></div>`;
 const body=rewards?`<div class="requirement-grid">${table('補正なし',rewards.normal,rewards.great)}${table('大発動艇 ★0 ×4個（＋20%）',rewards.daihatsu4,rewards.daihatsu4Great)}</div>`:`<p>${number==='33'||number==='34'?'支援遠征は資源報酬の対象外です。':'資源報酬は未登録です。0としては扱いません。'}</p>`;
 return `<section class="expedition-reward-panel"><h3>獲得資源（1回あたり）</h3>${body}${itemRewardHtml(m)}<p class="page-note">大発欄は通常の大発動艇（未改修★0）を艦隊全体で4個搭載した比較値です。現在の装備からの自動判定ではありません。艦固有・改修・特大発などの追加補正と、補給消費の差し引きは含みません。資源順は補正なし・通常成功を選択した基準で比較します。アイテム報酬は上表で別に表示します。<br><a href="${REWARD_SOURCE.url}" target="_blank" rel="noreferrer">報酬量の出典：艦これWiki</a> ／ <a href="https://wikiwiki.jp/kancolle/大発動艇" target="_blank" rel="noreferrer">大発補正の出典</a>（確認 ${REWARD_SOURCE.retrievedAt}）</p></section>`;
}
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
 return `<section class="card compact-card expedition-lab"><h2>遠征ジェネレーター</h2><label>表示順<select id="expedition-order">${orderLabels.map(([key,label])=>`<option value="${key}" ${missionOrder===key?'selected':''}>${label}</option>`).join('')}</select></label><label>資源量順の基準<select id="expedition-reward-basis"><option value="trip" ${rewardBasis==='trip'?'selected':''}>1回あたり</option><option value="hour" ${rewardBasis==='hour'?'selected':''}>1時間あたり</option></select></label><p class="page-note">資源量順は補正なし・通常成功が基準です。1時間あたり＝獲得量×60÷所要分数。補給消費・再出発の待ち時間は含めず、マンスリー遠征は反復できる前提ではありません。時間が未取得・無効な遠征は末尾に表示します。海域順・時間順にはこの基準は適用しません。</p><label>遠征<select id="expedition-select">${missionOptions(state,m.id)}</select></label><p class="page-note">所要時間：${m.durationMin==null?'不明':`${Math.floor(m.durationMin/60)}時間${m.durationMin%60}分`} ／ <a href="${EXPEDITION_SOURCE.tableUrl}" target="_blank" rel="noreferrer">出典：艦これWiki</a>（確認 ${EXPEDITION_SOURCE.retrievedAt}）</p>${rewardHtml(m)}${conditionHtml(m)}<label>照合する艦隊<select id="expedition-fleet"><option value="">現在の遠征艦隊</option>${(state.fleets||[]).map(f=>`<option value="${f.id}">${e(f.name)}</option>`).join('')}</select></label><div id="expedition-check">${renderCheck(state,fleet,m)}</div><div id="expedition-equipment">${currentEquipment(state,fleet)}</div><details><summary>ゲーム内の遠征説明</summary><p>${e(m.details||'未取得').replace(/&lt;br\s*\/?&gt;/gi,'<br>')}</p></details></section>`;
}
export function bindExpedition(state){
 document.querySelector('#expedition-order')?.addEventListener('change',ev=>{missionOrder=orderLabels.some(([key])=>key===ev.target.value)?ev.target.value:'area';const select=document.querySelector('#expedition-select');select.innerHTML=missionOptions(state,select.value);});
 document.querySelector('#expedition-select')?.addEventListener('change',ev=>{location.hash=`#expeditions/${ev.target.value}`;});
 document.querySelector('#expedition-reward-basis')?.addEventListener('change',ev=>{rewardBasis=ev.target.value==='hour'?'hour':'trip';const select=document.querySelector('#expedition-select');select.innerHTML=missionOptions(state,select.value);});
 document.querySelector('#expedition-fleet')?.addEventListener('change',ev=>{
  const mission=missionList(state).find(m=>m.id===Number(document.querySelector('#expedition-select').value));
  const fleet=(state.fleets||[]).find(f=>f.id===Number(ev.target.value))||(state.fleets||[]).find(f=>f.mission?.[0]===1);
  document.querySelector('#expedition-check').innerHTML=renderCheck(state,fleet,mission);
  document.querySelector('#expedition-equipment').innerHTML=currentEquipment(state,fleet);
 });
}
