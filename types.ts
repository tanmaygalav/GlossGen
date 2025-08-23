
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
