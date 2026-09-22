// Read existing local counters without invoking YPS reset/sync functions.
export function ypsQuestProgress(scope,now=Date.now()){
 const w=scope.$weekly;if(!w)return [];
 const day=Math.floor((now-Date.UTC(2013,3,22,-4))/86400000),week=Math.floor(day/7),out=[];
 for(const [id,count] of Object.entries(w.quest_progress||{})){
  const daily=scope.$quest_complete_daily?.[id],weekly=scope.$quest_complete_weekly?.[id],max=daily||weekly;
  if(!Number.isInteger(count)||count<0||!Number.isInteger(max)||max<=0||w.week!==week||daily&&w.daily!==day)continue;
  out.push({id:Number(id),count,max,period:daily?'day':'week'});
 }
 return out;
}
