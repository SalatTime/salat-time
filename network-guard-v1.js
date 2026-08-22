// Prevent a slow/unresponsive API from leaving SALAT TIME loading forever.
(function(){
  const originalFetch=window.fetch.bind(window);
  const MAX_WAIT=12000;
  window.fetch=function(input,init={}){
    const controller=new AbortController();
    const externalSignal=init.signal;
    let settled=false;
    const timeout=setTimeout(()=>{if(!settled)controller.abort()},MAX_WAIT);
    if(externalSignal){
      if(externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort',()=>controller.abort(),{once:true});
    }
    return originalFetch(input,{...init,signal:controller.signal}).finally(()=>{settled=true;clearTimeout(timeout)});
  };
})();
