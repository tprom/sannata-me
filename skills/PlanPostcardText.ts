import {
  PlanPostcardTextInput,
  PlanPostcardTextOutput,
} from "../types/PlanPostcardTextTypes";

export class PlanPostcardText {
  async execute(input: PlanPostcardTextInput): Promise<PlanPostcardTextOutput> {
    const { blocks, style } = input;

    const introTopic = pickTopic(blocks.passport) ?? "";
    const coreTopic = pickTopic(blocks.history) ?? "";
    const atmosphereTopic = pickTopic(blocks.sensory) ?? "";
    const closingTopic =
      pickTopic(blocks.legends ?? blocks.touristExperience ?? "") ?? "";

    const coreLength =
      style.emotionalIntensity === "высокая" ? "long" : "medium";

    const outline = buildOutline({
      introTopic,
      coreTopic,
      atmosphereTopic,
      closingTopic,
      coreLength,
      profileStructure: input.context?.profile?.text?.structure,
    });

    return { outline };
  }
}

const buildOutline = (input: {
  introTopic: string;
  coreTopic: string;
  atmosphereTopic: string;
  closingTopic: string;
  coreLength: "short" | "medium" | "long";
  profileStructure: unknown;
}): Array<{
  id: number;
  topic: string;
  length: "short" | "medium" | "long";
}> => {
  const defaultOutline: Array<{
    id: number;
    topic: string;
    length: "short" | "medium" | "long";
  }> = [
    { id: 1, topic: input.introTopic, length: "medium" },
    { id: 2, topic: input.coreTopic, length: input.coreLength },
    { id: 3, topic: input.atmosphereTopic, length: "medium" },
    { id: 4, topic: input.closingTopic, length: "short" },
  ];

  const order = readOrder(input.profileStructure);
  if (!order) return defaultOutline;

  const byKey: Record<
    string,
    { topic: string; length: "short" | "medium" | "long" }
  > = {
    introduction: { topic: input.introTopic, length: "medium" },
    mainObservation: { topic: input.coreTopic, length: input.coreLength },
    atmosphere: { topic: input.atmosphereTopic, length: "medium" },
    closing: { topic: input.closingTopic, length: "short" },
  };

  return order.map((key, index) => ({
    id: index + 1,
    topic: byKey[key].topic,
    length: byKey[key].length,
  }));
};

const readOrder = (
  value: unknown,
): Array<
  "introduction" | "mainObservation" | "atmosphere" | "closing"
> | null => {
  if (!value || typeof value !== "object") return null;
  const paragraphs = (value as { paragraphs?: unknown }).paragraphs;
  if (!paragraphs || typeof paragraphs !== "object") return null;
  const order = (paragraphs as { order?: unknown }).order;
  if (!Array.isArray(order) || order.length !== 4) return null;
  const normalized = order.filter(
    (item) => typeof item === "string",
  ) as string[];
  const allowed = new Set([
    "introduction",
    "mainObservation",
    "atmosphere",
    "closing",
  ]);
  if (normalized.length !== 4) return null;
  if (normalized.some((item) => !allowed.has(item))) return null;
  return normalized as Array<
    "introduction" | "mainObservation" | "atmosphere" | "closing"
  >;
};

const pickTopic = (block: string): string | null => {
  const items = parseBlockSentences(block, true);
  if (items.length === 0) return null;
  return items[0];
};

const parseBlockSentences = (raw: string, keepKey: boolean): string[] => {
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
  return sentences;
};

const splitKeyValue = (value: string): [string, string] => {
  const index = value.indexOf(":");
  if (index === -1) return [value.trim(), ""];
  return [value.slice(0, index).trim(), value.slice(index + 1).trim()];
};

const stripBulletPrefix = (value: string): string => {
  return value.replace(/^\s*[•o]\s*/i, "").trim();
};
