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
  
  function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  
  function stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  export function extractDateRange(html: string, fallbackDate: string) {
    const text = stripHtml(html).toLowerCase();
  
    const yearMatch = text.match(/\b(20\d{2})\b/);
  
    const year = yearMatch
      ? Number(yearMatch[1])
      : new Date(fallbackDate).getFullYear();
  
    // 7–15 marzo 2026
    // 7-15 marzo 2026
    const compactRange = text.match(
      /(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(20\d{2})/i,
    );
  
    if (compactRange) {
      const month = MONTHS[compactRange[3]];
  
      return {
        startDate: toIsoDate(
          Number(compactRange[4]),
          month,
          Number(compactRange[1]),
        ),
        endDate: toIsoDate(
          Number(compactRange[4]),
          month,
          Number(compactRange[2]),
        ),
      };
    }
    const fullRange = text.match(
        /dal[l'’]?\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+((?:20)?\d{2})?\s*al\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+((?:20)?\d{2})?/i,
      );
    
      if (fullRange) {
        const startMonth = MONTHS[fullRange[2]];
        const endMonth = MONTHS[fullRange[5]];
    
        let startYear = fullRange[3]
          ? Number(fullRange[3].length === 2 ? `20${fullRange[3]}` : fullRange[3])
          : year;
    
        let endYear = fullRange[6]
          ? Number(fullRange[6].length === 2 ? `20${fullRange[6]}` : fullRange[6])
          : startYear;
    
        if (!fullRange[6] && endMonth < startMonth) {
          endYear++;
        }
    
        return {
          startDate: toIsoDate(
            startYear,
            startMonth,
            Number(fullRange[1]),
          ),
          endDate: toIsoDate(
            endYear,
            endMonth,
            Number(fullRange[4]),
          ),
        };
      }
    return {
      startDate: fallbackDate.slice(0, 10),
      endDate: fallbackDate.slice(0, 10),
    };
  }