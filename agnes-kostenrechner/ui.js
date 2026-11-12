/* ui.js: Oberfläche für /agnes-kostenrechner. Rechenregeln stehen in model.js. */
(function () {
  'use strict';
  const M = window.AgnesKosten, $ = id => document.getElementById(id);
  const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const zahl = (v, n) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: n == null ? 0 : n }).format(v);
  const wert = id => { const v = $(id).value.trim(); return v === '' ? NaN : Number(v.replace(',', '.')); };

  let lastgang = null;            // { werte, name, zeilen, spaltenAnzahl }
  let horizont = 20, ebene = 'mit', ergebnis = null;
  const gebirge = window.Lastgebirge && window.Lastgebirge.erstelle($('buehne'));
  if (!gebirge) { $('ersatz').hidden = false; $('gebirge-titel').textContent = 'Jahresdauerlinie'; }
  let gezeigteLast = null;

  // Stichtag
  const tage = Math.ceil((new Date(2026, 11, 31, 23, 59) - new Date()) / 864e5);
  $('tage').textContent = tage > 0 ? zahl(tage) : 'abgelaufen';

  function eingabe() {
    const e = {
      kwh: wert('kwh'), peak: wert('peak'),
      heute: { lpNiedrig: wert('lpN'), apNiedrig: wert('apN'), lpHoch: wert('lpH'), apHoch: wert('apH') },
      agnes: { kp: wert('kp'), ap1: wert('ap1'), ap2Faktor: wert('ap2f'), start: 2029 },
      speicher: {
        P: wert('sP') || 0, E: wert('sE') || 0, eta: wert('eta') / 100, ibn: Number($('ibn').value),
        eigenesEntgelt: $('eigen').checked, entgelt: wert('entgelt') || 0, sonst: wert('sonst') || 0, invest: wert('invest') || 0,
      },
      steigerung: wert('steig'), startjahr: Number($('start').value),
    };
    if (lastgang) {
      const min = Number($('intervall').value);
      e.last = M.inKw(lastgang.werte, $('einheit').value, min); e.dt = min / 60;
    }
    return e;
  }

  function rechne() {
    $('entgelt-felder').hidden = !$('eigen').checked;
    let r;
    try { r = M.berechne(eingabe()); }
    catch (err) {
      $('fehler').textContent = err.meldungen ? err.meldungen.join(' ') : 'Die Eingaben lassen sich nicht berechnen: ' + err.message;
      $('fehler').hidden = false; return;
    }
    $('fehler').hidden = true; ergebnis = r;
    if (lastgang) { $('kwh').value = Math.round(r.kennzahlen.kwh); $('peak').value = Math.round(r.kennzahlen.peak * 10) / 10; }
    zeige();
  }

  function grenzeFuerEbene(r) { return ebene === 'ohne' ? r.agnesOhne.bestell : ebene === 'heute' ? r.grenzeHeute : r.agnesMit.bestell; }

  function zeige() {
    const r = ergebnis, k = r.kennzahlen, s = r.horizonte[horizont];
    // 3D
    if (gebirge) {
      if (gezeigteLast !== r.last) { gebirge.setzeLast(r.last, r.dt); gezeigteLast = r.last; }
      gebirge.setzeGrenze(grenzeFuerEbene(r));
    } else dauerlinie(r);

    $('kennzahlen').innerHTML =
      kz('Jahreshöchstleistung', zahl(k.peak, 1) + ' kW', zahl(k.benutzungsstunden) + ' Benutzungsstunden') +
      kz('Mit Speicher heute', zahl(r.peakMit, 1) + ' kW', r.hatSpeicher ? 'Spitze um ' + zahl(k.peak - r.peakMit, 1) + ' kW gekappt' : 'kein Speicher eingetragen') +
      kz('Bestellkapazität ohne Speicher', zahl(r.agnesOhne.bestell, 1) + ' kW', zahl(r.agnesOhne.kwhUeber) + ' kWh darüber, zum AP2') +
      kz('Bestellkapazität mit Speicher', zahl(r.agnesMit.bestell, 1) + ' kW', zahl(r.agnesMit.kwhUeber) + ' kWh darüber, zum AP2');

    // Türme
    const reihen = [['ref', 'Heutige Regeln, fortgeschrieben', s.referenz], ['ohne', 'Ohne Speicher', s.ohne], ['mit', 'Speicher ohne Bestandsschutz', s.mitOhneSchutz], ['schutz', 'Speicher mit Bestandsschutz', s.mitSchutz]];
    const max = Math.max.apply(null, reihen.map(x => x[2])) || 1;
    const box = $('tuerme');
    if (!box.children.length) {
      box.innerHTML = reihen.map(x => `<div class="turm turm--${x[0]}"><p class="turm__wert"></p><div class="turm__block"></div></div>`).join('');
      box.insertAdjacentHTML('afterend', '<div class="turm-namen" id="turm-namen">' + reihen.map(x => `<span>${x[1]}</span>`).join('') + '</div>');
    }
    reihen.forEach((x, i) => {
      const t = box.children[i];
      t.querySelector('.turm__wert').textContent = eur.format(x[2]);
      t.querySelector('.turm__block').style.height = Math.max(1, x[2] / max * 78) + '%';
    });

    // Aussagen
    const d = s.mehrkostenAgnes, jahre = horizont + ' Jahren';
    aussage('a-agnes', d >= 0 ? 'Mehrkosten durch AgNes ohne Speicher in ' + jahre : 'Entlastung durch AgNes ohne Speicher in ' + jahre,
      (d >= 0 ? '+' : '−') + eur.format(Math.abs(d)), 'Heutige Regeln ' + eur.format(s.referenz) + ', mit AgNes ' + eur.format(s.ohne), d >= 0 ? 'plus' : 'minus');
    let amort = '';
    if (r.hatSpeicher && eingabe().speicher.invest > 0) amort = r.amortisation == null ? 'Die Investition rechnet sich allein über Netzentgelte in 20 Jahren nicht.' : 'Investition nach rund ' + zahl(r.amortisation, 1) + ' Jahren über Netzentgelte gedeckt.';
    aussage('a-speicher', 'Der Speicher senkt die Netzentgelte in ' + jahre + ' um', eur.format(s.ersparnisSpeicher),
      amort || 'Nur Netzentgelte. Eigenverbrauch und Handel kommen hinzu.', '');
    aussage('a-schutz', 'So viel ist der Bestandsschutz in ' + jahre + ' wert', eur.format(s.wertSchutz),
      s.wertSchutz > 0 ? 'Vermiedenes Speicherentgelt ab 2029' : 'Kein eigenes Speicherentgelt angesetzt', '');

    // Meldungen
    const m = [];
    if (r.beispiel) m.push('Gerechnet mit einem Beispielprofil. Wie viel der Speicher kappen kann und wie viel Strom über der Bestellkapazität liegt, zeigt erst der gemessene Lastgang.');
    if (lastgang && k.tage < 360) m.push('Der Lastgang deckt ' + zahl(k.tage) + ' Tage ab und wurde auf ein Jahr hochgerechnet. Fehlt die Jahreszeit mit der höchsten Last, ist das Ergebnis zu günstig.');
    if (lastgang && lastgang.spaltenAnzahl > 1) m.push('Die Datei enthält mehrere Zahlenspalten. Verwendet wurde Spalte ' + lastgang.spalte + '. Prüfe Spitze und Verbrauch oben gegen deine Jahresrechnung.');
    if (r.unterSchwelle) m.push('Der Jahresverbrauch liegt unter 100.000 kWh. In der Niederspannung sieht der Entwurf dann Grund- und Arbeitspreis vor, keinen Kapazitätspreis. Der AgNes-Vergleich gilt für diesen Anschluss nicht.');
    else if (k.kwh < 115000) m.push('Der Jahresverbrauch liegt nahe an der Schwelle von 100.000 kWh. Sinkt der Bezug darunter, etwa durch eine PV-Anlage, fällt der Anschluss aus dem Kapazitätspreismodell.');
    if (d < 0 && !r.unterSchwelle) m.push('Mit diesen Preisannahmen wird der Betrieb durch AgNes günstiger. Betriebe mit wenigen Benutzungsstunden zahlen heute einen hohen Arbeitspreis; künftig können sie wenig Kapazität bestellen und die Spitzen zum AP2 beziehen. Ob das so kommt, entscheiden die Preisblätter 2028. Rechne deshalb auch mit höherem Kapazitätspreis und AP1.');
    if (r.hatSpeicher && r.heuteOhne.klasse !== r.heuteMit.klasse) m.push('Mit Speicher steigen die Benutzungsstunden über 2.500. Nach heutigen Regeln wechselt der Anschluss damit in die Preisklasse mit hohem Leistungs- und niedrigem Arbeitspreis. Das ist eingerechnet.');
    if (r.hatSpeicher && !r.schutzMoeglich) m.push('Inbetriebnahme nach dem 4. August 2029: Der Bestandsschutz greift laut Entwurf nicht mehr.');
    const f = wert('ap2f'); if (f < 200 || f > 350) m.push('AP2 liegt außerhalb der Spanne des Entwurfs von 200 bis 350 % des AP1.');
    $('meldungen').innerHTML = m.map(t => '<li>' + t + '</li>').join('');

    // Tabellen (Preisstand 2026, ohne Steigerung)
    const z = (name, a, b, c, summe, extra) => `<tr><td>${name}</td><td>${a}</td><td>${b}</td><td>${c}</td><td><b>${eur.format(summe)}</b></td><td>${extra}</td></tr>`;
    $('detail').innerHTML = '<tr><th>Preisstand 2026, pro Jahr</th><th>Leistung / Kapazität</th><th>Arbeit / AP1</th><th>AP2</th><th>Summe</th><th>Grundlage</th></tr>' +
      z('Heute ohne Speicher', eur.format(r.heuteOhne.leistung), eur.format(r.heuteOhne.arbeit), '–', r.heuteOhne.summe, zahl(k.peak, 1) + ' kW, ' + r.heuteOhne.klasse) +
      z('Heute mit Speicher', eur.format(r.heuteMit.leistung), eur.format(r.heuteMit.arbeit), '–', r.heuteMit.summe, zahl(r.peakMit, 1) + ' kW, ' + r.heuteMit.klasse) +
      z('AgNes ohne Speicher', eur.format(r.agnesOhne.kapazitaet), eur.format(r.agnesOhne.ap1), eur.format(r.agnesOhne.ap2), r.agnesOhne.summe, zahl(r.agnesOhne.bestell, 1) + ' kW bestellt') +
      z('AgNes mit Speicher', eur.format(r.agnesMit.kapazitaet), eur.format(r.agnesMit.ap1), eur.format(r.agnesMit.ap2), r.agnesMit.summe, zahl(r.agnesMit.bestell, 1) + ' kW bestellt');
    $('jahre').innerHTML = '<tr><th>Jahr</th><th>Heutige Regeln</th><th>Ohne Speicher</th><th>Speicher ohne Schutz</th><th>Speicher mit Schutz</th></tr>' +
      r.jahre.slice(0, horizont).map(j => `<tr class="${j.neu ? 'neu' : ''}"><td>${j.jahr}</td><td>${eur.format(j.referenz)}</td><td>${eur.format(j.ohne)}</td><td>${eur.format(j.mitOhneSchutz)}</td><td>${eur.format(j.mitSchutz)}</td></tr>`).join('') +
      `<tr><td><b>Summe</b></td><td><b>${eur.format(s.referenz)}</b></td><td><b>${eur.format(s.ohne)}</b></td><td><b>${eur.format(s.mitOhneSchutz)}</b></td><td><b>${eur.format(s.mitSchutz)}</b></td></tr>`;
  }

  function kz(titel, w, klein) { return `<div><dt>${titel}</dt><dd>${w}<small>${klein}</small></dd></div>`; }
  function aussage(id, titel, w, klein, klasse) {
    const el = $(id); el.children[0].textContent = titel; el.children[1].textContent = w; el.children[2].textContent = klein;
    el.classList.remove('plus', 'minus'); if (klasse) el.classList.add(klasse);
  }

  // Ersatz ohne WebGL: sortierte Jahresdauerlinie
  function dauerlinie(r) {
    const sortiert = Float32Array.from(r.last).sort().reverse(), n = 240, peak = r.kennzahlen.peak, g = grenzeFuerEbene(r);
    let pfad = '';
    for (let i = 0; i <= n; i++) { const v = sortiert[Math.min(sortiert.length - 1, Math.floor(Math.pow(i / n, 2.2) * (sortiert.length - 1)))]; pfad += (i ? 'L' : 'M') + (i / n * 600).toFixed(1) + ' ' + (250 - v / peak * 240).toFixed(1); }
    const y = 250 - g / peak * 240;
    $('dauerlinie').innerHTML = `<path d="${pfad} L600 250 L0 250Z" fill="#a6d2b055" stroke="#a6d2b0" stroke-width="2"/><line x1="0" x2="600" y1="${y}" y2="${y}" stroke="#d0ab3b" stroke-width="2" stroke-dasharray="6 5"/><text x="596" y="${y - 6}" text-anchor="end" fill="#edc96f" font-size="13">${zahl(g, 1)} kW</text>`;
  }

  // Lastgang laden
  function lade(datei) {
    if (!datei) return;
    if (datei.size > 40e6) return melde('Die Datei ist größer als 40 MB. Bitte den Lastgang als CSV mit einer Zeile je Viertelstunde exportieren.');
    const leser = new FileReader();
    leser.onerror = () => melde('Die Datei konnte nicht gelesen werden.');
    leser.onload = () => {
      try {
        const l = M.leseLastgang(String(leser.result));
        lastgang = { werte: l.werte, name: datei.name, zeilen: l.zeilen, spalte: l.spalte, spaltenAnzahl: l.spaltenAnzahl };
        if (l.einheit) $('einheit').value = l.einheit;
        $('intervall').value = String(l.intervall);
        $('lg-status').textContent = datei.name + ': ' + zahl(l.zeilen) + ' Messwerte gelesen' + (l.einheit ? '' : '. Einheit nicht erkannt, bitte prüfen');
        $('lg-box').hidden = false; $('kwh').disabled = $('peak').disabled = true;
        $('profil-hinweis').textContent = 'Verbrauch und Spitze stammen aus dem Lastgang.';
        rechne();
      } catch (err) { melde(err.message + ' Excel-Dateien bitte vorher als CSV speichern.'); }
    };
    leser.readAsText(datei);
  }
  function melde(t) { $('fehler').textContent = t; $('fehler').hidden = false; }

  $('datei').addEventListener('change', e => { lade(e.target.files[0]); e.target.value = ''; });
  const ablage = $('ablage');
  ['dragenter', 'dragover'].forEach(n => ablage.addEventListener(n, e => { e.preventDefault(); ablage.classList.add('drueber'); }));
  ['dragleave', 'drop'].forEach(n => ablage.addEventListener(n, e => { e.preventDefault(); ablage.classList.remove('drueber'); }));
  ablage.addEventListener('drop', e => lade(e.dataTransfer.files[0]));
  $('lg-weg').addEventListener('click', () => {
    lastgang = null; $('lg-box').hidden = true; $('kwh').disabled = $('peak').disabled = false;
    $('profil-hinweis').textContent = 'Ohne Lastgang rechnet die Seite mit einem Beispielprofil für einen Gewerbebetrieb, das auf beide Werte skaliert wird.';
    rechne();
  });

  let warte = 0;
  $('formular').addEventListener('input', e => { if (e.target.id === 'datei') return; clearTimeout(warte); warte = setTimeout(rechne, 160); });
  $('formular').addEventListener('submit', e => e.preventDefault());
  function schalter(sel, attr, setze) {
    document.querySelectorAll(sel).forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll(sel).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      setze(b.getAttribute(attr)); if (ergebnis) zeige();
    }));
  }
  schalter('.horizont button', 'data-n', v => { horizont = Number(v); });
  schalter('.ebene-wahl button', 'data-ebene', v => { ebene = v; });
  $('drucken').addEventListener('click', () => window.print());
  rechne();
})();
