import fs from "fs/promises";
import path from "path";
import { findCityById } from "./cities-registry";

const DEFAULT_IMAGE_SLOTS = 8;

const parseValue = (rawValue) => {
  const value = rawValue.trim();
  if (!value) return "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const normalized = value.replace(/^'/, '"').replace(/'$/, '"');
    try {
      return JSON.parse(normalized);
    } catch {
      return value.slice(1, -1);
    }
  }

  return value;
};

const toSlug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const normalizeHeading = (heading) => heading.replace(/^\d+\.\s*/, "").trim();

const ensureImageItem = (items, index) => {
  const existing = items.find((item) => item.index === index);
  if (existing) return existing;

  const newItem = { index, file: "", prompt: "" };
  items.push(newItem);
  return newItem;
};

export const parseLandmarkForm = (markdown) => {
  const flatFields = {};
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("<!--")) continue;
    const fieldMatch = line.match(/^([A-Za-z0-9_.\[\]]+)\s*:\s*([^\r\n]*)$/);
    if (!fieldMatch) continue;
    flatFields[fieldMatch[1]] = parseValue(fieldMatch[2]);
  }

  const parseField = (key) => {
    const value = flatFields[key];
    return typeof value === "string" ? value.trim() : "";
  };

  const parseMultilineField = (key) => {
    const direct = parseField(key);
    if (direct) {
      return direct.replace(/\\n/g, "\n");
    }

    const regex = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`, "m");
    const match = markdown.match(regex);
    return match?.[1]?.trim() || "";
  };

  const lines = markdown.split(/\r?\n/);
  const blocks = {};
  const fields = {
    cityId: "",
    landmark: "",
    landmarkSlug: "",
    geoLat: "",
    geoLng: "",
    geoSource: "manual",
    greeting: "",
    footer: "",
    stampPrompt: "",
  };
  const images = {
    maxCount: DEFAULT_IMAGE_SLOTS,
    commonPrompt: "",
    items: [],
  };

  const contractBlocks = {
    passport: parseMultilineField("block.passport"),
    history: parseMultilineField("block.history"),
    meaning: parseMultilineField("block.meaning"),
    legends: parseMultilineField("block.legends"),
    visual: parseMultilineField("block.visual"),
    sensory: parseMultilineField("block.sensory"),
    touristExperience: parseMultilineField("block.touristExperience"),
    sources: parseMultilineField("block.sources"),
  };

  fields.cityId = parseField("cityId") || fields.cityId;
  fields.landmark = parseField("landmark") || fields.landmark;
  fields.landmarkSlug = parseField("landmarkSlug") || fields.landmarkSlug;
  fields.geoLat = parseField("geoLat") || fields.geoLat;
  fields.geoLng = parseField("geoLng") || fields.geoLng;
  fields.geoSource = parseField("geoSource") || fields.geoSource;
  fields.greeting = parseMultilineField("greeting") || fields.greeting;
  fields.footer = parseMultilineField("footer") || fields.footer;
  fields.stampPrompt = parseMultilineField("stampPrompt") || fields.stampPrompt;

  const imageSlots = Number.parseInt(parseField("imageSlots"), 10);
  if (!Number.isNaN(imageSlots)) {
    images.maxCount = imageSlots;
  }
  images.commonPrompt =
    parseMultilineField("commonImagePrompt") || images.commonPrompt;

  const imageIndexSet = new Set();
  for (const key of Object.keys(flatFields)) {
    const indexed = key.match(/^image\[(\d+)\]\.(file|prompt)$/);
    if (!indexed) continue;
    imageIndexSet.add(Number.parseInt(indexed[1], 10));
  }

  if (imageIndexSet.size > 0) {
    const sorted = [...imageIndexSet].sort((a, b) => a - b);
    images.items = sorted
      .map((idx) => {
        const file = parseField(`image[${idx}].file`);
        const prompt = parseMultilineField(`image[${idx}].prompt`);
        if (!file && !prompt) return null;
        return {
          index: idx + 1,
          file,
          prompt,
        };
      })
      .filter(Boolean);
  }

  let section = null;
  let currentBlock = null;
  let currentLines = [];

  const flushBlock = () => {
    if (currentBlock) {
      blocks[currentBlock] = currentLines.join("\n").trim();
    }
    currentBlock = null;
    currentLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushBlock();
      if (line.includes("A.")) {
        section = "A";
      } else if (line.includes("B.")) {
        section = "B";
      } else if (line.includes("C.")) {
        section = "C";
      } else {
        section = null;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      flushBlock();
      if (section === "A") {
        currentBlock = normalizeHeading(line.replace(/^###\s*/, "").trim());
      }
      continue;
    }

    if (section === "A" && currentBlock) {
      currentLines.push(line);
      continue;
    }

    if (section === "B" || section === "C") {
      const match = line.match(/^[-*]?\s*([A-Za-z0-9]+)\s*:\s*(.*)$/);
      if (!match) continue;

      const key = match[1];
      const value = parseValue(match[2]);

      if (section === "B") {
        if (key in fields) {
          fields[key] = value;
        }
        continue;
      }

      if (section === "C") {
        if (key === "imageSlots") {
          const numericValue = Number.parseInt(value, 10);
          if (!Number.isNaN(numericValue)) {
            images.maxCount = numericValue;
          }
          continue;
        }

        if (key === "commonImagePrompt") {
          images.commonPrompt = value;
          continue;
        }

        const imageMatch = key.match(/^image(\d+)(File|Prompt)$/i);
        if (imageMatch) {
          const index = Number.parseInt(imageMatch[1], 10);
          if (!Number.isNaN(index)) {
            const item = ensureImageItem(images.items, index);
            if (imageMatch[2].toLowerCase() === "file") {
              item.file = value;
            } else {
              item.prompt = value;
            }
          }
        }
      }
    }
  }

  flushBlock();

  const contractBlockKeys = Object.keys(contractBlocks).filter(
    (key) => contractBlocks[key]?.trim().length > 0,
  );

  if (contractBlockKeys.length > 0) {
    blocks.passport = contractBlocks.passport;
    blocks.history = contractBlocks.history;
    blocks.meaning = contractBlocks.meaning;
    blocks.legends = contractBlocks.legends;
    blocks.visual = contractBlocks.visual;
    blocks.sensory = contractBlocks.sensory;
    blocks.touristExperience = contractBlocks.touristExperience;
    blocks.sources = contractBlocks.sources;
  } else {
    const legacyAliases = {
      passport: ["Паспорт объекта", "Паспорт"],
      history: ["История"],
      meaning: ["Значение"],
      legends: ["Легенды и истории", "Легенды"],
      visual: ["Визуальный образ"],
      sensory: ["Сенсорные впечатления"],
      touristExperience: ["Туристический опыт"],
      sources: ["Источники"],
    };

    for (const [canonical, aliases] of Object.entries(legacyAliases)) {
      if (blocks[canonical]) continue;
      const found = aliases.find((name) => typeof blocks[name] === "string");
      if (found) {
        blocks[canonical] = blocks[found];
      }
    }
  }

  if (images.items.length === 0) {
    for (let i = 1; i <= images.maxCount; i += 1) {
      const file = parseField(`image${i}File`);
      const prompt = parseMultilineField(`image${i}Prompt`);
      if (!file && !prompt) continue;
      images.items.push({ index: i, file, prompt });
    }
  }

  if (!fields.greeting) {
    fields.greeting = "Милый друг,";
  }

  if (!fields.footer) {
    fields.footer = "Читать полную историю в книге\\nКнига Кетти";
  }

  return {
    blocks,
    fields,
    images,
  };
};

export const processLandmarkForm = async (markdown) => {
  const data = parseLandmarkForm(markdown);

  const cityId = data.fields.cityId?.trim();
  if (!cityId) {
    throw new Error("Поле cityId обязательно. Выберите существующий город.");
  }

  const city = await findCityById(cityId);
  if (!city) {
    throw new Error(
      "Указан неизвестный cityId. Создание нового города из формы достопримечательности запрещено.",
    );
  }

  const landmark = data.fields.landmark?.trim();
  if (!landmark) {
    throw new Error("Поле landmark обязательно.");
  }

  const resolvedLandmarkSlug = toSlug(data.fields.landmarkSlug || landmark);
  if (!resolvedLandmarkSlug) {
    throw new Error("Не удалось вычислить landmarkSlug.");
  }

  const hasGeoInput =
    String(data.fields.geoLat ?? "").trim() !== "" ||
    String(data.fields.geoLng ?? "").trim() !== "";

  let parsedGeoLat = null;
  let parsedGeoLng = null;

  if (hasGeoInput) {
    parsedGeoLat = Number.parseFloat(String(data.fields.geoLat ?? "").trim());
    parsedGeoLng = Number.parseFloat(String(data.fields.geoLng ?? "").trim());

    if (!Number.isFinite(parsedGeoLat) || !Number.isFinite(parsedGeoLng)) {
      throw new Error(
        "Если геолокация указана, значения geoLat и geoLng должны быть корректными числами.",
      );
    }

    if (parsedGeoLat < -90 || parsedGeoLat > 90) {
      throw new Error("Значение geoLat должно быть в диапазоне от -90 до 90.");
    }

    if (parsedGeoLng < -180 || parsedGeoLng > 180) {
      throw new Error(
        "Значение geoLng должно быть в диапазоне от -180 до 180.",
      );
    }
  }

  data.fields.landmarkSlug = resolvedLandmarkSlug;
  data.meta = {
    cityId: city.cityId,
    citySlug: city.slug,
    cityName: city.name?.en || city.city,
    countryId: city.countryId,
    landmarkGeo:
      parsedGeoLat !== null && parsedGeoLng !== null
        ? {
            lat: parsedGeoLat,
            lng: parsedGeoLng,
            source:
              String(data.fields.geoSource ?? "manual").trim() || "manual",
          }
        : undefined,
  };

  const filePath = path.join(
    process.cwd(),
    "agent",
    "backend",
    "landmark-data.json",
  );

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

  return data;
};
