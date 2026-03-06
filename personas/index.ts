import { kettyProfile } from "./kettyProfile";
import { lusyProfile } from "./lusyProfile";
import { fillProfile } from "./fillProfile";
import { shiProfile } from "./shiProfile";
import fs from "fs";
import path from "path";
import type {
  ContentMode,
  Lexicon,
  PersonaId,
  PersonaProfile,
} from "../types/PersonaTypes";

export const DEFAULT_PERSONA_ID = "ketty";

const profiles: Record<PersonaId, PersonaProfile> = {
  ketty: kettyProfile,
  lusy: lusyProfile,
  fill: fillProfile,
  shi: shiProfile,
};

type KettyProfileFile = {
  id?: string;
  label?: string;
  version?: string;
  defaults?: {
    language?: string;
    contentMode?: ContentMode;
  };
  blocks?: {
    textStyle?: string;
    textStructure?: string;
    textLogic?: string;
    textLexicon?: string;
    textUsage?: string;
    aliases?: string;
    visualsIllustration?: string;
    visualsGallery?: string;
    visualsStamp?: string;
    translateHints?: string;
  };
};

const readJsonFile = <T>(filePath: string): T | null => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
};

const loadKettyProfileFromFiles = (): PersonaProfile | null => {
  const baseDir = path.join(process.cwd(), "personas", "ketty");
  const profilePath = path.join(baseDir, "profile.json");
  const profileFile = readJsonFile<KettyProfileFile>(profilePath);
  if (!profileFile) return null;

  const blocks = profileFile.blocks ?? {};
  const textStyle = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.textStyle ?? "text.style.json"),
  );
  const textStructure = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.textStructure ?? "text.structure.json"),
  );
  const textLogic = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.textLogic ?? "text.logic.json"),
  );
  const textLexicon = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.textLexicon ?? "text.lexicon.json"),
  );
  const textUsage = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.textUsage ?? "text.usage.json"),
  );
  const aliases = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.aliases ?? "aliases.json"),
  );
  const visualsIllustration = readJsonFile<Record<string, unknown>>(
    path.join(
      baseDir,
      blocks.visualsIllustration ?? "visuals.illustration.json",
    ),
  );
  const visualsGallery = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.visualsGallery ?? "visuals.gallery.json"),
  );
  const visualsStamp = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.visualsStamp ?? "visuals.stamp.json"),
  );
  const translateHints = readJsonFile<Record<string, unknown>>(
    path.join(baseDir, blocks.translateHints ?? "translate.hints.json"),
  );

  return {
    ...profiles.ketty,
    id: (profileFile.id as PersonaId) ?? profiles.ketty.id,
    label: profileFile.label ?? profiles.ketty.label,
    version: profileFile.version ?? profiles.ketty.version,
    defaults: {
      ...profiles.ketty.defaults,
      ...(profileFile.defaults?.language
        ? { language: profileFile.defaults.language as "ru" }
        : {}),
    },
    contentModes: profiles.ketty.contentModes,
    content: profiles.ketty.content,
    text: {
      style: textStyle ?? {},
      structure: textStructure ?? {},
      logic: textLogic ?? {},
      lexicon: (textLexicon ?? {
        replacements: [],
        observations: [],
        comparisons: [],
        emotions: [],
        fantasies: [],
        connectors: [],
      }) as Lexicon,
      usage: textUsage ?? {},
      aliases: aliases ?? {},
    },
    visuals: {
      illustration: visualsIllustration ?? {},
      gallery: visualsGallery ?? {},
      stamp: visualsStamp ?? {},
    },
    translationHints: translateHints ?? {},
  };
};

export const resolvePersonaProfile = (
  personaId?: string,
): { profile: PersonaProfile; issues: string[] } => {
  const fallback = loadKettyProfileFromFiles() ?? profiles.ketty;
  if (!personaId) {
    return { profile: fallback, issues: [] };
  }

  const normalized = personaId.toLowerCase() as PersonaId;
  let candidate = profiles[normalized];
  if (normalized === "ketty") {
    candidate = loadKettyProfileFromFiles() ?? profiles.ketty;
  }
  if (!candidate) {
    return { profile: fallback, issues: ["unknown_persona"] };
  }

  const validation = validatePersonaProfile(candidate);
  if (!validation.ok) {
    return {
      profile: fallback,
      issues: ["invalid_profile", ...validation.issues],
    };
  }

  return { profile: candidate, issues: [] };
};

export const getPersonaProfile = (personaId?: string): PersonaProfile => {
  return resolvePersonaProfile(personaId).profile;
};

export const resolveContentMode = (
  profile: PersonaProfile,
  requested?: string,
): ContentMode => {
  const available = profile.contentModes?.available ?? ["primary"];
  const fallback = profile.contentModes?.default ?? available[0];
  if (!requested) return fallback;
  const normalized = requested.toLowerCase() as ContentMode;
  return available.includes(normalized) ? normalized : fallback;
};

export const validatePersonaProfile = (
  profile: PersonaProfile,
): { ok: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (!profile?.id) issues.push("missing_id");
  if (!profile?.label) issues.push("missing_label");
  if (!profile?.version) issues.push("missing_version");
  if (!profile?.defaults?.language) issues.push("missing_defaults_language");

  const modes = profile?.contentModes;
  if (modes) {
    if (!modes.available?.length) issues.push("missing_content_modes");
    if (modes.available?.length && !modes.available.includes(modes.default)) {
      issues.push("default_mode_not_available");
    }
  }

  return { ok: issues.length === 0, issues };
};
