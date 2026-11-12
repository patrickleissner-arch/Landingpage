const assert = require('node:assert/strict');
const M = require('../agnes-kostenrechner/model.js');

const basis = () => ({
  kwh: 100000, peak: 80,
  heute: { lpNiedrig: 25, apNiedrig: 7, lpHoch: 140, apHoch: 2.5 },
  agnes: { kp: 100, ap1: 2.5, ap2Faktor: 300, start: 2029 },
  speicher: { P: 40, E: 80, eta: 0.9, ibn: 2029, eigenesEntgelt: true, entgelt: 5.14, sonst: 0, invest: 0 },
  steigerung: 0, startjahr: 2029,
});
const nah = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

// Heutige Systematik, beide Preisklassen
let h = M.kostenHeute(80, 100000, basis().heute);
assert.equal(h.klasse, 'unter 2.500 h'); nah(h.summe, 80 * 25 + 7000, 1e-6);
h = M.kostenHeute(30, 100000, basis().heute);
assert.equal(h.klasse, 'ab 2.500 h'); nah(h.summe, 30 * 140 + 2500, 1e-6);

// AgNes: 4 Viertelstunden, Bestellung 10 kW, eine Stunde im Jahr hochgerechnet
const netz = Float32Array.from([5, 10, 20, 10]);
let a = M.kostenAgnes(netz, 0.25, 1, 10, { kp: 100, ap1: 2, ap2Faktor: 300 });
nah(a.kapazitaet, 1000, 1e-6); nah(a.kwhUeber, 2.5, 1e-6);
nah(a.ap1, (5 + 10 + 10 + 10) * 0.25 * 0.02, 1e-6); nah(a.ap2, 2.5 * 0.06, 1e-6);

// Beispielprofil trifft Verbrauch und Spitze
const p = M.beispielprofil(100000, 80), k = M.kennzahlen(p, 0.25);
nah(k.peak, 80, 0.01); nah(k.kwh, 100000, 150);

// Speicher: Grenze wird gehalten, Energie nur um Verluste höher
const g = M.kleinsteGrenze(p, 0.25, 40, 80, 0.9);
assert.ok(g < 80 && g >= 40);
const n2 = M.speicherbetrieb(p, 0.25, g, 40, 80, 0.9), k2 = M.kennzahlen(n2, 0.25);
assert.ok(k2.peak <= g + 1e-3); assert.ok(k2.kwh >= k.kwh && k2.kwh < k.kwh * 1.03);
assert.equal(M.kleinsteGrenze(p, 0.25, 0, 0, 0.9), k.peak);

// Gesamtrechnung
let r = M.berechne(basis());
assert.equal(r.beispiel, true);
for (const n of [3, 5, 10, 20]) {
  const s = r.horizonte[n];
  nah(s.referenz, r.heuteOhne.summe * n, 1e-3);
  nah(s.ohne, r.agnesOhne.summe * n, 1e-3);
  nah(s.wertSchutz, 5.14 * 40 * n, 1e-3);
  assert.ok(s.mitSchutz < s.ohne);
}
assert.ok(r.agnesOhne.bestell <= 80 + 1e-9 && r.agnesOhne.bestell >= 8 - 1e-9);
assert.ok(r.agnesMit.summe <= r.agnesOhne.summe);

// Vor 2029 gilt die heutige Systematik
let e = basis(); e.startjahr = 2027; e.speicher.ibn = 2027;
r = M.berechne(e);
nah(r.jahre[0].ohne, r.heuteOhne.summe, 1e-6); assert.equal(r.jahre[0].entgelt, 0);
nah(r.jahre[2].ohne, r.agnesOhne.summe, 1e-6);
nah(r.horizonte[3].wertSchutz, 5.14 * 40, 1e-3);
// Schutz endet 20 Jahre nach Inbetriebnahme (2027 + 20 = 2047 liegt außerhalb der 20 Jahre ab 2027)
assert.equal(r.jahre[19].mitSchutz < r.jahre[19].mitOhneSchutz, true);

// Inbetriebnahme nach der Frist: kein Bestandsschutz
e = basis(); e.speicher.ibn = 2030; r = M.berechne(e);
assert.equal(r.schutzMoeglich, false); nah(r.horizonte[20].wertSchutz, 0, 1e-6);
// Ohne eigenes Speicherentgelt: kein Unterschied
e = basis(); e.speicher.eigenesEntgelt = false; nah(M.berechne(e).horizonte[20].wertSchutz, 0, 1e-6);
// Ohne Speicher
e = basis(); e.speicher.P = 0; r = M.berechne(e);
nah(r.horizonte[5].ersparnisSpeicher, 0, 1e-6);
// Preissteigerung
e = basis(); e.steigerung = 3; r = M.berechne(e);
nah(r.jahre[0].referenz, r.heuteOhne.summe * Math.pow(1.03, 3), 1e-6);
// Amortisation
e = basis(); e.speicher.invest = 1000; r = M.berechne(e);
assert.ok(r.amortisation > 0 && r.amortisation < 20);
// Ungültige Eingaben
for (const f of [x => { x.kwh = NaN; }, x => { x.peak = 0; }, x => { x.kwh = 1e6; x.peak = 10; }, x => { x.agnes.ap2Faktor = 50; }, x => { x.speicher.eta = 1.2; }]) {
  e = basis(); f(e); assert.throws(() => M.berechne(e), RangeError);
}

// Lastgang-Import: deutsches Format, kWh je Viertelstunde
let csv = 'Datum;Zeit;Wert (kWh);Status\n';
for (let i = 0; i < 96; i++) csv += `01.01.2025;${String(Math.floor(i / 4)).padStart(2, '0')}:${String(i % 4 * 15).padStart(2, '0')};${(2 + i / 100).toFixed(2).replace('.', ',')};1\n`;
let l = M.leseLastgang(csv);
assert.equal(l.zeilen, 96); assert.equal(l.einheit, 'kWh'); assert.equal(l.spalte, 3); nah(l.werte[10], 2.1, 1e-5);
nah(M.inKw(l.werte, 'kWh', 15)[10], 8.4, 1e-4);
// Englisches Format mit Komma als Trenner
csv = 'timestamp,kW\n'; for (let i = 0; i < 20; i++) csv += `2025-01-01 00:${i},${(10.5 + i).toFixed(1)}\n`;
l = M.leseLastgang(csv); assert.equal(l.einheit, 'kW'); nah(l.werte[1], 11.5, 1e-5);
// Tausenderpunkt mit Dezimalkomma
csv = 'Zeit;kW\n'; for (let i = 0; i < 20; i++) csv += `01.01.2025 00:${i};1.2${i % 10}0,5\n`;
nah(M.leseLastgang(csv).werte[3], 1230.5, 1e-3);
assert.throws(() => M.leseLastgang('a;b\nc;d'));
// Lastgang in der Gesamtrechnung, Teiljahr wird hochgerechnet
e = basis(); e.last = p.slice(0, 96 * 182); e.dt = 0.25; r = M.berechne(e);
assert.equal(r.beispiel, false); nah(r.kennzahlen.faktor, 365 / 182, 1e-6);

console.log('PASS: Preisklassen heute, AgNes-Abrechnung, Beispielprofil, Speicherbetrieb, Horizonte 3/5/10/20, Regimewechsel 2029, Bestandsschutz, Eingabefehler, Lastgang-Import.');
