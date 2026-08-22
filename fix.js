/* Presentation + timezone fixes for ISO-8601 API responses. */
function displayTime(value){
  if(!value)return '—';
  const match=String(value).match(/T(\d{2}:\d{2})/);
  return match?match[1]:String(value).slice(0,5);
}
function cityLocalMinutes(timeZone){
  try{
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const get=k=>Number(parts.find(p=>p.type===k)?.value||0);
    return get('hour')*60+get('minute')+get('second')/60;
  }catch{return new Date().getHours()*60+new Date().getMinutes()}
}
function renderPrayerList(data){
  const zone=data.meta?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localNow=cityLocalMinutes(zone);
  let next=-1;
  if(selectedDay==='today'){
    for(let i=0;i<prayerKeys.length;i++){
      if(prayerKeys[i]==='sunrise')continue;
      if(parseMinutes(displayTime(data.timings[apiNames[prayerKeys[i]]]))>localNow){next=i;break;}
    }
    if(next<0)next=0;
  }
  const nextKey=selectedDay==='tomorrow'?'fajr':(prayerKeys[next]||'fajr');
  $('next-prayer').textContent=t(nextKey);
  $('next-time').textContent=displayTime(data.timings[apiNames[nextKey]]);
  $('countdown').textContent=selectedDay==='tomorrow'?'—':'00:00:00';
  $('prayer-list').innerHTML=prayerKeys.map((k,i)=>`<div class="prayer-row ${i===next?'next':''}"><strong>${t(k)}</strong><time>${displayTime(data.timings[apiNames[k]])}</time></div>`).join('');
  if(selectedDay==='today')startCountdown(data,next);else clearInterval(timer);
}
function startCountdown(data,next){
  clearInterval(timer);
  const key=apiNames[prayerKeys[next]||'fajr'];
  const tick=()=>{
    let target=new Date(data.timings[key]);
    if(Number.isNaN(target.getTime())){
      const zone=data.meta?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [h,m]=displayTime(data.timings[key]).split(':').map(Number);
      const now=new Date();
      const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
      const y=Number(parts.find(p=>p.type==='year')?.value),mo=Number(parts.find(p=>p.type==='month')?.value),d=Number(parts.find(p=>p.type==='day')?.value);
      target=new Date(y,mo-1,d,h,m,0);
    }
    const now=new Date();
    if(target<=now)target=new Date(target.getTime()+86400000);
    let s=Math.max(0,Math.floor((target-now)/1000));
    const hh=String(Math.floor(s/3600)).padStart(2,'0');s%=3600;
    const mm=String(Math.floor(s/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');
    $('countdown').textContent=`${hh}:${mm}:${ss}`;
  };
  tick();timer=setInterval(tick,1000);
}
const originalMonthly=monthly;
monthly=async function(){
  if(!city)return;
  $('monthly-panel').classList.remove('hidden');$('monthly-loading').classList.remove('hidden');$('monthly-body').innerHTML='';
  const d=new Date();
  try{
    const r=await fetch(`https://api.aladhan.com/v1/calendar/${d.getFullYear()}/${d.getMonth()+1}?latitude=${city.lat}&longitude=${city.lon}&method=${methodForCity()}&latitudeAdjustmentMethod=3`);
    const j=await r.json();if(j.code!==200)throw Error();
    $('monthly-loading').classList.add('hidden');
    $('monthly-head').innerHTML=`<th>Date</th>${prayerKeys.map(k=>`<th>${t(k)}</th>`).join('')}`;
    $('monthly-body').innerHTML=j.data.map(x=>`<tr><td>${x.date.gregorian.day}</td>${prayerKeys.map(k=>`<td>${displayTime(x.timings[apiNames[k]])}</td>`).join('')}</tr>`).join('');
  }catch{$('monthly-loading').textContent=t('error');}
};
