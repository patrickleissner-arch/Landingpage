(()=>{
 'use strict';
 const el=id=>document.getElementById(id),model=window.EnergyHistory;
 const pct=n=>(n>0?'+':'')+n.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})+' %';
 const label=(m,long=false)=>new Date(m+'-15T12:00:00Z').toLocaleDateString('de-DE',{month:long?'long':'short',year:'numeric',timeZone:'Europe/Berlin'});
 const descriptions={electricity:'Strompreise für Haushalte, einschließlich Steuern und Abgaben. Die aktuellen Börsenpreise findest du weiterhin im separaten Spotpreis-Monitor.',oil:'Leichtes Heizöl für Haushalte. Die Kurve zeigt die Preisentwicklung, unabhängig von deinem individuellen Lieferangebot.',gas:'Erdgas für Haushalte. Die amtliche Reihe „Erdgas, ohne Umlage“ bildet die Entwicklung der Verbraucherpreise ab.',lpg:'Flüssiggas zur Füllung eines Heiztanks. Diese Reihe beschreibt Heizgas und nicht Autogas an der Tankstelle.'};
 let data,chart,key='electricity',period=0;
 function render(){
  const v=model.view(data,key,period);
  el('history-title').textContent=v.name+' im Monatsvergleich';
  el('history-range').textContent=label(v.first.month,true)+' bis '+label(v.last.month,true);
  el('energy-description').textContent=descriptions[key];
  el('energy-change').textContent=pct(v.change);
  el('energy-change-label').textContent='gegenüber dem Jahresdurchschnitt 2020';
  el('energy-month-change').textContent=pct(v.monthChange);
  el('energy-month-label').textContent=label(v.last.month,true)+' gegenüber dem Vormonat';
  el('energy-peak').textContent=label(v.peak.month);
  el('energy-peak-label').textContent='höchstes Preisniveau im gewählten Zeitraum';
  el('history-chart-note').textContent='Fester Vergleich: Jahresdurchschnitt 2020 = 0 %. Auch eine fallende Kurve kann über dem früheren Preisniveau liegen.';
  el('energy-summary').textContent=v.name+': Das Preisniveau liegt im '+label(v.last.month,true)+' '+Math.abs(v.change).toLocaleString('de-DE',{maximumFractionDigits:1})+' % '+(v.change<0?'unter':v.change>0?'über':'auf')+' dem Jahresdurchschnitt 2020.';
  if(Math.abs(v.change)<0.0001)el('energy-summary').textContent=v.name+': Das Preisniveau entspricht im '+label(v.last.month,true)+' dem Jahresdurchschnitt 2020.';
  el('history-table-body').replaceChildren(...v.points.map(r=>{const tr=document.createElement('tr');[label(r.month,true),pct(r.change),r.index.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})].forEach((value,i)=>{const td=document.createElement(i?'td':'th');if(!i)td.scope='row';td.textContent=value;tr.append(td);});return tr;}));
  el('energy-table-caption').textContent=v.name+': Monatswerte und Preisänderung gegenüber 2020';
  el('history-table').hidden=false;
  el('history-status').textContent='Datenstand: '+label(data.endMonth,true)+' · Deutschland · Verbraucherpreise';
  el('energy-code').textContent=data.series[key].code+' · '+v.description;
  if(typeof Chart==='function'){
   el('history-plot').hidden=false;chart?.destroy();
   el('history-chart').setAttribute('aria-label',v.name+': Preisveränderung von '+label(v.first.month,true)+' bis '+label(v.last.month,true)+'. '+pct(v.change)+' gegenüber dem Jahresdurchschnitt 2020 am Ende. Werte auch in der Datentabelle.');
   chart=new Chart(el('history-chart'),{
    type:'line',data:{labels:v.points.map(r=>label(r.month)),datasets:[{label:v.name,data:v.points.map(r=>r.change),borderColor:'#edc96f',backgroundColor:'#e8c56d16',pointBackgroundColor:'#edc96f',pointBorderColor:'#143c30',pointBorderWidth:2,pointRadius:v.points.length>36?0:4,borderWidth:3,fill:'origin',tension:0}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>label(v.points[items[0].dataIndex].month,true),label:c=>pct(c.parsed.y)+' gegenüber dem Jahresdurchschnitt 2020'}}},scales:{x:{grid:{display:false},ticks:{color:'#d3dfd2',maxTicksLimit:4,maxRotation:0,font:{family:'Outfit',size:12}}},y:{beginAtZero:true,grid:{color:c=>c.tick.value===0?'#b8c9b7':'#4f6a5d'},ticks:{color:'#d3dfd2',callback:n=>n.toLocaleString('de-DE')+' %',font:{family:'Outfit',size:12}},title:{display:true,text:'Preisänderung gegenüber 2020',color:'#d3dfd2'}}}}
   });
  }else{el('history-method').open=true;el('history-status').textContent+=' · Werte stehen in der Tabelle bereit.';}
 }
 async function load(){
  el('history-error').hidden=true;el('history-status').textContent='Monatsdaten werden geladen …';
  try{
   const response=await fetch('/energiekosten-entwicklung/data.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Keine Daten');data=model.validate(await response.json());render();
   document.querySelectorAll('[data-months],[data-energy]').forEach(b=>b.disabled=false);
  }catch{el('history-error').hidden=false;el('history-status').textContent='Daten derzeit nicht verfügbar.';}
 }
 document.querySelectorAll('[data-energy]').forEach(b=>b.addEventListener('click',()=>{key=b.dataset.energy;document.querySelectorAll('[data-energy]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));render();}));
 document.querySelectorAll('[data-months]').forEach(b=>b.addEventListener('click',()=>{period=Number(b.dataset.months);document.querySelectorAll('[data-months]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));render();}));
 el('history-retry').addEventListener('click',load);load();
})();
