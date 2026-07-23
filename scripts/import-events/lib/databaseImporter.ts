import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";

try {
  loadEnvFile(".env");
} catch {
  // Le variabili potrebbero essere già presenti nell’ambiente.
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

export type ImportedEvent = {
  source: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  category: string;
  city: string;
  province: string;
  venue: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
};

type ExistingEvent = {
  id: string;
  source_id: string | null;
};

type ImportConfiguration = {
  source: string;
  organizer: string;
  organizerUrl: string;
  readEvents: () => Promise<ImportedEvent[]>;
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

export async function importEventsToDatabase(
  configuration: ImportConfiguration,
): Promise<void> {
  console.log(`Avvio importazione: ${configuration.source}...`);

  const parsedEvents = await configuration.readEvents();

  if (parsedEvents.length === 0) {
    console.log(
      `Nessun evento attuale trovato per ${configuration.source}.`,
    );
  }

  const { data, error: readError } = await supabase
    .from("events")
    .select("id, source_id")
    .eq("source", configuration.source);

  if (readError) {
    throw new Error(
      `Errore durante la lettura degli eventi esistenti: ${readError.message}`,
    );
  }

  const existingEvents = new Map<string, ExistingEvent>();

  for (const event of (data ?? []) as ExistingEvent[]) {
    if (event.source_id) {
      existingEvents.set(event.source_id, event);
    }
  }

  const importedSourceIds = new Set(
    parsedEvents.map((event) => event.sourceId),
  );

  let inserted = 0;
  let updated = 0;
  let unpublished = 0;
  let failed = 0;

  for (const event of parsedEvents) {
    const now = new Date().toISOString();

    const row = {
      source: configuration.source,
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
      organizer: configuration.organizer,
      organizer_url: configuration.organizerUrl,
      ticket_url: event.sourceUrl,
      is_free: null,
      imported: true,
      published: true,
      updated_at: now,
    };

    const existingEvent = existingEvents.get(event.sourceId);

    if (existingEvent) {
      const { error } = await supabase
        .from("events")
        .update(row)
        .eq("id", existingEvent.id);

      if (error) {
        failed += 1;
        console.error(
          `Errore aggiornamento "${event.title}": ${error.message}`,
        );
        continue;
      }

      updated += 1;
      console.log(`Aggiornato: ${event.title} — ${event.startDate}`);
      continue;
    }

    const { error } = await supabase.from("events").insert({
      ...row,
      created_at: now,
    });

    if (error) {
      fail += 1;
      console.error(
        `Errore inserimento "${event.title}": ${error.message}`,
      );
      continue;
    }

    inserted += 1;
    console.log(`Inserito: ${event.title} — ${event.startDate}`);
  }

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
        failed += 1;
        console.error(
          `Errore disattivazione ${existingEvent.source_id}: ${error.message}`,
        );
        continue;
      }

      unpublished += 1;
    }
  }

  console.log(`Importazione ${configuration.source} completata.`);
  console.log(`Eventi letti: ${parsedEvents.length}`);
  console.log(`Nuovi inserimenti: ${inserted}`);
  console.log(`Eventi aggiornati: ${updated}`);
  console.log(`Eventi disattivati: ${unpublished}`);
  console.log(`Errori: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}
