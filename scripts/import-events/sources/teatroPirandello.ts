export type TeatroPirandelloEvent = {
    source: "teatro-pirandello";
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
    content: { rendered: string; protected: boolean };
    excerpt: { rendered: string; protected: boolean };
    _embedded?: {
      "wp:featuredmedia"?: Array<{ source_url?: string }>;
    };
  };
  
  type ParsedDateRange = {
    startDate: string;
    endDate: string;
  };
  
  type SeasonYears = {
    startYear: number;
    endYear: number;
  };
  
  const API_URL =
    "https://fondazioneteatropirandello.it/wp-json/wp/v2/posts?per_page=50&_embed=1&_fields=id,date,link,title,excerpt,content,_embedded";
  
  const SOURCE = "teatro-pirandello" as const;
  const CATEGORY = "Teatro e spettacoli";
  const CITY = "Agrigento";
  const PROVINCE = "AG";
  const VENUE = "Teatro Luigi Pirandello";
  
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
  
  const MONTH_PATTERN =
    "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";
  
  const WEEKDAY_PATTERN =
    "luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica";
  
  function decodeHtmlEntities(value: string): string {
    const namedEntities: Record<string, string> = {
      "&amp;": "&",
      "&quot;": '"',
      "&apos;": "'",
      "&nbsp;": " ",
      "&hellip;": "…",
      "&ndash;": "–",
      "&mdash;": "—",
      "&laquo;": "«",
      "&raquo;": "»",
    };
  
    let decoded = value.replace(
      /&(amp|quot|apos|nbsp|hellip|ndash|mdash|laquo|raquo);/gi,
      (entity) => namedEntities[entity.toLowerCase()] ?? entity,
    );
  
    decoded = decoded.replace(/&#(\d+);/g, (_match, code: string) => {
      const valueAsNumber = Number(code);
      return Number.isFinite(valueAsNumber)
        ? String.fromCodePoint(valueAsNumber)
        : _match;
    });
  
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => {
      const valueAsNumber = Number.parseInt(code, 16);
      return Number.isFinite(valueAsNumber)
        ? String.fromCodePoint(valueAsNumber)
        : _match;
    });
  
    return decoded;
  }
  
  function normalizeWhitespace(value: string): string {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .trim();
  }
  
  function stripHtml(value: string): string {
    return normalizeWhitespace(
      decodeHtmlEntities(
        value
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " "),
      ),
    );
  }
  
  function htmlToLines(value: string): string[] {
    const withBreaks = value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|blockquote|section|article)>/gi, "\n")
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6|li|blockquote|section|article)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
  
    return decodeHtmlEntities(withBreaks)
      .split(/\r?\n/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);
  }
  
  function toIsoDate(year: number, month: number, day: number): string {
    return [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }
  
  function isValidDate(year: number, month: number, day: number): boolean {
    const date = new Date(Date.UTC(year, month - 1, day));
  
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }
  
  function resolveYear(
    month: number,
    explicitYear: number | null,
    years: SeasonYears,
  ): number {
    if (explicitYear) {
      return explicitYear;
    }
  
    return month >= 7 ? years.startYear : years.endYear;
  }
  
  function extractSeasonYears(text: string, publicationYear: number): SeasonYears {
    const seasonMatch = text.match(
      /(?:stagione\s*)?(\d{4})\s*[\/–—-]\s*(\d{2,4})/i,
    );
  
    if (!seasonMatch) {
      return {
        startYear: publicationYear,
        endYear: publicationYear + 1,
      };
    }
    const startYear = Number(seasonMatch[1]);
    let endYear = Number(seasonMatch[2]);
    
    if (endYear < 100) {
      endYear = Math.floor(startYear / 100) * 100 + endYear;
    }
    
    return {
      startYear,
      endYear,
    };
    }
  function parseDateLine(
    line: string,
    years: SeasonYears,
  ): ParsedDateRange | null {
    const normalized = normalizeWhitespace(line)
      .toLowerCase()
      .replace(/[‐‑‒–—]/g, "-");
  
    const sameMonthRange = normalized.match(
      new RegExp(
        `^(?:(?:${WEEKDAY_PATTERN})\\s+)?(\\d{1,2})\\s*(?:-|e|ed|al)\\s*(?:(?:${WEEKDAY_PATTERN})\\s+)?(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
        "i",
      ),
    );
  
    if (sameMonthRange) {
      const startDay = Number(sameMonthRange[1]);
      const endDay = Number(sameMonthRange[2]);
      const month = MONTHS[sameMonthRange[3].toLowerCase()];
      const explicitYear = sameMonthRange[4] ? Number(sameMonthRange[4]) : null;
      const year = resolveYear(month, explicitYear, years);
  
      if (
        isValidDate(year, month, startDay) &&
        isValidDate(year, month, endDay)
      ) {
        return {
          startDate: toIsoDate(year, month, startDay),
          endDate: toIsoDate(year, month, endDay),
        };
      }
    }
  
    const repeatedMonthRange = normalized.match(
      new RegExp(
        `^(?:(?:${WEEKDAY_PATTERN})\\s+)?(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\s*(?:-|e|ed|al)\\s*(?:(?:${WEEKDAY_PATTERN})\\s+)?(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
        "i",
      ),
    );
  
    if (repeatedMonthRange) {
      const startDay = Number(repeatedMonthRange[1]);
      const startMonth = MONTHS[repeatedMonthRange[2].toLowerCase()];
      const startExplicitYear = repeatedMonthRange[3]
        ? Number(repeatedMonthRange[3])
        : null;
  
      const endDay = Number(repeatedMonthRange[4]);
      const endMonth = MONTHS[repeatedMonthRange[5].toLowerCase()];
      const endExplicitYear = repeatedMonthRange[6]
        ? Number(repeatedMonthRange[6])
        : null;
  
      const startYear = resolveYear(startMonth, startExplicitYear, years);
      let endYear = resolveYear(endMonth, endExplicitYear, years);
  
      if (!endExplicitYear && endMonth < startMonth && startYear === endYear) {
        endYear += 1;
      }
  
      if (
        isValidDate(startYear, startMonth, startDay) &&
        isValidDate(endYear, endMonth, endDay)
      ) {
        return {
          startDate: toIsoDate(startYear, startMonth, startDay),
          endDate: toIsoDate(endYear, endMonth, endDay),
        };
      }
    }
  
    const weekdaySeparatedRange = normalized.match(
      new RegExp(
        `^(?:${WEEKDAY_PATTERN})\\s+(\\d{1,2})\\s+(?:${WEEKDAY_PATTERN})\\s+(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
        "i",
      ),
    );
  
    if (weekdaySeparatedRange) {
      const startDay = Number(weekdaySeparatedRange[1]);
      const endDay = Number(weekdaySeparatedRange[2]);
      const month = MONTHS[weekdaySeparatedRange[3].toLowerCase()];
      const explicitYear = weekdaySeparatedRange[4]
        ? Number(weekdaySeparatedRange[4])
        : null;
      const year = resolveYear(month, explicitYear, years);
  
      if (
        isValidDate(year, month, startDay) &&
        isValidDate(year, month, endDay)
      ) {
        return {
          startDate: toIsoDate(year, month, startDay),
          endDate: toIsoDate(year, month, endDay),
        };
      }
    }
  
    const singleDate = normalized.match(
      new RegExp(
        `^(?:(?:${WEEKDAY_PATTERN})\\s+)?(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
        "i",
      ),
    );
  
    if (singleDate) {
      const day = Number(singleDate[1]);
      const month = MONTHS[singleDate[2].toLowerCase()];
      const explicitYear = singleDate[3] ? Number(singleDate[3]) : null;
      const year = resolveYear(month, explicitYear, years);
  
      if (isValidDate(year, month, day)) {
        const date = toIsoDate(year, month, day);
        return { startDate: date, endDate: date };
      }
    }
  
    return null;
  }
  
  function containsDate(text: string): boolean {
    return new RegExp(`\\b\\d{1,2}\\s+(?:${MONTH_PATTERN})\\b`, "i").test(text);
  }
  
  function isSeasonPost(title: string, content: string): boolean {
    const combined = `${title} ${content}`.toLowerCase();
    const hasSeason = /\bstagione\s+20\d{2}\s*[\/–—-]\s*\d{2,4}\b/i.test(combined);
    const hasProgrammeSignals =
      combined.includes("crediti completi") ||
      combined.includes("cartellone") ||
      combined.includes("direzione artistica");
  
    return hasSeason && hasProgrammeSignals;
  }
  
  function isExcludedNews(title: string, text: string): boolean {
    const excludedPhrases = [
      "nuovo direttore",
      "direttore generale",
      "avviso pubblico",
      "manifestazione di interesse",
      "comunicato stampa",
      "campagna abbonamenti",
"abbonamenti",
"prelazione",
"botteghino",
"conferenza stampa",
"bando",
"convocazione",
"assemblea",
"verbale",
"affidamento",
      "applausi",
      "pubblico resta",
      "conquista il teatro",
      "incanta il teatro",
      "in un libro",
      "ha preso parte",
      "selezionati i testi",
      "scelti i testi",
      "intervista",
      "bilancio",
      "nomina",
      "governance",
    ];
  
    const combined = `${title} ${text}`.toLowerCase();
    return excludedPhrases.some((phrase) => combined.includes(phrase));
  }
  
  function isLikelyTitle(line: string): boolean {
    const cleaned = normalizeWhitespace(line);
  
    if (cleaned.length < 2 || cleaned.length > 160) {
      return false;
    }
  
    const lower = cleaned.toLowerCase();
  
    const excludedStarts = [
      "di ",
      "da ",
      "con ",
      "regia ",
      "produzione ",
      "scene ",
      "costumi ",
      "musiche ",
      "luci ",
      "traduzione ",
      "soprano ",
      "pianoforte ",
      "violoncellisti ",
      "aiuto regia ",
      "regista assistente ",
      "tratto dal ",
      "liberamente ispirato ",
      "direzione artistica",
      "stagione ",
      "agrigento ",
      "presenta",
    ];
  
    if (excludedStarts.some((prefix) => lower.startsWith(prefix))) {
      return false;
    }
  
    if (
      lower.includes("crediti completi") ||
      lower.includes("passato vivo futuro in scena")
    ) {
      return false;
    }
  
    const letters = cleaned.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g)?.length ?? 0;
    return letters >= 2;
  }
  
  function normalizeTitle(value: string): string {
    return normalizeWhitespace(value)
      .replace(/^[\"“”«»']+|[\"“”«»']+$/g, "")
      .replace(/\s*[-–—]\s*$/g, "")
      .trim();
  }
  
  function slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }
  
  function limitDescription(value: string, maxLength = 700): string {
    const normalized = normalizeWhitespace(value);
  
    if (normalized.length <= maxLength) {
      return normalized;
    }
  
    return `${normalized.slice(0, maxLength).trim()}…`;
  }
  
  function getFeaturedImage(post: WordPressPost): string | null {
    return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
  }
  
  function findSeasonSection(lines: string[]): string[] {
    const startCandidates = lines
      .map((line, index) => ({ line: line.toLowerCase(), index }))
      .filter(({ line }) => line.includes("stagione") && line.includes("crediti"));
  
    const startIndex =
      startCandidates.at(-1)?.index ??
      lines.findIndex((line) =>
        /\bstagione\s+20\d{2}\s*[\/–—-]\s*\d{2,4}\b/i.test(line),
      );
  
    const safeStartIndex = startIndex >= 0 ? startIndex + 1 : 0;
  
    const endIndex = lines.findIndex(
      (line, index) =>
        index > safeStartIndex &&
        /^(roberta torre nasce|il direttore artistico|biografia)/i.test(line),
    );
  
    return lines.slice(
      safeStartIndex,
      endIndex > safeStartIndex ? endIndex : lines.length,
    );
  }
  
  function buildSeasonDescription(
    lines: string[],
    dateLineIndex: number,
    nextEventTitleIndex: number,
  ): string {
    const descriptionLines = lines
      .slice(dateLineIndex + 1, nextEventTitleIndex)
      .filter((line) => !containsDate(line))
      .filter((line) => !/^stagione\s+/i.test(line))
      .filter((line) => !/^crediti completi$/i.test(line));
  
    return limitDescription(descriptionLines.join(" "));
  }
  
  function parseSeasonPost(post: WordPressPost): TeatroPirandelloEvent[] {
    const postTitle = stripHtml(post.title.rendered);
    const lines = findSeasonSection(htmlToLines(post.content.rendered));
    const publicationYear = new Date(post.date).getFullYear();
    const years = extractSeasonYears(
      `${postTitle} ${stripHtml(post.content.rendered)}`,
      publicationYear,
    );
    const imageUrl = getFeaturedImage(post);
  
    const candidates: Array<{
      titleIndex: number;
      dateLineIndex: number;
      title: string;
      dates: ParsedDateRange;
    }> = [];
  
    for (let dateLineIndex = 0; dateLineIndex < lines.length; dateLineIndex += 1) {
      const dates = parseDateLine(lines[dateLineIndex], years);
  
      if (!dates) {
        continue;
      }
  
      let titleIndex = dateLineIndex - 1;
  
      while (titleIndex >= 0 && !isLikelyTitle(lines[titleIndex])) {
        titleIndex -= 1;
      }
  
      if (titleIndex < 0) {
        continue;
      }
  
      const title = normalizeTitle(lines[titleIndex]);
      if (
        /in definizione/i.test(title) ||
        /da definire/i.test(title) ||
        /coming soon/i.test(title)
      ) {
        continue;
      }
  
      if (!title) {
        continue;
      }
  
      candidates.push({
        titleIndex,
        dateLineIndex,
        title,
        dates,
      });
    }
  
    const events = candidates.map((candidate, index) => {
      const nextCandidate = candidates[index + 1];
      const nextEventTitleIndex = nextCandidate?.titleIndex ?? lines.length;
      const description =
        buildSeasonDescription(
          lines,
          candidate.dateLineIndex,
          nextEventTitleIndex,
        ) ||
        `Spettacolo della stagione teatrale ${years.startYear}/${years.endYear} del Teatro Luigi Pirandello.`;
  
      return {
        source: SOURCE,
        sourceId: `${post.id}:${slugify(candidate.title)}:${candidate.dates.startDate}`,
        sourceUrl: post.link,
        title: candidate.title,
        description,
        category: CATEGORY,
        city: CITY,
        province: PROVINCE,
        venue: VENUE,
        startDate: candidate.dates.startDate,
        endDate: candidate.dates.endDate,
        imageUrl,
      };
    });
  
    return deduplicateEvents(events);
  }
  
  function extractDateFromText(
    text: string,
    publicationYear: number,
  ): ParsedDateRange | null {
    const years: SeasonYears = {

  startYear: publicationYear,

  endYear: publicationYear,

};
    const lines = htmlToLines(text);
  
    for (const line of lines) {
      const parsed = parseDateLine(line, years);
  
      if (parsed) {
        return parsed;
      }
    }
  
    const flattened = stripHtml(text);
    const dateFragment = flattened.match(
      new RegExp(
        `(?:(?:${WEEKDAY_PATTERN})\\s+)?\\d{1,2}(?:\\s*(?:-|e|ed|al)\\s*(?:(?:${WEEKDAY_PATTERN})\\s+)?\\d{1,2})?\\s+(?:${MONTH_PATTERN})(?:\\s+\\d{4})?`,
        "i",
      ),
    );
  
    return dateFragment ? parseDateLine(dateFragment[0], years) : null;
  }
  
  function isRealStandaloneEvent(
    title: string,
    text: string,
    dates: ParsedDateRange | null,
  ): boolean {
    if (!dates || isExcludedNews(title, text)) {
      return false;
    }
  
    const eventPhrases = [
      "in scena",
      "spettacolo",
      "concerto",
      "festival",
      "rassegna",
      "appuntamento",
      "ore ",
      "ingresso",
      "biglietti",
      "presentazione",
      "proiezione",
      "prima edizione",
    ];
  
    const combined = `${title} ${text}`.toLowerCase();
    return eventPhrases.some((phrase) => combined.includes(phrase));
  }
  
  function parseStandalonePost(
    post: WordPressPost,
  ): TeatroPirandelloEvent | null {
    const title = stripHtml(post.title.rendered);
    const fullText = `${post.title.rendered}\n${post.excerpt.rendered}\n${post.content.rendered}`;
    const plainText = stripHtml(fullText);
    const lowerContent = plainText.toLowerCase();

if (
  lowerContent.includes("sold out") ||
  lowerContent.includes("ha incantato") ||
  lowerContent.includes("ha conquistato") ||
  lowerContent.includes("si è concluso") ||
  lowerContent.includes("grande successo") ||
  lowerContent.includes("successo delle precedenti stagioni") ||
  lowerContent.includes("due repliche") ||
  lowerContent.includes("applausi del pubblico")
) {
  return null;
}
    const publicationYear = new Date(post.date).getFullYear();
    const dates = extractDateFromText(fullText, publicationYear);
    if (
      dates &&
      (
        title.toLowerCase().startsWith("chiude la stagione") ||
        title.toLowerCase().includes("torna al teatro pirandello")
      )
    ) {
      return null;
    }
  
    if (!isRealStandaloneEvent(title, plainText, dates)) {
      return null;
    }
  
    const description = limitDescription(
      stripHtml(post.excerpt.rendered || post.content.rendered),
    );
  
    return {
      source: SOURCE,
      sourceId: String(post.id),
      sourceUrl: post.link,
      title,
      description,
      category: CATEGORY,
      city: CITY,
      province: PROVINCE,
      venue: VENUE,
      startDate: dates.startDate,
      endDate: dates.endDate,
      imageUrl: getFeaturedImage(post),
    };
  }
  
  function deduplicateEvents(
    events: TeatroPirandelloEvent[],
  ): TeatroPirandelloEvent[] {
    const byKey = new Map<string, TeatroPirandelloEvent>();
  
    for (const event of events) {
      const key = [
        slugify(event.title),
        event.startDate,
        event.venue.toLowerCase(),
      ].join("|");
  
      const existing = byKey.get(key);
  
      if (!existing || event.description.length > existing.description.length) {
        byKey.set(key, event);
      }
    }
  
    return [...byKey.values()];
  }
  
  export async function importTeatroPirandelloEvents(): Promise<
    TeatroPirandelloEvent[]
  > {
    console.log("Leggo gli eventi del Teatro Pirandello...");
  
    const response = await fetch(API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ELPYO-Events-Importer/1.0; +https://elpyo.com)",
        Accept: "application/json",
      },
    });
  
    if (!response.ok) {
      throw new Error(
        `Errore Teatro Pirandello: HTTP ${response.status} ${response.statusText}`,
      );
    }
  
    const posts = (await response.json()) as WordPressPost[];
    const seasonEvents: TeatroPirandelloEvent[] = [];
    const standaloneEvents: TeatroPirandelloEvent[] = [];
  
    for (const post of posts) {
      const title = stripHtml(post.title.rendered);
      const content = stripHtml(post.content.rendered);
  
      if (isSeasonPost(title, content)) {
        const parsedSeasonEvents = parseSeasonPost(post);
  
        console.log(
          `Cartellone trovato: "${title}" → ${parsedSeasonEvents.length} spettacoli`,
        );
  
        seasonEvents.push(...parsedSeasonEvents);
        continue;
      }
  
      const standaloneEvent = parseStandalonePost(post);
  
      if (standaloneEvent) {
        standaloneEvents.push(standaloneEvent);
      }
    }
  
    const events = deduplicateEvents([
      ...seasonEvents,
      ...standaloneEvents,
    ]).sort((a, b) => {
      const dateComparison = a.startDate.localeCompare(b.startDate);
  
      return dateComparison !== 0
        ? dateComparison
        : a.title.localeCompare(b.title, "it");
    });
  
    console.log(
      `Eventi Teatro Pirandello trovati: ${events.length} (${seasonEvents.length} dal cartellone, ${standaloneEvents.length} da articoli singoli)`,
    );
  
    return events;
  }
  