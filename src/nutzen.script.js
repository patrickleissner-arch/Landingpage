/* Zahlenanzeige über Intl statt fest verdrahteter Dezimalkomma-Ersetzung */
var __nfMax1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
var __nfFix1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ============================================================
//  ENERGIERECHNER V9 — Wizard-Edition
//  Patrick Leißner · patrickleissner.de
// ============================================================

// === PLZ → KLIMAREGION nach DIN EN 12831 ===
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
    "90":{ region:"Nürnberg/Fürth",             normTemp:-14, vbh:1880 },
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

// === PLZ → PV-ERTRAG (kWh/kWp·a, optimal ausgerichtet, Süd-Gradient nach PVGIS/DWD) ===
// Wird per Merge an PLZ_DATEN[prefix].pvY gehängt; unbekannte PLZ nutzen BASE_YIELD (950) als Fallback.
const PLZ_PVY = {
    "01":980,"02":985,"03":985,"04":975,"06":975,"07":970,"08":970,"09":965,
    "10":985,"11":985,"12":985,"13":985,"14":985,"15":980,"16":975,
    "17":950,"18":955,"19":950,
    "20":945,"21":945,"22":945,"23":945,"24":950,"25":955,"26":940,"27":940,"28":940,"29":950,
    "30":955,"31":955,"32":950,"33":955,"34":960,"35":965,"36":965,"37":955,"38":955,"39":965,
    "40":965,"41":965,"42":960,"44":960,"45":960,"46":960,"47":965,"48":960,"49":955,
    "50":975,"51":975,"52":970,"53":980,"54":985,"55":1010,"56":985,"57":960,"58":960,"59":960,
    "60":1015,"61":1010,"63":1015,"64":1020,"65":1015,"66":1010,"67":1030,"68":1035,"69":1030,
    "70":1030,"71":1030,"72":1035,"73":1035,"74":1030,"75":1030,"76":1040,"77":1050,"78":1060,"79":1080,
    "80":1080,"81":1080,"82":1100,"83":1090,"84":1075,"85":1070,"86":1080,"87":1100,"88":1090,"89":1070,
    "90":1040,"91":1035,"92":1030,"93":1040,"94":1050,"95":1010,"96":1030,"97":1030,"98":980,"99":985
};
Object.keys(PLZ_PVY).forEach(k => { if (PLZ_DATEN[k]) PLZ_DATEN[k].pvY = PLZ_PVY[k]; });

// === BAUJAHR → KENNWERTE ===
const BAUJAHR_DATEN = {
    "vor_1960":  { heizlastM2:150, jaz:3.5, label:"Altbau vor 1960" },
    "1960_1979": { heizlastM2:120, jaz:3.6, label:"1960–1979" },
    "1980_1994": { heizlastM2:90,  jaz:3.8, label:"1980–1994" },
    "1995_2009": { heizlastM2:55,  jaz:4.0, label:"1995–2009" },
    "ab_2010":   { heizlastM2:35,  jaz:4.3, label:"ab 2010" }
};

// === HEIZUNGSALTER → KESSELWIRKUNGSGRAD ===
const HEIZUNG_ETA = {
    "sehr_alt":0.70, "alt":0.80, "mittel":0.85, "neu":0.90, "brennwert":0.95
};

// === BRENNSTOFF-KONFIGURATION ===
const FUEL = {
    oil:        { kwhPU:10,  ef:0.266, unit:"Liter", hint:"Steht auf deiner Heizöl-Tankrechnung",        dflt:2500,  ppu:0.95,  dispUnit:"€/Liter", dispDflt:"0.95", dispDiv:1   },
    gas:        { kwhPU:1,   ef:0.201, unit:"kWh",   hint:"Steht auf deiner Gas-Jahresabrechnung",       dflt:25000, ppu:0.12,  dispUnit:"ct/kWh",  dispDflt:"12",   dispDiv:100 },
    pellets:    { kwhPU:4.8, ef:0.025, unit:"kg",    hint:"Jahresverbrauch laut Lieferschein",           dflt:5000,  ppu:0.065, dispUnit:"ct/kg",   dispDflt:"6.5",  dispDiv:100 },
    fernwaerme: { kwhPU:1,   ef:0.08,  unit:"kWh",   hint:"Steht auf deiner Fernwärme-Jahresrechnung",  dflt:20000, ppu:0.13,  dispUnit:"ct/kWh",  dispDflt:"13",   dispDiv:100 },
    strom:      { kwhPU:1,   ef:0.39,  unit:"kWh",   hint:"Jahresverbrauch Heizstrom lt. Stromrechnung",dflt:8000,  ppu:0.32,  dispUnit:null,      dispDflt:null,   dispDiv:1   }
};

// === BERECHUNGS-KONSTANTEN ===
const ORIENT_LABEL = { S:'Süd', SW:'Südwest', SO:'Südost', W:'West', O:'Ost', N:'Nord', NW:'Nordwest', NO:'Nordost' };
const SHADE  = { keine:1.00, gering:0.92, stark:0.78 };
// Ertrag relativ zur Süd-Optimallage – Neigung × Himmelsrichtung KOMBINIERT (PVGIS-Näherung, Annahme).
// Flachdach ist fast ausrichtungsunabhängig; Ost/West verliert mit zunehmender Steilheit; Nord steil bricht ein.
const TILT_ORIENT = {
    S:  { flach:0.93, mittel:1.00, steil:0.96, vertikal:0.71 },
    SO: { flach:0.92, mittel:0.96, steil:0.92, vertikal:0.66 },
    SW: { flach:0.92, mittel:0.96, steil:0.92, vertikal:0.66 },
    O:  { flach:0.89, mittel:0.83, steil:0.76, vertikal:0.55 },
    W:  { flach:0.89, mittel:0.83, steil:0.76, vertikal:0.55 },
    NO: { flach:0.85, mittel:0.72, steil:0.60, vertikal:0.42 },
    NW: { flach:0.85, mittel:0.72, steil:0.60, vertikal:0.42 },
    N:  { flach:0.82, mittel:0.62, steil:0.48, vertikal:0.32 }
};
function tiltOrientFactor(o, t) { const r = TILT_ORIENT[o] || TILT_ORIENT.S; return r[t] != null ? r[t] : (r.mittel || 1); }
const BASE_YIELD    = 950;   // kWh/kWp/Jahr DE-Mittel (PVGIS)
const CO2_2025      = 55;    // €/t (BEHG)
const CO2_2027      = 70;    // €/t (ETS II Start)
const CO2_INC       = 0.15;  // CO₂-Preissteigerung p.a. ab 2027
const CO2_MAX       = 300;   // €/t Deckel (konservativ; im Bereich der 2035-Prognosen, keine Zusage)
const YEARS         = 20;
// Strom-/Brennstoffpreisanstieg kommen jetzt live vom Slider (W.priceInc); Eigenverbrauch dynamisch (scq);
// Einspeisevergütung größenabhängig (feedTarif); Zins/Laufzeit vom Slider — daher keine festen Konstanten mehr dafür.

// === EINSPEISUNG / EMS (Solarspitzengesetz / §14a EnWG, Annahmen) ===
const MODUL3_DIFF_KWH     = 0.06;   // €/kWh Ø-Differenz Standard- vs. Niedertarif §14a Modul 3 (netze-bw/spotmyenergy 2025)

// === SEKTOREN (kWh/Jahr je Zusatzverbraucher) ===
const EV_KWH          = 3000;   // kWh/Jahr E-Auto Standard (~15.000 km)
const EV_KWH_PER_KM   = 0.20;   // kWh/km
const KLIMA_KWH       = 1500;   // kWh/Jahr Klimaanlage/Split (Heizen + Kühlen)
const DLE_KWH         = 1800;   // kWh/Jahr Durchlauferhitzer (Warmwasser elektrisch)
const EHEIZ_KWH       = 3000;   // kWh/Jahr Infrarot-/Nachtspeicher-Zusatzheizung

// === DACHFLÄCHEN ===
const SURFACE_LABELS = [
    'Hauptdach','Dachseite Süd','Dachseite Nord','Dachseite Ost','Dachseite West',
    'Garage / Carport','Fassade Süd','Fassade Ost','Fassade West','Sonstige Fläche'
];
const ORIENT_OPTS = ['O','SO','S','SW','W','N'];
const TILT_OPTS   = [['flach','≤ 15°'],['mittel','20–35°'],['steil','≥ 40°'],['vertikal','Fassade']];
const SHADE_OPTS  = ['keine','gering','stark'];

function renderSurfaces() {
    const c = $('surfaces-container');
    c.innerHTML = '';
    W.surfaces.forEach((s, idx) => {
        const canDel = W.surfaces.length > 1;
        const el = document.createElement('div');
        el.className = 'roof-surface';
        el.innerHTML = `
<div class="roof-surface-header">
  <select class="er-select surface-label-sel" data-surf-label="${idx}" name="surface-label-${idx}" aria-label="Bezeichnung der Dachfläche" autocomplete="off">
    ${SURFACE_LABELS.map(l => `<option value="${l}"${l===s.label?' selected':''}>${l}</option>`).join('')}
  </select>
  ${canDel ? `<button type="button" class="surface-delete" data-surf-del="${idx}" aria-label="Fläche entfernen">×</button>` : ''}
</div>
<div class="field-group">
  <label class="field-label">Anzahl Module</label>
  <div class="input-row">
    <input type="number" class="er-input" data-surf-modules="${idx}" name="modules-${idx}" aria-label="Anzahl Module" autocomplete="off"
           value="${s.modules||''}" placeholder="z. B. 18…" min="1" max="60" inputmode="numeric">
    <span class="input-unit">Module</span>
  </div>
</div>
<div class="field-group">
  <label class="field-label">Modulleistung</label>
  <div class="input-row">
    <input type="number" class="er-input" data-surf-wp="${idx}" name="module-power-${idx}" aria-label="Modulleistung in Wp" autocomplete="off"
           value="${s.modulePower||''}" placeholder="z. B. 440…" min="250" max="700" step="5" inputmode="numeric">
    <span class="input-unit">Wp</span>
  </div>
</div>
<div class="field-group">
  <span class="field-label">Ausrichtung</span>
  <div class="card-grid cols-3">
    ${ORIENT_OPTS.map(v =>
      `<button type="button" class="card-btn${v===s.orientation?' selected':''}" data-surf-idx="${idx}" data-surf-prop="orientation" data-surf-val="${v}">${v}</button>`
    ).join('')}
  </div>
</div>
<div class="field-group">
  <span class="field-label">Neigung</span>
  <div class="card-grid cols-2">
    ${TILT_OPTS.map(([v,sub]) =>
      `<button type="button" class="card-btn${v===s.tilt?' selected':''}" data-surf-idx="${idx}" data-surf-prop="tilt" data-surf-val="${v}">${v}<span class="btn-sub">${sub}</span></button>`
    ).join('')}
  </div>
</div>
<div class="field-group">
  <span class="field-label">Verschattung</span>
  <div class="card-grid cols-3">
    ${SHADE_OPTS.map(v =>
      `<button type="button" class="card-btn${v===s.shading?' selected':''}" data-surf-idx="${idx}" data-surf-prop="shading" data-surf-val="${v}">${v}</button>`
    ).join('')}
  </div>
</div>`;
        c.appendChild(el);
    });
}

function addSurface() {
    W.surfaces.push({ label:'Weitere Fläche', modules:0, modulePower:440, orientation:'S', tilt:'mittel', shading:'keine' });
    renderSurfaces();
}

function removeSurface(idx) {
    if (W.surfaces.length <= 1) return;
    W.surfaces.splice(idx, 1);
    renderSurfaces();
}

// === STATE (Cockpit – kein Step-Gating mehr) ===
const W = {
    gebaeude:"efh", baujahr:"", area:0, plz:"", plzData:null,
    fuelType:"oil", fuelPrice:null, consumption:0, heizAlter:"alt", heizAbschlag:null,
    elecMode:"kwh", elecKwh:0, elecPrice:0.32,
    surfaces:[{ label:'Hauptdach', modules:0, modulePower:440, orientation:'S', tilt:'mittel', shading:'keine' }],
    interesse:["pv","wp"], sektorenIst:[], sektorenNeu:[], evKm:0, battKwh:0,
    ems:"ja", finanzierung:"finanz",
    zinssatz:3.5, laufzeit:20, sondertilgung:0, zinsfreiJahr1:'nein', kreditbetrag:0,
    priceInc:6
};

const $ = id => document.getElementById(id);
let chartData = null;      // { fossil, neu } – für Redraw bei Resize (eigener Canvas-Renderer)
let chartPrintMode = false; // im Druck: gestrichelte Fossil-Linie, kräftigeres Raster, keine Flächen
let chartResizeTimer = null;

// === CARD BUTTONS ===
document.addEventListener('DOMContentLoaded', () => {
    // Single-select
    document.querySelectorAll('.card-btn:not(.multi)').forEach(btn => {
        btn.addEventListener('click', () => {
            const g = btn.dataset.group;
            document.querySelectorAll(`.card-btn[data-group="${g}"]:not(.multi)`)
                    .forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            W[g] = btn.dataset.value;
            if (g === 'fuelType') updateFuelUI();
            if (g === 'finanzierung') updateFinanzUI();
            recalc();
        });
        btn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        });
    });
    // Multi-select (interesse, sektoren)
    document.querySelectorAll('.card-btn.multi').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const g = btn.dataset.group, v = btn.dataset.value;
            if (!Array.isArray(W[g])) W[g] = [];
            if (btn.classList.contains('selected')) { if (!W[g].includes(v)) W[g].push(v); }
            else { W[g] = W[g].filter(x => x !== v); }
            if (g === 'interesse') updateBatteryUI();
            if (g === 'sektorenNeu') updateEvUI();
            recalc();
        });
        btn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        });
    });

    // PLZ live lookup (+ regionaler PV-Ertrag)
    $('inp-plz').addEventListener('input', e => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 5);
        e.target.value = raw;
        W.plz = raw;
        const fb = $('plz-feedback');
        if (raw.length === 5) {
            const d = PLZ_DATEN[raw.substring(0, 2)];
            if (d) {
                fb.textContent = '✓ ' + d.region + ' · ≈ ' + (d.pvY || BASE_YIELD) + ' kWh/kWp';
                fb.className = 'plz-feedback found';
                W.plzData = d;
            } else {
                fb.textContent = 'PLZ nicht bekannt – Standardwerte werden verwendet';
                fb.className = 'plz-feedback error';
                W.plzData = null;
            }
        } else {
            fb.textContent = ' ';
            fb.className = 'plz-feedback';
            W.plzData = null;
        }
        recalc();
    });

    // Finanzierungs-Slider (Zins / Laufzeit) im Ergebnis-Hero
    $('sld-zins').addEventListener('input', e => {
        W.zinssatz = Math.max(0, Math.min(8, parseFloat(e.target.value) || 0));
        updateSliderLabels();
        recalc();
    });
    $('sld-laufzeit').addEventListener('input', e => {
        W.laufzeit = parseInt(e.target.value) || 20;
        updateSliderLabels();
        recalc();
    });
    // Energiepreis-Steigerung (am 20-Jahres-Chart)
    $('sld-preis').addEventListener('input', e => {
        W.priceInc = Math.max(0, Math.min(12, parseFloat(e.target.value) || 0));
        updateSliderLabels();
        recalc();
    });

    // Alle übrigen Eingaben/Selects im Cockpit → Live-Neuberechnung
    const inputs = $('cockpit-inputs');
    inputs.addEventListener('input', recalc);
    inputs.addEventListener('change', recalc);

    // Dachflächen: Event-Delegation
    const sc = $('surfaces-container');
    sc.addEventListener('click', e => {
        const del = e.target.closest('[data-surf-del]');
        if (del) { removeSurface(parseInt(del.dataset.surfDel)); recalc(); return; }
        const btn = e.target.closest('[data-surf-prop]');
        if (!btn) return;
        const idx  = parseInt(btn.dataset.surfIdx);
        const prop = btn.dataset.surfProp;
        const val  = btn.dataset.surfVal;
        btn.closest('.card-grid').querySelectorAll('.card-btn')
           .forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        W.surfaces[idx][prop] = val;
        recalc();
    });
    sc.addEventListener('input', e => {
        const mod = e.target.closest('[data-surf-modules]');
        if (mod) { W.surfaces[parseInt(mod.dataset.surfModules)].modules = parseInt(mod.value) || 0; recalc(); return; }
        const wp = e.target.closest('[data-surf-wp]');
        if (wp) { W.surfaces[parseInt(wp.dataset.surfWp)].modulePower = parseFloat(wp.value) || 0; recalc(); return; }
    });
    sc.addEventListener('change', e => {
        const sel = e.target.closest('[data-surf-label]');
        if (!sel) return;
        W.surfaces[parseInt(sel.dataset.surfLabel)].label = sel.value;
    });
    $('btn-add-surface').addEventListener('click', () => { addSurface(); recalc(); });

    // Mobiles Ergebnis-Dock über der virtuellen Tastatur halten (iOS)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const dock = $('ergebnis-dock');
            if (!dock) return;
            const off = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
            dock.style.transform = off > 60 ? `translateY(-${off}px)` : '';
        });
    }

    // Initiales Render & Erstberechnung
    renderSurfaces();
    updateFuelUI();
    updateFinanzUI();
    updateBatteryUI();
    updateEvUI();
    updateSliderLabels();
    recalc();
});

// === FUEL UI ===
function updateFuelUI() {
    const cfg = FUEL[W.fuelType];
    $('consumption-unit').textContent = cfg.unit;
    $('consumption-hint').textContent = cfg.hint;
    $('inp-consumption').placeholder = 'z. B. ' + new Intl.NumberFormat('de-DE').format(cfg.dflt) + '…';
    // Elektroheizung: klarstellen, dass der Heizstrom oben bei der Heizung steht (kein Doppelzählen)
    const elecNote = $('elec-kwh-note');
    if (elecNote) elecNote.textContent = W.fuelType === 'strom'
        ? 'Nur Haushaltsstrom OHNE Heizstrom. Den Heizstrom trägst du oben bei „Aktuelle Heizung" ein, sonst zählt er doppelt.'
        : '';
    const grp = $('grp-fuelprice');
    if (cfg.dispUnit) {
        grp.style.display = '';
        $('fuelprice-unit').textContent = cfg.dispUnit;
        $('inp-fuelprice').placeholder = 'z. B. ' + new Intl.NumberFormat('de-DE').format(+cfg.dispDflt) + '…';
        $('inp-fuelprice').value = '';
        W.fuelPrice = null;
    } else {
        grp.style.display = 'none';
        W.fuelPrice = null;
    }
}

// === FINANZIERUNG UI ===
function updateFinanzUI() {
    const on = W.finanzierung === 'finanz';
    $('grp-finanzierung-detail').style.display = on ? '' : 'none';
    const sl = $('fin-sliders');
    if (sl) sl.style.display = on ? '' : 'none';
}

// === STROM-MODUS ===
function setElecMode(mode) {
    W.elecMode = mode;
    $('tog-kwh').classList.toggle('active', mode === 'kwh');
    $('tog-abschlag').classList.toggle('active', mode === 'abschlag');
    $('grp-kwh').style.display      = mode === 'kwh'      ? '' : 'none';
    $('grp-abschlag').style.display = mode === 'abschlag' ? '' : 'none';
    recalc();
}

// === SPEICHER-/SEKTOR-UI ===
function updateBatteryUI() {
    const on = Array.isArray(W.interesse) && W.interesse.includes('speicher');
    $('grp-batt').style.display = on ? '' : 'none';
}
function updateEvUI() {
    const on = Array.isArray(W.sektorenNeu) && W.sektorenNeu.includes('eauto');
    $('grp-ev-km').style.display = on ? '' : 'none';
}
function updateSliderLabels() {
    $('val-zins').textContent = W.zinssatz.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' % p. a.';
    $('val-laufzeit').textContent = W.laufzeit + ' Jahre';
    const vp = $('val-preis');
    if (vp) vp.textContent = W.priceInc.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' % / Jahr';
}

// Zum vollständigen Ergebnis scrollen (mobiles Dock)
function scrollToResult() {
    const el = $('result-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === EINGABEN LESEN (ein Durchlauf DOM → W) ===
function readInputs() {
    W.baujahr     = $('inp-baujahr').value;
    W.area        = parseFloat($('inp-area').value) || 0;
    W.plz         = $('inp-plz').value;
    if (W.plz && W.plz.length >= 2) W.plzData = PLZ_DATEN[W.plz.substring(0, 2)] || null;
    W.consumption = parseFloat($('inp-consumption').value) || 0;
    W.heizAlter   = $('inp-heizalter').value || 'alt';
    const hab = $('inp-heizabschlag').value;
    W.heizAbschlag = hab ? parseFloat(hab) : null;
    const fp = parseFloat($('inp-fuelprice').value);
    W.fuelPrice = (isNaN(fp) || fp <= 0) ? null : fp;
    W.elecPrice = (parseFloat($('inp-elecprice').value) || 32) / 100;
    if (W.elecMode === 'kwh') {
        W.elecKwh = parseFloat($('inp-elec-kwh').value) || 0;
    } else {
        const ab = parseFloat($('inp-elec-abschlag').value) || 0;
        W.elecKwh = W.elecPrice > 0 ? (ab * 12) / W.elecPrice : 0;
    }
    W.evKm          = Math.max(0, parseFloat($('inp-ev-km').value) || 0);
    W.battKwh       = Math.max(0, parseFloat($('inp-batt').value) || 0);
    W.kreditbetrag  = Math.max(0, parseFloat($('inp-kreditbetrag').value) || 0);
    W.sondertilgung = Math.max(0, parseFloat($('inp-sondertilgung').value) || 0);
    W.zinssatz      = Math.max(0, parseFloat($('sld-zins').value) || 0);
    W.laufzeit      = parseInt($('sld-laufzeit').value) || 20;
    W.priceInc      = Math.max(0, parseFloat($('sld-preis').value) || 0);
}

// === LIVE-NEUBERECHNUNG (debounced) ===
let recalcTimer = null, chartTimer = null;
function recalc() { clearTimeout(recalcTimer); recalcTimer = setTimeout(runModel, 120); }
function runModel() {
    readInputs();
    updateStromAbschlag();
    const m = computeModel();
    renderResults(m);
    scheduleChart(m);
}

// Live berechneter Stromabschlag / implizite kWh (Brücke zum Kundenbeleg)
function updateStromAbschlag() {
    const el = $('elec-abschlag-calc');
    if (!el) return;
    const price = W.elecPrice > 0 ? W.elecPrice : 0.32;
    if (W.elecMode === 'kwh') {
        if (W.elecKwh > 0) {
            el.textContent = 'Das entspricht ≈ ' + fmt(W.elecKwh * price / 12) + ' €/Monat Stromabschlag (Plausibilitätscheck zum Beleg).';
            el.classList.add('show');
        } else { el.textContent = ''; el.classList.remove('show'); }
    } else {
        if (W.elecKwh > 0) {
            el.textContent = 'Das entspricht ≈ ' + fmt(W.elecKwh) + ' kWh/Jahr bei ' + Math.round(price * 100) + ' ct/kWh.';
            el.classList.add('show');
        } else { el.textContent = ''; el.classList.remove('show'); }
    }
}
function scheduleChart(m) {
    clearTimeout(chartTimer);
    const card = $('chart-card');
    if (card) card.style.display = m.ready ? '' : 'none'; // synchron: kein sichtbarer leerer Kasten bei unvollständigen Eingaben
    if (!m.ready) { chartData = null; return; }
    chartTimer = setTimeout(() => {
        // Karte ist zum Zeichenzeitpunkt bereits sichtbar (Container hat Höhe) → korrekte Größe
        drawCostChart(m.fossilCum, m.neuCum); // schon vor Preiseingabe (ohne Rate) → Regler sichtbar wirksam
    }, 300);
}

// === ANNUITÄT (monatliche Compoundierung / Zinseszins) ===
function calcMonthlyRate(K, zinssatz, laufzeit, sondertilgung, zinsfreiJahr1) {
    const net = Math.max(0, K - (sondertilgung || 0));
    if (net <= 0) return 0;
    const rm = (zinssatz / 100) / 12;
    const nm = laufzeit * 12;
    if (zinsfreiJahr1 === 'ja' && rm > 0) {
        const tilgM1     = net / nm;
        const restNach12 = net - 12 * tilgM1;
        const nm2 = nm - 12;
        const rate2 = nm2 > 0
            ? restNach12 * (rm * Math.pow(1+rm, nm2)) / (Math.pow(1+rm, nm2) - 1)
            : 0;
        return (tilgM1 * 12 + rate2 * nm2) / nm;
    } else if (rm === 0) {
        return net / nm;
    } else {
        return net * (rm * Math.pow(1+rm, nm)) / (Math.pow(1+rm, nm) - 1);
    }
}

function calcZinsfreiRates(K, zinssatz, laufzeit, sondertilgung) {
    const net = Math.max(0, K - (sondertilgung || 0));
    if (net <= 0) return null;
    const rm  = (zinssatz / 100) / 12;
    const nm  = laufzeit * 12;
    const nm2 = nm - 12;
    const tilgM1 = net / nm;
    const rest   = net - 12 * tilgM1;
    const rate2  = nm2 > 0
        ? rest * (rm * Math.pow(1+rm, nm2)) / (Math.pow(1+rm, nm2) - 1)
        : 0;
    return { rate1: tilgM1, rate2 };
}

// === MODELL (reine Berechnung, kein DOM) ===
function computeModel() {
    const bj  = BAUJAHR_DATEN[W.baujahr] || BAUJAHR_DATEN['1980_1994'];
    const eta = HEIZUNG_ETA[W.heizAlter] || 0.82;
    const fc  = FUEL[W.fuelType] || FUEL.oil;
    const plz = W.plzData || { region:'Deutschland', vbh:1800, pvY:BASE_YIELD };
    const baseYield = plz.pvY || BASE_YIELD;

    const missing = [];
    if (!(W.area > 0))        missing.push('Wohnfläche');
    if (!(W.consumption > 0)) missing.push('Heizverbrauch');
    if (!W.surfaces.some(s => s.modules > 0)) missing.push('Anzahl Module (Dachfläche)');
    const ready = missing.length === 0;

    // Energiebilanz Heizung
    const E_fossil = W.consumption * fc.kwhPU;   // kWh Brennstoffeinsatz
    const Q_heat   = E_fossil * eta;             // kWh Nutzwärme
    const wpOn     = W.interesse.includes('wp');
    const E_WP     = Q_heat / bj.jaz;            // kWh Strom für Wärmepumpe
    const wpDemand = wpOn ? E_WP : 0;            // nur steuerbare WP → §14a/Modul-3-relevant
    // Heizstrom, der im NEU-Szenario tatsächlich Strombedarf ist:
    //  WP an → effizienter WP-Strom; sonst Elektro-Direktheizung (Nachtspeicher/Infrarot) → voller Heizstrom;
    //  fossil (Öl/Gas/Pellets/Fernwärme) → 0 (wird separat als Brennstoff bezahlt, siehe restHeizFossil).
    const isElektroHeizung = W.fuelType === 'strom';
    const heizStrom = wpOn ? E_WP : (isElektroHeizung ? E_fossil : 0);

    // Künftig geplante Zusatzverbraucher (Gruppe B) — erhöhen nur den KÜNFTIGEN Bedarf, nie "heute".
    // Gruppe A ("schon vorhanden") steckt bereits im abgelesenen Verbrauch → kein Rechen-Effekt.
    const sekNeu = W.sektorenNeu || [];
    const evKwh    = sekNeu.includes('eauto') ? (W.evKm > 0 ? W.evKm * EV_KWH_PER_KM : EV_KWH) : 0;
    const klimaKwh = sekNeu.includes('klima') ? KLIMA_KWH : 0;
    const dleKwh   = sekNeu.includes('dle')   ? DLE_KWH   : 0;
    // Infrarot/Nachtspeicher nur zählen, wenn nicht ohnehin Hauptheizung = Strom (kein Doppelzählen)
    const eheizKwh = (sekNeu.includes('eheiz') && W.fuelType !== 'strom') ? EHEIZ_KWH : 0;
    const zukunftStrom = evKwh + klimaKwh + dleKwh + eheizKwh;

    // PV — Summe aller Dachflächen (Modulanzahl × Modulleistung, PLZ-abhängiger Ertrag) + Aufschlüsselung je Fläche
    let kWp = 0, pvYield = 0;
    const surfaceRows = [];
    for (const s of W.surfaces) {
        if (!(s.modules > 0)) continue;
        const modWp  = s.modulePower > 0 ? s.modulePower : 440;
        const skWp   = s.modules * modWp / 1000;
        const sYield = skWp * baseYield
                     * tiltOrientFactor(s.orientation, s.tilt)
                     * (SHADE[s.shading] || 1);
        kWp     += skWp;
        pvYield += sYield;
        surfaceRows.push({ label: s.label, orientation: s.orientation, modules: s.modules, modulePower: modWp, kWp: skWp, yield: sYield });
    }

    // Bedarf (inkl. Heizstrom: WP-Strom oder Elektro-Direktheizung, + künftig geplante Lasten)
    const baseDemand  = W.elecKwh + heizStrom;      // abgelesener Haushaltsstrom + elektrischer Heizstrom
    const totalDemand = baseDemand + zukunftStrom;  // + künftig geplante Lasten
    const hasBattery  = W.interesse.includes('speicher');
    const emsOn       = W.ems === 'ja';
    const battKwh     = W.battKwh > 0
        ? W.battKwh
        : (hasBattery ? Math.min(15, Math.max(5, Math.round(totalDemand / 365))) : 0);

    // Autarkie/Eigenverbrauch — verbrauchs- UND speicherabhängig (sättigende Kurven, an HTW-Logik angelehnt).
    // Ohne Speicher begrenzt die Gleichzeitigkeit den Direktverbrauch (kein 100 % möglich); der Speicher hebt
    // die Autarkie durch Nachtnutzung deutlich. autarkFrac = Anteil des Bedarfs, den die PV selbst deckt.
    const demandMWh  = Math.max(0.1, totalDemand / 1000);
    const pvPerMWh   = kWp / demandMWh;        // spez. PV (kWp je MWh Verbrauch)
    const battPerMWh = battKwh / demandMWh;    // spez. Speicher (kWh je MWh Verbrauch)
    let autarkFrac = 0.45 * (1 - Math.exp(-1.1 * pvPerMWh));                       // Direktnutzung (Gleichzeitigkeit)
    if (hasBattery && battKwh > 0)
        autarkFrac += 0.60 * (1 - Math.exp(-1.4 * battPerMWh)) * (1 - autarkFrac); // Speicher-Nachtnutzung
    // EMS/HEMS: prognosebasiertes Speicherladen, Lastverschiebung in die PV-Stunden, WP-/Wallbox-Steuerung
    // → spürbar höhere Eigenversorgung (mit Speicher stärker, weil steuerbar). Annahme, keine Zusage.
    if (emsOn) autarkFrac += (hasBattery ? 0.10 : 0.05) * (1 - autarkFrac);
    autarkFrac = Math.min(autarkFrac, 0.92);
    const pvSelbst = Math.min(totalDemand * autarkFrac, pvYield);
    const pvExport = Math.max(0, pvYield - pvSelbst);
    const autarkie = totalDemand > 0 ? Math.min(100, pvSelbst / totalDemand * 100) : 0;

    // Kosten heute — NUR abgelesener Verbrauch + Heizung (künftig geplante Lasten zählen NICHT in "heute")
    const ppu          = W.fuelPrice !== null ? W.fuelPrice / fc.dispDiv : fc.ppu;
    const fuelPriceKwh = ppu / fc.kwhPU;
    const fossilJahr   = E_fossil * fuelPriceKwh;
    const elecJahr     = W.elecKwh * W.elecPrice;   // Ist-Stromkosten laut Rechnung
    const heuteJahr    = fossilJahr + elecJahr;

    // Einspeisevergütung (ÜBERSCHUSSeinspeisung — Kunde nutzt/speichert selbst, nur der Rest wird vergütet):
    // größenabhängige EEG-Staffel (Stand Feb–Jul 2026, Bundesnetzagentur, halbjährliche Degression 1 % — Annahme) + EMS/Solarspitzengesetz-Effekt.
    const feedTarif     = kWp <= 10 ? 0.0778 : kWp <= 40 ? 0.0673 : 0.056; // €/kWh: ≤10 / 10–40 / >40 kWp
    const feedInMitEms  = pvExport * feedTarif;   // mit EMS/iMSys: volle Überschussvergütung
    const feedInOhneEms = 0;                       // ohne EMS/iMSys: realistisch keine verlässliche Vergütung (Solarspitzengesetz) – Annahme
    const feedIn        = emsOn ? feedInMitEms : feedInOhneEms;
    const modul3Vorteil = emsOn ? (wpDemand + zukunftStrom) * MODUL3_DIFF_KWH : 0;
    // EMS-Vorteil = die ohne EMS entgangene volle Einspeisung + der entgangene §14a-Modul-3-Rabatt
    const emsDelta      = (feedInMitEms - feedInOhneEms) + (wpDemand + zukunftStrom) * MODUL3_DIFF_KWH;

    // Kosten neu
    const netElec     = Math.max(0, totalDemand - pvSelbst);
    const newElecJahr = netElec * W.elecPrice;

    // Investition & Annuität — ausschließlich der eingegebene Angebotspreis (keine Auto-Schätzung)
    const invest     = W.kreditbetrag > 0 ? W.kreditbetrag : 0;
    const creditBase = invest;
    const needsPrice = W.finanzierung === 'finanz' && invest <= 0; // Rate erst nach Preiseingabe
    let monthlyRate = 0;
    if (W.finanzierung === 'finanz' && invest > 0) {
        monthlyRate = calcMonthlyRate(creditBase, W.zinssatz, W.laufzeit, W.sondertilgung, W.zinsfreiJahr1);
    }
    const annuity = monthlyRate * 12;
    // Ohne Wärmepumpe bleibt die fossile Heizung bestehen → auch im Neu-Szenario weiter zahlen (keine Scheinersparnis).
    // Bei Elektro-Direktheizung steckt die Heizung schon im Strombedarf (baseDemand) → keine separate Restheizung (kein Doppelzählen).
    const restHeizFossil = (wpOn || isElektroHeizung) ? 0 : fossilJahr;
    const neuJahr = newElecJahr + annuity - feedIn - modul3Vorteil + restHeizFossil;

    // CO₂
    const co2Jetzt = E_fossil * fc.ef / 1000; // t/Jahr

    // 20-Jahres-Projektion (Rate endet nach Laufzeit)
    // Energiepreis-Steigerung: interaktiver Slider (Default 6 %/a) treibt Strom- UND Brennstoffpreis,
    // weil steigende Öl-/Gaspreise + CO₂-Bepreisung die Anbieterkosten künftig gemeinsam nach oben ziehen.
    const priceInc = (W.priceInc != null ? W.priceInc : 6) / 100;
    const fossilInc = priceInc;
    const elecInc   = priceInc;
    // CO₂-Bepreisung (BEHG/nEHS) trifft nur direkt gekaufte fossile Brennstoffe (Heizöl, Erdgas).
    // Bei Strom/Fernwärme steckt der CO₂-Preis (ETS) bereits im Arbeitspreis, Pellets sind quasi neutral → kein Aufschlag.
    const behg = (W.fuelType === 'oil' || W.fuelType === 'gas');
    const fossilArr = [], neuArr = [], energySavArr = [];
    for (let t = 0; t < YEARS; t++) {
        const co2P   = Math.min(CO2_MAX, t < 2 ? CO2_2025 + t * 5 : CO2_2027 * Math.pow(1 + CO2_INC, t - 2));
        const co2Add = behg ? E_fossil * fc.ef * co2P / 1000 : 0; // €/Jahr zusätzliche CO₂-Bepreisung (nur Öl/Gas)
        const cFoss  = (fossilJahr * Math.pow(1 + fossilInc, t))
                     + (elecJahr * Math.pow(1 + elecInc, t))
                     + co2Add;
        // Fossile Restheizung im Neu-Szenario nur, wenn weder WP noch Elektroheizung:
        // bei Elektroheizung steckt der Heizstrom bereits in newElecJahr (kein Doppelzählen).
        const neuFossil   = (wpOn || isElektroHeizung) ? 0 : (fossilJahr * Math.pow(1 + fossilInc, t) + co2Add);
        const cNeuEnergie = Math.max(0, newElecJahr * Math.pow(1 + elecInc, t) - feedIn - modul3Vorteil) + neuFossil;
        const annuityT    = t < W.laufzeit ? annuity : 0;
        const cNeu        = cNeuEnergie + annuityT;
        fossilArr.push(Math.round(cFoss));
        neuArr.push(Math.round(cNeu));
        energySavArr.push(cFoss - cNeuEnergie); // Ersparnis ohne Finanzierungskosten – Basis Amortisation/Rendite
    }

    // Amortisation & Rendite (auf Basis der Energieersparnis, ohne Finanzierungskosten)
    let amortJahre = null;
    if (invest > 0 && energySavArr[0] > 0) {
        let cum = 0;
        for (let t = 0; t < YEARS; t++) {
            const prevCum = cum;
            cum += energySavArr[t];
            if (cum >= invest) { amortJahre = t + (invest - prevCum) / energySavArr[t]; break; }
        }
    }
    const renditeProzent = invest > 0 ? (energySavArr[0] / invest) * 100 : 0;

    // Kumulierter Chart + 20-Jahres-Bilanz
    const fossilCum = [], neuCum = [];
    let fSum = 0, nSum = 0;
    for (let t = 0; t < YEARS; t++) {
        fSum += fossilArr[t]; fossilCum.push(Math.round(fSum));
        nSum += neuArr[t];    neuCum.push(Math.round(nSum));
    }
    const bilanz20 = fossilArr.reduce((a, b) => a + b, 0) - neuArr.reduce((a, b) => a + b, 0);

    return {
        ready, missing, region: plz.region, baseYield,
        heuteJahr, neuJahr, monthlyRate, annuity,
        pvYield, kWp, pvSelbst, netElec, newElecJahr, fossilJahr, elecJahr, isElektroHeizung, autarkie, feedTarif,
        feedIn, feedInMitEms, feedInOhneEms, modul3Vorteil, emsDelta, emsOn, pvExport, battKwh, hasBattery, zukunftStrom, wpOn,
        invest, creditBase, needsPrice, restHeizFossil, co2Jetzt, amortJahre, renditeProzent,
        fossilArr, neuArr, fossilCum, neuCum, bilanz20, surfaceRows
    };
}

// === ERGEBNIS RENDERN (DOM) ===
function renderResults(m) {
    const dash = '–';
    $('res-location').textContent = m.region || 'deine Region';

    if (!m.ready) {
        ['res-heute','res-neu','res-delta','res-bilanz20','kpi-pv','kpi-pv-sub','kpi-heiz','kpi-heiz-sub','kpi-co2','kpi-amort','kpi-rendite','dock-heute','dock-neu']
            .forEach(id => { const el = $(id); if (el) el.textContent = dash; });
        $('res-neu-sub').textContent = '€/Monat';
        const fehlt = (m.missing && m.missing.length) ? m.missing.join(', ') : 'Wohnfläche, Heizverbrauch, Anzahl Module (Dachfläche)';
        $('res-delta-text').textContent = 'Bitte noch eingeben: ' + fehlt;
        $('res-narrative').textContent = 'Es fehlt noch: ' + fehlt + '. Sobald das eingetragen ist, rechnet das Cockpit deinen Kosten-Nutzen-Vergleich live durch.';
        $('eco-premium-text').textContent = 'Sobald die Anlagendaten stehen, siehst du hier, was ein intelligentes Energiemanagement (EMS) gegenüber einer normalen PV-Anlage ausmacht.';
        $('roof-total-kwp').textContent = dash;
        $('roof-breakdown').innerHTML = '<p class="roof-hint" style="margin:0">Trag oben die <strong>Anzahl Module</strong> je Dachfläche ein, dann siehst du hier, wie viel jede Fläche erzeugt.</p>';
        ['energy-autarkie','energy-self-pct','energy-grid-pct','ef-selbst','ef-einspeist','ef-netz']
            .forEach(id => { const el = $(id); if (el) el.textContent = dash; });
        $('energy-seg-self').style.width = '0%';
        $('energy-seg-grid').style.width = '100%';
        const einEl0 = $('einspeise'); if (einEl0) einEl0.textContent = '';
        const hintEl0 = $('autarkie-hint'); if (hintEl0) hintEl0.textContent = '';
        const anlEl0 = $('anlage-summary'); if (anlEl0) anlEl0.textContent = '';
        const finEl0 = $('fin-financed'); if (finEl0) { finEl0.textContent = ''; finEl0.style.display = 'none'; }
        const cn0 = $('chart-note'); if (cn0) cn0.textContent = '';
        chartData = null;
        return;
    }

    const heuteM = Math.round(m.heuteJahr / 12);
    const neuM   = Math.round(m.neuJahr   / 12);
    const delta  = heuteM - neuM;
    const rateM  = Math.round(m.monthlyRate);
    const netM   = Math.round(m.newElecJahr / 12);
    const feedM  = Math.round((m.feedIn + m.modul3Vorteil) / 12);
    const heizM  = Math.round(m.restHeizFossil / 12); // fortlaufende fossile Heizung (nur ohne WP)

    $('res-heute').textContent  = fmt(heuteM) + ' €';
    $('dock-heute').textContent = fmt(heuteM) + ' €';

    const finEl = $('fin-financed');
    if (m.needsPrice) {
        // Kein Angebotspreis eingegeben → keine Rate/Finanz-Simulation. Energie-Ergebnis zeigt sich bereits.
        $('res-neu').textContent   = '? €';
        $('dock-neu').textContent  = '? €';
        $('res-neu-sub').textContent = 'Trag deinen Anlagenpreis in Sektion 6 ein – dann rechnet die Rate.';
        $('res-delta').textContent = '–';
        $('res-delta-text').textContent = 'Anlagenpreis eingeben für den Kostenvergleich';
        $('res-bilanz20').textContent = '–';
        if (finEl) { finEl.textContent = 'Trag deinen Anlagenpreis (Sektion 6) ein, um die monatliche Rate zu berechnen.'; finEl.style.display = ''; }
        const cn = $('chart-note');
        if (cn) cn.textContent = 'Grüne Linie = reine Energiekosten im neuen Szenario, noch ohne Finanzierungsrate. Trag deinen Anlagenpreis (Sektion 6) ein, dann hebt sie sich um die Rate.';
    } else {
        $('res-neu').textContent    = fmt(neuM) + ' €';
        $('dock-neu').textContent   = fmt(neuM) + ' €';

        const heizPart = heizM > 0 ? ' + Heizung ' + fmt(heizM) + ' €' : '';
        let sub;
        if (W.finanzierung === 'finanz') {
            sub = 'Rate ' + fmt(rateM) + ' € + Strom ' + fmt(netM) + ' €' + heizPart
                + (feedM > 0 ? ' − Einspeisung ' + fmt(feedM) + ' €' : '') + ' /Mon.';
        } else if (W.finanzierung === 'eigen') {
            sub = 'Energiekosten ' + fmt(netM) + ' €' + heizPart
                + (feedM > 0 ? ' − Einspeisung ' + fmt(feedM) + ' €' : '') + ' /Mon. (ohne Tilgung)';
        } else {
            sub = 'Energiekosten ' + fmt(netM + heizM) + ' €/Mon. · Finanzierung noch offen';
        }
        $('res-neu-sub').textContent = sub;

        if (finEl) {
            if (W.finanzierung === 'finanz' && m.creditBase > 0) {
                finEl.textContent = 'Finanziert: ' + fmt(m.creditBase) + ' € (dein Angebotspreis) · '
                    + W.zinssatz.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' % · ' + W.laufzeit + ' Jahre';
                finEl.style.display = '';
            } else {
                finEl.textContent = '';
                finEl.style.display = 'none';
            }
        }

        $('res-delta').textContent = (delta >= 0 ? '− ' : '+ ') + fmt(Math.abs(delta)) + ' €/Monat';
        $('res-delta-text').textContent = delta >= 0
            ? 'monatlich günstiger als heute'
            : 'monatlicher Mehraufwand – du baust aber Eigentum auf';
        $('res-bilanz20').textContent = fmt(Math.round(m.bilanz20)) + ' €';
        const cn = $('chart-note');
        if (cn) cn.textContent = '';
    }

    $('kpi-pv').textContent     = fmt(Math.round(m.pvYield)) + ' kWh';
    $('kpi-pv-sub').textContent = (Math.round(m.kWp * 10) / 10) + ' kWp · '
                                + Math.round(m.pvSelbst / (m.pvYield || 1) * 100) + '% Eigenverbrauch · ≈ ' + m.baseYield + ' kWh/kWp';
    if (m.wpOn) {
        $('kpi-heiz-label').textContent = 'Heizkosten neu';
        $('kpi-heiz').textContent   = fmt(Math.round(m.newElecJahr)) + ' €/Jahr';
        $('kpi-heiz-sub').textContent = 'Vorher: ' + fmt(Math.round(m.fossilJahr)) + ' €/Jahr'
                                      + (m.fossilJahr > 0 ? ' (−' + Math.round((1 - m.newElecJahr / m.fossilJahr) * 100) + '%)' : '');
    } else if (m.isElektroHeizung) {
        // Elektroheizung: Heizstrom steckt bereits in "Stromkosten neu" und wird teils von der PV gedeckt
        const vorherStrom = m.elecJahr + m.fossilJahr; // Haushalt + Heizstrom (bisherige Stromrechnung gesamt)
        $('kpi-heiz-label').textContent = 'Stromkosten neu';
        $('kpi-heiz').textContent   = fmt(Math.round(m.newElecJahr)) + ' €/Jahr';
        $('kpi-heiz-sub').textContent = 'inkl. elektrischer Heizung · vorher ' + fmt(Math.round(vorherStrom)) + ' €/Jahr'
                                      + (vorherStrom > 0 ? ' (−' + Math.round((1 - m.newElecJahr / vorherStrom) * 100) + '%)' : '');
    } else {
        $('kpi-heiz-label').textContent = 'Stromkosten neu';
        $('kpi-heiz').textContent   = fmt(Math.round(m.newElecJahr)) + ' €/Jahr';
        $('kpi-heiz-sub').textContent = 'Heizung unverändert (weiter fossil, ' + fmt(Math.round(m.fossilJahr)) + ' €/Jahr)';
    }
    $('kpi-co2').textContent    = __nfFix1.format(m.co2Jetzt) + ' t';

    $('kpi-amort').textContent   = m.amortJahre !== null ? __nfMax1.format(m.amortJahre) + ' Jahre' : '–';
    $('kpi-rendite').textContent = m.invest > 0 ? __nfMax1.format(m.renditeProzent) + ' %' : '–';

    // Dach im Detail: Pro-Fläche-Zeilen + Gesamt-kWp (visuell, damit der Kunde das Potenzial selbst sieht)
    $('roof-total-kwp').textContent = 'Gesamt: ' + __nfMax1.format(m.kWp) + ' kWp · ' + fmt(m.pvYield) + ' kWh/Jahr';
    const rows = m.surfaceRows || [];
    const maxY = rows.reduce((mx, r) => Math.max(mx, r.yield), 0) || 1;
    $('roof-breakdown').innerHTML = rows.map(r => {
        const pct = Math.max(4, Math.round(r.yield / maxY * 100));
        const kwpTxt = __nfMax1.format(r.kWp);
        return `<div class="roof-row">
          <div class="roof-row-top">
            <span class="roof-row-label">${r.label} · ${ORIENT_LABEL[r.orientation] || r.orientation} · ${r.modules} × ${r.modulePower} Wp</span>
            <span class="roof-row-val">${kwpTxt} kWp · ${fmt(r.yield)} kWh</span>
          </div>
          <div class="roof-bar-track"><div class="roof-bar" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');

    // Energiebilanz: Wohin fließt dein Sonnenstrom? (Autarkie visuell)
    const autark = Math.round(m.autarkie);
    $('energy-autarkie').textContent = autark + ' % unabhängig';
    $('energy-seg-self').style.width = autark + '%';
    $('energy-seg-grid').style.width = (100 - autark) + '%';
    $('energy-self-pct').textContent = autark + '%';
    $('energy-grid-pct').textContent = (100 - autark) + '%';
    $('ef-selbst').textContent   = fmt(m.pvSelbst) + ' kWh';
    $('ef-einspeist').textContent = fmt(m.pvExport) + ' kWh';
    $('ef-netz').textContent     = fmt(m.netElec) + ' kWh';

    // Einspeisevergütung (Überschusseinspeisung) sichtbar + EMS-/Solarspitzengesetz-Effekt
    const einEl = $('einspeise');
    if (einEl) {
        const ct = (m.feedTarif * 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const staffel = m.kWp <= 10 ? '≤ 10 kWp' : '> 10 kWp';
        const emsNote = m.emsOn
            ? 'Ohne EMS/intelligentes Messsystem ist keine verlässliche Einspeisevergütung zu erwarten (Solarspitzengesetz).'
            : 'Mit EMS wären es ≈ ' + fmt(m.feedInMitEms) + ' €/Jahr (Solarspitzengesetz).';
        einEl.innerHTML = '<strong>Einspeisevergütung (Überschuss): ≈ ' + fmt(m.feedIn) + ' €/Jahr</strong> – '
            + ct + ' ct/kWh (' + staffel + '). ' + emsNote + ' Annahme, keine Zusage.';
    }

    // Hinweis zur Speicher-Rolle für die Autarkie
    const hintEl = $('autarkie-hint');
    if (hintEl) {
        const battTxt = m.hasBattery
            ? 'Dein Speicher (' + __nfMax1.format(m.battKwh) + ' kWh) verschiebt Tagesstrom in die Nacht → höhere Autarkie. Ein größerer Speicher hebt sie weiter.'
            : 'Ohne Batteriespeicher wird der Großteil der Produktion eingespeist – direkt genutzt wird nur der zeitgleiche Verbrauch. Ein Speicher hebt deine Autarkie deutlich.';
        const emsTxt = m.emsOn
            ? ' Dein Energiemanagement hebt sie zusätzlich: prognosebasiertes Laden und Lastverschiebung in die Sonnenstunden.'
            : ' Ein Energiemanagement würde sie zusätzlich heben (prognosebasiertes Laden, Lastverschiebung).';
        hintEl.textContent = battTxt + emsTxt;
    }

    // Anlage-Zusammenfassung (Gesamt-kWp aus den Flächen)
    const anlEl = $('anlage-summary');
    if (anlEl) {
        const n = (m.surfaceRows || []).length;
        anlEl.textContent = 'Deine Anlage: ' + __nfMax1.format(m.kWp)
            + ' kWp aus ' + n + (n === 1 ? ' Fläche' : ' Flächen') + ' · ' + fmt(m.pvYield) + ' kWh/Jahr Produktion.';
    }

    $('eco-premium-text').textContent = m.emsOn
        ? `Du rechnest mit intelligentem Energiemanagement (EMS). Das lohnt sich: Bei den 2025 bundesweit rund 573 Stunden mit negativen Strompreisen würde eine normale PV-Anlage die Einspeisevergütung anteilig verlieren (Solarspitzengesetz), und der automatische §14a-Modul-3-Netzentgelt-Rabatt bliebe ungenutzt. Geschätzter Vorteil des EMS: rund ${fmt(Math.round(m.emsDelta))} €/Jahr zu deinen Gunsten.`
        : `Du rechnest mit einer normalen PV-Anlage ohne Energiemanagement. Bei den 2025 bundesweit rund 573 Stunden mit negativen Strompreisen entfällt anteilig die Einspeisevergütung (Solarspitzengesetz), und der automatische §14a-Modul-3-Netzentgelt-Rabatt bleibt ungenutzt. Mit einem EMS wären es laut dieser Schätzung rund ${fmt(Math.round(m.emsDelta))} €/Jahr mehr zu deinen Gunsten.`;

    const fuelLabel = { oil:'Heizöl', gas:'Erdgas', pellets:'Holzpellets', fernwaerme:'Fernwärme', strom:'Heizstrom' }[W.fuelType] || 'fossiler Energie';
    $('res-narrative').textContent = W.finanzierung === 'eigen'
        ? `Du heizt aktuell mit ${fuelLabel} und gibst dafür laut dieser Schätzung ${fmt(heuteM)} €/Monat aus — Geld, das jeden Monat weg ist. Mit deiner eigenen Anlage würdest du stattdessen rund ${fmt(neuM)} €/Monat aufwenden und dir Vermögen aufbauen, das dir dauerhaft gehört.`
        : `Du heizt aktuell mit ${fuelLabel} und gibst dafür laut dieser Schätzung ${fmt(heuteM)} €/Monat aus — Geld, das jeden Monat weg ist. Mit einer Finanzierung deiner eigenen Anlage zahlst du laut dieser Schätzung rund ${fmt(neuM)} €/Monat — und investierst damit in dein Eigentum statt in das des Energieversorgers.`;

    // PLZ im Lead-Formular vorbelegen
    const lgPlz = $('lg-plz');
    if (lgPlz && W.plz && !lgPlz.value) lgPlz.value = W.plz;
}

// === CHART (eigener Canvas-Renderer – keine Fremdbibliothek, garantierte Zeichnung) ===
function niceStep(raw) {
    if (!(raw > 0)) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / pow;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
}
function drawCostChart(fossil, neu) {
    chartData = { fossil, neu };
    const canvas = $('cost-chart');
    const note = $('chart-note');
    const fEnd = fossil[fossil.length - 1], nEnd = neu[neu.length - 1];
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) { // Canvas nicht verfügbar → nie ein leeres Feld: Klartext-Fallback
        if (note) note.textContent = 'Nach 20 Jahren summiert: heutiger Weg ≈ ' + fmt(fEnd) + ' €, mit eigener Anlage ≈ ' + fmt(nEnd) + ' €.';
        return;
    }
    const cssW = canvas.clientWidth  || (canvas.parentElement && canvas.parentElement.clientWidth) || 600;
    const cssH = canvas.clientHeight || 260;
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const n = fossil.length;
    const padL = 60, padR = 74, padT = 14, padB = 26;
    const plotW = Math.max(10, cssW - padL - padR);
    const plotH = Math.max(10, cssH - padT - padB);
    const maxV = Math.max(fEnd, nEnd, 1);
    const step = niceStep(maxV / 4);
    const yMax = step * Math.max(1, Math.ceil(maxV / step));
    const X = i => padL + plotW * (n > 1 ? i / (n - 1) : 0);
    const Y = v => padT + plotH * (1 - v / yMax);
    const year0 = new Date().getFullYear();

    // Y-Gridlines + €-Labels
    ctx.font = '11px Outfit, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (let g = 0; g <= yMax + step * 0.001; g += step) {
        const gy = Y(g);
        ctx.strokeStyle = chartPrintMode ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke();
        ctx.fillStyle = '#8a8a80'; ctx.textAlign = 'right';
        ctx.fillText(g >= 1000 ? Math.round(g / 1000) + 'k €' : Math.round(g) + ' €', padL - 8, gy);
    }
    // X-Labels (Jahre) alle 5
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#8a8a80';
    for (let i = 0; i < n; i += 5) ctx.fillText(String(year0 + i), X(i), padT + plotH + 8);

    // Linie + dezente Fläche
    // Im Druck werden die Linien zusätzlich über die Strichart unterschieden:
    // auf einem S/W-Drucker werden Rot und Grün zu identischen Grautönen.
    // Die Flächenfüllungen entfallen dort (Tonerersparnis).
    const drawLine = (arr, color, fill, dashed) => {
        ctx.beginPath();
        arr.forEach((v, i) => { const px = X(i), py = Y(v); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (chartPrintMode && dashed) ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!chartPrintMode) {
            ctx.lineTo(X(n - 1), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
            ctx.fillStyle = fill; ctx.fill();
        }
        ctx.restore();
    };
    drawLine(neu,    '#2E4F3C', 'rgba(46,79,60,0.07)', false);
    drawLine(fossil, '#dc2626', 'rgba(220,38,38,0.07)', true);

    // Endwert-Chips (Summe nach 20 Jahren) rechts an den Linienenden – für die Beratung wertvoller als Hover.
    // Liegen die Endwerte dicht beieinander, die Chips vertikal auseinanderschieben (keine Überlappung).
    const chipH = 18;
    let yF = Y(fEnd), yN = Y(nEnd);
    if (Math.abs(yF - yN) < chipH + 2) {
        const mid = (yF + yN) / 2, off = chipH / 2 + 1;
        if (fEnd >= nEnd) { yF = mid - off; yN = mid + off; } else { yN = mid - off; yF = mid + off; }
    }
    const chip = (v, yc, color) => {
        const text = fmt(v) + ' €';
        ctx.font = '700 11px Outfit, system-ui, sans-serif';
        const w = ctx.measureText(text).width + 12;
        let bx = X(n - 1) + 6; if (bx + w > cssW) bx = cssW - w;
        const by = Math.min(cssH - chipH, Math.max(0, yc - chipH / 2));
        ctx.fillStyle = color; roundRectPath(ctx, bx, by, w, chipH, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + w / 2, by + chipH / 2 + 0.5);
    };
    chip(fEnd, yF, '#dc2626');
    chip(nEnd, yN, '#2E4F3C');
}
window.addEventListener('resize', () => {
    if (!chartData) return;
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => drawCostChart(chartData.fossil, chartData.neu), 150);
});

// Der Canvas-Renderer misst seine Größe aus dem Container. Im Druck bekommt der
// Container per Print-CSS eine feste mm-Höhe — ohne Neuzeichnen bliebe das alte
// Bitmap stehen und würde nur verzerrt skaliert.
function redrawChartForPrint(on) {
    chartPrintMode = on;
    if (chartData) drawCostChart(chartData.fossil, chartData.neu);
}
window.addEventListener('beforeprint', () => redrawChartForPrint(true));
window.addEventListener('afterprint',  () => redrawChartForPrint(false));

// === QUELLEN-TOGGLE ===
function toggleSources() {
    const btn  = $('sources-btn');
    const body = $('sources-body');
    const open = body.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
}

// === LEAD-GATE ===
async function submitLead() {
    const vorname        = $('lg-vorname').value.trim();
    const nachname       = $('lg-nachname').value.trim();
    const email          = $('lg-email').value.trim();
    const phone          = $('lg-phone').value.trim();
    const plz            = $('lg-plz').value.trim();
    const consentAnalyse = $('lg-consent-analyse').checked;
    const consentKontakt = $('lg-consent-kontakt').checked;
    const hp             = $('hp_website') ? $('hp_website').value : '';

    if (!vorname || !nachname || !email || !plz || !consentAnalyse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        $('lg-error').textContent = 'Bitte Vorname, Nachname, E-Mail, PLZ und die Analyse-Zustimmung ausfüllen.';
        $('lg-error').classList.add('visible');
        return;
    }
    $('lg-error').classList.remove('visible');

    const btn = $('lg-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';

    const rechnerdaten = {
        heute: $('res-heute').textContent,
        neu:   $('res-neu').textContent,
        delta: $('res-delta').textContent,
        bil20: $('res-bilanz20').textContent,
        narr:  $('res-narrative').textContent,
        fuel:  W.fuelType || '',
        unit:  (FUEL[W.fuelType] || {}).unit || '',
    };

    try {
        const resp = await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hp_website: hp, vorname, nachname, email, phone, plz,
                                   rechnerdaten, interesse: W.interesse || [],
                                   consentAnalyse, consentKontakt }),
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || 'Unbekannter Fehler');
        $('lead-gate-form').style.display = 'none';
        $('lead-success').style.display   = '';
    } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Analyse per E-Mail zusenden';
        $('lg-error').textContent = e.message || 'Versand fehlgeschlagen – bitte erneut versuchen.';
        $('lg-error').classList.add('visible');
    }
}

// === RESET (neue Berechnung, kein Step-Reset) ===
function resetWizard() {
    // Eingabefelder leeren/zurücksetzen
    ['inp-baujahr','inp-heizalter','inp-area','inp-consumption','inp-fuelprice','inp-heizabschlag',
     'inp-elec-kwh','inp-elec-abschlag','inp-ev-km','inp-batt','inp-kreditbetrag','inp-sondertilgung','inp-plz']
        .forEach(id => { const el = $(id); if (el) el.value = ''; });
    const ep = $('inp-elecprice'); if (ep) ep.value = '32';
    const fb = $('plz-feedback'); if (fb) { fb.textContent = ' '; fb.className = 'plz-feedback'; }

    // Karten-/Slider-State zurücksetzen
    W.gebaeude = 'efh'; W.fuelType = 'oil'; W.finanzierung = 'finanz';
    W.ems = 'ja'; W.zinsfreiJahr1 = 'nein';
    W.interesse = ['pv','wp']; W.sektorenIst = []; W.sektorenNeu = []; W.plzData = null;
    W.zinssatz = 3.5; W.laufzeit = 20; W.priceInc = 6;
    const setSel = (group, value) => document.querySelectorAll(`.card-btn[data-group="${group}"]`)
        .forEach(b => b.classList.toggle('selected', b.dataset.value === value));
    ['gebaeude','fuelType','finanzierung','ems','zinsfreiJahr1'].forEach(g => setSel(g, W[g]));
    document.querySelectorAll('.card-btn.multi[data-group="interesse"]').forEach(b => b.classList.toggle('selected', ['pv','wp'].includes(b.dataset.value)));
    document.querySelectorAll('.card-btn.multi[data-group="sektorenIst"], .card-btn.multi[data-group="sektorenNeu"]').forEach(b => b.classList.remove('selected'));
    const sz = $('sld-zins'); if (sz) sz.value = '3.5';
    const sl = $('sld-laufzeit'); if (sl) sl.value = '20';
    const sp = $('sld-preis'); if (sp) sp.value = '6';

    // Dachflächen zurück
    W.surfaces = [{ label:'Hauptdach', modules:0, modulePower:440, orientation:'S', tilt:'mittel', shading:'keine' }];
    renderSurfaces();

    // Lead-Gate zurücksetzen
    const lgForm = $('lead-gate-form');
    const lgSucc = $('lead-success');
    if (lgForm) lgForm.style.display = '';
    if (lgSucc) lgSucc.style.display = 'none';
    ['lg-vorname','lg-nachname','lg-email','lg-phone','lg-plz'].forEach(id => { const el = $(id); if(el) el.value=''; });
    ['lg-consent-analyse','lg-consent-kontakt'].forEach(id => { const el = $(id); if(el) el.checked = false; });
    const lgErr = $('lg-error');
    if (lgErr) { lgErr.classList.remove('visible'); lgErr.textContent = 'Bitte Vorname, Nachname, E-Mail, PLZ und die Analyse-Zustimmung ausfüllen.'; }
    const lgBtn = $('lg-submit-btn');
    if (lgBtn) { lgBtn.disabled = false; lgBtn.textContent = 'Analyse per E-Mail zusenden'; }

    setElecMode('kwh');
    updateFuelUI();
    updateFinanzUI();
    updateBatteryUI();
    updateEvUI();
    updateSliderLabels();
    recalc();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === FORMAT ===
function fmt(n) { return Math.round(n).toLocaleString('de-DE'); }

// Nach DOI-Bestätigung: Lead-Gate direkt auf Success zeigen
if (new URLSearchParams(location.search).get('confirmed') === 'true') {
    const lgForm = $('lead-gate-form');
    const lgSucc = $('lead-success');
    if (lgForm) lgForm.style.display = 'none';
    if (lgSucc) lgSucc.style.display = '';
}
