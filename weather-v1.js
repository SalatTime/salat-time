(function(){
  const WEATHER_TEXT={
    ar:{label:'درجة الحرارة اليوم',detail:'العظمى / الصغرى'},en:{label:'Today',detail:'High / Low'},fr:{label:'Aujourd’hui',detail:'Max / Min'},es:{label:'Hoy',detail:'Máx / Mín'},zh:{label:'今天',detail:'最高 / 最低'},hi:{label:'आज',detail:'अधिकतम / न्यूनतम'},ru:{label:'Сегодня',detail:'Макс. / Мин.'},fa:{label:'امروز',detail:'بیشینه / کمینه'}
  };
  const icon=(code)=>code===0?'☀️':([1,2,3].includes(code)?'⛅':([45,48].includes(code)?'🌫️':([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)?'🌧️':([71,73,75,77,85,86].includes(code)?'❄️':'⛈️'))));
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  async function loadWeather(){
    const city=window.__salatCity;
    if(!city||!Number.isFinite(+city.lat)||!Number.isFinite(+city.lon))return;
    let box=document.getElementById('weather-card');
    if(!box){
      box=document.createElement('div');box.id='weather-card';box.className='weather-card';
      const date=document.getElementById('hijri-date'); if(date) date.insertAdjacentElement('afterend',box); else return;
    }
    const lang=document.documentElement.lang||'en', tx=WEATHER_TEXT[lang]||WEATHER_TEXT.en;
    box.innerHTML='<span class="weather-icon">🌡️</span><div><div class="weather-main weather-loading">…</div><div class="weather-detail">'+tx.label+'</div></div>';
    try{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(city.lat)}&longitude=${encodeURIComponent(city.lon)}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&timezone=auto&forecast_days=1`;
      const r=await fetch(u);if(!r.ok)throw Error('weather');const j=await r.json();
      const max=Math.round(j.daily.temperature_2m_max[0]),min=Math.round(j.daily.temperature_2m_min[0]),code=j.daily.weather_code[0];
      box.innerHTML=`<span class="weather-icon">${icon(code)}</span><div><div class="weather-main">${max}° / ${min}°C</div><div class="weather-detail">${esc(tx.label)} · ${esc(tx.detail)}</div></div>`;
    }catch(e){box.innerHTML='<span class="weather-icon">🌡️</span><div><div class="weather-main">—</div><div class="weather-detail">'+esc(tx.label)+'</div></div>';}
  }
  window.SalatTimeWeather=loadWeather;
  const oldLoad=window.loadCity;
  const boot=()=>{setTimeout(loadWeather,250)};
  document.addEventListener('DOMContentLoaded',boot);
  const observer=new MutationObserver(()=>{const n=document.getElementById('city-name');if(n&&n.textContent&&n.textContent!=='—')loadWeather()});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
