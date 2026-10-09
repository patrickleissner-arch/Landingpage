/* ==========================================================================
   foerderrechner.js: Oberfläche für /foerderrechner-waermepumpe.
   Die Regeln stehen in foerderlogik.js, die 3D-Säule in foerderturm.js
   (wird erst nachgeladen, wenn der Turm im Bild ist).
   Alle Angaben bleiben im Browser. Nichts wird gespeichert oder gesendet.
   ========================================================================== */
(() => {
  'use strict';
  const L = window.Foerderlogik;
  const form = document.getElementById('fr-form');
  if (!L || !form) return;

  const $ = (id) => document.getElementById(id);
  const eur = (v) => Math.round(v).toLocaleString('de-DE') + ' €';
  const pct = (v) => (Math.round(v * 10) / 10).toLocaleString('de-DE') + ' %';
  const datum = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const heute = () => new Date();

  const HEIZUNGEN = {
    oel: 'Ölheizung', gas: 'Gaszentralheizung', gasetage: 'Gas-Etagenheizung', nachtspeicher: 'Nachtspeicherheizung',
    kohle: 'Kohleheizung', biomasse: 'Holz- oder Pelletheizung', andere: 'andere Heizung',
  };

  // Zustand. Wohneinheit 1 ist standardmäßig selbst bewohnt, weitere nicht.
  const state = {
    bauart: 'luft-wasser',
    eigentum: 'allein',
    einheiten: [{ selbst: true, kind: null, stufe: null }],
    heizung: { art: null, baujahr: null, laeuft: null },
    kosten: 28000,
    kostenBewegt: false,
  };

  /* ---------------------------------------------------- Wohneinheiten -- */
  const unitsEl = $('fr-units');

  function segment(name, werte, aktiv) {
    return `<div class="fr-seg">${werte.map(([v, t]) =>
      `<label><input type="radio" name="${name}" value="${v}"${aktiv === v ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>`;
  }

  function unitKarte(e, i, n) {
    const id = 'u' + i;
    const stufen = L.stufenTexte(e.kind === true);
    const sel = e.selbst ? 'ja' : 'nein';
    const kind = e.kind == null ? '' : e.kind ? 'ja' : 'nein';
    const stufe = e.stufe == null ? '' : String(e.stufe);
    const titel = n === 1 ? 'Dein Haushalt' : `Wohneinheit ${i + 1}`;
    const kurz = !e.selbst ? 'vermietet oder anders genutzt' : e.stufe == null ? 'Angaben fehlen noch' : 'selbst bewohnt';
    const inhalt = `
      <div class="fr-q"><span class="fr-q__t" id="${id}-s">${n === 1 ? 'Wohnst du selbst im Haus und stehst im Grundbuch?' : 'Wohnt hier ein Eigentümer, der im Grundbuch steht?'}</span>
        ${segment(id + '-selbst', [['ja', 'Ja'], ['nein', n === 1 ? 'Nein, vermietet' : 'Nein, vermietet oder anders genutzt']], sel)}</div>
      <div class="fr-q" ${e.selbst ? '' : 'hidden'}><span class="fr-q__t">Lebt ein Kind unter 18 im Haushalt?</span>
        ${segment(id + '-kind', [['ja', 'Ja'], ['nein', 'Nein']], kind)}</div>
      <div class="fr-q" ${e.selbst ? '' : 'hidden'}><span class="fr-q__t">Zu versteuerndes Haushaltseinkommen im Jahr</span>
        <div class="fr-seg fr-seg--4">${stufen.map((t, s) =>
          `<label><input type="radio" name="${id}-stufe" value="${s}"${stufe === String(s) ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div></div>`;
    if (n > 3) {
      return `<details class="fr-unit fr-unit--fold" data-i="${i}"${i === 0 ? ' open' : ''}><summary><strong>${titel}</strong><span class="fr-unit__kurz">${kurz}</span></summary>${inhalt}</details>`;
    }
    return `<div class="fr-unit" data-i="${i}"><p class="fr-unit__titel"><strong>${titel}</strong></p>${inhalt}</div>`;
  }

  function unitsZeichnen() {
    const n = state.einheiten.length;
    const offen = new Set([...unitsEl.querySelectorAll('details[open]')].map((d) => d.dataset.i));
    unitsEl.innerHTML = state.einheiten.map((e, i) => unitKarte(e, i, n)).join('');
    if (n > 3 && offen.size) unitsEl.querySelectorAll('details').forEach((d) => { d.open = offen.has(d.dataset.i); });
  }

  unitsEl.addEventListener('change', (ev) => {
    const t = ev.target;
    const karte = t.closest('[data-i]');
    if (!karte) return;
    const e = state.einheiten[Number(karte.dataset.i)];
    const feld = t.name.split('-')[1];
    if (feld === 'selbst') e.selbst = t.value === 'ja';
    if (feld === 'kind') e.kind = t.value === 'ja';
    if (feld === 'stufe') e.stufe = Number(t.value);
    if (feld === 'selbst' || feld === 'kind') {
      // Beschriftungen der Stufen ändern sich mit dem Kind, Fokus erhalten
      const name = t.name, wert = t.value;
      unitsZeichnen();
      const neu = unitsEl.querySelector(`input[name="${name}"][value="${wert}"]`);
      if (neu) neu.focus();
    }
    update();
  });

  /* ------------------------------------------------------ Einheitenzahl -- */
  const weInput = $('fr-we');
  function setEinheiten(n) {
    n = Math.max(1, Math.min(40, Math.round(Number(n) || 1)));
    weInput.value = n;
    while (state.einheiten.length < n) state.einheiten.push({ selbst: false, kind: null, stufe: null });
    state.einheiten.length = n;
    $('fr-weg-wrap').hidden = n < 2;
    unitsZeichnen();
    update();
  }
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => setEinheiten(Number(weInput.value) + Number(b.dataset.step))));
  weInput.addEventListener('change', () => setEinheiten(weInput.value));

  /* ------------------------------------------------------------ Heizung -- */
  const baujahr = $('fr-baujahr');
  for (let j = heute().getFullYear(); j >= 1960; j--) baujahr.add(new Option(String(j), String(j)));
  baujahr.options[baujahr.options.length - 1].text = '1960 oder früher';

  /* ------------------------------------------------------------ Kosten -- */
  const range = $('fr-kosten-range'), kostenInput = $('fr-kosten');
  function setKosten(v, vonHand) {
    v = Math.max(300, Math.round(Number(v) || 0));
    state.kosten = v;
    if (vonHand) state.kostenBewegt = true;
    kostenInput.value = v;
    range.value = Math.min(Number(range.max), Math.max(Number(range.min), v));
  }
  range.addEventListener('input', () => { setKosten(range.value, true); update(); });
  kostenInput.addEventListener('change', () => { setKosten(kostenInput.value, true); update(); });

  /* ------------------------------------------------ übrige Formularfelder -- */
  form.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.name === 'bauart') { state.bauart = t.value; $('fr-hint-luftluft').hidden = t.value !== 'luft-luft'; }
    if (t.name === 'eigentum') state.eigentum = t.value;
    if (t.name === 'heizung') {
      state.heizung.art = t.value;
      const mitJahr = t.value === 'gas' || t.value === 'biomasse';
      $('fr-baujahr-wrap').hidden = !mitJahr;
      if (!mitJahr) state.heizung.baujahr = null;
      else if (baujahr.value) state.heizung.baujahr = Number(baujahr.value);
    }
    if (t.name === 'baujahr') state.heizung.baujahr = t.value ? Number(t.value) : null;
    if (t.name === 'laeuft') state.heizung.laeuft = t.value === 'ja';
    if (['bauart', 'eigentum', 'heizung', 'baujahr', 'laeuft'].includes(t.name)) update();
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  /* -------------------------------------------------------------- Turm -- */
  const stage = $('fr-stage'), flat = $('fr-flat');
  let turm = null, turmWert = null, turmGeladen = false;
  function turmLaden() {
    if (turmGeladen) return;
    turmGeladen = true;
    const s = document.createElement('script');
    s.src = '/assets/js/foerderturm.js';
    s.defer = true;
    s.onload = () => {
      if (!window.Foerderturm) return;
      turm = window.Foerderturm.mount(stage);
      if (turm) { stage.classList.add('is-3d'); if (turmWert) turm.set(turmWert); }
    };
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { turmLaden(); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(stage);
  } else turmLaden();

  function turmSetzen(w) {
    turmWert = w;
    if (turm) turm.set(w);
    // flacher Turm: Fallback ohne WebGL und Vorlage für den Druck
    const h = (v) => Math.max(0, Math.min(100, v)) + '%';
    const kgbBleibt = Math.max(0, w.kgb - w.lost);
    flat.style.setProperty('--g', h(w.grund));
    flat.style.setProperty('--k', h(kgbBleibt));
    flat.style.setProperty('--l', h(w.lost));
    flat.style.setProperty('--e', h(w.eink));
    flat.style.setProperty('--d', h(w.deckel));
  }

  /* ---------------------------------------------------------- Countdown -- */
  let stichtag = null;
  function uhr() {
    if (!stichtag) return;
    const ms = Math.max(0, stichtag - Date.now());
    const tage = Math.floor(ms / 864e5), std = Math.floor((ms % 864e5) / 36e5), min = Math.floor((ms % 36e5) / 6e4);
    $('fr-c-tage').textContent = tage;
    $('fr-c-std').textContent = std;
    $('fr-c-min').textContent = min;
  }
  setInterval(uhr, 30000);

  /* ------------------------------------------------------------- Update -- */
  function update() {
    const jetzt = heute();
    const eingabe = { kosten: state.kosten, einheiten: state.einheiten, heizung: state.heizung };

    // Startwert der Kosten folgt dem Höchstbetrag, bis der Kunde selbst schiebt
    const hoechst = L.hoechstbetrag(state.einheiten.length, L.periode(jetzt));
    range.max = String(Math.max(80000, Math.ceil((hoechst * 1.8) / 5000) * 5000));
    if (!state.kostenBewegt) setKosten(hoechst, false);
    eingabe.kosten = state.kosten;

    const a = L.naechsteAbsenkung(eingabe, jetzt);
    const r = a.jetzt;
    const lostDatum = a.stichtag.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    // Panel
    $('fr-satz').textContent = (Math.round(r.satz * 10) / 10).toLocaleString('de-DE');
    $('fr-zuschuss').textContent = eur(r.zuschuss);
    $('fr-anteil').textContent = pct(r.anteil);
    $('fr-l-grund').textContent = pct(r.schichten.grund);
    $('fr-l-kgb').textContent = pct(r.schichten.kgb);
    $('fr-l-eink').textContent = pct(r.schichten.eink);
    $('fr-l-deckel').textContent = pct(r.schichten.deckel);
    const lost = Math.max(0, a.kgbVerlust);
    $('fr-l-lost-wrap').hidden = lost <= 0;
    $('fr-l-lost').textContent = pct(lost);
    $('fr-l-lost-datum').textContent = lostDatum;
    turmSetzen({ grund: r.schichten.grund, kgb: r.schichten.kgb, eink: r.schichten.eink, lost, deckel: r.schichten.deckel });

    // Hinweise zur Heizung
    const hh = $('fr-hint-heizung');
    const h = state.heizung;
    let hint = '';
    if (h.laeuft === false && h.art && h.art !== 'andere') {
      hint = 'Den Klimageschwindigkeitsbonus gibt es nur für den Tausch einer funktionierenden Heizung. Grundförderung und Einkommensbonus bleiben. Bis die Wärmepumpe läuft, kann die Miete einer Übergangsheizung für bis zu ein Jahr mitgefördert werden.';
    } else if (r.kgbHeizung === true) {
      hint = `Tausche, solange sie läuft: Fällt die Heizung vorher aus, entfallen die ${pct(r.kgbSatz)} Klimageschwindigkeitsbonus.`;
    } else if (h.art === 'andere') {
      hint = 'Für den Tausch dieser Heizung gibt es keinen Klimageschwindigkeitsbonus. Grundförderung und Einkommensbonus bleiben.';
    } else if ((h.art === 'gas' || h.art === 'biomasse') && h.baujahr) {
      const alter = jetzt.getFullYear() - h.baujahr;
      if (alter < 20) hint = `Der Bonus gilt bei dieser Heizung erst, wenn sie bei Antragstellung 20 Jahre in Betrieb ist, also ab ${h.baujahr + 20}.`;
      else if (alter === 20) hint = `Die Heizung wird ${jetzt.getFullYear()} genau 20 Jahre alt. Entscheidend ist der Monat der Inbetriebnahme: Er muss bei Antragstellung mindestens 20 Jahre zurückliegen.`;
    }
    hh.textContent = hint;
    hh.hidden = !hint;

    // Kostenhinweis
    $('fr-kosten-hint').textContent = state.kosten > r.hoechst
      ? `Die KfW rechnet bis ${eur(r.hoechst)} mit. Die übrigen ${eur(state.kosten - r.hoechst)} zahlst du selbst.`
      : `Die KfW rechnet bei ${state.einheiten.length === 1 ? 'deinem Haus' : 'diesem Haus'} mit bis zu ${eur(r.hoechst)}.`;

    // Ergebnis
    $('fr-r-titel').textContent = eur(r.zuschuss) + ' Zuschuss';
    $('fr-r-satz').textContent = pct(r.satz);
    $('fr-r-ff').textContent = eur(r.foerderfaehig);
    $('fr-r-kosten').textContent = eur(r.kosten);
    $('fr-r-zuschuss').textContent = eur(r.zuschuss);
    $('fr-r-anteil').textContent = pct(r.anteil);
    const ueber = $('fr-r-ueber');
    ueber.hidden = r.kosten <= r.hoechst;
    ueber.textContent = `Deine Kosten liegen ${eur(r.kosten - r.hoechst)} über dem Höchstbetrag. Deshalb ist der Anteil an deiner Investition kleiner als der Fördersatz.`;

    const offen = { heizung: 'Angaben zur jetzigen Heizung', kind: 'Kind im Haushalt', einkommen: 'Einkommensstufe' };
    $('fr-open').hidden = r.offen.length === 0;
    $('fr-open-list').textContent = r.offen.map((o) => offen[o]).join(', ') + '.';

    const n = state.einheiten.length;
    $('fr-table-wrap').hidden = n < 2;
    if (n > 1) {
      $('fr-table').innerHTML = r.einheiten.map((e) =>
        `<tr><td>${e.nr}</td><td>${e.selbst ? 'selbst bewohnt' : 'vermietet / andere'}</td><td>${pct(e.satz)}</td><td>${eur(e.zuschuss)}</td></tr>`).join('')
        + `<tr class="fr-table__sum"><td colspan="2">Summe</td><td>${pct(r.satz)}</td><td>${eur(r.zuschuss)}</td></tr>`;
    }
    $('fr-weg-note').hidden = !(n > 1 && state.eigentum === 'weg');

    // Angaben für Gespräch und Druck
    const selbst = r.einheiten.filter((e) => e.selbst).length;
    const angaben = [
      `Wärmepumpe: ${state.bauart === 'luft-luft' ? 'Luft-Luft' : 'Luft-Wasser'}`,
      `Wohneinheiten: ${n}${n > 1 ? `, davon ${selbst} selbst bewohnt` : ''}${n > 1 && state.eigentum === 'weg' ? ', Eigentümergemeinschaft' : ''}`,
      ...state.einheiten.map((e, i) => {
        if (!e.selbst) return n > 1 ? `Einheit ${i + 1}: vermietet oder anders genutzt` : 'Haus: nicht selbst bewohnt';
        const st = e.stufe == null ? 'Einkommen offen' : 'Einkommen ' + L.stufenTexte(e.kind === true)[e.stufe];
        return `${n > 1 ? `Einheit ${i + 1}` : 'Haushalt'}: selbst bewohnt, ${e.kind == null ? 'Kind offen' : e.kind ? 'mit Kind unter 18' : 'ohne Kind unter 18'}, ${st}`;
      }),
      `Jetzige Heizung: ${h.art ? HEIZUNGEN[h.art] + (h.baujahr ? ` (seit ${h.baujahr})` : '') + (h.laeuft == null ? '' : h.laeuft ? ', läuft' : ', defekt') : 'offen'}`,
      `Kosten: ${eur(state.kosten)}`,
      `Berechnet am ${datum(jetzt)} mit ${L.REGELN.quelle}`,
    ];
    $('fr-angaben').innerHTML = angaben.map((t) => `<li>${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</li>`).join('');

    // Countdown und Aufruf
    stichtag = a.stichtag.getTime();
    $('fr-c-datum').textContent = datum(a.stichtag);
    uhr();
    const dann = a.dann;
    const aenderungen = [];
    if (r.schichten.kgb > dann.schichten.kgb) aenderungen.push(`Klimageschwindigkeitsbonus ${pct(dann.kgbSatz)} statt ${pct(r.kgbSatz)}`);
    if (dann.hoechst < r.hoechst && r.kosten > dann.hoechst) aenderungen.push(`Höchstbetrag ${eur(dann.hoechst)} statt ${eur(r.hoechst)}`);
    const frist = datum(a.fristEnde);
    if (a.verlust > 0) {
      $('fr-c-text').innerHTML = `Geht dein Antrag erst ab dem ${datum(a.stichtag)} bei der KfW ein, bekommst du <strong>${eur(a.verlust)} weniger</strong>. Grund: ${aenderungen.join(', ')}.`;
      $('fr-cta-head').textContent = r.schichten.kgb > 0
        ? `Antrag bis ${frist} stellen und ${pct(r.kgbSatz)} Bonus sichern.`
        : `Antrag bis ${frist} stellen und den vollen Höchstbetrag von ${eur(r.hoechst)} sichern.`;
    } else {
      $('fr-c-text').textContent = `Für deine Angaben ändert sich am ${datum(a.stichtag)} nichts. Die Sätze sinken aber jedes halbe Jahr weiter.`;
      $('fr-cta-head').textContent = 'Förderung in Ruhe planen und den Antrag gut vorbereiten.';
    }
  }

  /* ------------------------------------------- Dock tritt zurück, Druck -- */
  const cta = $('fr-cta');
  if ('IntersectionObserver' in window && cta) {
    new IntersectionObserver((e) => document.documentElement.classList.toggle('dock-retreat', e[0].isIntersecting), { threshold: 0.3 }).observe(cta);
  }
  $('fr-print').addEventListener('click', () => window.print());

  // Jahre im Einkommenshinweis: zweites und drittes Jahr vor dem Antrag
  const j = heute().getFullYear();
  document.querySelectorAll('[data-jahre]').forEach((el) => { el.textContent = `${j - 3} und ${j - 2}`; });
  $('fr-stand').textContent = `Grundlage: ${L.REGELN.quelle}. Berechnet für einen Antrag am ${datum(heute())}.`;

  unitsZeichnen();
  update();
})();
