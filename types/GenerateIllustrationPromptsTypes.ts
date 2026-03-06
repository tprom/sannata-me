import type { SkillContext } from "./SkillContextTypes";

export interface GenerateIllustrationPromptsInput {
  contentFile: string;
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

export interface GenerateIllustrationPromptsOutput {
  prompts: Array<{
    paragraphId: number;
    prompt: string;
  }>;
}

export interface GenerateIllustrationPromptsError {
  code: "prompt_generation_failed";
  message?: string;
}
