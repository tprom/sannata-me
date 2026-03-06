import type { SkillContext } from "./SkillContextTypes";

export interface TranslatePostcardViewInput {
  view: {
    greeting: string;
    stampImage: string;
    contentFile: string;
    footer: string;
  };
  targetLanguages: Array<"en" | "de" | "ru" | "uk">;
  context?: SkillContext;
}

export interface TranslatePostcardViewOutput {
  translations: {
    [lang: string]: {
      greeting: string;
      stampImage: string;
      contentFile: string;
      footer: string;
    };
  };
}

export interface TranslatePostcardViewError {
  type: "invalid_view";
}
