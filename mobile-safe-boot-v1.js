/* SALAT TIME emergency boot guard: keeps the one-page UI usable if a non-critical script fails. */
(function(){
  function boot(){
    const screen=document.getElementById('language-screen');
    const app=document.getElementById('app');
    const grid=document.getElementById('language-grid');
    if(!screen||!app||!grid)return;
    const langs=[['ar','العربية'],['en','English'],['fr','Français'],['es','Español'],['zh','中文'],['hi','हिन्दी'],['ru','Русский'],['fa','فارسی']];
    if(!grid.children.length){
      grid.innerHTML=langs.map(([k,n])=>`<button class="language-option" data-safe-language="${k}">${n}</button>`).join('');
      grid.querySelectorAll('[data-safe-language]').forEach(b=>b.addEventListener('click',()=>{
        localStorage.setItem('salat_lang',b.dataset.safeLanguage);
        screen.classList.add('hidden');
        app.classList.remove('hidden');
      }));
    }
    const lang=localStorage.getItem('salat_lang');
    if(lang){screen.classList.add('hidden');app.classList.remove('hidden');}
    document.documentElement.classList.add('salat-boot-ok');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,1200);
})();
