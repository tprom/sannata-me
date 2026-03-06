import {
  AnalyzeLandmarkDataInput,
  AnalyzeLandmarkDataOutput,
} from "../types/AnalyzeLandmarkDataTypes";

export class AnalyzeLandmarkData {
  async execute(
    input: AnalyzeLandmarkDataInput,
  ): Promise<AnalyzeLandmarkDataOutput> {
    try {
      const data = input.data as Record<string, unknown>;

      const blocks = data?.blocks as Record<string, unknown> | undefined;
      if (!blocks || typeof blocks !== "object" || Array.isArray(blocks)) {
        throw new Error("blocks_missing");
      }

      const passportInfo = parsePassportInfo(blocks.passport);
      const visualSections = parseVisualSections(blocks.visual);
      const sensoryInfo = parseSensoryInfo(blocks.sensory);

      const characterDescriptors = collectDescriptors([
        passportInfo.type,
        passportInfo.style,
        passportInfo.title,
        visualSections.exterior,
        visualSections.details,
      ]);

      const character =
        characterDescriptors.length > 0
          ? characterDescriptors.slice(0, 4).join(" ")
          : "";

      const toneSource = joinText([
        blocks.history,
        blocks.meaning,
        blocks.legends,
      ]);
      const tone = detectTone(toneSource);

      const atmosphereDescriptors = collectDescriptors([
        sensoryInfo.atmosphere,
        sensoryInfo.sound,
        sensoryInfo.air,
      ]);
      const atmosphere =
        atmosphereDescriptors.length > 0
          ? atmosphereDescriptors.slice(0, 5).join(" ")
          : "спокойная атмосфера";

      const visualDescriptors = collectDescriptors([
        visualSections.exterior,
        visualSections.interior,
        visualSections.details,
        visualSections.environment,
      ]).slice(0, 10);

      const historicalWeight = summarizeHistoricalWeight(
        joinText([blocks.history, blocks.meaning]),
      );

      const risks = identifyRisks({
        historyText: joinText([blocks.history]),
        meaningText: joinText([blocks.meaning]),
        visualDescriptors,
      });

      return {
        analysis: {
          character,
          tone,
          atmosphere,
          visual: visualDescriptors,
          historicalWeight,
          risks,
        },
      };
    } catch (error) {
      throw { code: "analysis_failed", message: (error as Error)?.message };
    }
  }
}

type PassportInfo = {
  title?: string;
  location?: string;
  type?: string;
  style?: string;
};

type VisualSections = {
  exterior: string[];
  interior: string[];
  details: string[];
  environment: string[];
};

type SensoryInfo = {
  sound?: string;
  air?: string;
  atmosphere?: string;
};

const parsePassportInfo = (passportBlock: unknown): PassportInfo => {
  const raw = typeof passportBlock === "string" ? passportBlock : "";
  const lines = parseKeyValueLines(raw);
  const title = lines["Официальное название"];
  const location = lines["Местоположение"];
  const type = lines["Тип объекта"];
  const style = lines["Стиль"];
  return { title, location, type, style };
};

const parseVisualSections = (visualBlock: unknown): VisualSections => {
  const raw = typeof visualBlock === "string" ? visualBlock : "";
  const lines = raw.split(/\r?\n/);
  const sections: VisualSections = {
    exterior: [],
    interior: [],
    details: [],
    environment: [],
  };
  let current: keyof VisualSections | null = null;

  for (const line of lines) {
    const trimmed = stripBulletPrefix(line);
    if (!trimmed) continue;

    const section = detectVisualSection(trimmed);
    if (section) {
      current = section;
      const content = extractAfterColon(trimmed);
      if (content) sections[current].push(content);
      continue;
    }

    const content = extractAfterColon(trimmed) || trimmed;
    if (!content) continue;
    if (current) {
      sections[current].push(content);
    } else {
      sections.details.push(content);
    }
  }

  return sections;
};

const parseSensoryInfo = (sensoryBlock: unknown): SensoryInfo => {
  const raw = typeof sensoryBlock === "string" ? sensoryBlock : "";
  const lines = parseKeyValueLines(raw);
  return {
    sound: lines["Звуки"],
    air: lines["Запахи"],
    atmosphere: lines["Атмосфера"],
  };
};

const parseKeyValueLines = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = stripBulletPrefix(line);
    if (!trimmed) continue;
    const [key, value] = trimmed.split(":").map((part) => part.trim());
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
};

const stripBulletPrefix = (value: string): string => {
  return value.replace(/^\s*[•o]\s*/i, "").trim();
};

const detectVisualSection = (line: string): keyof VisualSections | null => {
  const lower = line.toLowerCase();
  if (lower.startsWith("внешний вид")) return "exterior";
  if (lower.startsWith("ключевые детали") || lower.startsWith("детали")) {
    return "details";
  }
  if (lower.startsWith("окружение") || lower.startsWith("лучшие ракурсы")) {
    return "environment";
  }
  if (lower.startsWith("подземные помещения") || lower.startsWith("интерьер")) {
    return "interior";
  }
  return null;
};

const extractAfterColon = (value: string): string => {
  const index = value.indexOf(":");
  if (index === -1) return "";
  return value.slice(index + 1).trim();
};

const collectDescriptors = (sources: unknown[]): string[] => {
  const descriptors: string[] = [];
  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const item of source) {
        descriptors.push(...splitDescriptors(item));
      }
      continue;
    }

    descriptors.push(...splitDescriptors(source));
  }

  const unique = Array.from(
    new Set(descriptors.map((item) => item.toLowerCase())),
  );

  return unique.map((item) => normalizeCase(item));
};

const splitDescriptors = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value
      .split(/[\n\r;,\.]/g)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .slice(0, 12);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => splitDescriptors(item)).slice(0, 12);
  }

  return [];
};

const joinText = (sources: unknown[]): string => {
  const chunks: string[] = [];
  for (const source of sources) {
    if (!source) continue;
    if (typeof source === "string") {
      chunks.push(source);
      continue;
    }
    if (Array.isArray(source)) {
      for (const item of source) {
        if (typeof item === "string") chunks.push(item);
      }
      continue;
    }
    if (typeof source === "object") {
      const values = Object.values(source as Record<string, unknown>);
      for (const value of values) {
        if (typeof value === "string") chunks.push(value);
      }
    }
  }
  return chunks.join(" ").trim();
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

const identifyRisks = (input: {
  historyText: string;
  meaningText: string;
  visualDescriptors: string[];
}): string[] => {
  const risks: string[] = [];

  const historyLength = input.historyText.trim().length;
  const meaningLength = input.meaningText.trim().length;

  if (historyLength === 0) {
    risks.push("слишком сухое описание");
  }

  if (historyLength > 800) {
    risks.push("слишком много фактов");
  }

  if (meaningLength === 0) {
    risks.push("отсутствие эмоционального контекста");
  }

  const total = input.visualDescriptors.length;
  const unique = new Set(input.visualDescriptors.map((v) => v.toLowerCase()))
    .size;
  if (total > 0 && unique / total < 0.6) {
    risks.push("повторение визуальных элементов");
  }

  if (total === 0) {
    risks.push("слишком сухое описание");
  }

  return Array.from(new Set(risks));
};

const normalizeCase = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};
