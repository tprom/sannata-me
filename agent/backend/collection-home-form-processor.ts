import fs from "fs/promises";
import path from "path";
import { findCityById } from "./cities-registry";

const LOCALES = ["ru", "en", "de", "uk"] as const;
type LocaleCode = (typeof LOCALES)[number];

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

  const pageId = `landmarks:collection-home:${citySlug}:${locale}`;
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

      if (envelope.pageKind === "landmark-item") {
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

  const envelope = {
    schemaVersion: "1.1.0",
    moduleKey: "landmarks",
    pageKind: "collection-home",
    pageId,
    slug: citySlug,
    locale,
    translationGroupId: `landmarks:collection-home:${citySlug}`,
    meta: {
      title: data.title,
      subtitle: data.subtitle,
      tags: data.tags.length > 0 ? data.tags : ["landmarks", "city", citySlug],
      status: data.status,
    },
    hero: data.heroTitle
      ? {
          title: data.heroTitle,
          subtitle: data.heroSubtitle,
          image: data.heroImage,
        }
      : undefined,
    sections: [
      {
        id: "summary",
        type: "summary",
        visible: true,
        payload: {
          kind: "summary",
          title: data.summaryTitle || "О городе",
          subtitle: data.summarySubtitle || "Городской профиль",
          description: data.summaryDescription || "",
        },
      },
      data.highlights.length > 0
        ? {
            id: "highlights",
            type: "highlights",
            visible: true,
            payload: {
              kind: "highlights",
              items: data.highlights,
            },
          }
        : null,
      landmarks.length > 0
        ? {
            id: "links-grid",
            type: "links-grid",
            visible: true,
            payload: {
              kind: "links-grid",
              title: data.linksGridTitle || "Достопримечательности города",
              items: landmarks.map((landmark) => ({
                id: `landmark-${landmark.slug}`,
                title: landmark.title,
                href: `/${locale}/landmarks/${citySlug}/${landmark.slug}`,
                description:
                  "Откройте страницу объекта для подробной информации.",
                image: landmark.thumbnail,
              })),
            },
          }
        : null,
      data.ctaText
        ? {
            id: "cta",
            type: "cta",
            visible: true,
            payload: {
              kind: "cta",
              text: data.ctaText,
            },
          }
        : null,
    ].filter(Boolean),
    navigation: {
      parentId: `landmarks:module-home:${locale}`,
      childrenIds: landmarks.map(
        (lm) => `landmarks:landmark-item:${citySlug}:${lm.slug}:${locale}`,
      ),
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
  await fs.writeFile(outputPath, JSON.stringify(envelope, null, 2), "utf-8");

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
    envelope,
  };
};

// NOTE: ensure this module exports are preserved
