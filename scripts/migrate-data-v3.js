import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const landmarksRoot = path.join(root, "data", "landmarks");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--apply");

const normalizeSlug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toParagraph = (value) => {
  if (typeof value !== "string") return "";
  return value
    .split(/\r?\n/g)
    .map((line) => line.replace(/^\s*[•o\-\t]+\s*/i, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
};

const buildLegacyContent = (blocks) => {
  const p1 = toParagraph(blocks?.passport);
  const p2 = toParagraph(blocks?.history);
  const p3 = toParagraph(blocks?.sensory);
  const p4 = toParagraph(
    blocks?.legends || blocks?.touristExperience || blocks?.meaning,
  );

  return [p1, p2, p3, p4].filter(Boolean).join("\n\n");
};

const isV3 = (data) => {
  return (
    isObject(data?.meta) &&
    isObject(data?.meta?.city) &&
    isObject(data?.content) &&
    isObject(data?.postcardGraphics) &&
    isObject(data?.gallery)
  );
};

const toGallery = (legacyImages) => {
  const items = Array.isArray(legacyImages?.items) ? legacyImages.items : [];
  return {
    globalPrompt:
      typeof legacyImages?.globalPrompt === "string"
        ? legacyImages.globalPrompt
        : "",
    items: items.map((item, index) => {
      const savedRaw =
        typeof item?.savedFile === "string" ? item.savedFile : "";
      const savedFile = savedRaw
        ? savedRaw.startsWith("images/")
          ? savedRaw
          : `images/${savedRaw}`
        : "";

      return {
        index: typeof item?.index === "number" ? item.index : index,
        fileName: typeof item?.fileName === "string" ? item.fileName : "",
        savedFile,
        prompt: typeof item?.prompt === "string" ? item.prompt : "",
        mime: typeof item?.mime === "string" ? item.mime : "",
      };
    }),
  };
};

const toV3 = (legacy) => {
  const cityEn =
    typeof legacy?.city === "string"
      ? legacy.city
      : typeof legacy?.cityName === "string"
        ? legacy.cityName
        : "";
  const landmark =
    typeof legacy?.landmark === "string"
      ? legacy.landmark
      : typeof legacy?.title === "string"
        ? legacy.title
        : "";

  const citySlug =
    typeof legacy?.citySlug === "string" && legacy.citySlug.trim().length > 0
      ? legacy.citySlug
      : normalizeSlug(cityEn);
  const landmarkSlug =
    typeof legacy?.landmarkSlug === "string" &&
    legacy.landmarkSlug.trim().length > 0
      ? legacy.landmarkSlug
      : normalizeSlug(landmark);

  const synthesizedContent = buildLegacyContent(legacy?.blocks ?? {});

  return {
    meta: {
      city: {
        en: cityEn,
        de: cityEn,
        ru: cityEn,
        uk: cityEn,
      },
      landmark,
      citySlug,
      landmarkSlug,
      alias: `${citySlug}-${landmarkSlug}`,
      updatedAt: new Date().toISOString(),
    },
    content: {
      ru: synthesizedContent,
      en: "",
      de: "",
      uk: "",
    },
    prompts: {
      greeting:
        typeof legacy?.prompts?.greeting === "string"
          ? legacy.prompts.greeting
          : "",
      footer:
        typeof legacy?.prompts?.footer === "string"
          ? legacy.prompts.footer
          : "",
    },
    postcardGraphics: {
      stamp: {
        isActive: false,
        fileName: "",
        savedFile: "",
        mime: "",
      },
      illustrations: {
        "2L": { isActive: false, fileName: "", savedFile: "", mime: "" },
        "2R": { isActive: false, fileName: "", savedFile: "", mime: "" },
        "4L": { isActive: false, fileName: "", savedFile: "", mime: "" },
        "4R": { isActive: false, fileName: "", savedFile: "", mime: "" },
      },
    },
    gallery: toGallery(legacy?.images),
  };
};

const ensureBackupPath = async (filePath) => {
  let candidate = `${filePath}.bak`;
  let index = 1;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = `${filePath}.bak.${index}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
};

const collectDataFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectDataFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name === "data.json") {
      result.push(fullPath);
    }
  }

  return result;
};

const run = async () => {
  const files = await collectDataFiles(landmarksRoot);

  let migrated = 0;
  let skippedV3 = 0;
  let skippedInvalid = 0;
  let errors = 0;

  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(raw);

      if (!isObject(json)) {
        skippedInvalid += 1;
        continue;
      }

      if (isV3(json)) {
        skippedV3 += 1;
        continue;
      }

      if (!json.city && !json.meta && !json.blocks && !json.images) {
        skippedInvalid += 1;
        continue;
      }

      const next = toV3(json);

      if (!dryRun) {
        const backupPath = await ensureBackupPath(filePath);
        await fs.writeFile(backupPath, raw, "utf-8");
        await fs.writeFile(filePath, JSON.stringify(next, null, 2), "utf-8");
      }

      migrated += 1;
    } catch {
      errors += 1;
    }
  }

  const summary = {
    mode: dryRun ? "dry-run" : "apply",
    total: files.length,
    migrated,
    skippedV3,
    skippedInvalid,
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
