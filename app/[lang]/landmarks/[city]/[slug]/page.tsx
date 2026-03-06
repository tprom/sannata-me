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

  const cities = await listCities(basePath);

  const menuLandmarks = await listLandmarks(basePath, city);
  const menuLandmarkItems: LandmarkItem[] = menuLandmarks.map((item) => ({
    slug: item.slug,
    title: item.title ?? item.slug,
    thumbnail: item.thumbnail,
  }));

  const view = await loadJson(
    path.join(basePath, city, slug, `view.${lang}.json`),
    null as null | {
      greeting: string;
      stampImage: string;
      contentFile: string;
      footer: string;
      bookInvite?: string;
      bookLink?: string;
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
        bookInvite?: string;
        bookLink?: string;
      },
    ));

  const data = await loadJson(
    path.join(basePath, city, slug, "data.json"),
    null as null | {
      content?: string | Record<string, string>;
      prompts?: {
        greeting?: string | Record<string, string>;
        footer?: string | Record<string, string>;
        bookInvite?: string | Record<string, string>;
        bookLink?: string | Record<string, string>;
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

  const resolvedView = resolveLandmarkView({
    lang,
    city,
    slug,
    data,
    fallbackView,
  });

  const galleryData = await buildGallery({
    basePath,
    city,
    slug,
    data,
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
}): Promise<{
  images: Array<{ src: string; alt: string }>;
  source: "generated" | "legacy";
}> => {
  const generated = await readJson(
    path.join(input.basePath, input.city, input.slug, "gallery.generated.json"),
    null as null | {
      items?: Array<{
        index: number;
        status: "completed" | "waiting_manual" | "failed";
        outputPath: string;
      }>;
    },
  );

  const generatedImages = (generated?.items ?? [])
    .filter((item) => item.status === "completed" && item.outputPath)
    .map((item, index) => ({
      src: normalizeGalleryPath(item.outputPath, input.city, input.slug),
      alt: `Gallery ${typeof item.index === "number" ? item.index + 1 : index + 1}`,
    }))
    .filter((item) => Boolean(item.src));

  if (generatedImages.length > 0) {
    return {
      images: generatedImages,
      source: "generated",
    };
  }

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
};

const listCities = async (
  basePath: string,
): Promise<Array<{ city: string; slug: string; count: number }>> => {
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const cityDirs = entries.filter(
    (entry) => entry.isDirectory() && !isHiddenDir(entry.name),
  );

  const cities = await Promise.all(
    cityDirs.map(async (entry) => {
      const slug = entry.name;
      const cityPath = path.join(basePath, slug);
      const landmarkCount = (await listLandmarks(basePath, slug)).length;
      const hasData = await fileExists(path.join(cityPath, "data.json"));
      if (!hasData && landmarkCount === 0) return null;

      const cityData = hasData
        ? await readJson(
            path.join(cityPath, "data.json"),
            {} as { meta?: { title?: string } },
          )
        : { meta: { title: toTitle(slug) } };
      const title = cityData.meta?.title || toTitle(slug);

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

      const data = await readJson(dataPath, {} as Record<string, unknown>);
      if (isArchivedLandmarkData(data)) {
        return null;
      }

      return { slug: entry.name };
    }),
  );

  return landmarks.filter(Boolean) as LandmarkIndexItem[];
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
      bookInvite?: string | Record<string, string>;
      bookLink?: string | Record<string, string>;
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
  fallbackView: {
    greeting: string;
    stampImage: string;
    contentFile: string;
    footer: string;
    bookInvite?: string;
    bookLink?: string;
  } | null;
}): {
  greeting: string;
  stampImage: string;
  contentFile: string;
  footer: string;
  bookInvite?: string;
  bookLink?: string;
} | null => {
  const fallback = input.fallbackView;
  const contentFromData = readLocalized(input.data?.content, input.lang);
  const greetingFromData = readLocalizedPrompt(
    input.data?.prompts?.greeting,
    input.lang,
  );
  const footerFromData = readLocalizedPrompt(
    input.data?.prompts?.footer,
    input.lang,
  );
  const bookInviteFromData = readLocalizedPrompt(
    input.data?.prompts?.bookInvite,
    input.lang,
  );
  const bookLinkFromData = readLocalizedPrompt(
    input.data?.prompts?.bookLink,
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
    greetingFromData ||
    fallback?.greeting ||
    PROMPT_DEFAULTS.greeting[
      input.lang as keyof typeof PROMPT_DEFAULTS.greeting
    ] ||
    PROMPT_DEFAULTS.greeting.en;
  const contentFile = contentWithIllustrations || fallback?.contentFile || "";
  const footer =
    footerFromData ||
    fallback?.footer ||
    PROMPT_DEFAULTS.footer[input.lang as keyof typeof PROMPT_DEFAULTS.footer] ||
    PROMPT_DEFAULTS.footer.en;
  const bookInvite = bookInviteFromData || fallback?.bookInvite || "";
  const bookLink = bookLinkFromData || fallback?.bookLink || "";
  const rawStampImage = stampImage || fallback?.stampImage || "";

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
    !footer &&
    !resolvedStampImage &&
    !bookInvite &&
    !bookLink
  ) {
    return fallback;
  }

  return {
    greeting,
    stampImage: resolvedStampImage,
    contentFile: resolvedContentFile,
    footer,
    bookInvite,
    bookLink,
  };
};

const readLocalized = (
  value: string | Record<string, string> | undefined,
  lang: string,
): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const byLang = value[lang];
  if (typeof byLang === "string" && byLang.trim()) {
    return byLang.trim();
  }

  const ru = value.ru;
  if (typeof ru === "string" && ru.trim()) {
    return ru.trim();
  }

  const en = value.en;
  if (typeof en === "string" && en.trim()) {
    return en.trim();
  }

  const first = Object.values(value).find(
    (item) => typeof item === "string" && item.trim(),
  );
  return typeof first === "string" ? first.trim() : "";
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
