import type { SkillContext } from "./SkillContextTypes";

export interface AnalyzeLandmarkDataInput {
  data: unknown;
  language: "ru";
  context?: SkillContext;
}

export interface AnalyzeLandmarkDataOutput {
  analysis: {
    character: string;
    tone: string;
    atmosphere: string;
    visual: string[];
    historicalWeight: string;
    risks: string[];
  };
}

export interface AnalyzeLandmarkDataError {
  code: "analysis_failed";
  message?: string;
}
