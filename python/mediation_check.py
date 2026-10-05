"""Monte Carlo check of the mediation logic shown on the page (Publication II).

Generates synthetic observed scores from the published path values, with noise set so
that the standard errors at n = 179 are close to the published ones, estimates the paths by ordinary least squares, and
reports how often a percentile bootstrap finds the indirect effect at n = 179.

This illustrates the logic of mediation. It does not reproduce the covariance-based
structural equation model of the article, and it uses no survey responses.

Source of the published values:
V K, R. K., Saunila, M., Rantala, T., & Ukko, J. (2025). Corporate Social Responsibility
and Environmental Management, 32(1), 835-848. https://doi.org/10.1002/csr.2966

Run:  python python/mediation_check.py     (needs numpy)
"""
import json
import os

import numpy as np

PUB = dict(n=179, a=0.146, b=1.074, c=-0.055)
# Residual SDs are set so that the standard errors at n = 179 are close to the published ones.
MOM = dict(x=3.32, sx=1.088, m=3.59, y=3.52, resM=0.99, resY=1.135)


def generate(rng, n, a, b, c):
    sd_m, sd_y = MOM["resM"], MOM["resY"]
    x = MOM["x"] + MOM["sx"] * rng.standard_normal(n)
    m = MOM["m"] + a * (x - MOM["x"]) + sd_m * rng.standard_normal(n)
    y = MOM["y"] + c * (x - MOM["x"]) + b * (m - MOM["m"]) + sd_y * rng.standard_normal(n)
    return x, m, y


def estimate(x, m, y):
    a = np.polyfit(x, m, 1)[0]
    design = np.column_stack([np.ones_like(x), x, m])
    coef, *_ = np.linalg.lstsq(design, y, rcond=None)
    return a, coef[2], coef[1]  # a, b, c'


def bootstrap_ci(rng, x, m, y, reps=1000):
    n = len(x)
    ind = np.empty(reps)
    for r in range(reps):
        i = rng.integers(0, n, n)
        a, b, _ = estimate(x[i], m[i], y[i])
        ind[r] = a * b
    return np.percentile(ind, [2.5, 97.5])


if __name__ == "__main__":
    rng = np.random.default_rng(2026)
    results = {}
    for n in (100, 179, 400):
        hits, est = 0, []
        trials = 300
        for _ in range(trials):
            x, m, y = generate(rng, n, PUB["a"], PUB["b"], PUB["c"])
            a, b, c = estimate(x, m, y)
            lo, hi = bootstrap_ci(rng, x, m, y, reps=400)
            hits += int(lo > 0 or hi < 0)
            est.append(a * b)
        results[str(n)] = dict(trials=trials, mean_indirect=round(float(np.mean(est)), 4),
                               share_detected=round(hits / trials, 3))
        print(f"n = {n:4d}: mean indirect {np.mean(est):.3f}, detected in {hits / trials:.0%} of samples")
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "mediation_check.json")
    with open(out, "w") as f:
        json.dump(dict(set_values=PUB, true_indirect=round(PUB["a"] * PUB["b"], 4), by_sample_size=results), f, indent=1)
