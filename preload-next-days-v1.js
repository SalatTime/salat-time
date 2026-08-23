/* SALAT TIME: warm today's + next 2 days prayer/weather cache without blocking the UI. */
(function(){
  const METHODS={dz:19,sa:4,eg:5,ma:21,tn:18,tr:13,ru:14,pk:1,in:1,bd:1,gb:3,fr:12,us:2,ca:2,id:20,my:17,sg:11,qa:10,kw:9,ae:8,jo:23,ir:7};
  const city=(()=>{try{return JSON.parse(localStorage.getItem('salat_city')||'null')}catch{return null}})();
  if(!city||!Number.isFinite(+city.lat)||!Number.isFinite(+city.lon))return;
  const method=METHODS[String(city.countryCode||'').toLowerCase()]||3;
  const ymd=(offset)=>{const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const apiDate=(offset)=>{const d=new Date();d.setDate(d.getDate()+offset);return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`};
  const pkey=(offset)=>`salat_${(+city.lat).toFixed(4)}_${(+city.lon).toFixed(4)}_${apiDate(offset)}_${method}`;
  const weatherKey=`salat_weather_${(+city.lat).toFixed(4)}_${(+city.lon).toFixed(4)}_${ymd(0)}`;
  const timeout=(ms)=>new Promise((_,rej)=>setTimeout(()=>rej(Error('timeout')),ms));
  async function prayer(offset){
    const key=pkey(offset);
    let cached=null;try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    const fresh=cached?.data&&cached.savedAt&&Date.now()-cached.savedAt<20*60*60*1000;
    if(fresh)return;
    const u=`https://api.aladhan.com/v1/timings/${apiDate(offset)}?latitude=${encodeURIComponent(city.lat)}&longitude=${encodeURIComponent(city.lon)}&method=${method}`;
    try{
      const r=await Promise.race([fetch(u),timeout(12000)]);
      if(!r.ok)throw Error('api');
      const j=await r.json();
      if(j.code===200&&j.data)localStorage.setItem(key,JSON.stringify({data:j.data,savedAt:Date.now()}));
    }catch(e){console.debug('SALAT TIME prayer prefetch skipped',offset,e)}
  }
  async function weather(){
    let cached=null;try{cached=JSON.parse(localStorage.getItem(weatherKey)||'null')}catch{}
    if(cached?.daily&&cached.savedAt&&Date.now()-cached.savedAt<6*60*60*1000)return;
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(city.lat)}&longitude=${encodeURIComponent(city.lon)}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&timezone=auto&forecast_days=3`;
    try{
      const r=await Promise.race([fetch(u),timeout(12000)]);if(!r.ok)throw Error('api');
      const j=await r.json();if(j.daily)localStorage.setItem(weatherKey,JSON.stringify({daily:j.daily,savedAt:Date.now()}));
    }catch(e){console.debug('SALAT TIME weather prefetch skipped',e)}
  }
  setTimeout(()=>Promise.allSettled([prayer(0),prayer(1),prayer(2),weather()]),1800);
})();
