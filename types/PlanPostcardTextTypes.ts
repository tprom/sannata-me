import type { SkillContext } from "./SkillContextTypes";

export interface PlanPostcardTextInput {
  analysis: {
    character: string;
    tone: string;
    atmosphere: string;
    visual: string[];
    historicalWeight: string;
    risks: string[];
  };
  blocks: {
    passport: string;
    history: string;
    meaning?: string;
    legends?: string;
    visual: string;
    sensory: string;
    touristExperience?: string;
  };
  style: {
    narrativeType: string;
    emotionalIntensity: string;
    rhythm: string;
    voice: string;
    constraints: string[];
  };
  context?: SkillContext;
}

export interface PlanPostcardTextOutput {
  outline: Array<{
    id: number;
    topic: string;
    length: "short" | "medium" | "long";
  }>;
}

export interface PlanPostcardTextError {
  code: "planning_failed";
  message?: string;
}
