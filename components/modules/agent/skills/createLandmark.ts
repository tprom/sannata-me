import fs from "fs/promises";
import path from "path";

export type CreateLandmarkResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; slug: string };
};

// Skill v1.0: создаёт структуру данных достопримечательности и обновляет индекс города.
export async function createLandmark(city: string, name: string): Promise<CreateLandmarkResult> {
  const dataRoot = path.join(process.cwd(), "data", "landmarks");
  const citySlug = city.trim().toLowerCase();
  const cityIndexPath = path.join(dataRoot, citySlug, "index.json");

  const cityIndexExists = await exists(cityIndexPath);
  if (!cityIndexExists) {
    return {
      type: "error",
      message: "Город не найден.",
    };
  }
  const landmarkSlug = slugify(name);

  const cityIndex = await readJson<Array<{ slug: string; title: string; thumbnail?: string }>>(
    cityIndexPath,
    []
  );

  if (cityIndex.some((item) => item.slug === landmarkSlug)) {
    return {
      type: "error",
      message: "Достопримечательность уже существует.",
    };
  }

  const landmarkDir = path.join(dataRoot, citySlug, landmarkSlug);
  const galleryDir = path.join(landmarkDir, "gallery");

  await fs.mkdir(galleryDir, { recursive: true });

  const dataPath = path.join(landmarkDir, "data.json");
  const landmarkData = {
    title: name,
    description: "",
    images: [],
  };

  await fs.writeFile(dataPath, JSON.stringify(landmarkData, null, 2), "utf-8");

  const nextIndex = [...cityIndex, { slug: landmarkSlug, title: name }];
  await fs.writeFile(cityIndexPath, JSON.stringify(nextIndex, null, 2), "utf-8");

  return {
    type: "success",
    message: "Достопримечательность создана",
    data: { city: citySlug, slug: landmarkSlug },
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
