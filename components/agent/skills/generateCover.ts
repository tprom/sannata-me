import fs from "fs/promises";
import path from "path";

type GenerateCoverResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; landmark: string; cover: string };
};

// Skill v1.5: обновляет поле cover и регистрирует обложку для достопримечательности.
export async function generateCover(
  cityName: string,
  landmarkName: string,
  coverImage: string
): Promise<GenerateCoverResult> {
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
  const landmarkDir = path.join(process.cwd(), "data", "landmarks", citySlug, landmarkSlug);
  const coverDir = path.join(landmarkDir, "cover");
  const dataPath = path.join(landmarkDir, "data.json");

  // Создаём папку cover, если её нет.
  await fs.mkdir(coverDir, { recursive: true });

  if (!(await exists(dataPath))) {
    return {
      type: "error",
      message: "Данные достопримечательности не найдены",
    };
  }

  const rawData = await readJson<Record<string, unknown>>(dataPath, {});
  const data = typeof rawData === "object" && rawData !== null ? rawData : {};

  // Обновляем только поле cover.
  data.cover = `cover/${coverImage}`;

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");

  return {
    type: "success",
    message: "Обложка обновлена",
    data: {
      city: cityName,
      landmark: landmarkName,
      cover: coverImage,
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
