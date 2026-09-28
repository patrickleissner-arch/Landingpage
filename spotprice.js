(()=>{
 const chartWrap=document.querySelector('.spotpreis-chart-wrap'),grid=document.getElementById('kvGrid'),label=document.getElementById('updateLabel'),fallback=document.getElementById('fallback');
 const fmt=v=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
 const time=t=>new Date(t).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let chart,busy=false;
 const retry=document.createElement('button');retry.type='button';retry.className='btn btn--gold';retry.textContent='Erneut laden';retry.addEventListener('click',load);
 fallback.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Die Preisdaten sind gerade nicht erreichbar. Bitte versuche es erneut.'}),retry);
 const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='Preise aktualisieren';refresh.addEventListener('click',load);label.after(refresh);
 const table=document.createElement('details');table.className='spot-table';table.innerHTML='<summary>Alle Preisintervalle als Tabelle</summary><div style="max-height:360px;overflow:auto"><table style="width:100%"><caption>Day-Ahead Deutschland/Luxemburg · Börsenpreise ohne Endkunden-Aufschläge</caption><thead><tr><th scope="col">Zeit (Berlin)</th><th scope="col">ct/kWh</th></tr></thead><tbody></tbody></table></div>';chartWrap.after(table);
 async function load(){
  if(busy)return;busy=true;retry.disabled=refresh.disabled=true;fallback.style.display='none';label.textContent='Börsenpreise werden geladen …';chartWrap.hidden=true;grid.style.display='none';table.hidden=true;
  try{
   const res=await fetch('/api/spotprice',{signal:AbortSignal.timeout(16000),cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);
   const data=await res.json();if(data.day!==today()||!Array.isArray(data.prices))throw new Error('No current data');
   const prices=data.prices,valid=prices.filter(p=>Number.isFinite(p.priceCtKwh)&&Number.isFinite(p.start)&&p.end>p.start);if(!valid.length)throw new Error('Empty prices');
   const now=Date.now(),current=valid.find(p=>p.start<=now&&now<p.end),min=valid.reduce((a,b)=>a.priceCtKwh<b.priceCtKwh?a:b),negativeHours=valid.filter(p=>p.priceCtKwh<0).reduce((sum,p)=>sum+(p.end-p.start)/3600000,0);
   grid.innerHTML=[[(current?fmt(current.priceCtKwh)+' ct/kWh':'Noch kein Wert'),current?`Aktuell · ${time(current.start)}–${time(current.end)} Uhr`:'Für das aktuelle Intervall'],[fmt(min.priceCtKwh)+' ct/kWh',`Tagesminimum · ${time(min.start)} Uhr`],[fmt(negativeHours)+' h','Dauer negativer Preise heute']].map(([value,title])=>`<div class="sp-stat-item"><div class="sp-stat-number">${value}</div><div class="sp-stat-label">${title}</div></div>`).join('');
   grid.style.display='';grid.style.opacity='1';grid.style.transform='none';grid.classList.remove('reveal');
   label.textContent=`${data.cached?'Zwischengespeicherte Daten · ':''}Preise für ${new Date(valid[0].start).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'})} · Abgerufen ${time(data.updated)} Uhr · Zeiten: Europa/Berlin`;
   table.querySelector('tbody').replaceChildren(...valid.map(p=>{const tr=document.createElement('tr');for(const value of [`${time(p.start)}–${time(p.end)}`,fmt(p.priceCtKwh)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}return tr;}));table.hidden=false;
   if(typeof Chart==='function'){
    chartWrap.hidden=false;chart?.destroy();chart=new Chart(document.getElementById('spotChart'),{type:'bar',data:{labels:prices.map(p=>time(p.start)),datasets:[{label:'Börsenpreis in ct/kWh',data:prices.map(p=>p.priceCtKwh),backgroundColor:prices.map(p=>p.priceCtKwh<0?'#bd4747':'#2e4f3c'),borderRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)+' ct/kWh'}}},scales:{x:{ticks:{maxTicksLimit:12}},y:{title:{display:true,text:'ct/kWh · Börsenpreis'}}}}});
   }else{table.open=true;label.textContent+=' · Preise stehen in der Tabelle bereit.';}
  }catch{fallback.style.display='block';label.textContent='Keine aktuellen Preisdaten geladen.';}
  finally{busy=false;retry.disabled=refresh.disabled=false;}
 }
 load();setInterval(()=>{if(!document.hidden)load()},300000);
})();

