// Synthetic fixtures only; IDs and parameters are not official game data.
export function extendDemo(s){
  const types={1:2,2:11,3:3,4:2,5:9,6:2,7:2,8:2};
  for(const [id,m] of Object.entries(s.shipMaster)){m.type=types[id];m.speed=10;m.slotCount=3;while(s.ships[id].slots.length<3)s.ships[id].slots.push(-1);}
  for(const [id,title,t] of [[11,'吹雪改',2],[12,'夕立改二',2],[13,'五十鈴改二',3],[14,'千歳甲',16]]){s.shipMaster[id]={name:title,type:t,speed:10,slotCount:3};s.ships[id]={id,masterId:id,level:85-id,hp:30,maxHp:30,cond:49,locked:true,slots:[-1,-1,-1],extraSlot:0,exp:[],fuel:20,ammo:20,tag:null};}
  Object.assign(s.equipmentMaster[1],{category:1,firepower:2,aa:2});Object.assign(s.equipmentMaster[2],{category:6,aa:6});Object.assign(s.equipmentMaster[3],{category:5,torpedo:7});
  Object.assign(s.equipmentMaster,{101:{name:'三式水中探信儀',category:14,asw:10},102:{name:'三式爆雷投射機',category:15,asw:8},103:{name:'10cm連装高角砲',category:1,firepower:2,aa:7},104:{name:'13号対空電探',category:12,aa:2,los:3}});
  for(let i=0;i<24;i++){const masterId=101+i%4;s.equipment[100+i]={id:100+i,masterId,stars:i%7,proficiency:0,locked:true};}
  s.shipTypes={2:{equipTypes:{1:1,5:1,12:1,14:1,15:1,21:1}},3:{equipTypes:{1:1,2:1,5:1,12:1,14:1,15:1}},16:{equipTypes:{1:1,12:1,10:1}},9:{equipTypes:{3:1,12:1,10:1}},11:{equipTypes:{6:1,7:1,8:1}}};
  s.mapMaster={15:{id:15,area:1,map:5,name:'鎮守府近海'},21:{id:21,area:2,map:1,name:'南西諸島哨戒'},51:{id:51,area:5,map:1,name:'南方海域前面'}};
  // Synthetic sorting numbers; class IDs exercise the bundled display dictionary.
  const demoClasses={1:23,2:14,3:41,4:30,5:37,6:54,7:28,8:28,11:12,12:23,13:20,14:15};
  for(const [id,m] of Object.entries(s.shipMaster)){m.classId=demoClasses[id];m.sortId=Number(id)*10;m.catalogNo=Number(id)*2;}
  return s;
}
