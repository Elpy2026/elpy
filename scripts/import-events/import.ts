import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import {
  importTeatroPirandelloEvents,
  type TeatroPirandelloEvent,
} from "./sources/teatroPirandello.js";

try {
  loadEnvFile(".env");
} catch {
  // Le variabili potrebbero essere già presenti nell'ambiente.
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Variabile VITE_SUPABASE_URL mancante nel file .env");
}

if (!supabaseSecretKey) {
  throw new Error("Variabile SUPABASE_SECRET_KEY mancante nel file .env");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ExistingEvent = {
  id: string;
  source_id: string | null;
};

type EventDatabaseRow = {
  source: string;
  source_id: string;
  source_url: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  province: string;
  venue: string;
  address: null;
  latitude: null;
  longitude: null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  image_url: string | null;
  organizer: string;
  organizer_url: string;
  ticket_url: string;
  is_free: null;
  imported: boolean;
  published: boolean;
  updated_at: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toAllDayTimestamp(date: string): string {
  return `${date}T12:00:00.000Z`;
}

function mapEventToDatabaseRow(
  event: TeatroPirandelloEvent,
): EventDatabaseRow {
  return {
    source: event.source,
    source_id: event.sourceId,
    source_url: event.sourceUrl,
    title: event.title,
    slug: `${slugify(event.title)}-${event.startDate}`,
    description: event.description,
    category: event.category,
    city: event.city,
    province: event.province,
    venue: event.venue,
    address: null,
    latitude: null,
    longitude: null,
    start_date: toAllDayTimestamp(event.startDate),
    end_date: toAllDayTimestamp(event.endDate),
    all_day: true,
    image_url: event.imageUrl,
    organizer: "Fondazione Teatro Pirandello",
    organizer_url: "https://fondazioneteatropirandello.it",
    ticket_url: event.sourceUrl,
    is_free: null,
    imported: true,
    published: true,
    updated_at: new Date().toISOString(),
  };
}

async function readExistingEvents(): Promise<Map<string, ExistingEvent>> {
  const { data, error } = await supabase
    .from("events")
    .select("id, source_id")
    .eq("source", "teatro-pirandello");

  if (error) {
    throw new Error(
      `Errore durante la lettura degli eventi esistenti: ${error.message}`,
    );
  }

  const eventsBySourceId = new Map<string, ExistingEvent>();

  for (const event of (data ?? []) as ExistingEvent[]) {
    if (event.source_id) {
      eventsBySourceId.set(event.source_id, event);
    }
  }

  return eventsBySourceId;
}

async function runImport(): Promise<void> {
  console.log("Avvio importazione degli eventi del Teatro Pirandello...");

  const parsedEvents = await importTeatroPirandelloEvents();

  if (parsedEvents.length === 0) {
    throw new Error(
      "Il parser non ha restituito eventi. Importazione interrotta per sicurezza.",
    );
  }

  const existingEvents = await readExistingEvents();
  const importedSourceIds = new Set(parsedEvents.map((event) => event.sourceId));

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const event of parsedEvents) {
    const row = mapEventToDatabaseRow(event);
    const existingEvent = existingEvents.get(event.sourceId);

    if (existingEvent) {
      const { error } = await supabase
        .from("events")
        .update(row)
        .eq("id", existingEvent.id);

      if (error) {
        failed += 1;
        console.error(`Errore aggiornamento "${event.title}": ${error.message}`);
        continue;
      }

      updated += 1;
      console.log(`Aggiornato: ${event.title} — ${event.startDate}`);
      continue;
    }

    const { error } = await supabase.from("events").insert({
      ...row,
      created_at: new Date().toISOString(),
    });

    if (error) {
      failed += 1;
      console.error(`Errore inserimento "${event.title}": ${error.message}`);
      continue;
    }

    inserted += 1;
    console.log(`Inserito: ${event.title} — ${event.startDate}`);
  }
  let unpublished = 0;

for (const existingEvent of existingEvents.values()) {
  if (
    existingEvent.source_id &&
    !importedSourceIds.has(existingEvent.source_id)
  ) {
    const { error } = await supabase
      .from("events")
      .update({
        published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingEvent.id);

    if (error) {
      console.error(
        `Errore durante la disattivazione dell'evento ${existingEvent.source_id}: ${error.message}`,
      );
      failed += 1;
      continue;
    }

    unpublished += 1;
  }
}

console.log("Importazione completata.");
console.log(`Eventi letti: ${parsedEvents.length}`);
console.log(`Nuovi inserimenti: ${inserted}`);
console.log(`Eventi aggiornati: ${updated}`);
console.log(`Eventi disattivati: ${unpublished}`);
console.log(`Errori: ${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}
export async function importTeatroPirandello(): Promise<void> {
  await runImport();
}

const isExecutedDirectly =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isExecutedDirectly) {
  importTeatroPirandello().catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Errore sconosciuto durante l'import";

    console.error("");
    console.error(`Importazione interrotta: ${message}`);
    process.exitCode = 1;
  });
}