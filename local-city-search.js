/* SALAT TIME local city search. Local GeoNames index first, public geocoders as fallback. */
(()=>{
  const input=document.getElementById('city-search');
  const button=document.getElementById('search-button');
  const results=document.getElementById('search-results');
  if(!input||!button||!results)return;
  const oldInput=input.cloneNode(true); input.replaceWith(oldInput);
  const oldButton=button.cloneNode(true); button.replaceWith(oldButton);
  const qInput=oldInput,qButton=oldButton;
  let timer;
  const lang=()=>localStorage.getItem('salat_lang')||'en';
  const norm=s=>String(s||'').normalize('NFKC').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[\u064B-\u065F\u0670\u200c\u200d]/g,'')
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/ؤ/g,'و').replace(/[إأآ]/g,'ا')
    .replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  const bucket=s=>{const x=norm(s).replace(/\s/g,'');return x?Array.from(x.slice(0,2)).map(c=>c.codePointAt(0).toString(16).padStart(4,'0')).join('_'):'empty'};
  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const t={en:{loading:'Loading…',none:'No city found.'},ar:{loading:'جارٍ البحث…',none:'لم يتم العثور على مدينة.'},fr:{loading:'Recherche…',none:'Aucune ville trouvée.'},es:{loading:'Buscando…',none:'No se encontró ninguna ciudad.'},zh:{loading:'搜索中…',none:'未找到城市。'},hi:{loading:'खोज जारी…',none:'कोई शहर नहीं मिला।'},ru:{loading:'Поиск…',none:'Город не найден.'},fa:{loading:'در حال جستجو…',none:'شهری پیدا نشد.'}};
  const text=k=>t[lang()]?.[k]||t.en[k];
  const saveCity=c=>{localStorage.setItem('salat_city',JSON.stringify(c));location.reload()};
  function show(list){
    const unique=[];const seen=new Set();
    for(const c of list){const key=`${c.id||c.name}|${c.countryCode||''}|${(+c.lat).toFixed(2)}|${(+c.lon).toFixed(2)}`;if(!seen.has(key)){seen.add(key);unique.push(c)}if(unique.length>=10)break}
    if(!unique.length){results.innerHTML=`<div class="result">${text('none')}</div>`;return}
    results.innerHTML=unique.map((c,i)=>`<button class="result" data-i="${i}">${esc(c.name)}${c.countryCode?`, ${esc(c.countryCode.toUpperCase())}`:''}<small>${esc(c.ascii||c.name)}</small></button>`).join('');
    results.querySelectorAll('[data-i]').forEach((b,i)=>b.onclick=()=>saveCity(unique[i]));
  }
  async function local(q){
    const path=`data/cities/${bucket(q)}.json?v=1`;
    const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('no local shard');
    const list=await r.json(),needle=norm(q);
    return list.filter(c=>c.aliases?.some(a=>norm(a).includes(needle))).sort((a,b)=>{
      const aa=a.aliases.map(norm),bb=b.aliases.map(norm);const as=aa.some(x=>x===needle)?0:aa.some(x=>x.startsWith(needle))?1:2;const bs=bb.some(x=>x===needle)?0:bb.some(x=>x.startsWith(needle))?1:2;return as-bs||b.population-a.population;
    });
  }
  function remoteCity(x){const a=x.properties||x.address||{};return {name:a.city||a.town||a.village||a.municipality||a.name||x.display_name?.split(',')[0]||'',ascii:a.name||'',countryCode:(a.countrycode||a.country_code||'').toLowerCase(),lat:+(x.geometry?.coordinates?.[1]??x.lat),lon:+(x.geometry?.coordinates?.[0]??x.lon),label:x.display_name||''};}
  async function remote(q){
    try{const r=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=${encodeURIComponent(lang())}`);if(r.ok){const j=await r.json();const a=(j.features||[]).map(remoteCity).filter(x=>x.name&&Number.isFinite(x.lat));if(a.length)return a;}}catch{}
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&q=${encodeURIComponent(q)}&accept-language=${encodeURIComponent(lang())}`);if(!r.ok)throw Error('geocoder');return (await r.json()).map(remoteCity).filter(x=>x.name&&Number.isFinite(x.lat));
  }
  async function search(){
    const q=qInput.value.trim();if(q.length<2){results.innerHTML='';return}results.innerHTML=`<div class="result">${text('loading')}</div>`;
    try{let list=[];try{list=await local(q)}catch{}if(list.length){show(list);return}list=await remote(q);show(list);}catch(e){console.error(e);show([])}
  }
  qInput.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,220)});
  qButton.addEventListener('click',search);
})();
