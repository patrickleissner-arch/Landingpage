/* ==========================================================================
   foerderlogik.js: Rechenregeln der KfW-Heizungsförderung 458 für
   Wärmepumpen (Privatpersonen, Wohngebäude).

   Quelle: KfW-Merkblatt 458, Stand 09/2026 (Bestellnummer 600 000 5131).
   Ändert die KfW ihre Sätze, wird NUR die Tabelle REGELN angepasst.

   Maßgeblich ist immer das Datum des Antragseingangs bei der KfW.
   Reine Funktionen ohne DOM, damit sie sich mit Node prüfen lassen:
     node -e "const L=require('./assets/js/foerderlogik.js'); ..."
   ========================================================================== */
(function (root) {
  'use strict';

  const REGELN = {
    quelle: 'KfW-Merkblatt 458, Stand 09/2026',
    grund: 30,
    // Klimageschwindigkeitsbonus: 16 %, ab 01.02.2027 halbjährlich (01.02./01.08.) minus 4 Punkte
    kgbStart: 16,
    kgbSchritt: 4,
    // Förderhöchstbetrag 1. Wohneinheit: 28.000 €, ab 01.02.2027 halbjährlich minus 750 €
    hoechst1Start: 28000,
    hoechst1Schritt: 750,
    hoechst2bis6: 15000,
    hoechstAb7: 8000,
    deckel: 70,
    deckelNiedrig: 80, // Einkommen bis 30.000 € (mit Kind: bis 40.000 €)
    // Einkommensstufen: Index 0..3, Grenzen ohne Familienzuschlag
    stufen: [
      { bis: 30000, bonus: 40 },
      { bis: 40000, bonus: 30 },
      { bis: 50000, bonus: 10 },
      { bis: null, bonus: 0 },
    ],
    familienzuschlag: 10000,
    // erster Stichtag der Absenkung: 01.02.2027
    ersterStichtag: { jahr: 2027, monat: 1 },
    // Heizungen, für deren Tausch der Bonus unabhängig vom Alter gilt
    kgbOhneAlter: ['oel', 'kohle', 'gasetage', 'nachtspeicher'],
    // Heizungen, deren Inbetriebnahme mindestens 20 Jahre zurückliegen muss
    kgbAb20Jahren: ['gas', 'biomasse'],
    mindestalter: 20,
  };

  /* Halbjahresperiode des Antrags: 0 bis 31.01.2027, 1 ab 01.02.2027,
     2 ab 01.08.2027, 3 ab 01.02.2028 ... */
  function periode(datum) {
    const s = REGELN.ersterStichtag;
    if (datum < new Date(s.jahr, s.monat, 1)) return 0;
    const j = datum.getFullYear(), m = datum.getMonth();
    return (j - s.jahr) * 2 + (m >= 7 ? 2 : m >= 1 ? 1 : 0);
  }

  /* Erster Tag der Periode p (p >= 1). */
  function stichtag(p) {
    const s = REGELN.ersterStichtag, k = p - 1;
    return new Date(s.jahr + Math.floor(k / 2), k % 2 === 0 ? 1 : 7, 1);
  }

  const kgbSatz = (p) => Math.max(0, REGELN.kgbStart - REGELN.kgbSchritt * p);
  const hoechst1 = (p) => REGELN.hoechst1Start - REGELN.hoechst1Schritt * p;

  /* Förderhöchstbetrag des Gebäudes für n Wohneinheiten. */
  function hoechstbetrag(n, p) {
    n = Math.max(1, n | 0);
    return hoechst1(p)
      + REGELN.hoechst2bis6 * Math.min(n - 1, 5)
      + REGELN.hoechstAb7 * Math.max(n - 6, 0);
  }

  /* Bekommt der Tausch dieser Heizung den Klimageschwindigkeitsbonus?
     Ergebnis: true, false oder null (Angabe fehlt noch). */
  function heizungMitBonus(heizung, jahr) {
    if (!heizung || !heizung.art) return null;
    if (heizung.laeuft === false) return false;
    let artOk;
    if (REGELN.kgbOhneAlter.includes(heizung.art)) artOk = true;
    else if (REGELN.kgbAb20Jahren.includes(heizung.art)) {
      if (!heizung.baujahr) return null;
      artOk = jahr - heizung.baujahr >= REGELN.mindestalter;
    } else artOk = false;
    if (!artOk) return false;
    if (heizung.laeuft == null) return null;
    return true;
  }

  /* Hauptrechnung.
     eingabe = {
       kosten: Zahl (brutto),
       einheiten: [{ selbst: true|false, kind: true|false|null, stufe: 0..3|null }],
       heizung: { art, baujahr, laeuft },
     }
     datum = Datum des Antrags (Standard: heute) */
  function rechne(eingabe, datum) {
    datum = datum || new Date();
    const p = periode(datum);
    const jahr = datum.getFullYear();
    const n = Math.max(1, eingabe.einheiten.length);
    const hoechst = hoechstbetrag(n, p);
    const kosten = Math.max(0, Number(eingabe.kosten) || 0);
    const foerderfaehig = Math.min(kosten, hoechst);
    const jeEinheit = foerderfaehig / n;
    const kgbHeizung = heizungMitBonus(eingabe.heizung, jahr);
    const kgb = kgbSatz(p);
    const offen = new Set();
    if (kgbHeizung === null) offen.add('heizung');

    const einheiten = eingabe.einheiten.map((e, i) => {
      if (!e.selbst) {
        return { nr: i + 1, selbst: false, grund: REGELN.grund, kgb: 0, eink: 0, satz: REGELN.grund, deckel: REGELN.deckel, zuschuss: jeEinheit * REGELN.grund / 100 };
      }
      if (e.kind == null) offen.add('kind');
      if (e.stufe == null) offen.add('einkommen');
      const k = kgbHeizung ? kgb : 0;
      const stufe = e.stufe == null ? 3 : e.stufe;
      const roh = REGELN.stufen[stufe].bonus;
      const deckel = stufe === 0 ? REGELN.deckelNiedrig : REGELN.deckel;
      // Deckel greift von oben: zuerst wird der Einkommensbonus gekürzt
      const kGek = Math.min(k, deckel - REGELN.grund);
      const eGek = Math.max(0, Math.min(roh, deckel - REGELN.grund - kGek));
      const satz = REGELN.grund + kGek + eGek;
      return { nr: i + 1, selbst: true, grund: REGELN.grund, kgb: kGek, eink: eGek, satz, deckel, gedeckelt: REGELN.grund + k + roh > deckel, zuschuss: jeEinheit * satz / 100 };
    });

    const zuschuss = einheiten.reduce((s, e) => s + e.zuschuss, 0);
    const mittel = (f) => einheiten.reduce((s, e) => s + e[f], 0) / n;
    const deckel = einheiten.some((e) => e.selbst) ? Math.max(...einheiten.filter((e) => e.selbst).map((e) => e.deckel)) : REGELN.deckel;

    return {
      periode: p,
      datum,
      kgbSatz: kgb,
      kgbHeizung,
      hoechst,
      hoechst1: hoechst1(p),
      kosten,
      foerderfaehig,
      jeEinheit,
      einheiten,
      zuschuss,
      satz: foerderfaehig > 0 ? (zuschuss / foerderfaehig) * 100 : mittel('satz'),
      anteil: kosten > 0 ? (zuschuss / kosten) * 100 : 0,
      schichten: { grund: mittel('grund'), kgb: mittel('kgb'), eink: mittel('eink'), deckel },
      offen: [...offen],
    };
  }

  /* Was ändert sich beim nächsten Stichtag für genau diese Eingaben? */
  function naechsteAbsenkung(eingabe, datum) {
    datum = datum || new Date();
    const p = periode(datum);
    const tag = stichtag(p + 1);
    const jetzt = rechne(eingabe, datum);
    const dann = rechne(eingabe, tag);
    const fristEnde = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate() - 1);
    return {
      stichtag: tag,
      fristEnde,
      jetzt,
      dann,
      verlust: Math.max(0, Math.round(jetzt.zuschuss) - Math.round(dann.zuschuss)),
      kgbVerlust: jetzt.schichten.kgb - dann.schichten.kgb,
    };
  }

  /* Bezeichnung der Einkommensstufen, mit oder ohne Familienzuschlag. */
  function stufenTexte(mitKind) {
    const plus = mitKind ? REGELN.familienzuschlag : 0;
    const f = (v) => (v + plus).toLocaleString('de-DE') + ' €';
    const s = REGELN.stufen;
    return [`bis ${f(s[0].bis)}`, `bis ${f(s[1].bis)}`, `bis ${f(s[2].bis)}`, `mehr als ${f(s[2].bis)}`];
  }

  const api = { REGELN, periode, stichtag, kgbSatz, hoechst1, hoechstbetrag, heizungMitBonus, rechne, naechsteAbsenkung, stufenTexte };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Foerderlogik = api;
})(typeof window !== 'undefined' ? window : globalThis);
