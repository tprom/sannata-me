import {
  TranslatePostcardViewInput,
  TranslatePostcardViewOutput,
} from "../types/TranslatePostcardViewTypes";

export class TranslatePostcardView {
  async execute(
    input: TranslatePostcardViewInput,
  ): Promise<TranslatePostcardViewOutput> {
    const view = input.view;
    if (
      !view ||
      view.greeting == null ||
      view.stampImage == null ||
      view.contentFile == null ||
      view.footer == null
    ) {
      throw { type: "invalid_view" };
    }

    // TODO: integrate real translation API
    // TODO: handle language-specific formatting

    const hints = normalizeHints(input.context?.profile?.translationHints);

    const translations: Record<
      string,
      TranslatePostcardViewOutput["translations"][string]
    > = {};

    for (const lang of input.targetLanguages) {
      const greeting = applyHints(
        `[${lang}] placeholder: ${view.greeting}`,
        lang,
        hints,
      );
      const contentFile = applyHints(
        `[${lang}] placeholder: ${view.contentFile}`,
        lang,
        hints,
      );
      const footer = applyHints(
        `[${lang}] placeholder: ${view.footer}`,
        lang,
        hints,
      );

      translations[lang] = {
        greeting,
        stampImage: view.stampImage,
        contentFile,
        footer,
      };
    }

    return { translations };
  }
}

type TranslationHints = {
  glossary: Array<{
    source: string;
    target: Record<string, string>;
  }>;
  doNotTranslate: string[];
  toneHints: {
    tone?: string;
    style?: string;
    avoid?: string[];
    prefer?: string[];
  };
};

const normalizeHints = (value: unknown): TranslationHints => {
  if (!value || typeof value !== "object") {
    return { glossary: [], doNotTranslate: [], toneHints: {} };
  }

  const raw = value as {
    glossary?: unknown;
    doNotTranslate?: unknown;
    toneHints?: unknown;
  };

  const glossary = Array.isArray(raw.glossary)
    ? raw.glossary.filter((item) => typeof item === "object" && item !== null)
    : [];

  const normalizedGlossary = glossary
    .map((item) => {
      const entry = item as {
        source?: unknown;
        target?: unknown;
      };
      if (typeof entry.source !== "string") return null;
      if (!entry.target || typeof entry.target !== "object") return null;
      return {
        source: entry.source,
        target: entry.target as Record<string, string>,
      };
    })
    .filter(Boolean) as TranslationHints["glossary"];

  const doNotTranslate = Array.isArray(raw.doNotTranslate)
    ? raw.doNotTranslate.filter((item) => typeof item === "string")
    : [];

  const toneHints = normalizeToneHints(raw.toneHints);

  return {
    glossary: normalizedGlossary,
    doNotTranslate,
    toneHints,
  };
};

const applyHints = (
  text: string,
  lang: string,
  hints: TranslationHints,
): string => {
  const protectedText = protectDoNotTranslate(text, hints.doNotTranslate);
  let updated = protectedText.text;

  for (const entry of hints.glossary) {
    const source = entry.source;
    if (!source) continue;
    const replacement = entry.target?.[lang];
    if (!replacement) continue;
    updated = replaceToken(updated, source, replacement);
  }

  updated = restoreProtected(updated, protectedText.tokens);

  return updated;
};

const normalizeToneHints = (value: unknown): TranslationHints["toneHints"] => {
  if (!value || typeof value !== "object") return {};
  const raw = value as {
    tone?: unknown;
    style?: unknown;
    avoid?: unknown;
    prefer?: unknown;
  };

  return {
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    style: typeof raw.style === "string" ? raw.style : undefined,
    avoid: Array.isArray(raw.avoid)
      ? raw.avoid.filter((item) => typeof item === "string")
      : undefined,
    prefer: Array.isArray(raw.prefer)
      ? raw.prefer.filter((item) => typeof item === "string")
      : undefined,
  };
};

const applyToneHints = (
  hints: TranslationHints["toneHints"],
): string | null => {
  const parts: string[] = [];
  if (hints.tone) parts.push(`tone: ${hints.tone}`);
  if (hints.style) parts.push(`style: ${hints.style}`);
  if (Array.isArray(hints.prefer) && hints.prefer.length > 0) {
    parts.push(`prefer: ${hints.prefer.join(", ")}`);
  }
  if (Array.isArray(hints.avoid) && hints.avoid.length > 0) {
    parts.push(`avoid: ${hints.avoid.join(", ")}`);
  }
  if (parts.length === 0) return null;
  return parts.join("; ");
};

const protectDoNotTranslate = (
  text: string,
  phrases: string[],
): { text: string; tokens: Array<{ token: string; value: string }> } => {
  let updated = text;
  const tokens: Array<{ token: string; value: string }> = [];

  phrases
    .filter((item) => item && item.trim().length > 0)
    .sort((a, b) => b.length - a.length)
    .forEach((phrase, index) => {
      const token = `__DNT_${index}__`;
      const pattern = new RegExp(escapeRegExp(phrase), "gi");
      if (!pattern.test(updated)) return;
      updated = updated.replace(pattern, token);
      tokens.push({ token, value: phrase });
    });

  return { text: updated, tokens };
};

const restoreProtected = (
  text: string,
  tokens: Array<{ token: string; value: string }>,
): string => {
  let updated = text;
  for (const token of tokens) {
    const pattern = new RegExp(escapeRegExp(token.token), "g");
    updated = updated.replace(pattern, token.value);
  }
  return updated;
};

const getToneHintsForModel = (hints: TranslationHints): string | null => {
  const enabled = process.env.TRANSLATION_TONE_HINTS === "true";
  if (!enabled) return null;
  return applyToneHints(hints.toneHints);
};

const replaceToken = (text: string, source: string, target: string): string => {
  const pattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, "g");
  return text.replace(pattern, target);
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
