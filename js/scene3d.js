// 3D view of the simulated line: physical layer on the floor, sensor links and the twin layer above it.
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

const COL = { run: 0x3ccb7f, maint: 0xf2b134, down: 0xe5533d, steel: 0x6f8296, dark: 0x2a3b4f, belt: 0x1c2a3a, twin: 0x49d6de, ai: 0xf2b134 };

function label(text, color = "#E6EEF5", size = 44) {
  const c = document.createElement("canvas"); const ctx = c.getContext("2d");
  ctx.font = `600 ${size}px Segoe UI, sans-serif`;
  c.width = Math.ceil(ctx.measureText(text).width) + 24; c.height = size + 24;
  ctx.font = `600 ${size}px Segoe UI, sans-serif`; ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.fillText(text, 12, c.height / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set((c.width / c.height) * 0.62, 0.62, 1);
  return sp;
}

export function createScene(container, stations, onSelect) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e1e30); scene.fog = new THREE.Fog(0x0e1e30, 34, 62);
  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 100); camera.position.set(6, 8.8, 20.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4.0, 0); controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 8; controls.maxDistance = 40;

  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2738, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(6, 12, 8); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshStandardMaterial({ color: 0x15273b, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const grid = new THREE.GridHelper(40, 40, 0x27405a, 0x1c3148); grid.position.y = 0.01; scene.add(grid);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.3, 1.1), new THREE.MeshStandardMaterial({ color: COL.belt, roughness: 0.8 }));
  belt.position.set(0, 0.75, 0); scene.add(belt);
  for (const x of [-8.4, -4, 0, 4, 8.4]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 1), new THREE.MeshStandardMaterial({ color: COL.dark })); leg.position.set(x, 0.35, 0); scene.add(leg); }

  const steel = () => new THREE.MeshStandardMaterial({ color: COL.steel, metalness: 0.55, roughness: 0.45 });
  const xs = [-6, -2, 2, 6];
  const nodes = stations.map((st, i) => {
    const g = new THREE.Group(); g.position.set(xs[i], 0, 0); g.userData.index = i;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 2.5), steel()); body.position.y = 1.9; g.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 2.8), new THREE.MeshStandardMaterial({ color: COL.dark })); base.position.y = 0.1; g.add(base);
    const postGeo = new THREE.BoxGeometry(0.22, 0.95, 0.22);
    for (const [px, pz] of [[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]]) { const p = new THREE.Mesh(postGeo, new THREE.MeshStandardMaterial({ color: COL.dark })); p.position.set(px, 0.55, pz); g.add(p); }
    let mover;
    if (i === 0) { mover = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: 0x9fb3c8, metalness: 0.6, roughness: 0.3 })); mover.position.y = 3.2; }
    else if (i === 1) { mover = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 20), new THREE.MeshStandardMaterial({ color: 0x9fb3c8, metalness: 0.6, roughness: 0.3 })); mover.rotation.z = Math.PI / 2; mover.position.y = 3.25; }
    else if (i === 2) { mover = new THREE.Group(); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1.5), new THREE.MeshStandardMaterial({ color: 0xf2b134 })); arm.position.z = 0.75; const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xf2b134 })); col.position.y = -0.3; mover.add(arm, col); mover.position.y = 3.5; }
    else { mover = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 10, 36), new THREE.MeshStandardMaterial({ color: 0x49d6de, emissive: 0x114a55 })); mover.position.y = 3.6; mover.rotation.x = Math.PI / 2; }
    g.add(mover);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: COL.run, emissive: COL.run, emissiveIntensity: 1.2 })); lamp.position.set(0.9, 3.05, 1.0); g.add(lamp);
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.16), new THREE.MeshBasicMaterial({ color: 0x24405c })); barBg.position.set(0, 2.2, 1.27); g.add(barBg);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.16), new THREE.MeshBasicMaterial({ color: COL.run })); bar.position.set(0, 2.2, 1.28); g.add(bar);
    const name = label(st.name); name.position.set(0, 4.5, 0); g.add(name);
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshBasicMaterial({ color: COL.twin })); sensor.position.set(-0.9, 3.0, 1.0); sensor.visible = false; g.add(sensor);
    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.9, 3.0, 1.0), new THREE.Vector3(-0.9, 7.2, 0)]), new THREE.LineDashedMaterial({ color: COL.twin, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.8 }));
    link.computeLineDistances(); link.visible = false; g.add(link);
    const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 1.9, 2.5)), new THREE.LineBasicMaterial({ color: COL.twin, transparent: true, opacity: 0.85 })); ghost.position.y = 8.2; ghost.visible = false; g.add(ghost);
    scene.add(g);
    return { g, body, mover, lamp, bar, sensor, link, ghost, baseY: mover.position.y };
  });

  const twinLabel = label("Digital twin layer: model fed by live data", "#7FE3E9", 40); twinLabel.position.set(0, 10.1, 0); twinLabel.visible = false; scene.add(twinLabel);
  const twinPlane = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 4.2), new THREE.MeshBasicMaterial({ color: COL.twin, transparent: true, opacity: 0.07, side: THREE.DoubleSide })); twinPlane.rotation.x = -Math.PI / 2; twinPlane.position.y = 7.2; twinPlane.visible = false; scene.add(twinPlane);
  const aiNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshStandardMaterial({ color: COL.ai, emissive: 0x7a4d00, flatShading: true })); aiNode.position.set(0, 5.9, -2.4); aiNode.visible = false; scene.add(aiNode);
  const aiLabel = label("AI: predicts failure from condition data", "#F7CE7A", 36); aiLabel.position.set(0, 6.8, -2.4); aiLabel.visible = false; scene.add(aiLabel);

  const prodGeo = new THREE.BoxGeometry(0.42, 0.3, 0.42);
  const products = Array.from({ length: 12 }, (_, k) => { const p = new THREE.Mesh(prodGeo, new THREE.MeshStandardMaterial({ color: 0xd9e3ec })); p.position.set(-8.6 + k * 1.45, 1.05, 0); scene.add(p); return p; });

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (downAt = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(nodes.map((n) => n.body))[0];
    if (hit) onSelect(nodes.findIndex((n) => n.body === hit.object));
  });

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container); resize();

  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting)).observe(container);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let state = { stations: stations.map(() => ({ state: "run", health: 1 })), running: false, playing: false, cfg: {}, selected: 0 };
  const clock = new THREE.Clock(); let phase = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const moving = state.playing && state.running && !reduce;
    if (moving) phase += dt;
    nodes.forEach((n, i) => {
      const s = state.stations[i]; const c = COL[s.state] || COL.run;
      n.lamp.material.color.setHex(c); n.lamp.material.emissive.setHex(c);
      n.lamp.material.emissiveIntensity = s.state === "down" ? 0.6 + 0.9 * Math.abs(Math.sin(performance.now() / 180)) : 1.2;
      n.bar.scale.x = Math.max(0.02, s.health); n.bar.position.x = -(1 - n.bar.scale.x);
      n.bar.material.color.setHex(s.health > 0.55 ? COL.run : s.health > 0.3 ? COL.maint : COL.down);
      n.body.material.emissive.setHex(i === state.selected ? 0x12343a : 0x000000);
      if (moving && s.state === "run") {
        if (i === 0) n.mover.position.y = n.baseY - 0.25 * Math.abs(Math.sin(phase * 4));
        else if (i === 1) n.mover.rotation.x += dt * 3;
        else if (i === 2) n.mover.rotation.y = Math.sin(phase * 2.2) * 0.9;
        else n.mover.rotation.z += dt * 2.5;
      }
      const iot = !!state.cfg.iot, twin = iot && !!state.cfg.twin;
      n.sensor.visible = iot; n.link.visible = iot; n.ghost.visible = twin;
      if (iot) n.sensor.scale.setScalar(1 + 0.35 * Math.sin(performance.now() / 260 + i));
      if (twin) n.ghost.material.color.setHex(s.state === "run" ? COL.twin : COL[s.state]);
    });
    const iot = !!state.cfg.iot, twin = iot && !!state.cfg.twin, ai = iot && !!state.cfg.ai;
    twinLabel.visible = twin; twinPlane.visible = twin; aiNode.visible = ai; aiLabel.visible = ai;
    if (ai && !reduce) aiNode.rotation.y += dt * 1.2;
    if (moving) for (const p of products) { p.position.x += dt * 1.6 * (state.cfg.speed || 1); if (p.position.x > 8.7) p.position.x = -8.7; }
    controls.update(); renderer.render(scene, camera);
  }
  frame();
  return { update(s) { state = { ...state, ...s }; } };
}
