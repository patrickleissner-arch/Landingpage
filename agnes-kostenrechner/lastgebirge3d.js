/* ============================================================
   lastgebirge3d.js: Lastgang als Gelände (Tage × Tageszeit × kW)
   mit goldener Schnittebene auf Höhe der Kappgrenze.
   Braucht THREE r128 (assets/vendor/three-r128.min.js).
   ============================================================ */
(function (root) {
  'use strict';

  function erstelle(buehne) {
    const THREE = root.THREE;
    if (!THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { return null; }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    buehne.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const szene = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    szene.add(new THREE.HemisphereLight(0xf1f0e9, 0x0e2a22, 0.85));
    const sonne = new THREE.DirectionalLight(0xfff1c9, 0.9);
    sonne.position.set(-4, 7, 5); szene.add(sonne);

    const BREITE = 10, TIEFE = 5.2, HOEHE = 2.6;
    const gruppe = new THREE.Group(); szene.add(gruppe);
    const sockel = new THREE.Mesh(
      new THREE.BoxGeometry(BREITE + 0.3, 0.12, TIEFE + 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1d4235, roughness: 0.9 }));
    sockel.position.y = -0.07; gruppe.add(sockel);

    const ebene = new THREE.Mesh(
      new THREE.PlaneGeometry(BREITE + 0.5, TIEFE + 0.5),
      new THREE.MeshBasicMaterial({ color: 0xd0ab3b, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false }));
    ebene.rotation.x = -Math.PI / 2; gruppe.add(ebene);
    const rand = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(BREITE + 0.5, TIEFE + 0.5)),
      new THREE.LineBasicMaterial({ color: 0xedc96f }));
    rand.rotation.x = -Math.PI / 2; gruppe.add(rand);

    let gelaende = null, hoehen = null, peak = 1, grenze = 0, zielY = 0;
    const tief = new THREE.Color(0x24503f), hoch = new THREE.Color(0xa6d2b0);
    const glutA = new THREE.Color(0xe9c35a), glutB = new THREE.Color(0xe0703c), farbe = new THREE.Color();

    function faerbe() {
      if (!gelaende) return;
      const f = gelaende.geometry.attributes.color;
      for (let i = 0; i < hoehen.length; i++) {
        const v = hoehen[i];
        if (v > grenze + 1e-6) farbe.copy(glutA).lerp(glutB, Math.min(1, (v - grenze) / Math.max(1e-6, peak - grenze)));
        else farbe.copy(tief).lerp(hoch, Math.pow(v / Math.max(grenze, 1e-6), 0.8));
        f.setXYZ(i, farbe.r, farbe.g, farbe.b);
      }
      f.needsUpdate = true;
    }

    function setzeLast(last, dt) {
      const jeTag = Math.max(1, Math.round(24 / dt));
      const tage = Math.max(2, Math.min(366, Math.floor(last.length / jeTag)));
      const zeilen = Math.min(jeTag, 96), schritt = jeTag / zeilen;
      if (gelaende) { gruppe.remove(gelaende); gelaende.geometry.dispose(); }
      const geo = new THREE.PlaneGeometry(BREITE, TIEFE, tage - 1, zeilen - 1);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      hoehen = new Float32Array(pos.count); peak = 0;
      for (let z = 0; z < zeilen; z++) for (let d = 0; d < tage; d++) {
        let m = 0;                                    // Spitze je Zelle, damit keine Lastspitze verschwindet
        for (let s = 0; s < schritt; s++) m = Math.max(m, last[d * jeTag + Math.floor(z * schritt) + s] || 0);
        hoehen[z * tage + d] = m; if (m > peak) peak = m;
      }
      for (let i = 0; i < pos.count; i++) pos.setY(i, hoehen[i] / peak * HOEHE);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
      geo.computeVertexNormals();
      gelaende = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide }));
      gruppe.add(gelaende);
      faerbe(); zeichne();
    }

    function setzeGrenze(kw) {
      grenze = kw; zielY = Math.min(1.02, kw / peak) * HOEHE;
      faerbe(); starte();
    }

    // Kamera: ziehen zum Drehen, sonst ruhiges Pendeln
    let azimut = -0.62, neigung = 0.50, beruehrt = false, sichtbar = true, laeuft = 0, t0 = 0;
    const ruhig = root.matchMedia('(prefers-reduced-motion: reduce)');
    function zeichne() {
      const b = buehne.clientWidth, h = buehne.clientHeight;
      if (!b || !h) return;
      if (renderer.domElement.width !== Math.round(b * renderer.getPixelRatio())) { renderer.setSize(b, h, false); kamera.aspect = b / h; }
      const abstand = b < 560 ? 17.5 : 13.2;
      kamera.position.set(Math.sin(azimut) * Math.cos(neigung) * abstand, Math.sin(neigung) * abstand + 0.6, Math.cos(azimut) * Math.cos(neigung) * abstand);
      kamera.lookAt(0, 0.75, 0); kamera.updateProjectionMatrix();
      renderer.render(szene, kamera);
    }
    function bild(t) {
      laeuft = 0;
      const diff = zielY - ebene.position.y;
      ebene.position.y += Math.abs(diff) < 0.002 || ruhig.matches ? diff : diff * 0.14;
      rand.position.y = ebene.position.y;
      if (!beruehrt && !ruhig.matches) { if (!t0) t0 = t; azimut = -0.62 + Math.sin((t - t0) / 5200) * 0.22; }
      zeichne();
      if (sichtbar && !document.hidden && ((!beruehrt && !ruhig.matches) || Math.abs(zielY - ebene.position.y) > 0.002)) starte();
    }
    function starte() { if (!laeuft) laeuft = requestAnimationFrame(bild); }

    let zieht = null;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { zieht = { x: e.clientX, y: e.clientY, a: azimut, n: neigung }; beruehrt = true; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (!zieht) return;
      azimut = zieht.a - (e.clientX - zieht.x) * 0.006;
      neigung = Math.max(0.12, Math.min(1.25, zieht.n + (e.clientY - zieht.y) * 0.005));
      starte();
    });
    const ende = () => { zieht = null; };
    el.addEventListener('pointerup', ende); el.addEventListener('pointercancel', ende);
    if ('IntersectionObserver' in root) new IntersectionObserver(a => { sichtbar = a[0].isIntersecting; if (sichtbar) starte(); }).observe(buehne);
    if ('ResizeObserver' in root) new ResizeObserver(() => starte()).observe(buehne);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) starte(); });

    return { setzeLast, setzeGrenze };
  }

  root.Lastgebirge = { erstelle };
})(window);
