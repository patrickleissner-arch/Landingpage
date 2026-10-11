/* View only: the calculator retains its numerical model. */
(()=>{
 const today=document.getElementById('res-heute'),future=document.getElementById('res-neu');
 const bars=[document.getElementById('nu-bar-today'),document.getElementById('nu-bar-future')];
 const note=document.getElementById('nu-chart-note');
 const read=el=>{const t=el.textContent.trim();if(!/\d/.test(t))return NaN;return Number(t.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''));};
 function update(){const values=[read(today),read(future)],ready=values.every(Number.isFinite),negative=values.some(v=>v<0),max=Math.max(...values,1);bars.forEach((bar,i)=>{bar.style.height=ready&&!negative?Math.max(0,values[i]/max*100)+'%':'2px';bar.style.opacity=ready&&!negative?'1':'.35';});note.textContent=!ready?'Ergänze deine Angaben für den monatlichen Vergleich.':negative?'Die Rechnung ergibt einen monatlichen Überschuss. Die genauen Beträge stehen unten.':'Monatlicher Vergleich · einschließlich laufender Kosten und Erlöse';}
 const observer=new MutationObserver(update);[today,future].forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));update();
})();
