import type { SkillContext } from "./SkillContextTypes";

export interface GenerateGalleryPromptsInput {
  visual: {
    exterior?: string[];
    interior?: string[];
    details?: string[];
    environment?: string[];
  };
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

export interface GenerateGalleryPromptsOutput {
  galleryPrompts: Array<{
    id: number;
    prompt: string;
    orientation: "horizontal" | "vertical" | "square";
  }>;
}

export interface GenerateGalleryPromptsError {
  code: "prompt_generation_failed";
  message?: string;
}
