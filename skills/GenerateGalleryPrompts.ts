import {
  GenerateGalleryPromptsInput,
  GenerateGalleryPromptsOutput,
} from "../types/GenerateGalleryPromptsTypes";

export class GenerateGalleryPrompts {
  async execute(
    input: GenerateGalleryPromptsInput,
  ): Promise<GenerateGalleryPromptsOutput> {
    const elements = collectElements(input);
    const promptsCount = selectPromptCount(elements.length);
    const used = new Set<string>();
    const childMode = true;

    const galleryPrompts = Array.from({ length: promptsCount }, (_, index) => {
      const selected = pickElements(elements, used, 2, 4).map((item) =>
        simplifyDescriptor(item),
      );
      const orientation = determineOrientation(selected);
      const scene = selected.length > 0 ? selected[0] : "главный вид";
      const visualText = selected
        .slice(1, 4)
        .filter((item) => item && item !== scene)
        .join(", ");
      const atmosphere = shortenWords(
        normalizePhrase(input.analysis.atmosphere),
        12,
      );

      const prompt = childMode
        ? [
            `Фотореалистичное изображение: ${scene}.`,
            visualText ? `Рядом ${visualText}.` : "Рядом мягкие детали.",
            `Атмосфера: ${atmosphere || "спокойная"}.`,
            "Мягкие цвета, лёгкая карандашная текстура.",
          ].join(" ")
        : [
            `Фотореалистичное изображение ${scene}.`,
            visualText
              ? `${capitalize(visualText)}.`
              : "Сцена с выразительными деталями.",
            `Атмосфера: ${atmosphere}.`,
            `Эмоциональный тон: ${normalizePhrase(input.analysis.tone)}.`,
            "Фотореалистичный стиль с лёгким карандашным акцентом, мягкая текстура.",
          ].join(" ");

      const template = readTemplate(input.context?.profile?.visuals?.gallery);
      const resolvedPrompt = template
        ? renderTemplate(template, {
            scene,
            elements: selected,
            atmosphere,
          })
        : prompt;

      return {
        id: index + 1,
        prompt: resolvedPrompt,
        orientation,
      };
    });

    return { galleryPrompts };
  }
}

const collectElements = (input: GenerateGalleryPromptsInput): string[] => {
  const visual = input.visual;
  const pool = [
    ...(visual.exterior ?? []),
    ...(visual.interior ?? []),
    ...(visual.details ?? []),
    ...(visual.environment ?? []),
    ...(input.analysis.visual ?? []),
  ];

  const normalized = pool
    .flatMap((item) => splitKeywords(item))
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 0);

  return Array.from(new Set(normalized)).map((item) => normalizePhrase(item));
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

const selectPromptCount = (count: number): number => {
  if (count >= 10) return 5;
  if (count >= 5) return 4;
  return 3;
};

const pickElements = (
  elements: string[],
  used: Set<string>,
  min: number,
  max: number,
): string[] => {
  const selected: string[] = [];
  for (const element of elements) {
    const normalized = normalizePhrase(element);
    if (!normalized || used.has(normalized)) continue;
    selected.push(normalized);
    used.add(normalized);
    if (selected.length >= max) break;
  }

  if (selected.length < min) {
    for (const element of elements) {
      const normalized = normalizePhrase(element);
      if (!normalized) continue;
      if (!selected.includes(normalized)) selected.push(normalized);
      if (selected.length >= min) break;
    }
  }

  return selected;
};

const determineOrientation = (
  elements: string[],
): "horizontal" | "vertical" | "square" => {
  const combined = elements.join(" ").toLowerCase();
  if (/(панорама|вид сверху|ландшафт)/.test(combined)) {
    return "horizontal";
  }
  if (/(вход|арка|фасад|вертикальн)/.test(combined)) {
    return "vertical";
  }
  return "square";
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
  for (const [from, to] of Object.entries(GALLERY_REPLACEMENTS)) {
    updated = replaceCyrillicWord(updated, from, to);
  }
  updated = dedupeWords(updated);
  const words = updated
    .split(/\s+/)
    .filter((word) => word.length > 0 && !GALLERY_STOP_WORDS.has(word));
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

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const GALLERY_STOP_WORDS = new Set([
  "unesco",
  "архитектура",
  "интерьер",
  "экстерьер",
  "детализированные",
  "орнаментальные",
  "стрельчатые",
  "поток",
  "туристов",
  "эмоциональный",
  "тон",
  "фотореалистичный",
]);

const GALLERY_REPLACEMENTS: Record<string, string> = {
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
