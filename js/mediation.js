// Mediation simulator for the survey study (Publication II).
// Synthetic observed scores are generated from chosen path values; the estimates and the
// bootstrap interval of the indirect effect are computed in the browser.
import { mulberry32 } from "./model.js";
import { scatter } from "./charts.js";

const $ = (id) => document.getElementById(id);
const PUB = { n: 179, a: 0.146, b: 1.074, c: -0.055 };
// Means and the SD of X follow the published construct statistics. The residual SDs are set so that, at n = 179,
// the standard errors of the paths are close to the published ones (a: 0.068, c': 0.078).
const M = { x: 3.32, sx: 1.088, m: 3.59, y: 3.52, resM: 0.99, resY: 1.135 };
const NS = "http://www.w3.org/2000/svg";

function normal(rand) { let u = 0; while (u === 0) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); }

export function generate(n, a, b, c, seed) {
  const rand = mulberry32(seed); const X = [], Mv = [], Y = [];
  const sdM = M.resM, sdY = M.resY;
  for (let i = 0; i < n; i++) {
    const x = M.x + M.sx * normal(rand);
    const m = M.m + a * (x - M.x) + sdM * normal(rand);
    const y = M.y + c * (x - M.x) + b * (m - M.m) + sdY * normal(rand);
    X.push(x); Mv.push(m); Y.push(y);
  }
  return { X, M: Mv, Y };
}

export function estimate(X, Mv, Y, idx) {
  const n = idx ? idx.length : X.length; let sx = 0, sm = 0, sy = 0;
  for (let k = 0; k < n; k++) { const i = idx ? idx[k] : k; sx += X[i]; sm += Mv[i]; sy += Y[i]; }
  const mx = sx / n, mm = sm / n, my = sy / n; let Sxx = 0, Smm = 0, Sxm = 0, Sxy = 0, Smy = 0;
  for (let k = 0; k < n; k++) { const i = idx ? idx[k] : k; const dx = X[i] - mx, dm = Mv[i] - mm, dy = Y[i] - my; Sxx += dx * dx; Smm += dm * dm; Sxm += dx * dm; Sxy += dx * dy; Smy += dm * dy; }
  const a = Sxm / Sxx, den = Sxx * Smm - Sxm * Sxm;
  const b = (Sxx * Smy - Sxm * Sxy) / den, c = (Smm * Sxy - Sxm * Smy) / den;
  return { a, b, c, ind: a * b, total: Sxy / Sxx, ia: mm - a * mx, mx, mm, my };
}

export function bootstrap(d, reps, seed) {
  const rand = mulberry32(seed), n = d.X.length, ind = [], dir = [], idx = new Int32Array(n);
  for (let r = 0; r < reps; r++) { for (let i = 0; i < n; i++) idx[i] = Math.floor(rand() * n); const e = estimate(d.X, d.M, d.Y, idx); ind.push(e.ind); dir.push(e.c); }
  const q = (arr, p) => { const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
  return { ind: [q(ind, 0.025), q(ind, 0.975)], dir: [q(dir, 0.025), q(dir, 0.975)] };
}

function diagram(a, b, c) {
  const e = (t, at, txt) => { const x = document.createElementNS(NS, t); for (const k in at) x.setAttribute(k, at[k]); if (txt !== undefined) x.textContent = txt; return x; };
  const svg = e("svg", { viewBox: "0 0 560 250", role: "img", "aria-label": "Path diagram of the mediation model" });
  const defs = e("defs"); const mk = e("marker", { id: "arm", viewBox: "0 0 10 10", refX: 9, refY: 5, markerUnits: "userSpaceOnUse", markerWidth: 13, markerHeight: 13, orient: "auto" }); mk.appendChild(e("path", { d: "M0,0 L10,5 L0,10 z", fill: "context-stroke" })); defs.appendChild(mk); svg.appendChild(defs);
  const box = (x, y, w, t1, t2, fill, stroke) => { svg.appendChild(e("rect", { x, y, width: w, height: 58, rx: 10, fill, stroke, "stroke-width": 2 })); svg.appendChild(e("text", { x: x + w / 2, y: y + 24, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#14304F" }, t1)); svg.appendChild(e("text", { x: x + w / 2, y: y + 43, "text-anchor": "middle", "font-size": 11, fill: "#5A6878" }, t2)); };
  box(6, 170, 178, "Smart technologies", "AI, IoT, digital twins", "#E6EDF5", "#14304F");
  box(191, 14, 178, "Business sustainability", "the mediator", "#FBEFD5", "#C97F06");
  box(376, 170, 178, "Environmental sustainability", "the outcome", "#DFF1E6", "#2E8B57");
  const w = (v) => 1.5 + Math.min(5, Math.abs(v) * 5);
  const col = (v) => (Math.abs(v) < 0.03 ? "#A9B6C3" : v > 0 ? "#1F8A8F" : "#B5483A");
  svg.appendChild(e("line", { x1: 110, y1: 168, x2: 232, y2: 76, stroke: col(a), "stroke-width": w(a), "marker-end": "url(#arm)" }));
  svg.appendChild(e("line", { x1: 328, y1: 76, x2: 450, y2: 166, stroke: col(b), "stroke-width": w(b), "marker-end": "url(#arm)" }));
  svg.appendChild(e("line", { x1: 186, y1: 199, x2: 372, y2: 199, stroke: col(c), "stroke-width": w(c), "stroke-dasharray": "7 5", "marker-end": "url(#arm)" }));
  const lab = (x, y, t) => svg.appendChild(e("text", { x, y, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#16202B" }, t));
  lab(138, 112, "a = " + a.toFixed(3)); lab(424, 112, "b = " + b.toFixed(3)); lab(280, 190, "c' = " + c.toFixed(3));
  svg.appendChild(e("text", { x: 280, y: 232, "text-anchor": "middle", "font-size": 12, fill: "#5A6878" }, "indirect effect a × b = " + (a * b).toFixed(3)));
  $("pathDiagram").replaceChildren(svg);
}

export function initMediation() {
  let seed = 179;
  const f = (v) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(3);
  function run() {
    const n = Number($("mN").value), a = Number($("mA").value), b = Number($("mB").value), c = Number($("mC").value);
    $("nOut").textContent = n; $("aOut").textContent = a.toFixed(3); $("bOut").textContent = b.toFixed(3); $("cOut").textContent = c.toFixed(3);
    diagram(a, b, c);
    const d = generate(n, a, b, c, seed), est = estimate(d.X, d.M, d.Y), ci = bootstrap(d, 1000, seed + 7);
    const indSig = ci.ind[0] > 0 || ci.ind[1] < 0, dirSig = ci.dir[0] > 0 || ci.dir[1] < 0;
    let verdict, warn = false;
    if (indSig && !dirSig) verdict = "<b>Indirect-only mediation.</b> In this sample the effect of technology on environmental results runs through business sustainability, and the direct path cannot be told apart from zero. This is the pattern the published study reports.";
    else if (indSig && dirSig) verdict = "<b>Partial mediation.</b> Both the indirect and the direct path differ from zero in this sample.";
    else if (!indSig && dirSig) { verdict = "<b>Direct effect only.</b> The indirect path cannot be told apart from zero in this sample."; warn = true; }
    else { verdict = "<b>No effect detected.</b> Neither path can be told apart from zero. With a weak first path, a small sample often fails to find a mediation that exists: draw several samples or raise n to see the power problem."; warn = true; }
    $("medResult").innerHTML = `<h3>Estimates from this synthetic sample (n = ${n})</h3><table><tr><th>Path</th><th>Set</th><th>Estimated</th><th>95 % bootstrap interval</th></tr>
      <tr><td>a: technology → business</td><td>${f(a)}</td><td>${f(est.a)}</td><td></td></tr>
      <tr><td>b: business → environmental</td><td>${f(b)}</td><td>${f(est.b)}</td><td></td></tr>
      <tr><td>c': direct effect</td><td>${f(c)}</td><td>${f(est.c)}</td><td>${f(ci.dir[0])} to ${f(ci.dir[1])}</td></tr>
      <tr><td><b>a × b: indirect effect</b></td><td>${f(a * b)}</td><td><b>${f(est.ind)}</b></td><td><b>${f(ci.ind[0])} to ${f(ci.ind[1])}</b></td></tr>
      <tr><td>Total effect</td><td>${f(c + a * b)}</td><td>${f(est.total)}</td><td></td></tr></table>
      <p class="verdict ${warn ? "warn" : ""}">${verdict}</p>`;
    scatter($("scA"), d.X, d.M, { color: "#C97F06", line: { i: est.ia, s: est.a }, xLabel: "technology use (synthetic)" });
    const sl = (() => { let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (d.M[i] - est.mm) * (d.Y[i] - est.my); sxx += (d.M[i] - est.mm) ** 2; } const s = sxy / sxx; return { s, i: est.my - s * est.mm }; })();
    scatter($("scB"), d.M, d.Y, { color: "#2E8B57", line: sl, xLabel: "business sustainability (synthetic)" });
  }
  ["mN", "mA", "mB", "mC"].forEach((id) => $(id).addEventListener("input", run));
  $("btnSample").addEventListener("click", () => { seed += 1; run(); });
  $("btnPublished").addEventListener("click", () => { $("mN").value = PUB.n; $("mA").value = PUB.a; $("mB").value = PUB.b; $("mC").value = PUB.c; seed = 179; run(); });
  $("pubTable").innerHTML = `<thead><tr><th>Published result (n = 179 Finnish SMEs)</th><th>Estimate</th><th>p</th><th>Hypothesis</th></tr></thead><tbody>
    <tr><td>H1: smart technologies → environmental sustainability (direct)</td><td>−0.055</td><td>.482</td><td>Not supported</td></tr>
    <tr><td>H2: smart technologies → business sustainability</td><td>0.146</td><td>.032</td><td>Supported</td></tr>
    <tr><td>H3: business sustainability → environmental sustainability</td><td>1.074</td><td>&lt; .001</td><td>Supported</td></tr>
    <tr><td>Indirect effect through business sustainability</td><td>0.157 <small>(SE 0.074)</small></td><td>.034</td><td>Mediation supported</td></tr>
    <tr><td colspan="4"><small>Measurement model fit: RMSEA = 0.052, CFI = 0.986, TLI = 0.977, SRMR = 0.037. The questionnaire was pre-tested with five industry experts and three researchers and sent to the chief executives of 7,850 randomly selected SMEs.</small></td></tr></tbody>`;
  run(); window.addEventListener("resize", run);
}
