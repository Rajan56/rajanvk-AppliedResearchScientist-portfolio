import { initFramework, initCases, initLists } from "./content.js";
import { initMediation } from "./mediation.js";
import { initLab } from "./lab.js";

const safe = (name, fn) => { try { fn(); } catch (e) { console.error(name, e); } };
safe("framework", initFramework);
safe("cases", initCases);
safe("lists", initLists);
safe("mediation", initMediation);
safe("lab", initLab);
