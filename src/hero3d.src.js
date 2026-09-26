/* ==========================================================================
   hero3d.src.js: Drei-dimensionale Sonne aus goldenen Partikeln (Three.js)
   Motiv aus dem Logo (Sonne mit Strahlen). Bewusst leichtgewichtig:
   Punkte statt Meshes, Shader ohne Texturen, DPR gedeckelt, Rendering
   pausiert außerhalb des Viewports. Wird mit esbuild zu js/hero3d.js gebündelt.
   ========================================================================== */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Points, BufferGeometry,
  BufferAttribute, Float32BufferAttribute, ShaderMaterial, AdditiveBlending,
  LineSegments, LineBasicMaterial, Color, Vector2
} from 'three';
import { initTile3d } from './tile3d.src.js';
import { initErtrag3d } from './ertrag3d.src.js';


const canvas = document.getElementById('hero-canvas');
const hero = document.querySelector('[data-hero]');
if (canvas && hero) init();

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mobile = window.innerWidth < 961;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 7.5);

  const root = new Group();
  scene.add(root);

  const GOLD = new Color('#d3af3c');
  const GOLD_LIGHT = new Color('#f3e5b5');
  const GREEN_LIGHT = new Color('#8fc7b0');

  /* ---------- Gemeinsames Punkt-Shader-Material ---------- */
  const makePointMaterial = (size, opacity) => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size * renderer.getPixelRatio() },
      uOpacity: { value: opacity },
      uColorA: { value: GOLD },
      uColorB: { value: GOLD_LIGHT },
      uColorC: { value: GREEN_LIGHT }
    },
    vertexShader: `
      attribute float aPhase;
      attribute float aScale;
      attribute float aTint;
      uniform float uTime;
      uniform float uSize;
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec3 p = position;
        // sanftes Atmen: jeder Punkt pulsiert leicht in seiner Richtung
        float breathe = 1.0 + 0.045 * sin(uTime * 0.9 + aPhase * 6.2831);
        p *= breathe;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float twinkle = 0.65 + 0.35 * sin(uTime * 1.7 + aPhase * 12.566);
        vAlpha = twinkle;
        vTint = aTint;
        gl_PointSize = uSize * aScale * twinkle * (10.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.05, d);
        vec3 col = mix(uColorA, uColorB, smoothstep(0.35, 0.0, d));
        col = mix(col, uColorC, step(0.92, vTint));
        gl_FragColor = vec4(col, soft * vAlpha * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });

  /* ---------- Sonne: Punkte auf einer Kugel (Fibonacci-Verteilung) ---------- */
  const sunCount = mobile ? 1700 : 3600;
  const sunGeo = new BufferGeometry();
  {
    const pos = new Float32Array(sunCount * 3);
    const phase = new Float32Array(sunCount);
    const scale = new Float32Array(sunCount);
    const tint = new Float32Array(sunCount);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < sunCount; i++) {
      const y = 1 - (i / (sunCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      // leichte Tiefenstreuung, damit die Kugel nicht wie eine Hülle wirkt
      const rad = 1.55 * (0.86 + 0.14 * Math.random());
      pos[i * 3] = Math.cos(t) * r * rad;
      pos[i * 3 + 1] = y * rad;
      pos[i * 3 + 2] = Math.sin(t) * r * rad;
      phase[i] = Math.random();
      scale[i] = 0.55 + Math.random() * 0.9;
      tint[i] = Math.random();
    }
    sunGeo.setAttribute('position', new BufferAttribute(pos, 3));
    sunGeo.setAttribute('aPhase', new BufferAttribute(phase, 1));
    sunGeo.setAttribute('aScale', new BufferAttribute(scale, 1));
    sunGeo.setAttribute('aTint', new BufferAttribute(tint, 1));
  }
  const sunMat = makePointMaterial(3.2, 0.95);
  const sun = new Points(sunGeo, sunMat);
  root.add(sun);

  /* ---------- Strahlen: schmale Linien wie im Logo ---------- */
  const rayCount = 14;
  const rayGeo = new BufferGeometry();
  {
    const v = [];
    for (let i = 0; i < rayCount; i++) {
      const a = (i / rayCount) * Math.PI * 2;
      const inner = 1.9 + Math.random() * 0.2;
      const outer = inner + 0.25 + Math.random() * 0.55;
      v.push(Math.cos(a) * inner, Math.sin(a) * inner, 0, Math.cos(a) * outer, Math.sin(a) * outer, 0);
    }
    rayGeo.setAttribute('position', new Float32BufferAttribute(v, 3));
  }
  const rays = new LineSegments(rayGeo, new LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 }));
  rays.rotation.x = 0.35;
  root.add(rays);

  /* ---------- Ring: umlaufender Energiestrom ---------- */
  const ringCount = mobile ? 320 : 640;
  const ringGeo = new BufferGeometry();
  {
    const pos = new Float32Array(ringCount * 3);
    const phase = new Float32Array(ringCount);
    const scale = new Float32Array(ringCount);
    const tint = new Float32Array(ringCount);
    for (let i = 0; i < ringCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.7 + (Math.random() - 0.5) * 0.35;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      pos[i * 3 + 2] = Math.sin(a) * r;
      phase[i] = Math.random();
      scale[i] = 0.4 + Math.random() * 0.8;
      tint[i] = Math.random();
    }
    ringGeo.setAttribute('position', new BufferAttribute(pos, 3));
    ringGeo.setAttribute('aPhase', new BufferAttribute(phase, 1));
    ringGeo.setAttribute('aScale', new BufferAttribute(scale, 1));
    ringGeo.setAttribute('aTint', new BufferAttribute(tint, 1));
  }
  const ringMat = makePointMaterial(2.4, 0.8);
  const ring = new Points(ringGeo, ringMat);
  ring.rotation.x = 1.15;
  ring.rotation.z = -0.35;
  root.add(ring);

  /* ---------- Staub: weit gestreute Punkte für Tiefe ---------- */
  const dustCount = mobile ? 220 : 520;
  const dustGeo = new BufferGeometry();
  {
    const pos = new Float32Array(dustCount * 3);
    const phase = new Float32Array(dustCount);
    const scale = new Float32Array(dustCount);
    const tint = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      phase[i] = Math.random();
      scale[i] = 0.3 + Math.random() * 0.6;
      tint[i] = Math.random();
    }
    dustGeo.setAttribute('position', new BufferAttribute(pos, 3));
    dustGeo.setAttribute('aPhase', new BufferAttribute(phase, 1));
    dustGeo.setAttribute('aScale', new BufferAttribute(scale, 1));
    dustGeo.setAttribute('aTint', new BufferAttribute(tint, 1));
  }
  const dustMat = makePointMaterial(2.0, 0.45);
  const dust = new Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---------- Layout: rechts auf Desktop, oben zentriert auf Mobil ---------- */
  const base = { x: 0, y: 0, scale: 1 };
  const layout = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (w < 961) {
      base.x = 0.2; base.y = 1.35; base.scale = Math.min(0.78, w / 520);
    } else {
      const fx = Math.min(1, (w - 960) / 480); // 960px → 0, 1440px → 1
      base.x = 1.55 + fx * 0.55; base.y = 0.15; base.scale = 0.92 + fx * 0.14;
    }
    root.position.set(base.x, base.y, 0);
    root.scale.setScalar(base.scale);
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(hero);

  /* ---------- Interaktion: Maus-Parallax (nur mit feinem Zeiger) ---------- */
  const mouse = new Vector2(0, 0);
  const target = new Vector2(0, 0);
  if (!coarse && !reduce) {
    window.addEventListener('pointermove', e => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    }, { passive: true });
  }

  /* ---------- Render-Schleife, pausiert wenn Hero nicht sichtbar ---------- */
  let visible = true;
  let running = false;
  let last = performance.now();
  let t = 0;
  // Layoutwerte nicht im Render-Takt lesen: Höhe bei Größenänderung,
  // Scrollposition über ein passives Scroll-Ereignis zwischenspeichern.
  let heroH = hero.offsetHeight || 1;
  let scrollPos = window.scrollY;
  new ResizeObserver(() => { heroH = hero.offsetHeight || 1; }).observe(hero);
  window.addEventListener('scroll', () => { scrollPos = window.scrollY; }, { passive: true });
  const angehalten = () => document.documentElement.classList.contains('motion-paused');


  const frame = now => {
    if (!visible || document.hidden || angehalten()) { running = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    // Scroll-Fortschritt innerhalb des Heros: Sonne steigt und wird kleiner
    const progress = Math.min(1, Math.max(0, scrollPos / heroH));
    mouse.lerp(target, 0.05);

    sun.rotation.y = t * 0.12 + mouse.x * 0.25;
    sun.rotation.x = mouse.y * -0.2;
    rays.rotation.z = -t * 0.05;
    ring.rotation.y = t * 0.22;
    dust.rotation.y = t * 0.015;
    dust.position.y = progress * 1.2;

    root.rotation.y = mouse.x * 0.12;
    root.rotation.x = -mouse.y * 0.08;
    root.position.y += (base.y + progress * 2.4 - root.position.y) * 0.1;
    const s = root.scale.x;
    const targetScale = base.scale * (1 - progress * 0.35);
    root.scale.setScalar(s + (targetScale - s) * 0.1);

    sunMat.uniforms.uTime.value = t;
    ringMat.uniforms.uTime.value = t;
    dustMat.uniforms.uTime.value = t;
    sunMat.uniforms.uOpacity.value = 0.95 * (1 - progress * 0.6);
    ringMat.uniforms.uOpacity.value = 0.8 * (1 - progress * 0.6);
    rays.material.opacity = 0.22 * (1 - progress);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || reduce) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };

  if (reduce) {
    // Reduzierte Bewegung: ein einziges, ruhiges Bild
    sun.rotation.y = 0.6;
    renderer.render(scene, camera);
  } else {
    const io = new IntersectionObserver(entries => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) start();
    }, { threshold: 0 });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
    window.addEventListener('motion:change', () => { if (visible && !angehalten()) start(); });
    start();
  }
}

/* Zweite Szene: Preisgebirge in der Leistungskachel (gleiches Bundle,
   damit Three.js nur einmal ausgeliefert wird). */
initTile3d();

/* Dritte Szene: Ertragsbühne im Rechner der Speicherseite. */
initErtrag3d();
