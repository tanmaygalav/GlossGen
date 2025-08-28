
export enum GlossaryItemType {
  Function = 'Function',
  Class = 'Class',
  Variable = 'Variable',
}

export interface GlossaryItem {
  name: string;
  type: GlossaryItemType;
  path: string;
}

export interface AnalysisResult {
  repoName: string;
  items: GlossaryItem[];
  techStack: string[];
  fileStructureSummary: string;
  commitCount: number;
  starRating: number;
}

// --- NEW & UPDATED TYPES FOR GAMIFICATION & ENHANCED UI ---

export interface Badge {
    id: 'POLYGLOT' | 'STAR_GAZER' | 'COMMIT_MACHINE' | 'PERFECT_README' | 'COMMUNITY_BUILDER' | 'TOP_10_PERCENT';
    name: string;
    description: string;
    earned: boolean;
}

// Types for Profile Analysis
export interface RepoInfo {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    url: string;
    // New AI-powered fields
    pitch: string;
    qualityScore: number; // A score from 1-100
}

export interface LanguageDistribution {
    [language: string]: number;
}

export interface ProfileAnalysisResult {
    // From GitHub API
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: number;
    following: number;
    publicRepoCount: number;
    totalStars: number;
    createdAt: string;
    topRepos: RepoInfo[];
    languageDistribution: LanguageDistribution;
    
    // From Gemini API (enhanced)
    profileSummary: string;
    starRating: number;
    mainExpertise: string[];
    // Gamification Layer
    healthScore: number; // 0-100
    badges: Badge[];
    suggestions: string[]; // Actionable tips for improvement
}