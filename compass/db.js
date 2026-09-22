import {activityFact} from './activity.js';
import {questFact,questModel,validateQuestCorrection} from './quest-manager.js';
let opening;
export function database(){return opening ||= new Promise((resolve,reject)=>{const r=indexedDB.open('fleet-compass',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('state');d.createObjectStore('events',{keyPath:'id'}).createIndex('at','at');d.createObjectStore('snapshots',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function load(){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('canonical');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function commit(event,reducer,initial){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['state','events','snapshots'],'readwrite'),events=tx.objectStore('events'),states=tx.objectStore('state');let result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('保存できませんでした'));const exists=events.get(event.id);exists.onsuccess=()=>{if(exists.result){result={duplicate:true};return;}const read=states.get('canonical');read.onsuccess=()=>{try{result=reducer(read.result||initial,event);events.add(result.entry);states.put(result.state,'canonical');if(event.path==='/api_port/port')tx.objectStore('snapshots').add({id:event.id,at:event.at,state:result.state});}catch(error){tx.abort();}};};});}
export async function saveGoal(goal,initial){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['state','events'],'readwrite'),store=tx.objectStore('state'),r=store.get('canonical');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);r.onsuccess=()=>{const state=r.result||initial;state.goals.push(goal);store.put(state,'canonical');tx.objectStore('events').add({id:goal.id,path:'local/goal',at:new Date().toISOString(),goal,changes:[]});};});}
export async function history(limit=150){const db=await database();return new Promise((resolve,reject)=>{const out=[],r=db.transaction('events').objectStore('events').index('at').openCursor(null,'prev');r.onsuccess=()=>{const c=r.result;if(!c||out.length>=limit){resolve(out.reverse());return;}out.push(c.value);c.continue();};r.onerror=()=>reject(r.error);});}
// Read all relevant facts, not the latest 150 API responses. Raw payloads stay out of the view.
export async function activityHistory(){
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('events'),store=tx.objectStore('events'),out=[];
    // Batch by unique primary key: equal timestamps must never skip records.
    // Keep one transaction for a consistent snapshot, retain only display facts.
    function read(after){
      const r=store.getAll(after===undefined?null:IDBKeyRange.lowerBound(after,true),256);
      r.onsuccess=()=>{
        for(const event of r.result){const fact=activityFact(event);if(fact&&event.at!==undefined)out.push(fact);}
        if(r.result.length===256)read(r.result.at(-1).id);
      };
    }
    tx.oncomplete=()=>resolve(out.sort((a,b)=>indexedDB.cmp(a.at,b.at)||indexedDB.cmp(a.id,b.id)));
    tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('履歴を読み込めませんでした'));
    read();
  });
}
export async function backup(){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['state','events','snapshots']),out={version:1};for(const name of ['state','events','snapshots']){const r=tx.objectStore(name).getAll();r.onsuccess=()=>out[name]=r.result;}tx.oncomplete=()=>resolve(out);tx.onerror=()=>reject(tx.error);});}

export async function scoreHistory(){const db=await database();return new Promise((resolve,reject)=>{const out=[],r=db.transaction('events').objectStore('events').index('at').openCursor();r.onsuccess=()=>{const c=r.result;if(!c){resolve(out);return;}const e=c.value;if(Number.isSafeInteger(e.patch?.commanderExperience)||e.bonus)out.push({id:e.id,at:e.at,patch:{commanderExperience:e.patch?.commanderExperience},bonus:e.bonus});c.continue();};r.onerror=()=>reject(r.error);});}
export async function questHistory(){const db=await database();return new Promise((resolve,reject)=>{const out=[],r=db.transaction('events').objectStore('events').index('at').openCursor();r.onsuccess=()=>{const c=r.result;if(!c){resolve(out);return;}const fact=questFact(c.value);if(fact)out.push(fact);c.continue();};r.onerror=()=>reject(r.error);});}
export async function saveQuestCorrection(value){
  const correction=validateQuestCorrection(value),model=questModel(await questHistory()),row=model.rows.find(r=>r.id===value.id);
  if(!row||row.periodInfo.key!==correction.period)throw Error('任務の期間が変わりました。開き直してください。');
  await appendQuestEvent({correction,path:'local/quest-correction'});
  globalThis.chrome?.runtime?.sendMessage?.({type:'quest-records-updated'})?.catch(()=>{});
}
export async function appendQuestEvent(value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('events','readwrite');tx.objectStore('events').add({...value,id:crypto.randomUUID(),at:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
export async function exportQuestRecords(){return {kind:'fleet-compass-quests',version:1,exportedAt:new Date().toISOString(),events:await questHistory()};}
export async function restoreQuestRecords(data){
  if(data?.kind!=='fleet-compass-quests'||data.version!==1||!Array.isArray(data.events)||data.events.length>100000)throw Error('任務記録の形式が違います');
  const events=data.events.map(e=>{
    if(typeof e.id!=='string'||e.id.length>150||!Number.isFinite(Date.parse(e.at)))throw Error('記録のID・日時が不正です');
    const fact=questFact(e);if(!fact)throw Error('任務以外の記録が含まれています');
    for(const q of fact.patch.questPage||[])if(!Number.isInteger(q.id)||typeof q.title!=='string'||![1,2,3].includes(q.state))throw Error('任務状態が不正です');
    for(const q of fact.patch.legacyQuestClear||[])if(!Number.isInteger(q.id)||typeof q.title!=='string'||!Number.isFinite(Date.parse(q.at)))throw Error('完了記録が不正です');
    if(fact.correction)fact.correction=validateQuestCorrection(fact.correction);
    if(fact.patch.ypsProgress&&(!Array.isArray(fact.patch.ypsProgress)||fact.patch.ypsProgress.some(p=>!Number.isInteger(p.id)||!Number.isInteger(p.count)||p.count<0||!Number.isInteger(p.max)||p.max<=0||!['day','week'].includes(p.period))))throw Error('任務回数の形式が不正です');
    // Views are not a source of server completion; only display known scalar fields.
    if(fact.patch.senkaView){const s=fact.patch.senkaView;if(!Number.isFinite(s.at)||!Array.isArray(s.quests)||s.quests.some(q=>typeof q.title!=='string'||typeof q.id!=='string'||!Array.isArray(q.maps)||q.maps.some(m=>typeof m.map!=='string'||!Number.isInteger(m.count)||m.count<0||!Number.isInteger(m.max)||m.count>m.max)))throw Error('戦果メモの形式が不正です');}
    return fact;
  });
  const unique=new Map();for(const e of events){if(unique.has(e.id)&&JSON.stringify(unique.get(e.id))!==JSON.stringify(e))throw Error('同じIDの異なる記録が含まれています');unique.set(e.id,e);}
  const db=await database();const count=await new Promise((resolve,reject)=>{const tx=db.transaction('events','readwrite'),store=tx.objectStore('events');let count=0;tx.oncomplete=()=>resolve(count);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('復元に失敗しました'));for(const e of unique.values()){const r=store.get(e.id);r.onsuccess=()=>{if(!r.result){store.put(e);count++;}}}});
  globalThis.chrome?.runtime?.sendMessage?.({type:'quest-records-updated'})?.catch(()=>{});
  return count;
}
export async function saveLocal(kind,value,initial){
  const db=await database();return new Promise((resolve,reject)=>{
    const tx=db.transaction(['state','events'],'readwrite'),store=tx.objectStore('state'),r=store.get('canonical');
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('ローカル保存に失敗しました'));
    r.onsuccess=()=>{const state=r.result||initial,event={id:crypto.randomUUID(),at:new Date().toISOString(),path:`local/${kind}`,changes:[]};
      if(kind==='quest-plan'){state.questPlans||={};event.previous=state.questPlans[value.questId]||null;state.questPlans[value.questId]=value;event.plan=value;store.put(state,'canonical');}
      else if(kind==='score-bonus')event.bonus=value;
      else{tx.abort();return;}
      tx.objectStore('events').add(event);
    };
  });
}
