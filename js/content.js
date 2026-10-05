// Framework diagram, case study explorer, barrier map and static lists.
const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
function wrapText(parent, text, x, y, maxChars, attrs = {}, lh = 16) {
  const words = text.split(" "); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
  lines.push(cur.trim());
  const t = el("text", { x, y: y - ((lines.length - 1) * lh) / 2, "text-anchor": "middle", "dominant-baseline": "middle", ...attrs });
  lines.forEach((l, i) => t.appendChild(el("tspan", { x, dy: i ? lh : 0 }, l)));
  parent.appendChild(t); return t;
}
const clickable = (g, fn) => { g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.addEventListener("click", fn); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } }); };

/* ---------------- Framework ---------------- */
const FW = {
  context: { title: "Digital transformation context", tags: ["Dissertation"], body: "Firms reconfigure processes, structures and business models in response to digital opportunities. The framework places technology, management practice and outcomes inside this change, because the same sensor has a different effect in a firm that has changed how it decides than in one that has not." },
  tech: { title: "Novel technologies: AI, IoT, digital twins", tags: ["Publication I", "Publication III", "Publication IV"], body: "Defined in the dissertation as technologies that bring new capabilities to performance management, not small improvements. IoT supplies condition and process data, AI finds patterns and predicts, and the digital twin joins both in a model that can be questioned before acting in the real plant." },
  pm: { title: "Enhanced performance management", tags: ["Publication I", "Publication III"], body: "Linear, backward-looking review is replaced by four capabilities: real-time sensing, predictive analytics, continuous goal adjustment and collaborative visibility. This is the step where technology turns into changed management practice. It is the integrating construct of the framework." },
  business: { title: "Business sustainability", tags: ["Publication II"], body: "Efficiency, competitiveness and the capability to run the business sustainably. In the survey of 179 Finnish SMEs, smart technologies had a positive, significant effect on business sustainability (coefficient 0.146, p = .032)." },
  environmental: { title: "Environmental sustainability", tags: ["Publication II", "Publication IV"], body: "Emission reduction and resource optimisation. The survey found no significant direct effect of smart technologies (coefficient -0.055, p = .482). The effect ran through business sustainability (indirect effect 0.157, p = .034). The case studies show the mechanisms: energy monitoring, waste reduction and carbon reporting." },
  social: { title: "Social sustainability", tags: ["Publication IV"], body: "Well-being, safety and inclusion. In the case studies this appeared as monitoring of working conditions and as operator training in simulated environments, which lets people practise with heavy machines without risk." },
  barriers: { title: "Barriers that weaken the chain", tags: ["Publication IV"], body: "Data integration and standardisation, technical barriers, cost and complexity of scaling, and the skills gap. They were found in every case and weigh most on small and medium-sized firms." },
  human: { title: "Human-centric approach", tags: ["Publication IV"], body: "All three case companies involved workers or clients in setting up and refining the twin. Technology that supports the user's own goals is adopted; technology that complicates the workflow is not." },
};

export function initFramework() {
  const svg = el("svg", { viewBox: "0 0 760 440", role: "group" });
  const defs = el("defs"); const mk = el("marker", { id: "arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }); mk.appendChild(el("path", { d: "M0,0 L10,5 L0,10 z", fill: "#14304F" })); defs.appendChild(mk); svg.appendChild(defs);
  const node = (id, x, y, w, h, fill, stroke, title, sub, tcol = "#14304F") => {
    const g = el("g", { class: "fw-node", "data-id": id, "aria-label": FW[id].title });
    g.appendChild(el("rect", { x, y, width: w, height: h, rx: 10, fill, stroke, "stroke-width": 2 }));
    wrapText(g, title, x + w / 2, sub ? y + 24 : y + h / 2, Math.floor(w / 8), { "font-size": 14, "font-weight": 700, fill: tcol });
    if (sub) sub.forEach((s, i) => { g.appendChild(el("rect", { x: x + 12, y: y + 50 + i * 34, width: w - 24, height: 26, rx: 6, fill: "#fff", stroke, "stroke-width": 1 })); g.appendChild(el("text", { x: x + w / 2, y: y + 64 + i * 34, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 12, fill: "#16202B" }, s)); });
    clickable(g, () => select(id)); svg.appendChild(g); return g;
  };
  const ctx = el("g", { class: "fw-node", "data-id": "context" });
  ctx.appendChild(el("rect", { x: 8, y: 8, width: 744, height: 306, rx: 14, fill: "#F5F7FA", stroke: "#8A97A6", "stroke-width": 2, "stroke-dasharray": "7 5" }));
  ctx.appendChild(el("text", { x: 24, y: 30, "font-size": 12, "font-weight": 700, fill: "#5A6878", "letter-spacing": 1 }, "DIGITAL TRANSFORMATION CONTEXT"));
  clickable(ctx, () => select("context")); svg.appendChild(ctx);

  node("tech", 26, 62, 190, 196, "#E6EDF5", "#14304F", "Novel technologies", ["Artificial intelligence", "Internet of Things", "Digital twins"]);
  node("pm", 272, 46, 216, 232, "#E3F2F2", "#1F8A8F", "Enhanced performance management", ["Real-time sensing", "Predictive analytics", "Continuous goal adjustment", "Collaborative visibility"]);
  svg.appendChild(el("text", { x: 639, y: 56, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#14304F" }, "Sustainability performance"));
  node("business", 544, 68, 190, 56, "#FBEFD5", "#C97F06", "Business");
  node("environmental", 544, 136, 190, 56, "#DFF1E6", "#2E8B57", "Environmental");
  node("social", 544, 204, 190, 56, "#F3E3E0", "#B5483A", "Social");
  svg.appendChild(el("line", { x1: 218, y1: 160, x2: 268, y2: 160, stroke: "#14304F", "stroke-width": 3, "marker-end": "url(#arr)" }));
  svg.appendChild(el("line", { x1: 490, y1: 160, x2: 540, y2: 160, stroke: "#14304F", "stroke-width": 3, "marker-end": "url(#arr)" }));
  svg.appendChild(el("text", { x: 243, y: 148, "text-anchor": "middle", "font-size": 11, fill: "#5A6878" }, "enable"));
  svg.appendChild(el("text", { x: 515, y: 148, "text-anchor": "middle", "font-size": 11, fill: "#5A6878" }, "deliver"));
  node("barriers", 26, 336, 440, 88, "#fff", "#B5483A", "Barriers: data standards, integration, cost, skills");
  node("human", 486, 336, 248, 88, "#fff", "#1F8A8F", "Human-centric approach");
  svg.appendChild(el("line", { x1: 246, y1: 334, x2: 246, y2: 180, stroke: "#B5483A", "stroke-width": 2, "stroke-dasharray": "5 4", "marker-end": "url(#arr)" }));
  svg.appendChild(el("line", { x1: 610, y1: 334, x2: 514, y2: 180, stroke: "#1F8A8F", "stroke-width": 2, "stroke-dasharray": "5 4", "marker-end": "url(#arr)" }));
  $("fwDiagram").appendChild(svg);

  function select(id) {
    svg.querySelectorAll(".fw-node").forEach((n) => n.classList.toggle("sel", n.dataset.id === id));
    const d = FW[id];
    $("fwDetail").innerHTML = `<h3>${d.title}</h3><p>${d.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</p><p>${d.body}</p>`;
  }
  select("pm");
}

/* ---------------- Cases ---------------- */
const CASES = [
  { k: "A", title: "Company A", role: "Digital twin solution provider, SME", stage: "Mature implementation", sector: "Manufacturing and process industries", focus: "Real-time monitoring, production optimisation, resource management", src: "4 interviews (software architect, CTO, director, business development manager); 2 documents" },
  { k: "B", title: "Company B", role: "Potential digital twin user, large firm", stage: "Early exploration", sector: "Manufacturing and product design", focus: "Pilot on production layout and defect recognition; energy and emission tracking expected later", src: "3 interviews (R&D director, founder and chief engineer, simulation expert); 5 documents" },
  { k: "C", title: "Company C", role: "Digital twin solution provider, SME", stage: "Mature implementation", sector: "Heavy equipment and autonomous systems", focus: "Real-time simulation for product development, operator training and resource savings", src: "6 documents (brochures, e-book, white paper); no interviews" },
];
const THEMES = [
  { theme: "Contributions to sustainable performance", rows: [
    { n: "Resource optimisation and waste reduction", v: [2, 1, 2], d: "Company A's customers follow energy use and resource allocation in real time and simulate production scenarios to remove energy-intensive steps before they are built. Company C simulates machine behaviour and tests hybrid powertrains virtually, which saves physical prototypes. Company B expects to monitor energy in forming and moulding." },
    { n: "Performance monitoring and improvement", v: [2, 1, 2], d: "Sensors track machine use, downtime causes and equipment effectiveness at Company A's customers. Company C uses sensor data to manage system performance. Company B is piloting layout optimisation and defect recognition." },
    { n: "Environmental reporting and compliance", v: [2, 1, 2], d: "Real-time tracking of CO2 emissions lets Company A's customers adjust operations and meet regulation. Company C's solutions help clients track and report carbon footprints. Company B expects twins to support emission tracking." },
    { n: "Working conditions and safety", v: [0, 0, 2], d: "Company C offers simulation-based operator training, so people learn to handle heavy machines in a safe virtual setting. The theme also covers monitoring of workplace conditions. It is the least developed of the four contributions." },
  ] },
  { theme: "Integration challenges (filled circle: challenge reported)", rows: [
    { n: "Data integration and standardisation", v: [2, 2, 2], d: "Present in every case. Systems use different formats and different calculation methods, which makes synchronisation hard and blocks scaling. This is the first practical recommendation of the study: standardise data and secure interoperability before anything else." },
    { n: "Technical barriers", v: [2, 2, 2], d: "Sensors from different makers do not always communicate (Company A). Linking the twin to ERP and MES systems is difficult (Company C). Company B found integration with its current systems harder than expected." },
    { n: "Cost and complexity", v: [2, 2, 2], d: "Many SMEs cannot justify the first investment, and scaling a twin to small clients or small projects is costly when advanced IoT infrastructure is needed. Both providers reported this." },
    { n: "Skills and expertise gap", v: [0, 2, 0], d: "Company B lacks specialised expertise and needs far more cooperation between design and engineering teams than it expected. Twins cut across departments that are used to working apart." },
  ] },
  { theme: "Technology synergies and human-centric design", rows: [
    { n: "Cross-technology collaboration", v: [2, 1, 0], d: "Company A's platform joins ERP and IoT data and is moving to the cloud for access and scale. Company B is considering cloud migration to share data across teams." },
    { n: "AI and IoT synergy", v: [2, 1, 2], d: "AI on twin data predicts machine failures at Companies A and C, and IoT sensors supply the real-time data. Company B has started to look at this and is not there yet." },
    { n: "Predictive analytics and big data", v: [2, 1, 2], d: "Sensor data are analysed for prediction and for performance management. Maintenance is scheduled before costly breakdowns." },
    { n: "Human-centric design and collaboration", v: [2, 2, 2], d: "All three companies involve workers or clients in setting up and refining the twin, so that it supports operational goals without complicating work. The study treats this as a condition of success, in line with Industry 5.0." },
  ] },
];
const SYM = ["<span class='m-none' role='img' aria-label='not reported'>–</span>", "<span class='m-dot m-half' role='img' aria-label='planned or explored'></span>", "<span class='m-dot m-full' role='img' aria-label='in use or reported'></span>"];

export function initCases() {
  $("caseCards").innerHTML = CASES.map((c) => `<article class="case"><span class="tag ${c.stage.startsWith("Early") ? "amber" : ""}">${c.stage}</span><h4>${c.title}</h4><b>${c.role}</b><p>${c.sector}. ${c.focus}.</p><p class="src">Data: ${c.src}</p></article>`).join("");
  let html = "<thead><tr><th>Theme and subtheme</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>"; let idx = 0; const flat = [];
  for (const t of THEMES) { html += `<tr class="theme"><td colspan="4">${t.theme}</td></tr>`; for (const r of t.rows) { html += `<tr class="row" data-i="${idx}" tabindex="0"><td>${r.n}</td>${r.v.map((v) => `<td>${SYM[v]}</td>`).join("")}</tr>`; flat.push(r); idx++; } }
  $("matrix").innerHTML = html + "</tbody>";
  const show = (i) => { $("matrix").querySelectorAll("tr.row").forEach((tr) => tr.classList.toggle("sel", Number(tr.dataset.i) === i)); $("matrixDetail").innerHTML = `<h3>${flat[i].n}</h3><p>${flat[i].d}</p><p class="src" style="color:#5A6878;font-size:.82rem">Findings are paraphrased from the published chapter. Case attributions follow the case narratives and the cross-case analysis.</p>`; };
  $("matrix").querySelectorAll("tr.row").forEach((tr) => { const f = () => show(Number(tr.dataset.i)); tr.addEventListener("click", f); tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }); });
  show(4);
  initB2B();
}

const BARR = [{ id: "data", n: "Data integration and standardisation" }, { id: "tech", n: "Technical barriers: sensors, ERP and MES links" }, { id: "cost", n: "Cost and complexity of scaling" }, { id: "skills", n: "Skills gap and cross-team cooperation" }];
const BEN = [
  { id: "perf", n: "Performance monitoring and improvement", need: ["tech"] },
  { id: "res", n: "Resource optimisation and waste reduction", need: ["tech", "skills"] },
  { id: "env", n: "Environmental reporting and compliance", need: ["data", "tech"] },
  { id: "safe", n: "Working conditions and safety", need: ["tech", "skills"] },
  { id: "scale", n: "Adoption by SMEs and across sites", need: ["cost", "data"] },
];
function initB2B() {
  const solved = new Set();
  const svg = el("svg", { viewBox: "0 0 720 392" }); $("b2b").appendChild(svg);
  const by = (i) => 76 + i * 82, ny = (i) => 66 + i * 68;
  function draw() {
    svg.innerHTML = "";
    svg.appendChild(el("text", { x: 135, y: 22, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#5A6878" }, "BARRIER (select to resolve)"));
    svg.appendChild(el("text", { x: 585, y: 22, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#5A6878" }, "BENEFIT"));
    BEN.forEach((b, j) => b.need.forEach((nid) => { const i = BARR.findIndex((x) => x.id === nid); const ok = solved.has(nid); svg.appendChild(el("path", { d: `M270,${by(i)} C360,${by(i)} 360,${ny(j)} 450,${ny(j)}`, fill: "none", stroke: ok ? "#2E8B57" : "#C9A9A3", "stroke-width": ok ? 3 : 2, "stroke-dasharray": ok ? "" : "6 5" })); }));
    BARR.forEach((b, i) => { const ok = solved.has(b.id); const g = el("g", { class: "b2b-node", "aria-pressed": ok, "aria-label": b.n + (ok ? ", resolved" : ", open") }); g.appendChild(el("rect", { x: 10, y: by(i) - 28, width: 260, height: 56, rx: 9, fill: ok ? "#DFF1E6" : "#F3E3E0", stroke: ok ? "#2E8B57" : "#B5483A", "stroke-width": 2 })); wrapText(g, b.n, 140, by(i) - 6, 32, { "font-size": 13, "font-weight": 600, fill: "#16202B" }); g.appendChild(el("text", { x: 140, y: by(i) + 18, "text-anchor": "middle", "font-size": 11, fill: ok ? "#1F6B41" : "#8A3A2E" }, ok ? "resolved" : "open")); clickable(g, () => { ok ? solved.delete(b.id) : solved.add(b.id); draw(); }); svg.appendChild(g); });
    const open = [];
    BEN.forEach((b, j) => { const ok = b.need.every((n) => solved.has(n)); if (ok) open.push(b.n); svg.appendChild(el("rect", { x: 450, y: ny(j) - 25, width: 260, height: 50, rx: 9, fill: ok ? "#DFF1E6" : "#fff", stroke: ok ? "#2E8B57" : "#C3CEDA", "stroke-width": 2 })); wrapText(svg, b.n, 580, ny(j), 32, { "font-size": 13, "font-weight": ok ? 700 : 500, fill: ok ? "#1F6B41" : "#5A6878" }); });
    const txt = solved.size === 0 ? "<h3>Nothing resolved yet</h3><p>This is where Company B stood in the study: the potential is recognised, and every benefit is still behind at least one barrier.</p>"
      : `<h3>${open.length} of ${BEN.length} benefits open</h3>` + (open.length ? `<p>Open now: ${open.join("; ")}.</p>` : "<p>No benefit is fully open yet. Most benefits depend on two barriers at once.</p>") + (solved.has("tech") && !solved.has("data") ? "<p>Sensors and system links are in place, so the plant can see and improve its own performance. Reporting to outsiders still fails, because numbers calculated in different ways cannot be compared.</p>" : "") + (solved.size === 4 ? "<p>This is the position of the mature providers for their best customers. The remaining work is human-centric: keeping users involved so the twin stays in use.</p>" : "");
    $("b2bText").innerHTML = txt + "<p style='font-size:.85rem;color:#5A6878'>Practical order suggested by the study: data standards and interoperability first, then IoT infrastructure and skilled people, then cross-department cooperation and training.</p>";
  }
  draw();
}

/* ---------------- Static lists ---------------- */
export function initLists() {
  $("valueGrid").innerHTML = [
    ["1", "Measure the impact of a pilot", "KPI and impact frameworks for pilots and funded projects.", ["Baseline and follow-up measurement design", "Indicators with formula, source, owner and decision", "Operational, energy and carbon indicators in one view"]],
    ["2", "Study adoption with companies", "The full empirical cycle, from research design to publication.", ["Surveys and structural equation modelling", "Multiple-case studies and thematic analysis", "Systematic literature reviews with a protocol"]],
    ["3", "Carry the business work package", "The part of a technology project that reviewers ask about and engineers seldom want.", ["Exploitation and dissemination plans", "Value chain and stakeholder mapping", "Business model and barrier analysis"]],
    ["4", "Build demonstrators and proposals", "Ideas made testable within days, and written up for funders.", ["Browser-based twins with open code", "AI agent workflows for reviews and reporting", "Personal grants won; a full Business Finland Co-Creation plan written"]],
  ].map(([n, h, p, li]) => `<article class="value-card"><div class="num">${n}</div><h4>${h}</h4><p>${p}</p><ul>${li.map((x) => `<li>${x}</li>`).join("")}</ul></article>`).join("");

  $("projGrid").innerHTML = [
    ["Digital twin", "Every Repair Teaches", "A learning digital twin for a network of ageing bridges: each repair becomes a measurement that updates the model and ranks next year's work.", "https://rajan56.github.io/bridge-portfolio-learning-twin/"],
    ["Digital twin · energy", "Storage-minimised hydrogen twin", "A live twin of a local hydrogen system in the Nordics that treats logistics intelligence as a substitute for storage.", "https://rajan56.github.io/storage-minimised-hydrogen-twin/"],
    ["Digital twin · physics", "Wind turbine digital twin", "Physics-based twin of the NREL 5 MW reference turbine with turbulent wind, control, drivetrain and tower dynamics, and fault detection.", "https://rajan56.github.io/turbine-digital-twin/"],
    ["Concept", "The concept of a digital twin", "What a twin is, how it differs from a simulation, and how it lives through five phases from design to retirement.", "https://rajan56.github.io/concept-of-digital-twin/"],
    ["Performance analytics", "Margin recovery case", "From raw data to a decision: integrated dataset, driver-based EBITDA bridge, scenario model and an AI agent for variance commentary.", "https://rajan56.github.io/margin-recovery-case/"],
    ["Statistics", "Data analytics with R", "Hypothesis testing, difference in differences, regression diagnostics and logistic regression on an energy efficiency investment.", "https://rajan56.github.io/DataAnalyticsWith-R/"],
    ["Teaching", "Teaching portfolio", "Teaching philosophy, interactive classroom tools, simulations and short films from university teaching.", "https://rajan56.github.io/Teaching-Portfolio_RajanVK/"],
  ].map(([t, h, p, u]) => `<a class="proj" href="${u}"><span class="tag">${t}</span><h4>${h}</h4><p>${p}</p><span class="go">Open the live page →</span></a>`).join("");

  $("pubList").innerHTML = [
    ["V K, R. K., Rantala, T., Saunila, M., &amp; Ukko, J. (2026). Impact of digital twins on organisational performance management practices: Evidence from industrial cases. <i>International Journal of Process Management and Benchmarking</i>.", "https://doi.org/10.1504/IJPMB.2025.10076869", "Publication III · multiple-case study"],
    ["V K, R. K., Saunila, M., Ukko, J., &amp; Rantala, T. (2026). Digital twins for sustainable performance in Industry 5.0: Insights from multiple cases. In <i>Digital Manufacturing in Industry 5.0</i>. Springer.", "https://doi.org/10.1007/978-3-031-91500-0_35", "Publication IV · multiple-case study, shown in section 3"],
    ["V K, R. K., Saunila, M., Rantala, T., &amp; Ukko, J. (2025). The interplay between smart technologies, business sustainability, and environmental sustainability: An empirical analysis of SMEs. <i>Corporate Social Responsibility and Environmental Management, 32</i>(1), 835–848.", "https://doi.org/10.1002/csr.2966", "Publication II · survey of 179 SMEs, shown in section 4"],
    ["V K, R. K., Ukko, J., Rantala, T., &amp; Saunila, M. (2024). The value of novel technologies in context to performance measurement and management: A systematic review and future research directions. <i>Data and Information Management, 8</i>(1), 100054.", "https://doi.org/10.1016/j.dim.2023.100054", "Publication I · systematic literature review"],
    ["V K, R. K., Rantala, T., Saunila, M., &amp; Ukko, J. (2024). Role of digital twins in enhancing performance management: Analysis from case studies. R&amp;D Management Conference, Stockholm, Sweden.", "", "Conference paper · session chair"],
    ["V K, R. K. (2022). Role of digital technologies for sustainable innovation and value creation: A narrative review. <i>Rupandehi Campus Journal, 3</i>(1), 49–55.", "https://doi.org/10.3126/rcj.v3i1.51547", "Narrative review"],
    ["V K, R. K. (2026). <i>Performance management with novel technologies: Integrating sustainability performance in digital transformation</i> [Doctoral dissertation, LUT University].", "https://urn.fi/URN:ISBN:978-952-412-433-1", "Doctoral dissertation · framework shown in section 1"],
  ].map(([c, u, w]) => `<li>${c} ${u ? `<a href="${u}">${u.replace("https://", "")}</a>` : ""}<span class="what">${w}</span></li>`).join("");

  $("methodStrip").innerHTML = ["Survey design", "Covariance-based SEM (Stata)", "Multiple-case study", "Reflexive thematic analysis (NVivo)", "Systematic literature review", "Design science research", "KPI and impact frameworks", "Python", "R", "SQL", "Power BI", "JavaScript and three.js", "AI agent workflows"].map((t) => `<span class="tag">${t}</span>`).join("");
}
