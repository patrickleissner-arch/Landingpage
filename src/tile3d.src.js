/* ==========================================================================
   tile3d.src.js: Preisgebirge für die Leistungskachel "Batteriespeicher
   & Energiehandel". Der Tagesverlauf des Börsenpreises wird zu einer
   dreidimensionalen Landschaft aus Punkten. Im Tal lädt der Speicher
   (grün), auf dem Abendgipfel liefert er (gold).

   Bewusst leichtgewichtig: nur Punkte und eine Linie, keine Texturen,
   keine Lichter, DPR gedeckelt, Rendering pausiert außerhalb des
   Viewports. Wird zusammen mit hero3d.src.js gebündelt, damit Three.js
   nur einmal ausgeliefert wird.
   ========================================================================== */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Points, BufferGeometry,
  BufferAttribute, Float32BufferAttribute, ShaderMaterial, AdditiveBlending,
  Line, LineSegments, LineBasicMaterial, Color, Vector2, CatmullRomCurve3, Vector3
} from 'three';

export function initTile3d() {
  const canvas = document.getElementById('tile-canvas');
  const tile = document.querySelector('.tile--market');
  if (!canvas || !tile) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 961;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    return; // Ohne WebGL bleibt die SVG-Kurve stehen
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);

  // Ab hier übernimmt die 3D-Szene, die SVG-Fassung wird ausgeblendet
  tile.classList.add('has-3d');

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 3.1, 6.9);
  camera.lookAt(0, -0.25, -1.2);

  const root = new Group();
  root.rotation.y = -0.16;
  scene.add(root);

  const GOLD = new Color('#d3af3c');
  const GOLD_HELL = new Color('#f0dc9a');
  const GRUEN = new Color('#6fd0a8');
  const TIEF = new Color('#3f8a72');

  /* ---------- Tagesverlauf: dieselben Stützpunkte wie die SVG-Kurve ---------- */
  // x = Tageszeit 0..1, y = SVG-Koordinate (klein = teuer), umgerechnet in Höhe
  const STUETZ = [
    [0, 104], [40, 118], [80, 96], [118, 70], [152, 102], [186, 141],
    [220, 146], [250, 112], [282, 44], [312, 74], [360, 100]
  ];
  const kurve = new CatmullRomCurve3(
    STUETZ.map(([x, y]) => new Vector3(x / 360, (150 - y) / 62, 0)), false, 'catmullrom', 0.5
  );
  const proben = 256;
  const hoehen = new Float32Array(proben + 1);
  for (let i = 0; i <= proben; i++) hoehen[i] = kurve.getPoint(i / proben).y;
  const hoeheBei = u => {
    const f = Math.min(Math.max(u, 0), 1) * proben;
    const i = Math.floor(f), r = f - i;
    return hoehen[i] * (1 - r) + hoehen[Math.min(i + 1, proben)] * r;
  };

  // Lade- und Lieferfenster, deckungsgleich mit der SVG-Darstellung
  const LADEN = [166 / 360, 228 / 360];
  const LIEFERN = [262 / 360, 304 / 360];
  const imFenster = (u, f) => u >= f[0] && u <= f[1];
  // 0 = neutral, 1 = Ladefenster, 2 = Lieferfenster
  const fensterVon = u => imFenster(u, LADEN) ? 1 : (imFenster(u, LIEFERN) ? 2 : 0);

  const BREITE = 9.2;   // Tagesbreite in Weltkoordinaten
  const TIEFE = 3.8;    // Ausdehnung nach hinten

  /* ---------- Punktmaterial ---------- */
  const punktMaterial = (groesse, deckkraft) => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: groesse * renderer.getPixelRatio() },
      uOpacity: { value: deckkraft },
      uPuls: { value: 0 },
      uNeutral: { value: TIEF },
      uGruen: { value: GRUEN },
      uGold: { value: GOLD },
      uGoldHell: { value: GOLD_HELL }
    },
    vertexShader: `
      attribute float aFenster;   /* 0 neutral, 1 laden, 2 liefern */
      attribute float aTiefe;     /* 0 vorne .. 1 hinten */
      attribute float aPhase;
      uniform float uTime;
      uniform float uSize;
      uniform float uPuls;
      varying float vFenster;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        /* Sanfte Welle, die nach hinten durchläuft: der Markt atmet */
        float welle = sin(uTime * 0.9 - aTiefe * 3.4 + aPhase) * 0.06;
        pos.y += welle * (0.35 + pos.y * 0.22);

        /* Im aktiven Fenster heben sich die Punkte kurz an */
        float aktiv = 0.0;
        if (aFenster > 1.5) aktiv = smoothstep(0.55, 1.0, uPuls);
        else if (aFenster > 0.5) aktiv = smoothstep(0.0, 0.45, uPuls) * (1.0 - smoothstep(0.45, 0.62, uPuls));
        pos.y += aktiv * 0.16;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        float naehe = 1.0 - aTiefe * 0.55;
        gl_PointSize = uSize * naehe * (0.72 + aktiv * 0.7) * (7.0 / -mv.z);
        vFenster = aFenster;
        vAlpha = naehe * (0.72 + aktiv * 0.45);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float uOpacity;
      uniform vec3 uNeutral;
      uniform vec3 uGruen;
      uniform vec3 uGold;
      varying float vFenster;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float r = dot(d, d);
        if (r > 0.25) discard;
        float rand = smoothstep(0.25, 0.02, r);
        vec3 farbe = uNeutral;
        if (vFenster > 1.5) farbe = uGold;
        else if (vFenster > 0.5) farbe = uGruen;
        gl_FragColor = vec4(farbe, rand * vAlpha * uOpacity);
      }
    `,
    transparent: true, depthWrite: false, blending: AdditiveBlending
  });

  /* ---------- Liniengitter: die Preislandschaft ----------
     Linien statt Punkte: bei dieser Kachelgröße bleiben sie auch auf
     schwachen Geräten scharf und lesen sich technischer. */
  const NX = small ? 44 : 72;
  const NZ = small ? 8 : 13;

  const gitterPos = [];
  const gitterFarbe = [];
  const hilfe = new Color();

  // Farbe eines Gitterpunkts: Fenster bestimmt den Ton, Tiefe die Helligkeit
  const farbeAn = (u, tz) => {
    const f = fensterVon(u);
    hilfe.copy(f === 2 ? GOLD : f === 1 ? GRUEN : TIEF);
    // Additives Blending kennt kein Alpha auf Linien: Tiefe über Helligkeit
    const hell = (1 - tz * 0.66) * (f === 0 ? 0.42 : 1.0);
    return [hilfe.r * hell, hilfe.g * hell, hilfe.b * hell];
  };
  const punktAn = (u, tz) => [
    (u - 0.5) * BREITE,
    hoeheBei(u) * (1 - tz * 0.3) - 1.05,
    -tz * TIEFE
  ];
  const segment = (u1, z1, u2, z2) => {
    gitterPos.push(...punktAn(u1, z1), ...punktAn(u2, z2));
    gitterFarbe.push(...farbeAn(u1, z1), ...farbeAn(u2, z2));
  };

  for (let iz = 0; iz < NZ; iz++) {
    const tz = iz / (NZ - 1);
    for (let ix = 0; ix < NX - 1; ix++) segment(ix / (NX - 1), tz, (ix + 1) / (NX - 1), tz);
  }
  const schritt = small ? 5 : 4;
  for (let ix = 0; ix < NX; ix += schritt) {
    const u = ix / (NX - 1);
    for (let iz = 0; iz < NZ - 1; iz++) segment(u, iz / (NZ - 1), u, (iz + 1) / (NZ - 1));
  }

  const feldGeo = new BufferGeometry();
  feldGeo.setAttribute('position', new Float32BufferAttribute(gitterPos, 3));
  feldGeo.setAttribute('color', new Float32BufferAttribute(gitterFarbe, 3));
  const feldMat = new LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: small ? 0.85 : 0.62,
    depthWrite: false, blending: AdditiveBlending
  });
  const feld = new LineSegments(feldGeo, feldMat);
  root.add(feld);

  /* ---------- Leuchtende Vorderkante: die eigentliche Preiskurve ---------- */
  const linienPunkte = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    linienPunkte.push(new Vector3((u - 0.5) * BREITE, hoeheBei(u) - 1.04, 0.06));
  }
  const linieGeo = new BufferGeometry().setFromPoints(linienPunkte);
  const linieMat = new LineBasicMaterial({ color: GOLD_HELL, transparent: true, opacity: 0.85 });
  const linie = new Line(linieGeo, linieMat);
  root.add(linie);

  /* ---------- Energiefluss: laden fällt ein, liefern steigt auf ---------- */
  function stream(bereich, richtung, menge, farbeIstGold) {
    const p = new Float32Array(menge * 3);
    const f = new Float32Array(menge);
    const t = new Float32Array(menge);
    const ph = new Float32Array(menge);
    for (let i = 0; i < menge; i++) {
      const u = bereich[0] + Math.random() * (bereich[1] - bereich[0]);
      p[i * 3] = (u - 0.5) * BREITE;
      p[i * 3 + 1] = hoeheBei(u) - 1.04;
      p[i * 3 + 2] = -Math.random() * TIEFE * 0.75;
      f[i] = farbeIstGold ? 2 : 1;
      t[i] = Math.random();
      ph[i] = Math.random() * 6.28;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(p, 3));
    g.setAttribute('aFenster', new BufferAttribute(f, 1));
    g.setAttribute('aTiefe', new BufferAttribute(t, 1));
    g.setAttribute('aPhase', new BufferAttribute(ph, 1));
    const m = punktMaterial(small ? 3.0 : 3.6, 0.0);
    const pts = new Points(g, m);
    pts.userData = { basis: Float32Array.from(p), richtung, menge, mat: m };
    root.add(pts);
    return pts;
  }
  const ladeFluss = stream(LADEN, -1, small ? 46 : 92, false);
  const lieferFluss = stream(LIEFERN, 1, small ? 40 : 80, true);

  function flussAktualisieren(obj, t, staerke) {
    const attr = obj.geometry.getAttribute('position');
    const basis = obj.userData.basis;
    const r = obj.userData.richtung;
    for (let i = 0; i < obj.userData.menge; i++) {
      const lauf = (t * 0.45 + i / obj.userData.menge) % 1;
      // Laden: Partikel sinken in das Tal. Liefern: sie steigen vom Gipfel auf.
      const weg = r > 0 ? lauf : (1 - lauf);
      attr.array[i * 3 + 1] = basis[i * 3 + 1] + weg * 1.15 * r + (r > 0 ? 0 : 1.15);
    }
    attr.needsUpdate = true;
    obj.userData.mat.uniforms.uOpacity.value = staerke;
  }

  /* ---------- Größe und Ausschnitt ---------- */
  const layout = () => {
    const w = tile.clientWidth || 1;
    const h = tile.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Auf schmalen Kacheln weiter weg und flacher, damit alles ins Bild passt
    if (w < 560) {
      // Schmale Kachel: weiter weg und kleiner, sonst läuft die Landschaft aus dem Bild
      camera.position.set(0, 2.9, 9.2);
      root.position.set(0, 0.78, 0);
      root.scale.setScalar(0.88);
    } else {
      camera.position.set(0, 3.1, 6.9);
      root.position.set(1.95, 0.05, 0);
      root.scale.setScalar(0.98);
    }
    camera.lookAt(root.position.x * 0.55, -0.25, -1.2);
    camera.updateProjectionMatrix();
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(tile);

  /* ---------- Maus-Parallax nur mit feinem Zeiger ---------- */
  const ziel = new Vector2(0, 0);
  const maus = new Vector2(0, 0);
  if (!coarse && !reduce) {
    tile.addEventListener('pointermove', e => {
      const r = tile.getBoundingClientRect();
      ziel.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    }, { passive: true });
    tile.addEventListener('pointerleave', () => ziel.set(0, 0), { passive: true });
  }

  /* ---------- Schleife, pausiert außerhalb des Viewports ---------- */
  const angehalten = () => document.documentElement.classList.contains('motion-paused');

  let sichtbar = false, laeuft = false, t = 0, last = performance.now();

  const frame = now => {
    if (!sichtbar || document.hidden || angehalten()) { laeuft = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;

    // Tageszyklus von 9 Sekunden: erst laden, dann liefern
    const puls = (t % 9) / 9;
    maus.lerp(ziel, 0.06);

    // Gitter atmet leicht mit dem Tageszyklus
    feld.position.y = Math.sin(t * 0.7) * 0.035;
    feldMat.opacity = (small ? 0.8 : 0.58) + Math.sin(t * 0.7) * 0.06;
    ladeFluss.userData.mat.uniforms.uTime.value = t;
    ladeFluss.userData.mat.uniforms.uPuls.value = puls;
    lieferFluss.userData.mat.uniforms.uTime.value = t;
    lieferFluss.userData.mat.uniforms.uPuls.value = puls;

    const ladeStaerke = Math.max(0, Math.sin(Math.PI * Math.min(puls / 0.5, 1))) * 0.65;
    const lieferStaerke = puls > 0.5 ? Math.max(0, Math.sin(Math.PI * ((puls - 0.5) / 0.5))) * 0.7 : 0;
    flussAktualisieren(ladeFluss, t, ladeStaerke);
    flussAktualisieren(lieferFluss, t, lieferStaerke);

    linieMat.opacity = 0.72 + Math.sin(t * 1.4) * 0.12;

    root.rotation.y = -0.16 + maus.x * 0.1 + Math.sin(t * 0.18) * 0.02;
    root.rotation.x = -0.02 + maus.y * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  const start = () => {
    if (laeuft || reduce) return;
    laeuft = true; last = performance.now();
    requestAnimationFrame(frame);
  };

  if (reduce) {
    // Reduzierte Bewegung: ein ruhiges Standbild, kein Animationsloop
    ladeFluss.userData.mat.uniforms.uOpacity.value = 0.5;
    lieferFluss.userData.mat.uniforms.uOpacity.value = 0.6;
    renderer.render(scene, camera);
  } else {
    const io = new IntersectionObserver(es => {
      sichtbar = es[es.length - 1].isIntersecting;
      if (sichtbar) start();
    }, { threshold: 0 });
    io.observe(tile);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && sichtbar) start(); });
    window.addEventListener('motion:change', () => { if (sichtbar && !angehalten()) start(); });
  }
}
