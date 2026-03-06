import {
  GenerateIllustrationPromptsInput,
  GenerateIllustrationPromptsOutput,
} from "../types/GenerateIllustrationPromptsTypes";

export class GenerateIllustrationPrompts {
  async execute(
    input: GenerateIllustrationPromptsInput,
  ): Promise<GenerateIllustrationPromptsOutput> {
    const usedDescriptors = new Set<string>();
    const visualPool = buildVisualPool(input.analysis.visual);
    const paragraphs = extractParagraphs(input.contentFile);
    const globalChildMode = paragraphs.some((paragraph) =>
      isChildVoice(paragraph.text),
    );

    const prompts = paragraphs.map((paragraph) => {
      const paragraphHints = extractKeywords(paragraph.text);
      const childMode = globalChildMode;
      const scene = childMode
        ? buildChildScene(input.analysis.character, visualPool)
        : buildScene(paragraphHints, input.analysis.character);
      const elements = childMode
        ? pickChildElements(visualPool, usedDescriptors)
        : pickVisualElements({
            paragraphHints,
            visualPool,
            usedDescriptors,
          });
      const atmosphere = normalizePhrase(input.analysis.atmosphere);

      const prompt = buildPrompt({
        scene,
        elements,
        atmosphere,
        childMode,
      });

      const template = readTemplate(
        input.context?.profile?.visuals?.illustration,
      );
      const resolvedPrompt = template
        ? renderTemplate(template, {
            scene,
            elements,
            atmosphere,
          })
        : prompt;

      return {
        paragraphId: paragraph.id,
        prompt: resolvedPrompt,
      };
    });

    return { prompts };
  }
}

const extractParagraphs = (
  contentFile: string,
): Array<{ id: number; text: string }> => {
  const rawParts = contentFile.split(/\n\n+/g);
  const paragraphs: Array<{ id: number; text: string }> = [];
  let id = 1;

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const cleaned = trimmed.replace(/\[\[illustration:[^\]]+\]\]/gi, "").trim();
    if (!cleaned) continue;
    paragraphs.push({ id, text: cleaned });
    id += 1;
  }

  return paragraphs;
};

const readTemplate = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const template = (value as { promptTemplate?: unknown }).promptTemplate;
  if (typeof template !== "string") return null;
  const trimmed = template.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const renderTemplate = (
  template: string,
  input: { scene: string; elements: string[]; atmosphere: string },
): string => {
  return template
    .replaceAll("{scene}", input.scene)
    .replaceAll("{elements}", input.elements.join(", "))
    .replaceAll("{atmosphere}", input.atmosphere);
};

const buildPrompt = (input: {
  scene: string;
  elements: string[];
  atmosphere: string;
  childMode: boolean;
}): string => {
  if (input.childMode) {
    return buildChildPrompt(input);
  }

  const elementsText = input.elements.join(", ");
  const atmosphere = input.atmosphere || "спокойная";

  return [
    "Карандашный рисунок.",
    `${capitalize(input.scene)}.`,
    elementsText
      ? `${capitalize(elementsText)}.`
      : "Ключевые детали выделены мягко.",
    `Атмосфера: ${atmosphere}.`,
    "Мягкие штрихи, квадратная композиция.",
  ].join(" ");
};

const buildChildPrompt = (input: {
  scene: string;
  elements: string[];
  atmosphere: string;
  childMode: boolean;
}): string => {
  const [primary, secondary, tertiary] = input.elements.map((item) =>
    simplifyDescriptor(item),
  );
  const scene = simplifyDescriptor(input.scene) || "главный вид";
  const atmosphere = shortenWords(input.atmosphere || "спокойная", 12);

  const main = primary || scene;
  const extra = [secondary, tertiary].filter(Boolean).join(", ");

  return [
    "Детский карандашный рисунок.",
    `На рисунке ${main}.`,
    extra ? `Рядом ${extra}.` : "Детали отмечены мягкими штрихами.",
    `Атмосфера: ${atmosphere}.`,
    "Немного неровные линии, квадратная композиция.",
  ].join(" ");
};

const buildScene = (keywords: string[], character: string): string => {
  const base =
    keywords.length > 0 ? keywords.slice(0, 3).join(" ") : "главный вид";
  const characterPart = normalizePhrase(character);
  if (characterPart) {
    return `${base}, ${characterPart}`.trim();
  }
  return base;
};

const buildChildScene = (character: string, visualPool: string[]): string => {
  const label = pickChildLandmark(character);
  const firstVisual = simplifyDescriptor(visualPool[0] || "");
  if (!firstVisual) return label;
  if (firstVisual.includes("собор") || firstVisual.includes("замок")) {
    return firstVisual;
  }
  return `${label} и ${firstVisual}`.trim();
};

const buildVisualPool = (visual: string[]): string[] => {
  const pool = visual
    .flatMap((item) => splitKeywords(item))
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 0);

  return Array.from(new Set(pool)).map((item) => normalizePhrase(item));
};

const pickVisualElements = (input: {
  paragraphHints: string[];
  visualPool: string[];
  usedDescriptors: Set<string>;
}): string[] => {
  const elements: string[] = [];
  const candidates = [...input.paragraphHints, ...input.visualPool];

  for (const candidate of candidates) {
    const normalized = normalizePhrase(candidate);
    if (!normalized || input.usedDescriptors.has(normalized)) continue;
    elements.push(normalized);
    input.usedDescriptors.add(normalized);
    if (elements.length >= 4) break;
  }

  return elements.length >= 2 ? elements : elements.slice(0, 2);
};

const pickChildElements = (
  visualPool: string[],
  usedDescriptors: Set<string>,
): string[] => {
  const elements: string[] = [];
  for (const candidate of visualPool) {
    const normalized = simplifyDescriptor(candidate);
    if (!normalized || usedDescriptors.has(normalized)) continue;
    elements.push(normalized);
    usedDescriptors.add(normalized);
    if (elements.length >= 3) break;
  }
  return elements;
};

const extractKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[\d]/g, "")
    .split(/[^а-яa-zё]+/gi)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !ILLUSTRATION_STOP_WORDS.has(word));

  const unique = Array.from(new Set(words));
  return unique.slice(0, 6);
};

const splitKeywords = (value: string): string[] => {
  return value
    .split(/[,;\.\n\r]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizePhrase = (value: string): string => {
  return value.trim().replace(/\s+/g, " ");
};

const shortenWords = (value: string, limit: number): string => {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, limit).join(" ");
};

const simplifyDescriptor = (value: string): string => {
  const trimmed = normalizePhrase(value).toLowerCase();
  if (!trimmed) return "";
  let updated = trimmed;
  for (const [from, to] of Object.entries(ILLUSTRATION_REPLACEMENTS)) {
    updated = replaceCyrillicWord(updated, from, to);
  }
  updated = dedupeWords(updated);
  const words = updated
    .split(/\s+/)
    .filter((word) => word.length > 0 && !ILLUSTRATION_STOP_WORDS.has(word));
  return words.join(" ").trim();
};

const isChildVoice = (text: string): boolean => {
  return /\bя\b|\bмы\b|мне|моя|моё|мои|кажется|решила/i.test(text);
};

const pickChildLandmark = (character: string): string => {
  const lower = character.toLowerCase();
  if (lower.includes("собор")) return "большой собор";
  if (lower.includes("замок")) return "большой замок";
  if (lower.includes("мост")) return "красивый мост";
  if (lower.includes("музей")) return "интересный музей";
  if (lower.includes("башн")) return "высокая башня";
  if (lower.includes("дворец")) return "нарядный дворец";
  return "большое здание";
};

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const dedupeWords = (value: string): string => {
  const words = value.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (const word of words) {
    if (result[result.length - 1] === word) continue;
    result.push(word);
  }
  return result.join(" ").trim();
};

const replaceCyrillicWord = (
  text: string,
  from: string,
  to: string,
): string => {
  const pattern = new RegExp(
    `(^|\\s)${escapeRegExp(from)}(?=\\s|$|[.,!?:;])`,
    "gi",
  );
  return text.replace(pattern, `$1${to}`);
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
};

const ILLUSTRATION_STOP_WORDS = new Set([
  "вступление",
  "история",
  "эмоция",
  "личное",
  "завершение",
  "информативно",
  "поэтичный",
  "спокойный",
  "кажется",
  "сегодня",
  "подошли",
  "подошла",
  "перед",
  "нами",
  "внутри",
  "очень",
  "какой",
  "какая",
  "какое",
  "когда",
  "потому",
  "почему",
  "тоже",
  "сказала",
  "решила",
  "увидела",
  "заметное",
  "самое",
  "заметное",
  "меня",
  "мене",
  "лицо",
  "третье",
  "первое",
  "unesco",
  "архитектура",
  "детализированные",
  "орнаментальные",
  "стрельчатые",
  "поток",
  "туристов",
  "туристы",
]);

const ILLUSTRATION_REPLACEMENTS: Record<string, string> = {
  готика: "старинный",
  готические: "старинные",
  готический: "старинный",
  готическая: "старинная",
  собор: "большой собор",
  башни: "башни",
  арки: "ажурные арки",
  фасады: "резные стены",
  детализированные: "узорные",
  стрельчатые: "острые",
  орнаментальные: "узорные",
  "орнаментальные элементы": "узорчики",
  элементы: "узорчики",
  "узорные узорчики": "узорчики",
  витражные: "цветные",
  витражи: "цветные окна",
  колонны: "резные колонны",
  "каменные статуи святых": "каменные фигурки",
  статуи: "каменные фигурки",
  туристы: "люди",
};
