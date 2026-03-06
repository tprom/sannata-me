import fs from "fs/promises";
import path from "path";

type MetaData = {
  title?: string;
  subtitle?: string;
  keywords?: string[];
  shortDescription?: string;
};

type GenerateMetaResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; landmark: string; updated: true };
};

// Skill v1.8: обновляет поле meta для достопримечательности.
export async function generateMeta(
  cityName: string,
  landmarkName: string,
  meta: MetaData
): Promise<GenerateMetaResult> {
  const citySlug = slugify(cityName);
  const cityIndexPath = path.join(process.cwd(), "data", "landmarks", citySlug, "index.json");

  // Проверяем, существует ли город.
  if (!(await exists(cityIndexPath))) {
    return {
      type: "error",
      message: "Город не найден",
    };
  }

  const rawIndex = await readJson<unknown>(cityIndexPath, []);
  const { list } = normalizeIndex(rawIndex);
  const target = list.find((item) => matchesLandmark(item, landmarkName));

  if (!target) {
    return {
      type: "error",
      message: "Достопримечательность не найдена",
    };
  }

  const landmarkSlug = target.slug ?? slugify(landmarkName);
  const dataPath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    citySlug,
    landmarkSlug,
    "data.json"
  );

  if (!(await exists(dataPath))) {
    return {
      type: "error",
      message: "Данные достопримечательности не найдены",
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
    message: "Meta обновлена",
    data: {
      city: cityName,
      landmark: landmarkName,
      updated: true,
    },
  };
}

// Нормализует index.json, поддерживая массив или объект с полем landmarks.
function normalizeIndex(raw: unknown) {
  if (Array.isArray(raw)) {
    return { list: raw as Array<{ slug?: string; title?: string }> };
  }

  const container = (raw ?? {}) as { landmarks?: Array<{ slug?: string; title?: string }> };
  if (!Array.isArray(container.landmarks)) {
    container.landmarks = [];
  }

  return { list: container.landmarks };
}

// Проверяет совпадение по slug или названию.
function matchesLandmark(
  item: { slug?: string; title?: string },
  landmarkName: string
) {
  const { targetText, targetSlug } = normalizeTarget(landmarkName);
  return (
    item.slug?.toLowerCase() === targetSlug ||
    item.title?.toLowerCase() === targetText
  );
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

// Нормализует имя достопримечательности для сравнения.
function normalizeTarget(value: string) {
  const cleaned = value
    .trim()
    .replace(/^\s*["«]+/, "")
    .replace(/["»\.]+\s*$/, "")
    .trim();
  return {
    targetText: cleaned.toLowerCase(),
    targetSlug: slugify(cleaned),
  };
}
