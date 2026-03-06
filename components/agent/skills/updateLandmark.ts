import fs from "fs/promises";
import path from "path";

type UpdateLandmarkResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; landmark: string; updates: Record<string, unknown> };
};

// Skill v1.2: обновляет данные существующей достопримечательности.
export async function updateLandmark(
  cityName: string,
  landmarkName: string,
  updates: Record<string, unknown>
): Promise<UpdateLandmarkResult> {
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
  const { list, container } = normalizeIndex(rawIndex);

  const target = list.find((item) =>
    matchesLandmark(item, landmarkName)
  );

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

  const oldData = await readJson<Record<string, unknown>>(dataPath, {});
  const newData = { ...oldData, ...updates };

  // Сохраняем обновлённые данные.
  await fs.writeFile(dataPath, JSON.stringify(newData, null, 2), "utf-8");

  // Если изменилось название, обновляем запись в index.json.
  if (typeof updates.title === "string" && updates.title.trim()) {
    target.title = updates.title.trim();
    await persistIndex(container, cityIndexPath);
  }

  return {
    type: "success",
    message: "Данные достопримечательности обновлены",
    data: {
      city: cityName,
      landmark: landmarkName,
      updates,
    },
  };
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

// Нормализует index.json, поддерживая массив или объект с полем landmarks.
function normalizeIndex(raw: unknown) {
  if (Array.isArray(raw)) {
    return { list: raw as Array<{ slug?: string; title?: string }>, container: raw };
  }

  const container = (raw ?? {}) as { landmarks?: Array<{ slug?: string; title?: string }> };
  if (!Array.isArray(container.landmarks)) {
    container.landmarks = [];
  }

  return { list: container.landmarks, container };
}

// Сохраняет index.json после обновления.
async function persistIndex(container: unknown, filePath: string) {
  await fs.writeFile(filePath, JSON.stringify(container, null, 2), "utf-8");
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
