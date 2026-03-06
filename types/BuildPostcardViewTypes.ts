import type { SkillContext } from "./SkillContextTypes";

export interface BuildPostcardViewInput {
  postcardJson: any;
  context?: SkillContext;
}

export interface BuildPostcardViewOutput {
  view: {
    greeting: string;
    stampImage: string;
    contentFile: string;
    footer: string;
  };
}

export interface BuildPostcardViewError {
  type: "invalid_postcard_json";
}
