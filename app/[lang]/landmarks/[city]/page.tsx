import "@/components/modules/landmarks/styles.css";
import fs from "fs/promises";
import path from "path";
import CityMenu from "@/components/modules/landmarks/CityMenu";
import CollectionSectionsRenderer from "@/components/modules/landmarks/CollectionSectionsRenderer";
import { adaptLandmarksCollectionHomeToEnvelope } from "@/lib/universal-page-template/landmarks-adapters";
import CityPageContent from "@/components/city/CityPageContent";
import type { CityPageContent as CityPageContentType } from "@/data/types";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    lang: string;
    city: string;
  }>;
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

export default async function CityPage({ params }: Params) {
  const { lang, city } = await params;
  const basePath = path.join(process.cwd(), "data", "landmarks");

  const cities = await listCities(basePath, lang);
  const landmarks = await listLandmarks(basePath, city);
  const cityData = await loadJson(
    path.join(basePath, city, "data.json"),
    {} as {
      description?: string;
      hero?: string;
      gallery?: string[];
      meta?: {
        title?: string;
        subtitle?: string;
        shortDescription?: string;
      };
      pageContent?: CityPageContentType;
    },
  );

  const cityTitle = cities.find((item) => item.slug === city)?.city ?? city;
  const cityMeta = {
    title: cityData.meta?.title ?? cityTitle,
    subtitle: cityData.meta?.subtitle ?? "",
    shortDescription: cityData.meta?.shortDescription ?? "",
  };
  const cityDescription =
    typeof cityData.description === "string" && cityData.description.trim()
      ? cityData.description
      : "Информация о городе будет добавлена позже.";
  const cityHero = cityData.hero ?? "";

  const menuLandmarks = await Promise.all(
    landmarks.map(async (landmark) => {
      const landmarkData = await loadJson(
        path.join(basePath, city, landmark.slug, "data.json"),
        {} as {
          hero?: string;
          cover?: string;
          meta?: { title?: string; shortDescription?: string };
          title?: string;
          content?:
            | Array<{ type?: string; src?: string }>
            | Record<string, string>
            | string;
          landmark?: string;
          blocks?: { passport?: string; meaning?: string };
          images?: { items?: Array<{ fileName?: string; savedFile?: string }> };
          gallery?: {
            items?: Array<{ fileName?: string; savedFile?: string }>;
          };
        },
      );

      const image = resolveLandmarkThumbnail({
        data: landmarkData,
        city,
        slug: landmark.slug,
        fallback: landmark.thumbnail,
      });
      const title = resolveLandmarkTitle({
        data: landmarkData,
        fallback: landmark.title ?? landmark.slug,
        lang,
      });

      return {
        slug: landmark.slug,
        title,
        shortDescription: landmarkData.meta?.shortDescription ?? "",
        thumbnail: image,
        hero: landmarkData.hero,
        cover: landmarkData.cover,
      };
    }),
  );

  const envelope = adaptLandmarksCollectionHomeToEnvelope({
    locale: lang,
    citySlug: city,
    cityTitle: cityMeta.title,
    subtitle: cityMeta.subtitle,
    shortDescription: cityMeta.shortDescription,
    description: cityDescription,
    heroImage: cityHero,
    landmarks: menuLandmarks,
  });

  return (
    <div className="city-page">
      <CityMenu
        cities={cities}
        activeCity={city}
        lang={lang}
        activeCityLandmarks={menuLandmarks}
      />
      <div className="city-content">
        {cityData.pageContent ? (
          <>
            <CityPageContent content={cityData.pageContent} lang={lang} />
            <CollectionSectionsRenderer
              envelope={envelope}
              heroDescription={cityMeta.shortDescription}
            />
          </>
        ) : (
          <CollectionSectionsRenderer
            envelope={envelope}
            heroDescription={cityMeta.shortDescription}
          />
        )}
      </div>
    </div>
  );
}

type LandmarkIndexItem = {
  slug: string;
  title?: string;
  thumbnail?: string;
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
      const landmarkCount = (await listLandmarks(basePath, slug)).length;
      const hasData = await fileExists(path.join(cityPath, "data.json"));
      if (!hasData && landmarkCount === 0) return null;

      const cityData = hasData
        ? await loadJson(
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

      const data = await loadJson(dataPath, {} as Record<string, unknown>);
      if (isArchivedLandmarkData(data)) {
        return null;
      }

      return { slug: entry.name };
    }),
  );

  return landmarks.filter(Boolean) as LandmarkIndexItem[];
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

const resolveLandmarkTitle = (input: {
  data: {
    meta?: { title?: string | Record<string, string> };
    title?: string;
    landmark?: string | Record<string, string>;
    blocks?: { passport?: string };
  };
  fallback: string;
  lang: string;
}): string => {
  const metaTitle = resolveLocalizedValue(input.data.meta?.title, input.lang);
  if (metaTitle) return capitalizeFirst(metaTitle);
  const localizedLandmark = resolveLocalizedValue(
    input.data.landmark,
    input.lang,
  );
  if (localizedLandmark) return capitalizeFirst(localizedLandmark);
  if (input.data.title) return capitalizeFirst(input.data.title);
  if (typeof input.data.landmark === "string") {
    return capitalizeFirst(input.data.landmark);
  }
  const passportTitle = extractPassportTitle(input.data.blocks?.passport ?? "");
  return capitalizeFirst(passportTitle || input.fallback);
};

const loadCityRegistryNames = async (
  lang: string,
): Promise<Record<string, string>> => {
  const registry = await loadJson(
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

    const data = await loadJson(
      dataPath,
      {} as { meta?: { city?: string | Record<string, string> } },
    );
    const localized = resolveLocalizedValue(data.meta?.city, lang);
    if (localized) return localized;
  }

  return null;
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
  fallback?: string;
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
  return input.fallback ?? "";
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
