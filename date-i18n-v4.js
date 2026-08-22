/* SALAT TIME — reliable localized city date */
(function(){
  const LOCALES={ar:'ar-DZ',en:'en-GB',fr:'fr-FR',es:'es-ES',zh:'zh-CN',hi:'hi-IN',ru:'ru-RU',fa:'fa-IR'};
  function lang(){return localStorage.getItem('salat_lang')||document.documentElement.lang?.split('-')[0]||'en';}
  function format(raw,l){
    const m=String(raw||'').match(/(\d{1,2})-(\d{1,2})-(\d{4})/); if(!m)return '';
    const d=new Date(+m[3],+m[2]-1,+m[1],12);
    try{return new Intl.DateTimeFormat(LOCALES[l]||'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}catch{return raw}
  }
  function update(){
    const el=document.getElementById('gregorian-date'); if(!el)return;
    let raw=el.dataset.rawDate;
    if(!raw){
      const m=el.textContent.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if(m){raw=m[0];el.dataset.rawDate=raw}
    }
    if(raw)el.textContent=format(raw,lang());
  }
  const obs=new MutationObserver(()=>update());
  obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['lang']});
  window.addEventListener('storage',update);
  setInterval(update,300);
  window.SalatTimeDateI18nV4={update};
  update();
})();
