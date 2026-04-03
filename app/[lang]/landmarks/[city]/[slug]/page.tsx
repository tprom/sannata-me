import "@/components/modules/landmarks/styles.css";
import fs from "fs/promises";
import path from "path";
import CityMenu from "@/components/modules/landmarks/CityMenu";
import type { LandmarkItem } from "@/components/modules/landmarks/LandmarkList";
import LandmarksPage from "@/components/modules/landmarks/LandmarksPage";
import { adaptLandmarksItemToEnvelope } from "@/lib/universal-page-template/landmarks-adapters";

type Params = {
  params: Promise<{
    lang: string;
    city: string;
    slug: string;
  }>;
};

const PROMPT_DEFAULTS = {
  greeting: {
    ru: "Привет!",
    en: "Hi there!",
    de: "Hallo!",
    uk: "Привіт!",
  },
  footer: {
    ru: "Обнимаю!  Твоя Кетти 🌟",
    en: "Hugs!  Your Ketty 🌟",
    de: "Liebe Grüße!  Deine Ketty 🌟",
    uk: "Обіймаю!  Твоя Кетті 🌟",
  },
};

// Базовый загрузчик JSON из data/landmarks (заглушка для будущего API).
async function loadJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export default async function LandmarkSlugPage({ params }: Params) {
  const { lang, city, slug } = await params;
  const basePath = path.join(process.cwd(), "data", "landmarks");

  const cities = await listCities(basePath, lang);

  const menuLandmarks = await listLandmarks(basePath, city, lang);
  const menuLandmarkItems: LandmarkItem[] = menuLandmarks.map((item) => ({
    slug: item.slug,
    title: item.title ?? item.slug,
    thumbnail: item.thumbnail,
    shortDescription: item.shortDescription,
    hero: item.hero,
    cover: item.cover,
  }));

  const view = await loadJson(
    path.join(basePath, city, slug, `view.${lang}.json`),
    null as null | {
      greeting: string;
      stampImage: string;
      contentFile: string;
      footer: string;
    },
  );

  const fallbackView =
    view ??
    (await loadJson(
      path.join(basePath, city, slug, "view.json"),
      null as null | {
        greeting: string;
        stampImage: string;
        contentFile: string;
        footer: string;
      },
    ));

  const data = await loadJson(
    path.join(basePath, city, slug, "data.json"),
    null as null | {
      content?: string | Record<string, string>;
      prompts?: {
        greeting?: string | Record<string, string>;
        footer?: string | Record<string, string>;
      };
      postcardGraphics?: {
        stamp?: {
          fileName?: string;
          savedFile?: string;
        };
        illustrations?: {
          "2L"?: { isActive?: boolean; savedFile?: string };
          "2R"?: { isActive?: boolean; savedFile?: string };
          "4L"?: { isActive?: boolean; savedFile?: string };
          "4R"?: { isActive?: boolean; savedFile?: string };
        };
      };
      gallery?: {
        items?: Array<{ fileName?: string; savedFile?: string }>;
      };
    },
  );

  const formData = await loadJson(
    path.join(
      process.cwd(),
      "agent",
      "backend",
      "landmark-data",
      city,
      `${slug}.json`,
    ),
    null as null | {
      postcard?: {
        greeting?: Record<string, string>;
        content?: Record<string, string>;
        farewell?: Record<string, string>;
        invitation?: Record<string, string>;
        invitationBookLink?: Record<string, string>;
      };
      gallery?: {
        items?: Array<{
          file?: string;
          alt?: string;
          savedFile?: string;
          fileName?: string;
        }>;
      };
      images?: {
        stamp?: {
          file?: string;
        };
        items?: Array<{
          file?: string;
          position?: string;
          insertParagraph?: string | number;
        }>;
      };
    },
  );

  const resolvedView = resolveLandmarkView({
    lang,
    city,
    slug,
    data,
    formData,
    fallbackView,
  });

  const galleryData = await buildGallery({
    basePath,
    city,
    slug,
    data,
    formData,
  });

  const gallery = galleryData.images;
  const gallerySource = galleryData.source;
  const cityTitle = cities.find((item) => item.slug === city)?.city ?? city;
  const landmarkTitle =
    menuLandmarkItems.find((item) => item.slug === slug)?.title ?? slug;

  const envelope = adaptLandmarksItemToEnvelope({
    locale: lang,
    citySlug: city,
    cityTitle,
    landmarkSlug: slug,
    landmarkTitle,
    view: resolvedView,
    gallery,
    gallerySource,
  });

  return (
    <LandmarksPage
      allowOverflow
      view={resolvedView}
      gallery={gallery}
      gallerySource={gallerySource}
      envelope={envelope}
      sidebar={
        <CityMenu
          cities={cities}
          activeCity={city}
          activeLandmark={slug}
          lang={lang}
          activeCityLandmarks={menuLandmarkItems}
        />
      }
    />
  );
}

const buildGallery = async (input: {
  basePath: string;
  city: string;
  slug: string;
  data: {
    gallery?: { items?: Array<{ fileName?: string; savedFile?: string }> };
  } | null;
  formData?: { gallery?: { items?: Array<any> } };
}): Promise<{
  images: Array<{ src: string; alt: string }>;
  source: "generated" | "legacy";
}> => {
  // Новый источник: formData.gallery.items
  const formGalleryItems = input.formData?.gallery?.items ?? [];
  const formGalleryImages = formGalleryItems
    .map((item, index) => {
      const file = item.file || item.savedFile || item.fileName;
      if (!file) return null;
      const src =
        file.startsWith("/") || /^https?:\/\//i.test(file)
          ? file
          : file.startsWith("images/") || file.startsWith("gallery/")
            ? `/data/landmarks/${input.city}/${input.slug}/${file}`
            : `/data/landmarks/${input.city}/${input.slug}/images/${file}`;
      const alt = item.alt || item.fileName || `Gallery ${index + 1}`;
      return { src, alt };
    })
    .filter(Boolean);

  if (formGalleryImages.length > 0) {
    return {
      images: formGalleryImages,
      source: "legacy",
    };
  }

  // Fallback: legacy data.json
  const legacyItems = input.data?.gallery?.items ?? [];
  const legacyImages = legacyItems
    .map((item, index) => {
      const fileName = item.savedFile || item.fileName;
      if (!fileName) return null;
      const src = fileName.startsWith("images/")
        ? `/data/landmarks/${input.city}/${input.slug}/${fileName}`
        : `/data/landmarks/${input.city}/${input.slug}/images/${fileName}`;
      const alt = item.fileName || `Gallery ${index + 1}`;
      return { src, alt };
    })
    .filter(Boolean);

  if (legacyImages.length === 0) {
    return {
      images: [{ src: "/images/castle.png", alt: "Gallery placeholder" }],
      source: "legacy",
    };
  }

  return {
    images: legacyImages as Array<{ src: string; alt: string }>,
    source: "legacy",
  };
};

const normalizeGalleryPath = (
  rawPath: string,
  city: string,
  slug: string,
): string => {
  const normalized = rawPath.trim();
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return `/data/landmarks/${city}/${slug}/${normalized.replace(/\\/g, "/")}`;
};

type LandmarkIndexItem = {
  slug: string;
  title?: string;
  thumbnail?: string;
  shortDescription?: string;
  hero?: string;
  cover?: string;
};

const listCities = async (
  basePath: string,
  lang: string,
): Promise<Array<{ city: string; slug: string; count: number }>> => {
  const registryNames = await loadCityRegistryNames(lang);
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const cityDirs = entries.filter(
    (entry) => entry.isDirectory() && !isHiddenDir(entry.name),
  );

  const cities = await Promise.all(
    cityDirs.map(async (entry) => {
      const slug = entry.name;
      const cityPath = path.join(basePath, slug);
      const landmarkCount = (await listLandmarks(basePath, slug, lang)).length;
      const hasData = await fileExists(path.join(cityPath, "data.json"));
      if (!hasData && landmarkCount === 0) return null;

      const cityData = hasData
        ? await readJson(
            path.join(cityPath, "data.json"),
            {} as {
              meta?: {
                title?: string | Record<string, string>;
                city?: string | Record<string, string>;
              };
            },
          )
        : { meta: { title: toTitle(slug) } };
      const localizedTitle =
        resolveLocalizedValue(cityData.meta?.title, lang) ??
        resolveLocalizedValue(cityData.meta?.city, lang);
      const title =
        registryNames[slug] ??
        localizedTitle ??
        (await resolveCityNameFromLandmarkMeta(basePath, slug, lang)) ??
        toTitle(slug);

      return { city: title, slug, count: landmarkCount };
    }),
  );

  return cities.filter(Boolean) as Array<{
    city: string;
    slug: string;
    count: number;
  }>;
};

const listLandmarks = async (
  basePath: string,
  citySlug: string,
  lang: string,
): Promise<LandmarkIndexItem[]> => {
  const cityPath = path.join(basePath, citySlug);
  const entries = await fs.readdir(cityPath, { withFileTypes: true });
  const dirEntries = entries.filter((entry) => entry.isDirectory());

  const landmarks = await Promise.all(
    dirEntries.map(async (entry) => {
      const landmarkPath = path.join(cityPath, entry.name);
      const dataPath = path.join(landmarkPath, "data.json");
      const hasData = await fileExists(dataPath);
      if (!hasData) return null;

      const data = await readJson(
        dataPath,
        {} as {
          meta?: {
            title?: string | Record<string, string>;
            landmark?: string | Record<string, string>;
          };
          title?: string;
          landmark?: string | Record<string, string>;
          blocks?: { passport?: string };
          shortDescription?: string;
          hero?: string;
          cover?: string;
          content?:
            | Array<{ type?: string; src?: string }>
            | Record<string, string>
            | string;
          images?: { items?: Array<{ fileName?: string; savedFile?: string }> };
          gallery?: {
            items?: Array<{ fileName?: string; savedFile?: string }>;
          };
        },
      );
      if (isArchivedLandmarkData(data)) {
        return null;
      }

      const title = resolveLandmarkTitle({
        data,
        lang,
        fallback: toTitle(entry.name),
      });
      const thumbnail = resolveLandmarkThumbnail({
        data,
        city: citySlug,
        slug: entry.name,
      });

      return {
        slug: entry.name,
        title,
        thumbnail,
        shortDescription: data.shortDescription,
        hero: data.hero,
        cover: data.cover,
      };
    }),
  );

  return landmarks.filter(Boolean) as LandmarkIndexItem[];
};

const resolveLocalizedValue = (
  value: string | Record<string, string> | undefined,
  lang: string,
): string | null => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  const localized = value[lang] ?? value.en ?? value.ru ?? value.de ?? value.uk;
  if (typeof localized !== "string") return null;
  const trimmed = localized.trim();
  return trimmed || null;
};

const resolveCityNameFromLandmarkMeta = async (
  basePath: string,
  citySlug: string,
  lang: string,
): Promise<string | null> => {
  const cityPath = path.join(basePath, citySlug);
  const entries = await fs.readdir(cityPath, { withFileTypes: true });
  const dirEntries = entries.filter((entry) => entry.isDirectory());

  for (const entry of dirEntries) {
    const dataPath = path.join(cityPath, entry.name, "data.json");
    const hasData = await fileExists(dataPath);
    if (!hasData) continue;

    const data = await readJson(
      dataPath,
      {} as { meta?: { city?: string | Record<string, string> } },
    );
    const localized = resolveLocalizedValue(data.meta?.city, lang);
    if (localized) return localized;
  }

  return null;
};

const resolveLandmarkTitle = (input: {
  data: {
    meta?: {
      title?: string | Record<string, string>;
      landmark?: string | Record<string, string>;
    };
    title?: string;
    landmark?: string | Record<string, string>;
    blocks?: { passport?: string };
  };
  lang: string;
  fallback: string;
}): string => {
  const localizedMetaTitle = resolveLocalizedValue(
    input.data.meta?.title,
    input.lang,
  );
  if (localizedMetaTitle) return capitalizeFirst(localizedMetaTitle);

  const localizedMetaLandmark = resolveLocalizedValue(
    input.data.meta?.landmark,
    input.lang,
  );
  if (localizedMetaLandmark) return capitalizeFirst(localizedMetaLandmark);

  const localizedLandmark = resolveLocalizedValue(
    input.data.landmark,
    input.lang,
  );
  if (localizedLandmark) return capitalizeFirst(localizedLandmark);

  if (input.data.title) return capitalizeFirst(input.data.title);
  const passportTitle = extractPassportTitle(input.data.blocks?.passport ?? "");
  return capitalizeFirst(passportTitle || input.fallback);
};

const loadCityRegistryNames = async (
  lang: string,
): Promise<Record<string, string>> => {
  const registry = await readJson(
    path.join(process.cwd(), "data", "cities.json"),
    [] as Array<{
      slug?: string;
      name?: Record<string, string>;
      city?: string;
    }>,
  );

  const result: Record<string, string> = {};
  for (const item of registry) {
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    if (!slug) continue;
    const localized =
      item.name?.[lang] ??
      item.name?.en ??
      item.name?.ru ??
      item.name?.de ??
      item.name?.uk;
    const value =
      typeof localized === "string" && localized.trim()
        ? localized.trim()
        : typeof item.city === "string" && item.city.trim()
          ? item.city.trim()
          : "";
    if (value) {
      result[slug] = value;
    }
  }

  return result;
};

const capitalizeFirst = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
};

const resolveLandmarkThumbnail = (input: {
  data: {
    hero?: string;
    cover?: string;
    content?:
      | Array<{ type?: string; src?: string }>
      | Record<string, string>
      | string;
    images?: { items?: Array<{ fileName?: string; savedFile?: string }> };
    gallery?: { items?: Array<{ fileName?: string; savedFile?: string }> };
  };
  city: string;
  slug: string;
}): string => {
  if (input.data.hero) return input.data.hero;
  if (input.data.cover) return input.data.cover;

  const contentImage = Array.isArray(input.data.content)
    ? (input.data.content.find((item) => item.type === "image")?.src ?? "")
    : "";
  if (contentImage) return contentImage;

  const firstGalleryImage = input.data.gallery?.items?.[0];
  const galleryFileName =
    firstGalleryImage?.savedFile ?? firstGalleryImage?.fileName;
  if (galleryFileName) {
    if (galleryFileName.startsWith("/")) return galleryFileName;
    return `/data/landmarks/${input.city}/${input.slug}/${galleryFileName}`;
  }

  const firstImage = input.data.images?.items?.[0];
  const fileName = firstImage?.savedFile ?? firstImage?.fileName;
  if (fileName) {
    if (fileName.startsWith("/")) return fileName;
    return `/data/landmarks/${input.city}/${input.slug}/images/${fileName}`;
  }

  return "";
};

const extractPassportTitle = (passport: string): string => {
  for (const line of passport.split(/\r?\n/)) {
    const trimmed = line.replace(/^[\s•o\t]+/i, "").trim();
    if (!trimmed) continue;
    const [key, value] = trimmed.split(":").map((part) => part.trim());
    if (key === "Официальное название" && value) {
      return value;
    }
  }
  return "";
};

const readJson = async <T,>(filePath: string, fallback: T): Promise<T> => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const toTitle = (slug: string): string => {
  const words = slug.replace(/[-_]+/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return slug;
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
};

const isArchivedLandmarkData = (data: Record<string, unknown>): boolean => {
  const universal =
    data.universal && typeof data.universal === "object"
      ? (data.universal as Record<string, unknown>)
      : null;

  if (!universal) return false;

  if (universal.workflowStatus === "archived") {
    return true;
  }

  const envelopesByLocale =
    universal.envelopesByLocale &&
    typeof universal.envelopesByLocale === "object"
      ? (universal.envelopesByLocale as Record<string, unknown>)
      : null;

  if (!envelopesByLocale) return false;

  const statuses = ["ru", "en", "de", "uk"]
    .map((locale) => {
      const envelope = envelopesByLocale[locale];
      if (!envelope || typeof envelope !== "object") return null;

      const meta =
        (envelope as Record<string, unknown>).meta &&
        typeof (envelope as Record<string, unknown>).meta === "object"
          ? ((envelope as Record<string, unknown>).meta as Record<
              string,
              unknown
            >)
          : null;

      return meta?.status;
    })
    .filter((status): status is string => typeof status === "string");

  return (
    statuses.length > 0 && statuses.every((status) => status === "archived")
  );
};

const isHiddenDir = (name: string): boolean => {
  return name.toLowerCase() === "test";
};

const resolveLandmarkView = (input: {
  lang: string;
  city: string;
  slug: string;
  data: {
    content?: string | Record<string, string>;
    prompts?: {
      greeting?: string | Record<string, string>;
      footer?: string | Record<string, string>;
    };
    postcardGraphics?: {
      stamp?: {
        fileName?: string;
        savedFile?: string;
      };
      illustrations?: {
        "2L"?: { isActive?: boolean; savedFile?: string };
        "2R"?: { isActive?: boolean; savedFile?: string };
        "4L"?: { isActive?: boolean; savedFile?: string };
        "4R"?: { isActive?: boolean; savedFile?: string };
      };
    };
  } | null;
  formData: {
    postcard?: {
      greeting?: Record<string, string>;
      content?: Record<string, string>;
      farewell?: Record<string, string>;
      invitation?: Record<string, string>;
      invitationBookLink?: Record<string, string>;
    };
    images?: {
      stamp?: {
        file?: string;
      };
      items?: Array<{
        file?: string;
        position?: string;
        insertParagraph?: string | number;
      }>;
    };
  } | null;
  fallbackView: {
    greeting: string;
    stampImage: string;
    contentFile: string;
    footer: string;
  } | null;
}): {
  greeting: string;
  stampImage: string;
  contentFile: string;
  farewell?: string;
  invitation?: string;
  invitationBookLink?: string;
  footer: string;
} | null => {
  const fallback = input.fallbackView;
  const greetingFromForm = readLocalized(
    input.formData?.postcard?.greeting,
    input.lang,
  );
  const contentFromForm = readLocalized(
    input.formData?.postcard?.content,
    input.lang,
  );
  const farewellFromForm = readLocalized(
    input.formData?.postcard?.farewell,
    input.lang,
  );
  const invitationFromForm = readLocalizedExact(
    input.formData?.postcard?.invitation,
    input.lang,
  );
  const invitationBookLinkFromForm = readLocalizedExact(
    input.formData?.postcard?.invitationBookLink,
    input.lang,
  );

  const contentWithFormIllustrations = injectIllustrationsFromFormData({
    content: contentFromForm,
    city: input.city,
    slug: input.slug,
    items: input.formData?.images?.items,
  });

  const stampImageFromForm =
    typeof input.formData?.images?.stamp?.file === "string"
      ? input.formData.images.stamp.file.trim()
      : "";

  const contentFromData = readLocalized(input.data?.content, input.lang);
  const greetingFromData = readLocalizedPrompt(
    input.data?.prompts?.greeting,
    input.lang,
  );
  const footerFromData = readLocalizedPrompt(
    input.data?.prompts?.footer,
    input.lang,
  );

  const stamp = input.data?.postcardGraphics?.stamp;
  const illustrations = input.data?.postcardGraphics?.illustrations;
  const stampImage = resolveStampImage({
    city: input.city,
    slug: input.slug,
    savedFile: stamp?.savedFile,
    fileName: stamp?.fileName,
  });

  const contentWithIllustrations = injectIllustrationsFromData({
    content: contentFromData,
    city: input.city,
    slug: input.slug,
    illustrations,
  });

  const greeting =
    greetingFromForm ||
    greetingFromData ||
    fallback?.greeting ||
    PROMPT_DEFAULTS.greeting[
      input.lang as keyof typeof PROMPT_DEFAULTS.greeting
    ] ||
    PROMPT_DEFAULTS.greeting.en;
  const contentFile =
    contentWithFormIllustrations ||
    contentWithIllustrations ||
    fallback?.contentFile ||
    "";
  const farewell =
    farewellFromForm ||
    footerFromData ||
    fallback?.footer ||
    PROMPT_DEFAULTS.footer[input.lang as keyof typeof PROMPT_DEFAULTS.footer] ||
    PROMPT_DEFAULTS.footer.en;
  const invitation = invitationFromForm;
  const invitationBookLink = invitationBookLinkFromForm;
  const rawStampImage =
    stampImageFromForm || stampImage || fallback?.stampImage || "";

  const resolvedContentFile = normalizeIllustrationPaths({
    contentFile,
    city: input.city,
    slug: input.slug,
  });
  const resolvedStampImage = normalizeMediaPath({
    src: rawStampImage,
    city: input.city,
    slug: input.slug,
  });

  if (
    !greeting &&
    !resolvedContentFile &&
    !farewell &&
    !invitation &&
    !invitationBookLink &&
    !resolvedStampImage
  ) {
    return fallback;
  }

  return {
    greeting,
    stampImage: resolvedStampImage,
    contentFile: resolvedContentFile,
    farewell,
    invitation,
    invitationBookLink,
    footer: farewell,
  };
};

const injectIllustrationsFromFormData = (input: {
  content: string;
  city: string;
  slug: string;
  items:
    | Array<{
        file?: string;
        position?: string;
        insertParagraph?: string | number;
      }>
    | undefined;
}): string => {
  if (!input.content) return "";
  if (input.content.includes("[[illustration:")) return input.content;

  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) return input.content;

  const markersByParagraph = new Map<number, string[]>();

  items.forEach((item) => {
    const rawFile = typeof item?.file === "string" ? item.file.trim() : "";
    if (!rawFile) return;

    const sideRaw =
      typeof item?.position === "string"
        ? item.position.trim().toLowerCase()
        : "left";
    const side = sideRaw === "right" ? "right" : "left";

    const paragraphRaw =
      typeof item?.insertParagraph === "number"
        ? item.insertParagraph
        : Number.parseInt(String(item?.insertParagraph ?? "1"), 10);
    const paragraph =
      Number.isFinite(paragraphRaw) && paragraphRaw > 0 ? paragraphRaw : 1;

    const normalizedSrc = normalizeMediaPath({
      src: rawFile,
      city: input.city,
      slug: input.slug,
    });
    if (!normalizedSrc) return;

    const marker = `[[illustration:${normalizedSrc}|${side}]]`;
    const existing = markersByParagraph.get(paragraph) ?? [];
    existing.push(marker);
    markersByParagraph.set(paragraph, existing);
  });

  if (markersByParagraph.size === 0) return input.content;

  const paragraphs = splitContentToParagraphs(input.content);
  return paragraphs
    .map((paragraph, index) => {
      const paragraphNumber = index + 1;
      const markers = markersByParagraph.get(paragraphNumber) ?? [];
      if (markers.length === 0) return paragraph;
      return `${paragraph}\n\n${markers.join("\n")}`;
    })
    .join("\n\n");
};

const readLocalized = (
  value: string | Record<string, string> | undefined,
  lang: string,
): string => {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const byLang = value[lang];
  if (typeof byLang === "string" && byLang.trim()) {
    return byLang;
  }

  const ru = value.ru;
  if (typeof ru === "string" && ru.trim()) {
    return ru;
  }

  const en = value.en;
  if (typeof en === "string" && en.trim()) {
    return en;
  }

  const first = Object.values(value).find(
    (item) => typeof item === "string" && item.trim(),
  );
  return typeof first === "string" ? first : "";
};

const readLocalizedExact = (
  value: string | Record<string, string> | undefined,
  lang: string,
): string => {
  if (typeof value === "string") {
    return lang === "ru" ? value : "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const byLang = value[lang];
  return typeof byLang === "string" ? byLang : "";
};

const readLocalizedPrompt = (
  value: string | Record<string, string> | undefined,
  lang: string,
): string => {
  if (typeof value === "string") {
    return lang === "ru" ? value.trim() : "";
  }

  return readLocalized(value, lang);
};

const resolveStampImage = (input: {
  city: string;
  slug: string;
  savedFile?: string;
  fileName?: string;
}): string => {
  const saved = input.savedFile?.trim();
  if (saved) {
    if (saved.startsWith("/")) return saved;
    return `/data/landmarks/${input.city}/${input.slug}/${saved}`;
  }

  const fileName = input.fileName?.trim();
  if (!fileName) return "";
  return `/data/landmarks/${input.city}/${input.slug}/stamp/${fileName}`;
};

const injectIllustrationsFromData = (input: {
  content: string;
  city: string;
  slug: string;
  illustrations:
    | {
        "2L"?: { isActive?: boolean; savedFile?: string };
        "2R"?: { isActive?: boolean; savedFile?: string };
        "4L"?: { isActive?: boolean; savedFile?: string };
        "4R"?: { isActive?: boolean; savedFile?: string };
      }
    | undefined;
}): string => {
  if (!input.content) return "";
  if (input.content.includes("[[illustration:")) return input.content;

  const slots = {
    "2L": toIllustrationAbsolutePath({
      city: input.city,
      slug: input.slug,
      slot: input.illustrations?.["2L"],
    }),
    "2R": toIllustrationAbsolutePath({
      city: input.city,
      slug: input.slug,
      slot: input.illustrations?.["2R"],
    }),
    "4L": toIllustrationAbsolutePath({
      city: input.city,
      slug: input.slug,
      slot: input.illustrations?.["4L"],
    }),
    "4R": toIllustrationAbsolutePath({
      city: input.city,
      slug: input.slug,
      slot: input.illustrations?.["4R"],
    }),
  };

  const hasAnyIllustration = Object.values(slots).some(Boolean);
  if (!hasAnyIllustration) return input.content;

  const paragraphs = splitContentToParagraphs(input.content);

  return paragraphs
    .map((paragraph, index) => {
      const paragraphNumber = index + 1;
      const markers: string[] = [];

      if (paragraphNumber === 2) {
        if (slots["2L"]) markers.push(`[[illustration:${slots["2L"]}|left]]`);
        if (slots["2R"]) markers.push(`[[illustration:${slots["2R"]}|right]]`);
      }

      if (paragraphNumber === 4) {
        if (slots["4L"]) markers.push(`[[illustration:${slots["4L"]}|left]]`);
        if (slots["4R"]) markers.push(`[[illustration:${slots["4R"]}|right]]`);
      }

      if (markers.length === 0) return paragraph;
      return `${paragraph}\n\n${markers.join("\n")}`;
    })
    .join("\n\n");
};

const splitContentToParagraphs = (content: string): string[] => {
  const byBlankLines = content
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (byBlankLines.length >= 4) {
    return byBlankLines;
  }

  const bySingleLines = content
    .split(/\r?\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return bySingleLines.length > byBlankLines.length
    ? bySingleLines
    : byBlankLines;
};

const toIllustrationAbsolutePath = (input: {
  city: string;
  slug: string;
  slot: { isActive?: boolean; savedFile?: string } | undefined;
}): string => {
  if (!input.slot?.isActive) return "";
  const savedFile = input.slot.savedFile?.trim();
  if (!savedFile) return "";
  if (savedFile.startsWith("/")) return savedFile;
  return `/data/landmarks/${input.city}/${input.slug}/${savedFile}`;
};

const normalizeMediaPath = (input: {
  src: string;
  city: string;
  slug: string;
}): string => {
  const raw = input.src?.trim();
  if (!raw) return "";
  if (raw.startsWith("/") || /^https?:\/\//i.test(raw)) return raw;
  return `/data/landmarks/${input.city}/${input.slug}/${raw}`;
};

const normalizeIllustrationPaths = (input: {
  contentFile: string;
  city: string;
  slug: string;
}): string => {
  if (!input.contentFile) return "";

  return input.contentFile.replace(
    /\[\[illustration:([^\]|]+)(?:\|([^\]]+))?\]\]/gi,
    (_match, rawSrc: string, side?: string) => {
      const normalizedSrc = normalizeMediaPath({
        src: String(rawSrc ?? ""),
        city: input.city,
        slug: input.slug,
      });
      const resolvedSide = String(side ?? "left").trim() || "left";
      return `[[illustration:${normalizedSrc}|${resolvedSide}]]`;
    },
  );
};
