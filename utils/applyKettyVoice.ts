import type { Lexicon } from "../types/PersonaTypes";
import { resolveLegacyLexicon } from "./textLayers";

const STOP_WORDS = new Set([
  "и",
  "а",
  "но",
  "в",
  "во",
  "на",
  "по",
  "к",
  "ко",
  "от",
  "до",
  "за",
  "из",
  "у",
  "с",
  "со",
  "о",
  "об",
  "про",
  "что",
  "как",
  "же",
  "ли",
  "то",
  "это",
  "эта",
  "эти",
  "этот",
  "мы",
  "я",
  "ты",
  "он",
  "она",
  "они",
  "мне",
  "нас",
  "вам",
  "вас",
  "его",
  "ее",
  "их",
  "бы",
  "быть",
  "есть",
  "был",
  "была",
  "было",
  "были",
]);

const FORMAL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bпредставляет собой\b/gi, "это"],
  [/\bявляется\b/gi, "это"],
  [/\bрасположен\b/gi, "находится"],
  [/\bрасположена\b/gi, "находится"],
  [/\bсооружение\b/gi, "здание"],
  [/\bпамятник\b/gi, "старинное место"],
  [/\bдостопримечательность\b/gi, "интересное место"],
];

const SIMPLE_WORD_MAP: Record<string, string> = {
  достопримечательность: "место",
  архитектура: "строение",
  монументальный: "большой",
  исторический: "старый",
  величественный: "большой",
  расположение: "место",
  сооружение: "здание",
};

const SAFE_FALLBACKS = [
  "Мне стало интересно",
  "Я посмотрела вокруг",
  "Я чуть улыбнулась",
];

export const applyKettyVoice = (fact: string, lexicon?: Lexicon): string => {
  if (!fact) return fact;
  const resolved = resolveLegacyLexicon(lexicon) ?? lexicon;
  const normalized = normalizeLexicon(resolved);
  const narrative = applyKettyNarrative(normalizeWhitespace(fact));
  let text = narrative.text;
  text = applyReplacements(text, normalized.replacements);
  text = replaceFormalConstructions(text);
  text = simplifyLongWords(text, 10);

  if (isLexiconEmpty(normalized)) {
    return text.trim();
  }

  const tokens = extractTokens(text);
  const observation = pickRelevant(normalized.observations, tokens, text);
  const comparison = pickRelevant(normalized.comparisons, tokens, text);
  const emotion = pickRelevant(normalized.emotions, tokens, text);
  const fantasy = pickRelevant(normalized.fantasies, tokens, text);
  const connector = pickConnector(normalized.connectors, text);
  let addedPhrase = false;

  if (connector) {
    text = insertConnector(text, connector);
    addedPhrase = true;
  }

  if (observation) {
    text = appendPhrase(text, observation);
    addedPhrase = true;
  }

  if (comparison) {
    text = appendPhrase(text, comparison);
    addedPhrase = true;
  }

  if (emotion) {
    text = appendPhrase(text, emotion);
    addedPhrase = true;
  }

  if (fantasy) {
    text = appendPhrase(text, fantasy, true);
    addedPhrase = true;
  }

  if (!addedPhrase && !narrative.changed) {
    const fallback = pickFallback(SAFE_FALLBACKS, text);
    if (fallback) {
      text = appendPhrase(text, fallback);
    }
  }

  return text.trim();
};

type NormalizedLexicon = {
  replacements: Array<{ from: string; to: string }>;
  observations: string[];
  comparisons: string[];
  emotions: string[];
  fantasies: string[];
  connectors: string[];
};

type NarrativeResult = {
  text: string;
  changed: boolean;
};

const applyKettyNarrative = (text: string): NarrativeResult => {
  const simplified = normalizeKeyValue(text);
  const sentences = splitSentences(simplified);
  if (sentences.length === 0) return { text: simplified, changed: false };

  const fact = sentences.slice(0, 2).join(" ").trim();
  const interpretation = buildInterpretation(fact);
  const sensation = buildSensation(simplified, fact);
  const thought = buildThought(fact);

  const parts = [
    ensureSentenceEnd(fact),
    interpretation ? ensureSentenceEnd(interpretation) : "",
    sensation ? ensureSentenceEnd(sensation) : "",
    thought ? ensureSentenceEnd(thought) : "",
  ].filter(Boolean);

  const rewritten = parts.join(" ").replace(/\s+/g, " ").trim();
  return { text: rewritten, changed: rewritten !== text };
};

const normalizeKeyValue = (text: string): string => {
  return text.replace(
    /([A-Za-zА-Яа-яЁё][^:.]{1,40}):\s*([^\.]+)/g,
    "$1 это $2",
  );
};

const splitSentences = (text: string): string[] => {
  const matches = text.match(/[^.!?]+[.!?]*/g);
  if (!matches) return [];
  return matches.map((item) => item.trim()).filter(Boolean);
};

const ensureSentenceEnd = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
};

const buildInterpretation = (text: string): string => {
  const lowered = text.toLowerCase();
  if (/(\d{2,4}|г\.|н\.э)/.test(lowered)) {
    return "Я подумала, что это было очень давно";
  }
  if (/вместим|зрител|тысяч/.test(lowered)) {
    return "Я представила, как много людей здесь могло быть";
  }
  if (/находится|местополож|располож/.test(lowered)) {
    return "Я запомнила, где это место";
  }
  if (/легенд/.test(lowered)) {
    return "Я задумалась, правда ли это";
  }
  if (/звук|эхо|шум|музык/.test(lowered)) {
    return "Мне было интересно это слушать";
  }
  return "Я подумала, что это место особенное";
};

const buildSensation = (fullText: string, text: string): string => {
  const sound = extractLabelValue(fullText, "Звуки");
  if (sound) {
    return `Мне слышались ${sound}`;
  }
  const smell = extractLabelValue(fullText, "Запахи");
  if (smell) {
    return `Пахло ${smell}`;
  }

  const lowered = text.toLowerCase();
  if (/камн|арка|стен|окн|линия|узор/.test(lowered)) {
    return "Я смотрела на детали и не спешила";
  }
  if (/звук|эхо|шум|музык/.test(lowered)) {
    return "Мне слышалось эхо шагов";
  }
  return "Я огляделась и заметила детали";
};

const buildThought = (text: string): string => {
  const lowered = text.toLowerCase();
  if (/[?]/.test(text)) return "";
  if (/назван|имя/.test(lowered)) {
    return "Интересно, кто придумал такое имя";
  }
  if (/строит|постро|строительств/.test(lowered)) {
    return "Как они смогли это построить так давно";
  }
  if (/легенд/.test(lowered)) {
    return "А вдруг это правда";
  }
  if (/вместим|зрител|тысяч/.test(lowered)) {
    return "Интересно, как все там помещались";
  }
  return "Мне захотелось рассмотреть все поближе";
};

const extractLabelValue = (text: string, label: string): string => {
  const regex = new RegExp(`${label}\\s*[:—-]\\s*([^\\.]+)`, "i");
  const match = text.match(regex);
  if (!match) return "";
  return match[1].trim();
};

const normalizeLexicon = (lexicon?: Lexicon): NormalizedLexicon => {
  return {
    replacements: Array.isArray(lexicon?.replacements)
      ? lexicon.replacements
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const entry = item as { from?: unknown; to?: unknown };
            return {
              from: typeof entry.from === "string" ? entry.from.trim() : "",
              to: typeof entry.to === "string" ? entry.to.trim() : "",
            };
          })
          .filter((item) => item.from.length > 0)
      : [],
    observations: normalizeList(lexicon?.observations),
    comparisons: normalizeList(lexicon?.comparisons),
    emotions: normalizeList(lexicon?.emotions),
    fantasies: normalizeList(lexicon?.fantasies),
    connectors: normalizeList(lexicon?.connectors),
  };
};

const normalizeList = (value?: string[]): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item.trim()).filter(Boolean);
};

const isLexiconEmpty = (lexicon: NormalizedLexicon): boolean => {
  return (
    lexicon.replacements.length === 0 &&
    lexicon.observations.length === 0 &&
    lexicon.comparisons.length === 0 &&
    lexicon.emotions.length === 0 &&
    lexicon.fantasies.length === 0 &&
    lexicon.connectors.length === 0
  );
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const applyReplacements = (
  text: string,
  replacements: Array<{ from: string; to: string }>,
): string => {
  let updated = text;
  for (const item of replacements) {
    updated = updated.replace(
      new RegExp(escapeRegExp(item.from), "gi"),
      item.to,
    );
  }
  return updated;
};

const replaceFormalConstructions = (text: string): string => {
  let updated = text;
  for (const [pattern, replacement] of FORMAL_REPLACEMENTS) {
    updated = updated.replace(pattern, replacement);
  }
  return updated;
};

const simplifyLongWords = (text: string, limit: number): string => {
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (!/^[\p{L}]+$/u.test(part)) return part;
      const lower = part.toLowerCase();
      if (lower.length <= limit) return part;
      if (SIMPLE_WORD_MAP[lower]) return SIMPLE_WORD_MAP[lower];
      return part;
    })
    .join("");
};

const extractTokens = (text: string): Set<string> => {
  const tokens = new Set<string>();
  const raw = text
    .toLowerCase()
    .replace(/[^a-zа-яё\s-]/gi, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const word of raw) {
    if (word.length < 3) continue;
    if (STOP_WORDS.has(word)) continue;
    tokens.add(stemWord(word));
  }

  return tokens;
};

const stemWord = (word: string): string => {
  const suffixes = [
    "иями",
    "ями",
    "ами",
    "ого",
    "его",
    "ому",
    "ему",
    "ими",
    "ыми",
    "ях",
    "ах",
    "ия",
    "ий",
    "ый",
    "ая",
    "ое",
    "ые",
    "ам",
    "ом",
    "ем",
    "ой",
    "ью",
    "ую",
    "ие",
    "я",
    "а",
    "о",
    "ы",
    "и",
    "е",
  ];

  for (const suffix of suffixes) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }

  return word;
};

const pickRelevant = (
  phrases: string[],
  tokens: Set<string>,
  text: string,
): string => {
  if (phrases.length === 0) return "";
  const lowered = text.toLowerCase();

  for (const phrase of phrases) {
    const trimmed = phrase.trim();
    if (!trimmed) continue;
    if (lowered.includes(trimmed.toLowerCase())) continue;
    const phraseTokens = extractTokens(trimmed);
    const intersects = [...phraseTokens].some((token) => tokens.has(token));
    if (intersects) return trimmed;
  }

  return "";
};

const pickConnector = (connectors: string[], text: string): string => {
  if (connectors.length === 0) return "";
  if (!isLongParagraph(text)) return "";
  const connector = connectors[0]?.trim();
  if (!connector) return "";
  if (text.toLowerCase().includes(connector.toLowerCase())) return "";
  return connector;
};

const isLongParagraph = (text: string): boolean => {
  const sentences = text
    .split(/[.!?]/)
    .filter((item) => item.trim().length > 0);
  if (sentences.length >= 3) return true;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length >= 20;
};

const insertConnector = (text: string, connector: string): string => {
  const match = text.match(/[.!?]/);
  if (match && typeof match.index === "number") {
    const index = match.index + 1;
    return `${text.slice(0, index)} ${connector} ${text.slice(index).trim()}`.trim();
  }
  return `${text} ${connector}`.trim();
};

const pickFallback = (fallbacks: string[], text: string): string => {
  const lowered = text.toLowerCase();
  for (const item of fallbacks) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (lowered.includes(trimmed.toLowerCase())) continue;
    return trimmed;
  }
  return "";
};

const appendPhrase = (text: string, phrase: string, atEnd = false): string => {
  if (!phrase) return text;
  const trimmed = text.trim();
  const needsPunctuation = !/[.!?]$/.test(trimmed);
  if (atEnd) {
    return needsPunctuation ? `${trimmed} ${phrase}.` : `${trimmed} ${phrase}`;
  }
  return needsPunctuation ? `${trimmed} ${phrase}` : `${trimmed} ${phrase}`;
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
