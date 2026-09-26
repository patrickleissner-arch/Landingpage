/* ==========================================================================
   main.js: Navigation, Scroll-Animationen (GSAP), Marquee, Kontaktformular
   Alle Animationen laufen über transform/opacity und respektieren
   prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Navigation ---------- */
  const header = document.getElementById('site-header');
  const toggle = document.querySelector('.nav__toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (toggle && mobileMenu) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
      mobileMenu.hidden = true;
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) return closeMenu();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menü schließen');
      mobileMenu.hidden = false;
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  const dock = document.querySelector('.dock');

  if (hasGsap && window.ScrollTrigger) {
    ScrollTrigger.create({
      start: 'top -60',
      onUpdate: self => header.classList.toggle('is-scrolled', self.scroll() > 60)
    });
    if (dock) {
      const heroEl = document.querySelector('[data-hero]');
      const kontaktEl = document.querySelector('#kontakt');
      if (heroEl) {
        ScrollTrigger.create({
          trigger: heroEl,
          start: 'bottom 80%',
          onEnter: () => dock.classList.add('is-visible'),
          onLeaveBack: () => dock.classList.remove('is-visible')
        });
      } else {
        // Unterseiten: Kontaktleiste ab dem ersten Scrollen einblenden
        ScrollTrigger.create({
          start: 'top -240',
          onUpdate: self => dock.classList.toggle('is-visible', self.scroll() > 240)
        });
      }
      if (kontaktEl) {
        ScrollTrigger.create({
          trigger: kontaktEl,
          start: 'top 60%',
          onEnter: () => dock.classList.remove('is-visible'),
          onLeaveBack: () => dock.classList.add('is-visible')
        });
      }
    }
    // Aktiver Menüpunkt
    document.querySelectorAll('.nav__links a[href^="#"]').forEach(link => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target, start: 'top 45%', end: 'bottom 45%',
        onToggle: self => link.classList.toggle('is-active', self.isActive)
      });
    });
  } else {
    header.classList.add('is-scrolled');
    if (dock) dock.classList.add('is-visible');
  }

  /* ---------- Hero-Einstieg: Zeilen laufen nacheinander ein ---------- */
  if (hasGsap && !reduce && document.querySelector('[data-hero]')) {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.15)
      .from('.hero__text', { y: 24, opacity: 0, duration: 0.9 }, 0.55)
      .from('.hero__actions .btn', { y: 18, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.7)
      .from('.hero__facts .fact', { y: 16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.9);

    // Hero-Inhalt bleibt beim Weiterscrollen leicht zurück (Tiefenwirkung).
    // Text und Kennzahlen bewegen sich gemeinsam um denselben Pixelwert, damit
    // ihr Abstand erhalten bleibt und die Buttons nie überdeckt werden.
    gsap.to('.hero__inner, .hero__facts', {
      y: () => Math.round(window.innerHeight * 0.1), opacity: 0.35, ease: 'none',
      scrollTrigger: {
        trigger: '[data-hero]', start: 'top top', end: 'bottom top',
        scrub: true, invalidateOnRefresh: true
      }
    });
  }

  /* ---------- Intro: Wörter erhellen sich beim Lesen ---------- */
  const lead = document.querySelector('[data-split]');
  if (lead) {
    const words = lead.textContent.trim().split(/\s+/);
    lead.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const spans = lead.querySelectorAll('.w');
    if (hasGsap && !reduce) {
      ScrollTrigger.create({
        trigger: lead, start: 'top 80%', end: 'bottom 55%', scrub: 0.4,
        onUpdate: self => {
          const n = Math.round(self.progress * spans.length);
          spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
        }
      });
    } else {
      spans.forEach(s => s.classList.add('is-on'));
    }
  }

  /* ---------- Kacheln und Blöcke erscheinen beim Scrollen ---------- */
  if (hasGsap && !reduce) {
    gsap.utils.toArray('[data-reveal], .reveal').forEach((el, i) => {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        delay: (i % 3) * 0.08
      });
    });
    /* Tagespreis-Kurve auf der Speicher-Kachel einmalig zeichnen */
    const curve = document.querySelector('.market__curve');
    if (curve && typeof curve.getTotalLength === 'function') {
      const len = curve.getTotalLength();
      gsap.fromTo(curve,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut',
          scrollTrigger: { trigger: curve.closest('.tile'), start: 'top 85%', once: true },
          onComplete: () => { curve.style.strokeDasharray = 'none'; }
        });
    }

    gsap.utils.toArray('.section-head, .about__text, .direct, .form, .footer__cta-inner').forEach(el => {
      gsap.from(el, {
        y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------- Arbeitsweise: Linie füllt sich, Schritte werden aktiv ---------- */
  const steps = document.querySelectorAll('[data-step]');
  const stepsList = document.querySelector('.steps');
  if (stepsList && steps.length) {
    if (hasGsap && !reduce) {
      ScrollTrigger.create({
        trigger: stepsList, start: 'top 60%', end: 'bottom 60%', scrub: 0.3,
        onUpdate: self => stepsList.style.setProperty('--line-progress', (self.progress * 100).toFixed(1) + '%')
      });
      steps.forEach(step => {
        ScrollTrigger.create({
          trigger: step, start: 'top 62%',
          onEnter: () => step.classList.add('is-active'),
          onLeaveBack: () => step.classList.remove('is-active')
        });
        gsap.from(step, {
          x: 24, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 90%', once: true }
        });
      });
    } else {
      stepsList.style.setProperty('--line-progress', '100%');
      steps.forEach(s => s.classList.add('is-active'));
    }
  }

  /* ---------- Über mich: leichter Parallax auf dem Portrait ---------- */
  const fig = document.querySelector('[data-parallax] img');
  if (fig && hasGsap && !reduce) {
    gsap.fromTo(fig, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: '[data-parallax]', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Animationen anhalten (Laufband, 3D-Szenen) ----------
     Dauerbewegung neben Inhalt braucht eine Pause-Möglichkeit. Der Schalter
     sitzt im Fußbereich jeder Seite und wird im Browser gemerkt. */
  function bewegungAus() { return document.documentElement.classList.contains('motion-paused'); }
  (function () {
    let gemerkt = false;
    try { gemerkt = localStorage.getItem('pl-motion-paused') === '1'; } catch (e) {}
    const setze = aus => {
      document.documentElement.classList.toggle('motion-paused', aus);
      document.querySelectorAll('[data-motion-toggle]').forEach(b => {
        b.setAttribute('aria-pressed', aus ? 'true' : 'false');
        b.textContent = aus ? 'Animationen fortsetzen' : 'Animationen anhalten';
      });
      try { localStorage.setItem('pl-motion-paused', aus ? '1' : '0'); } catch (e) {}
      window.dispatchEvent(new CustomEvent('motion:change', { detail: { paused: aus } }));
    };
    setze(gemerkt);
    document.querySelectorAll('[data-motion-toggle]').forEach(b => {
      if (reduce) { b.hidden = true; return; }  // bei reduzierter Bewegung läuft ohnehin nichts
      b.addEventListener('click', () => setze(!bewegungAus()));
    });
  })();

  /* ---------- Partner-Marquee (einmal pro Seite) ---------- */
  const track = document.querySelector('.marquee__track');
  if (track && !reduce) {
    // Inhalt verdoppeln, damit die Schleife nahtlos läuft
    // Kopien sind reine Optik: für Screenreader ausgeblendet, damit jedes Logo nur einmal vorgelesen wird
    [...track.children].forEach(el => {
      const k = el.cloneNode(true);
      k.setAttribute('aria-hidden', 'true');
      if (k.tagName === 'IMG') k.alt = '';
      track.appendChild(k);
    });
    const half = () => track.scrollWidth / 2;
    if (hasGsap) {
      let tween;
      const build = () => {
        if (tween) tween.kill();
        gsap.set(track, { x: 0 });
        tween = gsap.to(track, { x: -half(), duration: Math.max(22, half() / 60), ease: 'none', repeat: -1 });
      };
      build();
      let raf;
      window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); });
      track.addEventListener('mouseenter', () => tween.timeScale(0.25));
      track.addEventListener('mouseleave', () => tween.timeScale(1));
      // Fokus im Laufband oder globaler Bewegungsschalter halten es an
      track.addEventListener('focusin', () => tween.pause());
      track.addEventListener('focusout', () => { if (!bewegungAus()) tween.play(); });
      const sync = () => (bewegungAus() ? tween.pause() : tween.play());
      window.addEventListener('motion:change', sync);
      sync();
    }
  }

  /* ---------- Kontaktformular (3 Schritte, gleiche Schnittstelle wie bisher) ---------- */
  const form = document.getElementById('contactForm');
  if (!form) return;

  const endpoint = form.dataset.endpoint || '/api/contact';
  const stepEls = [...form.querySelectorAll('.form__step')];
  const counter = document.getElementById('form-counter');
  const barFill = document.getElementById('form-bar-fill');
  const btnBack = document.getElementById('form-back');
  const btnNext = document.getElementById('form-next');
  const btnSubmit = document.getElementById('form-submit');
  const successMsg = document.getElementById('form-success');
  const titles = ['Deine Kontaktdaten', 'Worum geht es?', 'Nachricht und Bestätigung'];
  const themen = [];
  let current = 1;

  const field = name => form.querySelector(`[name="${name}"]`);
  const setError = (name, msg) => {
    const box = form.querySelector(`[data-error-for="${name}"]`);
    const el = field(name);
    if (box) box.textContent = msg || '';
    if (el && el.closest('.field')) el.closest('.field').classList.toggle('has-error', !!msg);
    if (el && msg) el.setAttribute('aria-invalid', 'true'); else if (el) el.removeAttribute('aria-invalid');
  };

  const validators = {
    vorname: v => v.trim().length >= 2 ? '' : 'Bitte gib deinen Vornamen ein.',
    nachname: v => v.trim().length >= 2 ? '' : 'Bitte gib deinen Nachnamen ein.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Bitte gib eine gültige E-Mail-Adresse ein.',
    phone: v => v.replace(/[\s\-()\/]/g, '').match(/^\+?\d{6,15}$/) ? '' : 'Bitte gib eine gültige Telefonnummer ein.',
    plz: v => (v.trim() === '' || /^\d{5}$/.test(v.trim())) ? '' : 'Bitte gib eine fünfstellige Postleitzahl ein.'
  };

  // Bei Energie-Themen verlangt der Server die Adresse (Standorteinschätzung).
  // Die Liste muss zu needsAddress in server.js passen.
  const ADRESS_THEMEN = ['pv', 'wp', 'speicher', 'mieterstrom'];
  const brauchtAdresse = () => themen.some(t => ADRESS_THEMEN.indexOf(t) > -1);
  const adresseAnzeigen = () => {
    const pflicht = brauchtAdresse();
    form.querySelectorAll('[data-adresse-marke]').forEach(m => { m.textContent = pflicht ? '*' : '(optional)'; });
    const hinweis = form.querySelector('[data-adresse-hinweis]');
    if (hinweis) hinweis.hidden = !pflicht;
    ['strasse', 'plz', 'ort'].forEach(n => { const el = field(n); if (el) el.toggleAttribute('required', pflicht); });
  };

  const validateStep = n => {
    let ok = true;
    if (n === 1) {
      ['vorname', 'nachname', 'email', 'phone'].forEach(name => {
        const msg = validators[name](field(name).value);
        setError(name, msg); if (msg) ok = false;
      });
    }
    if (n === 2) {
      const msg = themen.length ? '' : 'Bitte wähle mindestens ein Thema aus.';
      setError('themen', msg); if (msg) ok = false;
      const pflicht = brauchtAdresse();
      const leer = { strasse: 'Bitte gib Straße und Hausnummer ein.', plz: 'Bitte gib deine Postleitzahl ein.', ort: 'Bitte gib deinen Ort ein.' };
      ['strasse', 'plz', 'ort'].forEach(n => {
        const v = field(n).value.trim();
        let m = pflicht && !v ? leer[n] : '';
        if (!m && n === 'plz') m = validators.plz(v);
        setError(n, m); if (m) ok = false;
      });
    }
    if (n === 3) {
      const msg = field('datenschutz').checked ? '' : 'Bitte bestätige die Datenschutzerklärung.';
      setError('datenschutz', msg); if (msg) ok = false;
    }
    return ok;
  };

  const showStep = n => {
    current = n;
    stepEls.forEach(s => s.classList.toggle('is-active', Number(s.dataset.formStep) === n));
    counter.textContent = `Schritt ${n} von 3: ${titles[n - 1]}`;
    barFill.style.setProperty('--form-progress', (n / 3).toFixed(4));
    btnBack.hidden = n === 1;
    btnNext.hidden = n === 3;
    btnSubmit.hidden = n !== 3;
    const legend = stepEls[n - 1].querySelector('legend');
    if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
  };

  form.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const t = chip.dataset.thema;
      const i = themen.indexOf(t);
      if (i >= 0) themen.splice(i, 1); else themen.push(t);
      chip.classList.toggle('is-selected', i < 0);
      chip.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
      if (themen.length) setError('themen', '');
      adresseAnzeigen();
      if (!brauchtAdresse()) ['strasse', 'plz', 'ort'].forEach(n => setError(n, ''));
    });
  });

  ['strasse', 'ort'].forEach(name => {
    const el = field(name);
    if (el) el.addEventListener('input', () => { if (el.value.trim()) setError(name, ''); });
  });

  Object.keys(validators).forEach(name => {
    const el = field(name);
    if (el) el.addEventListener('input', () => { if (el.closest('.field').classList.contains('has-error')) setError(name, validators[name](el.value)); });
  });

  // Bei Fehlern das erste betroffene Feld fokussieren, damit man sofort korrigieren kann
  const fokusErsterFehler = () => {
    const step = stepEls[current - 1];
    const el = step.querySelector('[aria-invalid="true"]') ||
      (step.querySelector('[data-error-for="themen"]:not(:empty)') && step.querySelector('.chip'));
    if (el) el.focus();
  };
  btnNext.addEventListener('click', () => { if (validateStep(current)) showStep(current + 1); else fokusErsterFehler(); });
  btnBack.addEventListener('click', () => showStep(current - 1));
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && current < 3) { e.preventDefault(); btnNext.click(); }
  });

  // Wer schon getippt hat und die Seite verlässt, wird gewarnt
  let ungesichert = false;
  form.addEventListener('input', e => { if (e.target.name !== 'hp_website') ungesichert = true; });
  window.addEventListener('beforeunload', e => { if (ungesichert) { e.preventDefault(); e.returnValue = ''; } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateStep(3)) { fokusErsterFehler(); return; }
    form.querySelector('.form__error-global')?.remove();
    btnSubmit.disabled = true;
    const label = btnSubmit.textContent;
    btnSubmit.textContent = 'Wird gesendet…';
    form.setAttribute('aria-busy', 'true');

    const payload = {
      vorname: field('vorname').value.trim(),
      nachname: field('nachname').value.trim(),
      email: field('email').value.trim(),
      phone: field('phone').value.trim(),
      strasse: field('strasse').value.trim(),
      plz: field('plz').value.trim(),
      ort: field('ort').value.trim(),
      themen: themen.slice(),
      message: field('message').value.trim(),
      consentKontakt: field('consentKontakt').checked,
      hp_website: field('hp_website').value
    };

    let success = false, rateLimited = false;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 429) rateLimited = true;
      const data = await res.json().catch(() => ({}));
      success = res.ok && data.status === 'pending';
    } catch (err) { success = false; }

    btnSubmit.disabled = false;
    btnSubmit.textContent = label;
    form.removeAttribute('aria-busy');

    if (success) {
      ungesichert = false;
      btnSubmit.hidden = true; btnBack.hidden = true;
      successMsg.textContent = 'Danke! Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link darin, um deine Anfrage abzuschließen.';
      successMsg.hidden = false;
      form.reset();
      themen.length = 0;
      form.querySelectorAll('.chip.is-selected').forEach(c => { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
      adresseAnzeigen();
      stepEls.forEach(s => s.classList.remove('is-active'));
      counter.textContent = 'Anfrage gesendet';
      barFill.style.setProperty('--form-progress', '1');
    } else {
      const box = document.createElement('p');
      box.className = 'form__error-global';
      box.setAttribute('role', 'alert');
      box.textContent = rateLimited
        ? 'Du hast zu viele Anfragen gesendet. Bitte warte einige Minuten.'
        : 'Das hat leider nicht geklappt. Bitte versuche es erneut oder schreib direkt an p@patrickleissner.de.';
      form.appendChild(box);
    }
  });
})();

/* Rückmeldung nach dem Bestätigungslink (Double-Opt-in).
   server.js leitet auf /?confirmed=true|expired|error um. */
(function () {
  var status = new URLSearchParams(location.search).get('confirmed');
  if (!status) return;
  var kontakt = document.getElementById('kontakt');
  var ziel = kontakt && kontakt.querySelector('.section-head');
  if (!ziel) return;
  var art = status === 'true' ? 'ok' : status === 'expired' ? 'warn' : 'err';
  var texte = {
    ok: 'Danke, deine Anfrage ist bestätigt und bei mir angekommen. Ich melde mich innerhalb von 1 bis 2 Werktagen.',
    warn: 'Dein Bestätigungslink ist abgelaufen. Bitte sende das Formular einfach noch einmal.',
    err: 'Da ist etwas schiefgelaufen. Bitte versuch es noch einmal oder schreib direkt an p@patrickleissner.de.'
  };
  var box = document.createElement('p');
  box.className = 'confirm-banner confirm-banner--' + art;
  box.setAttribute('role', 'status');
  box.textContent = texte[art];
  ziel.after(box);
  history.replaceState(null, '', location.pathname + location.hash);
  requestAnimationFrame(function () { kontakt.scrollIntoView({ block: 'start' }); });
})();
