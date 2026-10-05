"""Conceptual framework of the dissertation (Figure 3) as a small, explicit model.

Structure follows the figure: novel technologies (AI, IoT, DT) are integrated into existing
performance management, the outcome is an enhanced PM with eleven transformed practices, and
the enhanced PM leads to business, environmental and social sustainability outcomes inside a
digital transformation context.

The weights are illustrative codings made for the demonstrator. They were not estimated from
data. js/framework_model.js holds the same numbers and returns the same results.

Source of the structure:
V K, R. K. (2026). Performance management with novel technologies: Integrating sustainability
performance in digital transformation [Doctoral dissertation, LUT University], Figure 3.
https://urn.fi/URN:ISBN:978-952-412-433-1

Run:  python python/framework_model.py
Writes data/framework_scenarios.json
"""
import json
import os

# weights: (AI, IoT, DT) with 0 = no link, 1 = supporting, 2 = primary enabler
PRACTICES = [
    ("kpi", "KPI definition and alignment", (1, 0, 2), 0.3),
    ("capture", "Automated, real-time data capture", (0, 2, 1), 0.1),
    ("monitor", "Continuous monitoring and alerting", (1, 2, 2), 0.1),
    ("decide", "Enhanced data-driven decision-making", (2, 1, 2), 0.25),
    ("predict", "Predictive analytics and what-if simulation", (2, 1, 2), 0.05),
    ("optimise", "Operational efficiency and optimisation", (1, 1, 2), 0.25),
    ("allocate", "Dynamic resource allocation and scheduling", (2, 1, 1), 0.15),
    ("feedback", "Context-aware feedback and automated coaching", (2, 1, 0), 0.1),
    ("hmc", "Human-machine collaboration", (1, 0, 2), 0.05),
    ("learn", "Continuous learning and skill development", (1, 0, 2), 0.15),
    ("review", "Ongoing performance review and TBL refinement", (1, 1, 1), 0.3),
]

OUTCOMES = [
    ("eff", "business", "Efficiency", ("optimise", "allocate", "monitor", "capture")),
    ("comp", "business", "Competitiveness", ("decide", "predict", "kpi")),
    ("focus", "business", "Strategic focus", ("kpi", "review", "decide")),
    ("waste", "environmental", "Reduce waste", ("optimise", "allocate", "predict")),
    ("emis", "environmental", "Emission reduction", ("monitor", "predict", "allocate")),
    ("report", "environmental", "Environmental reporting and compliance", ("capture", "review", "monitor")),
    ("safety", "social", "Working conditions and safety", ("monitor", "hmc")),
    ("well", "social", "Employee wellbeing", ("feedback", "hmc")),
    ("incl", "social", "Digital inclusion", ("hmc", "learn")),
    ("opp", "social", "Learning opportunities", ("learn", "feedback")),
]

K = 0.8  # largest contribution of one primary technology to one practice

COMBOS = [
    (0, 0, 0, "Existing PM, no novel technology"),
    (1, 0, 0, "AI"),
    (0, 1, 0, "IoT"),
    (0, 0, 1, "DT"),
    (1, 1, 0, "AI + IoT"),
    (1, 0, 1, "AI + DT"),
    (0, 1, 1, "IoT + DT"),
    (1, 1, 1, "AI + IoT + DT"),
]


def compute(ai, iot, dt, readiness):
    # Synergy: the IoT data stream feeds AI analytics and keeps the twin current; AI adds analysis to the twin.
    eff = (ai * (0.6 + 0.4 * iot), iot, dt * (0.5 + 0.3 * iot + 0.2 * ai))
    practices = {}
    for pid, _, w, base in PRACTICES:
        miss = 1.0
        for t in range(3):
            miss *= 1 - K * (w[t] / 2) * eff[t]
        practices[pid] = base + (1 - base) * readiness * (1 - miss)
    raw = {oid: sum(practices[p] for p in src) / len(src) for oid, _, _, src in OUTCOMES}

    def dim_mean(dim, values):
        ids = [oid for oid, d, _, _ in OUTCOMES if d == dim]
        return sum(values[i] for i in ids) / len(ids)

    business = dim_mean("business", raw)
    outcomes = {oid: (raw[oid] * business if d == "environmental" else raw[oid]) for oid, d, _, _ in OUTCOMES}
    pm = sum(practices.values()) / len(practices)
    return dict(pm=pm, business=business, environmental=dim_mean("environmental", outcomes),
                social=dim_mean("social", outcomes), practices=practices, outcomes=outcomes)


if __name__ == "__main__":
    readiness = 0.8
    rows = []
    for ai, iot, dt, label in COMBOS:
        r = compute(ai, iot, dt, readiness)
        rows.append(dict(label=label, ai=ai, iot=iot, dt=dt, readiness=readiness,
                         pm=round(r["pm"], 4), business=round(r["business"], 4),
                         environmental=round(r["environmental"], 4), social=round(r["social"], 4)))
        print(f"{label:34s} PM {r['pm']:.3f}  business {r['business']:.3f}  environmental {r['environmental']:.3f}  social {r['social']:.3f}")
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "framework_scenarios.json")
    with open(out, "w") as f:
        json.dump(rows, f, indent=1)
