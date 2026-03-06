import type { PersonaProfile } from "../types/PersonaTypes";

export const lusyProfile: PersonaProfile = {
  id: "lusy",
  label: "Lusy",
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
