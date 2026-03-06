import fs from "fs/promises";
import path from "path";

const citiesFilePath = path.join(process.cwd(), "data", "cities.json");

const asBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  return fallback;
};

const normalizeCity = (item) => {
  const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
  const cityName = typeof item?.city === "string" ? item.city.trim() : "";
  const cityIdRaw = typeof item?.cityId === "string" ? item.cityId.trim() : "";
  const cityId = cityIdRaw || (slug ? `city_${slug}` : "");

  const name = {
    ru: typeof item?.name?.ru === "string" ? item.name.ru : cityName,
    en: typeof item?.name?.en === "string" ? item.name.en : cityName,
    de: typeof item?.name?.de === "string" ? item.name.de : cityName,
    uk: typeof item?.name?.uk === "string" ? item.name.uk : cityName,
  };

  const countryName = {
    en:
      typeof item?.countryName?.en === "string"
        ? item.countryName.en
        : item?.countryId?.replace(/^country_/, "") || "",
    de: typeof item?.countryName?.de === "string" ? item.countryName.de : "",
    ru: typeof item?.countryName?.ru === "string" ? item.countryName.ru : "",
    uk: typeof item?.countryName?.uk === "string" ? item.countryName.uk : "",
  };

  const info = {
    en: typeof item?.info?.en === "string" ? item.info.en : "",
    de: typeof item?.info?.de === "string" ? item.info.de : "",
    ru: typeof item?.info?.ru === "string" ? item.info.ru : "",
    uk: typeof item?.info?.uk === "string" ? item.info.uk : "",
  };

  return {
    cityId,
    slug,
    city: cityName || name.en,
    countryId:
      typeof item?.countryId === "string" && item.countryId.trim().length > 0
        ? item.countryId.trim()
        : "country_unknown",
    countryName,
    name,
    info,
    geo: {
      lat: typeof item?.geo?.lat === "number" ? item.geo.lat : 0,
      lng: typeof item?.geo?.lng === "number" ? item.geo.lng : 0,
      source:
        typeof item?.geo?.source === "string" &&
        item.geo.source.trim().length > 0
          ? item.geo.source.trim()
          : "manual",
    },
    menu: {
      hasMapOption: asBoolean(item?.menu?.hasMapOption, false),
      mapLabel: {
        ru:
          typeof item?.menu?.mapLabel?.ru === "string"
            ? item.menu.mapLabel.ru
            : "Показать на карте",
        en:
          typeof item?.menu?.mapLabel?.en === "string"
            ? item.menu.mapLabel.en
            : "Show on map",
        de:
          typeof item?.menu?.mapLabel?.de === "string"
            ? item.menu.mapLabel.de
            : "Auf der Karte anzeigen",
        uk:
          typeof item?.menu?.mapLabel?.uk === "string"
            ? item.menu.mapLabel.uk
            : "Показати на мапі",
      },
    },
    status: {
      geoReady: asBoolean(item?.status?.geoReady, false),
      isActive: asBoolean(item?.status?.isActive, true),
    },
    landmarks: Array.isArray(item?.landmarks) ? item.landmarks : [],
    updatedAt:
      typeof item?.updatedAt === "string" && item.updatedAt.trim().length > 0
        ? item.updatedAt
        : new Date().toISOString(),
  };
};

export const loadCitiesRegistry = async () => {
  try {
    const raw = await fs.readFile(citiesFilePath, "utf8");
    const sanitized = raw.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(sanitized);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCity).filter((item) => item.cityId && item.slug);
  } catch {
    return [];
  }
};

export const saveCitiesRegistry = async (cities) => {
  await fs.mkdir(path.dirname(citiesFilePath), { recursive: true });
  await fs.writeFile(citiesFilePath, JSON.stringify(cities, null, 2), "utf8");
};

export const listCityOptions = async () => {
  const cities = await loadCitiesRegistry();
  return cities.map((item) => ({
    cityId: item.cityId,
    slug: item.slug,
    label: item.name?.en || item.city,
  }));
};

export const findCityById = async (cityId) => {
  const normalizedId = typeof cityId === "string" ? cityId.trim() : "";
  if (!normalizedId) return null;

  const cities = await loadCitiesRegistry();
  return cities.find((item) => item.cityId === normalizedId) ?? null;
};
