export interface ChildDictionary {
  introSet: string[];
  detailSet: string[];
  compareSet: string[];
  emotionSet: string[];
  fantasySet: string[];
  sensorySet: string[];
  observationSet: string[];
  transitionSet: string[];
  closingSet: string[];
  childErrors: string[];
  childLogic: string[];
  childQuestions: string[];
}

// --- PRIORITY HELPERS -------------------------------------------------------

function isQuestion(sentence: string): boolean {
  return sentence.trim().endsWith("?");
}

function isLogic(sentence: string): boolean {
  return sentence.includes("если") && sentence.includes("значит");
}

function isFantasy(sentence: string): boolean {
  return (
    sentence.includes("как будто") ||
    sentence.includes("будто") ||
    sentence.includes("мне показалось") ||
    sentence.includes("ожило") ||
    sentence.includes("шепчет") ||
    sentence.includes("говорит") ||
    sentence.includes("живёт") ||
    sentence.includes("живет")
  );
}

function isEmotion(sentence: string): boolean {
  return (
    sentence.includes("я испугалась") ||
    sentence.includes("я обрадовалась") ||
    sentence.includes("мне стало") ||
    sentence.includes("я почувствовала") ||
    sentence.includes("мне понравилось")
  );
}

function isCompare(sentence: string): boolean {
  return (
    sentence.includes(" как ") ||
    sentence.startsWith("как ") ||
    sentence.includes("словно")
  );
}

function isSensory(sentence: string): boolean {
  return (
    sentence.includes("тихо") ||
    sentence.includes("прохладно") ||
    sentence.includes("тепло") ||
    sentence.includes("запах") ||
    sentence.includes("звук") ||
    sentence.includes("свет") ||
    sentence.includes("шептала")
  );
}

function isObservation(sentence: string): boolean {
  return (
    sentence.startsWith("я заметила") ||
    sentence.startsWith("я увидела") ||
    sentence.startsWith("а ещё я") ||
    sentence.startsWith("а еще я")
  );
}

function isDetail(sentence: string): boolean {
  return (
    sentence.includes("большой") ||
    sentence.includes("маленький") ||
    sentence.includes("высокий") ||
    sentence.includes("цвет") ||
    sentence.includes("узор") ||
    sentence.includes("линии") ||
    sentence.includes("камн") ||
    sentence.includes("окн")
  );
}

function isIntro(sentence: string): boolean {
  return (
    sentence.startsWith("сегодня") ||
    sentence.startsWith("сначала") ||
    sentence.startsWith("интересно") ||
    sentence.startsWith("мне кажется") ||
    sentence.startsWith("а ещё") ||
    sentence.startsWith("а еще") ||
    sentence.startsWith("я подумала") ||
    sentence.startsWith("я увидела")
  );
}

function isTransition(sentence: string): boolean {
  return (
    sentence.startsWith("а потом") ||
    sentence.startsWith("и ещё") ||
    sentence.startsWith("и еще") ||
    sentence.startsWith("и самое смешное") ||
    sentence.startsWith("а дальше")
  );
}

function isClosing(sentence: string): boolean {
  return (
    sentence.endsWith("вот такой был мой день") ||
    sentence.endsWith("мне понравилось") ||
    sentence.endsWith("я была рада") ||
    sentence.endsWith("я вернусь")
  );
}

function hasErrors(sentence: string): boolean {
  const words = sentence.split(/\s+/);
  for (let i = 0; i < words.length - 1; i += 1) {
    if (words[i] === words[i + 1]) return true;
  }
  if (words.length > 18) return true;
  if (sentence.includes(" что") && !sentence.includes(", что")) return true;
  if (sentence.includes(" потому что") && !sentence.includes(", потому что"))
    return true;
  return false;
}

function normalizeQuotes(text: string): string {
  return text.replace(/[«»„“”‘’‚‟]/g, '"');
}

function splitSentences(
  text: string,
  fantasyTokens: string[],
  emotionTokens: string[],
): string[] {
  const result: string[] = [];
  let buffer = "";

  const isUpper = (value: string | undefined) =>
    Boolean(value && /[A-ZА-ЯЁ]/.test(value));
  const isLower = (value: string | undefined) =>
    Boolean(value && /[a-zа-яё]/.test(value));

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (text.slice(i, i + 3) === "...") {
      buffer += "...";
      const after = text[i + 3];
      const afterSpace = after === " " ? text[i + 4] : undefined;
      const afterIsQuote = after === '"' || afterSpace === '"';
      const shouldBoundary =
        !afterIsQuote &&
        Boolean(after) &&
        (isUpper(after) ||
          (after === " " && (isUpper(afterSpace) || isLower(afterSpace))));

      if (shouldBoundary) {
        const lowerBuffer = buffer.toLowerCase();
        const hasFantasy = fantasyTokens.some((token) =>
          lowerBuffer.includes(token),
        );
        const hasEmotion = emotionTokens.some((token) =>
          lowerBuffer.includes(token),
        );

        if (!hasFantasy && !hasEmotion) {
          const trimmed = buffer.trim();
          if (trimmed) {
            result.push(trimmed);
          }
          buffer = "";
        }
      }

      i += 2;
      if (shouldBoundary && text[i + 1] === " ") {
        i += 1;
      }
      continue;
    }

    buffer += char;
    if (
      (char === "." || char === "!" || char === "?") &&
      (next === " " || !next)
    ) {
      const trimmed = buffer.trim();
      if (trimmed) {
        result.push(trimmed);
      }
      buffer = "";
      if (next === " ") {
        i += 1;
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    result.push(tail);
  }

  return result;
}

// --- MAIN CLASSIFICATION ----------------------------------------------------

export function extractChildPatterns(
  inputText: string,
  dictionary: ChildDictionary,
): ChildDictionary {
  const normalizedText = normalizeQuotes(inputText).replace(/\s+/g, " ").trim();
  const sentences = splitSentences(
    normalizedText,
    [
      "как будто",
      "будто",
      "мне показалось",
      "ожило",
      "шепчет",
      "говорит",
      "живёт",
      "живет",
    ],
    [
      "я испугалась",
      "я обрадовалась",
      "мне стало",
      "я почувствовала",
      "мне понравилось",
    ],
  );

  for (const sentence of sentences) {
    const s = sentence;
    const lower = sentence.toLowerCase();

    // PRIORITY 1 — QUESTIONS
    if (isQuestion(lower)) {
      dictionary.childQuestions.push(s);
      continue; // STOP — no intro/detail/transition
    }

    // PRIORITY 2 — LOGIC
    if (isLogic(lower)) {
      dictionary.childLogic.push(s);
      if (hasErrors(lower)) dictionary.childErrors.push(s);
      continue; // STOP — no other categories
    }

    // PRIORITY 3 — FANTASY
    if (isFantasy(lower)) {
      dictionary.fantasySet.push(s);
      if (isEmotion(lower)) dictionary.emotionSet.push(s);
      continue; // STOP — fantasy overrides compare/sensory/detail/etc.
    }

    // PRIORITY 4 — ERRORS
    if (hasErrors(lower)) {
      dictionary.childErrors.push(s);
      // errors do NOT block logic/questions (already handled)
      // but DO block all other categories
      continue;
    }

    // PRIORITY 5 — EMOTION
    if (isEmotion(lower)) {
      dictionary.emotionSet.push(s);
      // emotion does NOT block compare/sensory/etc.
    }

    // PRIORITY 6 — COMPARE (but NOT fantasy)
    if (isCompare(lower) && !isFantasy(lower)) {
      dictionary.compareSet.push(s);
    }

    // PRIORITY 7 — SENSORY (but NOT fantasy/logic)
    if (isSensory(lower)) {
      dictionary.sensorySet.push(s);
    }

    // PRIORITY 8 — OBSERVATION
    if (isObservation(lower)) {
      dictionary.observationSet.push(s);
    }

    // PRIORITY 9 — DETAIL
    if (isDetail(lower)) {
      dictionary.detailSet.push(s);
    }

    // PRIORITY 10 — INTRO (but NOT questions/fantasy/logic)
    if (isIntro(lower)) {
      dictionary.introSet.push(s);
    }

    // PRIORITY 11 — TRANSITION (only short sentences)
    if (isTransition(lower) && s.split(/\s+/).length <= 15) {
      dictionary.transitionSet.push(s);
    }

    // PRIORITY 12 — CLOSING
    if (isClosing(lower)) {
      dictionary.closingSet.push(s);
    }
  }

  // Remove duplicates
  for (const key of Object.keys(dictionary) as Array<keyof ChildDictionary>) {
    const value = dictionary[key];
    if (Array.isArray(value)) {
      dictionary[key] = [...new Set(value)];
    }
  }

  return dictionary;
}
