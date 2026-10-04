// Portable snapshots contain only normalized generator inputs, never raw responses.
import {emptyState} from './core.js';
export const SNAPSHOT_FORMAT='fleet-compass-pocket';
export const MAX_SNAPSHOT_BYTES=12*1024*1024;
const bad=()=>{throw Error('艦隊データの形式が不正です。PC版で「スマホ用データ保存」をやり直してください。');};
const obj=x=>{if(!x||typeof x!=='object'||Array.isArray(x))bad();return x;};
const n=x=>{if(x==null)return null;if(!Number.isSafeInteger(x)||Math.abs(x)>1e14)bad();return x;};
const flag=x=>{if(x==null)return null;if(typeof x!=="boolean")bad();return x;};
const str=x=>{if(x==null)return null;if(typeof x!=='string'||x.length>8000)bad();return x;};
const date=x=>{if(x==null)return null;if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))bad();return x;};
const list=(x,limit,fn)=>{if(!Array.isArray(x)||x.length>limit)bad();return x.map(fn);};
function record(x,numbers=[],texts=[]){obj(x);const r={};for(const k of numbers)r[k]=n(x[k]);for(const k of texts)r[k]=str(x[k]);return r;}
function map(x,limit,fn){obj(x);if(Object.keys(x).length>limit)bad();const r={};for(const [k,v] of Object.entries(x)){if(!/^[1-9]\d{0,8}$/.test(k))bad();r[k]=fn(v,k);}return r;}
function stateOnly(input){
 const x=obj(input),s=emptyState();s.updatedAt=date(x.updatedAt);s.portAt=date(x.portAt);s.commanderLevel=n(x.commanderLevel);
 s.shipMaster=map(x.shipMaster,10000,v=>{const r={...record(v,['id','type','speed','slotCount'],['name']),aircraftCapacity:list(v.aircraftCapacity??[],8,n)};if(r.slotCount!=null&&(r.slotCount<0||r.slotCount>8))bad();return r;});
 s.equipmentMaster=map(x.equipmentMaster,10000,v=>record(v,['id','category','firepower','torpedo','aa','asw','bomb','los'],['name']));
 s.ships=x.ships==null?null:map(x.ships,10000,(v,k)=>{const r={...record(v,['id','masterId','level','hp','maxHp','cond','extraSlot','tag','fuel','ammo']),locked:flag(v.locked),slots:list(v.slots,8,n)};if(r.id!==Number(k)||!(r.masterId>0)||!s.shipMaster[r.masterId])bad();return r;});
 s.equipment=x.equipment==null?null:map(x.equipment,50000,(v,k)=>{const r={...record(v,['id','masterId','stars','proficiency']),locked:flag(v.locked)};if(r.id!==Number(k)||!(r.masterId>0))bad();return r;});
 s.fleets=x.fleets==null?null:list(x.fleets,10,v=>{const id=n(v.id);if(!(id>0))bad();return {id,name:`艦隊${id}`,shipIds:list(v.shipIds,8,n),mission:list(v.mission,5,n)};});
 s.docks=x.docks==null?null:list(x.docks,20,v=>record(v,['shipId']));
 s.shipTypes=map(x.shipTypes||{},100,v=>({equipTypes:map(v.equipTypes||{},1000,n)}));
 s.shipEquipRules=map(x.shipEquipRules||{},10000,v=>map(v,1000,ids=>ids===null?null:list(ids,10000,n)));
 s.missionMaster=map(x.missionMaster||{},1000,v=>record(v,['id','mapArea','durationMin','resetType'],['name','dispNo','details']));
 s.mapMaster=map(x.mapMaster||{},1000,v=>record(v,['id','area','map'],['name']));
 return s;
}
export function makePortableSnapshot(state,now=new Date().toISOString()){
 if(!state.portAt||!state.ships)throw Error('母港データを受信してから保存してください。');
 return {format:SNAPSHOT_FORMAT,version:1,exportedAt:date(now),state:stateOnly(state)};
}
export function readPortableSnapshot(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_SNAPSHOT_BYTES)throw Error('データは12MB以内のJSONファイルを選んでください。');
 let packet;try{packet=JSON.parse(text);}catch{bad();}obj(packet);
 if(packet.format!==SNAPSHOT_FORMAT||packet.version!==1)bad();
 const exportedAt=date(packet.exportedAt),state=stateOnly(packet.state);
 if(!exportedAt||!state.portAt||!state.ships)bad();return {format:SNAPSHOT_FORMAT,version:1,exportedAt,state};
}

