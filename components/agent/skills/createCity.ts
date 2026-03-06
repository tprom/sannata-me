import fs from "fs/promises";
import path from "path";

type CreateCityResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; slug: string };
};

// Skill v1.1: создаёт структуру нового города в модуле landmarks.
export async function createCity(cityName: string): Promise<CreateCityResult> {
  const citySlug = slugify(cityName);
  const dataRoot = path.join(process.cwd(), "data", "landmarks");
  const cityDir = path.join(dataRoot, citySlug);
  const citiesIndexPath = path.join(dataRoot, "index.json");

  // Проверяем, существует ли город (по папке города).
  const citiesIndex = await readJson<Array<{ city: string; slug: string; count: number }>>(
    citiesIndexPath,
    []
  );

  const alreadyExists =
    (await exists(cityDir)) ||
    citiesIndex.some(
      (item) =>
        item.slug.toLowerCase() === citySlug ||
        item.city.toLowerCase() === cityName.toLowerCase()
    );

  if (alreadyExists) {
    return {
      type: "error",
      message: "Город уже существует",
      data: { city: cityName, slug: citySlug },
    };
  }

  // Создаём папку города.
  await fs.mkdir(cityDir, { recursive: true });

  // Создаём index.json со списком достопримечательностей (пока пустым).
  const indexPath = path.join(cityDir, "index.json");
  const indexPayload = {
    city: cityName,
    slug: citySlug,
    landmarks: [],
  };

  await fs.writeFile(indexPath, JSON.stringify(indexPayload, null, 2), "utf-8");

  // Обновляем глобальный список городов для меню landmarks.
  const nextIndex = [...citiesIndex, { city: cityName, slug: citySlug, count: 0 }];
  await fs.writeFile(citiesIndexPath, JSON.stringify(nextIndex, null, 2), "utf-8");

  return {
    type: "success",
    message: "Город успешно создан",
    data: { city: cityName, slug: citySlug },
  };
}

// Проверяет существование файла или папки.
async function exists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
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

// Преобразует имя города в slug.
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-");
}
