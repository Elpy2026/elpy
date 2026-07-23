import { importEventsToDatabase } from "../lib/databaseImporter";

export type FestivalleEvent = {
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

type ArtistPost = {
  id: number;
  link: string;
  title: {
    rendered: string;
  };
};

const API_URL =
  "https://festivalle.it/wp-json/wp/v2/artista?per_page=100";

const SOURCE = "festivalle";
const CATEGORY = "Festival";
const CITY = "Agrigento";
const PROVINCE = "AG";

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, "…");
}

function stripHtml(html: string): string {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const ITALIAN_MONTHS: Record<string, number> = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12,
};

function parseItalianDate(value: string): { startDate: string; endDate: string } | null {
  const normalized = normalize(value).toLowerCase();
  const match = normalized.match(/(?:lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica)?\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(20\d{2})/i);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = ITALIAN_MONTHS[match[2].toLowerCase()];
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { startDate: iso, endDate: iso };
}

async function download(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ELPYO-Events-Importer/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}`);
  }

  return await response.text();
}
function htmlToLines(html: string): string[] {
    return stripHtml(html)
      .split(/\r?\n/)
      .map((line) => normalize(line))
      .filter(Boolean);
  }
  
  function extractValueAfterLabel(
    lines: string[],
    label: string,
  ): string | null {
    const labelIndex = lines.findIndex(
      (line) => line.toLowerCase() === label.toLowerCase(),
    );
  
    if (labelIndex < 0) {
      return null;
    }
  
    for (let index = labelIndex + 1; index < lines.length; index += 1) {
      const value = normalize(lines[index]);
  
      if (!value) {
        continue;
      }
  
      if (
        /^(location|data|date|biografia|bio|video|gallery|biglietti)$/i.test(
          value,
        )
      ) {
        return null;
      }
  
      return value;
    }
  
    return null;
  }
  
  function extractTitle(post: ArtistPost): string {
    return normalize(stripHtml(post.title.rendered));
  }
  
  function extractVenue(html: string): string {
    const lines = htmlToLines(html);
    const location = extractValueAfterLabel(lines, "Location");
  
    if (location) {
      return location;
    }
  
    const headingMatch = html.match(
      /<h[1-6][^>]*>\s*([^<]*(?:Agrigento|Palermo|Sicilia|Valle dei Templi)[^<]*)<\/h[1-6]>/i,
    );
  
    if (headingMatch) {
      return normalize(stripHtml(headingMatch[1]));
    }
  
    return "FestiValle";
  }
  
  function extractDateText(html: string): string | null {
    const lines = htmlToLines(html);
    const dateValue = extractValueAfterLabel(lines, "Data");
  
    if (dateValue) {
      return dateValue;
    }
  
    const monthPattern =
      "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";
  
    const fullText = normalize(stripHtml(html));
  
    const match = fullText.match(
      new RegExp(
        `(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)?\\s*\\d{1,2}\\s+(?:${monthPattern})\\s+20\\d{2}`,
        "i",
      ),
    );
  
    return match ? normalize(match[0]) : null;
  }
  
  function extractImage(html: string): string | null {
    const lazyImageMatch = html.match(
      /\bdata-src-img=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i,
    );
  
    if (lazyImageMatch) {
      return decodeHtml(lazyImageMatch[1]);
    }
  
    const webpImageMatch = html.match(
      /\bdata-src-webp=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\.webp)?)["']/i,
    );
  
    if (webpImageMatch) {
      return decodeHtml(webpImageMatch[1]);
    }
  
    const openGraphMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
  
    if (openGraphMatch) {
      return decodeHtml(openGraphMatch[1]);
    }
  
    const reversedOpenGraphMatch = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
  
    if (reversedOpenGraphMatch) {
      return decodeHtml(reversedOpenGraphMatch[1]);
    }
  
    return null;
  }
  
  function extractDescription(html: string, title: string): string {
    const lines = htmlToLines(html);
  
    const excludedExactValues = new Set([
      title.toLowerCase(),
      "location",
      "data",
      "date",
      "biografia",
      "biography",
      "video",
      "gallery",
      "biglietti",
      "acquista",
      "scopri di più",
      "italiano",
      "english",
    ]);
  
    const descriptionLines = lines.filter((line) => {
      const normalizedLine = normalize(line);
      const lowerLine = normalizedLine.toLowerCase();
  
      if (excludedExactValues.has(lowerLine)) {
        return false;
      }
  
      if (normalizedLine.length < 45) {
        return false;
      }
  
      if (
        lowerLine.includes("cookie") ||
        lowerLine.includes("privacy policy") ||
        lowerLine.includes("tutti i diritti riservati") ||
        lowerLine.includes("accesso a tutti gli eventi") ||
        lowerLine.includes("aggiungi al carrello") ||
        lowerLine.includes("woocommerce")
      ) {
        return false;
      }
  
      return true;
    });
  
    const uniqueLines = [...new Set(descriptionLines)];
  
    const preferredLine =
      uniqueLines.find((line) =>
        /\b(live|concerto|festivalle|artista|musica|palermo|agrigento)\b/i.test(
          line,
        ),
      ) ?? uniqueLines[0];
  
    if (!preferredLine) {
      return `Evento di ${title} organizzato da FestiValle.`;
    }
  
    return preferredLine.length > 700
      ? `${preferredLine.slice(0, 700).trim()}…`
      : preferredLine;
  }
  
  function inferCity(venue: string): string {
    const normalizedVenue = venue.toLowerCase();
  
    if (normalizedVenue.includes("palermo")) {
      return "Palermo";
    }
  
    if (
      normalizedVenue.includes("agrigento") ||
      normalizedVenue.includes("valle dei templi")
    ) {
      return "Agrigento";
    }
  
    return CITY;
  }
  
  function inferProvince(city: string): string {
    if (city.toLowerCase() === "palermo") {
      return "PA";
    }
  
    return PROVINCE;
  }
  export async function importFestivalleEvents(): Promise<FestivalleEvent[]> {
    console.log("Leggo gli eventi di FestiValle...");
  
    const response = await fetch(API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ELPYO-Events-Importer/1.0; +https://elpyo.com)",
        Accept: "application/json",
      },
    });
  
    if (!response.ok) {
      throw new Error(
        `Errore FestiValle: HTTP ${response.status} ${response.statusText}`,
      );
    }
  
    const posts = (await response.json()) as ArtistPost[];
  
    const events: FestivalleEvent[] = [];
  
    for (const post of posts) {
      try {
        const html = await download(post.link);
  
        const venue = extractVenue(html);
        const city = inferCity(venue);
        const province = inferProvince(city);
  
        const dateText = extractDateText(html);
  
        if (!dateText) {
          console.warn(`Data non trovata: ${post.link}`);
          continue;
        }
  
        const dates = parseItalianDate(dateText);

      if (!dates) {
        console.warn(`Data non valida: ${dateText} — ${post.link}`);
        continue;
      }
  
        events.push({
          source: SOURCE,
          sourceId: String(post.id),
          sourceUrl: post.link,
  
          title: extractTitle(post),
          description: extractDescription(html, extractTitle(post)),
  
          category: CATEGORY,
  
          city,
          province,
          venue,
  
          startDate: dates.startDate,
          endDate: dates.endDate,
  
          imageUrl: extractImage(html),
        });
  
        console.log(`✓ ${post.title.rendered}`);
      } catch (error) {
        console.error(`Errore su ${post.link}`, error);
      }
    }
  
    events.sort((a, b) =>
      a.startDate === b.startDate
        ? a.title.localeCompare(b.title, "it")
        : a.startDate.localeCompare(b.startDate),
    );
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const filtered = events.filter((event) => {
      const end = new Date(event.endDate);
      end.setHours(0, 0, 0, 0);
  
      return end >= today;
    });
  
    console.log(`Eventi FestiValle trovati: ${filtered.length}`);
  
    return filtered;
  }
  
  export async function importFestivalle(): Promise<void> {
    await importEventsToDatabase({
      source: SOURCE,
      organizer: "FestiValle",
      organizerUrl: "https://festivalle.it",
      readEvents: importFestivalleEvents,
    });
  }