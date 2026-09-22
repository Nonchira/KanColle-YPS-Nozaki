import {classLabels} from './ship-class-labels.js';

const positive = value => Number.isSafeInteger(value) && value > 0 ? value : null;
const last = value => value ?? Number.MAX_SAFE_INTEGER;
const typeNames = {1:'海防艦',2:'駆逐艦',3:'軽巡洋艦',4:'重雷装巡洋艦',5:'重巡洋艦',6:'航空巡洋艦',7:'軽空母',8:'巡洋戦艦',9:'戦艦',10:'航空戦艦',11:'正規空母',13:'潜水艦',14:'潜水空母',16:'水上機母艦',17:'揚陸艦',18:'装甲空母',19:'工作艦',20:'潜水母艦',21:'練習巡洋艦',22:'補給艦'};
export function shipIdentity(state,ship){
  const m=state.shipMaster[ship.masterId]||{},typeId=positive(m.type),classId=positive(m.classId);
  return {typeId,classId,typeName:state.shipTypes?.[typeId]?.name||typeNames[typeId]||(typeId?`艦種名未登録 #${typeId}`:'艦種未取得'),className:classLabels[classId]||(classId?`艦型名未登録 #${classId}`:'艦型未取得'),originalNo:positive(m.sortId),catalogNo:positive(m.catalogNo),typeOrder:positive(state.shipTypes?.[typeId]?.sortNo)??typeId};
}
export function sortShips(state,ships,sort='original'){
  return [...ships].sort((a,b)=>{
    const am=shipIdentity(state,a),bm=shipIdentity(state,b);
    const original=last(am.originalNo)-last(bm.originalNo),catalog=last(am.catalogNo)-last(bm.catalogNo);
    const primary=sort==='catalog'?catalog:sort==='level'?(b.level??-1)-(a.level??-1):sort==='cond'?last(a.cond)-last(b.cond):sort==='hp'?(a.maxHp>0&&a.hp!=null?a.hp/a.maxHp:2)-(b.maxHp>0&&b.hp!=null?b.hp/b.maxHp:2):original;
    return primary||original||catalog||a.masterId-b.masterId||a.id-b.id;
  });
}
export function groupShips(state,ships,group='class'){
  if(group==='none')return [{id:'all',name:'全艦娘',ships,classes:[]}];
  const types=new Map();
  for(const ship of ships){const info=shipIdentity(state,ship),key=info.typeId??'unknown';if(!types.has(key))types.set(key,{id:String(key),name:info.typeName,order:info.typeOrder,ships:[],classes:[]});types.get(key).ships.push(ship);}
  const out=[...types.values()].sort((a,b)=>last(a.order)-last(b.order));
  if(group==='class')for(const t of out){const classes=new Map();for(const ship of t.ships){const info=shipIdentity(state,ship),key=info.classId??'unknown';if(!classes.has(key))classes.set(key,{id:String(key),name:info.className,ships:[]});classes.get(key).ships.push(ship);}t.classes=[...classes.values()].sort((a,b)=>{
    if(a.id==='unknown'||b.id==='unknown')return a.id==='unknown'?1:-1;
    const min=c=>Math.min(...c.ships.map(s=>last(shipIdentity(state,s).originalNo)));
    return min(a)-min(b)||Number(a.id)-Number(b.id);
  });}
  return out;
}
