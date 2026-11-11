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
  const hoechst1 = (p) => Math.max(0, REGELN.hoechst1Start - REGELN.hoechst1Schritt * p);

  /* Förderhöchstbetrag des Gebäudes für n Wohneinheiten. */
  function hoechstbetrag(n, p) {
    n = Math.max(1, n | 0);
    return hoechst1(p)
      + REGELN.hoechst2bis6 * Math.min(n - 1, 5)
      + REGELN.hoechstAb7 * Math.max(n - 6, 0);
  }

  /* Bekommt der Tausch dieser Heizung den Klimageschwindigkeitsbonus?
     Ergebnis: true, false oder null (Angabe fehlt noch). */
  function heizungMitBonus(heizung, datum) {
    if (!heizung || !heizung.art) return null;
    if (heizung.laeuft === false) return false;
    const tag = datum instanceof Date ? datum : new Date(datum, 0, 1);
    let artOk = REGELN.kgbOhneAlter.includes(heizung.art);
    if (REGELN.kgbAb20Jahren.includes(heizung.art)) {
      if (heizung.inbetriebnahme) {
        const [y,m,d] = heizung.inbetriebnahme.split('-').map(Number);
        const start = new Date(y,m-1,d);
        if (!y || !m || !d || start.getFullYear() !== y || start.getMonth() !== m-1 || start.getDate() !== d || start > tag) return null;
        // Datum statt bloßer Jahresdifferenz; Schaltjahre kalendergenau behandeln.
        const grenze = new Date(tag.getFullYear()-20,tag.getMonth(),tag.getDate());
        artOk = start <= grenze;
      } else if (heizung.baujahr) {
        const alter = tag.getFullYear()-heizung.baujahr;
        if (alter === 20) return null;
        artOk = alter > 20;
      } else return null;
    }
    if (!artOk) return false;
    return heizung.laeuft == null ? null : true;
  }

  function einkommensStufe(e) {
    if (e.einkommen !== undefined) {
      if (e.einkommen === null || e.einkommen === '' || !Number.isFinite(Number(e.einkommen))) return null;
      const wert = Number(e.einkommen) - (e.kind === true ? REGELN.familienzuschlag : 0);
      return REGELN.stufen.findIndex(s => s.bis === null || wert <= s.bis);
    }
    return Number.isInteger(e.stufe) && e.stufe >= 0 && e.stufe <= 3 ? e.stufe : null;
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
    const kosten = Number.isFinite(Number(eingabe.kosten)) ? Math.max(0, Number(eingabe.kosten)) : 0;
    const ausgeschlossen = eingabe.voraussetzungen === false || kosten < 300;
    const foerderfaehig = ausgeschlossen ? 0 : Math.min(kosten, hoechst);
    const jeEinheit = foerderfaehig / n;
    const kgbHeizung = heizungMitBonus(eingabe.heizung, datum);
    const kgb = kgbSatz(p);
    const offen = new Set();
    if (kgbHeizung === null && kgb > 0 && eingabe.einheiten.some(e => e.selbst)) offen.add('heizung');
    if (eingabe.voraussetzungen == null) offen.add('voraussetzungen');
    if (kosten < 300) offen.add('mindestkosten');

    const einheiten = eingabe.einheiten.map((e, i) => {
      if (!e.selbst) {
        return { nr: i + 1, selbst: false, grund: REGELN.grund, kgb: 0, eink: 0, satz: REGELN.grund, deckel: REGELN.deckel, zuschuss: jeEinheit * REGELN.grund / 100 };
      }
      if (e.kind == null) offen.add('kind');
      const ermittelteStufe = einkommensStufe(e);
      if (ermittelteStufe == null) offen.add('einkommen');
      const k = kgbHeizung ? kgb : 0;
      const stufe = ermittelteStufe == null ? 3 : ermittelteStufe;
      const roh = REGELN.stufen[stufe].bonus;
      const deckel = stufe === 0 ? REGELN.deckelNiedrig : REGELN.deckel;
      // Deckel greift von oben: zuerst wird der Einkommensbonus gekürzt
      const kGek = Math.min(k, deckel - REGELN.grund);
      const eGek = Math.max(0, Math.min(roh, deckel - REGELN.grund - kGek));
      const satz = REGELN.grund + kGek + eGek;
      return { nr: i + 1, selbst: true, grund: REGELN.grund, kgb: kGek, eink: eGek, satz, deckel, gedeckelt: REGELN.grund + k + roh > deckel, zuschuss: jeEinheit * satz / 100 };
    });

    if (ausgeschlossen) einheiten.forEach(e => { e.grund = 0; e.kgb = 0; e.eink = 0; e.satz = 0; e.zuschuss = 0; });
    const zuschuss = einheiten.reduce((s, e) => s + e.zuschuss, 0);
    const mittel = (f) => einheiten.reduce((s, e) => s + e[f], 0) / n;
    const deckel = einheiten.some((e) => e.selbst) ? Math.max(...einheiten.filter((e) => e.selbst).map((e) => e.deckel)) : REGELN.deckel;

    return {
      ausgeschlossen,
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
      satz: mittel('satz'),
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

  const api = { REGELN, periode, stichtag, kgbSatz, hoechst1, hoechstbetrag, heizungMitBonus, einkommensStufe, rechne, naechsteAbsenkung, stufenTexte };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Foerderlogik = api;
})(typeof window !== 'undefined' ? window : globalThis);
