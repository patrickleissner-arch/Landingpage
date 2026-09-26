
// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const JAZ = {
  'vor1970':2.5,'1970-1978':2.7,'1979-1983':2.8,
  '1984-1994':2.9,'1995-2001':3.1,'2002-2015':3.3,
  'ab2016':3.7,'saniert':3.5
};

const BOILER = { '<5':0.95,'5-10':0.92,'10-15':0.90,'15-25':0.87,'>25':0.82 };

// PLZ-Präfix (2-stellig) → DIN EN 12831 Klimadaten
const PLZ_DATEN = {
  "01":{ region:"Dresden/Meißen",              normTemp:-14, vbh:1850 },
  "02":{ region:"Görlitz/Bautzen",             normTemp:-16, vbh:1950 },
  "03":{ region:"Cottbus/Lausitz",             normTemp:-14, vbh:1850 },
  "04":{ region:"Leipzig",                     normTemp:-14, vbh:1800 },
  "06":{ region:"Halle/Dessau",                normTemp:-14, vbh:1850 },
  "07":{ region:"Gera/Jena",                   normTemp:-14, vbh:1880 },
  "08":{ region:"Zwickau/Plauen",              normTemp:-16, vbh:1950 },
  "09":{ region:"Chemnitz/Erzgebirge",         normTemp:-16, vbh:1950 },
  "10":{ region:"Berlin Mitte",                normTemp:-14, vbh:1750 },
  "11":{ region:"Berlin",                      normTemp:-14, vbh:1750 },
  "12":{ region:"Berlin Süd",                  normTemp:-14, vbh:1750 },
  "13":{ region:"Berlin Nord",                 normTemp:-14, vbh:1750 },
  "14":{ region:"Potsdam/Brandenburg",         normTemp:-14, vbh:1800 },
  "15":{ region:"Frankfurt (Oder)",            normTemp:-14, vbh:1850 },
  "16":{ region:"Oranienburg/Eberswalde",      normTemp:-14, vbh:1850 },
  "17":{ region:"Neubrandenburg/Greifswald",   normTemp:-14, vbh:1900 },
  "18":{ region:"Rostock/Stralsund",           normTemp:-10, vbh:2000 },
  "19":{ region:"Schwerin/Ludwigslust",        normTemp:-10, vbh:1950 },
  "20":{ region:"Hamburg Mitte",               normTemp:-10, vbh:1900 },
  "21":{ region:"Hamburg Süd/Lüneburg",        normTemp:-10, vbh:1900 },
  "22":{ region:"Hamburg Nord/West",           normTemp:-10, vbh:1900 },
  "23":{ region:"Lübeck/Wismar",               normTemp:-10, vbh:1950 },
  "24":{ region:"Kiel/Flensburg",              normTemp:-12, vbh:2050 },
  "25":{ region:"Westküste/Sylt",              normTemp:-8,  vbh:2100 },
  "26":{ region:"Oldenburg/Emden",             normTemp:-10, vbh:1950 },
  "27":{ region:"Bremerhaven/Cuxhaven",        normTemp:-10, vbh:2000 },
  "28":{ region:"Bremen",                      normTemp:-10, vbh:1900 },
  "29":{ region:"Celle/Uelzen",                normTemp:-12, vbh:1880 },
  "30":{ region:"Hannover",                    normTemp:-12, vbh:1850 },
  "31":{ region:"Hameln/Hildesheim",           normTemp:-12, vbh:1880 },
  "32":{ region:"Herford/Minden",              normTemp:-12, vbh:1880 },
  "33":{ region:"Bielefeld/Paderborn",         normTemp:-12, vbh:1880 },
  "34":{ region:"Kassel",                      normTemp:-12, vbh:1900 },
  "35":{ region:"Gießen/Marburg",              normTemp:-12, vbh:1850 },
  "36":{ region:"Fulda/Bad Hersfeld",          normTemp:-14, vbh:1950 },
  "37":{ region:"Göttingen/Eschwege",          normTemp:-12, vbh:1900 },
  "38":{ region:"Braunschweig/Wolfsburg",      normTemp:-12, vbh:1850 },
  "39":{ region:"Magdeburg/Stendal",           normTemp:-14, vbh:1900 },
  "40":{ region:"Düsseldorf",                  normTemp:-10, vbh:1700 },
  "41":{ region:"Mönchengladbach/Neuss",       normTemp:-10, vbh:1700 },
  "42":{ region:"Wuppertal/Solingen",          normTemp:-10, vbh:1750 },
  "44":{ region:"Dortmund/Bochum",             normTemp:-12, vbh:1780 },
  "45":{ region:"Essen/Gelsenkirchen",         normTemp:-10, vbh:1750 },
  "46":{ region:"Oberhausen/Wesel",            normTemp:-10, vbh:1750 },
  "47":{ region:"Duisburg/Krefeld",            normTemp:-10, vbh:1720 },
  "48":{ region:"Münster/Coesfeld",            normTemp:-10, vbh:1780 },
  "49":{ region:"Osnabrück/Lingen",            normTemp:-10, vbh:1800 },
  "50":{ region:"Köln",                        normTemp:-10, vbh:1700 },
  "51":{ region:"Köln Ost/Leverkusen",         normTemp:-10, vbh:1700 },
  "52":{ region:"Aachen/Düren",                normTemp:-10, vbh:1750 },
  "53":{ region:"Bonn/Siegburg",               normTemp:-10, vbh:1720 },
  "54":{ region:"Trier/Bitburg",               normTemp:-12, vbh:1850 },
  "55":{ region:"Mainz/Bad Kreuznach",         normTemp:-10, vbh:1720 },
  "56":{ region:"Koblenz/Neuwied",             normTemp:-12, vbh:1780 },
  "57":{ region:"Siegen/Olpe",                 normTemp:-12, vbh:1880 },
  "58":{ region:"Hagen/Iserlohn",              normTemp:-12, vbh:1800 },
  "59":{ region:"Hamm/Arnsberg",               normTemp:-12, vbh:1820 },
  "60":{ region:"Frankfurt am Main",           normTemp:-10, vbh:1700 },
  "61":{ region:"Bad Homburg/Friedberg",       normTemp:-10, vbh:1720 },
  "63":{ region:"Aschaffenburg/Hanau",         normTemp:-10, vbh:1720 },
  "64":{ region:"Darmstadt",                   normTemp:-10, vbh:1720 },
  "65":{ region:"Wiesbaden/Limburg",           normTemp:-10, vbh:1720 },
  "66":{ region:"Saarbrücken/Homburg",         normTemp:-12, vbh:1800 },
  "67":{ region:"Ludwigshafen/Kaiserslautern", normTemp:-10, vbh:1680 },
  "68":{ region:"Mannheim",                    normTemp:-10, vbh:1680 },
  "69":{ region:"Heidelberg",                  normTemp:-10, vbh:1700 },
  "70":{ region:"Stuttgart",                   normTemp:-12, vbh:1750 },
  "71":{ region:"Stuttgart/Ludwigsburg",       normTemp:-12, vbh:1750 },
  "72":{ region:"Tübingen/Reutlingen",         normTemp:-12, vbh:1800 },
  "73":{ region:"Göppingen/Esslingen",         normTemp:-12, vbh:1780 },
  "74":{ region:"Heilbronn/Schwäbisch Hall",   normTemp:-12, vbh:1750 },
  "75":{ region:"Pforzheim/Calw",              normTemp:-12, vbh:1780 },
  "76":{ region:"Karlsruhe/Baden-Baden",       normTemp:-10, vbh:1700 },
  "77":{ region:"Offenburg/Lahr",              normTemp:-12, vbh:1750 },
  "78":{ region:"Villingen-Schwenningen",      normTemp:-14, vbh:1900 },
  "79":{ region:"Freiburg/Lörrach",            normTemp:-12, vbh:1720 },
  "80":{ region:"München",                     normTemp:-14, vbh:1850 },
  "81":{ region:"München Süd/Ost",             normTemp:-14, vbh:1850 },
  "82":{ region:"Garmisch/Starnberg",          normTemp:-16, vbh:2000 },
  "83":{ region:"Rosenheim/Traunstein",        normTemp:-14, vbh:1900 },
  "84":{ region:"Landshut/Dingolfing",         normTemp:-14, vbh:1880 },
  "85":{ region:"Ingolstadt/Freising",         normTemp:-14, vbh:1880 },
  "86":{ region:"Augsburg/Donauwörth",         normTemp:-14, vbh:1880 },
  "87":{ region:"Kempten/Allgäu",              normTemp:-18, vbh:2100 },
  "88":{ region:"Friedrichshafen/Ravensburg",  normTemp:-14, vbh:1900 },
  "89":{ region:"Ulm/Heidenheim",              normTemp:-14, vbh:1880 },
  "90":{ region:"Nürnberg/Fürth",              normTemp:-14, vbh:1880 },
  "91":{ region:"Erlangen/Ansbach",            normTemp:-14, vbh:1880 },
  "92":{ region:"Amberg/Weiden",               normTemp:-16, vbh:1950 },
  "93":{ region:"Regensburg/Cham",             normTemp:-14, vbh:1900 },
  "94":{ region:"Passau/Straubing",            normTemp:-14, vbh:1900 },
  "95":{ region:"Hof/Bayreuth",                normTemp:-18, vbh:2050 },
  "96":{ region:"Bamberg/Coburg",              normTemp:-14, vbh:1900 },
  "97":{ region:"Würzburg/Schweinfurt",        normTemp:-12, vbh:1800 },
  "98":{ region:"Suhl/Ilmenau",                normTemp:-16, vbh:2000 },
  "99":{ region:"Erfurt/Weimar",               normTemp:-14, vbh:1920 }
};
const PLZ_DEFAULT = { region:'Deutschland (Mittel)', normTemp:-12, vbh:1900 };

const EF     = { oil:0.2663, gas:0.2017 }; // kg CO₂/kWh
const EF_EL  = 0.380;                       // kg CO₂/kWh Bundesmix
const PV_EPC = 0.08;                        // €/kWh PV Gestehungskosten

// Grobe Investitionsschätzung für Amortisation/Rendite (keine Anlagenplanung)
const WP_INVEST_BASE = 9000;  // € Basiskosten Wärmepumpe inkl. Installation
const WP_INVEST_KW   = 1200;  // €/kW Leistungspreis
const PV_YIELD_KWP    = 950;   // kWh/kWp/Jahr DE-Mittel (PVGIS)
const PV_PRICE_KWP    = 1450;  // €/kWp inkl. Montage

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const S = {
  plz:'', buildingYear:'vor1970', area:150,
  fuelType:'oil', consumption:2000, heatingAge:'10-15',
  plzData:null,
  oilPrice:95, gasPrice:12, elecPrice:32, wpTarif:22, gridPrice:5,
  elecInc:6, fuelInc:4,
  co2_26:60, co2_27:70, co2Inc:15,
  useWpTarif:false, pvShare:55, years:20
};

// ─────────────────────────────────────────────
// DERIVED
// ─────────────────────────────────────────────
const boilerEff = () => BOILER[S.heatingAge] || 0.90;
const jaz = () => {
  const pd = S.plzData || PLZ_DEFAULT;
  const dJaz = (pd.normTemp + 12) * 0.1;
  return Math.max(1.5, +((JAZ[S.buildingYear]||3.0) + dJaz).toFixed(1));
};
const fuelKwh    = () => S.fuelType==='oil' ? S.consumption*10 : S.consumption;
const heatDemand = () => fuelKwh() * boilerEff();
const wpElec     = () => heatDemand() / jaz();
// Benötigte WP-Heizleistung: Jahreswärmebedarf ÷ Vollbenutzungsstunden
const wpKw = () => {
  const vbh = (S.plzData || PLZ_DEFAULT).vbh;
  return Math.round(heatDemand() / vbh * 10) / 10;
};

// ─────────────────────────────────────────────
// PRICE FUNCTIONS
// ─────────────────────────────────────────────
function co2Price(yr){
  if(yr<=2025) return 55;
  if(yr===2026) return S.co2_26;
  return S.co2_27 * Math.pow(1+S.co2Inc/100, yr-2027);
}

function co2PerKwh(yr){ return EF[S.fuelType]*co2Price(yr)/1000; }

function fuelKwhPrice(){ return S.fuelType==='oil' ? S.oilPrice/100/10 : S.gasPrice/100; }

function fuelPriceT(t){
  const base = Math.max(0.005, fuelKwhPrice()-co2PerKwh(2025));
  return base*Math.pow(1+S.fuelInc/100,t) + co2PerKwh(2025+t);
}

function wpPriceT(t){
  return ((S.useWpTarif?S.wpTarif:S.elecPrice)/100) * Math.pow(1+S.elecInc/100,t);
}

function pvPriceT(t){
  const eigen=S.pvShare/100, rest=1-eigen;
  return rest*(S.gridPrice/100)*Math.pow(1+S.elecInc/100,t) + eigen*PV_EPC;
}

function yearCosts(t){
  const fk=fuelKwh(), we=wpElec();
  return { fossil:fk*fuelPriceT(t), wp:we*wpPriceT(t), wpv:we*pvPriceT(t) };
}

function co2Fossil(){ return fuelKwh()*EF[S.fuelType]/1000; }
function co2WP()    { return wpElec()*EF_EL/1000; }
function co2WPV()   { return wpElec()*(1-S.pvShare/100)*EF_EL/1000; }

// Grobe Investitionsschätzung (keine Anlagenplanung) – Basis für Amortisation/Rendite
function investEstimate(){
  const wpInvest = WP_INVEST_BASE + wpKw()*WP_INVEST_KW;
  const impliedKwp = S.pvShare>0 ? (wpElec()*S.pvShare/100)/PV_YIELD_KWP : 0;
  const pvInvest = impliedKwp*PV_PRICE_KWP;
  return { wpInvest, pvInvest, total: wpInvest+pvInvest };
}

// Erstes Jahr, in dem die kumulierte Ersparnis die Investition ausgleicht (statische Schätzung)
function amortYears(investSum, diffArr){
  if (!(investSum>0)) return null;
  let cum=0;
  for(let t=0;t<diffArr.length;t++){
    const prev=cum; cum+=diffArr[t];
    if (cum>=investSum) return t + (investSum-prev)/diffArr[t];
  }
  return null;
}

// ─────────────────────────────────────────────
// CALCULATE
// ─────────────────────────────────────────────
let chart = null;

function calculate(){
  readState();

  const n=S.years;
  const lbls=[], dF=[], dW=[], dV=[];
  let sumF=0,sumW=0,sumV=0,co2FossilCostTot=0;

  for(let t=0;t<n;t++){
    const c=yearCosts(t);
    lbls.push(2025+t);
    dF.push(Math.round(c.fossil)); dW.push(Math.round(c.wp)); dV.push(Math.round(c.wpv));
    sumF+=c.fossil; sumW+=c.wp; sumV+=c.wpv;
    co2FossilCostTot += fuelKwh()*co2PerKwh(2025+t);
  }

  const c0=yearCosts(0);
  const sav1=c0.fossil-c0.wpv;
  const savTot=sumF-sumV;
  const effP=(pvPriceT(0)*100);
  const co2save=(co2Fossil()-co2WPV())*n;

  // Hero cards
  set('r-sav1', fmt(sav1));
  set('r-savTot', fmt(savTot));
  set('r-effP', effP.toFixed(1));
  set('r-co2sav', co2save.toFixed(0));
  set('r-yrs-lbl', n);
  set('ct-yrs', n); set('chart-yrs', n);

  // Amortisation & Rendite (grobe, sichtbar gekennzeichnete Investitionsschätzung)
  const inv = investEstimate();
  const diffWP = [], diffWPV = [];
  for (let t=0;t<n;t++){ diffWP.push(dF[t]-dW[t]); diffWPV.push(dF[t]-dV[t]); }
  const amortWP  = amortYears(inv.wpInvest, diffWP);
  const amortWPV = amortYears(inv.total, diffWPV);
  const renditeWPV = inv.total>0 ? (diffWPV[0]/inv.total*100) : 0;

  set('r-amort',  amortWPV!==null ? amortWPV.toFixed(1)+' Jahre' : '–');
  set('r-rendite', inv.total>0 ? renditeWPV.toFixed(1)+' %' : '–');
  set('cwam', amortWP!==null  ? amortWP.toFixed(1)+' Jahre'  : '–');
  set('cpam', amortWPV!==null ? amortWPV.toFixed(1)+' Jahre' : '–');
  set('invest-note', 'Angenommene Investition: ca. ' + fmt(Math.round(inv.total))
      + ' € (Wärmepumpe inkl. Installation' + (inv.pvInvest>0 ? ' + anteilige PV-Anlage bei ' + S.pvShare + '% Deckung' : '')
      + ') – grobe Schätzung, keine Anlagenplanung.');

  // Technische Auslegung
  const pd = S.plzData || PLZ_DEFAULT;
  set('t-wpkw',   wpKw().toFixed(1));
  set('t-vbh',    pd.vbh.toLocaleString('de-DE'));
  set('t-wpelec', Math.round(wpElec()).toLocaleString('de-DE'));
  set('t-jaz',    jaz().toFixed(1));

  // Table header
  set('th-fossil', S.fuelType==='oil'?'Heizöl':'Erdgas');

  const c30=yearCosts(2030-2025);
  set('cf1',  fmte(c0.fossil));   set('cw1',  fmte(c0.wp));   set('cp1',  fmte(c0.wpv));
  set('cfm',  fmte(c0.fossil/12));set('cwm',  fmte(c0.wp/12));set('cpm',  fmte(c0.wpv/12));
  set('cfsm', (c0.fossil/S.area).toFixed(1)+' €');
  set('cwsm', (c0.wp/S.area).toFixed(1)+' €');
  set('cpsm', (c0.wpv/S.area).toFixed(1)+' €');
  set('cf30', fmte(c30.fossil));  set('cw30', fmte(c30.wp));  set('cp30', fmte(c30.wpv));
  set('cftot',fmte(sumF));        set('cwtot',fmte(sumW));    set('cptot',fmte(sumV));
  set('cwsav','+'+fmt(sumF-sumW)+' €'); set('cpsav','+'+fmt(sumF-sumV)+' €');
  set('cfco2', co2Fossil().toFixed(1)+' t/a');
  set('cwco2', co2WP().toFixed(1)+' t/a');
  set('cpco2', co2WPV().toFixed(1)+' t/a');
  set('cfco2c', fmte(co2FossilCostTot));
  set('cco2p30', co2Price(2030).toFixed(0)+' €/t CO₂ im Jahr 2030');

  // Pain section
  [2025,2027,2030].forEach(yr=>{
    const t=yr-2025, c=yearCosts(t);
    const pfx='p'+String(yr).slice(-2);
    set(pfx+'-cost', fmt(c.fossil)+' €/Jahr');
    set(pfx+'-co2',  'CO₂-Preis: '+co2Price(yr).toFixed(0)+' €/t');
  });
  const base=yearCosts(0).fossil;
  set('p27-delta', '+'+fmt(yearCosts(2).fossil-base)+' € mehr als 2025');
  set('p30-delta', '+'+fmt(yearCosts(5).fossil-base)+' € mehr als 2025');

  let sumF6=0,sumV6=0;
  for(let t=0;t<=5;t++){const c=yearCosts(t);sumF6+=c.fossil;sumV6+=c.wpv;}
  set('pain-extra',   fmt(sumF6-sumV6)+' €');
  set('pain-savtot', fmt(savTot)+' € in '+n+' Jahren');

  renderChart(lbls, dF, dW, dV);

  g('results').style.display='block';
  g('results').scrollIntoView({behavior:'smooth'});
  refreshAutoParams();
}

// ─────────────────────────────────────────────
// CHART
// ─────────────────────────────────────────────
function renderChart(lbls,fossil,wp,wpv){
  if(chart) chart.destroy();
  chart = new Chart(g('myChart').getContext('2d'),{
    type:'line',
    data:{
      labels:lbls,
      datasets:[
        { label:S.fuelType==='oil'?'Heizöl':'Erdgas', data:fossil,
          borderColor:'#C0392B', backgroundColor:'rgba(192,57,43,.07)',
          borderWidth:2.5, tension:.3, pointRadius:2 },
        { label:'Wärmepumpe', data:wp,
          borderColor:'#4A7B9D', backgroundColor:'rgba(74,123,157,.07)',
          borderWidth:2.5, tension:.3, pointRadius:2 },
        { label:'WP + PV', data:wpv,
          borderColor:'#2E4F3C', backgroundColor:'rgba(46,79,60,.1)',
          borderWidth:3, tension:.3, pointRadius:2, fill:true }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{position:'top'},
        tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+fmt(ctx.parsed.y)+' €/Jahr'}}
      },
      scales:{
        y:{ticks:{callback:v=>fmt(v)+' €'},grid:{color:'rgba(0,0,0,.05)'}},
        x:{grid:{display:false}}
      }
    }
  });
}

// ─────────────────────────────────────────────
// STATE SYNC
// ─────────────────────────────────────────────
function readState(){
  S.plz         = g('plz').value.trim();
  S.buildingYear= g('buildingYear').value;
  S.area        = +g('area').value || 150;
  S.consumption = +g('consumption').value || 2000;
  S.heatingAge  = g('heatingAge').value;
  S.useWpTarif  = g('useWpTarif').checked;
  S.oilPrice    = +g('s-oilPrice').value;
  S.gasPrice    = +g('s-gasPrice').value;
  S.elecPrice   = +g('s-elecPrice').value;
  S.wpTarif     = +g('s-wpTarif').value;
  S.gridPrice   = +g('s-gridPrice').value;
  S.elecInc     = +g('s-elecInc').value;
  S.fuelInc     = +g('s-fuelInc').value;
  S.co2_26      = +g('s-co2_26').value;
  S.co2_27      = +g('s-co2_27').value;
  S.co2Inc      = +g('s-co2Inc').value;
  S.pvShare     = +g('s-pvShare').value;
  S.years       = +g('s-years').value;
  if(S.plz.length>=2){
    S.plzData = PLZ_DATEN[S.plz.slice(0,2)] || null;
  }
}

function refreshAutoParams(){
  const pd = S.plzData || PLZ_DEFAULT;
  set('ap-zone', pd.region);
  set('ap-nat',  pd.normTemp+' °C');
  set('ap-vbh',  pd.vbh+' h');
  set('ap-eff',   (boilerEff()*100).toFixed(0)+' %');
  set('ap-jaz',   jaz().toFixed(1));
  if(S.plz.length>=2 || S.consumption>0){
    set('ap-wpkw', wpKw().toFixed(1)+' kW');
  }
  if(S.plz.length>=2){
    const label = S.plzData ? pd.region : 'Unbekannte PLZ – Standardwerte';
    g('clim-display').innerHTML='<span class="clim-badge">'+label+' · JAZ ≈ '+jaz().toFixed(1)+'</span>';
  }
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────
const g   = id => document.getElementById(id);
const set = (id,v) => { const el=g(id); if(el) el.textContent=v; };
const fmt = n => Math.round(n).toLocaleString('de-DE');
const fmte= n => fmt(n)+' €';

function setFuel(t){
  S.fuelType=t;
  g('btn-oil').classList.toggle('active',t==='oil');
  g('btn-gas').classList.toggle('active',t==='gas');
  g('lbl-consumption').textContent  = t==='oil'?'Jahresverbrauch (Liter)':'Jahresverbrauch (kWh)';
  g('hint-consumption').textContent = t==='oil'?'Liter Heizöl pro Jahr (Tankrechnung)':'kWh Erdgas pro Jahr (Jahresabrechnung)';
  g('th-fossil').textContent = t==='oil'?'Heizöl':'Erdgas';
  liveUpdate();
}

function toggleExpert(){
  const b=g('accord-body'), i=g('accord-ico');
  const wasOpen=b.classList.contains('open');
  b.classList.toggle('open',!wasOpen);
  i.classList.toggle('open',!wasOpen);
  if(!wasOpen) liveUpdate();
}

// Zentraler Update-Handler: DOM → S → Panel → ggf. Ergebnisse
function liveUpdate(){
  readState();
  refreshAutoParams();
  if(g('results').style.display!=='none') calculate();
}

// ─────────────────────────────────────────────
// SLIDER INIT
// ─────────────────────────────────────────────
const SLIDER_CFG = {
  'oilPrice':  { unit:' ct',   dec:0 },
  'gasPrice':  { unit:' ct',   dec:1 },
  'elecPrice': { unit:' ct',   dec:0 },
  'wpTarif':   { unit:' ct',   dec:0 },
  'gridPrice': { unit:' ct',   dec:0 },
  'elecInc':   { unit:' %',    dec:1 },
  'fuelInc':   { unit:' %',    dec:1 },
  'co2_26':    { unit:' €/t',  dec:0 },
  'co2_27':    { unit:' €/t',  dec:0 },
  'co2Inc':    { unit:' %',    dec:0 },
  'pvShare':   { unit:' %',    dec:0 },
  'years':     { unit:' J',    dec:0 }
};

function initSliders(){
  Object.entries(SLIDER_CFG).forEach(([k,c])=>{
    const el=g('s-'+k), vEl=g('v-'+k);
    if(!el) return;
    el.addEventListener('input',()=>{
      const v=parseFloat(el.value);
      vEl.textContent = new Intl.NumberFormat('de-DE',{minimumFractionDigits:c.dec,maximumFractionDigits:c.dec}).format(v)+c.unit;
      if(k==='pvShare') updatePvHint(v);
      liveUpdate();
    });
  });
}

function updatePvHint(v){
  const map=[[0,'Kein PV (WP allein)'],[25,'Kleine PV-Anlage'],[55,'PV-Anlage + Speicher'],[85,'PV + Großspeicher']];
  const [,lbl]=map.reduce((a,b)=>Math.abs(b[0]-v)<Math.abs(a[0]-v)?b:a);
  g('hint-pv').textContent='≈ '+lbl;
}

// PLZ – Ziffernfilter, dann liveUpdate (refreshAutoParams übernimmt Badge)
g('plz').addEventListener('input',()=>{
  const p=g('plz').value.replace(/\D/g,'').slice(0,5);
  g('plz').value=p;
  liveUpdate();
});

// Alle übrigen Felder
['buildingYear','heatingAge'].forEach(id=>{
  g(id).addEventListener('change', liveUpdate);
});
['area','consumption'].forEach(id=>{
  g(id).addEventListener('input', liveUpdate);
});
g('useWpTarif').addEventListener('change', liveUpdate);

initSliders();
