import fs from "fs/promises";
import path from "path";

type GenerateCityImageResult = {
  type: "success" | "error";
  message: string;
  data?: { city: string; type: string; file: string };
};

type ImageType = "cover" | "hero" | "gallery" | "image";

type ImageTarget = {
  folder: string;
  field: "cover" | "hero" | "gallery" | "images";
  isArray: boolean;
};

// Skill v2.1: генерирует изображение для города и регистрирует его в data.json.
export async function generateCityImage(
  cityName: string,
  imageType: ImageType,
  prompt: string
): Promise<GenerateCityImageResult> {
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

  const targetInfo = resolveTarget(imageType);
  const targetDir = path.join(cityDir, targetInfo.folder);

  // Создаём папку назначения, если её нет.
  await fs.mkdir(targetDir, { recursive: true });

  const fileName = buildImageFileName(citySlug);
  const filePath = path.join(targetDir, fileName);

  // Генерируем изображение через встроенный генератор.
  const imageBuffer = await generateImageBuffer(prompt);
  await fs.writeFile(filePath, imageBuffer);

  const rawData = await readJson<Record<string, unknown>>(dataPath, {});
  const data = typeof rawData === "object" && rawData !== null ? rawData : {};
  const relativePath = `${targetInfo.folder}/${fileName}`;

  // Обновляем соответствующее поле data.json.
  if (targetInfo.isArray) {
    const existing = Array.isArray(data[targetInfo.field])
      ? (data[targetInfo.field] as string[])
      : [];
    existing.push(relativePath);
    data[targetInfo.field] = existing;
  } else {
    data[targetInfo.field] = relativePath;
  }

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");

  return {
    type: "success",
    message: "Изображение города создано",
    data: {
      city: cityName,
      type: imageType,
      file: fileName,
    },
  };
}

// Определяет параметры для сохранения в зависимости от типа изображения.
function resolveTarget(imageType: ImageType): ImageTarget {
  if (imageType === "cover") {
    return { folder: "cover", field: "cover", isArray: false };
  }
  if (imageType === "hero") {
    return { folder: "hero", field: "hero", isArray: false };
  }
  if (imageType === "gallery") {
    return { folder: "gallery", field: "gallery", isArray: true };
  }

  return { folder: "images", field: "images", isArray: true };
}

// Генерирует имя файла изображения.
function buildImageFileName(citySlug: string) {
  return `${Date.now()}-${citySlug}.jpg`;
}

// Генерирует изображение по prompt (встроенный генератор-заглушка).
async function generateImageBuffer(prompt: string): Promise<Uint8Array> {
  void prompt;
  const base64Jpeg =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfA//Z";
  return new Uint8Array(Buffer.from(base64Jpeg, "base64"));
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
