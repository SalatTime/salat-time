/* SALAT TIME performance layer: show today's prayer times first; do not block city display on tomorrow's request. */
(()=>{
  if(typeof window.loadBoth!=='function'||typeof window.getDay!=='function')return;
  window.loadBoth=async function(){
    const status=document.getElementById('status');
    try{
      if(status)status.textContent='';
      const today=await window.getDay(0);
      window.days={today,tomorrow:null};
      const tz=document.getElementById('timezone');
      const T=(window.LANGS&&window.LANGS[localStorage.getItem('salat_lang')||'en'])||{};
      if(tz)tz.textContent=`${T.timezone||'Time zone'}: ${today.meta?.timezone||'—'}`;
      if(typeof window.render==='function')window.render();
    }catch(e){console.error(e);if(status)status.textContent=(window.LANGS&&window.LANGS[localStorage.getItem('salat_lang')||'en']?.error)||'Could not load data.';}
  };
})();
