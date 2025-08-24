
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

// Types for Profile Analysis
export interface RepoInfo {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    url: string;
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
    
    // From Gemini API
    profileSummary: string;
    starRating: number;
    mainExpertise: string[];
}
