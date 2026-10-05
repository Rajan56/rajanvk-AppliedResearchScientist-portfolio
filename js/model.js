// Production line model used by the live demonstrator.
// The same equations are implemented in python/factory_model.py and give the same numbers.
// All parameters are illustrative assumptions, not measurements from any company.

export const STATIONS = [
  { id: "forming", name: "Forming press", powerKw: 90, wear: 0.000045 },
  { id: "moulding", name: "Injection moulding", powerKw: 120, wear: 0.000060 },
  { id: "assembly", name: "Assembly cell", powerKw: 35, wear: 0.000030 },
  { id: "test", name: "End-of-line test", powerKw: 20, wear: 0.000020 },
];

export const P = {
  idealRate: 1.0,          // units per minute at speed setpoint 1.0
  baseHazard: 0.00006,     // failures per minute for a healthy station
  hazardGain: 14,          // extra hazard as health falls
  repairMin: 90,           // minutes of repair after a failure
  detectNoIot: 45,         // minutes before a failure is located without sensors
  detectIot: 5,            // minutes with condition monitoring
  periodicEveryMin: 14 * 1440, // time-based maintenance interval
  periodicDurMin: 30,
  aiThreshold: 0.55,       // health level at which the AI model calls for maintenance
  aiDurMin: 25,
  baseDefect: 0.02,
  healthDefect: 0.10,
  speedDefect: 0.5,
  twinDefectCut: 0.4,      // share of health and speed related defects avoided by virtual tuning
  idleShareNoTwin: 0.6,    // power drawn while the line is stopped, as a share of running power
  idleShareTwin: 0.15,     // with twin-controlled standby
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createLine(cfg, seed = 2026) {
  return {
    cfg: { iot: false, ai: false, twin: false, speed: 1.0, ...cfg },
    rand: mulberry32(seed),
    t: 0,
    stations: STATIONS.map((s) => ({ ...s, health: 1, state: "run", timer: 0, failures: 0, planned: 0, sincePeriodic: 0 })),
    tot: { planned: 0, run: 0, units: 0, good: 0, kwh: 0, failures: 0, plannedStops: 0 },
  };
}

// Advance the line by one simulated minute.
export function step(L) {
  const c = L.cfg;
  const ai = c.ai && c.iot;      // prediction needs sensor data
  const twin = c.twin && c.iot;  // a twin needs a live data link
  const s = c.speed;
  let allUp = true;

  for (const st of L.stations) {
    if (st.state !== "run") {
      st.timer -= 1;
      if (st.timer <= 0) { st.state = "run"; st.health = 1; st.sincePeriodic = 0; }
    }
    if (st.state !== "run") allUp = false;
  }

  for (const st of L.stations) {
    const u = L.rand(); // one draw per station per minute keeps the two implementations in step
    if (st.state !== "run") continue;
    if (allUp) {
      st.health = Math.max(0, st.health - st.wear * s * s);
      const hazard = P.baseHazard * (1 + P.hazardGain * Math.pow(1 - st.health, 3)) * Math.pow(s, 1.5);
      if (u < hazard) {
        st.state = "down"; st.timer = P.repairMin + (c.iot ? P.detectIot : P.detectNoIot);
        st.failures += 1; L.tot.failures += 1; continue;
      }
    }
    st.sincePeriodic += 1;
    if (ai) {
      if (st.health < P.aiThreshold) { st.state = "maint"; st.timer = P.aiDurMin; st.planned += 1; L.tot.plannedStops += 1; }
    } else if (st.sincePeriodic >= P.periodicEveryMin) {
      st.state = "maint"; st.timer = P.periodicDurMin; st.planned += 1; L.tot.plannedStops += 1;
    }
  }

  const running = L.stations.every((st) => st.state === "run");
  let hmin = 1;
  for (const st of L.stations) if (st.health < hmin) hmin = st.health;

  let units = 0, good = 0;
  if (running) {
    units = P.idealRate * s * (1 - 0.25 * (1 - hmin));
    let defect = P.healthDefect * Math.pow(1 - hmin, 2) + P.speedDefect * Math.max(0, s - 1);
    if (twin) defect *= 1 - P.twinDefectCut;
    defect += P.baseDefect;
    good = units * (1 - defect);
  }
  let kw = 0;
  for (const st of L.stations) {
    if (running) kw += st.powerKw * (0.5 + 0.5 * s * s) * (1 + 0.2 * (1 - st.health));
    else kw += st.powerKw * (twin ? P.idleShareTwin : P.idleShareNoTwin);
  }

  L.t += 1;
  L.tot.planned += 1;
  if (running) L.tot.run += 1;
  L.tot.units += units; L.tot.good += good; L.tot.kwh += kw / 60;
  return { running, units, good, kw, hmin };
}

// KPI definitions: the formulas shown on the page are the ones computed here.
export function kpis(tot, emissionFactor = 100) {
  const availability = tot.planned ? tot.run / tot.planned : 0;
  const performance = tot.run ? tot.units / (tot.run * P.idealRate) : 0;
  const quality = tot.units ? tot.good / tot.units : 0;
  const sec = tot.good ? tot.kwh / tot.good : 0;
  return {
    availability, performance, quality,
    oee: availability * performance * quality,
    goodUnits: tot.good,
    sec,                                  // kWh per good unit
    co2: sec * emissionFactor,            // g CO2e per good unit
    failures: tot.failures, plannedStops: tot.plannedStops,
  };
}

export const SCENARIOS = [
  { key: "periodic", label: "Periodic review (no sensing)", cfg: { iot: false, ai: false, twin: false } },
  { key: "iot", label: "IoT condition monitoring", cfg: { iot: true, ai: false, twin: false } },
  { key: "iot_ai", label: "IoT + AI prediction", cfg: { iot: true, ai: true, twin: false } },
  { key: "twin", label: "IoT + AI + digital twin", cfg: { iot: true, ai: true, twin: true } },
];

export function runScenario(cfg, days = 90, seed = 2026, speed = 1.0) {
  const L = createLine({ ...cfg, speed }, seed);
  for (let i = 0; i < days * 1440; i++) step(L);
  return kpis(L.tot);
}
