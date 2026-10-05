import { initCases, initLists } from "./content.js";
import { initFramework3D } from "./framework_ui.js";
import { initMediation } from "./mediation.js";
import { initLab } from "./lab.js";

const safe = (name, fn) => { try { fn(); } catch (e) { console.error(name, e); } };
safe("framework", initFramework3D);
safe("cases", initCases);
safe("lists", initLists);
safe("mediation", initMediation);
safe("lab", initLab);
