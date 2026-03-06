import type { LandmarkData, LandmarkSemanticProfile } from "./types";

export const buildSemanticProfile = (
  data: LandmarkData,
): LandmarkSemanticProfile => {
  const blocks = data.blocks;

  const passportInfo = parsePassport(blocks.passport);
  const sensoryInfo = parseSensory(blocks.sensory);
  const visualHighlights = extractVisualHighlights(blocks.visual);
  const historicalHighlights = extractHighlights([
    blocks.history,
    blocks.meaning ?? "",
  ]);
  const legends = extractHighlights([blocks.legends ?? ""]);
  const touristMotifs = extractHighlights([blocks.touristExperience ?? ""]);

  const character = buildCharacter(passportInfo, visualHighlights);
  const atmosphere = buildAtmosphere(sensoryInfo);
  const tone = detectTone(
    [blocks.history, blocks.meaning ?? "", blocks.legends ?? ""].join(" "),
  );
  const historicalWeight = summarizeHistoricalWeight(
    [blocks.history, blocks.meaning ?? ""].join(" "),
  );

  return {
    character,
    tone,
    atmosphere,
    visual: visualHighlights,
    historicalWeight,
    risks: [],
    visualHighlights,
    historicalHighlights,
    legends,
    touristMotifs,
  };
};

type PassportInfo = {
  officialName?: string;
  location?: string;
  type?: string;
  style?: string;
};

type SensoryInfo = {
  sound?: string;
  smell?: string;
  atmosphere?: string;
};

const parsePassport = (raw: string): PassportInfo => {
  const pairs = parseKeyValueLines(raw);
  return {
    officialName: pairs["Официальное название"],
    location: pairs["Местоположение"],
    type: pairs["Тип объекта"],
    style: pairs["Стиль"],
  };
};

const parseSensory = (raw: string): SensoryInfo => {
  const pairs = parseKeyValueLines(raw);
  return {
    sound: pairs["Звуки"],
    smell: pairs["Запахи"],
    atmosphere: pairs["Атмосфера"],
  };
};

const parseKeyValueLines = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = stripBulletPrefix(line);
    if (!trimmed) continue;
    const [key, value] = splitKeyValue(trimmed);
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
};

const extractVisualHighlights = (raw: string): string[] => {
  const sections: string[] = [];
  let current: "exterior" | "interior" | "details" | "environment" | null =
    null;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = stripBulletPrefix(line);
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (lower.startsWith("внешний вид")) current = "exterior";
    if (lower.startsWith("ключевые детали") || lower.startsWith("детали")) {
      current = "details";
    }
    if (lower.startsWith("окружение") || lower.startsWith("лучшие ракурсы")) {
      current = "environment";
    }
    if (
      lower.startsWith("подземные помещения") ||
      lower.startsWith("интерьер")
    ) {
      current = "interior";
    }

    const content = extractAfterColon(trimmed);
    const isHeader = trimmed.endsWith(":") && !content;
    if (isHeader) continue;
    const resolved = content || trimmed;
    if (!resolved) continue;
    sections.push(resolved);
  }

  return normalizeHighlights(sections, 10);
};

const extractHighlights = (blocks: string[]): string[] => {
  const collected: string[] = [];
  for (const block of blocks) {
    if (!block) continue;
    for (const line of block.split(/\r?\n/)) {
      const trimmed = stripBulletPrefix(line);
      if (!trimmed) continue;
      if (trimmed.endsWith(":")) continue;
      const [key, value] = splitKeyValue(trimmed);
      if (!value) {
        if (!key.endsWith(":")) {
          collected.push(...splitToPhrases(key));
        }
        continue;
      }
      collected.push(...splitToPhrases(value));
    }
  }
  return normalizeHighlights(collected, 10);
};

const splitToPhrases = (value: string): string[] => {
  return value
    .split(/[;]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => truncateWords(part, 12));
};

const normalizeHighlights = (items: string[], limit: number): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const normalized = normalizeSentence(item);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
};

const buildCharacter = (passport: PassportInfo, visuals: string[]): string => {
  const pieces = [passport.type, passport.style, passport.officialName].filter(
    Boolean,
  ) as string[];
  const base = pieces.slice(0, 3).join(", ");
  if (base) return base;
  if (visuals.length > 0) return visuals[0];
  return "";
};

const buildAtmosphere = (sensory: SensoryInfo): string => {
  const pieces = [sensory.atmosphere, sensory.sound, sensory.smell]
    .filter(Boolean)
    .map((item) => normalizeSentence(item as string));
  return pieces.slice(0, 2).join(", ");
};

const detectTone = (text: string): string => {
  const lower = text.toLowerCase();
  if (/(войн|битв|траг|жертв|погиб|скорб)/.test(lower)) {
    return "меланхоличный";
  }
  if (/(геро|подвиг|побед|слава|торжеств)/.test(lower)) {
    return "торжественный";
  }
  if (/(любов|роман|лирич|нежн)/.test(lower)) {
    return "лирический";
  }
  if (/(вдохнов|велич|впечатл|восхищ)/.test(lower)) {
    return "вдохновляющий";
  }
  if (/(тиш|спокой|умир|созерц)/.test(lower)) {
    return "спокойный";
  }
  return "нейтральный";
};

const summarizeHistoricalWeight = (text: string): string => {
  const lower = text.toLowerCase();
  if (/(древн|антич|средневек|основан|построен)/.test(lower)) {
    return "значимое историческое наследие";
  }
  if (/(соврем|новейш|архитектурн)/.test(lower)) {
    return "заметный современный культурный объект";
  }
  if (lower.length === 0) {
    return "историческая значимость требует уточнения";
  }
  return "важный культурный объект";
};

const splitKeyValue = (value: string): [string, string] => {
  const index = value.indexOf(":");
  if (index === -1) return [value.trim(), ""];
  return [value.slice(0, index).trim(), value.slice(index + 1).trim()];
};

const extractAfterColon = (value: string): string => {
  const index = value.indexOf(":");
  if (index === -1) return "";
  return value.slice(index + 1).trim();
};

const stripBulletPrefix = (value: string): string => {
  return value.replace(/^\s*[•o\t]+\s*/i, "").trim();
};

const truncateWords = (value: string, limit: number): string => {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, limit).join(" ");
};

const normalizeSentence = (value: string): string => {
  return value
    .replace(/\s+/g, " ")
    .replace(/[.,:;]+$/g, "")
    .trim();
};
