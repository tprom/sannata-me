import type {
  DiarySkills,
  LandmarkData,
  LandmarkSemanticProfile,
  NarrativeDictionary,
  NarrativeStyleProfile,
  ParagraphKind,
  DiaryParagraph,
} from "./types";

const FORBIDDEN_WORDS = [
  /собор/i,
  /башн/i,
  /витраж/i,
  /маяк/i,
  /море/i,
  /корабл/i,
  /волны/i,
];

export const createDiarySkills = (
  dictionary: NarrativeDictionary = {},
): DiarySkills => {
  const safeDictionary = sanitizeDictionary(dictionary);

  return {
    analyzeLandmarkData: async (input) => {
      const analysis = buildFallbackSemanticProfile(input.data);
      return { analysis };
    },
    selectNarrativeStyle: async (input) => {
      return { style: buildDiaryStyle(input.analysis.tone) };
    },
    planPostcardText: async (input) => {
      const topics = buildTopics(input.analysis);
      const outline = [
        {
          id: 1,
          kind: "intro" as ParagraphKind,
          topic: topics.intro,
          length: "medium" as const,
        },
        {
          id: 2,
          kind: "detail" as ParagraphKind,
          topic: topics.detail,
          length: "medium" as const,
        },
        {
          id: 3,
          kind: "history" as ParagraphKind,
          topic: topics.history,
          length: "medium" as const,
        },
        {
          id: 4,
          kind: "sensory" as ParagraphKind,
          topic: topics.sensory,
          length: "medium" as const,
        },
        {
          id: 5,
          kind: "fantasy" as ParagraphKind,
          topic: topics.fantasy,
          length: "short" as const,
        },
        {
          id: 6,
          kind: "closing" as ParagraphKind,
          topic: topics.closing,
          length: "short" as const,
        },
      ];
      return { outline };
    },
    generateParagraphs: async (input) => {
      const paragraphs = input.outline
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((item) => {
          const text = buildDiaryParagraph({
            kind: item.kind,
            analysis: input.analysis,
            dictionary: safeDictionary,
            seed: item.id + item.topic.length,
          });
          return {
            id: item.id,
            kind: item.kind,
            text,
          } satisfies DiaryParagraph;
        });
      return { contentFile: buildContentFile(paragraphs) };
    },
  };
};

const buildContentFile = (paragraphs: DiaryParagraph[]): string => {
  const sections = paragraphs.map((paragraph, index) => {
    const side = index % 2 === 0 ? "left" : "right";
    return `${paragraph.text}\n\n[[illustration:${paragraph.id}|${side}]]`;
  });
  return sections.join("\n\n").trim();
};

const buildDiaryStyle = (tone: string): NarrativeStyleProfile => {
  const normalized = tone.toLowerCase();
  const emotionalIntensity =
    normalized === "торжественный"
      ? "высокая"
      : normalized === "спокойный"
        ? "низкая"
        : "средняя";
  return {
    narrativeType: "ketty_diary",
    emotionalIntensity,
    rhythm: "сбалансированный",
    voice: "первое лицо",
    constraints: [
      "детская речь",
      "простые предложения",
      "лёгкий юмор",
      "наивные наблюдения",
      "без сложных терминов",
    ],
  };
};

const buildFallbackSemanticProfile = (
  data: LandmarkData,
): LandmarkSemanticProfile => {
  return {
    character: "большое место",
    tone: "нейтральный",
    atmosphere: "тихо и интересно",
    visual: ["каменные формы", "старые ступени", "арки"],
    historicalWeight: "важный культурный объект",
    risks: [],
    visualHighlights: ["каменные формы", "арки"],
    historicalHighlights: ["давние истории"],
    legends: ["легенда"],
    touristMotifs: ["прогулка", "виды"],
  };
};

const buildTopics = (
  analysis: LandmarkSemanticProfile,
): {
  intro: string;
  detail: string;
  history: string;
  sensory: string;
  fantasy: string;
  closing: string;
} => {
  return {
    intro: "Я увидела место и удивилась",
    detail: "Я заметила детали и улыбнулась",
    history: "Мне рассказали короткую историю",
    sensory: "Там было тихо и интересно",
    fantasy: "Мне показалось что-то волшебное",
    closing: "Я уходила и улыбалась",
  };
};

const buildDiaryParagraph = (input: {
  kind: ParagraphKind;
  analysis: LandmarkSemanticProfile;
  dictionary: NarrativeDictionary;
  seed: number;
}): string => {
  const { analysis, dictionary } = input;
  const noun = pickNoun(analysis.character, analysis.visualHighlights);
  const visual = pickNoun(analysis.visualHighlights.join(" "), []);
  const history = pickNoun(analysis.historicalHighlights.join(" "), [
    "истории",
  ]);
  const legend = pickNoun(analysis.legends.join(" "), []);
  const tourist = pickNoun(analysis.touristMotifs.join(" "), ["люди", "дети"]);

  if (input.kind === "intro") {
    const intro = pickFromSet(
      dictionary.introSet,
      input.seed,
      "Мы подошли, и мне стало интересно",
    );
    const detail = pickFromSet(
      dictionary.detailSet,
      input.seed + 1,
      "Я заметила кое-что важное",
    );
    const compare = pickFromSet(
      dictionary.compareSet,
      input.seed + 2,
      "Это было как маленькое приключение",
    );
    const fantasy = pickFromSet(
      dictionary.fantasySet,
      input.seed + 3,
      "ветер шепнул привет",
    );
    return [
      `${intro}, и рядом был ${noun}.`,
      `${detail}, особенно ${visual}.`,
      `${compare}.`,
      `${fantasy}.`,
    ]
      .map((sentence) => capitalizeSentence(sentence))
      .join(" ")
      .trim();
  }

  if (input.kind === "history") {
    const emotion = pickFromSet(
      dictionary.emotionSet,
      input.seed + 4,
      "мне казалось",
    );
    return [
      `Мне рассказали про старые времена и ${history}.`,
      `${emotion}, что место умеет ждать и помнить.`,
      `Я представила, как всё это однажды начиналось.`,
    ]
      .map((sentence) => capitalizeSentence(sentence))
      .join(" ");
  }

  if (input.kind === "detail") {
    const detail = pickFromSet(
      dictionary.detailSet,
      input.seed + 9,
      "Я заметила кое-что важное",
    );
    const compare = pickFromSet(
      dictionary.compareSet,
      input.seed + 10,
      "Это было как маленькое приключение",
    );
    return [
      `${detail}, особенно ${visual}.`,
      `${compare}.`,
      `Я хотела рассмотреть всё ещё ближе.`,
    ]
      .map((sentence) => capitalizeSentence(sentence))
      .join(" ");
  }

  if (input.kind === "sensory") {
    const compare = pickFromSet(
      dictionary.compareSet,
      input.seed + 5,
      "Тени прыгали, как зайчики",
    );
    const emotion = pickFromSet(
      dictionary.emotionSet,
      input.seed + 6,
      "мне казалось",
    );
    return [
      `Там было ${rewriteAtmosphere(analysis.atmosphere)}, и я слушала воздух.`,
      `${compare}.`,
      `${emotion}, что камни тоже слушают.`,
    ]
      .map((sentence) => capitalizeSentence(sentence))
      .join(" ");
  }

  if (input.kind === "fantasy") {
    const fantasy = pickFromSet(
      dictionary.fantasySet,
      input.seed + 11,
      "ветер передал привет",
    );
    const emotion = pickFromSet(
      dictionary.emotionSet,
      input.seed + 12,
      "мне казалось",
    );
    return [
      `${fantasy}.`,
      `${emotion}, что ${tourist} улыбается где-то рядом.`,
      `Я тихо хихикнула и пошла дальше.`,
    ]
      .map((sentence) => capitalizeSentence(sentence))
      .join(" ");
  }

  const closing = pickFromSet(
    dictionary.closingSet,
    input.seed + 7,
    "Мне было жалко уходить оттуда так рано",
  );
  const fantasy = pickFromSet(
    dictionary.fantasySet,
    input.seed + 8,
    "ветер передал привет",
  );
  return [
    `${closing}.`,
    `Я запомнила ${tourist} и одну легенду.`,
    `${fantasy}.`,
  ]
    .map((sentence) => capitalizeSentence(sentence))
    .join(" ");
};

const sanitizeDictionary = (
  dictionary: NarrativeDictionary,
): NarrativeDictionary => {
  return {
    detailOpeners: filterSet(dictionary.detailOpeners),
    detailTails: filterSet(dictionary.detailTails),
    introSet: filterSet(dictionary.introSet),
    scaleSet: filterSet(dictionary.scaleSet),
    detailSet: filterSet(dictionary.detailSet),
    atmosphereSet: filterSet(dictionary.atmosphereSet),
    compareSet: filterSet(dictionary.compareSet),
    historySet: filterSet(dictionary.historySet),
    closingSet: filterSet(dictionary.closingSet),
    fantasySet: filterSet(dictionary.fantasySet),
    emotionSet: filterSet(dictionary.emotionSet),
  };
};

const filterSet = (items?: string[]): string[] | undefined => {
  if (!items) return items;
  return items.filter(
    (item) => !FORBIDDEN_WORDS.some((word) => word.test(item)),
  );
};

const pickFromSet = (
  items: string[] | undefined,
  seed: number,
  fallback: string,
): string => {
  const pool = items && items.length > 0 ? items : [fallback];
  const index = Math.abs(seed) % pool.length;
  return pool[index];
};

const pickNoun = (source: string, fallbackTokens: string[]): string => {
  const tokens = extractTokens(source);
  const preferred = tokens.filter(
    (token) => !isAdjective(token) && !isVerbLike(token),
  );
  const merged =
    preferred.length > 0
      ? preferred
      : tokens.length > 0
        ? tokens
        : fallbackTokens;
  return merged[0] ?? "место";
};

const rewriteAtmosphere = (text: string): string => {
  const tokens = extractTokens(text).slice(0, 3);
  if (tokens.length === 0) return "спокойно";
  return tokens.join(" и ");
};

const extractTokens = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-zа-яё\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !FORBIDDEN_WORDS.some((rule) => rule.test(word)));

  const stopWords = new Set([
    "очень",
    "который",
    "которые",
    "потому",
    "когда",
    "рядом",
    "среди",
    "находится",
    "много",
    "многое",
    "вокруг",
    "место",
    "город",
    "история",
    "время",
  ]);

  const result: string[] = [];
  for (const word of words) {
    if (stopWords.has(word)) continue;
    if (isVerbLike(word)) continue;
    if (result.includes(word)) continue;
    result.push(word);
    if (result.length >= 8) break;
  }
  return result;
};

const isAdjective = (word: string): boolean => {
  return /(ый|ий|ая|ое|ые|ие|ой|ая|яя|ее|ого|ему|ым|ими)$/.test(word);
};

const isVerbLike = (word: string): boolean => {
  return /(ют|ают|яют|ят|ет|ит|ишь|ешь)$/.test(word);
};

const capitalizeSentence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const shortenPhrase = (text: string, wordsCount: number): string => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, wordsCount).join(" ");
};
