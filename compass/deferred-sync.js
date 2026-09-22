// Coalesce derived work without putting it on the ordered response-write queue.
export function deferredSync(work,onError=()=>{},delay=200){
  let timer=null,running=false,dirty=false;
  function request(){
    dirty=true;
    if(timer!==null||running)return;
    timer=setTimeout(async()=>{
      timer=null;running=true;dirty=false;
      try{await work();}catch(error){onError(error);}
      finally{running=false;if(dirty)request();}
    },delay);
  }
  return request;
}
