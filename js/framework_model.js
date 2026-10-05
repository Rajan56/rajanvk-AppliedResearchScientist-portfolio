// Conceptual framework of the dissertation (Figure 3) as a small, explicit model.
// Structure (blocks, the eleven transformed PM practices, the outcome lists and the arrows) follows the figure.
// The weights are illustrative codings made for this demonstrator. They were not estimated from data.
// python/framework_model.py holds the same numbers and returns the same results.

export const TECH = [
  { id: "ai", name: "AI", long: "Artificial intelligence", role: "Embedded intelligence layer: predictive insight, automated decision support, personalised feedback." },
  { id: "iot", name: "IoT", long: "Internet of Things", role: "Data-collection infrastructure: real-time, continuous and granular data from processes, equipment and the work environment." },
  { id: "dt", name: "DT", long: "Digital twins", role: "Dynamic virtual representation: what-if simulation, early detection of bottlenecks, testing of plans before implementation." },
];

// w: [AI, IoT, DT] with 0 = no link, 1 = supporting, 2 = primary enabler. base: level in existing PM before integration.
export const PRACTICES = [
  { id: "kpi", name: "KPI definition and alignment", w: [1, 0, 2], base: 0.3 },
  { id: "capture", name: "Automated, real-time data capture", w: [0, 2, 1], base: 0.1 },
  { id: "monitor", name: "Continuous monitoring and alerting", w: [1, 2, 2], base: 0.1 },
  { id: "decide", name: "Enhanced data-driven decision-making", w: [2, 1, 2], base: 0.25 },
  { id: "predict", name: "Predictive analytics and what-if simulation", w: [2, 1, 2], base: 0.05 },
  { id: "optimise", name: "Operational efficiency and optimisation", w: [1, 1, 2], base: 0.25 },
  { id: "allocate", name: "Dynamic resource allocation and scheduling", w: [2, 1, 1], base: 0.15 },
  { id: "feedback", name: "Context-aware feedback and automated coaching", w: [2, 1, 0], base: 0.1 },
  { id: "hmc", name: "Human-machine collaboration", w: [1, 0, 2], base: 0.05 },
  { id: "learn", name: "Continuous learning and skill development", w: [1, 0, 2], base: 0.15 },
  { id: "review", name: "Ongoing performance review and TBL refinement", w: [1, 1, 1], base: 0.3 },
];

// from: practices that feed the outcome. Environmental outcomes are multiplied by the business index (mediation).
export const OUTCOMES = [
  { id: "eff", dim: "business", name: "Efficiency", from: ["optimise", "allocate", "monitor", "capture"] },
  { id: "comp", dim: "business", name: "Competitiveness", from: ["decide", "predict", "kpi"] },
  { id: "focus", dim: "business", name: "Strategic focus", from: ["kpi", "review", "decide"] },
  { id: "waste", dim: "environmental", name: "Reduce waste", from: ["optimise", "allocate", "predict"] },
  { id: "emis", dim: "environmental", name: "Emission reduction", from: ["monitor", "predict", "allocate"] },
  { id: "report", dim: "environmental", name: "Environmental reporting and compliance", from: ["capture", "review", "monitor"] },
  { id: "safety", dim: "social", name: "Working conditions and safety", from: ["monitor", "hmc"] },
  { id: "well", dim: "social", name: "Employee wellbeing", from: ["feedback", "hmc"] },
  { id: "incl", dim: "social", name: "Digital inclusion", from: ["hmc", "learn"] },
  { id: "opp", dim: "social", name: "Learning opportunities", from: ["learn", "feedback"] },
];

export const DIMS = [
  { id: "business", name: "Business sustainability" },
  { id: "environmental", name: "Environmental sustainability" },
  { id: "social", name: "Social sustainability" },
];

const K = 0.8; // largest contribution of one primary technology to one practice

// state: { ai, iot, dt } as 0 or 1, readiness between 0 and 1
export function compute(state) {
  const ai = state.ai ? 1 : 0, iot = state.iot ? 1 : 0, dt = state.dt ? 1 : 0, R = state.readiness;
  // Synergy: the IoT data stream feeds AI analytics and keeps the twin current; AI adds analysis to the twin.
  const eff = [ai * (0.6 + 0.4 * iot), iot, dt * (0.5 + 0.3 * iot + 0.2 * ai)];
  const practices = {};
  for (const p of PRACTICES) {
    let miss = 1;
    for (let t = 0; t < 3; t++) miss *= 1 - K * (p.w[t] / 2) * eff[t];
    practices[p.id] = p.base + (1 - p.base) * R * (1 - miss);
  }
  const mean = (ids) => ids.reduce((s, id) => s + practices[id], 0) / ids.length;
  const raw = {};
  for (const o of OUTCOMES) raw[o.id] = mean(o.from);
  const dimMean = (dim, src) => { const os = OUTCOMES.filter((o) => o.dim === dim); return os.reduce((s, o) => s + src[o.id], 0) / os.length; };
  const business = dimMean("business", raw);
  const outcomes = {};
  for (const o of OUTCOMES) outcomes[o.id] = o.dim === "environmental" ? raw[o.id] * business : raw[o.id];
  const pm = PRACTICES.reduce((s, p) => s + practices[p.id], 0) / PRACTICES.length;
  return {
    eff, practices, outcomes, pm,
    dims: { business, environmental: dimMean("environmental", outcomes), social: dimMean("social", outcomes) },
  };
}

export const COMBOS = [
  { ai: 0, iot: 0, dt: 0, label: "Existing PM, no novel technology" },
  { ai: 1, iot: 0, dt: 0, label: "AI" },
  { ai: 0, iot: 1, dt: 0, label: "IoT" },
  { ai: 0, iot: 0, dt: 1, label: "DT" },
  { ai: 1, iot: 1, dt: 0, label: "AI + IoT" },
  { ai: 1, iot: 0, dt: 1, label: "AI + DT" },
  { ai: 0, iot: 1, dt: 1, label: "IoT + DT" },
  { ai: 1, iot: 1, dt: 1, label: "AI + IoT + DT" },
];

export function narrative(s) {
  const key = (s.ai ? "a" : "") + (s.iot ? "i" : "") + (s.dt ? "d" : "");
  const text = {
    "": "Existing performance management. Indicators are defined and reviewed periodically, on data that are delayed, aggregated or collected by hand. Review is retrospective.",
    a: "AI adds predictive insight, automated decision support and personalised feedback. It works on the data the firm already has, so without a live data stream its reach stays limited.",
    i: "IoT turns processes and equipment into continuous data sources. Performance management gains real-time visibility and alerting, while analysis and foresight are still done by people.",
    d: "A digital twin lets managers test plans in a virtual model before implementation and makes performance data easier to interpret. Without live sensor data the twin is updated by hand.",
    ai: "The IoT data stream fuels AI analytics. Deviations are detected and predicted from live data, resources are rescheduled and feedback is automated. Review moves from retrospective to anticipatory.",
    ad: "AI analyses and optimises scenarios inside the twin, which supports predictive and prescriptive planning. The model is not fed by live data, so it lags the real operation.",
    id: "Sensors keep the twin current. Managers get real-time diagnostics and can test scenarios on the present state of the operation, with interpretation still left to people.",
    aid: "Sensing, intelligence and simulation work as one system. Performance management becomes predictive and prescriptive, with continuous goal adjustment and shared visibility, and sustainability indicators are handled inside the same loop.",
  }[key];
  let ready = "";
  if (s.readiness < 0.4 && key) ready = " Readiness is low: the technology is present but not embedded in decision routines, so most of its potential stays unused.";
  else if (s.readiness < 0.7 && key) ready = " Readiness is moderate: part of the potential is realised.";
  return text + ready;
}
