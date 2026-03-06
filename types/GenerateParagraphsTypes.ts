import type { SkillContext } from "./SkillContextTypes";

export interface GenerateParagraphsInput {
  outline: Array<{
    id: number;
    topic: string;
    length: "short" | "medium" | "long";
  }>;
  blocks: {
    passport: string;
    history: string;
    meaning?: string;
    legends?: string;
    visual: string;
    sensory: string;
    touristExperience?: string;
  };
  analysis: {
    character: string;
    tone: string;
    atmosphere: string;
    visual: string[];
    historicalWeight: string;
    risks: string[];
  };
  style: {
    narrativeType: string;
    emotionalIntensity: string;
    rhythm: string;
    voice: string;
    constraints: string[];
  };
  language: "ru";
  context?: SkillContext;
}

export interface GenerateParagraphsOutput {
  contentFile: string;
}

export interface GenerateParagraphsError {
  code: "generation_failed";
  message?: string;
}
