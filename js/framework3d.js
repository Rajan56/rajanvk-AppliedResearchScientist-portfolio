// 3D view of the conceptual framework (dissertation Figure 3).
// Layout mirrors the figure: technologies at the left, performance management in the middle,
// the eleven transformed practices at the right, sustainability performance in front,
// all inside the digital transformation boundary.
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { TECH, PRACTICES, OUTCOMES } from "./framework_model.js";

const C = { ai: 0x9b7bff, iot: 0x3ccb7f, dt: 0x49d6de, pm: 0xf08a3c, practice: 0xe86fa6, business: 0xf2b134, environmental: 0x4fc77a, social: 0x6fa8ff, off: 0x46586c, plinth: 0x16293f, edge: 0x2f4d6b };
const PH = 4.2, OH = 3.6; // full height of a practice pillar and of an outcome column

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.35, "rgba(255,255,255,.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}

export function createFrameworkScene(container, labelLayer, tooltip, onToggle) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a1524); scene.fog = new THREE.Fog(0x0a1524, 80, 200);
  const camera = new THREE.PerspectiveCamera(30, 2, 0.1, 300);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.5, 1.5, 0.9); controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2.15; controls.minDistance = 12; controls.maxDistance = 110; controls.enablePan = false;

  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x101c2c, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-8, 20, 14); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 60 }); key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 0.7); rim.position.set(12, 8, -14); scene.add(rim);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(140, 64), new THREE.MeshStandardMaterial({ color: 0x0d1b2e, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const glow = glowTexture();
  const labels = [];
  let narrow = false;
  function addLabel(text, pos, cls = "", short = null) { const e = document.createElement("div"); e.className = "fw3-label " + cls; e.textContent = text; labelLayer.appendChild(e); const l = { e, pos: pos.clone(), full: text, short }; labels.push(l); return l; }

  function plinth(w, d, x, z, h, edgeColor, fill = C.plinth) {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w, d, 0.45), { depth: h, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3, curveSegments: 10 }), new THREE.MeshStandardMaterial({ color: fill, roughness: 0.55, metalness: 0.25 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); m.receiveShadow = true; m.castShadow = true; scene.add(m);
    const pts = roundedRect(w + 0.02, d + 0.02, 0.45).getPoints(40).map((p) => new THREE.Vector3(p.x, 0, -p.y));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.95 }));
    line.position.set(x, h + 0.1, z); scene.add(line); return m;
  }

  // Digital transformation boundary
  const dtPts = roundedRect(28.5, 17.2, 1.2).getPoints(60).map((p) => new THREE.Vector3(p.x, 0, -p.y));
  const boundary = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(dtPts), new THREE.LineDashedMaterial({ color: 0x8fa9c4, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.8 }));
  boundary.computeLineDistances(); boundary.position.set(0.5, 0.06, 0.7); scene.add(boundary);
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(28.5, 17.2, 1.2)), new THREE.MeshStandardMaterial({ color: 0x10233a, roughness: 0.9 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0.5, 0.015, 0.7); pad.receiveShadow = true; scene.add(pad);
  addLabel("DIGITAL TRANSFORMATION", new THREE.Vector3(0.5, 0.2, 9.9), "ctx");

  // Novel technologies
  plinth(4.6, 7.4, -10.3, -3.2, 0.3, 0x49a3de);
  addLabel("NOVEL TECHNOLOGIES", new THREE.Vector3(-10.3, 4.6, -5.4), "group", "TECHNOLOGIES");
  const hit = [];
  const techZ = { ai: -5.4, dt: -3.2, iot: -1.0 };
  const techs = {};
  for (const t of TECH) {
    const g = new THREE.Group(); g.position.set(-10.3, 0.32, techZ[t.id]); scene.add(g);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.35, 36), new THREE.MeshStandardMaterial({ color: 0x22384f, roughness: 0.5, metalness: 0.4 })); ped.position.y = 0.18; ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
    const mat = new THREE.MeshStandardMaterial({ color: C.off, roughness: 0.3, metalness: 0.5, emissive: 0x000000 });
    const spin = new THREE.Group(); spin.position.y = 1.55; g.add(spin);
    const extra = [];
    if (t.id === "ai") {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), mat); core.castShadow = true; spin.add(core);
      const shell = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.85, 1)), new THREE.LineBasicMaterial({ color: C.off, transparent: true, opacity: 0.7 })); spin.add(shell); extra.push(shell);
    } else if (t.id === "dt") {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), mat); a.position.set(-0.28, 0, 0.1); a.castShadow = true; spin.add(a);
      const b = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.72, 0.72, 0.72)), new THREE.LineBasicMaterial({ color: C.off })); b.position.set(0.34, 0.14, -0.14); spin.add(b); extra.push(b);
    } else {
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), mat); hub.castShadow = true; spin.add(hub);
      const pts = [];
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, r = 0.82, p = new THREE.Vector3(Math.cos(a) * r, Math.sin(k * 1.7) * 0.28, Math.sin(a) * r); const n = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), mat); n.position.copy(p); n.castShadow = true; spin.add(n); pts.push(new THREE.Vector3(), p); }
      const net = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: C.off, transparent: true, opacity: 0.8 })); spin.add(net); extra.push(net);
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: C[t.id], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(4.2, 4.2, 1); halo.position.y = 1.55; g.add(halo);
    const target = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), new THREE.MeshBasicMaterial({ visible: false })); target.position.y = 1.4; target.userData = { kind: "tech", id: t.id }; g.add(target); hit.push(target);
    const lab = addLabel(t.name, new THREE.Vector3(-12.9, 1.7, techZ[t.id]), "tech");
    techs[t.id] = { g, mat, spin, extra, halo, lab, on: 0 };
  }

  // Performance management core
  plinth(3.8, 3.8, -3.7, -3.2, 0.3, C.pm);
  const pmGroup = new THREE.Group(); pmGroup.position.set(-3.7, 0.32, -3.2); scene.add(pmGroup);
  const pmMat = new THREE.MeshStandardMaterial({ color: C.off, roughness: 0.35, metalness: 0.6, emissive: 0x000000 });
  const pmBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.4, 48), new THREE.MeshStandardMaterial({ color: 0x22384f, roughness: 0.5, metalness: 0.4 })); pmBase.position.y = 0.2; pmBase.castShadow = true; pmGroup.add(pmBase);
  const rings = [0.95, 0.68, 0.42].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 14, 60), pmMat); m.position.y = 1.7; m.castShadow = true; pmGroup.add(m); return m; });
  const pmCore = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), pmMat); pmCore.position.y = 1.7; pmGroup.add(pmCore);
  const pmHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: C.pm, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); pmHalo.scale.set(5, 5, 1); pmHalo.position.y = 1.7; pmGroup.add(pmHalo);
  const pmLabel = addLabel("PERFORMANCE MANAGEMENT", new THREE.Vector3(-3.7, 3.7, -3.2), "group", "PM");

  // Enhanced PM: eleven transformed practices
  plinth(13.4, 3.8, 6.0, -3.2, 0.3, C.practice);
  addLabel("ENHANCED PM: transformed PM practices", new THREE.Vector3(6.0, 5.3, -3.2), "group", "ENHANCED PM");
  const pillars = PRACTICES.map((p, i) => {
    const x = 0.5 + i * 1.1, z = -3.2;
    const baseM = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1, 0.66), new THREE.MeshStandardMaterial({ color: 0x5d6f84, roughness: 0.5, metalness: 0.3 })); baseM.castShadow = true; scene.add(baseM);
    const topM = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1, 0.66), new THREE.MeshStandardMaterial({ color: C.practice, roughness: 0.3, metalness: 0.35, emissive: C.practice, emissiveIntensity: 0.25 })); topM.castShadow = true; scene.add(topM);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.7, PH, 0.7)), new THREE.LineBasicMaterial({ color: 0x3a5270, transparent: true, opacity: 0.55 })); frame.position.set(x, 0.32 + PH / 2, z); scene.add(frame);
    const target = new THREE.Mesh(new THREE.BoxGeometry(0.9, PH, 0.9), new THREE.MeshBasicMaterial({ visible: false })); target.position.set(x, 0.32 + PH / 2, z); target.userData = { kind: "practice", id: p.id }; scene.add(target); hit.push(target);
    addLabel(String(i + 1), new THREE.Vector3(x, 0.45, z + 1.25), "num");
    return { p, x, z, baseM, topM, level: p.base };
  });

  // Sustainability performance
  plinth(24.5, 5.4, 0.5, 5.2, 0.3, 0x4fc77a);
  addLabel("SUSTAINABILITY PERFORMANCE", new THREE.Vector3(0.5, 0.5, 8.3), "group");
  const dimX = { business: [-8.9, -7.3, -5.7], environmental: [-1.1, 0.5, 2.1], social: [5.5, 7.1, 8.7, 10.3] };
  const dimMid = { business: -7.3, environmental: 0.5, social: 7.9 };
  for (const d of ["business", "environmental", "social"]) {
    const w = d === "social" ? 6.6 : 5.0;
    plinth(w, 3.6, dimMid[d], 5.0, 0.5, C[d], 0x1b3048);
    addLabel({ business: "Business sustainability", environmental: "Environmental sustainability", social: "Social sustainability" }[d], new THREE.Vector3(dimMid[d], 0.6, 7.2), "dim " + d, { business: "Business", environmental: "Environmental", social: "Social" }[d]);
  }
  const count = { business: 0, environmental: 0, social: 0 };
  const columns = OUTCOMES.map((o) => {
    const x = dimX[o.dim][count[o.dim]++], z = 5.0;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1, 32), new THREE.MeshStandardMaterial({ color: C[o.dim], roughness: 0.3, metalness: 0.4, emissive: C[o.dim], emissiveIntensity: 0.2 })); m.castShadow = true; scene.add(m);
    const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, OH, 32, 1, true), new THREE.MeshBasicMaterial({ color: C[o.dim], transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })); ghost.position.set(x, 0.52 + OH / 2, z); scene.add(ghost);
    const target = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, OH, 12), new THREE.MeshBasicMaterial({ visible: false })); target.position.set(x, 0.52 + OH / 2, z); target.userData = { kind: "outcome", id: o.id }; scene.add(target); hit.push(target);
    const val = addLabel("", new THREE.Vector3(x, 1, z), "val");
    return { o, x, z, m, val, level: 0 };
  });

  // Flows
  const flows = [];
  function flow(points, color, n, caption, capAt = 0.5, capDy = 0.5) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 })); scene.add(path);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.42, map: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
    if (caption) addLabel(caption, curve.getPointAt(capAt).add(new THREE.Vector3(0, capDy, 0)), "cap");
    const f = { curve, pts, n, path, s: 0, target: 0, phase: Array.from({ length: n }, (_, i) => i / n) }; flows.push(f); return f;
  }
  const F = {
    ai: flow([[-9.4, 1.9, -5.4], [-7.4, 2.4, -4.8], [-5.4, 2.1, -3.7], [-4.7, 2.0, -3.3]], C.ai, 16),
    dt: flow([[-9.4, 1.9, -3.2], [-7.4, 2.2, -3.2], [-4.9, 2.0, -3.2]], C.dt, 16, "integrate to existing", 0.55, -1.0),
    iot: flow([[-9.4, 1.9, -1.0], [-7.4, 2.4, -1.6], [-5.4, 2.1, -2.7], [-4.7, 2.0, -3.1]], C.iot, 16),
    pm: flow([[-2.6, 2.0, -3.2], [-1.2, 2.3, -3.2], [0.0, 1.6, -3.2]], C.pm, 20, "outcome", 0.5, 0.6),
    toBusiness: flow([[-10.3, 0.9, 0.7], [-10.6, 1.6, 2.6], [-9.6, 1.5, 4.2], [-8.6, 1.0, 4.8]], 0x8fd0ff, 14, "by promoting more environmentally friendly business practices", 0.4, 1.1),
    sBusiness: flow([[1.0, 1.4, -1.2], [-2.0, 2.4, 1.2], [-5.6, 1.8, 3.6], [-7.3, 1.0, 4.6]], C.business, 18),
    sEnvironmental: flow([[6.0, 1.4, -1.2], [4.0, 2.4, 1.0], [1.6, 1.8, 3.4], [0.5, 1.0, 4.6]], C.environmental, 18),
    sSocial: flow([[11.0, 1.4, -1.2], [11.4, 2.4, 1.2], [9.6, 1.8, 3.6], [7.9, 1.0, 4.6]], C.social, 18),
    mediation: flow([[-5.0, 1.6, 5.0], [-3.6, 2.6, 5.0], [-2.0, 1.6, 5.0]], 0xffffff, 10),
  };

  addLabel("technology-driven enhanced PM leads to sustainability outcomes", new THREE.Vector3(2.9, 0.2, 0.2), "cap wide");

  // Interaction
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null, current = null, info = () => "";
  function pick(e) { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(hit)[0]; return h ? h.object.userData : null; }
  renderer.domElement.addEventListener("pointermove", (e) => {
    current = pick(e); renderer.domElement.style.cursor = current && current.kind === "tech" ? "pointer" : "";
    if (current) { const r = container.getBoundingClientRect(); tooltip.innerHTML = info(current); tooltip.style.display = "block"; tooltip.style.left = Math.min(r.width - 250, Math.max(8, e.clientX - r.left + 14)) + "px"; tooltip.style.top = Math.max(8, e.clientY - r.top + 14) + "px"; } else tooltip.style.display = "none";
  });
  renderer.domElement.addEventListener("pointerleave", () => (tooltip.style.display = "none"));
  renderer.domElement.addEventListener("pointerdown", (e) => (downAt = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; const u = pick(e); if (u && u.kind === "tech") onToggle(u.id); });

  let W = 1, H = 1;
  function resize() {
    W = container.clientWidth; H = container.clientHeight; renderer.setSize(W, H, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = W / H; camera.updateProjectionMatrix();
    narrow = W < 560; for (const l of labels) if (l.short) l.e.textContent = narrow ? l.short : l.full;
    const k = Math.max(1, 1.85 / camera.aspect); const dir = new THREE.Vector3(0.0, 0.72, 0.9).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, 36.5 * k);
  }
  new ResizeObserver(resize).observe(container); resize();

  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting)).observe(container);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let target = null; const clock = new THREE.Clock(); const v = new THREE.Vector3(); const tmpColor = new THREE.Color();
  let pmLevel = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !target) return;
    const dt = Math.min(clock.getDelta(), 0.05), a = 1 - Math.exp(-dt * 4), time = performance.now() / 1000;
    for (const t of TECH) {
      const o = techs[t.id], goal = target.state[t.id] ? 1 : 0; o.on += (goal - o.on) * a;
      tmpColor.setHex(C.off).lerp(new THREE.Color(C[t.id]), o.on); o.mat.color.copy(tmpColor); o.mat.emissive.setHex(C[t.id]).multiplyScalar(0.55 * o.on);
      for (const x of o.extra) x.material.color.copy(tmpColor);
      o.halo.material.opacity = 0.55 * o.on * (0.85 + 0.15 * Math.sin(time * 2 + o.g.position.z));
      if (!reduce) o.spin.rotation.y += dt * (0.25 + 0.9 * o.on);
      o.lab.e.classList.toggle("on", goal === 1);
    }
    const gain = Math.max(0, (target.result.pm - 0.164) / 0.7); pmLevel += (gain - pmLevel) * a;
    tmpColor.setHex(C.off).lerp(new THREE.Color(C.pm), Math.min(1, pmLevel * 1.3)); pmMat.color.copy(tmpColor); pmMat.emissive.setHex(C.pm).multiplyScalar(0.45 * Math.min(1, pmLevel));
    pmHalo.material.opacity = 0.5 * Math.min(1, pmLevel);
    if (!reduce) rings.forEach((r, i) => { r.rotation.x += dt * (0.2 + 1.2 * pmLevel) * (i % 2 ? -1 : 1); r.rotation.y += dt * (0.15 + 0.8 * pmLevel); });
    pmLabel.full = pmLevel > 0.05 ? "PERFORMANCE MANAGEMENT, enhanced" : "PERFORMANCE MANAGEMENT, existing"; const pmText = narrow ? "PM" : pmLabel.full; if (pmLabel.e.textContent !== pmText) pmLabel.e.textContent = pmText;

    for (const p of pillars) {
      p.level += (target.result.practices[p.p.id] - p.level) * a;
      const hb = Math.max(0.02, p.p.base * PH), ht = Math.max(0.001, (p.level - p.p.base) * PH);
      p.baseM.scale.y = hb; p.baseM.position.set(p.x, 0.32 + hb / 2, p.z);
      p.topM.scale.y = ht; p.topM.position.set(p.x, 0.32 + hb + ht / 2, p.z); p.topM.visible = ht > 0.01;
      p.topM.material.emissiveIntensity = 0.2 + 0.5 * p.level;
    }
    for (const c of columns) {
      c.level += (target.result.outcomes[c.o.id] - c.level) * a;
      const h = Math.max(0.03, c.level * OH); c.m.scale.y = h; c.m.position.set(c.x, 0.52 + h / 2, c.z);
      c.m.material.emissiveIntensity = 0.15 + 0.6 * c.level;
      c.val.pos.set(c.x, 0.52 + h + 0.45, c.z); c.val.e.textContent = Math.round(c.level * 100);
    }
    const r = target.result, d = r.dims, on = target.state;
    F.ai.target = on.ai ? 1 : 0; F.dt.target = on.dt ? 1 : 0; F.iot.target = on.iot ? 1 : 0;
    F.pm.target = Math.min(1, gain * 1.4); F.toBusiness.target = on.ai || on.iot || on.dt ? Math.min(1, d.business) : 0;
    F.sBusiness.target = gain > 0.01 ? d.business : 0; F.sEnvironmental.target = gain > 0.01 ? Math.min(1, d.environmental * 1.4) : 0; F.sSocial.target = gain > 0.01 ? d.social : 0;
    F.mediation.target = gain > 0.01 ? d.business : 0;
    for (const f of flows) {
      f.s += (f.target - f.s) * a; const shown = Math.round(f.n * Math.min(1, f.s)); const arr = f.pts.geometry.attributes.position.array;
      for (let i = 0; i < f.n; i++) { if (!reduce) f.phase[i] = (f.phase[i] + dt * (0.16 + 0.22 * f.s)) % 1; f.curve.getPointAt(f.phase[i], v); arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; }
      f.pts.geometry.attributes.position.needsUpdate = true; f.pts.geometry.setDrawRange(0, shown); f.path.material.opacity = 0.14 + 0.5 * Math.min(1, f.s);
    }
    controls.update(); renderer.render(scene, camera);
    for (const l of labels) { v.copy(l.pos).project(camera); const ok = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05; l.e.style.display = ok ? "" : "none"; if (ok) l.e.style.transform = `translate(-50%,-50%) translate(${((v.x + 1) / 2) * W}px,${((1 - v.y) / 2) * H}px)`; }
  }
  frame();
  return { update(state, result) { target = { state, result }; }, setInfo(fn) { info = fn; } };
}
