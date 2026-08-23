/* SALAT TIME: serve prayer times + weather from the prebuilt daily static database. */
(()=>{
  const $=id=>document.getElementById(id);
  const T={ar:['درجة الحرارة اليوم','العظمى / الصغرى'],en:['Today','High / Low'],fr:['Aujourd’hui','Max / Min'],es:['Hoy','Máx / Mín'],zh:['今天','最高 / 最低'],hi:['आज','अधिकतम / न्यूनतम'],ru:['Сегодня','Макс. / Мин.'],fa:['امروز','بیشینه / کمینه']};
  const icon=c=>c===0?'☀️':[1,2,3].includes(c)?'⛅':[45,48].includes(c)?'🌫️':[51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c)?'🌧️':[71,73,75,77,85,86].includes(c)?'❄️':'⛈️';
  const cache=new Map();
  const shard=id=>(Number(id)%1024).toString(16).padStart(3,'0');
  async function getRecord(){
    const id=window.__SALAT_CITY_ID || JSON.parse(localStorage.getItem('salat_city')||'null')?.id;
    if(!id)return null;
    const key=shard(id); if(cache.has(key))return cache.get(key);
    const p=`data/times/${key}.json?v=1`;
    const r=await fetch(p,{cache:'force-cache'}); if(!r.ok)throw Error('local database unavailable');
    const j=await r.json(); cache.set(key,j); return j[String(id)]||null;
  }
  function toAladhan(day){
    return {timings:{Fajr:day.fajr,Sunrise:day.sunrise,Dhuhr:day.dhuhr,Asr:day.asr,Maghrib:day.maghrib,Isha:day.isha},meta:{timezone:day.timezone},date:{gregorian:{date:day.date,weekday:{en:new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:day.timezone}).format(new Date(day.date+'T12:00:00'))}},hijri:null}};
  }
  function renderWeather(rec){
    const lang=document.documentElement.lang||'en',tx=T[lang]||T.en,w=rec?.weather?.[0];
    let box=$('weather-card'); if(!box){box=document.createElement('div');box.id='weather-card';box.className='weather-card';const a=$('hijri-date');if(a)a.insertAdjacentElement('afterend',box)}
    if(!w){box.innerHTML='<span class="weather-icon">🌡️</span><div><div class="weather-main">—</div><div class="weather-detail">'+tx[0]+'</div></div>';return}
    box.innerHTML=`<span class="weather-icon">${icon(w.code)}</span><div><div class="weather-main">${w.max}° / ${w.min}°C</div><div class="weather-detail">${tx[0]} · ${tx[1]}</div></div>`;
  }
  function setDates(day){
    if(!day)return; const d=new Date(day.date+'T12:00:00');
    $('gregorian-date').textContent=new Intl.DateTimeFormat(document.documentElement.lang||'en',{weekday:'long',day:'2-digit',month:'short',year:'numeric',timeZone:day.timezone}).format(d);
    try{$('hijri-date').textContent=new Intl.DateTimeFormat(document.documentElement.lang||'en-u-ca-islamic',{day:'2-digit',month:'long',year:'numeric',calendar:'islamic',timeZone:day.timezone}).format(d)}catch{$('hijri-date').textContent='';}
  }
  async function localLoadBoth(){
    const city=JSON.parse(localStorage.getItem('salat_city')||'null'); if(!city?.id)return false;
    try{
      const rec=await getRecord(); if(!rec?.days?.length)throw Error('missing city data');
      window.__SALAT_LOCAL_RECORD=rec;
      const today=toAladhan(rec.days[0]), tomorrow=toAladhan(rec.days[1]);
      window.__SALAT_LOCAL_DAYS={today,tomorrow};
      window.__SALAT_LOCAL_WEATHER=rec;
      if(window.days)window.days={today,tomorrow}; else window.days={today,tomorrow};
      if($('status'))$('status').textContent=''; if($('timezone'))$('timezone').textContent=`${(window.t?window.t('timezone'):'Time zone')}: ${rec.timezone||'—'}`;
      setDates(rec.days[0]); renderWeather(rec); if(typeof window.render==='function')window.render();
      return true;
    }catch(e){console.warn('SALAT local DB',e);return false;}
  }
  window.SalatTimeLocalDB={load:localLoadBoth,getRecord,renderWeather};
  window.loadBoth=async function(){
    if($('status'))$('status').textContent='…';
    const ok=await localLoadBoth();
    if(ok)return;
    if($('status'))$('status').textContent=(window.t?window.t('error'):'Could not load data.');
  };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(JSON.parse(localStorage.getItem('salat_city')||'null')?.id)localLoadBoth()},150));
})();
