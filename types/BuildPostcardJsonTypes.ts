import type { SkillContext } from "./SkillContextTypes";

export interface BuildPostcardJsonInput {
  data: any;
  analysis: any;
  style: any;
  outline: Array<{
    id: number;
    topic: string;
    length: "short" | "medium" | "long";
  }>;
  contentFile: string;
  illustrationPrompts: Array<{ paragraphId: number; prompt: string }>;
  galleryPrompts: Array<{ id: number; prompt: string; orientation: string }>;
  stampPrompt: string;
  images: {
    illustrations: Array<{ paragraphId: number; imagePath: string }>;
    gallery: Array<{ id: number; imagePath: string }>;
    stamp: { imagePath: string };
  };
  context?: SkillContext;
}

export interface BuildPostcardJsonOutput {
  postcardJson: any;
}

export interface BuildPostcardJsonError {
  type: "missing_data" | "inconsistent_visual_data";
}
