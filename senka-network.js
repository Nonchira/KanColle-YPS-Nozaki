/* Reads DevTools response bodies only. Never reads postData or sends game traffic. */
(function () {
    'use strict';
    let storage = null;
    try { storage = localStorage; } catch (_) { /* session-only fallback */ }
    const tracker = new YpsSenka.Tracker(storage);
    let pending = Promise.resolve();
    const startupAt=Date.now();
    let startupDone=false;
    function startupStatus(api,stage,extra={}) {
        if(startupDone)return;
        try{chrome.runtime.sendMessage({type:'yps-startup-status',api,stage,elapsedMs:Date.now()-startupAt,...extra})?.catch(()=>{});}catch(_){}
    }
    let contextKey=null, token=null;
    function snapshot() {
        const now=Date.now(),key=tracker.account+'|'+YpsSenka.period('quarter',now)+'|'+YpsSenka.period('year',now);
        if(key!==contextKey) {contextKey=key;token=String(Math.random())+String(now);}
        return {token,ready:!!tracker.account && !tracker.sortie,warning:tracker.storageError?'保存できません。今回の起動中のみ反映されます。':'',quests:YpsSenka.catalog.map(q=>({id:q.id,title:q.title,line:tracker.questLine(q,now),maps:q.maps.map(m=>({map:m.map,max:m.count,count:tracker.progress(q,m,now),manual:tracker.data.quests[q.id]?.period===YpsSenka.period(q.period,now)&&!!tracker.data.quests[q.id]?.manual?.[m.map]}))}))};
    }
    if(typeof chrome!=='undefined' && chrome.runtime?.onMessage) chrome.runtime.onMessage.addListener((req,sender,reply)=>{
        const compassURL=chrome.runtime.getURL?.('compass/dashboard.html');
        const compass=!!compassURL && (sender.url===compassURL || sender.url?.startsWith(compassURL+'#'));
        if(req?.type!=='yps-senka-local' || sender.id!==chrome.runtime.id || (!compass && sender.tab?.id!==chrome.devtools.inspectedWindow.tabId)) return;
        pending=pending.then(()=>{
            try {
                const state=snapshot();
                if(req.op==='set') {
                    if(req.token!==state.token) throw Error('アカウントまたは期間が変わりました。補正画面を開き直してください。');
                    tracker.setManual(req.quest,req.map,req.count);
                    globalThis.dispatchEvent?.(new Event('yps-senka-changed'));
                } else if(req.op!=='get') throw Error('操作が不明です。');
                reply({ok:true,...snapshot()});
            } catch(error) {reply({ok:false,error:error.message});}
        });
        return true;
    });
    globalThis.ypsSenka = {
        setQuestStates: rows => {tracker.sharedStates=Object.fromEntries(rows.map(r=>[String(r.title).normalize('NFKC').replace(/[\s!！「」『』、,]/g,''),{status:r.status,period:r.periodInfo.key.slice(0,7),stale:!!r.raw&&!r.fresh}]));},
        snapshot: () => pending.then(()=>({at:Date.now(),...snapshot()})),
        lines: () => tracker.lines(),
        // Only queue extra bodies needed by the tracker. YPS handlers still read
        // their own APIs regardless of this predicate.
        watches: api => /^\/api_(?:start2\/getData|port\/port|get_member\/(?:basic|ship2|ship3|ship_deck|deck|questlist|mapinfo)|req_(?:quest\/(?:start|stop)|map\/(?:start|next)|kaisou\/(?:remodeling|powerup)|kousyou\/destroyship))$/.test(api)
            || /^\/api_req_(?:hensei|sortie|battle_midnight|combined_battle)\//.test(api),
        receive(request, api, callback) {
            const receivedAt = Date.now();
            // HAR duration includes the request's network phases. This is an
            // estimate, not a separate browser network-completion timestamp.
            const startedAt=Date.parse(request.startedDateTime),duration=request.time;
            const notificationMs=Number.isFinite(startedAt)&&Number.isFinite(duration)&&duration>=0&&receivedAt>=startedAt+duration
                ? Math.round(receivedAt-startedAt-duration):null;
            startupStatus(api,'本文取得待ち',{notificationMs});
            let bodyAt=receivedAt;
            // Start retrieval immediately, but consume in observed request order.
            const body = new Promise(resolve => {
                let finished=false;
                const finish=value=>{if(finished)return;finished=true;bodyAt=Date.now();clearTimeout(timer);resolve(value);};
                const timer = setTimeout(() => finish(null), 5000);
                try {
                    const result=request.getContent((text,encoding)=>finish({text,encoding}));
                    if(result?.then)result.then(value=>finish(value?{text:value.content,encoding:value.encoding}:null),()=>finish(null));
                }
                catch (_) { finish(null); }
            });
            pending = pending.then(async () => {
                const b = await body;
                const processingAt=Date.now();
                const timing={bodyMs:bodyAt-receivedAt,queueMs:Math.max(0,processingAt-bodyAt)};
                startupStatus(api,'解析中',timing);
                let json;
                try {
                    if (!b || !b.text) throw new Error('empty response');
                    const text = b.encoding === 'base64' ? new TextDecoder().decode(Uint8Array.from(atob(b.text), c => c.charCodeAt(0))) : b.text;
                    json = JSON.parse(text.replace(/^svdata=/, ''));
                } catch (_) { tracker.gap(); startupStatus(api,'本文取得・解析失敗',timing); return; }
                if (!json || json.api_result !== 1) {startupStatus(api,'成功応答ではありません',timing);return;}
                // Local receipt time, rather than request payload or cached HAR replay.
                try { tracker.receive(api,json,receivedAt); }
                catch (_) { tracker.gap(); console.warn('YPS 戦果メモ: 応答を解釈できないため現在の追跡を保留しました。'); }
                callback(json);
                const completedAt=Date.now();
                startupStatus(api,'処理完了',{...timing,processMs:completedAt-processingAt});
                if(api==='/api_port/port'){startupDone=true;globalThis.ypsCompassStart?.();}
                if(completedAt-receivedAt>=1000)console.info('YPS 処理時間',{
                    api,bodyMs:bodyAt-receivedAt,queueMs:Math.max(0,processingAt-bodyAt),processMs:completedAt-processingAt
                }); // Durations only; no response contents or account information.
            }).catch(error => {startupStatus(api,'処理エラー');console.error('YPS 応答処理:', error);});
        }
    };
})();
