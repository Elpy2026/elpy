export interface ImportedEvent {
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
  }
  
  export interface SourceConfig {
    organizer: string;
    organizerUrl: string;
  }