import fs from "fs/promises";
import path from "path";

type NormalizeCityResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; normalized: true };
};

type CityMeta = {
  title: string;
  subtitle: string;
  keywords: string[];
  shortDescription: string;
};

// Skill v1.9: нормализует структуру данных города.
export async function normalizeCity(cityName: string): Promise<NormalizeCityResult> {
  const citySlug = slugify(cityName);
  const cityDir = path.join(process.cwd(), "data", "landmarks", citySlug);
  const cityIndexPath = path.join(cityDir, "index.json");

  // Проверяем, существует ли город.
  if (!(await exists(cityIndexPath))) {
    return {
      type: "error",
      message: "Город не найден",
    };
  }

  // Создаём структуру папок города, если их нет.
  await fs.mkdir(path.join(cityDir, "cover"), { recursive: true });
  await fs.mkdir(path.join(cityDir, "hero"), { recursive: true });
  await fs.mkdir(path.join(cityDir, "gallery"), { recursive: true });

  const dataPath = path.join(cityDir, "data.json");
  const rawData = await readJson<Record<string, unknown>>(dataPath, {});
  const data = typeof rawData === "object" && rawData !== null ? rawData : {};

  // Добавляем недостающие поля, не изменяя существующие.
  if (data.meta === undefined || data.meta === null || typeof data.meta !== "object") {
    data.meta = createEmptyMeta();
  } else {
    const meta = data.meta as Record<string, unknown>;
    if (meta.title === undefined) meta.title = "";
    if (meta.subtitle === undefined) meta.subtitle = "";
    if (meta.keywords === undefined) meta.keywords = [];
    if (meta.shortDescription === undefined) meta.shortDescription = "";
  }

  if (data.description === undefined) {
    data.description = "";
  }
  if (data.cover === undefined) {
    data.cover = "";
  }
  if (data.hero === undefined) {
    data.hero = "";
  }
  if (data.gallery === undefined) {
    data.gallery = [];
  }

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");

  return {
    type: "success",
    message: "Город нормализован",
    data: {
      city: cityName,
      normalized: true,
    },
  };
}

// Создаёт пустую структуру meta.
function createEmptyMeta(): CityMeta {
  return {
    title: "",
    subtitle: "",
    keywords: [],
    shortDescription: "",
  };
}

// Читает JSON с резервным значением.
async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// Проверяет существование файла.
async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Преобразует имя в slug.
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-");
}
