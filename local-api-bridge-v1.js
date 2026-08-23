/* Redirect prayer/weather API reads to the prebuilt static database when a local city id is available. */
(()=>{
  const nativeFetch=window.fetch.bind(window), cache=new Map();
  const city=()=>{try{return JSON.parse(localStorage.getItem('salat_city')||'null')}catch{return null}};
  const shard=id=>(Number(id)%1024).toString(16).padStart(3,'0');
  async function record(){const c=city();if(!c?.id)return null;const key=String(c.id);if(cache.has(key))return cache.get(key);const r=await nativeFetch(`data/times/${shard(c.id)}.json?v=1`,{cache:'force-cache'});if(!r.ok)return null;const j=await r.json();const rec=j[key]||null;if(rec)cache.set(key,rec);return rec;}
  function json(data){return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=86400'}})}
  function dateFromUrl(url){const m=url.match(/timings\/(\d{2})-(\d{2})-(\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:null}
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const c=city();
    if(c?.id && url.includes('api.aladhan.com/v1/timings/')){
      const rec=await record(); const target=dateFromUrl(url); const day=rec?.days?.find(x=>x.date===target);
      if(day){const d=new Date(day.date+'T12:00:00');const hijri=new Intl.DateTimeFormat('en-u-ca-islamic',{day:'2-digit',month:'long',year:'numeric',timeZone:day.timezone}).format(d);return json({code:200,status:'OK',data:{timings:{Fajr:day.fajr,Sunrise:day.sunrise,Dhuhr:day.dhuhr,Asr:day.asr,Maghrib:day.maghrib,Isha:day.isha},meta:{timezone:day.timezone},date:{gregorian:{date:day.date,weekday:{en:new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:day.timezone}).format(d)}},hijri:{date:hijri}}}})}
    }
    if(c?.id && url.includes('api.open-meteo.com/v1/forecast')){
      const rec=await record(); if(rec?.weather?.length){const d=rec.weather;return json({daily:{time:d.map(x=>x.date),temperature_2m_max:d.map(x=>x.max),temperature_2m_min:d.map(x=>x.min),weather_code:d.map(x=>x.code)}})}
    }
    return nativeFetch(input,init);
  };
})();
