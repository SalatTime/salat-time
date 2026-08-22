/* SALAT TIME — localized Gregorian + Hijri dates */
(function () {
  const LOCALES = { ar:'ar-DZ', en:'en-GB', fr:'fr-FR', es:'es-ES', zh:'zh-CN', hi:'hi-IN', ru:'ru-RU', fa:'fa-IR' };
  const HIJRI = {
    'muharram': {ar:'محرم',en:'Muharram',fr:'Muharram',es:'Muharram',zh:'穆哈兰姆',hi:'मुहर्रम',ru:'Мухаррам',fa:'محرم'},
    'safar': {ar:'صفر',en:'Safar',fr:'Safar',es:'Safar',zh:'萨法尔',hi:'सफ़र',ru:'Сафар',fa:'صفر'},
    'rabi al-awwal': {ar:'ربيع الأول',en:'Rabi al-Awwal',fr:'Rabīʿ al-awwal',es:'Rabīʿ al-awwal',zh:'赖比尔·敖外鲁',hi:'रबी अल-अव्वल',ru:'Раби аль-авваль',fa:'ربیع‌الاول'},
    'rabi al-thani': {ar:'ربيع الآخر',en:'Rabi al-Thani',fr:'Rabīʿ ath-thānī',es:'Rabīʿ ath-thānī',zh:'赖比尔·阿赫尔',hi:'रबी अल-आख़िर',ru:'Раби ас-сани',fa:'ربیع‌الثانی'},
    'jumada al-awwal': {ar:'جمادى الأولى',en:'Jumada al-Awwal',fr:'Jumādā al-awwal',es:'Ŷumādā al-awwal',zh:'主马达·敖外鲁',hi:'जुमादा अल-अव्वल',ru:'Джумада аль-уля',fa:'جمادی‌الاول'},
    'jumada al-thani': {ar:'جمادى الآخرة',en:'Jumada al-Thani',fr:'Jumādā ath-thāniya',es:'Ŷumādā ath-thāniya',zh:'主马达·阿赫尔',hi:'जुमादा अल-आख़िरा',ru:'Джумада ас-сания',fa:'جمادی‌الثانی'},
    'rajab': {ar:'رجب',en:'Rajab',fr:'Rajab',es:'Rajab',zh:'拉贾卜',hi:'रजब',ru:'Раджаб',fa:'رجب'},
    'shaban': {ar:'شعبان',en:'Shaʿban',fr:'Shaʿbān',es:'Shaʿbān',zh:'沙班',hi:'शाबान',ru:'Шаабан',fa:'شعبان'},
    'ramadan': {ar:'رمضان',en:'Ramadan',fr:'Ramadan',es:'Ramadán',zh:'斋月',hi:'रमज़ान',ru:'Рамадан',fa:'رمضان'},
    'shawwal': {ar:'شوال',en:'Shawwal',fr:'Shawwāl',es:'Shawwāl',zh:'闪瓦尔',hi:'शव्वाल',ru:'Шавваль',fa:'شوال'},
    'dhu al-qidah': {ar:'ذو القعدة',en:'Dhu al-Qidah',fr:'Dhū al-Qiʿda',es:'Dhū al-Qiʿda',zh:'都尔盖德',hi:'ज़ुल-क़ादा',ru:'Зу аль-Каада',fa:'ذوالقعده'},
    'dhu al-hijjah': {ar:'ذو الحجة',en:'Dhu al-Hijjah',fr:'Dhū al-Ḥijja',es:'Dhū al-Ḥijja',zh:'都尔黑哲',hi:'ज़ुल-हिज्जा',ru:'Зу аль-Хиджжа',fa:'ذوالحجه'}
  };
  function normalize(s){ return String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim(); }
  function num(n, lang){ try { return new Intl.NumberFormat(LOCALES[lang]||'en-GB').format(Number(n)); } catch { return String(n); } }
  function formatGregorian(raw, lang){
    const m=String(raw||'').match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/); if(!m)return raw;
    const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),12);
    try { return new Intl.DateTimeFormat(LOCALES[lang]||'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d); }
    catch { return raw; }
  }
  function formatHijri(raw, lang){
    const m=String(raw||'').match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(.+?)\s+(\d{4})$/); if(!m)return raw;
    const key=normalize(m[4]); const names=HIJRI[key]; const month=names?.[lang]||names?.en||m[4];
    const day=num(m[1],lang), year=num(m[3],lang);
    if(lang==='ar') return `${day} ${month} ${year} هـ`;
    if(lang==='fa') return `${day} ${month} ${year} هـ`;
    if(lang==='zh') return `${year}年${month}${day}日`;
    if(lang==='hi') return `${day} ${month} ${year} हि.`;
    if(lang==='ru') return `${day} ${month} ${year} г. х.`;
    return `${day} ${month} ${year} AH`;
  }
  function update(){
    const lang=localStorage.getItem('salat_lang')||document.documentElement.lang?.split('-')[0]||'en';
    const g=document.getElementById('gregorian-date'), h=document.getElementById('hijri-date');
    if(g && g.textContent.trim()){
      const raw=g.dataset.rawDate||g.textContent.trim();
      if(/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) g.dataset.rawDate=raw, g.textContent=formatGregorian(raw,lang);
      else { const match=raw.match(/(\d{1,2}-\d{1,2}-\d{4})/); if(match){g.dataset.rawDate=match[1];g.textContent=formatGregorian(match[1],lang);} }
    }
    if(h && h.textContent.trim()){
      const raw=h.dataset.rawHijri||h.textContent.trim();
      if(/\d{1,2}-\d{1,2}-\d{4}/.test(raw)){ h.dataset.rawHijri=raw; h.textContent=formatHijri(raw,lang); }
      else if(h.dataset.hijriSource) h.textContent=formatHijri(h.dataset.hijriSource,lang);
    }
  }
  function captureAndUpdate(){
    const g=document.getElementById('gregorian-date'),h=document.getElementById('hijri-date');
    if(g){ const m=g.textContent.trim().match(/\d{1,2}-\d{1,2}-\d{4}/); if(m)g.dataset.rawDate=m[0]; }
    if(h){ const m=h.textContent.trim().match(/\d{1,2}-\d{1,2}-\d{4}\s+.+?\s+\d{4}/); if(m)h.dataset.hijriSource=m[0]; }
    update();
  }
  const obs=new MutationObserver(captureAndUpdate);
  obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['lang']});
  setInterval(update,500);
  window.SalatTimeDateI18n={update:captureAndUpdate};
  captureAndUpdate();
})();