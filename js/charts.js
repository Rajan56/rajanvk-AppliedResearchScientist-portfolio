// Small canvas chart helpers: no external chart library.
const INK = "#16202B", MUTED = "#5A6878", GRID = "#E3E9EF";

function setup(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 400, h = Number(canvas.getAttribute("height")) || 220;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = "12px Segoe UI, system-ui, sans-serif";
  return { ctx, w, h };
}

function niceRange(min, max) {
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (min === max) { min -= 0.5; max += 0.5; }
  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}

function axes(ctx, w, h, m, xr, yr, fmtY, xLabel) {
  ctx.strokeStyle = GRID; ctx.fillStyle = MUTED; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = yr[0] + ((yr[1] - yr[0]) * i) / 4;
    const y = h - m.b - ((h - m.b - m.t) * i) / 4;
    ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(w - m.r, y); ctx.stroke();
    ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(fmtY(v), m.l - 6, y);
  }
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let i = 0; i <= 4; i++) {
    const v = xr[0] + ((xr[1] - xr[0]) * i) / 4;
    ctx.fillText(Number.isInteger(v) ? v : v.toFixed(1), m.l + ((w - m.l - m.r) * i) / 4, h - m.b + 5);
  }
  if (xLabel) ctx.fillText(xLabel, m.l + (w - m.l - m.r) / 2, h - 14);
}

// series: [{name, color, dash, data:[y...]}], x is the index (day number)
export function lineChart(canvas, series, { fmtY = (v) => v.toFixed(2), xLabel = "simulated day", x0 = 1 } = {}) {
  const { ctx, w, h } = setup(canvas);
  const m = { l: 46, r: 12, t: 22, b: 36 };
  const all = series.flatMap((s) => s.data);
  const n = Math.max(1, ...series.map((s) => s.data.length));
  const yr = niceRange(Math.min(...all), Math.max(...all));
  const xr = [x0, x0 + Math.max(4, n - 1)];
  axes(ctx, w, h, m, xr, yr, fmtY, xLabel);
  const X = (i) => m.l + ((w - m.l - m.r) * i) / (xr[1] - xr[0]);
  const Y = (v) => h - m.b - ((h - m.b - m.t) * (v - yr[0])) / (yr[1] - yr[0]);
  let lx = m.l;
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash || []);
    ctx.beginPath();
    s.data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.stroke(); ctx.setLineDash([]);
    // direct legend at the top
    ctx.fillStyle = s.color; ctx.fillRect(lx, 6, 14, 3);
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(s.name, lx + 18, 8);
    lx += 26 + ctx.measureText(s.name).width + 10;
  }
  if (!all.length) { ctx.fillStyle = MUTED; ctx.textAlign = "center"; ctx.fillText("Press Run to start the line", w / 2, h / 2); }
}

export function scatter(canvas, xs, ys, { color = "#1F8A8F", line = null, xLabel = "", fmt = (v) => v.toFixed(1) } = {}) {
  const { ctx, w, h } = setup(canvas);
  const m = { l: 40, r: 12, t: 10, b: 36 };
  const xr = niceRange(Math.min(...xs), Math.max(...xs)), yr = niceRange(Math.min(...ys), Math.max(...ys));
  axes(ctx, w, h, m, xr, yr, fmt, xLabel);
  const X = (v) => m.l + ((w - m.l - m.r) * (v - xr[0])) / (xr[1] - xr[0]);
  const Y = (v) => h - m.b - ((h - m.b - m.t) * (v - yr[0])) / (yr[1] - yr[0]);
  ctx.fillStyle = color; ctx.globalAlpha = 0.45;
  for (let i = 0; i < xs.length; i++) { ctx.beginPath(); ctx.arc(X(xs[i]), Y(ys[i]), 2.6, 0, 6.3); ctx.fill(); }
  ctx.globalAlpha = 1;
  if (line) {
    ctx.strokeStyle = "#14304F"; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(X(xr[0]), Y(line.i + line.s * xr[0])); ctx.lineTo(X(xr[1]), Y(line.i + line.s * xr[1])); ctx.stroke();
  }
}
