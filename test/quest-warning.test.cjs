const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 let listener;const queue=[];
 const c=vm.createContext({console,setTimeout,clearTimeout,setInterval:()=>0,localStorage:{},chrome:{runtime:{sendMessage(){}},storage:{sync:{get(){},set(){}}},devtools:{inspectedWindow:{tabId:1},network:{onRequestFinished:{addListener(f){listener=f;}}}}}});
 for(const f of ['nozaki.js','senka.js','senka-network.js','devtools.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
 c.enqueue=(r,a,cb)=>queue.push(cb);
 vm.runInContext('ypsSenka.receive=enqueue; get_weekly=()=>({daily:1,week:1,month:1}); on_mission_check=()=>{}; quest_progress_name=()=>String(); nozaki_publish=()=>{}; $weekly.savetime=1;',c);
 c.$quest_count=2;c.$quest_exec_count=1;c.$quest_list={226:{api_no:226,api_type:1,api_state:3,api_title:'test',api_detail:'',yps_daily:1},403:{api_no:403,api_type:1,api_state:2,api_title:'other',api_detail:'',yps_daily:1}};
 return {c,queue,send(api,params){c.raw=JSON.stringify(Object.entries(params).map(([name,value])=>({name,value:String(value)})));const pp=vm.runInContext('JSON.parse(raw)',c);listener({request:{url:'https://example.test/kcsapi'+api,postData:{params:pp}},response:{headers:null},startedDateTime:'2026-09-22T11:00:00Z'});}};
}
test('reward receipt waits for prior quest list and persists removal without following list',()=>{
 const {c,queue,send}=setup();send('/api_get_member/questlist',{api_tab_id:0,api_page_no:2});send('/api_req_quest/clearitemget',{api_quest_id:226});
 assert.equal(c.$quest_list[226].api_state,3);assert.equal(queue.length,2);
 queue.shift()({api_result:1,api_data:{api_count:2,api_exec_count:1,api_list:[{...c.$quest_list[226]}]}});
 queue.shift()({api_result:1});assert.equal(c.$quest_list[226].api_state,-1);assert.ok(c.$quest_clear[226]);
 assert.equal(JSON.parse(c.localStorage.quest_list)[226].api_state,-1);
 const req=[];c.push_quests(req);assert.doesNotMatch(JSON.stringify(req),/達成済みの任務があります/);
});
test('new All first page invalidates stale completion but keeps newly received completion',()=>{
 const {c,queue,send}=setup();send('/api_get_member/questlist',{api_tab_id:0,api_page_no:1});
 queue.shift()({api_result:1,api_data:{api_count:1,api_exec_count:1,api_list:[{...c.$quest_list[403],api_state:3}]}});
 assert.equal(c.$quest_list[226].api_state,-1);assert.equal(c.$quest_clear[226],undefined);assert.equal(c.$quest_list[403].api_state,3);
 const req=[];c.push_quests(req);assert.match(JSON.stringify(req),/達成済みの任務があります/);
});
test('filtered page does not invalidate unseen quests; stop waits for response',()=>{
 const {c,queue,send}=setup();send('/api_get_member/questlist',{api_tab_id:2,api_page_no:1});queue.shift()({api_result:1,api_data:{api_count:0,api_exec_count:1,api_list:[]}});assert.equal(c.$quest_list[226].api_state,3);
 send('/api_req_quest/stop',{api_quest_id:226});assert.equal(c.$quest_list[226].api_state,3);queue.shift()({api_result:1});assert.equal(c.$quest_list[226].api_state,1);
});


