(() => {
  'use strict';
  const allowedAudience=['home','business','municipal'];
  const allowedPV=['yes','no'];
  let state={audience:'home',pv:'yes'};
  try { const saved=JSON.parse(sessionStorage.getItem('pl-project')||'null'); if(saved&&allowedAudience.includes(saved.audience)&&allowedPV.includes(saved.pv))state=saved; } catch {}
  const labels={home:'Eigenheim',business:'Gewerbe / Investition',municipal:'Gemeinde'};
  function content(){
    const hasPV=state.pv==='yes';
    const audience=state.audience;
    const title=audience==='home'?(hasPV?'Mehr aus deiner PV machen.':'Deine Energie gemeinsam planen.'):audience==='business'?(hasPV?'Deinen Bestand weiterdenken.':'Dein Speicherprojekt einordnen.'):(hasPV?'Kommunale PV weiterdenken.':'Möglichkeiten vor Ort klären.');
    const text=audience==='home'?(hasPV?'Wir prüfen, wie ein Speicher zu deiner bestehenden Anlage, deinem Verbrauch und deinen Zielen passt.':'Wir betrachten deinen Standort, deinen Verbrauch und das Zusammenspiel von PV, Speicher und Wärme.'):audience==='business'?(hasPV?'Wir betrachten die vorhandene Anlage, das Lastprofil und die mögliche Speicherintegration.':'Wir klären, ob ein Speicher im Betrieb oder ein eigenständiges Projekt am Netz dein Ziel ist.'):'Wir klären Bestand, beteiligte Stellen und Ziele, bevor wir den passenden Analyseumfang festlegen.';
    const list=[hasPV?'PV-Leistung und Wechselrichter':'Standort und geplante Nutzung',audience==='home'?'Stromverbrauch und Nutzungszeiten':audience==='business'?'Lastprofil oder geplante Vermarktung':'Gebäude, Verbrauch und Beteiligte','Standort und Anschlussbedingungen'];
    const region=audience==='home'?'Umsetzung in Sachsen, Sachsen-Anhalt und Brandenburg.':audience==='business'?'Beratung und Betreuung bundesweit.':'Analyseumfang und mögliche Umsetzung projektbezogen klären.';
    return {title,text,list,region,summary:labels[audience]+' · '+(hasPV?'PV vorhanden':'Noch keine PV')};
  }
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  function render(){
    const c=content();
    document.querySelectorAll('input[name=audience]').forEach(el=>el.checked=el.value===state.audience);
    document.querySelectorAll('input[name=pv]').forEach(el=>el.checked=el.value===state.pv);
    set('result-kicker',c.summary);set('result-title',c.title);set('result-text',c.text);set('result-region',c.region);
    const list=document.getElementById('result-list');if(list){list.replaceChildren(...c.list.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));}
    document.querySelectorAll('.saved-summary').forEach(el=>el.textContent=c.summary);
    document.querySelectorAll('.download-note').forEach(el=>{el.hidden=false;el.href='/notes/'+state.audience+'-'+state.pv+'.txt';});
    set('diagram-source',state.pv==='yes'?'Deine PV':'PV prüfen');set('diagram-use',state.audience==='home'?'Zuhause':state.audience==='business'?'Betrieb / Netz':'Gebäude');
    const network=document.querySelector('.network');if(network){network.dataset.audience=state.audience;network.dataset.pv=state.pv;}
  }
  document.querySelectorAll('input[name=audience],input[name=pv]').forEach(el=>el.addEventListener('change',()=>{state[el.name]=el.value;try{sessionStorage.setItem('pl-project',JSON.stringify(state));}catch{}render();}));
  render();
  const bookingFrame=document.querySelector('[data-booking-src]');
  if(bookingFrame&&['patrickleissner.de','www.patrickleissner.de'].includes(location.hostname)){
    bookingFrame.src=bookingFrame.dataset.bookingSrc;
    bookingFrame.parentElement.hidden=false;
    document.querySelector('.booking-fallback').hidden=false;
    const direct=document.querySelector('.booking-direct');if(direct)direct.hidden=true;
  }
  const toggle=document.querySelector('.menu-button'),menu=document.getElementById('mobile-nav');
  function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Menü öffnen');}
  if(toggle&&menu){toggle.hidden=false;toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';menu.hidden=open;toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Menü öffnen':'Menü schließen');});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();toggle.focus();}});matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(window.CoolWebsite)window.CoolWebsite.mount(document.querySelector('main'));
  if('IntersectionObserver' in window&&!reduced.matches){document.documentElement.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('seen');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.image-reveal,.steps li').forEach(el=>observer.observe(el));}
})();

(()=>{const b=document.querySelector('.motion-toggle');if(!b)return;b.hidden=false;let paused=false;try{paused=localStorage.getItem('pl-motion-paused')==='1'}catch{}function sync(){document.documentElement.classList.toggle('motion-paused',paused);b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'Animationen fortsetzen':'Animationen anhalten';window.dispatchEvent(new CustomEvent('motion:change',{detail:{paused}}));}sync();b.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('pl-motion-paused',paused?'1':'0')}catch{}sync();});})();

(()=>{
  const lead=document.querySelector('[data-reading-reveal]');if(!lead)return;
  const words=[...lead.children],reduced=matchMedia('(prefers-reduced-motion: reduce)');let queued=false;
  function update(){queued=false;const disabled=reduced.matches||document.documentElement.classList.contains('motion-paused');lead.classList.toggle('is-tracking',!disabled);const rect=lead.getBoundingClientRect();const distance=rect.height+innerHeight*.25;const progress=Math.min(1,Math.max(0,(innerHeight*.8-rect.top)/distance));const count=Math.round(progress*words.length);words.forEach((word,i)=>word.classList.toggle('is-read',disabled||i<count));}
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('motion:change',schedule);reduced.addEventListener('change',schedule);document.fonts.ready.then(schedule);update();
})();
