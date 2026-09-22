const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { Tracker, catalog, period, fleetOK } = require('../senka.js');
const now = Date.parse('2026-09-12T12:00:00+09:00');
const q = id => catalog.find(q => q.id === id);
function setup(storage) {
    const t = new Tracker(storage);
    send(t,'/api_start2/getData',{api_mst_ship:[{api_id:1,api_name:'夕張改二特',api_stype:3},{api_id:2,api_name:'由良改二',api_stype:3}]});
    send(t,'/api_port/port',{api_basic:{api_member_id:'test-account'}, api_ship:[{api_id:10,api_ship_id:1},{api_id:11,api_ship_id:2}], api_deck_port:[{api_id:1,api_ship:[10,11,-1]}]});
    return t;
}
function send(t,api,data,time=now) { t.receive(api,{api_result:1,api_data:data},time); }
function quest(t,id,state=2,time=now) { send(t,'/api_get_member/questlist',{api_list:[-1,{api_no:123,api_title:q(id).title,api_state:state}]},time); }
function win(t,map,rank='S',deck=1,boss=true,time=now) {
    const [area,number,gauge] = map.split('-').map(Number);
    send(t,'/api_req_map/start',{api_maparea_id:area,api_mapinfo_no:number,api_no:area===7&&number===2?(gauge===1?7:15):99,api_event_id:boss?5:4},time);
    send(t,'/api_req_sortie/battle',{api_deck_id:deck},time);
    send(t,'/api_req_sortie/battleresult',{api_win_rank:rank},time);
}
test('周期をJSTで分離（月次0時、四半期/6月イヤーリー5時）',()=>{
    const at=s=>Date.parse(s+'+09:00');
    assert.equal(period('quarter',at('2026-03-01T04:59:59')),'2025-12');
    assert.equal(period('quarter',at('2026-03-01T05:00:00')),'2026-03');
    assert.equal(period('year',at('2026-06-01T04:59:59')),'2025-06');
    assert.equal(period('year',at('2026-06-01T05:00:00')),'2026-06');
    assert.equal(period('month',at('2026-10-01T00:00:00')),'2026-10');
});
test('未受信・別ページの欠落を未受注や攻略済みと推測しない',()=>{
    const t=setup(); assert.match(t.questLine(q('west'),now),/^\t未確認/);
    quest(t,'west',1); assert.match(t.questLine(q('west'),now),/^\t未受注/);
    win(t,'4-1'); assert.equal(t.data.quests.west.counts['4-1'],undefined);
    quest(t,'west'); quest(t,'six'); assert.match(t.questLine(q('west'),now),/^\t受注中/);
});
test('受注中のボス戦・指定ランクのみ。道中、演習、重複結果は数えない',()=>{
    const t=setup();quest(t,'anchorage');
    win(t,'1-5','S',1,false); win(t,'1-5','A');
    assert.equal(t.data.quests.anchorage.counts['1-5'],undefined);
    win(t,'1-5');
    send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
    send(t,'/api_req_practice/battle_result',{api_win_rank:'S'});
    assert.equal(t.data.quests.anchorage.counts['1-5'],1);
    assert.match(t.questLine(q('anchorage'),now),/\?1-5\(1\/3\)/);
    win(t,'1-5');win(t,'1-5');win(t,'1-5');
    assert.equal(t.data.quests.anchorage.counts['1-5'],3);
    assert.match(t.questLine(q('anchorage'),now),/✓1-5/);
});
test('Z作戦第一艦隊、前段6-4 S指定、7-2両ボスを分離',()=>{
    const t=setup();quest(t,'z-front');quest(t,'z-back');quest(t,'anchorage');
    win(t,'2-4','A',2);assert.equal(t.data.quests['z-front'].counts['2-4'],undefined);
    win(t,'2-4','A');win(t,'6-4','A');
    assert.equal(t.data.quests['z-front'].counts['2-4'],1);
    assert.equal(t.data.quests['z-front'].counts['6-4'],undefined);
    win(t,'7-2-1');assert.equal(t.data.quests['z-back'].counts['7-2-2'],undefined);
    win(t,'7-2-2');assert.equal(t.data.quests['z-back'].counts['7-2-2'],1);
    assert.deepEqual(t.data.quests.anchorage.counts,{'7-2-1':1,'7-2-2':1});
});
test('全条件の観測とサーバーの任務達成を区別',()=>{
    const t=setup();quest(t,'west');for(const m of q('west').maps)win(t,m.map);
    assert.match(t.questLine(q('west'),now),/^\t受注中/);
    quest(t,'west',3);assert.match(t.questLine(q('west'),now),/^\t攻略済み/);
    send(t,'/api_req_quest/clearitemget',null);
    assert.match(t.questLine(q('west'),now),/^\t攻略済み/);
    quest(t,'west',1);assert.match(t.questLine(q('west'),now),/\?4-1/);
});
test('受注変更は送信パラメータで推測せず、再受信まで保留',()=>{
    const t=setup();quest(t,'west');send(t,'/api_req_quest/stop',null);win(t,'4-1');
    assert.match(t.questLine(q('west'),now),/^\t未確認/);
    assert.equal(t.data.quests.west.counts['4-1'],undefined);
    quest(t,'west');win(t,'4-1');assert.equal(t.data.quests.west.counts['4-1'],1);
});
test('六水戦編成の受信情報が欠けた場合に計上しない',()=>{
    const t=setup();quest(t,'six');win(t,'5-1');assert.equal(t.data.quests.six.counts['5-1'],1);
    send(t,'/api_req_hensei/change',null);win(t,'5-4');assert.equal(t.data.quests.six.counts['5-4'],undefined);
    send(t,'/api_get_member/ship_deck',{api_deck_data:[{api_id:1,api_ship:[10,11,-1]}]});
    win(t,'5-4');assert.equal(t.data.quests.six.counts['5-4'],1);
});
test('編成制約: 艦種、旗艦、改装形、同名複数を保守的に判定',()=>{
    const ship=(api_name,api_stype=2)=>({api_name,api_stype});
    assert.equal(fleetOK('six',1,[ship('夕張改',3),ship('由良改二',3)]),false);
    assert.equal(fleetOK('six',1,[ship('夕張改二',3),ship('睦月'),ship('如月改二')]),true);
    assert.equal(fleetOK('six',1,[ship('夕張改二',3),ship('睦月'),ship('睦月改二')]),false);
    assert.equal(fleetOK('carrier',1,[ship('龍驤',7)]),true);
    assert.equal(fleetOK('carrier',1,[ship('睦月'),ship('龍驤',7)]),false);
    assert.equal(fleetOK('al',1,[ship('龍驤',7),ship('隼鷹',7)]),true);
    assert.equal(fleetOK('patrol',1,[ship('龍驤',7),ship('睦月'),ship('如月'),ship('占守',1)]),true);
    assert.equal(fleetOK('mikawa',1,['鳥海改二','青葉改','古鷹改二','加古改二'].map(n=>ship(n,5))),true);
});
test('周期変更、日跨ぎ、欠損受信、途中導入、退避では誤加算しない',()=>{
    const t=setup();quest(t,'west');
    send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});assert.deepEqual(t.data.quests.west.counts,{});
    win(t,'4-1','S',1,true,now+86400000);assert.deepEqual(t.data.quests.west.counts,{});
    win(t,'4-1');t.gap();win(t,'4-2');assert.equal(t.data.quests.west.counts['4-2'],undefined);
    quest(t,'west');send(t,'/api_req_map/start',{api_event_id:5,api_maparea_id:4,api_mapinfo_no:2,api_no:1});
    send(t,'/api_req_sortie/battle',{api_deck_id:1,api_escape_idx:[2]});send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
    assert.equal(t.data.quests.west.counts['4-2'],undefined);
    assert.match(t.questLine(q('west'),Date.parse('2026-12-01T05:00:00+09:00')),/^\t未確認/);
});
test('保存はアカウント別。再起動は受注状態を再取得、観測履歴を保持',()=>{
    const data={};const storage={getItem:k=>data[k],setItem:(k,v)=>data[k]=v};
    const t=setup(storage);quest(t,'anchorage');win(t,'1-5');
    const restored=setup(storage);assert.match(restored.questLine(q('anchorage'),now),/^\t未確認/);
    assert.equal(restored.data.quests.anchorage.counts['1-5'],1);
    restored.selectAccount('another');assert.deepEqual(restored.data.quests,{});
    assert.ok(!JSON.stringify(data).includes('api_ship'));
});
test('EO月次ゲージ・未開放・翌月の情報欠損',()=>{
    const t=setup();send(t,'/api_get_member/mapinfo',{api_map_info:[
        {api_id:15,api_cleared:1}, {api_id:75,api_cleared:1,api_gauge_num:2,api_required_defeat_count:3,api_defeat_count:1}
    ]});
    const lines=t.lines(now).join('\n');assert.match(lines,/攻略済み\t1-5\t75/);assert.match(lines,/未クリア\t7-5\t170\t2ゲージ目 1\/3/);
    assert.match(lines,/未確認\t1-6/);
    assert.match(t.lines(Date.parse('2026-10-01T00:00:00+09:00')).join('\n'),/未確認\t1-5/);
});
test('通信アダプタは応答順序を維持し、応答欠損後もYPS処理を継続',async()=>{
    const callbacks=[],events=[],handled=[];
    class Mock { receive(api){events.push(api);} gap(){events.push('gap');} lines(){return [];} }
    const context=vm.createContext({YpsSenka:{Tracker:Mock},localStorage:{},setTimeout,clearTimeout,console,Date,TextDecoder,Uint8Array,atob});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../senka-network.js'),'utf8'),context);
    const request=()=>({getContent:cb=>callbacks.push(cb),get postData(){throw Error('must not read payload');}});
    context.ypsSenka.receive(request(),'first',()=>handled.push(1));
    context.ypsSenka.receive(request(),'second',()=>handled.push(2));
    callbacks[1]('svdata={"api_result":1}');callbacks[0]('svdata={"api_result":1}');
    await new Promise(r=>setTimeout(r,20));assert.deepEqual(events,['first','second']);assert.deepEqual(handled,[1,2]);
    context.ypsSenka.receive({getContent:cb=>cb('bad')},'bad',()=>handled.push(3));
    context.ypsSenka.receive({getContent:cb=>cb('svdata={"api_result":1}')},'good',()=>handled.push(4));
    await new Promise(r=>setTimeout(r,20));assert.deepEqual(events,['first','second','gap','good']);assert.deepEqual(handled,[1,2,4]);
    context.ypsSenka.receive({getContent:()=>Promise.resolve({content:'svdata={"api_result":1}',encoding:''})},'promise',()=>handled.push(5));
    await new Promise(r=>setTimeout(r,20));assert.equal(handled.at(-1),5);assert.equal(events.at(-1),'promise');
});
test('既存markdownレンダラで4表、海域表示、ゲージを出力',()=>{
    const code=fs.readFileSync(path.join(__dirname,'../content.js'),'utf8');
    const parser=code.slice(code.indexOf('function parse_markdown(a)'),code.indexOf('function push_history('));
    const context=vm.createContext({});vm.runInContext(parser,context);
    const t=setup();quest(t,'west');win(t,'4-1');
    const html=context.parse_markdown(t.lines(now));
    assert.equal((html.match(/<table /g)||[]).length,4);
    assert.ok(html.includes('受注中'));assert.ok(html.includes('✓4-1'));assert.ok(html.includes('?4-2'));
    assert.equal(catalog.filter(q=>q.period==='quarter').reduce((sum,q)=>sum+q.points,0),2050);
});
test('出撃途中の受注、帰港後の遅れた結果、失敗応答では加算しない',()=>{
    const t=setup();
    send(t,'/api_req_map/start',{api_event_id:5,api_maparea_id:4,api_mapinfo_no:1,api_no:99});
    quest(t,'west');send(t,'/api_req_sortie/battle',{api_deck_id:1});send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
    assert.deepEqual(t.data.quests.west.counts,{});
    send(t,'/api_req_map/start',{api_event_id:5,api_maparea_id:4,api_mapinfo_no:1,api_no:99});
    send(t,'/api_req_sortie/battle',{api_deck_id:1});
    t.receive('/api_req_sortie/battleresult',{api_result:0,api_data:{api_win_rank:'S'}},now);
    assert.deepEqual(t.data.quests.west.counts,{});
    send(t,'/api_port/port',{api_basic:{api_member_id:'test-account'}});
    send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});assert.deepEqual(t.data.quests.west.counts,{});
});
test('機動部隊決戦は空母旗艦、6-4 A以上2回・他S2回',()=>{
    const t=setup();quest(t,'carrier');win(t,'6-4','S');assert.deepEqual(t.data.quests.carrier.counts,{});
    t.master[1]={api_id:1,api_name:'赤城改二',api_stype:11};
    win(t,'6-4','A');win(t,'6-4','A');win(t,'5-2','A');win(t,'5-2','S');
    assert.deepEqual(t.data.quests.carrier.counts,{'6-4':2,'5-2':1});
});
test('保存例外でも一覧とセッション内の進捗は利用できる',()=>{
    const t=setup({getItem(){throw Error('unavailable');},setItem(){throw Error('unavailable');}});
    quest(t,'west');win(t,'4-1');assert.equal(t.data.quests.west.counts['4-1'],1);
    assert.match(t.lines(now).join('\n'),/保存を利用できません/);
});

test('泊地周辺: 道中から進撃し海域番号省略のボスS勝利を各3回計数する',()=>{
    const t=setup();quest(t,'anchorage');
    for (const [area,map,node,key] of [[1,5,4,'1-5'],[7,1,8,'7-1'],[7,2,7,'7-2-1'],[7,2,15,'7-2-2']]) {
        for(let n=0;n<3;n++) {
            send(t,'/api_req_map/start',{api_maparea_id:area,api_mapinfo_no:map,api_no:1,api_event_id:4});
            send(t,'/api_req_sortie/battle',{api_deck_id:1});
            send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
            send(t,'/api_req_map/next',{api_no:2,api_event_id:4});
            send(t,'/api_req_map/next',{api_no:node,api_event_id:5});
            send(t,'/api_req_sortie/battle',{api_deck_id:1});
            send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
            send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
            assert.equal(t.data.quests.anchorage.counts[key],n+1);
            send(t,'/api_port/port',{api_basic:{api_member_id:'test-account'}});
        }
        assert.ok(t.questLine(q('anchorage'),now).includes('✓'+key));
    }
    assert.deepEqual(t.data.quests.anchorage.counts,{'1-5':3,'7-1':3,'7-2-1':3,'7-2-2':3});
});

test('海域不明の新出撃や受信欠損では直前の海域を流用しない',()=>{
    const t=setup();quest(t,'anchorage');win(t,'1-5');
    send(t,'/api_req_map/start',{api_no:1,api_event_id:4});
    send(t,'/api_req_map/next',{api_no:4,api_event_id:5});
    send(t,'/api_req_sortie/battle',{api_deck_id:1});send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
    assert.deepEqual(t.data.quests.anchorage.counts,{'1-5':1});
    t.gap();send(t,'/api_req_map/next',{api_no:4,api_event_id:5});
    send(t,'/api_req_sortie/battle',{api_deck_id:1});send(t,'/api_req_sortie/battleresult',{api_win_rank:'S'});
    assert.deepEqual(t.data.quests.anchorage.counts,{'1-5':1});
});

test('未確認は理由と再確認手順を表示し、任務一覧再受信後に保存回数の続きから加算',()=>{
    const t=setup();quest(t,'anchorage');win(t,'1-5');win(t,'1-5');
    send(t,'/api_req_quest/stop',null);
    assert.match(t.lines(now).join('\n'),/計数保留/);
    win(t,'1-5');assert.equal(t.data.quests.anchorage.counts['1-5'],2);
    quest(t,'anchorage');assert.match(t.questLine(q('anchorage'),now),/^\t受注中/);
    win(t,'1-5');assert.match(t.questLine(q('anchorage'),now),/✓1-5/);
});

test('別任務の報酬受取・受注で泊地周辺の追跡を失わない',()=>{
    const t=setup();quest(t,'anchorage');win(t,'1-5');win(t,'1-5');
    send(t,'/api_req_quest/clearitemget',null);send(t,'/api_req_quest/start',null);
    assert.match(t.questLine(q('anchorage'),now),/^\t受注中/);
    win(t,'1-5');win(t,'7-1');win(t,'7-1');win(t,'7-1');
    assert.deepEqual(t.data.quests.anchorage.counts,{'1-5':3,'7-1':3});
});
test('同周期の後続出現から前提を確認し、直接の矛盾・翌周期・別アカウントへ流用しない',()=>{
    const data={},storage={getItem:k=>data[k],setItem:(k,v)=>data[k]=v};
    const t=setup(storage);quest(t,'z-back',1);quest(t,'west',2);
    assert.match(t.questLine(q('z-front'),now),/^\t攻略済み\t.*✓2-4/);
    assert.match(t.questLine(q('patrol'),now),/^\t攻略済み\t/);
    const restored=setup(storage);assert.match(restored.questLine(q('z-front'),now),/^\t攻略済み\t/);
    quest(t,'z-front',2,now+1);assert.match(t.questLine(q('z-front'),now+1),/^\t受注中/);
    assert.match(restored.questLine(q('z-front'),Date.parse('2026-12-01T05:00:00+09:00')),/^\t未確認/);
    restored.selectAccount('other');assert.match(restored.questLine(q('z-front'),now),/^\t未確認/);
});
test('手動補正は観測値を保持し、保存・取消・未来の勝利・周期を区別',()=>{
    const data={},storage={getItem:k=>data[k],setItem:(k,v)=>data[k]=v};
    const t=setup(storage);quest(t,'anchorage');win(t,'1-5');win(t,'1-5');
    send(t,'/api_port/port',{api_basic:{api_member_id:'test-account'}});
    t.setManual('anchorage','1-5',3,now);t.setManual('anchorage','7-1',3,now);
    assert.deepEqual(t.data.quests.anchorage.counts,{'1-5':2});
    assert.match(t.questLine(q('anchorage'),now),/✓1-5［手］.*✓7-1［手］/);
    const restored=setup(storage);assert.match(restored.questLine(q('anchorage'),now),/✓1-5［手］/);
    restored.setManual('anchorage','1-5',null,now);assert.match(restored.questLine(q('anchorage'),now),/\?1-5\(2\/3\)/);
    restored.setManual('anchorage','7-1',1,now);quest(restored,'anchorage');win(restored,'7-1');
    assert.equal(restored.progress(q('anchorage'),q('anchorage').maps[1],now),2);
    assert.throws(()=>restored.setManual('anchorage','7-1',3,now),/母港/);
    send(restored,'/api_port/port',{api_basic:{api_member_id:'test-account'}});
    assert.throws(()=>restored.setManual('anchorage','7-1',4,now));
    assert.throws(()=>restored.setManual('anchorage','wrong',3,now));
    assert.doesNotMatch(restored.questLine(q('anchorage'),Date.parse('2026-12-01T05:00:00+09:00')),/［手］/);
});

test('補正メッセージは同じゲームタブとコンパスだけで処理し、アカウント切替後の古い入力を拒否',async()=>{
    let listener;
    const stored={},context=vm.createContext({YpsSenka:require('../senka.js'),localStorage:{getItem:k=>stored[k],setItem:(k,v)=>stored[k]=v},setTimeout,clearTimeout,console,Date,TextDecoder,Uint8Array,atob,
        chrome:{runtime:{id:'self',getURL:p=>'chrome-extension://self/'+p,onMessage:{addListener:fn=>listener=fn}},devtools:{inspectedWindow:{tabId:10}}}});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../senka-network.js'),'utf8'),context);
    const receive=(id)=>context.ypsSenka.receive({getContent:cb=>cb('svdata='+JSON.stringify({api_result:1,api_data:{api_basic:{api_member_id:id}}}))},'/api_port/port',()=>{});
    const call=req=>new Promise(resolve=>listener({type:'yps-senka-local',...req},{id:'self',tab:{id:10}},resolve));
    receive('one');const a=await call({op:'get'});assert.equal(a.ready,true);
    const compass=await new Promise(resolve=>listener({type:'yps-senka-local',op:'get'},{id:'self',url:'chrome-extension://self/compass/dashboard.html#quests',tab:{id:11}},resolve));assert.equal(compass.ready,true);
    assert.equal(listener({type:'yps-senka-local',op:'get'},{id:'other',url:'chrome-extension://self/compass/dashboard.html#quests'},()=>assert.fail('wrong extension')),undefined);
    assert.equal(listener({type:'yps-senka-local',op:'get'},{id:'self',url:'chrome-extension://self/compass/dashboard.html.evil'},()=>assert.fail('wrong page')),undefined);
    const corrected=await call({op:'set',token:a.token,quest:'anchorage',map:'7-1',count:3});assert.equal(corrected.ok,true);
    assert.match(corrected.quests.find(q=>q.id==='anchorage').line,/✓7-1［手］/);
    assert.equal(listener({type:'yps-senka-local',op:'get'},{id:'self',tab:{id:11}},()=>assert.fail('wrong tab')),undefined);
    receive('two');const rejected=await call({op:'set',token:a.token,quest:'anchorage',map:'1-5',count:3});assert.equal(rejected.ok,false);
    assert.equal((await call({op:'get'})).quests.find(q=>q.id==='anchorage').maps[0].count,0);
});
