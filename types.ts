
export enum BloomLevel {
  Remember = 'Remember',
  Understand = 'Understand',
  Apply = 'Apply',
  Analyse = 'Analyse'
}

export interface Word {
  term: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  // Changed: multiple examples, each with a highlighted collocation
  examples: string[]; 
  // Removed: explicit collocations array as they are now integrated into examples
  termVi?: string;
  meaningVi?: string;
  examplesVi?: string[]; // Translations for multiple examples
}

export interface WordPoolItem {
  term: string;
  category: string;
}

export interface VocabResponse {
  topic: string;
  words: Word[];
}

export interface MatchingPair {
  id: string;
  questionText: string;
  questionTextVi?: string;
  correctAnswer: string;
}

export interface Question {
  id: string;
  wordTerm?: string; 
  level: BloomLevel;
  questionText: string;
  questionTextVi?: string;
  
  // Options for levels Remember, Understand, Analyse
  options?: string[]; 
  optionsVi?: string[];
  correctOption?: string; 
  
  // Level 3 (Apply) Matching
  matchingPairs?: MatchingPair[];
  
  explanation?: string;
  explanationVi?: string;
}

export interface AppConfig {
  level: string;
  topic: string;
  targetWords: string;
  numWords: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[] | Record<string, string>; 
  isCorrect?: boolean;
}

export interface SRSItem {
  term: string;
  interval: number;
  nextReviewDate: number;
  easeFactor: number;
}

export type AppState = 'setup' | 'loading_pool' | 'selecting_words' | 'loading_vocab' | 'learning' | 'loading_test' | 'testing' | 'results';
