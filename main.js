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
        if (!val.trim()) return 'Bitte geben Sie Ihren Namen ein.';
        if (val.trim().length < 2) return 'Name muss mindestens 2 Zeichen haben.';
        return '';
      }
    },
    email: {
      el: () => qs('#email'),
      errEl: () => qs('#email-error'),
      validate(val) {
        if (!val.trim()) return 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        return '';
      }
    },
    message: {
      el: () => qs('#message'),
      errEl: () => qs('#message-error'),
      validate(val) {
        if (!val.trim()) return 'Bitte geben Sie eine Nachricht ein.';
        if (val.trim().length < 10) return 'Bitte beschreiben Sie Ihr Anliegen etwas ausführlicher.';
        return '';
      }
    },
    datenschutz: {
      el: () => qs('#datenschutz'),
      errEl: () => qs('#datenschutz-error'),
      validate(val, el) {
        if (!el.checked) return 'Bitte stimmen Sie der Datenschutzerklärung zu.';
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
        name:    form.querySelector('[name="name"]').value.trim(),
        email:   form.querySelector('[name="email"]').value.trim(),
        phone:   form.querySelector('[name="phone"]').value.trim(),
        subject: form.querySelector('[name="subject"]').value,
        message: form.querySelector('[name="message"]').value.trim(),
      };
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      success = res.ok;
    } catch (_) {
      success = false;
    }

    submitBtn.classList.remove('is-loading');

    if (success) {
      submitBtn.style.display = 'none';
      successMsg.classList.add('is-visible');
      form.reset();
      Object.keys(validators).forEach(f => clearError(f));
    } else {
      submitBtn.disabled = false;
      // Show generic error (customize as needed)
      alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail.');
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
    { id: 1, short: 'DWW', name: 'DWW Deutsche Wärmepumpen Werke', category: 'Wärmepumpen', desc: 'Spezialist für hocheffiziente Wärmepumpensysteme – made in Germany, für Neubau und Sanierung.', url: 'https://www.deutsche-waermepumpen-werke.de', logo: 'assets/partner/dww.svg' },
    { id: 2, short: 'EZS', name: 'EZS Energiezentrum-Services', category: 'Energieberatung', desc: 'Ganzheitliche Energieberatung und Serviceleistungen rund um erneuerbare Energieanlagen.', url: 'https://www.energiezentrum-services.de', logo: 'assets/partner/ezs.svg' },
    { id: 3, short: 'ALZ', name: 'Allianz Versicherung', category: 'Versicherung', desc: 'Maßgeschneiderte Versicherungslösungen für PV-Anlagen, Wärmepumpen und Energiespeicher.', url: 'https://www.allianz.de', logo: 'assets/partner/allianz.svg' },
    { id: 4, short: 'HEK', name: 'HEK Hanseatische Krankenversicherung', category: 'Krankenversicherung', desc: 'Attraktive Krankenkassenleistungen für Selbstständige und Handelsvertreter im Energiebereich.', url: 'https://www.hek.de', logo: 'assets/partner/hek.svg' },
    { id: 5, short: 'WÜS', name: 'Wüstenrot', category: 'Finanzierung', desc: 'Förderoptimierende Finanzierungslösungen und Bausparverträge für energetische Maßnahmen.', url: 'https://www.wuestenrot.de', logo: 'assets/partner/wuestenrot.svg' },
    { id: 6, short: 'CLO', name: 'Cloover', category: 'Cleantech', desc: 'Digitale Plattform für die Finanzierung und Verwaltung erneuerbarer Energieprojekte.', url: 'https://www.cloover.com', logo: 'assets/partner/cloover.svg' },
  ];

  let rotationAngle = 0;
  let autoRotate = true;
  let activeId = null;
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
      <div class="orbital-node-badge" role="button" tabindex="0" aria-label="${p.name}">
        <img src="${p.logo}" alt="${p.name}" width="42" height="42"
             onerror="this.style.opacity='.35'">
      </div>
      <div class="orbital-node-popup" role="tooltip" aria-label="${p.name} – Link">
        <span class="orbital-node-popup-name">${p.name}</span>
        <a href="${p.url}" target="_blank" rel="noopener noreferrer"
           class="orbital-popup-link">
          Besuchen
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>`;
    wrapper.appendChild(node);

    const badge = node.querySelector('.orbital-node-badge');
    badge.addEventListener('click', e => {
      e.stopPropagation();
      activeId === p.id ? deactivate() : activate(p.id);
    });
    badge.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activeId === p.id ? deactivate() : activate(p.id);
      }
    });

    nodeEls.push({ el: node, partner: p });
  });

  function activate(id) {
    activeId = id;
    autoRotate = false;
    nodeEls.forEach(({ el, partner }) =>
      el.classList.toggle('is-active', partner.id === id));
  }

  function deactivate() {
    activeId = null;
    autoRotate = true;
    nodeEls.forEach(({ el }) => el.classList.remove('is-active'));
  }

  // Klick außerhalb schließt Popup
  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) deactivate();
  });

  function animate() {
    if (autoRotate) rotationAngle = (rotationAngle + 0.3) % 360;

    const total = partners.length;
    const radius = getRadius();

    nodeEls.forEach(({ el }, i) => {
      const angle = ((i / total) * 360 + rotationAngle) % 360;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      const depth = Math.sin(rad);
      const opacity = el.classList.contains('is-active') ? 1 :
        Math.max(0.45, 0.45 + 0.55 * ((1 + depth) / 2));
      const zIdx = el.classList.contains('is-active') ? 50 :
        Math.round(10 + 5 * depth);

      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      el.style.opacity = opacity;
      el.style.zIndex = zIdx;
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

/* ── Init ─────────────────────────────────────────────────── */
function init() {
  initMobileNav();
  initStickyNav();
  initActiveNav();
  initScrollReveal();
  initSmoothScroll();
  initContactForm();
  initShaderHero();
  initSpotlightCards();
  initPartnerSection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
