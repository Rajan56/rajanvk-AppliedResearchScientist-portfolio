// Section 1: the conceptual framework as a testable 3D model. Wires the controls to the model and the scene.
import { TECH, PRACTICES, OUTCOMES, DIMS, COMBOS, compute, narrative } from "./framework_model.js";
import { createFrameworkScene } from "./framework3d.js";

const $ = (id) => document.getElementById(id);
const pct = (x) => Math.round(x * 100);
const LINK = ["", "supporting", "primary"];

export function initFramework3D() {
  const state = { ai: 0, iot: 0, dt: 0, readiness: 0.8 };
  const base = compute({ ai: 0, iot: 0, dt: 0, readiness: 0.8 });
  let scene = null;
  try {
    scene = createFrameworkScene($("fw3Scene"), $("fw3Labels"), $("fw3Tip"), (id) => { state[id] = state[id] ? 0 : 1; render(); });
  } catch (e) {
    console.error("framework 3D", e);
    $("fw3Scene").innerHTML = '<p class="fw3-fallback">The 3D view needs WebGL. The controls, values and tables beside and below it still work.</p>';
  }

  // static lists
  $("fwPractices").innerHTML = PRACTICES.map((p, i) => `<li data-id="${p.id}"><span class="n">${i + 1}</span><div><div class="row"><b>${p.name}</b><output></output></div>
    <div class="track"><i class="was" style="width:${pct(p.base)}%"></i><i class="now"></i></div>
    <div class="chips">${TECH.map((t, k) => (p.w[k] ? `<span class="chip ${t.id}${p.w[k] === 2 ? " main" : ""}" title="${t.long}: ${LINK[p.w[k]]} enabler">${t.name}</span>` : "")).join("")}</div></div></li>`).join("");
  $("fwOutcomes").innerHTML = DIMS.map((d) => `<div class="dimblock ${d.id}"><h4>${d.name}<output data-dim="${d.id}"></output></h4>${OUTCOMES.filter((o) => o.dim === d.id).map((o) => `<div class="orow" data-id="${o.id}"><span>${o.name}</span><div class="track"><i class="now"></i></div><output></output></div>`).join("")}</div>`).join("");
  $("fwIndex").innerHTML = [["pm", "Enhanced PM"], ["business", "Business sustainability"], ["environmental", "Environmental sustainability"], ["social", "Social sustainability"]]
    .map(([k, n]) => `<div class="irow ${k}" data-k="${k}"><span>${n}</span><div class="track"><i class="was"></i><i class="now"></i></div><output></output></div>`).join("");

  function comboTable() {
    $("fwCombos").innerHTML = COMBOS.map((c) => {
      const r = compute({ ...c, readiness: state.readiness });
      const sel = c.ai === state.ai && c.iot === state.iot && c.dt === state.dt;
      return `<tr class="${sel ? "sel" : ""}" data-c="${c.ai}${c.iot}${c.dt}" tabindex="0"><td>${c.label}</td><td>${pct(r.pm)}</td><td>${pct(r.dims.business)}</td><td>${pct(r.dims.environmental)}</td><td>${pct(r.dims.social)}</td></tr>`;
    }).join("");
  }

  function render() {
    const r = compute(state);
    for (const t of TECH) $("fw_" + t.id).checked = !!state[t.id];
    $("fwReadyOut").textContent = pct(state.readiness) + " %";
    $("fwStory").textContent = narrative(state);
    const names = TECH.filter((t) => state[t.id]).map((t) => t.name);
    $("fwStateTitle").textContent = names.length ? names.join(" + ") + " integrated into performance management" : "Existing performance management";
    const vals = { pm: r.pm, ...r.dims }, was = { pm: base.pm, ...base.dims };
    document.querySelectorAll("#fwIndex .irow").forEach((el) => {
      const k = el.dataset.k; el.querySelector(".now").style.width = pct(vals[k]) + "%"; el.querySelector(".was").style.width = pct(was[k]) + "%";
      const d = pct(vals[k]) - pct(was[k]); el.querySelector("output").innerHTML = `${pct(vals[k])}<small>${d > 0 ? " +" + d : ""}</small>`;
    });
    document.querySelectorAll("#fwPractices li").forEach((el) => {
      const v = r.practices[el.dataset.id]; el.querySelector(".now").style.width = pct(v) + "%"; el.querySelector("output").textContent = pct(v);
      const p = PRACTICES.find((x) => x.id === el.dataset.id); el.classList.toggle("lit", v - p.base > 0.02);
      el.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", TECH.some((t) => state[t.id] && c.classList.contains(t.id))));
    });
    document.querySelectorAll("#fwOutcomes .orow").forEach((el) => { const v = r.outcomes[el.dataset.id]; el.querySelector(".now").style.width = pct(v) + "%"; el.querySelector("output").textContent = pct(v); });
    document.querySelectorAll("#fwOutcomes h4 output").forEach((el) => (el.textContent = pct(r.dims[el.dataset.dim])));
    comboTable();
    if (scene) scene.update({ ...state }, r);
    current = r;
  }
  let current = base;

  if (scene) scene.setInfo((u) => {
    if (u.kind === "tech") { const t = TECH.find((x) => x.id === u.id); return `<b>${t.long}</b><span class="st ${state[u.id] ? "on" : ""}">${state[u.id] ? "integrated" : "not in use"}</span><p>${t.role}</p><em>Click to ${state[u.id] ? "remove" : "integrate"}</em>`; }
    if (u.kind === "practice") {
      const p = PRACTICES.find((x) => x.id === u.id), i = PRACTICES.indexOf(p);
      const en = TECH.map((t, k) => (p.w[k] ? `${t.name} (${LINK[p.w[k]]})` : "")).filter(Boolean).join(", ");
      return `<b>${i + 1}. ${p.name}</b><p>Existing PM: ${pct(p.base)}<br>Now: ${pct(current.practices[p.id])}</p><p>Enabled by ${en}</p>`;
    }
    const o = OUTCOMES.find((x) => x.id === u.id);
    const from = o.from.map((id) => PRACTICES.findIndex((p) => p.id === id) + 1).join(", ");
    return `<b>${o.name}</b><p>${DIMS.find((d) => d.id === o.dim).name}: ${pct(current.outcomes[o.id])}</p><p>Fed by practices ${from}${o.dim === "environmental" ? ". Realised through business sustainability" : ""}</p>`;
  });

  for (const t of TECH) $("fw_" + t.id).addEventListener("change", (e) => { state[t.id] = e.target.checked ? 1 : 0; render(); });
  $("fwReady").addEventListener("input", (e) => { state.readiness = +e.target.value / 100; render(); });
  $("fwAll").addEventListener("click", () => { state.ai = state.iot = state.dt = 1; render(); });
  $("fwReset").addEventListener("click", () => { state.ai = state.iot = state.dt = 0; render(); });
  const pickCombo = (e) => { const tr = e.target.closest("tr[data-c]"); if (!tr) return; const c = tr.dataset.c; state.ai = +c[0]; state.iot = +c[1]; state.dt = +c[2]; render(); };
  $("fwCombos").addEventListener("click", pickCombo);
  $("fwCombos").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickCombo(e); } });
  render();
}
