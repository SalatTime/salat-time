/* SALAT TIME: resilient runtime cache. Never blocks site boot; caches prayer responses per city/date. */
(()=>{
  const native=window.fetch.bind(window), TIMEOUT=8000;
  const timeoutFetch=(input,init={})=>{
    const c=new AbortController();
    const t=setTimeout(()=>c.abort(),TIMEOUT);
    return native(input,{...init,signal:c.signal}).finally(()=>clearTimeout(t));
  };
  const keyFor=(url)=>{
    const m=url.match(/api\.aladhan\.com\/v1\/timings\/(\d{2}-\d{2}-\d{4}).*?latitude=([^&]+).*?longitude=([^&]+)/);
    return m?`salat_runtime_${m[1]}_${m[2]}_${m[3]}`:null;
  };
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const key=keyFor(url);
    if(!key) return timeoutFetch(input,init);
    let cached=null;
    try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    if(cached?.payload){
      // Return cached prayer immediately. Refresh in background without blocking UI.
      timeoutFetch(input,init).then(r=>r.ok?r.clone().json():null).then(j=>{if(j?.code===200)try{localStorage.setItem(key,JSON.stringify({payload:j,updatedAt:Date.now()}))}catch{}}).catch(()=>{});
      return new Response(JSON.stringify(cached.payload),{status:200,headers:{'Content-Type':'application/json'}});
    }
    const r=await timeoutFetch(input,init);
    if(r.ok){try{const j=await r.clone().json();if(j?.code===200)localStorage.setItem(key,JSON.stringify({payload:j,updatedAt:Date.now()}))}catch{}}
    return r;
  };
})();
