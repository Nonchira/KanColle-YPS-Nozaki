import {apiPath,normalize,emptyState,reduce} from './core.js';
import {commit,appendQuestEvent,questHistory} from './db.js';
import {questModel} from './quest-manager.js';
import {ypsQuestProgress} from './yps-quest-progress.js';
import {receivedBody} from './received-body.js';
import {deferredSync} from './deferred-sync.js';
let lastProgress='';
let pending=appendQuestEvent({path:'local/quest-session'}).catch(()=>{}),lastLegacy='',lastSenka='';
async function syncLocalQuestRecords(){
  // Let the original YPS response handler finish before reading its local records.
  if(globalThis.ypsSenka?.snapshot)await globalThis.ypsSenka.snapshot();
  const legacy=Object.entries(globalThis.$quest_clear||{}).flatMap(([id,at])=>{const q=globalThis.$quest_list?.[id],t=+new Date(at);return q&&Number.isFinite(t)?[{id:Number(id),title:q.api_title,type:q.api_type,labelType:q.api_label_type,at:new Date(t).toISOString()}]:[];});
  const encoded=JSON.stringify(legacy);if(encoded!==lastLegacy){await appendQuestEvent({path:'local/yps-quest-records',patch:{legacyQuestClear:legacy}});lastLegacy=encoded;}
  if(globalThis.ypsSenka?.setQuestStates)globalThis.ypsSenka.setQuestStates(questModel(await questHistory()).rows);
  if(globalThis.ypsSenka?.snapshot){const s=await globalThis.ypsSenka.snapshot(),signature=JSON.stringify(s.quests);if(signature!==lastSenka){await appendQuestEvent({path:'local/senka-view',patch:{senkaView:{at:s.at,quests:s.quests}}});lastSenka=signature;}}
  const progress=ypsQuestProgress(globalThis),signature=new Date(Date.now()+4*3600000).toISOString().slice(0,10)+JSON.stringify(progress);
  if(signature!==lastProgress){await appendQuestEvent({path:'local/yps-quest-progress',patch:{ypsProgress:progress}});lastProgress=signature;}
}
const queueQuestSync=deferredSync(async()=>{
  chrome.runtime.sendMessage({type:'yps-compass-status',text:'艦隊コンパス：過去の任務履歴を集計中'})?.catch(()=>{});
  await syncLocalQuestRecords();
  await chrome.runtime.sendMessage({type:'updated'}).catch(()=>{});
  chrome.runtime.sendMessage({type:'yps-compass-status',text:'艦隊コンパス：処理完了'})?.catch(()=>{});
},error=>{console.warn('艦隊コンパス任務同期:',error.message);chrome.runtime.sendMessage({type:'yps-compass-status',text:'艦隊コンパス：任務集計に失敗'})?.catch(()=>{});});
globalThis.addEventListener?.('yps-senka-changed',queueQuestSync);
chrome.runtime.onMessage?.addListener((m,sender)=>{if(m.type==='quest-records-updated'&&sender.id===chrome.runtime.id)queueQuestSync();});
function receive(request){
  const path=apiPath(request.request.url);if(!path)return;
  const body=receivedBody(request).then(content=>({content}),error=>({error}));
  const receivedAt=request.capturedAt||new Date().toISOString();
  pending=pending.then(async()=>{
    const {content,error}=await body;
    if(error){
      await commit({id:crypto.randomUUID(),at:receivedAt,path:'local/response-gap',patch:{responseGap:path}},reduce,emptyState());
      throw error;
    }
    let event;
    try{event=normalize(path,content,receivedAt,crypto.randomUUID());}
    catch{
      await commit({id:crypto.randomUUID(),at:receivedAt,path:'local/response-gap',patch:{responseGap:path}},reduce,emptyState());
      throw Error('受信本文を解析できませんでした');
    }
    await commit(event,reduce,emptyState());
    if(path==='/api_port/port'||path==='/api_get_member/questlist'||path.startsWith('/api_req_quest/')||path.endsWith('/battleresult')||path==='/api_req_mission/result')queueQuestSync();
    await chrome.runtime.sendMessage({type:'updated'}).catch(()=>{});
  }).catch(error=>{console.warn('艦隊コンパス受信・保存エラー',path,error.message);chrome.runtime.sendMessage({type:'save-error'}).catch(()=>{});});
}
if(globalThis.ypsCompassSubscribe)globalThis.ypsCompassSubscribe(receive);
else chrome.devtools.network.onRequestFinished.addListener(receive);
