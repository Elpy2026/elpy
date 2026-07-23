import { importTeatroPirandello } from "./import.js";
import { importValleTempli } from "./sources/valleTempli.js";

console.log("Avvio importazione generale degli eventi...");

await importTeatroPirandello();
await importValleTempli();

console.log("Importazione generale terminata.");