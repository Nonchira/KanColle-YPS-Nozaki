const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const sent=[],errors=[],ctx=vm.createContext({console:{...console,error:e=>errors.push(e)},setTimeout,clearTimeout,setInterval:()=>0,localStorage:{},
 chrome:{runtime:{sendMessage:m=>sent.push(m)},storage:{sync:{get(){},set(){}}},devtools:{inspectedWindow:{tabId:1},network:{onRequestFinished:{addListener(){}}}}}});
 for(const f of ['nozaki.js','senka.js','senka-network.js','devtools.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 ctx.$fdeck_list={2:{api_id:2,api_ship:[20]}};
 ctx.$ship_list={20:{name_lv:()=> '吹雪Lv50'}};
 ctx.$battle_deck_id=2;
 ctx.$svDateTime=ctx.$pcDateTime=new Date();
 ctx.$next_enemy='演習相手:テスト';
 ctx.$battle_info='単縦';ctx.$guess_win_rank='S';ctx.$guess_debug_log=false;
 return {ctx,sent,errors};
}
test('battle fleet identity: missing ID preserves observed fleet, legacy key supported, invalid ID never guesses',()=>{
 const {ctx}=setup();assert.equal(ctx.battle_fdeck({}).api_id,2);assert.equal(ctx.$battle_deck_id,2);
 assert.equal(ctx.battle_fdeck({api_dock_id:'2'}).api_id,2);
 assert.equal(ctx.battle_fdeck({api_deck_id:3}),null);assert.equal(ctx.$battle_deck_id,3);
 assert.equal(ctx.battle_fdeck({api_deck_id:99}),null);assert.equal(ctx.$battle_deck_id,-1);assert.equal(ctx.battle_fdeck({}),null);
});
test('MVP with absent fleet/ship/experience leaves result display working',()=>{
 const {ctx,sent,errors}=setup();
 ctx.$battle_deck_id=-1;
 ctx.on_battle_result({api_data:{api_enemy_info:{api_deck_name:'敵艦隊'},api_win_rank:'S',api_get_base_exp:200,api_mvp:1,api_mvp_combined:1}});
 assert.match(JSON.stringify(sent),/基本EXP: 200/);assert.match(JSON.stringify(sent),/艦娘情報未取得/);assert.deepEqual(errors,[]);
 const req=[];ctx.push_battle_mvp(req,ctx.$fdeck_list[2],1,[-1,300]);assert.equal(req[0],'MVP: 吹雪Lv50 +300exp');
 const unknown=[];ctx.push_battle_mvp(unknown,ctx.$fdeck_list[2],1);assert.match(unknown[0],/経験値未取得/);
});
test('battle without api_deck_id still publishes battle screen using observed fleet',()=>{
 const {ctx,sent,errors}=setup();
 ctx.map_name=()=> '2-1';ctx.boss_next_name=()=>'';ctx.battle_api_kind_name=()=>'';ctx.push_listform=()=>{};
 ctx.guess_win_rank=()=> 'S';ctx.push_fdeck_status=()=>{};
 ctx.on_battle({api_data:{api_f_maxhps:[10],api_f_nowhps:[10],api_e_maxhps:[10],api_e_nowhps:[0],api_ship_ke:[],api_ship_lv:[],api_eSlot:[],api_eParam:[]}},'/api_req_sortie/battle');
 assert.equal(ctx.$battle_deck_id,2);assert.match(JSON.stringify(sent),/friend damage/);assert.deepEqual(errors,[]);
});
test('unknown fleet publishes explicit partial state instead of silently retaining next screen',()=>{
 const {ctx,sent,errors}=setup();ctx.$battle_deck_id=-1;
 ctx.on_battle({api_data:{}},'/api_req_sortie/battle');
 assert.match(JSON.stringify(sent),/出撃艦隊の情報が未取得/);assert.deepEqual(errors,[]);
});
