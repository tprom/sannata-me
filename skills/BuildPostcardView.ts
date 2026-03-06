import {
  BuildPostcardViewInput,
  BuildPostcardViewOutput,
} from "../types/BuildPostcardViewTypes";

export class BuildPostcardView {
  async execute(
    input: BuildPostcardViewInput,
  ): Promise<BuildPostcardViewOutput> {
    const postcard = input.postcardJson as Record<string, unknown>;
    const greeting = postcard?.greeting as string | undefined;
    const footer = postcard?.footer as string | undefined;
    const contentFile = postcard?.contentFile as string | undefined;
    const visuals = postcard?.visuals as Record<string, unknown> | undefined;
    const illustrations = visuals?.illustrations as
      | Array<{
          paragraphId: number;
          imagePath: string;
        }>
      | undefined;
    const stamp = visuals?.stamp as { imagePath: string } | undefined;

    if (
      greeting == null ||
      footer == null ||
      contentFile == null ||
      !illustrations ||
      !stamp
    ) {
      throw { type: "invalid_postcard_json" };
    }

    const resolvedContentFile = injectIllustrations(contentFile, illustrations);
    const adapted = adaptTextWithProfile(
      {
        greeting,
        contentFile: resolvedContentFile,
        footer,
      },
      input.context?.profile?.text?.style,
    );

    return {
      view: {
        greeting: adapted.greeting,
        stampImage: stamp.imagePath,
        contentFile: adapted.contentFile,
        footer: adapted.footer,
      },
    };
  }
}

const adaptTextWithProfile = (
  base: { greeting: string; contentFile: string; footer: string },
  style: unknown,
): { greeting: string; contentFile: string; footer: string } => {
  const mapping = readLexiconMapping(style);
  if (!mapping) return base;

  return {
    greeting: applyMapping(base.greeting, mapping),
    contentFile: applyMapping(base.contentFile, mapping, true),
    footer: applyMapping(base.footer, mapping),
  };
};

const readLexiconMapping = (
  style: unknown,
): Array<{ from: string; to: string }> | null => {
  if (!style || typeof style !== "object") return null;
  const lexicon = (style as { lexicon?: unknown }).lexicon;
  if (!lexicon || typeof lexicon !== "object") return null;

  const preferred = (lexicon as { preferredWords?: unknown }).preferredWords;
  const forbidden = (lexicon as { forbiddenWords?: unknown }).forbiddenWords;

  if (!Array.isArray(preferred) || !Array.isArray(forbidden)) return null;
  if (preferred.length === 0 || preferred.length !== forbidden.length) {
    return null;
  }

  const pairs: Array<{ from: string; to: string }> = [];
  for (let index = 0; index < preferred.length; index += 1) {
    const to = preferred[index];
    const from = forbidden[index];
    if (typeof to !== "string" || typeof from !== "string") return null;
    const cleanedFrom = from.trim();
    const cleanedTo = to.trim();
    if (!cleanedFrom || !cleanedTo) return null;
    pairs.push({ from: cleanedFrom, to: cleanedTo });
  }

  return pairs;
};

const applyMapping = (
  text: string,
  mapping: Array<{ from: string; to: string }>,
  protectIllustrations = false,
): string => {
  if (!text) return text;
  const protectedText = protectIllustrations
    ? protectTokens(text, /\[\[illustration:[^\]]+\]\]/gi)
    : { text, tokens: [] as Array<{ token: string; value: string }> };

  let updated = protectedText.text;
  for (const pair of mapping) {
    updated = replaceToken(updated, pair.from, pair.to);
  }

  return restoreTokens(updated, protectedText.tokens);
};

const protectTokens = (
  text: string,
  pattern: RegExp,
): { text: string; tokens: Array<{ token: string; value: string }> } => {
  let updated = text;
  const tokens: Array<{ token: string; value: string }> = [];
  let index = 0;

  updated = updated.replace(pattern, (match) => {
    const token = `__PRESERVE_${index}__`;
    tokens.push({ token, value: match });
    index += 1;
    return token;
  });

  return { text: updated, tokens };
};

const restoreTokens = (
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

const replaceToken = (text: string, source: string, target: string): string => {
  const pattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, "g");
  return text.replace(pattern, target);
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const injectIllustrations = (
  contentFile: string,
  illustrations: Array<{ paragraphId: number; imagePath: string }>,
): string => {
  if (!contentFile) return "";
  const lookup = new Map<string, string>();
  for (const item of illustrations) {
    lookup.set(String(item.paragraphId), item.imagePath);
  }

  return contentFile.replace(
    /\[\[illustration:([^\]|]+)(?:\|([^\]]+))?\]\]/gi,
    (_, id: string, side?: string) => {
      const key = String(id).trim();
      const imagePath = lookup.get(key);
      if (!imagePath) return "";
      const resolvedSide = side ? side.trim() : "left";
      return `[[illustration:${imagePath}|${resolvedSide}]]`;
    },
  );
};
