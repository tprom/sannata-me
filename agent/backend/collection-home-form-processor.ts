import fs from "fs/promises";
import path from "path";
import { findCityById } from "./cities-registry";

const LOCALES = ["en", "de", "ru", "uk"] as const;
type LocaleCode = (typeof LOCALES)[number];

type IllustrationDraft = {
  image: string;
  caption: Record<LocaleCode, string>;
  size: "small" | "medium" | "large" | "threeQuarter" | "compact";
  type: "ketty-drawing" | "photo" | "decor";
  position: "left" | "right" | "center";
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: number;
  insert?: {
    where: "before" | "after";
    paragraph: number;
  };
  anchor?: string;
};

type CollectionHomeFormData = {
  cityId: string;
  panorama: string;
  greeting: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
  invitation: Record<LocaleCode, string>;
  illustrations: IllustrationDraft[];
};

const emptyLocalized = (): Record<LocaleCode, string> => ({
  en: "",
  de: "",
  ru: "",
  uk: "",
});

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  const normalized = normalize(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
};

const parseNumber = (value: unknown, fallback: number): number => {
  const n = Number.parseFloat(normalize(value));
  return Number.isFinite(n) ? n : fallback;
};

const clampRotate = (value: number): number => {
  if (value < -10) return -10;
  if (value > 10) return 10;
  return value;
};

const normalizeSize = (value: unknown): IllustrationDraft["size"] => {
  const normalized = normalize(value);
  if (normalized === "large") return "large";
  if (normalized === "threeQuarter") return "threeQuarter";
  if (normalized === "medium") return "medium";
  if (normalized === "compact") return "compact";
  if (normalized === "small") return "small";
  return "medium";
};

const parseFlatFields = (markdown: string): Record<string, string> => {
  const fields: Record<string, string> = {};

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("<!--")) continue;
    const match = line.match(/^([A-Za-z0-9_.\[\]]+)\s*:\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = match[2].trim();
  }

  return fields;
};

export const parseCollectionHomeForm = (
  markdown: string,
): CollectionHomeFormData => {
  const fields = parseFlatFields(markdown);

  const greeting = emptyLocalized();
  const description = emptyLocalized();
  const invitation = emptyLocalized();

  for (const locale of LOCALES) {
    greeting[locale] = decodeMultiline(normalize(fields[`greeting.${locale}`]));
    description[locale] = decodeMultiline(
      normalize(fields[`description.${locale}`]),
    );
    invitation[locale] = decodeMultiline(
      normalize(fields[`invitation.${locale}`]),
    );
  }

  const byIndex = new Map<number, Record<string, string>>();
  for (const [key, value] of Object.entries(fields)) {
    const match = key.match(/^illustration\[(\d+)\]\.(.+)$/);
    if (!match) continue;
    const index = Number.parseInt(match[1], 10);
    const suffix = match[2];
    if (!Number.isFinite(index)) continue;

    if (!byIndex.has(index)) {
      byIndex.set(index, {});
    }

    byIndex.get(index)![suffix] = value;
  }

  const illustrations: IllustrationDraft[] = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, block]) => {
      const rotate = clampRotate(parseNumber(block.rotate, 0));
      const paragraph = Math.max(
        1,
        Math.floor(parseNumber(block["insert.paragraph"], 1)),
      );
      const whereRaw = normalize(block["insert.where"]);
      const where: "before" | "after" =
        whereRaw === "before" ? "before" : "after";

      const image = normalize(block.image);
      const item: IllustrationDraft = {
        image,
        caption: {
          en: decodeMultiline(normalize(block["caption.en"])),
          de: decodeMultiline(normalize(block["caption.de"])),
          ru: decodeMultiline(normalize(block["caption.ru"])),
          uk: decodeMultiline(normalize(block["caption.uk"])),
        },
        size: normalizeSize(block.size),
        type:
          (normalize(block.type) as IllustrationDraft["type"]) ||
          "ketty-drawing",
        position:
          (normalize(block.position) as IllustrationDraft["position"]) ||
          "right",
        wrap: parseBoolean(block.wrap, true),
        shadow: parseBoolean(block.shadow, false),
        border: parseBoolean(block.border, false),
        rotate,
        insert: {
          where,
          paragraph,
        },
        anchor: normalize(block.anchor) || undefined,
      };

      return item;
    })
    .filter((item) => item.image.length > 0);

  return {
    cityId: normalize(fields.cityId),
    panorama: normalize(fields.panorama),
    greeting,
    description,
    invitation,
    illustrations,
  };
};

export const processCollectionHomeForm = async (markdown: string) => {
  const data = parseCollectionHomeForm(markdown);

  if (!data.cityId) {
    throw new Error("Поле cityId обязательно.");
  }

  const city = await findCityById(data.cityId);
  if (!city?.slug) {
    throw new Error("Указан неизвестный cityId.");
  }

  const citySlug = city.slug;
  const cityDir = path.join(process.cwd(), "data", "landmarks", citySlug);
  await fs.mkdir(cityDir, { recursive: true });

  const cityDataPath = path.join(cityDir, "data.json");

  let cityData: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(cityDataPath, "utf-8");
    cityData = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    cityData = {};
  }

  const existingMeta =
    cityData.meta && typeof cityData.meta === "object"
      ? (cityData.meta as Record<string, unknown>)
      : {};

  const nextPageContent = {
    panorama: data.panorama,
    greeting: data.greeting,
    description: data.description,
    illustrations: data.illustrations,
    invitation: data.invitation,
  };

  const nextData = {
    ...cityData,
    meta: {
      ...existingMeta,
      title:
        (typeof existingMeta.title === "string" && existingMeta.title) ||
        city.name?.en ||
        city.city ||
        citySlug,
    },
    description: data.description.en || data.description.ru || "",
    hero: data.panorama || "",
    pageContent: nextPageContent,
  };

  await fs.writeFile(cityDataPath, JSON.stringify(nextData, null, 2), "utf-8");

  return {
    success: true,
    cityId: data.cityId,
    citySlug,
    outputPath: cityDataPath,
    pageContent: nextPageContent,
  };
};
