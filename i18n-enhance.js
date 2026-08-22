/* SALAT TIME — language/date presentation layer */
(function(){
  const names={
    ar:{fajr:'الفجر',sunrise:'الشروق',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء'},
    en:{fajr:'Fajr',sunrise:'Sunrise',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'},
    fr:{fajr:'Fajr',sunrise:'Lever du soleil',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'},
    es:{fajr:'Fajr',sunrise:'Amanecer',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'},
    zh:{fajr:'晨礼',sunrise:'日出',dhuhr:'晌礼',asr:'晡礼',maghrib:'昏礼',isha:'宵礼'},
    hi:{fajr:'फ़ज्र',sunrise:'सूर्योदय',dhuhr:'ज़ुहर',asr:'अस्र',maghrib:'मग़रिब',isha:'ईशा'},
    ru:{fajr:'Фаджр',sunrise:'Восход',dhuhr:'Зухр',asr:'Аср',maghrib:'Магриб',isha:'Иша'},
    fa:{fajr:'صبح',sunrise:'طلوع آفتاب',dhuhr:'ظهر',asr:'عصر',maghrib:'مغرب',isha:'عشاء'}
  };
  const months={
    ar:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
    en:['January','February','March','April','May','June','July','August','September','October','November','December'],
    fr:['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
    es:['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
    ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    fa:['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر']
  };
  function L(){return localStorage.getItem('salat_lang')||'en'}
  function prayerName(k){return (names[L()]||names.en)[k]||k}
  function locale(){return ({ar:'ar-DZ',en:'en-US',fr:'fr-FR',es:'es-ES',zh:'zh-CN',hi:'hi-IN',ru:'ru-RU',fa:'fa-IR'})[L()]||'en-US'}
  function formatDate(text){
    const m=String(text||'').match(/^(\d{1,2})[\s,/-]+([A-Za-z]+)?[\s,/-]*(\d{4})?$/); if(!m)return text;
    return text;
  }
  function enhance(){
    document.querySelectorAll('.prayer-row strong').forEach((el,i)=>{const key=['fajr','sunrise','dhuhr','asr','maghrib','isha'][i];if(key)el.textContent=prayerName(key)});
    const np=document.getElementById('next-prayer'); if(np){const raw=np.dataset.key;if(raw)np.textContent=prayerName(raw)}
    document.documentElement.lang=L();
  }
  const oldApply=window.apply; if(typeof oldApply==='function'){
    window.apply=function(){oldApply.apply(this,arguments);setTimeout(enhance,0)};
  }
  const oldRender=window.render; if(typeof oldRender==='function'){
    window.render=function(){oldRender.apply(this,arguments);setTimeout(enhance,0)};
  }
  const observer=new MutationObserver(()=>enhance());observer.observe(document.body,{subtree:true,childList:true});
  setTimeout(enhance,500);
})();
