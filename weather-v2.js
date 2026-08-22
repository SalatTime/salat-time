(function(){
  const T={ar:['درجة الحرارة اليوم','العظمى / الصغرى'],en:['Today','High / Low'],fr:['Aujourd’hui','Max / Min'],es:['Hoy','Máx / Mín'],zh:['今天','最高 / 最低'],hi:['आज','अधिकतम / न्यूनतम'],ru:['Сегодня','Макс. / Мин.'],fa:['امروز','بیشینه / کمینه']};
  const icon=c=>c===0?'☀️':[1,2,3].includes(c)?'⛅':[45,48].includes(c)?'🌫️':[51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c)?'🌧️':[71,73,75,77,85,86].includes(c)?'❄️':'⛈️';
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let key='';
  async function load(){
    let city;try{city=JSON.parse(localStorage.getItem('salat_city')||'null')}catch{return}
    if(!city||!Number.isFinite(+city.lat)||!Number.isFinite(+city.lon))return;
    const lang=document.documentElement.lang||'en',tx=T[lang]||T.en;
    let box=document.getElementById('weather-card');
    if(!box){box=document.createElement('div');box.id='weather-card';box.className='weather-card';const anchor=document.getElementById('hijri-date');if(!anchor)return;anchor.insertAdjacentElement('afterend',box)}
    const k=`${city.lat},${city.lon},${lang},${new Date().toISOString().slice(0,10)}`;
    if(k===key&&box.dataset.ready==='1')return;key=k;box.dataset.ready='0';
    box.innerHTML=`<span class="weather-icon">🌡️</span><div><div class="weather-main weather-loading">…</div><div class="weather-detail">${tx[0]}</div></div>`;
    try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(city.lat)}&longitude=${encodeURIComponent(city.lon)}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&timezone=auto&forecast_days=1`;const r=await fetch(u);if(!r.ok)throw Error();const j=await r.json();const max=Math.round(j.daily.temperature_2m_max[0]),min=Math.round(j.daily.temperature_2m_min[0]);box.innerHTML=`<span class="weather-icon">${icon(j.daily.weather_code[0])}</span><div><div class="weather-main">${max}° / ${min}°C</div><div class="weather-detail">${esc(tx[0])} · ${esc(tx[1])}</div></div>`;box.dataset.ready='1'}catch{box.innerHTML=`<span class="weather-icon">🌡️</span><div><div class="weather-main">—</div><div class="weather-detail">${esc(tx[0])}</div></div>`;box.dataset.ready='1'}
  }
  window.SalatTimeWeather=load;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));
})();
