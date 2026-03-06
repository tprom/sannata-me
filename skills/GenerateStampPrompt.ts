import {
  GenerateStampPromptInput,
  GenerateStampPromptOutput,
} from "../types/GenerateStampPromptTypes";

export class GenerateStampPrompt {
  async execute(
    input: GenerateStampPromptInput,
  ): Promise<GenerateStampPromptOutput> {
    const analysis = input.analysis;
    const character = simplifyDescriptor(analysis.character ?? "");
    const atmosphere = shortenWords(
      normalizePhrase(analysis.atmosphere ?? ""),
      10,
    );
    const visuals = pickStrongVisuals(analysis.visual ?? []).map((item) =>
      simplifyDescriptor(item),
    );
    const visualText =
      visuals.length > 0 ? visuals.join(", ") : "узнаваемый силуэт";
    const characterPart = character ? `, ${character}` : "";

    const sentenceOne = `Небольшой карандашный рисунок ${visualText}${characterPart}.`;
    const sentenceTwo =
      `Простые линии, квадратный формат, прозрачный фон, ` +
      `атмосфера ${atmosphere || "спокойная"}, без текста.`;

    const template = readTemplate(input.context?.profile?.visuals?.stamp);
    const landmark = character || visualText || "узнаваемый силуэт";
    const resolvedPrompt = template
      ? renderTemplate(template, { landmark, atmosphere })
      : `${sentenceOne} ${sentenceTwo}`.trim();

    return {
      stampPrompt: resolvedPrompt,
    };
  }
}

const readTemplate = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const template = (value as { promptTemplate?: unknown }).promptTemplate;
  if (typeof template !== "string") return null;
  const trimmed = template.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const renderTemplate = (
  template: string,
  input: { landmark: string; atmosphere: string },
): string => {
  return template
    .replaceAll("{landmark}", input.landmark)
    .replaceAll("{scene}", input.landmark)
    .replaceAll("{atmosphere}", input.atmosphere);
};

const pickStrongVisuals = (visuals: string[]): string[] => {
  const cleaned = visuals
    .flatMap((item) => splitKeywords(item))
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 0);

  const unique = Array.from(new Set(cleaned)).map((item) =>
    normalizePhrase(item),
  );
  return unique.slice(0, 2);
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
  const shortened = trimTrailingPunct(words.slice(0, limit).join(" "));
  return dropTrailingAdjective(shortened);
};

const simplifyDescriptor = (value: string): string => {
  const trimmed = normalizePhrase(value).toLowerCase();
  if (!trimmed) return "";
  let updated = trimmed;
  updated = updated.replace(/поток\s+туристов/gi, "много людей");
  updated = updated.replace(/каменные\s+статуи\s+святых/gi, "каменные фигурки");
  updated = updated.replace(/каменные\s+статуи/gi, "каменные фигурки");
  updated = updated.replace(/собор\s+готика/gi, "большой собор");
  updated = updated.replace(/\bрасположен\b/gi, "");
  updated = updated.replace(/городская\s+площадь/gi, "площадь");
  updated = updated.replace(/рядом\s+с\s+рейном/gi, "рядом с рекой");
  updated = updated.replace(/у\s+рейна/gi, "у реки");
  updated = updated.replace(
    /расположен\s+рядом\s+с\s+рейном/gi,
    "рядом с рекой",
  );
  updated = updated.replace(/расположен\s+рядом\s+с/gi, "рядом с");
  updated = updated.replace(/рейн(ом|а|у)?/gi, "река");
  for (const [from, to] of Object.entries(STAMP_REPLACEMENTS)) {
    updated = replaceCyrillicWord(updated, from, to);
  }
  updated = dedupeWords(updated);
  const words = updated
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STAMP_STOP_WORDS.has(word));
  return words.join(" ").trim();
};

const trimTrailingPunct = (value: string): string => {
  return value.replace(/[,:;]+$/g, "").trim();
};

const dropTrailingAdjective = (value: string): string => {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return value;
  const last = words[words.length - 1];
  if (/(ый|ий|ая|ое|ые|ие|ой)$/.test(last)) {
    words.pop();
  }
  while (words.length > 0 && /(и|а|но|и,)$/i.test(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ").trim();
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

const dedupeWords = (value: string): string => {
  const words = value.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (const word of words) {
    if (result[result.length - 1] === word) continue;
    result.push(word);
  }
  return result.join(" ").trim();
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
};

const STAMP_STOP_WORDS = new Set([
  "unesco",
  "архитектура",
  "минималистичный",
  "фотореалистичный",
  "детализированные",
  "орнаментальные",
  "стрельчатые",
  "поток",
  "туристов",
]);

const STAMP_REPLACEMENTS: Record<string, string> = {
  готика: "старинный",
  готические: "старинные",
  готический: "старинный",
  готическая: "старинная",
  готическом: "старинном",
  собор: "большой собор",
  фасады: "резные стены",
  фасад: "резные стены",
  детализированные: "узорные",
  стрельчатые: "острые",
  "орнаментальные элементы": "узоры",
  орнаментальные: "узорные",
  элементы: "узоры",
  витражные: "цветные",
  витражи: "цветные окна",
  статуи: "фигурки",
  туристы: "люди",
};
