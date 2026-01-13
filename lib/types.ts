/**
 * Shared TypeScript types and interfaces
 */

// Base Tweet Interface
export interface Tweet {
  id: string;
  text: string;
  author: string;
  username: string;
  timestamp: string;
  likes: number;
  retweets: number;
  sentiment: 'hype' | 'backlash';
}

// Raw API Tweet Interface
export interface RawTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
  };
}

// Structured Tweet Interface (for evidence layer)
export interface StructuredTweet {
  id: string;
  text: string;
  author: string;
  username: string;
  timestamp: string;
  likes: number;
  retweets: number;
  sentiment: 'hype' | 'backlash';
}

// User Interface
export interface User {
  id: string;
  username: string;
  name: string;
}

// Sentiment Data Interface
export interface SentimentData {
  hype: number;
  backlash: number;
}

// Timeline Event Interface
export interface TimelineEvent {
  id: string;
  headline: string;
  weekOf: Date;
  hypeSummary: string;
  backlashSummary: string;
  weeklyPulse: string;
  hypeTweets?: Tweet[] | any;
  backlashTweets?: Tweet[] | any;
  communitySentiment?: SentimentData | any;
  createdAt: Date;
  updatedAt: Date;
}

// User Vote Interface
export interface UserVote {
  id: string;
  eventId: string;
  hypePercentage: number;
  backlashPercentage: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chatbot Message Interface
export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chatbot Context Data Interface
export interface ChatbotContextData {
  headline: string;
  weekOf: string;
  hypeContent: string;
  backlashContent: string;
  summary: string;
  hypeTweets?: Tweet[];
  backlashTweets?: Tweet[];
}

// API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface VoteResponse extends ApiResponse {
  communitySentiment?: SentimentData;
  totalVotes?: number;
}

export interface ChatbotResponse extends ApiResponse {
  response?: string;
}

// Content Display Types
export interface ContentDisplay {
  type: 'summary' | 'tweets';
  content: string | Tweet[];
}

export interface SplitScreenContent {
  left: ContentDisplay;
  right: ContentDisplay;
}

// Component Props Interfaces
export interface SplitScreenBattleProps {
  eventId: string;
  headline: string;
  weekOf: Date;
  hypeContent: string;
  backlashContent: string;
  summary: string;
  hypeTweets?: Tweet[];
  backlashTweets?: Tweet[];
  communitySentiment?: SentimentData;
}

export interface TimelineEventCardProps {
  event: TimelineEvent;
}

export interface TweetCardProps {
  tweet: Tweet;
  sentiment?: 'hype' | 'backlash';
}

export interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: ChatbotContextData;
}

export interface SentimentGaugeProps {
  userSentiment: SentimentData;
  communitySentiment: SentimentData;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// API Configuration Types
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Event Handler Types
export type MouseEventHandler = (e: MouseEvent) => void;
export type KeyboardEventHandler = (e: KeyboardEvent) => void;
export type FormEventHandler = (e: React.FormEvent) => void;
export type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

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
