(function(){
const P={ar:['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'],en:['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'],fr:['Fajr','Lever du soleil','Dhuhr','Asr','Maghrib','Isha'],es:['Fajr','Amanecer','Dhuhr','Asr','Maghrib','Isha'],zh:['晨礼','日出','晌礼','晡礼','昏礼','宵礼'],hi:['फ़ज्र','सूर्योदय','ज़ुहर','अस्र','मग़रिब','ईशा'],ru:['Фаджр','Восход','Зухр','Аср','Магриб','Иша'],fa:['صبح','طلوع آفتاب','ظهر','عصر','مغرب','عشاء']};
const L=()=>localStorage.getItem('salat_lang')||'en';
const C=()=>({ar:'ar-DZ',en:'en-US',fr:'fr-FR',es:'es-ES',zh:'zh-CN',hi:'hi-IN',ru:'ru-RU',fa:'fa-IR'})[L()]||'en-US';
function run(){const p=P[L()]||P.en;document.querySelectorAll('.prayer-row strong').forEach((e,i)=>{if(p[i])e.textContent=p[i]});const g=document.getElementById('gregorian-date');if(g&&g.textContent&&/^[A-Za-z]+,/.test(g.textContent)){const d=new Date(g.textContent.replace(',',''));if(!isNaN(d))g.textContent=new Intl.DateTimeFormat(C(),{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(d)}document.documentElement.lang=L()}
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});setInterval(run,800);setTimeout(run,300);
})();
