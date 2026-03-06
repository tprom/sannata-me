import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { findCityById } from "./cities-registry";

const LOCALES = ["ru", "en", "de", "uk"] as const;
type LocaleCode = (typeof LOCALES)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuidOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return UUID_RE.test(value) ? value : null;
};

type CollectionHomeFormData = {
  cityId?: string;
  citySlug: string;
  locale: string;
  title: string;
  subtitle?: string;
  tags: string[];
  status: "draft" | "review" | "published" | "archived";

  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;

  // Summary
  summaryTitle?: string;
  summarySubtitle?: string;
  summaryDescription?: string;

  // Highlights
  highlights: string[];

  // Links grid
  linksGridTitle?: string;

  // CTA
  ctaText?: string;
};

const parseField = (line: string, prefix: string): string => {
  if (line.startsWith(prefix)) {
    return line.substring(prefix.length).trim();
  }
  return "";
};

export const parseCollectionHomeForm = (
  markdown: string,
): CollectionHomeFormData => {
  const lines = markdown.split("\n");

  const data: CollectionHomeFormData = {
    citySlug: "",
    locale: "ru",
    title: "",
    tags: [],
    status: "draft",
    highlights: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // City & Locale
    if (trimmed.startsWith("cityId:")) {
      data.cityId = parseField(trimmed, "cityId:");
    } else if (trimmed.startsWith("citySlug:")) {
      data.citySlug = parseField(trimmed, "citySlug:");
    } else if (trimmed.startsWith("locale:")) {
      data.locale = parseField(trimmed, "locale:");
    }

    // Metadata
    else if (trimmed.startsWith("title:")) {
      data.title = parseField(trimmed, "title:");
    } else if (trimmed.startsWith("subtitle:")) {
      data.subtitle = parseField(trimmed, "subtitle:");
    } else if (trimmed.startsWith("tags:")) {
      const tagsStr = parseField(trimmed, "tags:");
      data.tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (trimmed.startsWith("status:")) {
      const status = parseField(trimmed, "status:");
      if (["draft", "review", "published", "archived"].includes(status)) {
        data.status = status as typeof data.status;
      }
    }

    // Hero
    else if (trimmed.startsWith("heroTitle:")) {
      data.heroTitle = parseField(trimmed, "heroTitle:");
    } else if (trimmed.startsWith("heroSubtitle:")) {
      data.heroSubtitle = parseField(trimmed, "heroSubtitle:");
    } else if (trimmed.startsWith("heroImage:")) {
      data.heroImage = parseField(trimmed, "heroImage:");
    }

    // Summary
    else if (trimmed.startsWith("summaryTitle:")) {
      data.summaryTitle = parseField(trimmed, "summaryTitle:");
    } else if (trimmed.startsWith("summarySubtitle:")) {
      data.summarySubtitle = parseField(trimmed, "summarySubtitle:");
    } else if (trimmed.startsWith("summaryDescription:")) {
      data.summaryDescription = parseField(trimmed, "summaryDescription:");
    }

    // Highlights
    else if (trimmed.match(/^highlight\d+:/)) {
      const value = trimmed.replace(/^highlight\d+:/, "").trim();
      if (value) data.highlights.push(value);
    }

    // Links grid
    else if (trimmed.startsWith("linksGridTitle:")) {
      data.linksGridTitle = parseField(trimmed, "linksGridTitle:");
    }

    // CTA
    else if (trimmed.startsWith("ctaText:")) {
      data.ctaText = parseField(trimmed, "ctaText:");
    }
  }

  return data;
};

const emptyLocalized = (): Record<LocaleCode, string> => ({
  ru: "",
  en: "",
  de: "",
  uk: "",
});

const normalizeLocalized = (value: unknown): Record<LocaleCode, string> => {
  const base = emptyLocalized();
  if (!value || typeof value !== "object") return base;
  const record = value as Record<string, unknown>;
  for (const locale of LOCALES) {
    const localized = record[locale];
    base[locale] = typeof localized === "string" ? localized : "";
  }
  return base;
};

export const processCollectionHomeForm = async (markdown: string) => {
  const data = parseCollectionHomeForm(markdown);

  const locale = data.locale.trim().toLowerCase();
  if (!LOCALES.includes(locale as LocaleCode)) {
    throw new Error("Поле locale должно быть одним из: ru, en, de, uk");
  }

  const inputCitySlug = data.citySlug.trim();
  let citySlug = inputCitySlug;
  const cityId = data.cityId?.trim();

  if (cityId) {
    const city = await findCityById(cityId);
    if (!city?.slug) {
      throw new Error("Указан неизвестный cityId");
    }

    if (inputCitySlug && inputCitySlug !== city.slug) {
      throw new Error("Поля cityId и citySlug указывают на разные города");
    }

    citySlug = city.slug;
  }

  if (!citySlug || !data.title) {
    throw new Error("Обязательные поля: citySlug (или cityId), locale, title");
  }

  const pageId = randomUUID();
  const timestamp = new Date().toISOString();

  // Load landmarks for this city
  const landmarksDir = path.join(process.cwd(), "data", "landmarks", citySlug);

  let landmarks: Array<{ slug: string; title: string; thumbnail?: string }> =
    [];
  try {
    const files = await fs.readdir(landmarksDir);
    const landmarkFiles = files.filter(
      (f) => f.endsWith(`.${locale}.json`) && f !== `home.${locale}.json`,
    );

    for (const file of landmarkFiles) {
      const content = await fs.readFile(path.join(landmarksDir, file), "utf-8");
      const envelope = JSON.parse(content);

      if (
        envelope.pageKind === "item" ||
        envelope.pageKind === "landmark-item"
      ) {
        landmarks.push({
          slug: envelope.slug,
          title: envelope.meta?.title || envelope.hero?.headline || "Untitled",
          thumbnail: envelope.hero?.image,
        });
      }
    }
  } catch {
    // No landmarks found, continue with empty array
  }

  const translationGroupId = `tg_landmarks_collection_home_${citySlug}`;

  const linksItems = landmarks.map((landmark) => ({
    title: landmark.title,
    slug: landmark.slug,
    description: "Откройте страницу объекта для подробной информации.",
  }));

  const summaryText = [
    data.summaryTitle || "",
    data.summarySubtitle || "",
    data.summaryDescription || "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const envelope = {
    schemaVersion: "1.1.0",
    moduleKey: "landmarks",
    pageKind: "collection-home",
    pageId,
    slug: citySlug,
    locale,
    translationGroupId,
    meta: {
      title: data.title,
      subtitle: data.subtitle,
      tags: data.tags.length > 0 ? data.tags : ["landmarks", "city", citySlug],
      status: data.status,
    },
    hero: data.heroTitle
      ? {
          headline: data.heroTitle,
          subheadline: data.heroSubtitle,
          kicker: "Sannata",
        }
      : undefined,
    sections: [
      {
        id: "sec_summary",
        type: "summary",
        visible: true,
        payload: {
          text: summaryText || "О городе",
        },
      },
      data.highlights.length > 0
        ? {
            id: "sec_highlights",
            type: "highlights",
            visible: true,
            payload: {
              items: data.highlights,
            },
          }
        : null,
      linksItems.length > 0
        ? {
            id: "sec_links_grid",
            type: "links-grid",
            visible: true,
            payload: {
              items: linksItems,
            },
          }
        : null,
      data.ctaText
        ? {
            id: "sec_cta",
            type: "cta",
            visible: true,
            payload: {
              label: data.ctaText,
              targetSlug: citySlug,
              variant: "primary",
            },
          }
        : null,
    ].filter(Boolean),
    navigation: {
      parentId: null,
      childrenIds: [],
      siblings: [],
      breadcrumbs: [
        {
          pageId,
          title: data.title,
          slug: citySlug,
        },
      ],
    },
    mediaRefs: {
      hero: data.heroImage ? [data.heroImage] : [],
      sections: [],
    },
    audit: {
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: "agent-form",
    },
  };

  // Save envelope
  const outputDir = path.join(process.cwd(), "data", "landmarks", citySlug);
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `home.${locale}.json`);

  let existingEnvelope: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(outputPath, "utf-8");
    existingEnvelope = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    existingEnvelope = {};
  }

  const existingAudit =
    existingEnvelope.audit && typeof existingEnvelope.audit === "object"
      ? (existingEnvelope.audit as Record<string, unknown>)
      : {};

  const mergedEnvelope = {
    ...existingEnvelope,
    ...envelope,
    pageId: asUuidOrNull(existingEnvelope.pageId) ?? envelope.pageId,
    translationGroupId:
      typeof existingEnvelope.translationGroupId === "string" &&
      /^[A-Za-z0-9_-]{6,}$/.test(existingEnvelope.translationGroupId)
        ? existingEnvelope.translationGroupId
        : envelope.translationGroupId,
    meta: {
      ...(existingEnvelope.meta as Record<string, unknown> | undefined),
      ...envelope.meta,
    },
    hero: envelope.hero
      ? {
          ...(existingEnvelope.hero as Record<string, unknown> | undefined),
          ...envelope.hero,
        }
      : undefined,
    sections: envelope.sections,
    navigation: envelope.navigation,
    mediaRefs: {
      ...(existingEnvelope.mediaRefs as Record<string, unknown> | undefined),
      ...envelope.mediaRefs,
    },
    audit: {
      ...existingAudit,
      createdAt:
        typeof existingAudit.createdAt === "string"
          ? existingAudit.createdAt
          : timestamp,
      updatedAt: timestamp,
      updatedBy: "agent-form",
    },
  };

  await fs.writeFile(
    outputPath,
    JSON.stringify(mergedEnvelope, null, 2),
    "utf-8",
  );

  // Also update city's data.json -> pageContent so CityPage renders saved content
  try {
    const cityDataPath = path.join(outputDir, "data.json");
    let cityData: any = {};
    try {
      const raw = await fs.readFile(cityDataPath, "utf-8");
      cityData = JSON.parse(raw);
    } catch {
      cityData = {};
    }

    const existingMeta = cityData.meta ?? {};
    const existingPageContent =
      cityData.pageContent && typeof cityData.pageContent === "object"
        ? cityData.pageContent
        : {};

    const greeting = normalizeLocalized(existingPageContent.greeting);
    const description = normalizeLocalized(existingPageContent.description);
    const invitation = normalizeLocalized(existingPageContent.invitation);

    greeting[locale as LocaleCode] = data.heroTitle || data.title || "";
    description[locale as LocaleCode] = data.summaryDescription || "";
    invitation[locale as LocaleCode] = data.ctaText || "";

    const pageContent = {
      ...existingPageContent,
      greeting,
      description,
      invitation,
      illustrations: Array.isArray(existingPageContent.illustrations)
        ? existingPageContent.illustrations
        : [],
    };

    cityData.meta = {
      ...existingMeta,
      title: cityData.meta?.title ?? data.title,
    };
    cityData.pageContent = pageContent;

    await fs.writeFile(
      cityDataPath,
      JSON.stringify(cityData, null, 2),
      "utf-8",
    );
  } catch (err) {
    // Non-fatal: log and continue
    // console.warn('Could not update city data.json pageContent:', err);
  }

  return {
    success: true,
    pageId,
    citySlug,
    locale,
    outputPath,
    landmarksCount: landmarks.length,
    envelope: mergedEnvelope,
  };
};

// NOTE: ensure this module exports are preserved
