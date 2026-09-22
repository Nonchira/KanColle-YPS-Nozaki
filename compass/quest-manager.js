import {questCatalog} from './quest-catalog.js';
export const periodLabels={day:'日次',week:'週次',month:'月次',quarter:'四半期',year:'年次',once:'単発',unknown:'周期未確認'};
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s!！「」『』、,]/g,'');
// The catalog is static. Normalize its titles once, not for every historical row.
// Keep all matches so ambiguous titles and API period filtering behave as before.
const catalogByTitle=new Map();
for(const entry of questCatalog.quests){
  const key=norm(entry.title),matches=catalogByTitle.get(key)||[];
  matches.push(entry);catalogByTitle.set(key,matches);
}
export function definition(q){
  const label=q.labelType,fromApi=label>=101&&label<=112?'year':({1:'day',2:'week',3:'month',4:'once'})[q.type];
  const matches=(catalogByTitle.get(norm(q.title))||[]).filter(c=>!fromApi||c.period===fromApi);
  const c=matches.length===1?matches[0]:null;
  return {...c,id:q.id,title:q.title||c?.title||`任務 #${q.id}`,period:fromApi||c?.period||'unknown',month:label>=101&&label<=112?label-100:c?.month||null};
}
export function questPeriod(def,at){
  const t=+new Date(at),d=new Date(t+4*3600000);let y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate(),a,b;
  const utc=(y,m,day)=>Date.UTC(y,m,day,-4);
  switch(def.period){
    case 'day':a=utc(y,m,day);b=a+86400000;break;
    case 'week':a=utc(y,m,day-(d.getUTCDay()+6)%7);b=a+7*86400000;break;
    case 'month':a=utc(y,m,1);b=utc(y,m+1,1);break;
    case 'quarter':m=Math.floor((m-2)/3)*3+2;a=utc(y,m,1);b=utc(y,m+3,1);break;
    case 'year':if(!(def.month>=1&&def.month<=12))return {key:'unknown',start:null,end:null};m=def.month-1;if(d.getUTCMonth()<m)y--;a=utc(y,m,1);b=utc(y+1,m,1);break;
    case 'once':return {key:'once',start:null,end:null};
    default:return {key:'unknown',start:null,end:null};
  }
  return {key:new Date(a+9*3600000).toISOString().slice(0,10),start:a,end:b};
}
export function questFact(e){
  if(e.patch?.ypsProgress)return {id:e.id,at:e.at,path:e.path,patch:{ypsProgress:e.patch.ypsProgress}};
  if(e.path==='local/quest-session'||e.path==='local/quest-correction'||e.patch?.questPage||e.patch?.legacyQuestClear||e.patch?.senkaView||e.patch?.questAction||e.path==='/api_start2/getData')return {id:e.id,at:e.at,path:e.path,patch:{questPage:e.patch?.questPage,legacyQuestClear:e.patch?.legacyQuestClear,senkaView:e.patch?.senkaView,questAction:e.patch?.questAction},correction:e.correction};
  return null;
}
export function questModel(events,now=Date.now()){
  const ordered=[...events].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)),observed=new Map(),clears=new Map(),corrections=new Map();let session=0,action=0,senka=null;
  const histories=new Map();const log=(id,item)=>{const h=histories.get(id)||[];h.push(item);histories.set(id,h);};
  for(const e of ordered){
    if(e.path==='local/quest-session'||e.path==='/api_start2/getData')session=Math.max(session,Date.parse(e.at));
    if(e.patch?.questAction)action=Math.max(action,Date.parse(e.at));
    for(const q of e.patch?.questPage||[]){const prev=observed.get(q.id);observed.set(q.id,{...q,at:e.at});if(!prev||prev.state!==q.state||prev.progress!==q.progress||questPeriod(definition(q),prev.at).key!==questPeriod(definition(q),e.at).key)log(q.id,{at:e.at,kind:'受信',state:q.state,progress:q.progress});}
    for(const q of e.patch?.legacyQuestClear||[]){const prev=clears.get(q.id);if(!prev||Date.parse(prev.at)<Date.parse(q.at)){clears.set(q.id,q);log(q.id,{at:q.at,kind:'YPS報酬受取記録',state:4});}}
    if(e.correction){corrections.set(`${e.correction.id}:${e.correction.period}`,{...e.correction,at:e.at});log(e.correction.id,{at:e.at,kind:e.correction.status?'手動補正':'補正解除',state:e.correction.status,note:e.correction.note});}
    if(e.patch?.senkaView)senka=e.patch.senkaView;
  }
  const known=[...observed.values()];
  for(const c of clears.values())if(!observed.has(c.id))known.push({id:c.id,title:c.title,type:c.type,labelType:c.labelType,at:c.at});
  const rows=known.map(q=>{
    const def=definition(q),period=questPeriod(def,now),current=questPeriod(def,q.at).key===period.key;
    const fresh=current&&Date.parse(q.at)>=Math.max(session,action)&&questPeriod({period:'day'},q.at).key===questPeriod({period:'day'},now).key;
    const clear=clears.get(q.id),choices=[corrections.get(`${q.id}:${period.key}`),corrections.get(`wiki:${def.key}:${period.key}`)].filter(Boolean),manual=choices.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
    let status=current?({1:'unaccepted',2:'active',3:'achieved'})[q.state]||'unknown':'unknown',reason=current?'任務一覧の受信':'更新後・確認待ち';
    const completion=clear&&questPeriod(def,clear.at).key===period.key;
    if(completion&&(!current||Date.parse(clear.at)>=Date.parse(q.at))){status='complete';reason='YPS報酬受取記録';}
    if(manual?.status&&period.key!=='unknown'&&!(current&&q.state===3)&&status!=='complete'){
      status=manual.status;reason='手動補正'+(Date.parse(q.at)>Date.parse(manual.at)?'・再確認が必要':'');
    }
    return {...def,periodInfo:period,status,reason,fresh,observedAt:q.at,progress:current?q.progress:null,description:q.description,history:[...histories.get(q.id)||[],...histories.get('wiki:'+def.key)||[]].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)),manual,raw:q};
  });
  // Add wiki definitions not yet received, while avoiding ambiguous title matches.
  for(const c of questCatalog.quests)if(!rows.some(r=>r.key===c.key)){const id='wiki:'+c.key,periodInfo=questPeriod(c,now),manual=corrections.get(`${id}:${periodInfo.key}`);rows.push({...c,id,periodInfo,status:manual?.status||'unknown',reason:manual?.status?'手動補正':'今期の受信なし',fresh:false,history:histories.get(id)||[],manual});}
  const byKey=new Map(rows.filter(r=>r.key).map(r=>[r.key,r]));
  // Reverse inference only when the parent's entire current period covers the child's
  // period start. A daily predecessor cannot be completed "today" from a month-old unlock.
  for(const child of rows){
    if(!child.verified||!child.raw||questPeriod(child,child.raw.at).key!==child.periodInfo.key)continue;
    for(const key of child.parents||[]){const parent=byKey.get(key);if(!parent)continue;
      const compatible=parent.period==='once'||parent.periodInfo.start!=null&&child.periodInfo.start!=null&&parent.periodInfo.start<=child.periodInfo.start;
      if(!compatible||parent.period==='unknown'||parent.manual?.status&&Date.parse(parent.manual.at)>=Date.parse(child.raw.at)||parent.raw&&Date.parse(parent.raw.at)>=Date.parse(child.raw.at)&&[1,2,3].includes(parent.raw.state))continue;
      parent.status='complete';parent.reason=`後続任務「${child.title}」の出現`;parent.inferred=true;
    }
  }
  for(const child of rows){
    if(child.status!=='unknown'||!child.verified)continue;
    const blocker=(child.parents||[]).map(k=>byKey.get(k)).find(p=>p?.fresh&&!p.manual&&['unaccepted','active'].includes(p.status)&&p.period===child.period&&p.periodInfo.key===child.periodInfo.key);
    if(blocker){child.status='locked';child.reason=`前提「${blocker.title}」が未完了`;}
  }
  const progress=new Map();for(const e of ordered)for(const p of e.patch?.ypsProgress||[])progress.set(p.id,{...p,at:e.at});
  for(const row of rows){const p=progress.get(row.id);if(p&&p.period===row.period&&questPeriod(row,p.at).key===row.periodInfo.key)row.localProgress=p;}
  return {rows,senka,session};
}
export function validateQuestCorrection(value,now=Date.now()){
  if(!(Number.isInteger(value.id)&&value.id>0||typeof value.id==='string'&&questCatalog.quests.some(q=>'wiki:'+q.key===value.id))||!['unaccepted','active','achieved','complete',null].includes(value.status))throw Error('任務または補正状態が不正です');
  if(typeof value.period!=='string'||!value.period||value.period==='unknown')throw Error('更新周期が未確認のため補正できません');
  if(typeof value.note!=='string'||value.note.length>300)throw Error('補正メモは300文字以内です');
  return {id:value.id,period:value.period,status:value.status,note:value.note};
}
