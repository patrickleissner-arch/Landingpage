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
