import type {
  ContentMode,
  PersonaId,
  PersonaProfile,
  TextMode,
} from "./PersonaTypes";

export type SkillContext = {
  personaId: PersonaId;
  contentMode: ContentMode;
  textMode?: TextMode;
  profile: PersonaProfile;
  sourceLanguage: "ru" | "en" | "de" | "uk";
  targetLanguages: Array<"en" | "de" | "ru" | "uk">;
};
