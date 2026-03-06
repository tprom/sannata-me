import type {
  DepthAliases,
  DepthGroup,
  DepthLevel,
  LexiconReplacement,
  Lexicon,
  LexiconV2,
  LogicV2,
  StyleV2,
  TextMeta,
  TextMode,
  UsageLayer,
  UsageV2,
} from "../types/PersonaTypes";

const DEFAULT_ALIASES: DepthAliases = {
  light: ["basic", "lite", "low", "L1", "shallow", "surface", "simple"],
  medium: ["normal", "mid", "middle", "moderate", "personal", "L2", "story"],
  deep: ["poetic", "deepest", "high", "full", "L3", "advanced"],
};

const DEFAULT_FALLBACK: DepthLevel = "medium";

const DEFAULT_USAGE: UsageV2 = {
  meta: {
    aliasesRef: "./aliases.json",
    fallback: "medium",
    unknownLevelPolicy: "warn",
  },
  modes: {
    postcard: {
      allow: {
        lexicon: {
          connectors: ["light"],
          beginnings: ["light"],
          endings: ["light"],
          questions: ["light"],
          microReactions: ["light"],
        },
      },
      deny: {
        logic: {
          innerMonologue: ["light", "medium", "deep"],
          comfortPhrases: ["light", "medium", "deep"],
          childLogic: ["light", "medium", "deep"],
          attentionTriggers: ["light", "medium", "deep"],
          logicTriggers: ["light", "medium", "deep"],
          observations: ["light", "medium", "deep"],
          emotions: ["light", "medium", "deep"],
          selfDescriptions: ["light", "medium", "deep"],
          adultDescriptions: ["light", "medium", "deep"],
        },
        style: {
          poeticFormulas: ["light", "medium", "deep"],
          fantasies: ["light", "medium", "deep"],
          comparisons: ["light", "medium", "deep"],
          observations: ["light", "medium", "deep"],
          emotions: ["light", "medium", "deep"],
        },
      },
    },
    diary: {
      allow: {
        lexicon: {
          connectors: ["light", "medium"],
          beginnings: ["light", "medium"],
          endings: ["light", "medium"],
          questions: ["light", "medium"],
          microReactions: ["light", "medium"],
        },
        logic: {
          innerMonologue: ["light", "medium"],
          comfortPhrases: ["light", "medium"],
          childLogic: ["light", "medium"],
          attentionTriggers: ["light", "medium"],
          logicTriggers: ["light", "medium"],
          observations: ["light", "medium"],
          emotions: ["light", "medium"],
          selfDescriptions: ["light", "medium"],
          adultDescriptions: ["light", "medium"],
        },
      },
      deny: {
        style: {
          poeticFormulas: ["light", "medium", "deep"],
          fantasies: ["light", "medium", "deep"],
          comparisons: ["light", "medium", "deep"],
          observations: ["light", "medium", "deep"],
          emotions: ["light", "medium", "deep"],
        },
      },
    },
    kettyStory: {
      allow: {
        lexicon: {
          connectors: ["light", "medium", "deep"],
          beginnings: ["light", "medium", "deep"],
          endings: ["light", "medium", "deep"],
          questions: ["light", "medium", "deep"],
          microReactions: ["light", "medium", "deep"],
        },
        logic: {
          innerMonologue: ["light", "medium", "deep"],
          comfortPhrases: ["light", "medium", "deep"],
          childLogic: ["light", "medium", "deep"],
          attentionTriggers: ["light", "medium", "deep"],
          logicTriggers: ["light", "medium", "deep"],
          observations: ["light", "medium", "deep"],
          emotions: ["light", "medium", "deep"],
          selfDescriptions: ["light", "medium", "deep"],
          adultDescriptions: ["light", "medium", "deep"],
        },
        style: {
          poeticFormulas: ["light", "medium", "deep"],
          fantasies: ["light", "medium", "deep"],
          comparisons: ["light", "medium", "deep"],
          observations: ["light", "medium", "deep"],
          emotions: ["light", "medium", "deep"],
        },
      },
    },
  },
};

export const resolveLegacyLexicon = (
  lexicon: unknown,
  usage?: unknown,
  mode: TextMode = "postcard",
  aliases?: unknown,
): Lexicon | undefined => {
  if (!lexicon || typeof lexicon !== "object") return undefined;
  if (isLegacyLexicon(lexicon)) return lexicon;
  if (!isLexiconV2(lexicon)) return undefined;

  const usageMap = isUsageV2(usage) ? usage : DEFAULT_USAGE;
  const resolvedAliases = resolveAliases(lexicon.meta, aliases, usageMap.meta);

  return buildLegacyLexiconFromV2(lexicon, usageMap, mode, resolvedAliases);
};

export const resolveLexiconForMode = (
  text:
    | {
        lexicon?: unknown;
        usage?: unknown;
        aliases?: unknown;
        logic?: unknown;
        style?: unknown;
      }
    | null
    | undefined,
  mode: TextMode,
): Lexicon | undefined => {
  if (!text) return undefined;
  return resolveLegacyLexicon(text.lexicon, text.usage, mode, text.aliases);
};

type TextLayerAdditions = {
  replacements: LexiconReplacement[];
  observations: string[];
  comparisons: string[];
  emotions: string[];
  fantasies: string[];
};

export const resolveTextAdditionsForMode = (
  text:
    | {
        lexicon?: unknown;
        usage?: unknown;
        aliases?: unknown;
        logic?: unknown;
        style?: unknown;
      }
    | null
    | undefined,
  mode: TextMode,
): TextLayerAdditions => {
  if (!text) return emptyAdditions();

  const usageMap = isUsageV2(text.usage) ? text.usage : DEFAULT_USAGE;
  const logicMeta = (text.logic as LogicV2 | undefined)?.meta;
  const styleMeta = (text.style as StyleV2 | undefined)?.meta;
  const resolvedAliases = resolveAliases(
    logicMeta ?? styleMeta,
    text.aliases,
    usageMap.meta,
  );

  const logic = text.logic;
  const style = text.style;

  const observations = uniqueList([
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "observations",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "innerMonologue",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "selfDescriptions",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "adultDescriptions",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "comfortPhrases",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "childLogic",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      style,
      usageMap,
      mode,
      "style",
      "observations",
      resolvedAliases,
    ),
  ]);

  const comparisons = uniqueList(
    resolveLayerItems(
      style,
      usageMap,
      mode,
      "style",
      "comparisons",
      resolvedAliases,
    ),
  );
  const emotions = uniqueList([
    ...resolveLayerItems(
      logic,
      usageMap,
      mode,
      "logic",
      "emotions",
      resolvedAliases,
    ),
    ...resolveLayerItems(
      style,
      usageMap,
      mode,
      "style",
      "emotions",
      resolvedAliases,
    ),
  ]);
  const fantasies = uniqueList(
    resolveLayerItems(
      style,
      usageMap,
      mode,
      "style",
      "fantasies",
      resolvedAliases,
    ),
  );
  const replacements = resolveReplacements(
    (text.logic as LogicV2 | undefined)?.replacements,
  );

  return {
    replacements,
    observations,
    comparisons,
    emotions,
    fantasies,
  };
};

export const mergeLexiconAdditions = (
  base: Lexicon | undefined,
  additions: TextLayerAdditions,
): Lexicon | undefined => {
  if (!base && isAdditionsEmpty(additions)) return base;
  const normalized = base ?? {
    replacements: [],
    observations: [],
    comparisons: [],
    emotions: [],
    fantasies: [],
    connectors: [],
  };

  return {
    ...normalized,
    replacements: mergeReplacements(
      normalized.replacements,
      additions.replacements,
    ),
    observations: uniqueList([
      ...normalized.observations,
      ...additions.observations,
    ]),
    comparisons: uniqueList([
      ...normalized.comparisons,
      ...additions.comparisons,
    ]),
    emotions: uniqueList([...normalized.emotions, ...additions.emotions]),
    fantasies: uniqueList([...normalized.fantasies, ...additions.fantasies]),
  };
};

const isLegacyLexicon = (value: unknown): value is Lexicon => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Lexicon;
  return (
    Array.isArray(candidate.replacements) &&
    Array.isArray(candidate.observations) &&
    Array.isArray(candidate.comparisons) &&
    Array.isArray(candidate.emotions) &&
    Array.isArray(candidate.fantasies) &&
    Array.isArray(candidate.connectors)
  );
};

const isLexiconV2 = (value: unknown): value is LexiconV2 => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LexiconV2;
  const hasDepthGroup = (group?: DepthGroup): boolean =>
    !!group && typeof group === "object" && !Array.isArray(group);
  return (
    hasDepthGroup(candidate.connectors) ||
    hasDepthGroup(candidate.beginnings) ||
    hasDepthGroup(candidate.endings) ||
    hasDepthGroup(candidate.questions) ||
    hasDepthGroup(candidate.microReactions)
  );
};

const isUsageV2 = (value: unknown): value is UsageV2 => {
  if (!value || typeof value !== "object") return false;
  return "modes" in (value as UsageV2);
};

const resolveAliases = (
  meta?: TextMeta,
  aliases?: unknown,
  usageMeta?: TextMeta,
): DepthAliases => {
  const ref = meta?.aliasesRef ?? usageMeta?.aliasesRef;
  const resolvedFromRef = ref ? parseAliasesContainer(aliases) : null;
  if (resolvedFromRef) return resolvedFromRef;
  if (meta?.aliases) return meta.aliases;
  if (usageMeta?.aliases) return usageMeta.aliases;
  const direct = parseAliasesDirect(aliases);
  return direct ?? DEFAULT_ALIASES;
};

const resolveLayerItems = (
  layerValue: unknown,
  usage: UsageV2,
  mode: TextMode,
  layer: keyof UsageLayer,
  category: string,
  aliases: DepthAliases,
): string[] => {
  if (!layerValue || typeof layerValue !== "object") return [];
  const meta = (layerValue as { meta?: TextMeta }).meta;
  const group = normalizeDepthGroup(
    (layerValue as Record<string, unknown>)[category],
    meta,
  );
  if (!group) return [];

  const allowed = resolveAllowedDepths(usage, mode, layer, category, aliases);
  if (allowed.length === 0) return [];
  return collectGroupItems(group, allowed, aliases, meta);
};

const normalizeDepthGroup = (
  value: unknown,
  meta?: TextMeta,
): DepthGroup | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const fallback = meta?.fallback ?? DEFAULT_FALLBACK;
    return {
      [fallback]: value,
    };
  }
  if (typeof value !== "object") return undefined;
  return value as DepthGroup;
};

const resolveReplacements = (value: unknown): LexiconReplacement[] => {
  if (!Array.isArray(value)) return [];
  const items = value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const entry = item as { from?: unknown; to?: unknown };
      return {
        from: typeof entry.from === "string" ? entry.from.trim() : "",
        to: typeof entry.to === "string" ? entry.to.trim() : "",
      };
    })
    .filter((item) => item.from.length > 0);
  return items;
};

const mergeReplacements = (
  base: LexiconReplacement[],
  extra: LexiconReplacement[],
): LexiconReplacement[] => {
  const map = new Map<string, LexiconReplacement>();
  for (const item of base) {
    if (item.from) map.set(item.from, item);
  }
  for (const item of extra) {
    if (!item.from || map.has(item.from)) continue;
    map.set(item.from, item);
  }
  return Array.from(map.values());
};

const emptyAdditions = (): TextLayerAdditions => ({
  replacements: [],
  observations: [],
  comparisons: [],
  emotions: [],
  fantasies: [],
});

const isAdditionsEmpty = (additions: TextLayerAdditions): boolean => {
  return (
    additions.replacements.length === 0 &&
    additions.observations.length === 0 &&
    additions.comparisons.length === 0 &&
    additions.emotions.length === 0 &&
    additions.fantasies.length === 0
  );
};

const buildLegacyLexiconFromV2 = (
  lexicon: LexiconV2,
  usage: UsageV2,
  mode: TextMode,
  aliases: DepthAliases,
): Lexicon => {
  const connectors = collectGroupItems(
    lexicon.connectors,
    resolveAllowedDepths(usage, mode, "lexicon", "connectors", aliases),
    aliases,
    lexicon.meta,
  );
  const beginnings = collectGroupItems(
    lexicon.beginnings,
    resolveAllowedDepths(usage, mode, "lexicon", "beginnings", aliases),
    aliases,
    lexicon.meta,
  );
  const endings = collectGroupItems(
    lexicon.endings,
    resolveAllowedDepths(usage, mode, "lexicon", "endings", aliases),
    aliases,
    lexicon.meta,
  );
  const questions = collectGroupItems(
    lexicon.questions,
    resolveAllowedDepths(usage, mode, "lexicon", "questions", aliases),
    aliases,
    lexicon.meta,
  );
  const microReactions = collectGroupItems(
    lexicon.microReactions,
    resolveAllowedDepths(usage, mode, "lexicon", "microReactions", aliases),
    aliases,
    lexicon.meta,
  );

  const connectorPool = uniqueList([...connectors, ...beginnings]);
  const observationPool = uniqueList([
    ...microReactions,
    ...endings,
    ...questions,
  ]);

  return {
    replacements: [],
    observations: observationPool,
    comparisons: [],
    emotions: [],
    fantasies: [],
    connectors: connectorPool,
  };
};

const resolveAllowedDepths = (
  usage: UsageV2,
  mode: TextMode,
  layer: keyof UsageLayer,
  category: string,
  aliases: DepthAliases,
): DepthLevel[] => {
  const usageMode = usage.modes?.[mode] ?? DEFAULT_USAGE.modes?.[mode];
  if (!usageMode) return [];
  const usageMeta = usage.meta ?? DEFAULT_USAGE.meta;

  const allowed = normalizeDepthList(
    usageMode.allow?.[layer]?.[category],
    aliases,
    usageMeta,
  );
  if (allowed.length === 0) return [];

  const denied = new Set(
    normalizeDepthList(usageMode.deny?.[layer]?.[category], aliases, usageMeta),
  );

  return allowed.filter((depth) => !denied.has(depth));
};

const collectGroupItems = (
  group: DepthGroup | undefined,
  allowedDepths: DepthLevel[],
  aliases: DepthAliases,
  meta?: TextMeta,
): string[] => {
  if (!group || allowedDepths.length === 0) return [];
  const items: string[] = [];
  for (const [key, value] of Object.entries(group)) {
    if (!Array.isArray(value)) continue;
    const depth = normalizeDepthKey(key, aliases, meta);
    if (!allowedDepths.includes(depth)) continue;
    items.push(...value.filter((item) => typeof item === "string"));
  }

  return uniqueList(items);
};

const normalizeDepthList = (
  value: string[] | undefined,
  aliases: DepthAliases,
  meta?: TextMeta,
): DepthLevel[] => {
  if (!Array.isArray(value)) return [];
  const resolved = value.map((item) => normalizeDepthKey(item, aliases, meta));
  return Array.from(new Set(resolved));
};

const normalizeDepthKey = (
  key: string,
  aliases: DepthAliases,
  meta?: TextMeta,
): DepthLevel => {
  const normalized = key.trim().toLowerCase();
  if (
    normalized === "light" ||
    normalized === "medium" ||
    normalized === "deep"
  ) {
    return normalized as DepthLevel;
  }

  const resolved = resolveAlias(normalized, aliases);
  if (resolved) return resolved;
  return handleUnknownDepth(normalized, meta);
};

const handleUnknownDepth = (value: string, meta?: TextMeta): DepthLevel => {
  const fallback = meta?.fallback ?? DEFAULT_FALLBACK;
  const policy = meta?.unknownLevelPolicy ?? "warn";

  if (policy === "warn") {
    console.warn("text_depth_alias_unknown", {
      value,
      fallback,
    });
  } else if (policy === "error") {
    throw new Error(`text_depth_alias_unknown:${value}`);
  }

  return fallback;
};

const resolveAlias = (
  key: string,
  aliases: DepthAliases,
): DepthLevel | null => {
  const match = (items: string[]): boolean =>
    items.some((item) => item.toLowerCase() === key);
  if (match(aliases.light)) return "light";
  if (match(aliases.medium)) return "medium";
  if (match(aliases.deep)) return "deep";
  return null;
};

const parseAliasesContainer = (aliases: unknown): DepthAliases | null => {
  if (!aliases || typeof aliases !== "object") return null;
  const container = aliases as { depth?: unknown };
  if (!container.depth || typeof container.depth !== "object") return null;
  return parseAliasesDirect(container.depth);
};

const parseAliasesDirect = (aliases: unknown): DepthAliases | null => {
  if (!aliases || typeof aliases !== "object") return null;
  const candidate = aliases as Partial<DepthAliases>;
  if (
    Array.isArray(candidate.light) &&
    Array.isArray(candidate.medium) &&
    Array.isArray(candidate.deep)
  ) {
    return candidate as DepthAliases;
  }
  return null;
};

const uniqueList = (items: string[]): string[] => {
  const cleaned = items
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};
