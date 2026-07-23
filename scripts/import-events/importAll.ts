import { importTeatroPirandello } from "./import.js";
import { importValleTempli } from "./sources/valleTempli.js";
import { importFestivalle } from "./sources/festivalle.js";

console.log("Avvio importazione generale degli eventi...");

await importTeatroPirandello();
await importValleTempli();
await importFestivalle();

console.log("Importazione generale terminata.");