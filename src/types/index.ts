
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

export interface Badge {
    id: 'POLYGLOT' | 'STAR_GAZER' | 'COMMIT_MACHINE' | 'PERFECT_README' | 'COMMUNITY_BUILDER' | 'TOP_10_PERCENT';
    name: string;
    description: string;
    earned: boolean;
}

export interface RepoInfo {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    url: string;
    pitch: string;
    qualityScore: number;
}

export interface LanguageDistribution {
    [language: string]: number;
}

export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ProfileAnalysisResult {
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
    profileSummary: string;
    starRating: number;
    mainExpertise: string[];
    healthScore: number;
    badges: Badge[];
    suggestions: string[];
    contributionData: ContributionDay[];
}