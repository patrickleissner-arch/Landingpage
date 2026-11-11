/* ==========================================================================
   foerderturm.src.js: Förderturm für /foerderrechner-waermepumpe

   Der Fördersatz als Säule aus goldenen Partikeln. Unten die
   Grundförderung, darauf der Klimageschwindigkeitsbonus, darauf der
   Einkommensbonus. Der Teil, der beim nächsten Stichtag wegfällt, glüht
   und bröckelt. Über allem liegt der Deckel (70 oder 80 %) als Scheibe.

   Bewusst leichtgewichtig wie hero3d/tile3d: nur Punkte, ein Shader,
   keine Texturen, keine Lichter, DPR gedeckelt, Rendering pausiert
   außerhalb des Viewports, bei "Animationen anhalten" und bei
   prefers-reduced-motion (dann Standbild).

   Bauen (Three.js und esbuild nur zur Build-Zeit, nichts davon geht live
   außer dem Bündel):
     cd tools/foerderturm && npm install
     npx esbuild foerderturm.src.js --bundle --minify --format=iife \
       --target=es2019 --outfile=../../assets/js/foerderturm.js
   ========================================================================== */
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  Points, ShaderMaterial, Color, Group, AdditiveBlending, NormalBlending,
  Mesh, CylinderGeometry, MeshStandardMaterial, HemisphereLight, DirectionalLight, TorusGeometry,
} from 'three';

const FARBEN = {
  grund: '#dbc269',   // Gold der Marke
  kgb: '#9fcf9a',     // helles Grün, hebt sich vom Waldgrün ab
  eink: '#f6f5ed',    // Creme
  lost: '#ef8a55',    // Glut: fällt beim nächsten Stichtag weg
  leer: '#b5c6b3',    // Salbei für den noch leeren Raum bis 100 %
};

const HOEHE = 3.0;
const RADIUS = 0.62;

const vertex = /* glsl */`
  attribute float aH;      // Höhe als Anteil 0..1 (entspricht 0..100 %)
  attribute float aRand;
  uniform float uTime, uB1, uB2, uB3, uLost, uSize, uHeight, uMotion;
  uniform vec3 cGrund, cKgb, cEink, cLost, cLeer;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float h = aH;
    float lostFrom = uB2 - uLost;
    vec3 col; float a; float s = 1.0;
    if (h < uB1)            { col = cGrund; a = 0.42; }
    else if (h < lostFrom)  { col = cKgb;   a = 0.42; }
    else if (h < uB2)       {
      col = cLost; a = 0.75 + 0.25 * sin(uTime * 4.0 + aRand * 20.0);
      // Bröckeln: die Partikel lösen sich leicht nach außen
      float drift = (0.5 + 0.5 * sin(uTime * 1.3 + aRand * 9.0)) * uMotion;
      p.xz *= 1.0 + 0.22 * drift;
      p.y -= 0.06 * drift;
    }
    else if (h < uB3)       { col = cEink;  a = 0.42; }
    else                    { col = cLeer;  a = 0.16; s = 0.6; }
    // leichtes Funkeln
    a *= 0.82 + 0.18 * sin(uTime * 2.0 + aRand * 31.0) * uMotion + 0.18 * (1.0 - uMotion);
    vColor = col; vAlpha = a;
    p.y = h * uHeight + (p.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * s * (1.0 + 0.6 * aRand) / -mv.z;
  }
`;

const fragment = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, vAlpha * soft);
  }
`;

const plateVertex = /* glsl */`
  attribute float aRand;
  uniform float uTime, uY, uSize, uMotion;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = uY + 0.01 * sin(uTime * 1.5 + aRand * 12.0) * uMotion;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * 0.7 / -mv.z;
    vAlpha = 0.28 + 0.2 * aRand;
  }
`;
const plateFragment = /* glsl */`
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.0, d));
  }
`;

function saeule(stufen, proRing) {
  const n = stufen * proRing;
  const pos = new Float32Array(n * 3);
  const h = new Float32Array(n);
  const r = new Float32Array(n);
  let i = 0;
  for (let s = 0; s < stufen; s++) {
    for (let k = 0; k < proRing; k++) {
      const rand = Math.random();
      // zwei Drittel auf der Hülle, der Rest füllt den Kern
      const rr = k % 3 === 0 ? RADIUS * Math.sqrt(Math.random()) * 0.92 : RADIUS * (0.94 + 0.06 * Math.random());
      const w = (k / proRing) * Math.PI * 2 + s * 0.37 + rand * 0.2;
      pos[i * 3] = Math.cos(w) * rr;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (HOEHE / stufen) * 0.8; // Versatz innerhalb der Stufe
      pos[i * 3 + 2] = Math.sin(w) * rr;
      h[i] = (s + 0.5) / stufen;
      r[i] = rand;
      i++;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aH', new BufferAttribute(h, 1));
  g.setAttribute('aRand', new BufferAttribute(r, 1));
  return g;
}

function scheibe(anzahl) {
  const pos = new Float32Array(anzahl * 3);
  const r = new Float32Array(anzahl);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < anzahl; i++) {
    const rr = RADIUS * 1.45 * Math.sqrt((i + 0.5) / anzahl);
    const w = i * golden;
    pos[i * 3] = Math.cos(w) * rr;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = Math.sin(w) * rr;
    r[i] = Math.random();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aRand', new BufferAttribute(r, 1));
  return g;
}

function mount(container) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return null; // kein WebGL: die Seite zeigt den flachen Turm
  }
  container.appendChild(canvas);

  const klein = matchMedia('(max-width: 900px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, klein ? 1.5 : 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  const group = new Group();
  scene.add(group);
  scene.add(new HemisphereLight(0xf6f5ed, 0x173c2e, 2.4));
  const light = new DirectionalLight(0xffedbe, 3); light.position.set(-3,5,4); scene.add(light);
  const layerColors = [FARBEN.grund, FARBEN.kgb, FARBEN.eink];
  const layers = layerColors.map(color => {
    const mesh = new Mesh(new CylinderGeometry(RADIUS*.89,RADIUS*.89,1,64),new MeshStandardMaterial({color,metalness:.42,roughness:.3}));
    group.add(mesh); return mesh;
  });
  const foot = new Mesh(new CylinderGeometry(.95,1.02,.12,64),new MeshStandardMaterial({color:0x345444,metalness:.5,roughness:.4}));
  foot.position.y=-.09; group.add(foot);
  const rim = new Mesh(new TorusGeometry(.96,.012,8,80),new MeshStandardMaterial({color:0xdbc269,metalness:.5,roughness:.3}));
  rim.rotation.x=Math.PI/2; rim.position.y=-.02; group.add(rim);
  const capRing = new Mesh(new TorusGeometry(.86,.008,8,80),new MeshStandardMaterial({color:0xe7e9d8,transparent:true,opacity:.6}));
  capRing.rotation.x=Math.PI/2; group.add(capRing);

  const uniforms = {
    uTime: { value: 0 }, uB1: { value: 0 }, uB2: { value: 0 }, uB3: { value: 0 }, uLost: { value: 0 },
    uSize: { value: 26 }, uHeight: { value: HOEHE }, uMotion: { value: 1 },
    cGrund: { value: new Color(FARBEN.grund) }, cKgb: { value: new Color(FARBEN.kgb) },
    cEink: { value: new Color(FARBEN.eink) }, cLost: { value: new Color(FARBEN.lost) },
    cLeer: { value: new Color(FARBEN.leer) },
  };
  const tower = new Points(
    saeule(klein ? 70 : 100, klein ? 34 : 48),
    new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, blending: AdditiveBlending })
  );
  group.add(tower);

  const plateUniforms = {
    uTime: uniforms.uTime, uMotion: uniforms.uMotion, uSize: uniforms.uSize,
    uY: { value: 0.7 * HOEHE }, uColor: { value: new Color('#f6f5ed') },
  };
  const plate = new Points(
    scheibe(klein ? 260 : 420),
    new ShaderMaterial({ uniforms: plateUniforms, vertexShader: plateVertex, fragmentShader: plateFragment, transparent: true, depthWrite: false, blending: NormalBlending })
  );
  group.add(plate);
  group.position.y = -HOEHE / 2;

  // Zielwerte und aktuelle Werte (weich nachgeführt)
  const ziel = { b1: 0, b2: 0, b3: 0, lost: 0, deckel: 0.7 };
  const ist = { b1: 0, b2: 0, b3: 0, lost: 0, deckel: 0.7 };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const paused = () => document.documentElement.classList.contains('motion-paused');
  let sichtbar = true, laeuft = false, letzte = 0, winkel = 0.6;

  function groesse() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Abstand so wählen, dass Säule und Scheibe immer ganz zu sehen sind
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const passend = (HOEHE * (camera.aspect < 1 ? 0.66 : 0.56)) / t;
    const dist = Math.max(passend, (RADIUS * 2.6) / camera.aspect / t);
    camera.position.set(0, dist * 0.38, dist);
    camera.lookAt(0, -HOEHE * 0.04, 0);
    camera.updateProjectionMatrix();
    uniforms.uSize.value = Math.max(8, Math.min(22, h / 18)) * renderer.getPixelRatio();
  }

  function schritt(t) {
    const still = reduced.matches || paused();
    const dt = Math.min(0.05, (t - letzte) / 1000 || 0.016);
    letzte = t;
    const k = still ? 1 : 1 - Math.pow(0.0015, dt); // weiches Nachführen
    let bewegt = false;
    for (const key of Object.keys(ziel)) {
      const d = ziel[key] - ist[key];
      if (Math.abs(d) > 0.0005) bewegt = true;
      ist[key] += d * k;
    }
    uniforms.uB1.value = ist.b1; uniforms.uB2.value = ist.b2; uniforms.uB3.value = ist.b3; uniforms.uLost.value = ist.lost;
    plateUniforms.uY.value = ist.deckel * HOEHE;
    capRing.position.y=ist.deckel*HOEHE;
    const bounds=[0,ist.b1,ist.b2,ist.b3];
    layers.forEach((mesh,i)=>{
      const height=(bounds[i+1]-bounds[i])*HOEHE;
      mesh.visible=height>.001;
      mesh.scale.y=Math.max(.001,height-.012);
      mesh.position.y=(bounds[i]+bounds[i+1])*HOEHE/2;
    });
    uniforms.uMotion.value = still ? 0 : 1;
    if (!still) { uniforms.uTime.value += dt; winkel += dt * 0.18; }
    group.rotation.y = winkel;
    renderer.render(scene, camera);
    return bewegt;
  }

  function loop(t) {
    if (!sichtbar || document.hidden) { laeuft = false; return; }
    const bewegt = schritt(t);
    const still = reduced.matches || paused();
    if (still && !bewegt) { laeuft = false; return; }
    requestAnimationFrame(loop);
  }
  function wecken() {
    if (!laeuft && sichtbar && !document.hidden) { laeuft = true; letzte = performance.now(); requestAnimationFrame(loop); }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { sichtbar = e[0].isIntersecting; wecken(); }).observe(container);
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { groesse(); wecken(); }).observe(container);
  addEventListener('motion:change', wecken);
  document.addEventListener('visibilitychange', wecken);
  canvas.addEventListener('webglcontextlost', () => { sichtbar=false; container.classList.remove('is-3d'); });
  reduced.addEventListener?.('change', wecken);
  groesse();
  wecken();

  return {
    set(s) {
      const c = (v) => Math.max(0, Math.min(1, v / 100));
      ziel.b1 = c(s.grund);
      ziel.b2 = c(s.grund + s.kgb);
      ziel.b3 = c(s.grund + s.kgb + s.eink);
      ziel.lost = c(s.lost || 0);
      ziel.deckel = c(s.deckel || 70);
      wecken();
    },
  };
}

window.Foerderturm = { mount };
window.dispatchEvent(new Event('foerderturm:ready'));
