import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { findCityById } from "./cities-registry";

const LOCALES = ["ru", "en", "de", "uk"] as const;
type LocaleCode = (typeof LOCALES)[number];

type Localized = Record<LocaleCode, string>;

type IllustrationDraft = {
  image: string;
  caption: Localized;
  size: "small" | "compact" | "medium" | "threeQuarter" | "large";
  type: "ketty-drawing" | "photo" | "decor";
  position: "left" | "right" | "center";
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: number;
  insert: {
    where: "before" | "after";
    paragraph: number;
  };
  anchor: string;
};

type CollectionHomeFormData = {
  cityId?: string;
  citySlug: string;
  panorama: string;
  greeting: Localized;
  descriptionBlocks: Localized[];
  invitation: Localized;
  illustrations: IllustrationDraft[];

  // Backward-compatible fields (old contract)
  locale?: string;
  title?: string;
  subtitle?: string;
  tags?: string[];
  status?: "draft" | "review" | "published" | "archived";
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  summaryDescription?: string;
  ctaText?: string;
};

const emptyLocalized = (): Localized => ({
  ru: "",
  en: "",
  de: "",
  uk: "",
});

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n").trim();

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toBoolean = (value: string, fallback: boolean): boolean => {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return fallback;
};

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseScalarFields = (markdown: string): Record<string, string> => {
  const map: Record<string, string> = {};
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_.\[\]]+)\s*:\s*(.*)$/);
    if (!match) continue;
    map[match[1]] = decodeMultiline(match[2]);
  }

  return map;
};

const parseCollectionHomeForm = (markdown: string): CollectionHomeFormData => {
  const fields = parseScalarFields(markdown);

  const greeting = emptyLocalized();
  const descriptionDirect = emptyLocalized();
  const invitation = emptyLocalized();

  for (const locale of LOCALES) {
    greeting[locale] = asString(fields[`greeting.${locale}`]);
    descriptionDirect[locale] = asString(fields[`description.${locale}`]);
    invitation[locale] = asString(fields[`invitation.${locale}`]);
  }

  const descriptionBlockIndexes = Array.from(
    new Set(
      Object.keys(fields)
        .map((key) => key.match(/^descriptionBlock\[(\d+)\]\.(ru|en|de|uk)$/))
        .filter((m): m is RegExpMatchArray => Boolean(m))
        .map((m) => Number.parseInt(m[1], 10)),
    ),
  ).sort((a, b) => a - b);

  const descriptionBlocks: Localized[] =
    descriptionBlockIndexes.length > 0
      ? descriptionBlockIndexes.map((index) => {
          const block = emptyLocalized();
          for (const locale of LOCALES) {
            block[locale] = asString(fields[`descriptionBlock[${index}].${locale}`]);
          }
          return block;
        })
      : [descriptionDirect];

  const illustrationIndexes = Array.from(
    new Set(
      Object.keys(fields)
        .map((key) => key.match(/^illustration\[(\d+)\]\./))
        .filter((m): m is RegExpMatchArray => Boolean(m))
        .map((m) => Number.parseInt(m[1], 10)),
    ),
  ).sort((a, b) => a - b);

  const illustrations: IllustrationDraft[] = illustrationIndexes
    .map((index) => {
      const sizeRaw = asString(fields[`illustration[${index}].size`]);
      const typeRaw = asString(fields[`illustration[${index}].type`]);
      const positionRaw = asString(fields[`illustration[${index}].position`]);
      const whereRaw = asString(fields[`illustration[${index}].insert.where`]);

      const size: IllustrationDraft["size"] =
        sizeRaw === "small" ||
        sizeRaw === "compact" ||
        sizeRaw === "medium" ||
        sizeRaw === "threeQuarter" ||
        sizeRaw === "large"
          ? sizeRaw
          : "medium";
      const type: IllustrationDraft["type"] =
        typeRaw === "ketty-drawing" || typeRaw === "photo" || typeRaw === "decor"
          ? typeRaw
          : "ketty-drawing";
      const position: IllustrationDraft["position"] =
        positionRaw === "left" || positionRaw === "right" || positionRaw === "center"
          ? positionRaw
          : "right";
      const insertWhere: IllustrationDraft["insert"]["where"] =
        whereRaw === "before" ? "before" : "after";

      const caption = emptyLocalized();
      for (const locale of LOCALES) {
        caption[locale] = asString(fields[`illustration[${index}].caption.${locale}`]);
      }

      return {
        image: asString(fields[`illustration[${index}].image`]),
        caption,
        size,
        type,
        position,
        wrap: toBoolean(asString(fields[`illustration[${index}].wrap`]), true),
        shadow: toBoolean(asString(fields[`illustration[${index}].shadow`]), false),
        border: toBoolean(asString(fields[`illustration[${index}].border`]), false),
        rotate: toNumber(asString(fields[`illustration[${index}].rotate`]), 0),
        insert: {
          where: insertWhere,
          paragraph: Math.max(
            1,
            Math.floor(
              toNumber(asString(fields[`illustration[${index}].insert.paragraph`]), 1),
            ),
          ),
        },
        anchor: asString(fields[`illustration[${index}].anchor`]),
      };
    })
    .filter((item) => item.image);

  return {
    cityId: asString(fields.cityId) || undefined,
    citySlug: asString(fields.citySlug),
    panorama: asString(fields.panorama),
    greeting,
    descriptionBlocks,
    invitation,
    illustrations,

    locale: asString(fields.locale) || undefined,
    title: asString(fields.title) || undefined,
    subtitle: asString(fields.subtitle) || undefined,
    tags: asString(fields.tags)
      ? asString(fields.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    status: ["draft", "review", "published", "archived"].includes(asString(fields.status))
      ? (asString(fields.status) as "draft" | "review" | "published" | "archived")
      : undefined,
    heroTitle: asString(fields.heroTitle) || undefined,
    heroSubtitle: asString(fields.heroSubtitle) || undefined,
    heroImage: asString(fields.heroImage) || undefined,
    summaryDescription: asString(fields.summaryDescription) || undefined,
    ctaText: asString(fields.ctaText) || undefined,
  };
};

export const processCollectionHomeForm = async (markdown: string) => {
  const data = parseCollectionHomeForm(markdown);

  let citySlug = data.citySlug.trim();
  const cityId = data.cityId?.trim();
  let cityRecord: Awaited<ReturnType<typeof findCityById>> | null = null;

  if (cityId) {
    cityRecord = await findCityById(cityId);
    if (!cityRecord?.slug) {
      throw new Error("Указан неизвестный cityId");
    }

    if (citySlug && citySlug !== cityRecord.slug) {
      throw new Error("Поля cityId и citySlug указывают на разные города");
    }

    citySlug = cityRecord.slug;
  }

  if (!citySlug) {
    throw new Error("Обязательное поле: cityId или citySlug");
  }

  const outputDir = path.join(process.cwd(), "data", "landmarks", citySlug);
  await fs.mkdir(outputDir, { recursive: true });

  const cityDataPath = path.join(outputDir, "data.json");
  let cityData: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(cityDataPath, "utf-8");
    cityData = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    cityData = {};
  }

  const existingPageContent =
    cityData.pageContent && typeof cityData.pageContent === "object"
      ? (cityData.pageContent as Record<string, unknown>)
      : {};

  const descriptionByLocale: Localized = emptyLocalized();
  for (const locale of LOCALES) {
    const paragraphs = data.descriptionBlocks
      .map((block) => asString(block[locale]))
      .filter(Boolean);
    descriptionByLocale[locale] = paragraphs.join("\n\n");
  }

  const fallbackLocale = (data.locale?.toLowerCase() as LocaleCode) || "ru";
  const fallbackTitle =
    data.title || cityRecord?.name?.[fallbackLocale] || cityRecord?.city || citySlug;

  const greeting: Localized = {
    ...emptyLocalized(),
    ...(existingPageContent.greeting as Record<string, string> | undefined),
    ...data.greeting,
  };
  const invitation: Localized = {
    ...emptyLocalized(),
    ...(existingPageContent.invitation as Record<string, string> | undefined),
    ...data.invitation,
  };

  if (!greeting[fallbackLocale]) {
    greeting[fallbackLocale] = data.heroTitle || fallbackTitle;
  }
  if (!invitation[fallbackLocale]) {
    invitation[fallbackLocale] = data.ctaText || "";
  }

  const pageContent = {
    ...existingPageContent,
    greeting,
    description: descriptionByLocale,
    invitation,
    illustrations: data.illustrations,
    panorama: data.panorama,
  };

  const timestamp = new Date().toISOString();
  const existingMeta =
    cityData.meta && typeof cityData.meta === "object"
      ? (cityData.meta as Record<string, unknown>)
      : {};

  cityData.meta = {
    ...existingMeta,
    title: existingMeta.title ?? fallbackTitle,
    updatedAt: timestamp,
  };
  cityData.pageContent = pageContent;

  await fs.writeFile(cityDataPath, JSON.stringify(cityData, null, 2), "utf-8");

  // Keep home.{locale}.json in sync for fallback renderer compatibility.
  const locale = fallbackLocale;
  const homePath = path.join(outputDir, `home.${locale}.json`);

  let existingHome: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(homePath, "utf-8");
    existingHome = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    existingHome = {};
  }

  const pageId =
    typeof existingHome.pageId === "string" && existingHome.pageId
      ? existingHome.pageId
      : randomUUID();

  const homeEnvelope = {
    ...existingHome,
    schemaVersion: "1.1.0",
    moduleKey: "landmarks",
    pageKind: "collection-home",
    pageId,
    slug: citySlug,
    locale,
    translationGroupId:
      (typeof existingHome.translationGroupId === "string" &&
        existingHome.translationGroupId) ||
      `tg_landmarks_collection_home_${citySlug}`,
    meta: {
      ...(existingHome.meta as Record<string, unknown> | undefined),
      title: fallbackTitle,
      subtitle: data.subtitle || "",
      tags: data.tags && data.tags.length > 0 ? data.tags : ["landmarks", "city", citySlug],
      status: data.status || "published",
    },
    hero:
      data.panorama || data.heroImage || data.heroTitle
        ? {
            ...(existingHome.hero as Record<string, unknown> | undefined),
            image: data.panorama || data.heroImage || "",
            headline: data.heroTitle || fallbackTitle,
            subheadline: data.heroSubtitle || "",
            kicker: "Sannata",
          }
        : undefined,
    sections: Array.isArray(existingHome.sections) ? existingHome.sections : [],
    mediaRefs: {
      ...(existingHome.mediaRefs as Record<string, unknown> | undefined),
      hero: [data.panorama || data.heroImage || ""].filter(Boolean),
      sections: data.illustrations.map((item) => item.image),
    },
    audit: {
      ...((existingHome.audit as Record<string, unknown>) || {}),
      createdAt:
        (existingHome.audit as Record<string, unknown> | undefined)?.createdAt || timestamp,
      updatedAt: timestamp,
      updatedBy: "agent-form",
    },
  };

  await fs.writeFile(homePath, JSON.stringify(homeEnvelope, null, 2), "utf-8");

  return {
    success: true,
    citySlug,
    cityId: cityId || null,
    outputPath: cityDataPath,
    homeOutputPath: homePath,
    pageContent,
  };
};
