import type { ContentMode, PersonaProfile } from "./PersonaTypes";
import type { SkillContext } from "./SkillContextTypes";

export interface SelectNarrativeStyleInput {
  analysis: {
    character: string;
    tone: string;
    atmosphere: string;
    visual: string[];
    historicalWeight: string;
    risks: string[];
  };
  language: "ru";
  profile?: PersonaProfile;
  contentMode?: ContentMode;
  context?: SkillContext;
}

export interface SelectNarrativeStyleOutput {
  style: {
    narrativeType: string;
    emotionalIntensity: string;
    rhythm: string;
    voice: string;
    constraints: string[];
  };
}

export interface SelectNarrativeStyleError {
  code: "style_selection_failed";
  message?: string;
}
