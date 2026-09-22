// Derived from local, normalized response events; never requests game data.
import {nodeLetter} from './map-nodes.js';
const start='/api_req_map/start',next='/api_req_map/next',port='/api_port/port';
const esc=v=>String(v??'不明').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function activityFact(e){
  if(e.path==='local/response-gap')return {id:e.id,at:e.at,path:e.path,patch:{responseGap:e.patch?.responseGap}};
  if (![start,next,port,'/api_start2/getData','/api_req_mission/result'].includes(e.path)&&!e.path?.endsWith('/battleresult')) return null;
  return {id:e.id,at:e.at,path:e.path,patch:{location:e.patch?.location,expedition:e.patch?.expedition},battle:e.battle?{rank:e.battle.rank,location:e.battle.location,drop:e.battle.drop?{name:e.battle.drop.name,masterId:e.battle.drop.masterId}:null}:null};
}
function mapName(l){
  if(!l?.area||!l?.map)return '海域不明';
  const base=`${l.area}-${l.map}`;
  // Same observed boss nodes used by the local Senka memo; no gauge guess on retreat.
  return base==='7-2'&&[7,15].includes(l.node)?`${base}-${l.node===7?1:2}`:base;
}
// EO classification matches the existing Senka memo's monthly EO set.
const eoMaps=new Set(['1-5','1-6','2-5','3-5','4-5','5-5','6-5','7-5']);
export function activityRows(events,missionMaster={},mapMaster={}){
  const byName=new Map();
  for(const m of Object.values(missionMaster||{})){
    if(!m?.name)continue;
    const key=m.name.normalize('NFKC'),matches=byName.get(key)||[];
    matches.push(m);byName.set(key,matches);
  }
  const missionId=name=>{
    const matches=byName.get(String(name||'').normalize('NFKC'))||[];
    // Display IDs include A1/B1 etc. Never substitute the internal numeric ID.
    return matches.length===1 && /^[A-Z]?\d+$/.test(String(matches[0].dispNo||''))?String(matches[0].dispNo):null;
  };
  const rows=[],seen=new Set();let run=null,location=null;
  const position=l=>`${mapName(l)} / マス ${nodeLetter(l)||'不明'}（番号 ${l?.node??'不明'}）`;
  function trace(e,text){if(run)(run.trace||=[]).push(new Date(Date.parse(e.at)+9*3600000).toISOString().slice(11,19)+' '+text);}
  function flush(status){
    if(run && (run.location?.area==null || (run.location.area>=1&&run.location.area<=7))){
      const l=run.battle?.location||run.location;
      rows.push({id:run.id,at:run.at,kind:'sortie',name:mapName(l),result:run.battle?.rank||'—',note:[status,run.partial?'出撃開始未受信':'',run.battle?`最終戦・マス ${nodeLetter(l)||'不明'}`:'戦闘結果未受信',run.movedAfterBattle?`以降の到達 ${nodeLetter(location)||'不明'}（結果未受信・非戦闘マスの可能性あり）`:'',run.positionGap?'進撃記録欠落':'',run.positionConflict?'位置記録の不一致あり':''].filter(Boolean).join(' / '),trace:run.trace||[]});
    }
    run=null;location=null;
  }
  for(const e of [...events].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
    if(!Number.isFinite(Date.parse(e.at))||seen.has(e.id))continue;seen.add(e.id);
    if(e.path===start){flush('帰港未確認');location=e.patch?.location||null;run={id:e.id,at:e.at,location};trace(e,'出撃 '+position(location));}
    else if(e.path===next){const l=e.patch?.location;location=l?{area:l.area??location?.area,map:l.map??location?.map,node:l.node}:location;if(run)run.movedAfterBattle=true;trace(e,'進撃 '+position(location));}
    else if(e.path===port){trace(e,'帰港');flush('帰港');}
    else if(e.path==='/api_start2/getData')flush('記録中断');
    else if(e.path==='local/response-gap'){
      trace(e,'本文読取・解析失敗 '+(e.patch?.responseGap||'不明'));
      if(['/api_req_map/next','/api_req_map/start'].includes(e.patch?.responseGap)){
        if(location)location={...location,node:null};
        if(run)run.positionGap=true;
      }
    }
    else if(e.battle){
      let l=e.battle.location||location;
      // Historical entries may carry the same cached node for multiple results.
      // Without an intervening movement, later results have no confirmed node.
      if(run?.battle&&!run.movedAfterBattle){
        run.positionGap=true;l={...(l||run.location),node:null};
        trace(e,'進撃記録なし：保存位置を流用せずマス不明として表示');
      }
      if(run?.positionGap&&location?.node==null)l={...(l||run.location),node:null};
      // A changed sea without a captured start must not merge separate runs.
      if(run&&l?.area!=null&&run.location?.area!=null&&(l.area!==run.location.area||l.map!==run.location.map))flush('記録中断');
      if(!run)run={id:e.id,at:e.at,location:l,partial:true};
      if(location&&e.battle.location&&['area','map','node'].some(k=>location[k]!=null&&e.battle.location[k]!=null&&location[k]!==e.battle.location[k])){
        run.positionConflict=true;trace(e,'位置不一致：直前の移動 '+position(location)+' / 結果付属 '+position(e.battle.location));
      }
      trace(e,'戦闘結果 '+position(l)+' / '+(e.battle.rank||'不明'));
      run.movedAfterBattle=false;
      run.battle={rank:e.battle.rank,location:l};run.location=l||run.location;
    }
    else if(e.patch?.expedition){const m=e.patch.expedition;rows.push({id:e.id,at:e.at,kind:'expedition',missionId:missionId(m.name),name:m.name||'遠征名不明',result:({0:'失敗',1:'成功',2:'大成功'})[m.result]||'不明',note:'結果受信'});}
  }
  flush('帰港未確認');
  const counts={};
  return rows.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).map(r=>{
    const jst=new Date(Date.parse(r.at)+9*60*60*1000).toISOString();
    const day=jst.slice(0,10);const key=day+':'+r.kind;counts[key]=(counts[key]||0)+1;
    const base=r.kind==='sortie'?r.name.split('-').slice(0,2).join('-'):null;
    const matches=base?Object.values(mapMaster||{}).filter(m=>`${m.area}-${m.map}`===base):[];
    const title=matches.length===1?matches[0].name:null;
    const known=base&&/^[1-7]-[1-6]$/.test(base)&&Number(base.split('-')[1])<=({1:6,2:5,3:5,4:5,5:5,6:5,7:5})[base[0]];
    return {...r,day,time:jst.slice(11,19),number:counts[key],seaType:base?(eoMaps.has(base)?'追加海域（EO）':known?'通常海域':'不明'):null,displayName:base&&title?`${r.name}.${title}`:r.name};
  });
}
export function activityView(rows,{kind='sortie',day='',page=0}={}){
  const filtered=rows.filter(r=>(kind==='all'||r.kind===kind)&&(!day||r.day===day)).slice().reverse();
  const pages=Math.max(1,Math.ceil(filtered.length/50)),current=Math.max(0,Math.min(page,pages-1));
  const items=filtered.slice(current*50,(current+1)*50);
  return `<section class="card activity"><div class="section-head"><h2>通常海域・遠征の履歴</h2><span>${filtered.length} 件</span></div>
  <div class="ship-type-tabs" aria-label="履歴の種類">${[['sortie','通常海域'],['expedition','遠征']].map(([v,n])=>`<button data-activity-kind="${v}" aria-pressed="${kind===v}">${n}</button>`).join('')}</div>
  <div class="toolbar"><label>日付（JST）<input id="activity-day" type="date" value="${esc(day)}"></label><button id="activity-clear">全日付</button></div>
  <p class="page-note">出撃は開始日時と最後に受信した戦闘ランク、遠征は結果受信日時を表示します。番号は日別・種類別の連番です。<br>このPCに保存された記録のみ。未受信の結果・過去の遠征は復元できません。</p>
  <div class="table-wrap"><table><thead><tr>${['日付','No.','時刻（JST）',kind==='expedition'?'ID':kind==='sortie'?'海域':'種類',kind==='expedition'?'遠征名':kind==='sortie'?'海域名':'海域 / 遠征名','結果','記録状況'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${items.map(r=>`<tr>${[r.day.replaceAll('-','/'),r.number,r.time,kind==='expedition'?(r.missionId||'—'):(r.kind==='sortie'?(r.seaType||'不明'):'遠征'),r.displayName||r.name,r.result].map(c=>`<td>${esc(c)}</td>`).join('')}<td>${esc(r.note)}${r.trace?.length?`<details><summary>記録詳細</summary><div>${r.trace.map(esc).join('<br>')}</div></details>`:''}</td></tr>`).join('')}</tbody></table></div>
  ${items.length?'':'<p class="empty">該当する履歴はありません。ゲームの出撃・遠征結果を受信すると記録します。</p>'}
  <div class="toolbar"><button data-activity-page="${current-1}" ${current===0?'disabled':''}>新しい履歴</button><span>${current+1} / ${pages} ページ（新しい順・50件ずつ）</span><button data-activity-page="${current+1}" ${current===pages-1?'disabled':''}>古い履歴</button></div></section>`;
}
