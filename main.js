/**
 * PL – Energieprojekte | main.js
 * Vanilla JS: Navigation, Scroll-Animationen, Formularvalidierung
 */

'use strict';

/* ── Helpers ──────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Mobile Navigation ────────────────────────────────────── */
function initMobileNav() {
  const btn       = qs('#hamburger-btn');
  const menu      = qs('#mobile-menu');
  const mobileLinks = qsa('.mobile-nav-link');

  if (!btn || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Menü schließen');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menü öffnen');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close on link click
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      btn.focus();
    }
  });
}

/* ── Sticky Nav (scroll shadow) ───────────────────────────── */
function initStickyNav() {
  const header = qs('#site-header');
  if (!header) return;

  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('scrolled', !entry.isIntersecting),
    { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
  );

  // Observe the hero section top edge
  const hero = qs('#hero');
  if (hero) observer.observe(hero);
}

/* ── Nav CTA: hide when Termine section is visible ────────── */
function initNavCtaVisibility() {
  const navCta = qs('.nav-cta');
  const termine = qs('#termine');
  if (!navCta || !termine) return;

  const observer = new IntersectionObserver(
    ([entry]) => navCta.classList.toggle('nav-cta--hidden', entry.isIntersecting),
    { threshold: 0.15 }
  );
  observer.observe(termine);
}

/* ── Active Nav Link Tracking ─────────────────────────────── */
function initActiveNav() {
  const navLinks = qsa('[data-nav]');
  const sections = qsa('section[id]');

  if (!navLinks.length || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const active = navLinks.find(
            link => link.getAttribute('href') === `#${entry.target.id}`
          );
          if (active) active.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(section => observer.observe(section));
}

/* ── Scroll Reveal ────────────────────────────────────────── */
function initScrollReveal() {
  const elements = qsa('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
  );

  elements.forEach(el => observer.observe(el));
}

/* ── Smooth Scroll for Anchor Links ───────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) {
      // "#" alone → scroll to top
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72'
    );

    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });

    // Update URL hash without jumping
    history.pushState(null, '', `#${targetId}`);
  });
}

/* ── Contact Form Validation & Submission ─────────────────── */
function initContactForm() {
  const form       = qs('#contactForm');
  const submitBtn  = qs('#submitBtn');
  const successMsg = qs('#formSuccess');

  if (!form) return;

  /* Field validators */
  const validators = {
    name: {
      el: () => qs('#name'),
      errEl: () => qs('#name-error'),
      validate(val) {
        if (!val.trim()) return 'Bitte gib deinen Namen ein.';
        if (val.trim().length < 2) return 'Name muss mindestens 2 Zeichen haben.';
        return '';
      }
    },
    email: {
      el: () => qs('#email'),
      errEl: () => qs('#email-error'),
      validate(val) {
        if (!val.trim()) return 'Bitte gib deine E-Mail-Adresse ein.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
        return '';
      }
    },
    message: {
      el: () => qs('#message'),
      errEl: () => qs('#message-error'),
      validate(val) {
        if (!val.trim()) return 'Bitte gib eine Nachricht ein.';
        if (val.trim().length < 10) return 'Bitte beschreibe dein Anliegen etwas ausführlicher.';
        return '';
      }
    },
    datenschutz: {
      el: () => qs('#datenschutz'),
      errEl: () => qs('#datenschutz-error'),
      validate(val, el) {
        if (!el.checked) return 'Bitte stimme der Datenschutzerklärung zu.';
        return '';
      }
    }
  };

  function showError(field) {
    const { el, errEl, validate } = validators[field];
    const input = el();
    const errSpan = errEl();
    if (!input || !errSpan) return true;

    const msg = validate(input.value, input);
    if (msg) {
      errSpan.textContent = msg;
      input.classList.add('has-error');
      return false;
    }
    errSpan.textContent = '';
    input.classList.remove('has-error');
    return true;
  }

  function clearError(field) {
    const { el, errEl } = validators[field];
    const input = el();
    const errSpan = errEl();
    if (input)   { input.classList.remove('has-error'); }
    if (errSpan) { errSpan.textContent = ''; }
  }

  // Validate on blur (not on every keystroke)
  Object.keys(validators).forEach(field => {
    const input = validators[field].el();
    if (!input) return;
    input.addEventListener('blur', () => showError(field));
    input.addEventListener('input', () => {
      if (input.classList.contains('has-error')) showError(field);
      else clearError(field);
    });
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all required fields
    const valid = Object.keys(validators).map(field => showError(field));
    if (valid.includes(false)) {
      // Focus first invalid field
      const firstInvalid = Object.keys(validators).find(f => {
        const input = validators[f].el();
        return input && input.classList.contains('has-error');
      });
      if (firstInvalid) validators[firstInvalid].el().focus();
      return;
    }

    // Show loading state
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    let success = false;
    try {
      const payload = {
        name:       form.querySelector('[name="name"]').value.trim(),
        email:      form.querySelector('[name="email"]').value.trim(),
        phone:      form.querySelector('[name="phone"]').value.trim(),
        subject:    form.querySelector('[name="subject"]').value,
        message:    form.querySelector('[name="message"]').value.trim(),
        hp_website: form.querySelector('[name="hp_website"]').value,
      };
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      success = res.ok && data.status === 'pending';
      if (res.status === 429) {
        throw new Error('rate_limit');
      }
    } catch (err) {
      success = false;
      if (err.message === 'rate_limit') {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        alert('Du hast zu viele Anfragen gesendet. Bitte warte einige Minuten.');
        return;
      }
    }

    submitBtn.classList.remove('is-loading');

    if (success) {
      submitBtn.style.display = 'none';
      successMsg.textContent = 'Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link darin, um deine Anfrage abzuschicken.';
      successMsg.classList.add('is-visible');
      form.reset();
      Object.keys(validators).forEach(f => clearError(f));
    } else {
      submitBtn.disabled = false;
      alert('Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder kontaktiere uns direkt per E-Mail.');
    }
  });
}

/* ── WebGL Shader Hero ────────────────────────────────────── */
function initShaderHero() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl2');
  if (!gl) return; // Fallback: CSS-Hintergrund #070d0a bleibt sichtbar

  const vertSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

  const fragSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}
  return t;
}
float clouds(vec2 p){
  float d=1.,t=.0;
  for(float i=.0;i<3.;i++){
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);d=a;p*=2./(i+1.);
  }
  return t;
}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.10,bg*.16,bg*.12),d);
  }
  O=vec4(col,1);
}`;

  function compile(shader, src) {
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
    }
  }

  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  compile(vs, vertSrc);
  compile(fs, fragSrc);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'resolution');
  const uTime = gl.getUniformLocation(prog, 'time');

  let animId = null;

  function resize() {
    const dpr = Math.max(1, 0.5 * devicePixelRatio);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function loop(now) {
    gl.clearColor(0.027, 0.051, 0.039, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, now * 1e-3);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animId = requestAnimationFrame(loop);
  }

  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  animId = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animId = requestAnimationFrame(loop);
    }
  });
}

/* ── Partner Section ───────────────────────────────────────────── */
function initPartnerSection() {
  initOrbitalTimeline();
}


function initOrbitalTimeline() {
  const wrapper = document.getElementById('orbitalWrapper');
  if (!wrapper) return;

  const partners = [
    { id: 1, name: 'DWW Deutsche Wärmepumpen Werke', logo: 'assets/partner/DWW_Logo.png' },
    { id: 2, name: 'EZS Energiezentrum-Services',    logo: 'assets/partner/neu_ezs.svg' },
    { id: 3, name: 'Allianz Versicherung',           logo: 'assets/partner/neu_allianz.svg' },
    { id: 4, name: 'HEK Hanseatische Krankenversicherung', logo: 'assets/partner/neu_hek.png' },
    { id: 5, name: 'Wüstenrot',                      logo: 'assets/partner/Logo_Wüstenrot.png' },
    { id: 6, name: 'Clover',                         logo: 'assets/partner/Clover_Logo.png' },
    { id: 7, name: 'Viessmann',                      logo: 'assets/partner/neu_Viessmann.png' },
  ];

  let rotationAngle = 0;
  let animId = null;
  const nodeEls = [];

  // Compute radius relative to wrapper size
  function getRadius() {
    return wrapper.offsetWidth * 0.41;
  }

  // Spinning logo badge nodes
  partners.forEach(p => {
    const node = document.createElement('div');
    node.className = 'orbital-node';
    node.setAttribute('data-id', String(p.id));
    node.innerHTML = `
      <div class="orbital-node-badge" aria-label="${p.name}">
        <img src="${p.logo}" alt="${p.name}" width="50" height="50"
             onerror="this.style.opacity='.35'">
      </div>`;
    wrapper.appendChild(node);
    nodeEls.push({ el: node, partner: p });
  });

  function animate() {
    rotationAngle = (rotationAngle + 0.3) % 360;

    const total = partners.length;
    const radius = getRadius();

    nodeEls.forEach(({ el }, i) => {
      const angle = ((i / total) * 360 + rotationAngle) % 360;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      const depth = Math.sin(rad);
      const opacity = Math.max(0.45, 0.45 + 0.55 * ((1 + depth) / 2));

      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      el.style.opacity = opacity;
      el.style.zIndex = Math.round(10 + 5 * depth);
    });

    animId = requestAnimationFrame(animate);
  }

  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animId = requestAnimationFrame(animate);
  });
}

/* ── Spotlight Cards (Leistungen) ─────────────────────────── */
function initSpotlightCards() {
  const cards = qsa('.service-card');
  if (!cards.length) return;

  // Inject inner bloom div into each card (mirrors inner [data-glow] from the React original)
  cards.forEach(card => {
    const bloom = document.createElement('div');
    bloom.className = 'card-bloom';
    bloom.setAttribute('aria-hidden', 'true');
    card.insertBefore(bloom, card.firstChild);
  });

  document.addEventListener('pointermove', (e) => {
    cards.forEach(card => {
      card.style.setProperty('--x', e.clientX.toFixed(2));
      card.style.setProperty('--y', e.clientY.toFixed(2));
    });
  });

  document.addEventListener('pointerleave', () => {
    cards.forEach(card => {
      card.style.setProperty('--x', '-9999');
      card.style.setProperty('--y', '-9999');
    });
  });
}

/* ── Address Navigation Link (iOS → Apple Maps, others → Google Maps) ── */
function initAddressLink() {
  const link = document.getElementById('addressNavLink');
  if (link && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    link.href = 'maps://maps.apple.com/?daddr=Dessauer+Allee+52,+06766+Bitterfeld-Wolfen';
  }
}

/* ── Confirmed/Expired Banner after Double Opt-in redirect ─── */
function initConfirmationBanner() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('confirmed');
  if (!status) return;

  const kontakt = document.getElementById('kontakt');
  if (!kontakt) return;

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  if (status === 'true') {
    banner.style.cssText = 'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-weight:500';
    banner.textContent = '✓ Deine Anfrage wurde erfolgreich übermittelt. Ich melde mich innerhalb von 1–2 Werktagen.';
  } else if (status === 'expired') {
    banner.style.cssText = 'background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-weight:500';
    banner.textContent = 'Dein Bestätigungslink ist abgelaufen. Bitte sende das Formular erneut.';
  } else {
    banner.style.cssText = 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-weight:500';
    banner.textContent = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder kontaktiere uns direkt.';
  }

  const container = kontakt.querySelector('.container');
  if (container) container.prepend(banner);

  // URL bereinigen ohne Seitenneuladen
  history.replaceState(null, '', window.location.pathname);
}

/* ── Zeeg Modal ───────────────────────────────────────────── */
function initZeegModal() {
  const modal   = qs('#zeeg-modal');
  const openBtn = qs('#zeeg-open-btn');
  const closeBtn = qs('#zeeg-modal-close');
  const overlay  = qs('#zeeg-modal-overlay');
  if (!modal || !openBtn) return;

  let zeegLoaded = false;

  function loadZeegScript() {
    if (zeegLoaded) return;
    zeegLoaded = true;
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://assets.zeeg.me/embed.min.js';
    s.setAttribute('data-user', 'p902');
    s.async = true;
    document.body.appendChild(s);
  }

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    loadZeegScript();
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    openBtn.focus();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // Header-CTA öffnet ebenfalls das Modal
  const navCta = qs('.nav-cta');
  if (navCta) {
    navCta.addEventListener('click', e => { e.preventDefault(); openModal(); });
  }
}

/* ── Init ─────────────────────────────────────────────────── */
function init() {
  initMobileNav();
  initStickyNav();
  initNavCtaVisibility();
  initZeegModal();
  initActiveNav();
  initScrollReveal();
  initSmoothScroll();
  initContactForm();
  initShaderHero();
  initSpotlightCards();
  initPartnerSection();
  initAddressLink();
  initConfirmationBanner();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
