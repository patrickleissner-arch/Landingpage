/* ============================================================
   model.js: Rechenkern des AgNes-Kostenrechners (/agnes-kostenrechner).
   Ohne DOM, mit Node prüfbar: node tools/agnes-kosten.test.cjs

   Rechtsstand: Festlegungsentwurf AgNes der Bundesnetzagentur vom
   06.08.2026 (GBK-25-01-1#3). Die Preise der neuen Systematik stehen
   erst mit den Preisblättern (voraussichtlich Oktober 2028) fest;
   alle AgNes-Preise hier sind Annahmen des Anwenders.
   ============================================================ */
(function (root) {
  'use strict';

  const STUNDEN_JAHR = 8760;
  const PREISBASIS = 2026;          // Preisstand der eingegebenen Werte
  const HORIZONTE = [3, 5, 10, 20];
  const SCHUTZ_JAHRE = 20;          // Befreiung nach § 118 Abs. 6 EnWG ab Inbetriebnahme
  const IBN_FRIST_JAHR = 2029;      // Inbetriebnahme bis 04.08.2029

  function zufall(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Beispielprofil eines Gewerbebetriebs (Viertelstunden, ein Jahr),
     skaliert auf Jahresverbrauch und Jahreshöchstleistung. Ersetzt
     keinen gemessenen Lastgang. */
  function beispielprofil(kwh, peak, seed) {
    const n = 365 * 96, x = new Float32Array(n), r = zufall(seed || 7);
    let max = 0;
    for (let d = 0; d < 365; d++) {
      const saison = 1 + 0.12 * Math.cos(2 * Math.PI * (d - 15) / 365);
      const wochenende = d % 7 >= 5;
      const spitze = !wochenende && r() < 0.45;
      const start = (r() < 0.7 ? 26 : 44) + Math.floor(r() * 8);
      const dauer = 2 + Math.floor(r() * 5);
      const hoehe = 0.62 + 0.38 * r();
      for (let q = 0; q < 96; q++) {
        const h = q / 4;
        let basis;
        if (wochenende) basis = 0.13;
        else if (h < 5.5) basis = 0.12;
        else if (h < 7) basis = 0.12 + (h - 5.5) / 1.5 * 0.30;
        else if (h < 16.5) basis = 0.42;
        else if (h < 18.5) basis = 0.42 - (h - 16.5) / 2 * 0.28;
        else basis = 0.14;
        let v = basis * saison * (0.9 + 0.2 * r());
        if (spitze && q >= start && q < start + dauer) v = Math.max(v, hoehe * (0.9 + 0.1 * r()));
        x[d * 96 + q] = v;
        if (v > max) max = v;
      }
    }
    for (let i = 0; i < n; i++) x[i] /= max;
    const ziel = Math.min(0.95, kwh / STUNDEN_JAHR / peak);
    let lo = 0.05, hi = 12;
    for (let k = 0; k < 40; k++) {
      const g = (lo + hi) / 2;
      let s = 0;
      for (let i = 0; i < n; i++) s += Math.pow(x[i], g);
      if (s / n > ziel) lo = g; else hi = g;
    }
    const g = (lo + hi) / 2, out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = peak * Math.pow(x[i], g);
    return out;
  }

  function kennzahlen(last, dt) {
    let max = 0, sum = 0;
    for (let i = 0; i < last.length; i++) { const v = last[i]; sum += v; if (v > max) max = v; }
    const stunden = last.length * dt;
    const faktor = STUNDEN_JAHR / stunden;       // Hochrechnung auf ein Jahr
    const kwh = sum * dt * faktor;
    return { peak: max, kwh, faktor, tage: stunden / 24, benutzungsstunden: max > 0 ? kwh / max : 0 };
  }

  /* Speicherbetrieb: Netzbezug wird auf `grenze` gehalten, solange
     Leistung und Füllstand reichen; darunter lädt der Speicher nach. */
  function speicherbetrieb(last, dt, grenze, P, E, eta) {
    const n = last.length, netz = new Float32Array(n);
    if (!(P > 0) || !(E > 0)) { netz.set(last); return netz; }
    let soc = E;
    for (let i = 0; i < n; i++) {
      const l = last[i];
      if (l > grenze) {
        const d = Math.min(l - grenze, P, soc / dt);
        soc -= d * dt; netz[i] = l - d;
      } else {
        const c = Math.min(grenze - l, P, (E - soc) / (dt * eta));
        soc += c * dt * eta; netz[i] = l + c;
      }
    }
    return netz;
  }

  /* Kleinste Grenze, die der Speicher im ganzen Zeitraum halten kann. */
  function kleinsteGrenze(last, dt, P, E, eta) {
    let peak = 0;
    for (let i = 0; i < last.length; i++) if (last[i] > peak) peak = last[i];
    if (!(P > 0) || !(E > 0)) return peak;
    let lo = Math.max(0, peak - P), hi = peak;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2, netz = speicherbetrieb(last, dt, mid, P, E, eta);
      let ok = true;
      for (let i = 0; i < netz.length; i++) if (netz[i] > mid + 1e-6) { ok = false; break; }
      if (ok) hi = mid; else lo = mid;
    }
    return hi;
  }

  /* Heutige Systematik: Jahresleistungspreis auf die höchste Viertelstunde,
     Preisklasse nach Benutzungsstunden (Grenze 2.500 h). */
  function kostenHeute(peak, kwh, t) {
    const stunden = peak > 0 ? kwh / peak : 0, hoch = stunden >= 2500;
    const lp = hoch ? t.lpHoch : t.lpNiedrig, ap = hoch ? t.apHoch : t.apNiedrig;
    const leistung = peak * lp, arbeit = kwh * ap / 100;
    return { summe: leistung + arbeit, leistung, arbeit, klasse: hoch ? 'ab 2.500 h' : 'unter 2.500 h', stunden, lp, ap };
  }

  /* AgNes-Entwurf: Kapazitätspreis auf die Bestellkapazität, AP1 auf
     Mengen bis zur Bestellkapazität, AP2 (200–350 % des AP1) auf die
     Mengen darüber, je Viertelstunde. */
  function kostenAgnes(netz, dt, faktor, bestell, a) {
    let innen = 0, ueber = 0;
    for (let i = 0; i < netz.length; i++) {
      const v = netz[i];
      if (v > bestell) { innen += bestell; ueber += v - bestell; } else innen += v;
    }
    innen *= dt * faktor; ueber *= dt * faktor;
    const kapazitaet = bestell * a.kp, ap1 = innen * a.ap1 / 100, ap2 = ueber * a.ap1 * a.ap2Faktor / 10000;
    return { summe: kapazitaet + ap1 + ap2, kapazitaet, ap1, ap2, bestell, kwhUeber: ueber, kwh: innen + ueber };
  }

  /* Günstigste Bestellkapazität zwischen 10 % der Vorjahresspitze und
     der Spitze. Mit Speicher wird die Kappgrenze mitoptimiert. */
  function besteBestellung(last, dt, faktor, a, sp, peak) {
    const unten = 0.1 * peak, schritte = 60;
    let best = null;
    for (let k = 0; k <= schritte; k++) {
      const b = unten + (peak - unten) * k / schritte;
      const netz = sp ? speicherbetrieb(last, dt, b, sp.P, sp.E, sp.eta) : last;
      const c = kostenAgnes(netz, dt, faktor, b, a);
      if (!best || c.summe < best.summe) best = c;
    }
    return best;
  }

  function pruefe(e) {
    const zahl = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
    const f = [];
    if (!zahl(e.kwh, 1, 1e9)) f.push('Jahresverbrauch fehlt oder ist unplausibel.');
    if (!zahl(e.peak, 0.1, 1e6)) f.push('Jahreshöchstleistung fehlt oder ist unplausibel.');
    if (zahl(e.kwh, 1, 1e9) && zahl(e.peak, 0.1, 1e6) && e.kwh / e.peak > STUNDEN_JAHR) f.push('Der Verbrauch passt nicht zur Spitze: mehr als 8.760 Benutzungsstunden.');
    for (const k of ['lpNiedrig', 'apNiedrig', 'lpHoch', 'apHoch']) if (!zahl(e.heute[k], 0, 10000)) f.push('Heutige Netzentgelte unvollständig.');
    if (!zahl(e.agnes.kp, 0, 10000) || !zahl(e.agnes.ap1, 0, 1000)) f.push('AgNes-Annahmen unvollständig.');
    if (!zahl(e.agnes.ap2Faktor, 100, 1000)) f.push('AP2 muss als Prozent des AP1 angegeben werden (Entwurf: 200 bis 350).');
    if (!zahl(e.speicher.P, 0, 1e6) || !zahl(e.speicher.E, 0, 1e7)) f.push('Speicherdaten unvollständig.');
    if (!zahl(e.speicher.eta, 0.5, 1)) f.push('Wirkungsgrad zwischen 50 und 100 % angeben.');
    if (!zahl(e.steigerung, -10, 20)) f.push('Jährliche Preissteigerung zwischen −10 und 20 % angeben.');
    if (f.length) { const err = new RangeError([...new Set(f)].join(' ')); err.meldungen = [...new Set(f)]; throw err; }
  }

  /* eingabe = {
       last?: Float32Array (kW), dt?: Stunden je Intervall,
       kwh, peak,                       // ohne Lastgang
       heute:  { lpNiedrig, apNiedrig, lpHoch, apHoch },   // €/kW/a, ct/kWh
       agnes:  { kp, ap1, ap2Faktor, start },              // €/kW/a, ct/kWh, %, Jahr
       speicher: { P, E, eta, ibn, eigenesEntgelt, entgelt, sonst, invest },
       steigerung: %/a, startjahr
     } */
  function berechne(eingabe) {
    const e = eingabe;
    let last = e.last, dt = e.dt || 0.25, beispiel = false, k;
    if (last && last.length) { k = kennzahlen(last, dt); e.kwh = k.kwh; e.peak = k.peak; }
    pruefe(e);
    if (!last || !last.length) { last = beispielprofil(e.kwh, e.peak); dt = 0.25; beispiel = true; k = kennzahlen(last, dt); }
    const sp = e.speicher, hatSpeicher = sp.P > 0 && sp.E > 0;
    const spArg = hatSpeicher ? { P: sp.P, E: sp.E, eta: sp.eta } : null;

    // Heutige Systematik
    const heuteOhne = kostenHeute(k.peak, k.kwh, e.heute);
    const grenze = kleinsteGrenze(last, dt, sp.P, sp.E, sp.eta);
    const netzHeute = speicherbetrieb(last, dt, grenze, sp.P, sp.E, sp.eta);
    const kMit = kennzahlen(netzHeute, dt);
    const heuteMit = kostenHeute(kMit.peak, kMit.kwh, e.heute);

    // AgNes
    const agnesOhne = besteBestellung(last, dt, k.faktor, e.agnes, null, k.peak);
    const agnesMit = hatSpeicher ? besteBestellung(last, dt, k.faktor, e.agnes, spArg, k.peak) : agnesOhne;

    const schutzMoeglich = sp.ibn <= IBN_FRIST_JAHR;
    const jahre = [];
    const max = Math.max.apply(null, HORIZONTE);
    for (let i = 0; i < max; i++) {
      const jahr = e.startjahr + i, esc = Math.pow(1 + e.steigerung / 100, jahr - PREISBASIS);
      const neu = jahr >= e.agnes.start, speicherDa = hatSpeicher && jahr >= sp.ibn;
      const referenz = heuteOhne.summe * esc;
      const ohne = (neu ? agnesOhne.summe : heuteOhne.summe) * esc;
      const netzMit = speicherDa ? (neu ? agnesMit.summe : heuteMit.summe) * esc : ohne;
      const entgelt = speicherDa && neu && sp.eigenesEntgelt ? (sp.entgelt * sp.P + sp.sonst) * esc : 0;
      const geschuetzt = schutzMoeglich && jahr < sp.ibn + SCHUTZ_JAHRE;
      jahre.push({ jahr, neu, referenz, ohne, mitOhneSchutz: netzMit + entgelt, mitSchutz: netzMit + (geschuetzt ? 0 : entgelt), entgelt });
    }
    const horizonte = {};
    for (const n of HORIZONTE) {
      const s = { referenz: 0, ohne: 0, mitOhneSchutz: 0, mitSchutz: 0 };
      for (let i = 0; i < n; i++) for (const key in s) s[key] += jahre[i][key];
      s.mehrkostenAgnes = s.ohne - s.referenz;
      s.ersparnisSpeicher = s.ohne - s.mitSchutz;
      s.wertSchutz = s.mitOhneSchutz - s.mitSchutz;
      horizonte[n] = s;
    }
    let amortisation = null;
    if (hatSpeicher && sp.invest > 0) {
      let kum = 0;
      for (let i = 0; i < jahre.length; i++) {
        const gewinn = jahre[i].ohne - jahre[i].mitSchutz;
        if (kum + gewinn >= sp.invest && gewinn > 0) { amortisation = i + (sp.invest - kum) / gewinn; break; }
        kum += gewinn;
      }
    }
    return {
      beispiel, last, dt, kennzahlen: k, hatSpeicher, schutzMoeglich,
      grenzeHeute: grenze, peakMit: kMit.peak,
      heuteOhne, heuteMit, agnesOhne, agnesMit,
      jahre, horizonte, amortisation,
      unterSchwelle: Math.round(k.kwh) < 100000,
    };
  }

  /* ---------- Lastgang einlesen (CSV/Text aus Netzbetreiber-Export) ---------- */
  const DATUM = /^\d{1,4}[.\-/]\d{1,2}[.\-/]\d{1,4}/;
  function zahlAus(zelle, kommaDezimal) {
    let s = zelle.trim().replace(/^"|"$/g, '').replace(/\s/g, '');
    if (!s || DATUM.test(s) || s.includes(':') || !/^-?[\d.,]+$/.test(s)) return NaN;
    if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (s.includes(',')) s = s.replace(',', '.');
    else if (kommaDezimal && /^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return Number(s);
  }

  function leseLastgang(text) {
    const zeilen = text.replace(/^﻿/, '').split(/\r?\n/).filter(z => z.trim());
    if (zeilen.length < 10) throw new Error('Die Datei enthält zu wenige Zeilen für einen Lastgang.');
    const probe = zeilen.slice(0, 50).join('\n');
    const trenner = [';', '\t', ','].map(t => [t, probe.split(t).length]).sort((a, b) => b[1] - a[1])[0][0];
    const kommaDezimal = trenner !== ',' && /\d,\d/.test(probe);
    const tabelle = zeilen.map(z => z.split(trenner));
    const breite = Math.max.apply(null, tabelle.slice(0, 50).map(z => z.length));
    const spalten = [];
    for (let c = 0; c < breite; c++) {
      let treffer = 0, summe = 0, ganz = 0;
      for (const z of tabelle) { const v = zahlAus(z[c] || '', kommaDezimal); if (Number.isFinite(v)) { treffer++; summe += v; if (Number.isInteger(v)) ganz++; } }
      if (treffer >= tabelle.length * 0.8) spalten.push({ c, treffer, summe, ganz });
    }
    if (!spalten.length) throw new Error('Keine Spalte mit Messwerten gefunden. Erwartet wird eine Zeile je Viertelstunde mit einem Wert in kW oder kWh.');
    // Statusspalten sind meist konstant oder ganzzahlig; die Messwertspalte hat Nachkommastellen.
    spalten.sort((a, b) => (a.ganz / a.treffer) - (b.ganz / b.treffer) || a.c - b.c);
    const wahl = spalten[0];
    const werte = [];
    let kopf = '';
    tabelle.forEach((z, i) => {
      const v = zahlAus(z[wahl.c] || '', kommaDezimal);
      if (Number.isFinite(v)) werte.push(Math.max(0, v)); else if (i < 5) kopf += ' ' + z.join(' ');
    });
    const einheit = /kwh/i.test(kopf) ? 'kWh' : /\bkw\b|leistung/i.test(kopf) ? 'kW' : null;
    const n = werte.length;
    const intervall = n > 30000 ? 15 : n > 15000 ? 30 : n > 8000 && n < 9000 ? 60 : 15;
    return { werte: Float32Array.from(werte), einheit, intervall, zeilen: n, spalte: wahl.c + 1, spaltenAnzahl: spalten.length };
  }

  /* Messwerte in kW umrechnen: kWh je Intervall → mittlere Leistung. */
  function inKw(werte, einheit, intervallMin) {
    if (einheit !== 'kWh') return werte;
    const f = 60 / intervallMin, out = new Float32Array(werte.length);
    for (let i = 0; i < werte.length; i++) out[i] = werte[i] * f;
    return out;
  }

  const api = { berechne, beispielprofil, kennzahlen, speicherbetrieb, kleinsteGrenze, kostenHeute, kostenAgnes, besteBestellung, leseLastgang, inKw, HORIZONTE, PREISBASIS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgnesKosten = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
