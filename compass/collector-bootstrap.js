// Capture response bodies only; defer the database/catalog modules until YPS is ready.
(() => {
  let consumer=null,starting=false;
  const queued=[];
  const status=text=>{try{chrome.runtime.sendMessage({type:'yps-compass-status',text})?.catch(()=>{});}catch{}};
  globalThis.ypsCompassSubscribe=fn=>{consumer=fn;for(const request of queued.splice(0))consumer(request);};
  globalThis.ypsCompassStart=()=>{
    if(starting)return;starting=true;
    status('艦隊コンパス：読み込み待機中（YPS母港処理完了）');
    setTimeout(()=>{
      status('艦隊コンパス：受信記録を保存中');
      import('./collector-integrated.js').catch(()=>status('艦隊コンパス：読み込み失敗。F12を開き直してください'));
    },250);
  };
  chrome.devtools.network.onRequestFinished.addListener(request=>{
    if(!/^https:\/\/[^/]+\/kcsapi\//.test(request.request.url))return;
    if(consumer){consumer(request);return;}
    const capturedAt=new Date().toISOString();
    const body=new Promise(resolve=>{
      let done=false;
      const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),5000);
      try{
        const pending=request.getContent((content,encoding)=>finish({content,encoding}));
        if(pending?.then)pending.then(finish,()=>finish(null));
      }catch{finish(null);}
    });
    // Retain no request payload, headers, tokens, or HAR object.
    queued.push({request:{url:request.request.url},capturedAt,getContent:()=>body});
  });
})();
