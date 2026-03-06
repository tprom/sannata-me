export type PersonaId = "ketty" | "lusy" | "fill" | "shi";

export type ContentMode = "primary" | "secondary";

export type TextMode = "postcard" | "diary" | "kettyStory";

export type DepthLevel = "light" | "medium" | "deep";

export type DepthAliases = Record<DepthLevel, string[]>;

export type TextMeta = {
  version?: string;
  persona?: string;
  updatedAt?: string;
  description?: string;
  aliases?: DepthAliases;
  aliasesRef?: string;
  fallback?: DepthLevel;
  strict?: boolean;
  unknownLevelPolicy?: "warn" | "error" | "silent";
};

export type LexiconReplacement = {
  from: string;
  to: string;
};

export type Lexicon = {
  replacements: LexiconReplacement[];
  observations: string[];
  comparisons: string[];
  emotions: string[];
  fantasies: string[];
  connectors: string[];
};

export type DepthGroup = Partial<Record<string, string[]>>;

export type LexiconV2 = {
  meta?: TextMeta;
  connectors?: DepthGroup;
  beginnings?: DepthGroup;
  endings?: DepthGroup;
  questions?: DepthGroup;
  microReactions?: DepthGroup;
};

export type LogicV2 = {
  meta?: TextMeta;
  replacements?: LexiconReplacement[];
  comfortPhrases?: DepthGroup;
  childLogic?: DepthGroup;
  attentionTriggers?: DepthGroup;
  logicTriggers?: DepthGroup;
  innerMonologue?: DepthGroup;
  observations?: DepthGroup;
  emotions?: DepthGroup;
  selfDescriptions?: DepthGroup;
  adultDescriptions?: DepthGroup;
};

export type StyleV2 = {
  meta?: TextMeta;
  poeticFormulas?: DepthGroup;
  fantasies?: DepthGroup;
  comparisons?: DepthGroup;
  observations?: DepthGroup;
  emotions?: DepthGroup;
};

export type UsageLayer = {
  lexicon?: Record<string, string[]>;
  logic?: Record<string, string[]>;
  style?: Record<string, string[]>;
};

export type UsageMode = {
  allow?: UsageLayer;
  deny?: UsageLayer;
};

export type UsageV2 = {
  meta?: TextMeta;
  modes?: Partial<Record<TextMode, UsageMode>>;
};

export type PersonaProfile = {
  id: PersonaId;
  label: string;
  version: string;
  defaults: {
    language: "ru";
  };
  contentModes?: {
    default: ContentMode;
    available: ContentMode[];
  };
  content?: Partial<Record<ContentMode, Record<string, unknown>>>;
  text?: {
    style?: Record<string, unknown> | StyleV2;
    structure?: Record<string, unknown>;
    logic?: Record<string, unknown> | LogicV2;
    lexicon?: Lexicon | LexiconV2;
    usage?: Record<string, unknown> | UsageV2;
    aliases?: Record<string, unknown> | DepthAliases;
  };
  visuals?: {
    illustration?: Record<string, unknown>;
    gallery?: Record<string, unknown>;
    stamp?: Record<string, unknown>;
  };
  style?: Record<string, unknown>;
  structure?: Record<string, unknown>;
  visual?: Record<string, unknown>;
  translationHints?: Record<string, unknown>;
};
