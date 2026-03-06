import type { PersonaProfile } from "../types/PersonaTypes";

export const shiProfile: PersonaProfile = {
  id: "shi",
  label: "Shi",
  version: "0.1.0",
  defaults: {
    language: "ru",
  },
  contentModes: {
    default: "primary",
    available: ["primary"],
  },
  content: {
    primary: {},
  },
  style: {
    status: "placeholder",
    voice: "neutral",
    tone: "balanced",
    rhythm: "balanced",
    constraints: [],
  },
  structure: {},
  visual: {},
  translationHints: {},
};
