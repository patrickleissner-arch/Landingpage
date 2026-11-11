/* KfW 458/459, rental/basic funding. Verified 2026-11-09 against KfW product pages and 09/2026 leaflets. */
(function(root){'use strict';
 const RULES={checked:'2026-11-09',rate:.30,first:28000,next:15000,further:8000,reduction:750};
 function period(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;const [y,m,d]=date.split('-').map(Number),v=new Date(Date.UTC(y,m-1,d));if(v.getUTCFullYear()!==y||v.getUTCMonth()!==m-1||v.getUTCDate()!==d)return null;if(date<'2026-09-24'||date>'2028-12-31')return null;return date<'2027-02-01'?0:(y-2027)*2+(m>=8?2:m>=2?1:0);}
 function calculate(x){const errors=[],blocks=[],pending=[];const p=period(x.date),n=Number(x.units),a=Number(x.affected),cost=Number(x.cost),vat=Number(x.vat);const program=x.owner==='company'?'459':'458';
 if(!['private','company','weg'].includes(x.owner))errors.push('Bitte die Eigentümerform auswählen.');
 if(p===null)errors.push('Bitte ein gültiges Antragsdatum zwischen 24.09.2026 und 31.12.2028 wählen.');
 if(!Number.isInteger(n)||n<1||n>10000)errors.push('Bitte die Gesamtzahl der Wohneinheiten als ganze Zahl ab 1 eingeben.');
 if(!Number.isInteger(a)||a<1||a>n)errors.push('Die betroffenen Wohneinheiten müssen zwischen 1 und der Gesamtzahl liegen.');
 if(x.cost===''||!Number.isFinite(cost)||cost<0||cost>1e9)errors.push('Bitte die voraussichtlich förderfähigen Projektkosten eingeben.');
 if(!Number.isFinite(vat)||vat<0||vat>cost)errors.push('Die abziehbare Vorsteuer muss zwischen 0 € und den Bruttokosten liegen.');
 if(x.cost!==''&&Number.isFinite(cost)&&cost<300)blocks.push('Die Mindestinvestition von 300 € brutto wird nicht erreicht.');
 for(const [key,no,unknown] of [['building','Das Wohngebäude in Deutschland erfüllt die Bestandsvoraussetzung nicht.','Gebäudestandort und mindestens fünf Jahre seit Bauantrag/Bauanzeige prüfen.'],['technical','Die technischen Förderanforderungen sind laut Angabe nicht erfüllt.','Technische Förderfähigkeit einschließlich Optimierung des Heizsystems fachlich bestätigen lassen.'],['before','Bei bereits begonnenen Vorhaben ist eine individuelle Prüfung erforderlich.','Antragstellung vor Vorhabenbeginn sicherstellen.']]){if(x[key]==='no')blocks.push(no);else if(x[key]!=='yes')pending.push(unknown);}
 if(x.network==='yes'&&x.technology!=='network')blocks.push('Bei einer verbindlichen kommunalen Entscheidung zum Wärmenetzanschluss wird hier nur der Wärmenetzanschluss berücksichtigt.');else if(x.network==='unknown')pending.push('Eine mögliche verbindliche kommunale Anschlussentscheidung prüfen.');
 if(x.previous==='yes')blocks.push('Bereits genutztes Förderbudget muss vor einer weiteren Berechnung individuell abgegrenzt werden.');else if(x.previous!=='no')pending.push('Prüfen, ob das Förderbudget bereits durch andere Anträge beansprucht wird.');
 if(!['pump','network','buildingnetwork','biomass','solar','fuelcell'].includes(x.technology))errors.push('Bitte eine unterstützte Maßnahme auswählen.');
 if(errors.length||blocks.length)return {program,errors,blocks,pending,grant:null};
 const first=RULES.first-p*RULES.reduction,totalCap=first+Math.min(n-1,5)*RULES.next+Math.max(n-6,0)*RULES.further,cap=totalCap*a/n,net=cost-vat,eligible=Math.min(net,cap),grant=Math.round(eligible*RULES.rate*100)/100;
 return {program,errors,blocks,pending,first,totalCap,cap,net,eligible,grant,period:p,rate:RULES.rate};
 }
 function classify(property,scope,apartment){if(property==='private'||property==='company')return property;if(property==='community'&&scope==='shared')return 'weg';if(property==='community'&&scope==='individual'&&['private','company'].includes(apartment))return apartment;return ''; }
 function countdown(now=Date.now()){
  const time=Number(now);if(!Number.isFinite(time))return null;
  for(let year=2027;year<=2028;year++)for(const month of ['02','08']){
   const date=year+'-'+month+'-01',target=Date.parse(date+'T00:00:00'+(month==='02'?'+01:00':'+02:00'));
   if(target>time){const minutes=Math.floor((target-time)/60000),p=period(date);return {date,target,days:Math.floor(minutes/1440),hours:Math.floor(minutes/60)%24,minutes:minutes%60,before:RULES.first-(p-1)*RULES.reduction,after:RULES.first-p*RULES.reduction};}
  }return null;
 }
 const api={RULES,period,calculate,classify,countdown};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RentalFunding=api;
})(typeof window!=='undefined'?window:globalThis);
