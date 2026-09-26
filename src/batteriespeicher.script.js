/* Ertragsrechner auf echten Marktdaten, 1. Januar bis 24. September 2026.

   Jede Konfiguration ist ein Paar aus Energieinhalt (kWh) und
   Wechselrichterleistung (kW). Herstellerneutral.
   - Reine Day-Ahead-Speicher (nurDa): ab 60 kWh + 30 kW.
   - Day-Ahead + Regelenergie: ausschließlich die freigegebenen
     Paarkonstellationen (Stand 26.09.2026), ab 84,48 kWh + 30 kW.
   Die Vermarktung filtert die wählbaren Konfigurationen.

   Day-Ahead: Viertelstundenpreise der Gebotszone DE-LU (Energy-Charts,
   Fraunhofer ISE). Je Tag ein Zyklus: Laden mit der Wechselrichterleistung
   in den günstigsten Viertelstunden, Liefern in den teuersten, und nur so
   tief, wie es sich an diesem Tag lohnt. Umlaufwirkungsgrad 90 %.
   Die Monatswerte in KONFIG.da sind bereits in Euro je Konfiguration.

   Regelenergie: Leistungspreise der Primärregelleistung aus den
   Ausschreibungen der vier Übertragungsnetzbetreiber, deutscher Regelblock,
   sechs Vier-Stunden-Produkte je Tag, 266 Tage. Vorgehalten wird die volle
   Wechselrichterleistung der Konfiguration.

   Beide Märkte greifen auf dieselbe Leistung zu. Der kombinierte Wert wird
   deshalb als Spanne ausgewiesen: von der stärkeren Einzelvermarktung bis
   zur vollen Summe. Wo genau er liegt, bestimmt die Aufteilung im Betrieb. */
(function () {
  'use strict';

  var MONATE = [
    { m: 'Jan', tage: 31, fcr:  7292, laden:  8.19, liefern: 15.63, negTage:  1 },
    { m: 'Feb', tage: 28, fcr:  5777, laden:  6.81, liefern: 13.23, negTage:  2 },
    { m: 'Mär', tage: 31, fcr: 11908, laden:  2.50, liefern: 18.57, negTage:  8 },
    { m: 'Apr', tage: 30, fcr: 16522, laden: -2.09, liefern: 15.87, negTage: 19 },
    { m: 'Mai', tage: 31, fcr: 17268, laden:  0.27, liefern: 18.46, negTage: 15 },
    { m: 'Jun', tage: 30, fcr: 17379, laden:  2.93, liefern: 23.92, negTage:  9 },
    { m: 'Jul', tage: 31, fcr: 16446, laden:  1.82, liefern: 18.13, negTage: 14 },
    { m: 'Aug', tage: 31, fcr: 15971, laden:  3.29, liefern: 20.93, negTage: 12 },
    { m: 'Sep', tage: 24, fcr: 12654, laden:  4.16, liefern: 26.25, negTage:  6 }
  ];

  // Freigegebene Konfigurationen (Stand 26.09.2026), herstellerneutral.
  // mod/modKwh: Anzahl und Größe der Speichermodule, wr/wrKw: Wechselrichter.
  // da: Day-Ahead-Ertrag je Monat in Euro für genau diese Konfiguration.
  var KONFIG = [
    // Reine Day-Ahead-Speicher, kein Zugang zum Regelenergiemarkt
    { nurDa: true, kwh: 60,  kw: 30, da: [111,  87, 267, 297, 307, 339, 271, 291, 285] },
    { nurDa: true, kwh: 80,  kw: 30, da: [141, 109, 340, 379, 390, 431, 352, 376, 360] },
    { nurDa: true, kwh: 100, kw: 30, da: [168, 129, 404, 454, 462, 512, 428, 454, 427] },
    { nurDa: true, kwh: 120, kw: 30, da: [192, 147, 462, 522, 528, 577, 499, 527, 487] },
    // Freigegeben für Day-Ahead + Regelenergie (Stand 26.09.2026)
    { mod: 1, modKwh: 84.48, wr: 1, wrKw: 30,  da: [147, 114, 355, 397, 407, 450, 370, 394, 375] },
    { mod: 1, modKwh: 84.48, wr: 1, wrKw: 50,  da: [160, 126, 384, 427, 441, 488, 387, 417, 410] },
    { mod: 1, modKwh: 92.16, wr: 1, wrKw: 92,  da: [186, 148, 438, 489, 502, 557, 433, 475, 469] },
    { mod: 2, modKwh: 84.48, wr: 1, wrKw: 30,  da: [242, 182, 573, 656, 667, 698, 647, 674, 607] },
    { mod: 2, modKwh: 84.48, wr: 1, wrKw: 50,  da: [283, 217, 681, 765, 778, 861, 722, 766, 719] },
    { mod: 2, modKwh: 84.48, wr: 2, wrKw: 30,  da: [294, 228, 710, 793, 814, 900, 740, 788, 751] },
    { mod: 2, modKwh: 84.48, wr: 2, wrKw: 50,  da: [320, 252, 769, 854, 883, 976, 774, 835, 820] },
    { mod: 2, modKwh: 92.16, wr: 1, wrKw: 92,  da: [340, 266, 821, 912, 944, 1041, 834, 895, 874] },
    { mod: 2, modKwh: 92.16, wr: 2, wrKw: 92,  da: [371, 295, 876, 978, 1003, 1114, 867, 950, 939] },
    { mod: 3, modKwh: 92.16, wr: 1, wrKw: 92,  da: [475, 367, 1146, 1282, 1312, 1452, 1201, 1277, 1211] },
    { mod: 4, modKwh: 84.48, wr: 2, wrKw: 30,  da: [483, 363, 1147, 1312, 1333, 1396, 1294, 1349, 1213] },
    { mod: 4, modKwh: 84.48, wr: 2, wrKw: 50,  da: [566, 435, 1362, 1529, 1557, 1722, 1445, 1532, 1438] },
    { mod: 4, modKwh: 92.16, wr: 1, wrKw: 92,  da: [591, 451, 1418, 1602, 1620, 1771, 1533, 1618, 1496] },
    { mod: 4, modKwh: 92.16, wr: 2, wrKw: 92,  da: [680, 533, 1642, 1824, 1887, 2082, 1667, 1791, 1748] },
    { mod: 6, modKwh: 84.48, wr: 3, wrKw: 30,  da: [725, 545, 1720, 1969, 2000, 2094, 1941, 2023, 1820] },
    { mod: 6, modKwh: 84.48, wr: 3, wrKw: 50,  da: [849, 652, 2043, 2294, 2335, 2584, 2167, 2298, 2157] },
    { mod: 6, modKwh: 92.16, wr: 3, wrKw: 92,  da: [1021, 799, 2464, 2736, 2831, 3123, 2501, 2686, 2622] },
    { mod: 8, modKwh: 84.48, wr: 4, wrKw: 30,  da: [967, 727, 2294, 2625, 2666, 2792, 2588, 2698, 2426] },
    { mod: 8, modKwh: 84.48, wr: 4, wrKw: 50,  da: [1132, 869, 2724, 3058, 3114, 3445, 2889, 3065, 2876] },
    { mod: 8, modKwh: 92.16, wr: 4, wrKw: 92,  da: [1361, 1066, 3285, 3648, 3774, 4164, 3335, 3581, 3497] }
  ];
  KONFIG.forEach(function (k) {
    if (k.nurDa) return;
    k.kwh = Math.round(k.mod * k.modKwh * 100) / 100;
    k.kw = k.wr * k.wrKw;
  });

  var DA_TAGE = 267, FCR_TAGE = 266;
  var FCR_PRO_MW = MONATE.reduce(function (a, x) { return a + x.fcr; }, 0);

  var wrap = document.querySelector('.hd-tool');
  if (!wrap) return;

  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var zweiStellen = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var ganz = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var ct = function (v) { return zweiStellen.format(v) + ' ct'; };
  var bisZwei = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  var kwhText = function (v) { return bisZwei.format(v) + ' kWh'; };

  // Auswahl: Die Vermarktung bestimmt, welche Konfigurationen wählbar sind.
  function verfuegbar() {
    return markt === 'dafcr' ? KONFIG.filter(function (k) { return !k.nurDa; }) : KONFIG;
  }
  function kapazitaeten() {
    return verfuegbar().map(function (k) { return k.kwh; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .sort(function (a, b) { return a - b; });
  }
  function leistungenFuer(kwh) {
    return verfuegbar().filter(function (k) { return k.kwh === kwh; })
      .map(function (k) { return k.kw; }).sort(function (a, b) { return a - b; });
  }
  function finde(kwh, kw) {
    var liste = verfuegbar();
    for (var i = 0; i < liste.length; i++) if (liste[i].kwh === kwh && liste[i].kw === kw) return liste[i];
    return null;
  }
  // Nächstgelegene freigegebene Konfiguration: gleiche Leistung bevorzugt, dann ähnliche Größe
  function naechsteFreigegebene(k) {
    var liste = KONFIG.filter(function (x) { return !x.nurDa; });
    liste.sort(function (a, b) {
      return ((a.kw !== k.kw) - (b.kw !== k.kw)) || (Math.abs(a.kwh - k.kwh) - Math.abs(b.kwh - k.kwh));
    });
    return liste[0];
  }
  var EINSTIEG_FCR = KONFIG.filter(function (x) { return !x.nurDa; })
    .sort(function (a, b) { return a.kwh - b.kwh || a.kw - b.kw; })[0];
  var hinweis = '';

  var suche = new URLSearchParams(location.search);
  var markt = suche.get('markt') === 'dafcr' ? 'dafcr' : 'da';
  var konf = finde(+suche.get('kwh'), +suche.get('kw')) || EINSTIEG_FCR;

  function merkeInAdresse() {
    var q = new URLSearchParams(location.search);
    q.set('kwh', konf.kwh); q.set('kw', konf.kw); q.set('markt', markt);
    history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
  }

  var kapBox = document.getElementById('hd-kap');
  var wrBox = document.getElementById('hd-wr');

  function chip(text, an, daten) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'hd-chip' + (an ? ' is-on' : '');
    b.setAttribute('aria-pressed', an ? 'true' : 'false');
    b.textContent = text;
    Object.keys(daten).forEach(function (k) { b.dataset[k] = daten[k]; });
    return b;
  }

  function auswahlZeichnen() {
    kapBox.innerHTML = '';
    kapazitaeten().forEach(function (kwh) {
      kapBox.appendChild(chip(ganz.format(kwh) + ' kWh', kwh === konf.kwh, { kap: kwh }));
    });
    wrBox.innerHTML = '';
    leistungenFuer(konf.kwh).forEach(function (kw) {
      wrBox.appendChild(chip(kw + ' kW', kw === konf.kw, { wr: kw }));
    });
    wrap.querySelectorAll('.hd-chip[data-markt]').forEach(function (b) {
      var an = b.dataset.markt === markt;
      b.classList.toggle('is-on', an);
      b.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
    var aufbau, markttext;
    if (konf.nurDa) {
      aufbau = 'Speicher für den Day-Ahead-Handel mit ' + konf.kw + ' kW Wechselrichterleistung.';
      markttext = 'Zusätzlich Regelenergie ab ' + kwhText(EINSTIEG_FCR.kwh) + ' + ' + EINSTIEG_FCR.kw + ' kW.';
    } else {
      aufbau = konf.mod + (konf.mod === 1 ? ' Speichermodul' : ' Speichermodule') + ' à ' + kwhText(konf.modKwh) +
        ', ' + konf.wr + ' Wechselrichter à ' + konf.wrKw + ' kW.';
      markttext = 'Freigegeben für Day-Ahead und Regelenergie.';
    }
    document.getElementById('hd-konfig').innerHTML =
      (hinweis ? '<span class="hd-konfig-hinweis">' + hinweis + '</span>' : '') +
      '<strong>' + kwhText(konf.kwh) + ' · ' + konf.kw + ' kW</strong> — ' + aufbau +
      ' <span class="hd-konfig-last">Benötigt am Anschluss mindestens ' + konf.kw + ' kW Dauerlast. ' +
      '<span class="hd-konfig-markt">' + markttext + '</span></span>';
  }

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function datenDA() { return konf.da.slice(); }
  function datenFCR() { return MONATE.map(function (x) { return Math.round(x.fcr / 1000 * konf.kw); }); }
  function daJahr() { return konf.da.reduce(function (a, b) { return a + b; }, 0) * 365 / DA_TAGE; }
  function fcrJahr() { return FCR_PRO_MW / 1000 * konf.kw * 365 / FCR_TAGE; }

  // Werte an die 3D-Bühne durchreichen
  function meldeBuehne() {
    window.__ertragDaten = { da: datenDA(), fcr: datenFCR(), zeigeFcr: markt === 'dafcr' };
    window.dispatchEvent(new CustomEvent('ertrag:update', { detail: window.__ertragDaten }));
  }

  function zahlen() {
    meldeBuehne();
    var da = daJahr(), fcr = fcrJahr();
    document.getElementById('hd-da').textContent = euro.format(da);
    var box = document.getElementById('hd-fcr-box');
    var lbl = document.getElementById('hd-year-lbl');
    document.getElementById('hd-fcr-lbl').textContent = 'davon vorgehaltene Regelleistung, ' + konf.kw + ' kW';
    if (markt === 'dafcr') {
      box.hidden = false;
      document.getElementById('hd-fcr').textContent = euro.format(fcr);
      document.getElementById('hd-year').textContent =
        euro.format(Math.max(da, fcr)) + ' – ' + euro.format(da + fcr);
      lbl.textContent = 'pro Jahr, je nach Aufteilung zwischen beiden Märkten';
    } else {
      box.hidden = true;
      document.getElementById('hd-year').textContent = euro.format(da);
      lbl.textContent = 'Ertrag pro Jahr am Day-Ahead-Markt';
    }
  }

  function tabelle() {
    var tb = document.getElementById('hd-tbody');
    if (!tb) return;
    var fcr = datenFCR();
    tb.innerHTML = MONATE.map(function (x, i) {
      return '<tr><th scope="row">' + x.m + (x.tage < 28 ? ' <small>(' + x.tage + ' Tage)</small>' : '') + '</th>' +
        '<td>' + ct(x.laden) + '</td><td>' + ct(x.liefern) + '</td>' +
        '<td>' + euro.format(konf.da[i]) + '</td>' +
        '<td>' + euro.format(fcr[i]) + '</td>' +
        '<td>' + x.negTage + ' von ' + x.tage + '</td></tr>';
    }).join('');
  }

  var chart = null;
  function zeichne() {
    var cv = document.getElementById('hd-chart');
    if (!cv || typeof Chart === 'undefined') return;
    var gold = css('--gold-500', '#D3AF3C');
    var gruen = css('--green-700', '#245145');
    var tinte = css('--ink-soft', '#4a5a54');
    var fcrLabel = 'Regelleistung, ' + konf.kw + ' kW';

    if (chart) {
      chart.data.datasets[0].data = datenDA();
      chart.data.datasets[1].data = datenFCR();
      chart.data.datasets[1].label = fcrLabel;
      chart.data.datasets[1].hidden = markt !== 'dafcr';
      chart.update();
      return;
    }

    Chart.defaults.font.family = 'Outfit, system-ui, sans-serif';
    Chart.defaults.color = tinte;

    chart = new Chart(cv, {
      data: {
        labels: MONATE.map(function (x) { return x.tage < 28 ? x.m + '*' : x.m; }),
        datasets: [
          {
            type: 'bar', label: 'Day-Ahead-Handel', data: datenDA(), stack: 'e', yAxisID: 'y',
            backgroundColor: MONATE.map(function (x) { return x.tage < 28 ? 'rgba(211,175,60,.45)' : gold; }),
            borderRadius: 5, order: 3
          },
          {
            type: 'bar', label: fcrLabel, data: datenFCR(), stack: 'e', yAxisID: 'y',
            backgroundColor: MONATE.map(function (x) { return x.tage < 28 ? 'rgba(36,81,69,.45)' : gruen; }),
            borderRadius: 5, order: 3, hidden: markt !== 'dafcr'
          },
          {
            type: 'line', label: 'Ø Lieferpreis', yAxisID: 'y1',
            data: MONATE.map(function (x) { return x.liefern; }),
            borderColor: '#1d6b52', borderWidth: 2.6, pointRadius: 2.5, tension: .35, fill: false, order: 1
          },
          {
            type: 'line', label: 'Ø Ladepreis', yAxisID: 'y1',
            data: MONATE.map(function (x) { return x.laden; }),
            borderColor: '#B24A30', borderWidth: 2.2, borderDash: [5, 4],
            pointRadius: 2.5, tension: .35, fill: false, order: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } },
          tooltip: {
            callbacks: {
              afterTitle: function (items) {
                var x = MONATE[items[0].dataIndex];
                return x.tage + ' Tage · ' + x.negTage + ' mit Gratis-Ladefenster';
              },
              label: function (c) {
                if (c.dataset.yAxisID === 'y1') return c.dataset.label + ': ' + ct(c.parsed.y) + '/kWh';
                return c.dataset.label + ': ' + euro.format(c.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            position: 'left', beginAtZero: true, stacked: true,
            title: { display: true, text: 'Ertrag je Monat (€)' },
            ticks: { callback: function (v) { return ganz.format(v) + ' €'; } },
            grid: { color: 'rgba(0,0,0,.07)' }
          },
          y1: {
            position: 'right', title: { display: true, text: 'Preis (ct/kWh)' },
            ticks: { callback: function (v) { return v + '\u00a0ct'; } },
            grid: { drawOnChartArea: false }
          },
          x: { stacked: true, grid: { display: false } }
        }
      }
    });
  }

  function aktualisieren() {
    merkeInAdresse(); auswahlZeichnen(); zahlen(); tabelle(); zeichne();
    hinweis = '';
  }

  // Ereignisdelegation: die Chips werden bei jedem Wechsel neu erzeugt
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest('.hd-chip');
    if (!b) return;
    hinweis = '';
    if (b.dataset.kap) {
      var kwh = +b.dataset.kap;
      var moegl = leistungenFuer(kwh);
      // Leistung behalten, wenn es sie für diese Größe gibt, sonst die kleinste
      konf = finde(kwh, moegl.indexOf(konf.kw) > -1 ? konf.kw : moegl[0]);
      aktualisieren();
      var ziel = kapBox.querySelector('[data-kap="' + kwh + '"]'); if (ziel) ziel.focus();
    } else if (b.dataset.wr) {
      konf = finde(konf.kwh, +b.dataset.wr);
      aktualisieren();
      var z2 = wrBox.querySelector('[data-wr="' + b.dataset.wr + '"]'); if (z2) z2.focus();
    } else if (b.dataset.markt) {
      markt = b.dataset.markt;
      if (markt === 'dafcr' && konf.nurDa) {
        var alt = konf;
        konf = naechsteFreigegebene(alt);
        hinweis = kwhText(alt.kwh) + ' + ' + alt.kw + ' kW ist ein reiner Day-Ahead-Speicher. ' +
          'Für den Regelenergiemarkt zeige ich die nächste freigegebene Konfiguration.';
      }
      aktualisieren();
    }
  });

  if (suche.has('kwh') || suche.has('markt')) merkeInAdresse();
  auswahlZeichnen();
  zahlen();
  tabelle();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { zeichne(); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(wrap);
  } else {
    zeichne();
  }
})();
