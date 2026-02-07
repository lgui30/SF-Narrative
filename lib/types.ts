/**
 * Shared TypeScript types and interfaces
 */

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Weekly News Types
export interface NewsArticle {
  title: string;
  url: string;
  snippet: string;
  publishedDate: string;
  source: string;
  neighborhoods?: string[]; // SF neighborhoods mentioned in article (extracted via LLM)
}

export interface CategoryNews {
  category: 'tech' | 'politics' | 'economy' | 'sf-local';
  summaryShort: string; // for card view (single paragraph)
  summaryDetailed: string; // for expanded view (detailed narrative)
  bullets: string[]; // 5-7 key bullet points
  sources: NewsArticle[]; // source articles
  keywords: string[]; // 3-5 keywords for timeline
}

export interface WeeklyNews {
  id: string;
  weekOf: Date;
  tech: CategoryNews;
  politics: CategoryNews;
  economy: CategoryNews;
  sfLocal: CategoryNews;
  weeklyKeywords: string[]; // aggregated keywords from all categories
  createdAt: Date;
  updatedAt: Date;
}
