import { importTeatroPirandelloEvents } from "./sources/teatroPirandello.js";

const events = await importTeatroPirandelloEvents();

console.log(JSON.stringify(events, null, 2));