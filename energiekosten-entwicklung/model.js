(function(root){
 'use strict';
 const keys=['electricity','oil','gas','lpg'];
 function validate(data){
  if(data?.unit!=='index'||data.baseYear!==2020||!/^\d{4}-\d{2}$/.test(data.endMonth))throw Error('Ungültige Datenbasis');
  for(const key of keys){
   const rows=data.series?.[key]?.months;
   if(!Array.isArray(rows)||rows.length<13)throw Error('Unvollständige Preisreihe');
   let previous;
   for(const row of rows){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month)||!Number.isFinite(row.index)||row.index<=0)throw Error('Ungültiger Monatswert');
    const [y,m]=row.month.split('-').map(Number),ordinal=y*12+m;
    if(previous!==undefined&&ordinal!==previous+1)throw Error('Lücke in Preisreihe');previous=ordinal;
   }
   if(rows.at(-1).month!==data.endMonth)throw Error('Abweichender Datenstand');
  }return data;
 }
 function view(data,key,period){
  if(!keys.includes(key)||![12,36,0].includes(period))throw Error('Ungültige Auswahl');
  const source=data.series[key],rows=period?source.months.slice(-period):source.months,base=100;
  const points=rows.map(r=>({...r,change:(r.index/base-1)*100}));
  const last=points.at(-1),prev=points.at(-2),peak=points.reduce((a,b)=>b.index>a.index?b:a);
  return {name:source.name,description:source.description,points,first:points[0],last,peak,change:last.change,monthChange:(last.index/prev.index-1)*100};
 }
 const api={validate,view};if(typeof module!=='undefined')module.exports=api;else root.EnergyHistory=api;
})(globalThis);
