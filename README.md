# Applied Research Scientist Portfolio: Rajan Kumar V K

**Live page:** https://rajan56.github.io/rajanvk-AppliedResearchScientist-portfolio/

Research portfolio of Rajan Kumar V K, D.Sc. (Tech.), on one question: what happens when industrial firms take digital twins, AI and IoT into use, what the change is worth, and what holds adoption back. The page joins published evidence with live demonstrators.

## What is on the page

| Section | What it shows | Basis |
|---|---|---|
| 1. Research framework | The conceptual model of the dissertation as a testable 3D model. AI, IoT and digital twins can be integrated into existing performance management one at a time or together. The model shows how the eleven transformed practices change and how the enhanced practice leads to business, environmental and social sustainability outcomes, with organisational readiness as the digital transformation context | Structure: doctoral dissertation, LUT University (2026), Figure 3. Weights: illustrative |
| 2. KPI lab | 3D simulated production line. IoT sensing, AI prediction and a digital twin layer can be switched on and compared with the same line under periodic review. KPI specification cards for OEE, availability, first-time-right, specific energy, carbon intensity and a capability indicator | Illustrative model, synthetic data |
| 3. Case study explorer | Cases, evidence matrix and barrier-to-benefit map of the multiple-case study on digital twins and sustainable performance in Industry 5.0 | V K, Saunila, Ukko and Rantala (2026), Springer, https://doi.org/10.1007/978-3-031-91500-0_35 |
| 4. Survey evidence | Published path estimates of the SME survey and a mediation simulator on synthetic data | V K, Saunila, Rantala and Ukko (2025), https://doi.org/10.1002/csr.2966 |
| 5. Value | What this work contributes inside a research and technology organisation | |
| 6. Projects | Links to other live demonstrators and the teaching portfolio | |

## What is real and what is simulated

- Published findings are cited with their sources and are paraphrased, not quoted.
- In the framework model, the blocks, the eleven practices, the outcome lists and the arrows follow Figure 3 of the dissertation. The weights are illustrative codings (each technology as a primary or supporting enabler of each practice) and the starting levels are assumptions. The index values show the logic of the framework. They are not estimates from data.
- The production line is a teaching model. Its parameters are assumptions listed on the page and in `js/model.js`. It was not calibrated on any company.
- The mediation simulator generates synthetic scores from the published path values. It illustrates the logic of mediation and does not reproduce the covariance-based structural equation model of the article. No survey responses are stored in this repository.
- In the barrier-to-benefit map, the barrier groups and benefits come from the published chapter. The single links between them are the author's interpretation, drawn for illustration.

## Repository structure

```
index.html            page
css/style.css         styles
js/model.js           production line model and KPI formulas
js/lab.js             KPI lab: simulation loop, tiles, charts
js/scene3d.js         3D scene (three.js)
js/mediation.js       mediation simulator: generation, OLS, bootstrap
js/framework_model.js conceptual framework model (Figure 3)
js/framework3d.js     3D scene of the framework (three.js)
js/framework_ui.js    framework controls, lists and tables
js/content.js         case explorer, lists
js/charts.js          canvas charts
js/vendor/            three.js r170 and OrbitControls (MIT)
python/framework_model.py   the framework model in Python; writes data/framework_scenarios.json
python/factory_model.py     reference implementation of the line model; writes data/scenarios.*
python/mediation_check.py   Monte Carlo power check of the mediation logic
data/                 outputs of the Python scripts
```

The framework model exists in JavaScript and in Python with the same numbers, and both return the same index values for all eight technology combinations.

The Python and JavaScript versions of the line model share their equations and their random number generator (mulberry32). For the same seed they return the same KPI values, which can be checked by running `python python/factory_model.py` and comparing `seed2026` in `data/scenarios.json` with the browser model.

## Run locally

```
python -m http.server 8000
```

Then open http://localhost:8000. A local server is needed because the page uses JavaScript modules.

To regenerate the data:

```
python python/framework_model.py
python python/factory_model.py
python python/mediation_check.py    # needs numpy
```

## Publish with GitHub Pages

Settings, then Pages, then "Deploy from a branch", branch `main`, folder `/ (root)`.

## Licence

Code: MIT. Text and figures: CC BY 4.0. Portrait photograph: all rights reserved. three.js: MIT, (c) three.js authors.

## Contact

rajanvk56@outlook.com · +358 41 32 58 220 · https://www.linkedin.com/in/rajan-kumar-v-k-0a541799/ · ORCID 0009-0005-0459-7291
