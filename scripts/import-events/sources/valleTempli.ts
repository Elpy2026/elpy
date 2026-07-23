import { extractDateRange } from "../lib/dateParser";
import { importEventsToDatabase } from "../lib/databaseImporter";
export type ValleTempliEvent = {
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
  
  type WordPressPost = {
    id: number;
    date: string;
    link: string;
  
    title: {
      rendered: string;
    };
  
    excerpt: {
      rendered: string;
    };
  
    content: {
      rendered: string;
    };
    featured_media: number;

_embedded?: {
  "wp:featuredmedia"?: Array<{
    source_url: string;
  }>;
};
  };
  
  const SOURCE = "valle-dei-templi";
  const CATEGORY = "Cultura";
  const CITY = "Agrigento";
  const PROVINCE = "AG";
  
  const API_URL =
  "https://www.lavalledeitempli.it/wp-json/wp/v2/posts?categories=1315&per_page=100&_embed=wp:featuredmedia&_fields=id,date,link,title,excerpt,content,featured_media,_links,_embedded";
  
  const MONTHS: Record<string, number> = {
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
  function decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, "…");
  }
  
  function stripHtml(html: string): string {
    return decodeHtmlEntities(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }
  
  function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }
  
  function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function extractVenue(html: string): string {
    const text = stripHtml(html);
  
    const match = text.match(/Luoghi?:\s*([^\n]+)/i);
  
    if (match) {
      return normalizeWhitespace(match[1]);
    }
  
    return "Valle dei Templi";
  }
  
  function extractImage(post: WordPressPost): string | null {
    return (
      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ??
      null
    );
  }
  
  function extractDateRangeOld(html: string, fallbackDate: string) {
    const text = stripHtml(html).toLowerCase();
  
    const yearMatch = text.match(/\b(20\d{2})\b/);
    const year = yearMatch
      ? Number(yearMatch[1])
      : new Date(fallbackDate).getFullYear();
  
    const rangeMatch = text.match(
      /dal[l’']?\s*(\d{1,2})\s+([a-zà]+)\s+al\s+(\d{1,2})\s+([a-zà]+)/i,
    );
  
    if (rangeMatch) {
      const startMonth = MONTHS[rangeMatch[2]];
      const endMonth = MONTHS[rangeMatch[4]];
  
      if (startMonth && endMonth) {
        return {
          startDate: toIsoDate(year, startMonth, Number(rangeMatch[1])),
          endDate: toIsoDate(year, endMonth, Number(rangeMatch[3])),
        };
      }
    }
  
    const singleMatch = text.match(
      /(\d{1,2})\s+([a-zà]+)\s+(20\d{2})/i,
    );
  
    if (singleMatch) {
      const month = MONTHS[singleMatch[2]];
  
      if (month) {
        const iso = toIsoDate(
          Number(singleMatch[3]),
          month,
          Number(singleMatch[1]),
        );
  
        return {
          startDate: iso,
          endDate: iso,
        };
      }
    }
  
    const date = fallbackDate.slice(0, 10);
  
    return {
      startDate: date,
      endDate: date,
    };
  }
  export async function importValleTempliEvents(): Promise<
  ValleTempliEvent[]
> {
  console.log("Leggo gli eventi della Valle dei Templi...");

  const response = await fetch(API_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ELPYO-Events-Importer/1.0; +https://elpyo.com)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Errore Valle dei Templi: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const posts = (await response.json()) as WordPressPost[];

  const events: ValleTempliEvent[] = [];

  for (const post of posts) {
    const dates = extractDateRange(post.content.rendered, post.date);

    events.push({
      source: SOURCE,
      sourceId: String(post.id),
      sourceUrl: post.link,

      title: normalizeWhitespace(stripHtml(post.title.rendered)),

      description: normalizeWhitespace(
        stripHtml(post.excerpt.rendered || post.content.rendered),
      ),

      category: CATEGORY,

      city: CITY,
      province: PROVINCE,

      venue: extractVenue(post.content.rendered),

      startDate: dates.startDate,
      endDate: dates.endDate,

      imageUrl: extractImage(post),
    });
  }

  events.sort((a, b) =>
    a.startDate === b.startDate
      ? a.title.localeCompare(b.title, "it")
      : a.startDate.localeCompare(b.startDate),
  );

  console.log(`Eventi Valle dei Templi trovati: ${events.length}`);

  const today = new Date();
today.setHours(0, 0, 0, 0);

return events.filter((event) => {
  const end = new Date(event.endDate);
  end.setHours(0, 0, 0, 0);

  return end >= today;
});
}

export async function importValleTempli(): Promise<void> {
  await importEventsToDatabase({
    source: "valle-dei-templi",
    organizer: "Parco Archeologico e Paesaggistico della Valle dei Templi",
    organizerUrl: "https://www.lavalledeitempli.it",
    readEvents: importValleTempliEvents,
  });
}
