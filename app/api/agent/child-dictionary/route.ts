import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  extractChildPatterns,
  type ChildDictionary,
} from "@/skills/extractChildPatterns";
import { ensureAgentApiAccess } from "@/lib/security/agent-auth";

type RequestBody = {
  text?: string;
};

type ChildDictionaryFile = Partial<ChildDictionary> & {
  meta?: {
    version?: string;
    language?: string;
    character?: string;
    description?: string;
  };
};

type LexiconReplacement = {
  from: string;
  to: string;
};

type LexiconFile = {
  replacements: LexiconReplacement[];
  observations: string[];
  comparisons: string[];
  emotions: string[];
  fantasies: string[];
  connectors: string[];
};

const emptyDictionary = (): ChildDictionary => ({
  introSet: [],
  detailSet: [],
  compareSet: [],
  emotionSet: [],
  fantasySet: [],
  sensorySet: [],
  observationSet: [],
  transitionSet: [],
  closingSet: [],
  childErrors: [],
  childLogic: [],
  childQuestions: [],
});

const normalizeDictionary = (data: ChildDictionaryFile): ChildDictionary => {
  const base = emptyDictionary();
  return {
    introSet: Array.isArray(data.introSet) ? data.introSet : base.introSet,
    detailSet: Array.isArray(data.detailSet) ? data.detailSet : base.detailSet,
    compareSet: Array.isArray(data.compareSet)
      ? data.compareSet
      : base.compareSet,
    emotionSet: Array.isArray(data.emotionSet)
      ? data.emotionSet
      : base.emotionSet,
    fantasySet: Array.isArray(data.fantasySet)
      ? data.fantasySet
      : base.fantasySet,
    sensorySet: Array.isArray(data.sensorySet)
      ? data.sensorySet
      : base.sensorySet,
    observationSet: Array.isArray(data.observationSet)
      ? data.observationSet
      : base.observationSet,
    transitionSet: Array.isArray(data.transitionSet)
      ? data.transitionSet
      : base.transitionSet,
    closingSet: Array.isArray(data.closingSet)
      ? data.closingSet
      : base.closingSet,
    childErrors: Array.isArray(data.childErrors)
      ? data.childErrors
      : base.childErrors,
    childLogic: Array.isArray(data.childLogic)
      ? data.childLogic
      : base.childLogic,
    childQuestions: Array.isArray(data.childQuestions)
      ? data.childQuestions
      : base.childQuestions,
  };
};

export async function POST(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const body = (await request.json()) as RequestBody;
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json(
      { ok: false, message: "Текст не передан." },
      { status: 400 },
    );
  }

  const filePath = path.join(
    process.cwd(),
    "personas",
    "ketty",
    "text.lexicon.json",
  );

  let storedLexicon: Partial<LexiconFile> = {};
  try {
    const content = await fs.readFile(filePath, "utf8");
    storedLexicon = JSON.parse(content) as Partial<LexiconFile>;
  } catch (error) {
    storedLexicon = {};
  }

  const lexicon = normalizeLexicon(storedLexicon);
  const dictionary = lexiconToDictionary(lexicon);
  const updated = extractChildPatterns(text, dictionary);

  const nextLexicon = dictionaryToLexicon(updated, lexicon);
  await fs.writeFile(filePath, JSON.stringify(nextLexicon, null, 2));

  return NextResponse.json({
    ok: true,
    message: "Словарь обновлен.",
  });
}

const normalizeLexicon = (data: Partial<LexiconFile>): LexiconFile => {
  return {
    replacements: Array.isArray(data.replacements)
      ? data.replacements
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const entry = item as { from?: unknown; to?: unknown };
            return {
              from: typeof entry.from === "string" ? entry.from : "",
              to: typeof entry.to === "string" ? entry.to : "",
            };
          })
          .filter((item) => item.from.trim().length > 0)
      : [],
    observations: normalizeList(data.observations),
    comparisons: normalizeList(data.comparisons),
    emotions: normalizeList(data.emotions),
    fantasies: normalizeList(data.fantasies),
    connectors: normalizeList(data.connectors),
  };
};

const normalizeList = (value?: string[]): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item.trim()).filter(Boolean);
};

const lexiconToDictionary = (lexicon: LexiconFile): ChildDictionary => {
  return {
    introSet: lexicon.connectors,
    detailSet: lexicon.observations,
    compareSet: lexicon.comparisons,
    emotionSet: lexicon.emotions,
    fantasySet: lexicon.fantasies,
    sensorySet: [],
    observationSet: [],
    transitionSet: lexicon.connectors,
    closingSet: lexicon.connectors,
    childErrors: lexicon.replacements.map((item) => item.from),
    childLogic: [],
    childQuestions: [],
  };
};

const dictionaryToLexicon = (
  dictionary: ChildDictionary,
  base: LexiconFile,
): LexiconFile => {
  const observations = mergeLists(
    base.observations,
    dictionary.detailSet,
    dictionary.observationSet,
    dictionary.sensorySet,
    dictionary.childLogic,
    dictionary.childQuestions,
  );
  const connectors = mergeLists(
    base.connectors,
    dictionary.introSet,
    dictionary.transitionSet,
    dictionary.closingSet,
  );
  const comparisons = mergeLists(base.comparisons, dictionary.compareSet);
  const emotions = mergeLists(base.emotions, dictionary.emotionSet);
  const fantasies = mergeLists(base.fantasies, dictionary.fantasySet);
  const replacements = mergeReplacements(
    base.replacements,
    dictionary.childErrors,
  );

  return {
    replacements,
    observations,
    comparisons,
    emotions,
    fantasies,
    connectors,
  };
};

const mergeLists = (...lists: string[][]): string[] => {
  const result = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      const trimmed = item.trim();
      if (trimmed) result.add(trimmed);
    }
  }
  return Array.from(result);
};

const mergeReplacements = (
  existing: LexiconReplacement[],
  errors: string[],
): LexiconReplacement[] => {
  const replacements = new Map<string, string>();
  for (const item of existing) {
    if (item.from.trim().length > 0) {
      replacements.set(item.from.trim(), item.to);
    }
  }
  for (const error of errors) {
    const trimmed = error.trim();
    if (!trimmed) continue;
    if (!replacements.has(trimmed)) {
      replacements.set(trimmed, "");
    }
  }

  return Array.from(replacements.entries()).map(([from, to]) => ({
    from,
    to,
  }));
};
