import { importValleTempliEvents } from "./sources/valleTempli.js";

const events = await importValleTempliEvents();

console.log(JSON.stringify(events, null, 2));