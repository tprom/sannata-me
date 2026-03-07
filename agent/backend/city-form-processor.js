import { loadCitiesRegistry, saveCitiesRegistry } from "./cities-registry";
import fs from "fs/promises";
import path from "path";

const parseValue = (rawValue) => {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toSlug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const toCountryId = (value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("country_")) return normalized;

  const slug = toSlug(normalized);
  return slug ? `country_${slug}` : "";
};

const fromCountryId = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^country_/, "");

const validateGeo = (lat, lng) => {
  if (lat < -90 || lat > 90) {
    throw new Error("geo.lat должен быть в диапазоне [-90, 90].");
  }
  if (lng < -180 || lng > 180) {
    throw new Error("geo.lng должен быть в диапазоне [-180, 180].");
  }
};

export const buildCityFormMarkdown = (city) => {
  const source = city ?? {};
  const name = source.name ?? {};
  const geo = source.geo ?? {};
  const menu = source.menu ?? {};
  const mapLabel = menu.mapLabel ?? {};
  const status = source.status ?? {};

  const cityId = String(source.cityId ?? "");
  const slug = String(source.slug ?? "");
  const countryId = String(source.countryId ?? "");
  const countryName = source.countryName ?? {};
  const info = source.info ?? {};
  const nameRu = String(name.ru ?? "");
  const nameEn = String(name.en ?? source.city ?? "");
  const nameDe = String(name.de ?? "");
  const nameUk = String(name.uk ?? "");
  const geoLat =
    typeof geo.lat === "number" && Number.isFinite(geo.lat)
      ? String(geo.lat)
      : "";
  const geoLng =
    typeof geo.lng === "number" && Number.isFinite(geo.lng)
      ? String(geo.lng)
      : "";
  const geoSource = String(geo.source ?? "manual");
  const hasMapOption = menu.hasMapOption === true ? "true" : "false";
  const geoReady = status.geoReady === true ? "true" : "false";
  const isActive = status.isActive === false ? "false" : "true";

  return [
    "# Форма города",
    "",
    "Эта форма создаёт или обновляет только данные города.",
    "Форма достопримечательности не должна создавать города.",
    "",
    "## A. Страна",
    "",
    `countryEn: ${String(countryName.en ?? fromCountryId(countryId))}`,
    `countryDe: ${String(countryName.de ?? "")}`,
    `countryRu: ${String(countryName.ru ?? "")}`,
    `countryUk: ${String(countryName.uk ?? "")}`,
    "",
    "## B. Город",
    "",
    `nameEn: ${nameEn}`,
    `nameDe: ${nameDe}`,
    `nameRu: ${nameRu}`,
    `nameUk: ${nameUk}`,
    "",
    "## C. Геоданные",
    "",
    `geoLat: ${geoLat}`,
    `geoLng: ${geoLng}`,
    `geoSource: ${geoSource}`,
    "",
    "## D. Информация о городе",
    "",
    `cityInfoEn: ${String(info.en ?? "")}`,
    `cityInfoDe: ${String(info.de ?? "")}`,
    `cityInfoRu: ${String(info.ru ?? "")}`,
    `cityInfoUk: ${String(info.uk ?? "")}`,
    "",
    "## E. Служебные поля (авто)",
    "",
    `cityId: ${cityId}`,
    `slug: ${slug}`,
    `countryId: ${countryId}`,
    `hasMapOption: ${hasMapOption}`,
    `geoReady: ${geoReady}`,
    `isActive: ${isActive}`,
    `mapLabelRu: ${String(mapLabel.ru ?? "Показать на карте")}`,
    `mapLabelEn: ${String(mapLabel.en ?? "Show on map")}`,
    `mapLabelDe: ${String(mapLabel.de ?? "Auf der Karte anzeigen")}`,
    `mapLabelUk: ${String(mapLabel.uk ?? "Показати на мапі")}`,
    "",
  ].join("\n");
};

export const parseCityForm = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const fields = {};

  for (const line of lines) {
    const match = line.match(/^[-*]?\s*([A-Za-z0-9_.]+)\s*:\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = parseValue(match[2]);
  }

  return fields;
};

export const processCityForm = async (markdown) => {
  const fields = parseCityForm(markdown);

  const countryName = {
    en: String(
      fields.countryEn || fromCountryId(fields.countryId) || "",
    ).trim(),
    de: String(fields.countryDe || "").trim(),
    ru: String(fields.countryRu || "").trim(),
    uk: String(fields.countryUk || "").trim(),
  };

  const countryId =
    toCountryId(countryName.en) || String(fields.countryId || "").trim();

  if (!countryId) {
    throw new Error("Поле countryEn обязательно (используется для countryId).");
  }

  const slug = toSlug(fields.slug || fields.nameEn || fields.nameRu);
  if (!slug) {
    throw new Error("Поле slug обязательно.");
  }

  const cityId = String(fields.cityId || `city_${slug}`).trim();
  if (!cityId) {
    throw new Error("Поле cityId обязательно.");
  }

  const name = {
    ru: String(fields.nameRu || "").trim(),
    en: String(fields.nameEn || "").trim(),
    de: String(fields.nameDe || "").trim(),
    uk: String(fields.nameUk || "").trim(),
  };

  if (!name.ru || !name.en || !name.de || !name.uk) {
    throw new Error(
      "Все локали города обязательны: nameRu, nameEn, nameDe, nameUk.",
    );
  }

  const lat = toNumber(fields.geoLat, 0);
  const lng = toNumber(fields.geoLng, 0);
  validateGeo(lat, lng);

  const hasMapOption = toBoolean(fields.hasMapOption, true);
  const geoReady = toBoolean(fields.geoReady, true);
  if (hasMapOption && !geoReady) {
    throw new Error("Если hasMapOption=true, то geoReady должен быть true.");
  }

  const info = {
    en: String(fields.cityInfoEn || "").trim(),
    de: String(fields.cityInfoDe || "").trim(),
    ru: String(fields.cityInfoRu || "").trim(),
    uk: String(fields.cityInfoUk || "").trim(),
  };

  const cities = await loadCitiesRegistry();
  const index = cities.findIndex((item) => item.cityId === cityId);
  const existing = index >= 0 ? cities[index] : null;

  const nextCity = {
    cityId,
    slug,
    city: name.en,
    countryId,
    countryName,
    name,
    info,
    geo: {
      lat,
      lng,
      source: String(fields.geoSource || "manual").trim() || "manual",
    },
    menu: {
      hasMapOption,
      mapLabel: {
        ru: String(fields.mapLabelRu || "Показать на карте").trim(),
        en: String(fields.mapLabelEn || "Show on map").trim(),
        de: String(fields.mapLabelDe || "Auf der Karte anzeigen").trim(),
        uk: String(fields.mapLabelUk || "Показати на мапі").trim(),
      },
    },
    status: {
      geoReady,
      isActive: toBoolean(fields.isActive, true),
    },
    landmarks: existing?.landmarks ?? [],
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    cities[index] = nextCity;
  } else {
    cities.push(nextCity);
  }

  await saveCitiesRegistry(cities);

  // Ensure a minimal `data/landmarks/{slug}/data.json` exists so the landmarks
  // module will pick up the newly created city directory and show it in the UI.
  try {
    const landmarksDir = path.join(process.cwd(), "data", "landmarks");
    const cityDir = path.join(landmarksDir, slug);
    await fs.mkdir(cityDir, { recursive: true });
    const dataPath = path.join(cityDir, "data.json");
    try {
      await fs.access(dataPath);
      // if exists, do not overwrite
    } catch {
      const dataJson = {
        meta: { title: nextCity.name?.en ?? nextCity.slug },
        description: nextCity.info?.en ?? "",
        hero: "",
        gallery: [],
        pageContent: null,
      };
      await fs.writeFile(dataPath, JSON.stringify(dataJson, null, 2), "utf8");
    }
  } catch (err) {
    // Non-fatal: log and continue
    // console.warn('Could not create city data.json:', err);
  }

  return {
    city: nextCity,
    mode: index >= 0 ? "updated" : "created",
  };
};

export const deleteCityById = async (cityIdRaw) => {
  const cityId = String(cityIdRaw ?? "").trim();
  if (!cityId) {
    throw new Error("Для удаления укажите cityId.");
  }

  const cities = await loadCitiesRegistry();
  const index = cities.findIndex((item) => item.cityId === cityId);
  if (index < 0) {
    throw new Error("Город с указанным cityId не найден.");
  }

  const city = cities[index];
  const hasRegistryLandmarks =
    Array.isArray(city.landmarks) && city.landmarks.length > 0;
  if (hasRegistryLandmarks) {
    throw new Error(
      "Нельзя удалить город: в реестре уже есть привязанные достопримечательности.",
    );
  }

  const cityDir = path.join(process.cwd(), "data", "landmarks", city.slug);
  try {
    const entries = await fs.readdir(cityDir, { withFileTypes: true });
    const landmarkDirs = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const landmarkDataPath = path.join(cityDir, entry.name, "data.json");
      try {
        await fs.access(landmarkDataPath);
        landmarkDirs.push(entry.name);
      } catch {
        // ignore folders without landmark data.json
      }
    }

    if (landmarkDirs.length > 0) {
      throw new Error(
        "Нельзя удалить город: найдены обработанные достопримечательности в data/landmarks.",
      );
    }

    await fs.rm(cityDir, { recursive: true, force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    } else if (error instanceof Error) {
      throw error;
    }
  }

  cities.splice(index, 1);
  await saveCitiesRegistry(cities);

  return {
    cityId: city.cityId,
    slug: city.slug,
    mode: "deleted",
  };
};
