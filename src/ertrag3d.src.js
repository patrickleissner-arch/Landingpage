/* ==========================================================================
   ertrag3d.src.js: Dreidimensionale Ertragsbühne für den Rechner auf der
   Seite "Batteriespeicher & Energiehandel".

   Neun Monatssäulen, gestapelt aus Handelserlös (gold) und vorgehaltener
   Regelleistung (grün). Die Säulen wachsen animiert, sobald Speichergröße
   oder Vermarktung gewechselt werden. Zeiger über einer Säule zeigt Monat
   und Betrag, Ziehen dreht die Bühne.

   Die Werte kommen aus dem Rechner über window.__ertragDaten und das
   Ereignis "ertrag:update". Rendering pausiert außerhalb des Viewports.
   ========================================================================== */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BoxGeometry,
  MeshLambertMaterial, MeshBasicMaterial, AmbientLight, DirectionalLight, Color, Vector2,
  Raycaster, BufferGeometry, Float32BufferAttribute, LineSegments,
  LineBasicMaterial, AdditiveBlending
} from 'three';

export function initErtrag3d() {
  const canvas = document.getElementById('ertrag-canvas');
  const stage = document.querySelector('.er-stage');
  if (!canvas || !stage) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    stage.classList.add('er-stage--kein-3d');
    return;
  }
  const small = () => stage.clientWidth < 620;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  stage.classList.add('has-3d');

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 80);
  const root = new Group();
  scene.add(root);

  scene.add(new AmbientLight(0xffffff, 0.92));
  const sonne = new DirectionalLight(0xfff4d8, 1.05);
  sonne.position.set(4, 8, 6);
  scene.add(sonne);


  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September'];
  const N = MONATE.length;
  const BREITE = 0.52, ABSTAND = 0.86, HOCH_MAX = 3.3;

  const GOLD = new Color('#d3af3c');
  const GOLD_AN = new Color('#f0d271');
  const GRUEN = new Color('#2f7a63');
  const GRUEN_AN = new Color('#57b294');

  /* ---------- Bodengitter für Tiefenwirkung ---------- */
  const bodenPunkte = [];
  const spanne = (N - 1) * ABSTAND / 2 + 1.1;
  for (let i = -3; i <= 3; i++) {
    bodenPunkte.push(-spanne, 0, i * 0.5, spanne, 0, i * 0.5);
  }
  for (let i = 0; i <= N; i++) {
    const x = -(N - 1) * ABSTAND / 2 + (i - 0.5) * ABSTAND;
    bodenPunkte.push(x, 0, -1.5, x, 0, 1.5);
  }
  const bodenGeo = new BufferGeometry();
  bodenGeo.setAttribute('position', new Float32BufferAttribute(bodenPunkte, 3));
  const boden = new LineSegments(bodenGeo, new LineBasicMaterial({
    color: new Color('#3f8a72'), transparent: true, opacity: 0.28,
    depthWrite: false, blending: AdditiveBlending
  }));
  root.add(boden);

  /* ---------- Säulen: unten Handel, oben Regelleistung ---------- */
  const geo = new BoxGeometry(BREITE, 1, BREITE);
  geo.translate(0, 0.5, 0);   // Ursprung an den Fuß, damit Skalierung wächst
  const trefferGeo = new BoxGeometry(ABSTAND * 0.96, 1, BREITE * 1.8);
  trefferGeo.translate(0, 0.5, 0);

  const saeulen = [];
  for (let i = 0; i < N; i++) {
    const g = new Group();
    g.position.x = -(N - 1) * ABSTAND / 2 + i * ABSTAND;
    const unten = new Mesh(geo, new MeshLambertMaterial({ color: GOLD.clone() }));
    const oben = new Mesh(geo, new MeshLambertMaterial({ color: GRUEN.clone() }));
    unten.scale.y = 0.001; oben.scale.y = 0.001;
    oben.visible = false;
    // Unsichtbare, breitere Fläche über der ganzen Säulenhöhe: der Zeiger
    // soll die Säule finden, ohne dass der Nutzer zielen muss.
    const treffer = new Mesh(trefferGeo, new MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false
    }));
    treffer.scale.y = HOCH_MAX;
    treffer.layers.set(1);   // eigene Ebene: wird nicht gezeichnet, nur getroffen
    g.add(unten, oben, treffer);
    root.add(g);
    saeulen.push({ g, unten, oben, treffer, zielU: 0, zielO: 0, istU: 0, istO: 0, monat: MONATE[i], da: 0, fcr: 0 });
  }

  /* ---------- Werte aus dem Rechner übernehmen ---------- */
  let zeigeFcr = false;
  function setzeDaten(d) {
    if (!d || !d.da) return;
    zeigeFcr = !!d.zeigeFcr;
    const max = Math.max(...d.da.map((v, i) => v + (zeigeFcr ? d.fcr[i] : 0)), 1);
    for (let i = 0; i < N; i++) {
      const s = saeulen[i];
      s.da = d.da[i] || 0;
      s.fcr = zeigeFcr ? (d.fcr[i] || 0) : 0;
      s.zielU = Math.max(s.da / max * HOCH_MAX, 0.02);
      s.zielO = zeigeFcr ? Math.max(s.fcr / max * HOCH_MAX, 0.02) : 0;
      s.oben.visible = zeigeFcr;
    }
  }
  setzeDaten(window.__ertragDaten);
  window.addEventListener('ertrag:update', e => setzeDaten(e.detail));

  /* ---------- Zeiger: Säule hervorheben und Betrag zeigen ---------- */
  const tip = stage.querySelector('.er-tip');
  const raycaster = new Raycaster();
  raycaster.layers.set(1);
  const zeiger = new Vector2();
  let aktiv = -1, ueber = false;
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  function pruefeZeiger(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    zeiger.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(zeiger, camera);
    const tr = raycaster.intersectObjects(saeulen.map(s => s.treffer), false);
    const neu = tr.length ? saeulen.findIndex(s => s.treffer === tr[0].object) : -1;
    if (neu !== aktiv) {
      aktiv = neu;
      saeulen.forEach((s, i) => {
        s.unten.material.color.copy(i === aktiv ? GOLD_AN : GOLD);
        s.oben.material.color.copy(i === aktiv ? GRUEN_AN : GRUEN);
      });
    }
    if (aktiv > -1 && tip) {
      const s = saeulen[aktiv];
      tip.innerHTML = '<strong>' + s.monat + '</strong>' +
        '<span>Handel ' + euro.format(s.da) + '</span>' +
        (zeigeFcr ? '<span>Regelleistung ' + euro.format(s.fcr) + '</span>' : '') +
        '<em>' + euro.format(s.da + s.fcr) + '</em>';
      tip.hidden = false;
      const halb = tip.offsetWidth / 2 + 8;
      const x = Math.min(Math.max(clientX - r.left, halb), r.width - halb);
      const y = Math.max(clientY - r.top, tip.offsetHeight + 22);
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    } else if (tip) {
      tip.hidden = true;
    }
  }

  /* ---------- Ziehen dreht die Bühne ---------- */
  let drehZiel = 0, dreh = 0, neigeZiel = 0, neige = 0;
  let zieht = false, startX = 0, startDreh = 0;

  if (!reduce) {
    let startY = 0;
    stage.addEventListener('pointerdown', e => {
      zieht = true; startX = e.clientX; startY = e.clientY; startDreh = drehZiel;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('er-stage--zieht');
    });
    stage.addEventListener('pointermove', e => {
      ueber = true;
      if (zieht) {
        drehZiel = startDreh + (e.clientX - startX) * 0.006;
        drehZiel = Math.max(-0.85, Math.min(0.85, drehZiel));
        if (tip) tip.hidden = true;
      } else if (!coarse) {
        neigeZiel = -((e.clientY - stage.getBoundingClientRect().top) / stage.clientHeight - 0.5) * 0.18;
        pruefeZeiger(e.clientX, e.clientY);
      }
    });
    const ende = e => {
      if (!zieht) return;
      zieht = false; stage.classList.remove('er-stage--zieht');
      try { stage.releasePointerCapture(e.pointerId); } catch (x) {}
      // Kaum bewegt heißt getippt: Säule unter dem Finger anzeigen
      if (e.type === 'pointerup' && Math.hypot(e.clientX - startX, e.clientY - startY) < 8) {
        pruefeZeiger(e.clientX, e.clientY);
      }
    };
    stage.addEventListener('pointerup', ende);
    stage.addEventListener('pointercancel', ende);
    stage.addEventListener('pointerleave', e => {
      // Nach einem Fingertipp feuert der Browser sofort pointerleave.
      // Der Tooltip soll dann stehen bleiben, bis woanders getippt wird.
      if (e.pointerType === 'touch') return;
      ueber = false; neigeZiel = 0;
      if (tip) tip.hidden = true;
      if (aktiv > -1) {
        aktiv = -1;
        saeulen.forEach(s => { s.unten.material.color.copy(GOLD); s.oben.material.color.copy(GRUEN); });
      }
    });
  }

  /* ---------- Größe ---------- */
  const layout = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (small()) {
      camera.position.set(0, 3.7, 11.2);
      root.scale.setScalar(0.8);
    } else {
      camera.position.set(0, 3.0, 8.2);
      root.scale.setScalar(1);
    }
    camera.lookAt(0, 1.25, 0);
    camera.updateProjectionMatrix();
  };
  layout();
  new ResizeObserver(layout).observe(stage);

  /* ---------- Schleife ---------- */
  const angehalten = () => document.documentElement.classList.contains('motion-paused');

  let sichtbar = false, laeuft = false, t = 0, last = performance.now();

  const zeichne = (dt) => {
    // Zeitbasiert annähern, damit das Wachstum unabhängig von der Bildrate
    // immer gleich lange dauert (Zeitkonstante rund 140 ms).
    const k = 1 - Math.exp(-(dt || 0.016) * 7);
    saeulen.forEach(s => {
      s.istU += (s.zielU - s.istU) * k;
      s.istO += (s.zielO - s.istO) * k;
      s.unten.scale.y = Math.max(s.istU, 0.001);
      s.oben.scale.y = Math.max(s.istO, 0.001);
      s.oben.position.y = s.istU;
    });
    dreh += (drehZiel - dreh) * Math.min(1, k * 1.2);
    neige += (neigeZiel - neige) * Math.min(1, k);
    root.rotation.y = dreh + (reduce ? 0.26 : Math.sin(t * 0.16) * 0.14);
    if (angehalten()) root.rotation.y = dreh + 0.26;
    root.rotation.x = neige;
    renderer.render(scene, camera);
  };

  const frame = now => {
    if (!sichtbar || document.hidden) { laeuft = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!angehalten()) t += dt;
    zeichne(dt);
    requestAnimationFrame(frame);
  };
  const start = () => {
    if (laeuft) return;
    laeuft = true; last = performance.now();
    requestAnimationFrame(frame);
  };

  if (reduce) {
    // Reduzierte Bewegung: Säulen sofort auf Endhöhe, ein Standbild
    saeulen.forEach(s => { s.istU = s.zielU; s.istO = s.zielO; });
    zeichne(1);
    window.addEventListener('ertrag:update', () => {
      saeulen.forEach(s => { s.istU = s.zielU; s.istO = s.zielO; });
      zeichne(1);
    });
  } else {
    const io = new IntersectionObserver(es => {
      // Letzten Eintrag nehmen: bei Layoutwechseln kommen mehrere auf einmal
      // und der erste kann bereits veraltet sein. Sonst stirbt die Schleife.
      sichtbar = es[es.length - 1].isIntersecting;
      if (sichtbar) start();
    }, { threshold: 0 });
    io.observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && sichtbar) start(); });
    window.addEventListener('ertrag:update', () => { if (sichtbar) start(); else zeichne(1); });
  }
}
