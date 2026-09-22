// Reads only Chrome's already captured response; never reissues a game request.
export async function receivedBody(request,{timeoutMs=3000,retryDelayMs=100}={}){
  const once=()=>new Promise((resolve,reject)=>{
    let finished=false;
    const timer=setTimeout(()=>finish(null,Error('受信本文の読取がタイムアウトしました')),timeoutMs);
    function finish(value,error){if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(value);}
    try{
      const pending=request.getContent((content,encoding)=>finish({content,encoding}));
      if(pending?.then)pending.then(value=>finish(value),()=>finish(null,Error('受信本文を読み取れませんでした')));
    }catch{finish(null,Error('受信本文を読み取れませんでした'));}
  });
  for(let attempt=0;attempt<2;attempt++){
    try{
      const packet=await once();
      if(typeof packet?.content!=='string'||!packet.content.trim())throw Error('受信本文が空でした');
      if(packet.encoding==='base64'){
        try{return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(packet.content),c=>c.charCodeAt(0)));}
        catch{throw Error('受信本文のBase64を復号できませんでした');}
      }
      if(packet.encoding&&packet.encoding!=='utf8'&&packet.encoding!=='utf-8')throw Error('未対応の受信本文形式です');
      return packet.content;
    }catch(error){if(attempt===1)throw error;await new Promise(resolve=>setTimeout(resolve,retryDelayMs));}
  }
}
