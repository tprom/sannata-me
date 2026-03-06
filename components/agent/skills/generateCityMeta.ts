import fs from "fs/promises";
import path from "path";

type MetaData = {
  title?: string;
  subtitle?: string;
  keywords?: string[];
  shortDescription?: string;
};

type GenerateCityMetaResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; updated: true };
};

// Skill v2.3: обновляет поле meta для города.
export async function generateCityMeta(
  cityName: string,
  meta: MetaData
): Promise<GenerateCityMetaResult> {
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

  const dataPath = path.join(cityDir, "data.json");
  if (!(await exists(dataPath))) {
    return {
      type: "error",
      message: "Данные города не найдены",
    };
  }

  const rawData = await readJson<Record<string, unknown>>(dataPath, {});
  const data = typeof rawData === "object" && rawData !== null ? rawData : {};

  // Обновляем только поле meta.
  data.meta = {
    ...((data.meta as Record<string, unknown>) ?? {}),
    ...meta,
  };

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");

  return {
    type: "success",
    message: "Meta города обновлена",
    data: {
      city: cityName,
      updated: true,
    },
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
