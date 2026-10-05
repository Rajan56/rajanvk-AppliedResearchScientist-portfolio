// KPI lab: runs the line model, compares it with the same line under periodic review, and draws the indicators.
import { STATIONS, P, SCENARIOS, createLine, step, kpis, runScenario } from "./model.js";
import { createScene } from "./scene3d.js";
import { lineChart } from "./charts.js";

const $ = (id) => document.getElementById(id);
const pct = (v) => (v * 100).toFixed(1) + " %";

const KPI_SPECS = [
  { tag: "Digital", cls: "", name: "Overall equipment effectiveness (OEE)", formula: "Availability × Performance × Quality", unit: "%", source: "Machine states and counters from sensors or MES", freq: "Per shift, trend per week", owner: "Production manager", decision: "Where to act first: stops, speed losses or defects" },
  { tag: "Digital", cls: "", name: "Availability", formula: "Run time ÷ planned production time", unit: "%", source: "Station state log (run, maintenance, breakdown)", freq: "Live, reviewed daily", owner: "Maintenance lead", decision: "Maintenance policy and spare part stock" },
  { tag: "Digital", cls: "", name: "First-time-right (quality rate)", formula: "Good units ÷ total units produced", unit: "%", source: "End-of-line test results", freq: "Per batch", owner: "Quality engineer", decision: "Process settings; release of a virtual tuning change" },
  { tag: "Green", cls: "green", name: "Specific energy consumption", formula: "Electricity used (kWh) ÷ good units", unit: "kWh per unit", source: "Sub-meters per station, joined with good-unit count", freq: "Daily", owner: "Energy and production managers", decision: "Standby rules, speed setpoint, investment cases" },
  { tag: "Green", cls: "green", name: "Carbon intensity of production", formula: "Specific energy × grid emission factor", unit: "g CO2e per unit", source: "Energy KPI plus the supplier or national emission factor", freq: "Monthly, for reporting", owner: "Sustainability manager", decision: "Environmental reporting; customer carbon footprint requests" },
  { tag: "Twin transition", cls: "green", name: "Capability indicator: decisions taken on live data", formula: "Operational decisions supported by live indicators ÷ all logged decisions", unit: "%", source: "Decision log of the daily management meeting", freq: "Monthly", owner: "Plant manager", decision: "Shows whether the technology has changed management practice" },
];

export function initLab() {
  let cfg = { iot: false, ai: false, twin: false, speed: 1.0 };
  let ef = 100, playing = false, selected = 1;
  let live, base, dayLive, dayBase, series;

  const scene = createScene($("scene"), STATIONS, (i) => { selected = i; render(); });

  function reset() {
    live = createLine(cfg, 2026); base = createLine({ iot: false, ai: false, twin: false, speed: 1.0 }, 2026);
    dayLive = { ...live.tot }; dayBase = { ...base.tot };
    series = { oeeL: [], oeeB: [], secL: [], secB: [] };
    render();
  }
  const diff = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] - b[k]]));

  function advance(minutes) {
    for (let i = 0; i < minutes; i++) {
      live.cfg = { ...live.cfg, ...cfg }; step(live); step(base);
      if (live.t % 1440 === 0) {
        const kl = kpis(diff(live.tot, dayLive)), kb = kpis(diff(base.tot, dayBase));
        series.oeeL.push(kl.oee); series.oeeB.push(kb.oee); series.secL.push(kl.sec); series.secB.push(kb.sec);
        for (const k of Object.keys(series)) if (series[k].length > 120) series[k].shift();
        dayLive = { ...live.tot }; dayBase = { ...base.tot };
      }
    }
  }

  function tile(lab, val, delta, better) {
    let cls = "flat", txt = "same as periodic review";
    if (delta !== null && Math.abs(delta.v) > delta.eps) { cls = (delta.v > 0) === better ? "good" : "bad"; txt = (delta.v > 0 ? "+" : "") + delta.txt + " vs periodic review"; }
    if (delta === null) txt = "&nbsp;";
    return `<div class="tile"><div class="lab">${lab}</div><div class="val">${val}</div><div class="delta ${cls}">${txt}</div></div>`;
  }

  function render() {
    const k = kpis(live.tot, ef), b = kpis(base.tot, ef);
    const has = live.t > 0;
    const pp = (x, y) => ({ v: x - y, eps: 0.0005, txt: ((x - y) * 100).toFixed(1) + " pts" });
    $("tiles").innerHTML = [
      tile("OEE", has ? pct(k.oee) : "–", has ? pp(k.oee, b.oee) : null, true),
      tile("Availability", has ? pct(k.availability) : "–", has ? pp(k.availability, b.availability) : null, true),
      tile("Performance", has ? pct(k.performance) : "–", has ? pp(k.performance, b.performance) : null, true),
      tile("First-time-right", has ? pct(k.quality) : "–", has ? pp(k.quality, b.quality) : null, true),
      tile("Energy per good unit", has ? k.sec.toFixed(2) + " kWh" : "–", has ? { v: k.sec - b.sec, eps: 0.005, txt: (k.sec - b.sec).toFixed(2) + " kWh" } : null, false),
      tile("Carbon per good unit", has ? k.co2.toFixed(0) + " g" : "–", has ? { v: k.co2 - b.co2, eps: 0.5, txt: (k.co2 - b.co2).toFixed(0) + " g CO2e" } : null, false),
      tile("Breakdowns", has ? k.failures : "–", has ? { v: k.failures - b.failures, eps: 0.5, txt: String(k.failures - b.failures) } : null, false),
      tile("Good units", has ? Math.round(k.goodUnits).toLocaleString("en") : "–", has ? { v: k.goodUnits - b.goodUnits, eps: 0.5, txt: Math.round(k.goodUnits - b.goodUnits).toLocaleString("en") } : null, true),
    ].join("");

    const d = Math.floor(live.t / 1440), hh = Math.floor((live.t % 1440) / 60), mm = live.t % 60;
    $("clock").textContent = `Day ${d}, ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} simulated`;
    const x0 = Math.max(1, d - series.oeeL.length + 1);
    lineChart($("chOee"), [{ name: "your configuration", color: "#1F8A8F", data: series.oeeL }, { name: "periodic review", color: "#8A97A6", dash: [5, 4], data: series.oeeB }], { fmtY: (v) => (v * 100).toFixed(0) + " %", x0 });
    lineChart($("chSec"), [{ name: "your configuration", color: "#2E8B57", data: series.secL }, { name: "periodic review", color: "#8A97A6", dash: [5, 4], data: series.secB }], { fmtY: (v) => v.toFixed(2), x0 });

    const st = live.stations[selected];
    const stateTxt = { run: "running", maint: "planned maintenance", down: "breakdown" }[st.state];
    $("stationCard").innerHTML = `<b>${st.name}</b><br>Condition ${(st.health * 100).toFixed(0)} %<div class="bar"><i style="width:${st.health * 100}%"></i></div>State: ${stateTxt}<br>Breakdowns ${st.failures} · planned stops ${st.planned}<br>` +
      (cfg.iot ? `Rated power ${st.powerKw} kW` : `<span style="opacity:.75">No sensor data: condition is unknown to the plant</span>`);
    scene.update({ stations: live.stations.map((s) => ({ state: s.state, health: s.health })), running: live.stations.every((s) => s.state === "run"), playing, cfg, selected });
  }

  function readControls() {
    cfg = { iot: $("swIot").checked, ai: $("swAi").checked, twin: $("swTwin").checked, speed: Number($("speed").value) };
    $("swAi").disabled = !cfg.iot; $("swTwin").disabled = !cfg.iot;
    if (!cfg.iot) { $("swAi").checked = false; $("swTwin").checked = false; cfg.ai = cfg.twin = false; }
    $("depNote").textContent = cfg.iot ? "" : "Prediction and the twin need live data: switch on IoT sensing first.";
    $("speedOut").textContent = cfg.speed.toFixed(2);
    ef = Number($("ef").value); $("efOut").textContent = ef + " g CO2e/kWh";
    render();
  }
  ["swIot", "swAi", "swTwin", "speed", "ef"].forEach((id) => $(id).addEventListener("input", readControls));
  $("btnRun").addEventListener("click", () => { playing = !playing; $("btnRun").textContent = playing ? "Pause" : "Run"; render(); });
  $("btnReset").addEventListener("click", () => { playing = false; $("btnRun").textContent = "Run"; reset(); });

  let last = performance.now(), carry = 0, visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { rootMargin: "600px" }).observe($("lab"));
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!playing || !visible) return;
    carry += dt * Number($("simSpeed").value) * 60;
    const n = Math.floor(carry); carry -= n;
    if (n > 0) { advance(n); render(); }
  }

  // KPI specification cards
  $("kpiCards").innerHTML = KPI_SPECS.map((k) => `<article class="kpi-card ${k.cls}"><span class="tag ${k.cls}">${k.tag}</span><h4>${k.name}</h4><code>${k.formula}</code><dl><dt>Unit</dt><dd>${k.unit}</dd><dt>Data source</dt><dd>${k.source}</dd><dt>Frequency</dt><dd>${k.freq}</dd><dt>Owner</dt><dd>${k.owner}</dd><dt>Decision</dt><dd>${k.decision}</dd></dl></article>`).join("");

  // Assumption table
  const A = [["Ideal rate", P.idealRate + " unit per minute at setpoint 1.00"], ["Repair time after a breakdown", P.repairMin + " minutes"], ["Time to locate a fault", `${P.detectNoIot} minutes without sensors, ${P.detectIot} minutes with IoT`], ["Calendar maintenance (periodic review)", `every ${P.periodicEveryMin / 1440} days, ${P.periodicDurMin} minutes per station`], ["Condition-based maintenance (AI)", `when condition falls below ${P.aiThreshold * 100} %, ${P.aiDurMin} minutes`], ["Defect rate", `${P.baseDefect * 100} % base, rising as condition falls and above setpoint 1.00`], ["Twin effect on defects", `${P.twinDefectCut * 100} % of condition and speed related defects avoided`], ["Power while the line is stopped", `${P.idleShareNoTwin * 100} % of running power; ${P.idleShareTwin * 100} % with twin-controlled standby`], ["Station wear", STATIONS.map((s) => `${s.name}: ${(s.wear * 1440 * 100).toFixed(1)} % per day`).join("; ")], ["Station power", STATIONS.map((s) => `${s.name}: ${s.powerKw} kW`).join("; ")]];
  $("assumptions").innerHTML = "<table>" + A.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join("") + "</table>";

  // Scenario table: Python results if available, otherwise computed here
  const head = "<thead><tr><th>Scenario</th><th>OEE</th><th>Availability</th><th>Performance</th><th>First-time-right</th><th>kWh per good unit</th><th>Breakdowns in 90 days</th><th>Planned stops</th></tr></thead>";
  const cell = (m, sd, f) => `${f(m)}${sd !== undefined ? ` <small>± ${f(sd).replace(" %", "")}</small>` : ""}`;
  const draw = (rows, note) => {
    const b0 = rows[0];
    $("scenTable").innerHTML = head + "<tbody>" + rows.map((r) => `<tr><td><b>${r.label}</b></td><td>${cell(r.oee, r.oee_sd, pct)}</td><td>${cell(r.availability, r.availability_sd, pct)}</td><td>${cell(r.performance, r.performance_sd, pct)}</td><td>${cell(r.quality, r.quality_sd, pct)}</td><td>${cell(r.sec, r.sec_sd, (v) => v.toFixed(2))}${r === b0 ? "" : ` <small>(${(((r.sec - b0.sec) / b0.sec) * 100).toFixed(1)} %)</small>`}</td><td>${r.failures.toFixed(1)}</td><td>${r.plannedStops.toFixed(1)}</td></tr>`).join("") + `</tbody><caption style="caption-side:bottom;text-align:left;font-size:.8rem;color:#5A6878;padding-top:6px">${note}</caption>`;
  };
  fetch("data/scenarios.json").then((r) => (r.ok ? r.json() : Promise.reject())).then((rows) => draw(rows, "Source: data/scenarios.json, written by python/factory_model.py. Mean ± standard deviation over 10 replications."))
    .catch(() => draw(SCENARIOS.map((s) => ({ label: s.label, ...runScenario(s.cfg) })), "Computed in the browser with seed 2026 (single run)."));

  reset(); readControls(); requestAnimationFrame(loop);
  window.addEventListener("resize", render);
}
