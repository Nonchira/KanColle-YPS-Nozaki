import {nodeLetter} from './map-nodes.js';
const esc=v=>String(v??'不明').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dropView(events,{page=0,size=50,state={}}={}){
  size=size===100?100:50;
  const rows=events.filter(e=>e?.battle?.drop).slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  const pages=Math.max(1,Math.ceil(rows.length/size)),current=Math.max(0,Math.min(Number.isFinite(page)?Math.floor(page):0,pages-1));
  const items=rows.slice(current*size,(current+1)*size);
  const navigation=()=>`<div class="drop-pagination"><button data-drop-page="${current-1}" ${current===0?'disabled':''}>新しい履歴</button><span>${current+1} / ${pages} ページ</span><button data-drop-page="${current+1}" ${current===pages-1?'disabled':''}>古い履歴</button></div>`;
  return `<section class="card drops"><div class="section-head"><h2>ドロップ記録</h2><span>${rows.length} 件</span></div>
  <div class="toolbar"><label class="inline-check">1ページ<select id="drop-size"><option value="50" ${size===50?'selected':''}>50件</option><option value="100" ${size===100?'selected':''}>100件</option></select></label><span class="muted">${rows.length?current*size+1:0}～${Math.min((current+1)*size,rows.length)} 件 / 新しい順</span></div>
  ${navigation()}
  <div class="table-wrap"><table><thead><tr>${['日付','時刻（JST）','艦種','艦名','海域','マス','勝敗'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${items.map(e=>{
    const t=Date.parse(e.at),jst=Number.isFinite(t)?new Date(t+9*3600000).toISOString():null,l=e.battle.location;
    const type=state.shipMaster?.[e.battle.drop.masterId]?.type;
    const typeName=state.shipTypes?.[type]?.name||'不明';
    const values=[jst?jst.slice(0,10).replaceAll('-','/'):'不明',jst?jst.slice(11,19):'不明',typeName,e.battle.drop.name,l?.area&&l?.map?`${l.area}-${l.map}`:'不明',nodeLetter(l)||'不明',e.battle.rank];
    return `<tr>${values.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div>
  ${items.length?'':'<p class="empty">保存済みのドロップ記録はありません。</p>'}
  ${navigation()}<p class="page-note">このPCに保存されたドロップを表示します。受信停止中や未保存の記録は復元できません。</p></section>`;
}
