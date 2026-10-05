"""Reference implementation of the production line model behind the live demonstrator.

The browser version (js/model.js) uses the same equations and the same random number
generator, so both give the same KPI values for the same seed.

All parameters are illustrative assumptions. They are not measurements from any company.

Run:  python python/factory_model.py
Writes data/scenarios.json and data/scenarios.csv
"""
import csv
import json
import os

STATIONS = [
    ("forming", "Forming press", 90.0, 0.000045),
    ("moulding", "Injection moulding", 120.0, 0.000060),
    ("assembly", "Assembly cell", 35.0, 0.000030),
    ("test", "End-of-line test", 20.0, 0.000020),
]

P = dict(
    idealRate=1.0, baseHazard=0.00006, hazardGain=14, repairMin=90, detectNoIot=45, detectIot=5,
    periodicEveryMin=14 * 1440, periodicDurMin=30, aiThreshold=0.55, aiDurMin=25,
    baseDefect=0.02, healthDefect=0.10, speedDefect=0.5, twinDefectCut=0.4,
    idleShareNoTwin=0.6, idleShareTwin=0.15,
)

M32 = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & M32


def mulberry32(seed):
    """Same 32-bit generator as the JavaScript version."""
    state = [seed & M32]

    def rand():
        state[0] = (state[0] + 0x6D2B79F5) & M32
        t = state[0]
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296.0

    return rand


def run_scenario(iot, ai, twin, days=90, seed=2026, speed=1.0):
    rand = mulberry32(seed)
    ai = ai and iot
    twin = twin and iot
    s = speed
    st = [dict(power=p, wear=w, health=1.0, state="run", timer=0, since=0) for _, _, p, w in STATIONS]
    tot = dict(planned=0, run=0, units=0.0, good=0.0, kwh=0.0, failures=0, plannedStops=0)

    for _ in range(days * 1440):
        all_up = True
        for x in st:
            if x["state"] != "run":
                x["timer"] -= 1
                if x["timer"] <= 0:
                    x["state"], x["health"], x["since"] = "run", 1.0, 0
            if x["state"] != "run":
                all_up = False

        for x in st:
            u = rand()
            if x["state"] != "run":
                continue
            if all_up:
                x["health"] = max(0.0, x["health"] - x["wear"] * s * s)
                hazard = P["baseHazard"] * (1 + P["hazardGain"] * (1 - x["health"]) ** 3) * s ** 1.5
                if u < hazard:
                    x["state"] = "down"
                    x["timer"] = P["repairMin"] + (P["detectIot"] if iot else P["detectNoIot"])
                    tot["failures"] += 1
                    continue
            x["since"] += 1
            if ai:
                if x["health"] < P["aiThreshold"]:
                    x["state"], x["timer"] = "maint", P["aiDurMin"]
                    tot["plannedStops"] += 1
            elif x["since"] >= P["periodicEveryMin"]:
                x["state"], x["timer"] = "maint", P["periodicDurMin"]
                tot["plannedStops"] += 1

        running = all(x["state"] == "run" for x in st)
        hmin = min(x["health"] for x in st)
        units = good = 0.0
        if running:
            units = P["idealRate"] * s * (1 - 0.25 * (1 - hmin))
            defect = P["healthDefect"] * (1 - hmin) ** 2 + P["speedDefect"] * max(0.0, s - 1)
            if twin:
                defect *= 1 - P["twinDefectCut"]
            defect += P["baseDefect"]
            good = units * (1 - defect)
        kw = 0.0
        for x in st:
            if running:
                kw += x["power"] * (0.5 + 0.5 * s * s) * (1 + 0.2 * (1 - x["health"]))
            else:
                kw += x["power"] * (P["idleShareTwin"] if twin else P["idleShareNoTwin"])

        tot["planned"] += 1
        tot["run"] += 1 if running else 0
        tot["units"] += units
        tot["good"] += good
        tot["kwh"] += kw / 60.0

    return kpis(tot)


def kpis(tot, emission_factor=100.0):
    a = tot["run"] / tot["planned"]
    p = tot["units"] / (tot["run"] * P["idealRate"])
    q = tot["good"] / tot["units"]
    sec = tot["kwh"] / tot["good"]
    return dict(availability=a, performance=p, quality=q, oee=a * p * q, goodUnits=tot["good"],
                sec=sec, co2=sec * emission_factor, failures=tot["failures"], plannedStops=tot["plannedStops"])


SCENARIOS = [
    ("periodic", "Periodic review (no sensing)", False, False, False),
    ("iot", "IoT condition monitoring", True, False, False),
    ("iot_ai", "IoT + AI prediction", True, True, False),
    ("twin", "IoT + AI + digital twin", True, True, True),
]

if __name__ == "__main__":
    seeds = list(range(2026, 2036))  # 10 replications per scenario
    out = []
    for key, label, iot, ai, twin in SCENARIOS:
        runs = [run_scenario(iot, ai, twin, seed=s) for s in seeds]
        row = dict(key=key, label=label, replications=len(runs), days=90)
        for k in ("availability", "performance", "quality", "oee", "sec", "co2", "goodUnits", "failures", "plannedStops"):
            vals = [r[k] for r in runs]
            mean = sum(vals) / len(vals)
            sd = (sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)) ** 0.5
            row[k] = round(mean, 5)
            row[k + "_sd"] = round(sd, 5)
        row["seed2026"] = {k: round(v, 6) for k, v in runs[0].items()}
        out.append(row)
        print(f"{label:34s} OEE {row['oee']:.3f} (sd {row['oee_sd']:.3f})  kWh/unit {row['sec']:.3f}  failures {row['failures']:.1f}")

    here = os.path.dirname(os.path.abspath(__file__))
    data = os.path.join(here, "..", "data")
    os.makedirs(data, exist_ok=True)
    with open(os.path.join(data, "scenarios.json"), "w") as f:
        json.dump(out, f, indent=1)
    with open(os.path.join(data, "scenarios.csv"), "w", newline="") as f:
        cols = [c for c in out[0] if c != "seed2026"]
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in out:
            w.writerow({c: r[c] for c in cols})
