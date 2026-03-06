import "@/components/modules/landmarks/styles.css";
import fs from "fs/promises";
import path from "path";
import CityMenu from "@/components/modules/landmarks/CityMenu";
import ModuleSectionsRenderer from "@/components/modules/landmarks/ModuleSectionsRenderer";
import ModuleHomePage from "@/app/landmarks/ModuleHomePage";
import { adaptLandmarksModuleHomeToEnvelope } from "@/lib/universal-page-template/landmarks-adapters";

// Disable caching to ensure latest data is always shown
export const revalidate = 0;

type Params = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function ModulePage({ params }: Params) {
  const { lang } = await params;
  const basePath = path.join(process.cwd(), "data", "landmarks");
  const cities = await listCities(basePath);

  // Try to load new module home page (localized envelope)
  const envelopePath = path.join(
    process.cwd(),
    "app",
    "landmarks",
    "data",
    `home.${lang}.json`,
  );

  let useNewLayout = false;
  let moduleHomeEnvelope = null;

  try {
    const envelopeContent = await fs.readFile(envelopePath, "utf-8");
    moduleHomeEnvelope = JSON.parse(envelopeContent);
    useNewLayout = true;
    console.log(
      `[landmarks page] Loaded new layout for ${lang} from ${envelopePath}`,
    );
  } catch (error) {
    // Fall back to old layout if new one doesn't exist
    console.log(
      `[landmarks page] Failed to load new layout for ${lang}: ${error}`,
    );
  }

  // Use new ModuleHomePage if available, otherwise use old renderer
  if (useNewLayout && moduleHomeEnvelope) {
    return (
      <div className="landmarks-layout">
        <CityMenu cities={cities} lang={lang} />
        <div className="landmarks-content">
          <ModuleHomePage envelope={moduleHomeEnvelope} />
        </div>
      </div>
    );
  }

  // Fallback to old layout
  const envelope = adaptLandmarksModuleHomeToEnvelope({
    locale: lang,
    cities,
  });

  return (
    <div className="landmarks-layout">
      <CityMenu cities={cities} lang={lang} />
      <ModuleSectionsRenderer envelope={envelope} />
    </div>
  );
}

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
      const landmarkCount = (await listLandmarkDirs(cityPath)).length;
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

const listLandmarkDirs = async (cityPath: string): Promise<string[]> => {
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

      return entry.name;
    }),
  );

  return landmarks.filter(Boolean) as string[];
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
