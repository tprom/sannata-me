import type { PersonaProfile } from "../types/PersonaTypes";

export const kettyProfile: PersonaProfile = {
  id: "ketty",
  label: "Ketty",
  version: "0.1.0",
  defaults: {
    language: "ru",
  },
  contentModes: {
    default: "primary",
    available: ["primary", "secondary"],
  },
  content: {
    primary: {},
    secondary: {},
  },
  text: {
    lexicon: {
      replacements: [],
      observations: [],
      comparisons: [],
      emotions: [],
      fantasies: [],
      connectors: [],
    },
  },
  style: {},
  structure: {},
  visual: {},
  translationHints: {},
};
