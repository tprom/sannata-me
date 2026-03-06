import type { Lexicon } from "../types/PersonaTypes";
import { resolveLegacyLexicon } from "./textLayers";

type NormalizedLexicon = {
  replacements: Array<{ from: string; to: string }>;
  observations: string[];
  comparisons: string[];
  emotions: string[];
  fantasies: string[];
  connectors: string[];
};

export const applyLexicon = (text: string, lexicon?: Lexicon): string => {
  if (!text) return text;
  const resolved = resolveLegacyLexicon(lexicon) ?? lexicon;
  const normalized = normalizeLexicon(resolved);
  if (isLexiconEmpty(normalized)) return text;

  let updated = applyReplacements(text, normalized.replacements);
  updated = applyConnector(updated, normalized.connectors);
  updated = appendIfMissing(updated, normalized.observations);
  updated = appendIfMissing(updated, normalized.comparisons);
  updated = appendIfMissing(updated, normalized.emotions);
  updated = appendIfMissing(updated, normalized.fantasies);

  return updated.trim();
};

const normalizeLexicon = (lexicon?: Lexicon): NormalizedLexicon => {
  return {
    replacements: Array.isArray(lexicon?.replacements)
      ? lexicon?.replacements
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

const applyReplacements = (
  text: string,
  replacements: Array<{ from: string; to: string }>,
): string => {
  let updated = text;
  for (const item of replacements) {
    if (!item.from) continue;
    updated = replaceToken(updated, item.from, item.to);
  }
  return updated;
};

const applyConnector = (text: string, connectors: string[]): string => {
  if (!text || connectors.length === 0) return text;
  const connector = connectors[0];
  if (!connector) return text;
  if (text.toLowerCase().startsWith(connector.toLowerCase())) return text;
  return `${connector} ${text}`.trim();
};

const appendIfMissing = (text: string, items: string[]): string => {
  if (!text || items.length === 0) return text;
  const lowered = text.toLowerCase();
  const candidate = items.find((item) => !lowered.includes(item.toLowerCase()));
  if (!candidate) return text;
  return `${text} ${candidate}`.trim();
};

const replaceToken = (text: string, source: string, target: string): string => {
  const pattern = new RegExp(escapeRegExp(source), "g");
  return text.replace(pattern, target);
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
