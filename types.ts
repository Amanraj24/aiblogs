export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  keywords: string[];
  category: string;
  dateCreated: string;
  status: 'draft' | 'published' | 'scheduled';
  readTime: string;
  coverImage?: string;
  scheduledDate?: string; // ISO string for scheduled time

  // New Fields for Geo/SEO/AEO
  geoTargeting?: string; // e.g., "US", "Global", "NYC"
  aeoQuestions?: { question: string, answer: string }[]; // Q&A for Answer Engine Optimization
  seoScore?: number; // 0-100
}

export interface GeneratedTopic {
  topic: string;
  relevance: string;
  // Enriched with full post content for suggestions
  content?: string;
  excerpt?: string;
  keywords?: string[];
  category?: string;
  readTime?: string;
  coverImage?: string;
  geoTargeting?: string;
  aeoQuestions?: { question: string, answer: string }[];
  seoScore?: number;
}

export interface NicheSchedule {
  id: string;
  niche: string;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string; // ISO string YYYY-MM-DD
  launchTime: string; // HH:mm format
  suggestionCount?: number;
}

export interface TrainingModule {
  id: string;
  topic: string;
  learningObjectives: string[];
  keyConcepts: string;
  caseStudy: string;
  actionableTakeaways: string[];
}

export type ViewState = 'dashboard' | 'generator' | 'editor' | 'reader' | 'settings' | 'training' | 'storage';

export interface GenerationParams {
  niche: string;
  tone: string;
  trainingContext?: string; // Additional context from Training Hub
}

export interface TrainingData {
  id: string;
  title: string;
  content: string; // The "training" text (style guide, fact sheet, etc.)
  type: 'style' | 'knowledge' | 'example';
  dateAdded: string;
}

export interface ScheduledSlot {
  id: string;
  scheduleId: string;
  niche: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending_selection' | 'ready' | 'published';
  suggestedTopics: GeneratedTopic[]; // List of 3-5 suggestions
  selectedTopic?: GeneratedTopic; // The chosen one
}