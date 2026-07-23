export type ValleTempliEvent = {
    source: "valle-dei-templi";
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
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
  };
  
  const API_URL =
    "https://www.lavalledeitempli.it/wp-json/wp/v2/posts?categories=1315&per_page=100&_fields=id,date,link,title,excerpt,content";
  
  const SOURCE = "valle-dei-templi" as const;
  const CATEGORY = "Mostre e cultura";
  const CITY = "Agrigento";
  const PROVINCE = "AG";
  
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
  
  function decodeHtmlEntities(value: string): string {
    return value
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8211;/g, "–")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&hellip;/g, "…")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, code) =>
        String.fromCodePoint(Number(code)),
      );
  }
  
  function normalize(value: string): string {
    return decodeHtmlEntities(
      value
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  
  function slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  
  function isoDate(
    year: number,
    month: number,
    day: number,
  ): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0",
    )}`;
  }
  function extractVenue(text: string): string {
    const match = text.match(
      /Luoghi?:\s*([\s\S]*?)(?:Informazioni utili|Prenota|$)/i,
    );
  
    if (!match) {
      return "Valle dei Templi";
    }
  
    return normalize(match[1]).replace(/\s+/g, " ").trim();
  }
  
  function extractImage(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }
  
  function extractDateRange(
    text: string,
    publicationDate: string,
  ): { startDate: string; endDate: string } {
  
    const publicationYear = new Date(publicationDate).getFullYear();
  
    const months =
      "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";
  
    const range = text.match(
      new RegExp(
        `dal\\s+(\\d{1,2})\\s+(${months})\\s+al\\s+(\\d{1,2})\\s+(${months})(?:\\s+(\\d{4}))?`,
        "i",
      ),
    );
  
    if (range) {
      const startDay = Number(range[1]);
      const startMonth = MONTHS[range[2].toLowerCase()];
      const endDay = Number(range[3]);
      const endMonth = MONTHS[range[4].toLowerCase()];
      const year = range[5]
        ? Number(range[5])
        : publicationYear;
  
      return {
        startDate: isoDate(year, startMonth, startDay),
        endDate: isoDate(year, endMonth, endDay),
      };
    }
  
    const single = text.match(
      new RegExp(
        `(\\d{1,2})\\s+(${months})(?:\\s+(\\d{4}))?`,
        "i",
      ),
    );
  
    if (single) {
      const day = Number(single[1]);
      const month = MONTHS[single[2].toLowerCase()];
      const year = single[3]
        ? Number(single[3])
        : publicationYear;
  
      const date = isoDate(year, month, day);
  
      return {
        startDate: date,
        endDate: date,
      };
    }
  
    const fallback = publicationDate.slice(0, 10);
  
    return {
      startDate: fallback,
      endDate: fallback,
    };
  }
  function extractVenue(text: string): string {
    const match = text.match(
      /Luoghi?:\s*([\s\S]*?)(?:Informazioni utili|Prenota|$)/i,
    );
  
    if (!match) {
      return "Valle dei Templi";
    }
  
    return normalize(match[1]).replace(/\s+/g, " ").trim();
  }
  
  function extractImage(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }
  
  function extractDateRange(
    text: string,
    publicationDate: string,
  ): { startDate: string; endDate: string } {
  
    const publicationYear = new Date(publicationDate).getFullYear();
  
    const months =
      "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";
  
    const range = text.match(
      new RegExp(
        `dal\\s+(\\d{1,2})\\s+(${months})\\s+al\\s+(\\d{1,2})\\s+(${months})(?:\\s+(\\d{4}))?`,
        "i",
      ),
    );
  
    if (range) {
      const startDay = Number(range[1]);
      const startMonth = MONTHS[range[2].toLowerCase()];
      const endDay = Number(range[3]);
      const endMonth = MONTHS[range[4].toLowerCase()];
      const year = range[5]
        ? Number(range[5])
        : publicationYear;
  
      return {
        startDate: isoDate(year, startMonth, startDay),
        endDate: isoDate(year, endMonth, endDay),
      };
    }
  
    const single = text.match(
      new RegExp(
        `(\\d{1,2})\\s+(${months})(?:\\s+(\\d{4}))?`,
        "i",
      ),
    );
  
    if (single) {
      const day = Number(single[1]);
      const month = MONTHS[single[2].toLowerCase()];
      const year = single[3]
        ? Number(single[3])
        : publicationYear;
  
      const date = isoDate(year, month, day);
  
      return {
        startDate: date,
        endDate: date,
      };
    }
  
    const fallback = publicationDate.slice(0, 10);
  
    return {
      startDate: fallback,
      endDate: fallback,
    };
  }
  export async function importValleTempli(): Promise<ValleTempliEvent[]> {
    console.log("🏛️ Import Valle dei Templi...");
  
    const response = await fetch(API_URL);
  
    if (!response.ok) {
      throw new Error(
        `Errore durante il download degli eventi (${response.status})`,
      );
    }
  
    const posts = (await response.json()) as WordPressPost[];
  
    const events: ValleTempliEvent[] = [];
  
    for (const post of posts) {
      const title = normalize(post.title.rendered);
      const description = normalize(post.content.rendered);
  
      const { startDate, endDate } = extractDateRange(
        description,
        post.date,
      );
  
      const venue = extractVenue(post.content.rendered);
  
      const imageUrl = extractImage(post.content.rendered);
  
      events.push({
        source: SOURCE,
        sourceId: `${post.id}-${slugify(title)}`,
        sourceUrl: post.link,
        title,
        description,
        category: CATEGORY,
        city: CITY,
        province: PROVINCE,
        venue,
        startDate,
        endDate,
        imageUrl,
      });
    }
  
    console.log(`✅ Importati ${events.length} eventi Valle dei Templi`);
  
    return events.sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  }