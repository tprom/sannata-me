import {
  GenerateParagraphsInput,
  GenerateParagraphsOutput,
} from "../types/GenerateParagraphsTypes";
import type { Lexicon } from "../types/PersonaTypes";
import { applyKettyVoice } from "../utils/applyKettyVoice";
import {
  mergeLexiconAdditions,
  resolveLexiconForMode,
  resolveTextAdditionsForMode,
} from "../utils/textLayers";

type LogicHints = {
  useInGeneration: boolean;
  comparisons: string[];
  childObservations: string[];
  fantasyRules: string[];
};

export class GenerateParagraphs {
  async execute(
    input: GenerateParagraphsInput,
  ): Promise<GenerateParagraphsOutput> {
    const { outline, blocks, style } = input;
    const textMode = input.context?.textMode ?? "postcard";
    const logicHints = readLogicHints(input.context?.profile?.text?.logic);
    const textProfile = input.context?.profile?.text;
    const lexicon = resolveLexiconForMode(textProfile, textMode);
    const additions = resolveTextAdditionsForMode(textProfile, textMode);
    const mergedLexicon = mergeLexiconAdditions(lexicon, additions);
    const usedLexicon = createLexiconUsage();

    const passportSentences = parseBlock(blocks.passport, true);
    const historySentences = parseBlock(blocks.history, false);
    const meaningSentences = blocks.meaning
      ? parseBlock(blocks.meaning, false)
      : [];
    const legendsSentences = blocks.legends
      ? parseBlock(blocks.legends, false)
      : [];
    const visualSentences = parseBlock(blocks.visual, true);
    const sensorySentences = parseBlock(blocks.sensory, true);
    const touristSentences = blocks.touristExperience
      ? parseBlock(blocks.touristExperience, false)
      : [];

    const paragraphs = outline
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((item) => {
        const sentencesCount = lengthToSentences(item.length, style.rhythm);
        const candidates = buildCandidates(
          item.id,
          item.topic,
          {
            passportSentences,
            historySentences,
            meaningSentences,
            legendsSentences,
            visualSentences,
            sensorySentences,
            touristSentences,
          },
          logicHints,
        );

        const selected = pickSentences(candidates, sentencesCount);
        const rawContent = selected.map(toSentence).join(" ").trim();
        const lexiconForParagraph = filterLexiconForParagraph(
          mergedLexicon,
          item.id,
          usedLexicon,
        );
        const transformed = applyKettyVoice(rawContent, lexiconForParagraph);
        const text = transformed || rawContent;
        trackLexiconUsage(text, lexiconForParagraph, usedLexicon);
        return {
          id: item.id,
          text,
        };
      });

    const contentFile = buildContentFile(paragraphs);

    return { contentFile };
  }
}

type SentencePools = {
  passportSentences: string[];
  historySentences: string[];
  meaningSentences: string[];
  legendsSentences: string[];
  visualSentences: string[];
  sensorySentences: string[];
  touristSentences: string[];
};

const buildCandidates = (
  paragraphId: number,
  topic: string,
  pools: SentencePools,
  logicHints: LogicHints,
): string[] => {
  const candidates: string[] = [];
  if (topic && topic.trim().length > 0) {
    candidates.push(topic.trim());
  }

  if (paragraphId === 1) {
    candidates.push(...pools.passportSentences, ...pools.visualSentences);
  } else if (paragraphId === 2) {
    candidates.push(...pools.historySentences, ...pools.meaningSentences);
  } else if (paragraphId === 3) {
    candidates.push(...pools.sensorySentences, ...pools.visualSentences);
  } else {
    candidates.push(
      ...pools.legendsSentences,
      ...pools.touristSentences,
      ...pools.meaningSentences,
    );
  }

  if (logicHints.useInGeneration) {
    if (paragraphId === 2) {
      candidates.push(...logicHints.comparisons);
    }
    if (paragraphId === 3) {
      candidates.push(...logicHints.childObservations);
    }
    if (paragraphId >= 4) {
      candidates.push(...logicHints.fantasyRules);
    }
  }

  return dedupeSentences(candidates);
};

const readLogicHints = (value: unknown): LogicHints => {
  if (!value || typeof value !== "object") {
    return {
      useInGeneration: false,
      comparisons: [],
      childObservations: [],
      fantasyRules: [],
    };
  }

  if (isLogicV2(value)) {
    return {
      useInGeneration: false,
      comparisons: [],
      childObservations: [],
      fantasyRules: [],
    };
  }

  const logic = value as {
    useInGeneration?: unknown;
    comparisons?: unknown;
    childObservations?: unknown;
    fantasyRules?: unknown;
  };

  return {
    useInGeneration: logic.useInGeneration === true,
    comparisons: readExamples(logic.comparisons),
    childObservations: readExamples(logic.childObservations),
    fantasyRules: readExamples(logic.fantasyRules),
  };
};

const isLogicV2 = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    "comfortPhrases" in candidate ||
    "childLogic" in candidate ||
    "attentionTriggers" in candidate ||
    "selfDescriptions" in candidate ||
    "adultDescriptions" in candidate
  );
};

const readExamples = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string") as string[];
  }
  if (!value || typeof value !== "object") return [];
  const examples = (value as { examples?: unknown }).examples;
  if (!Array.isArray(examples)) return [];
  return examples.filter((item) => typeof item === "string") as string[];
};

type LexiconUsage = {
  observations: Set<string>;
  comparisons: Set<string>;
  emotions: Set<string>;
  fantasies: Set<string>;
  connectors: Set<string>;
  fantasyCount: number;
};

const createLexiconUsage = (): LexiconUsage => {
  return {
    observations: new Set<string>(),
    comparisons: new Set<string>(),
    emotions: new Set<string>(),
    fantasies: new Set<string>(),
    connectors: new Set<string>(),
    fantasyCount: 0,
  };
};

const filterLexiconForParagraph = (
  lexicon: Lexicon | undefined,
  paragraphId: number,
  used: LexiconUsage,
): Lexicon | undefined => {
  if (!lexicon) return lexicon;

  const allowEveryOther = paragraphId % 2 === 1;
  const allowFantasy = paragraphId % 4 === 0 && used.fantasyCount < 1;

  return {
    ...lexicon,
    observations: allowEveryOther
      ? filterUnused(lexicon.observations, used.observations)
      : [],
    comparisons: allowEveryOther
      ? filterUnused(lexicon.comparisons, used.comparisons)
      : [],
    emotions: allowEveryOther
      ? filterUnused(lexicon.emotions, used.emotions)
      : [],
    fantasies: allowFantasy
      ? filterUnused(lexicon.fantasies, used.fantasies)
      : [],
    connectors: filterUnused(lexicon.connectors, used.connectors),
  };
};

const filterUnused = (
  items: string[] | undefined,
  used: Set<string>,
): string[] => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !used.has(item));
};

const trackLexiconUsage = (
  text: string,
  lexicon: Lexicon | undefined,
  used: LexiconUsage,
): void => {
  if (!lexicon) return;
  const lowered = text.toLowerCase();

  markUsed(lexicon.observations, lowered, used.observations);
  markUsed(lexicon.comparisons, lowered, used.comparisons);
  markUsed(lexicon.emotions, lowered, used.emotions);
  if (markUsed(lexicon.fantasies, lowered, used.fantasies)) {
    used.fantasyCount += 1;
  }
  markUsed(lexicon.connectors, lowered, used.connectors);
};

const markUsed = (
  items: string[] | undefined,
  text: string,
  used: Set<string>,
): boolean => {
  if (!Array.isArray(items)) return false;
  let matched = false;
  for (const item of items) {
    const candidate = item.trim().toLowerCase();
    if (!candidate) continue;
    if (text.includes(candidate)) {
      used.add(item);
      matched = true;
    }
  }
  return matched;
};

const parseBlock = (raw: string, keepKey: boolean): string[] => {
  const sentences: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = stripBulletPrefix(line);
    if (!trimmed) continue;

    const [key, value] = splitKeyValue(trimmed);
    if (value) {
      sentences.push(keepKey ? `${key}: ${value}` : value);
      continue;
    }

    if (!trimmed.includes(":")) {
      sentences.push(trimmed);
    }
  }
  return sentences.map((item) => normalizeSentence(item)).filter(Boolean);
};

const splitKeyValue = (value: string): [string, string] => {
  const index = value.indexOf(":");
  if (index === -1) return [value.trim(), ""];
  return [value.slice(0, index).trim(), value.slice(index + 1).trim()];
};

const stripBulletPrefix = (value: string): string => {
  return value.replace(/^\s*[•o\t]+\s*/i, "").trim();
};

const normalizeSentence = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const toSentence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
};

const lengthToSentences = (
  length: "short" | "medium" | "long",
  rhythm: string,
): number => {
  let base = length === "short" ? 2 : length === "medium" ? 3 : 4;
  if (rhythm === "быстрый") base = Math.max(2, base - 1);
  if (rhythm === "медленный") base += 1;
  return base;
};

const pickSentences = (items: string[], count: number): string[] => {
  if (items.length <= count) return items.slice(0, count);
  return items.slice(0, count);
};

const dedupeSentences = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const buildContentFile = (
  paragraphs: Array<{ id: number; text: string }>,
): string => {
  const sections = paragraphs.map((paragraph, index) => {
    const side = index % 2 === 0 ? "left" : "right";
    return `${paragraph.text}\n\n[[illustration:${paragraph.id}|${side}]]`;
  });

  return sections.join("\n\n").trim();
};
