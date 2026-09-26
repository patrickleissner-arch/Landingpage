var __nfFix1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    // ── HTW-Solarisator Two-Click-Consent ───────────────────────────
    (function () {
      const consent = document.getElementById('solarisator-consent');
      const btn     = document.getElementById('solarisator-consent-btn');
      const embed   = document.getElementById('solarisator-embed');
      if (!consent || !btn || !embed) return;
      btn.addEventListener('click', function () {
        const iframe = document.createElement('iframe');
        iframe.src   = 'https://solar.htw-berlin.de/solarisator/';
        iframe.title = 'Solarisator – Unabhängigkeitsrechner der HTW Berlin';
        iframe.width  = '1024';
        iframe.height = '660';
        iframe.loading = 'lazy';
        iframe.setAttribute('aria-label', 'Interaktiver PV-Unabhängigkeitsrechner der HTW Berlin');
        embed.appendChild(iframe);
        embed.hidden  = false;
        consent.hidden = true;
      });
    })();

  (function () {
    'use strict';
    var M = window.PVModel;
    if (!M) return;
    var $ = function (id) { return document.getElementById(id); };

    // --- State ---
    var surfaces = [{ orientation:'S', tilt:'mittel', modules:20, modulePower:440, shading:'keine' }];
    var ems = 'ja';

    var TILT_LABEL = { flach:'flach ≤15°', mittel:'20–35°', steil:'steil ≥40°', vertikal:'Fassade' };

    // --- Dachflächen rendern ---
    function renderSurfaces() {
      var wrap = $('dr-surfaces');
      wrap.innerHTML = '';
      surfaces.forEach(function (s, i) {
        var box = document.createElement('div');
        box.className = 'dr-surface';
        var canDel = surfaces.length > 1;
        var chips = M.ORIENT_OPTS.map(function (o) {
          return '<button type="button" class="dr-chip' + (o === s.orientation ? ' on' : '') +
                 '" data-i="' + i + '" data-prop="orientation" data-val="' + o + '">' + o + '</button>';
        }).join('');
        var tiltOpts = M.TILT_OPTS.map(function (t) {
          return '<option value="' + t[0] + '"' + (t[0] === s.tilt ? ' selected' : '') + '>' + t[0] + ' (' + t[1] + ')</option>';
        }).join('');
        box.innerHTML =
          '<div class="dr-surface-head"><strong>Fläche ' + (i + 1) + '</strong>' +
            (canDel ? '<button type="button" class="dr-surface-del" data-del="' + i + '" aria-label="Fläche entfernen">×</button>' : '') +
          '</div>' +
          '<div class="dr-field"><label class="dr-label">Ausrichtung</label><div class="dr-chips">' + chips + '</div></div>' +
          '<div class="dr-field"><label class="dr-label">Neigung</label><select class="dr-select" data-i="' + i + '" data-prop="tilt" name="tilt-' + i + '" aria-label="Neigung" autocomplete="off">' + tiltOpts + '</select></div>' +
          '<div class="dr-field"><label class="dr-label">Anzahl Module × Modulleistung</label><div class="dr-inrow">' +
            '<input type="number" class="dr-input" data-i="' + i + '" data-prop="modules" name="modules-' + i + '" autocomplete="off" inputmode="numeric" min="0" max="200" value="' + (s.modules || '') + '" aria-label="Anzahl Module">' +
            '<span class="dr-unit">×</span>' +
            '<input type="number" class="dr-input dr-wp" data-i="' + i + '" data-prop="modulePower" name="modulePower-' + i + '" autocomplete="off" inputmode="numeric" min="250" max="700" step="5" value="' + s.modulePower + '" aria-label="Modulleistung in Watt-Peak">' +
            '<span class="dr-unit">Wp</span></div></div>' +
          '<p class="dr-surface-yield" data-yield="' + i + '"></p>';
        wrap.appendChild(box);
      });
    }

    // --- Eingaben lesen + rechnen + anzeigen ---
    function recalc() {
      var plz = $('dr-plz').value;
      var reg = M.regionForPlz(plz);
      $('dr-region').textContent = reg.region;

      var consumption = parseFloat($('dr-verbrauch').value) || 0;
      if ($('dr-wp-on').checked) consumption += Math.max(0, parseFloat($('dr-wp-kwh').value) || 0);
      if ($('dr-ev-on').checked) consumption += Math.max(0, parseFloat($('dr-ev-km').value) || 0) * M.EV_KWH_PER_KM;

      var kWp = 0, pvYield = 0;
      surfaces.forEach(function (s, i) {
        var r = M.surfaceYield(s, reg.yield);
        kWp += r.kWp; pvYield += r.yield;
        var el = document.querySelector('[data-yield="' + i + '"]');
        if (el) el.textContent = r.kWp > 0
          ? (M.ORIENT_LABEL[s.orientation] + ' · ' + __nfFix1.format(r.kWp) + '\u00a0kWp · ≈ ' + fmt(r.yield) + '\u00a0kWh/Jahr')
          : 'Noch keine Module eingetragen.';
      });

      var battKwh = Math.max(0, parseFloat($('dr-batt').value) || 0);
      var res = M.computeIndependence({ consumptionKwh: consumption, kWp: kWp, pvYield: pvYield, battKwh: battKwh, emsOn: ems === 'ja' });

      drawGauge($('dr-gauge-autark'), res.autarkie);
      drawGauge($('dr-gauge-eigen'), res.eigenverbrauch);

      var selfPct = res.consumption > 0 ? Math.round(res.pvSelbst / res.consumption * 100) : 0;
      $('dr-seg-self').style.width = selfPct + '%';
      $('dr-seg-grid').style.width = (100 - selfPct) + '%';
      $('dr-selbst').textContent = fmt(res.pvSelbst) + '\u00a0kWh';
      $('dr-export').textContent = fmt(res.pvExport) + '\u00a0kWh';
      $('dr-netz').textContent   = fmt(res.netElec) + '\u00a0kWh';
      $('dr-total-yield').textContent = kWp > 0
        ? ('Gesamt: ' + __nfFix1.format(kWp) + '\u00a0kWp · ≈ ' + fmt(pvYield) + '\u00a0kWh/Jahr Ertrag · Standort ' + reg.region + ' (' + reg.yield + '\u00a0kWh/kWp)')
        : 'Trag oben die Anzahl Module ein, dann rechnet das Cockpit live.';

      renderSurplus(res);
    }

    function renderSurplus(res) {
      var el = $('dr-surplus-text');
      if (res.emsOn) {
        el.innerHTML = '<span class="ok">Mit EMS:</span> Dein Überschuss von ≈ ' + fmt(res.pvExport) +
          '\u00a0kWh/Jahr wird intelligent gesteuert eingespeist – die Einspeisung bleibt gesichert, und der ' +
          '§14a-Netzentgelt-Vorteil ist nutzbar.';
      } else {
        el.innerHTML = '<span class="warn">Ohne EMS:</span> In den ≈ ' + res.negPriceHours +
          ' Stunden mit negativen Börsenpreisen (2025) kann die Vergütung deines Überschusses von ≈ ' + fmt(res.pvExport) +
          '\u00a0kWh/Jahr anteilig entfallen (<a href="/ratgeber/solarspitzengesetz" target="_blank" rel="noopener">Solarspitzengesetz §51 EEG</a>), ' +
          'und der §14a-Netzentgelt-Rabatt bleibt ggf. ungenutzt. Ein Energiemanagement sichert die Einspeisung.';
      }
    }

    // --- Gauge (Ring) auf Canvas, S/W-tauglich ---
    function drawGauge(canvas, pct) {
      if (!canvas || !canvas.getContext) return;
      var ctx = canvas.getContext('2d');
      var W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, r = W*0.38, lw = W*0.11;
      ctx.clearRect(0,0,W,H);
      // Track
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.lineWidth = lw; ctx.strokeStyle = '#e3e6e0'; ctx.stroke();
      // Wert-Bogen
      var frac = Math.max(0, Math.min(1, pct/100));
      ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2 + frac*Math.PI*2); ctx.lineWidth = lw; ctx.strokeStyle = '#2E4F3C'; ctx.lineCap = 'round'; ctx.stroke();
      // Text
      ctx.fillStyle = '#2E4F3C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 ' + Math.round(W*0.24) + 'px Outfit, sans-serif';
      ctx.fillText(Math.round(pct) + '%', cx, cy);
    }

    function fmt(n) { return Math.round(n).toLocaleString('de-DE'); }

    // --- Events ---
    $('dr-surfaces').addEventListener('click', function (e) {
      var chip = e.target.closest('.dr-chip');
      if (chip) { surfaces[+chip.dataset.i][chip.dataset.prop] = chip.dataset.val; renderSurfaces(); recalc(); return; }
      var del = e.target.closest('[data-del]');
      if (del) { surfaces.splice(+del.dataset.del, 1); renderSurfaces(); recalc(); }
    });
    $('dr-surfaces').addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.prop) {
        var numeric = (t.dataset.prop === 'modules' || t.dataset.prop === 'modulePower');
        var v = numeric ? (parseInt(t.value) || 0) : t.value;
        surfaces[+t.dataset.i][t.dataset.prop] = v;
        // numerische Felder nicht neu rendern → Tippfokus bleibt erhalten
        if (!numeric) renderSurfaces();
        recalc();
      }
    });
    $('dr-surfaces').addEventListener('change', function (e) {
      if (e.target.dataset && e.target.dataset.prop === 'tilt') {
        surfaces[+e.target.dataset.i].tilt = e.target.value; recalc();
      }
    });
    $('dr-add').addEventListener('click', function () {
      surfaces.push({ orientation:'O', tilt:'mittel', modules:0, modulePower:440, shading:'keine' });
      renderSurfaces(); recalc();
    });
    $('dr-ems').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ems]'); if (!b) return;
      ems = b.dataset.ems;
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) { x.classList.toggle('on', x.dataset.ems === ems); });
      recalc();
    });
    ['dr-plz','dr-verbrauch','dr-batt','dr-wp-kwh','dr-ev-km'].forEach(function (id) {
      $(id).addEventListener('input', recalc);
    });
    $('dr-wp-on').addEventListener('change', function () { $('dr-wp-detail').style.display = this.checked ? '' : 'none'; recalc(); });
    $('dr-ev-on').addEventListener('change', function () { $('dr-ev-detail').style.display = this.checked ? '' : 'none'; recalc(); });

    // Vor dem Druck: Gauges neu zeichnen und Methodik/Quellen aufklappen
    // (Wissenschafts-Beleg gehört sichtbar aufs Blatt).
    var methodEl = document.querySelector('.dr-method');
    var methodWasOpen = false;
    window.addEventListener('beforeprint', function () {
      recalc();
      if (methodEl) { methodWasOpen = methodEl.open; methodEl.open = true; }
    });
    window.addEventListener('afterprint', function () {
      if (methodEl) methodEl.open = methodWasOpen;
    });

    renderSurfaces();
    recalc();
  })();
