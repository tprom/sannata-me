import type { SkillContext } from "./SkillContextTypes";

export interface GenerateStampPromptInput {
  analysis: {
    character: string;
    tone: string;
    atmosphere: string;
    visual: string[];
    historicalWeight: string;
    risks: string[];
  };
  context?: SkillContext;
}

export interface GenerateStampPromptOutput {
  stampPrompt: string;
}

export interface GenerateStampPromptError {
  code: "prompt_generation_failed";
  message?: string;
}
