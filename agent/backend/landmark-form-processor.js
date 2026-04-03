import fs from "fs/promises";
import path from "path";
import { findCityById } from "./cities-registry";

const DEFAULT_IMAGE_SLOTS = 8;
const LOCALES = ["en", "de", "ru", "uk"];

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

const createDefaultImageItem = (index) => ({
  index,
  file: "",
  prompt: "",
  size: "medium",
  type: "ketty-drawing",
  position: "right",
  wrap: "true",
  shadow: "false",
  border: "false",
  rotate: "0",
  insertWhere: "after",
  insertParagraph: "1",
  anchor: "",
});

const createDefaultGalleryItem = (index) => ({
  index,
  file: "",
  alt: "",
});

const ensureImageItem = (items, index) => {
  const existing = items.find((item) => item.index === index);
  if (existing) return existing;

  const newItem = createDefaultImageItem(index);
  items.push(newItem);
  return newItem;
};

const emptyLocalized = () => ({ en: "", de: "", ru: "", uk: "" });

const hasLocalizedContent = (value) =>
  LOCALES.some(
    (locale) => typeof value?.[locale] === "string" && value[locale].trim(),
  );

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

    const regex = new RegExp(
      `^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^[A-Za-z0-9_.\\[\\]]+\\s*:|^##|\\Z)`,
      "m",
    );
    const match = markdown.match(regex);
    return match?.[1] || "";
  };

  const parseLocalized = (prefix) => ({
    en: parseMultilineField(`${prefix}.en`),
    de: parseMultilineField(`${prefix}.de`),
    ru: parseMultilineField(`${prefix}.ru`),
    uk: parseMultilineField(`${prefix}.uk`),
  });

  const lines = markdown.split(/\r?\n/);
  const blocks = {};
  const fields = {
    cityId: "",
    landmarkMode: "",
    landmarkExistingSlug: "",
    landmark: "",
    landmarkTitle: "",
    landmarkSlug: "",
    geoLat: "",
    geoLng: "",
    geoSource: "manual",
    greeting: "",
    footer: "",
    stampPrompt: "",
  };

  const postcard = {
    greeting: emptyLocalized(),
    content: emptyLocalized(),
    farewell: emptyLocalized(),
    invitation: emptyLocalized(),
    invitationBookLink: emptyLocalized(),
  };

  const images = {
    maxCount: DEFAULT_IMAGE_SLOTS,
    commonPrompt: "",
    stamp: { file: "", prompt: "" },
    items: [],
  };

  const gallery = {
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
  fields.landmarkMode = parseField("landmarkMode") || fields.landmarkMode;
  fields.landmarkExistingSlug =
    parseField("landmarkExistingSlug") || fields.landmarkExistingSlug;
  fields.landmark = parseField("landmark") || fields.landmark;
  fields.landmarkTitle = parseField("landmarkTitle") || fields.landmarkTitle;
  fields.landmarkSlug = parseField("landmarkSlug") || fields.landmarkSlug;
  fields.geoLat = parseField("geoLat") || fields.geoLat;
  fields.geoLng = parseField("geoLng") || fields.geoLng;
  fields.geoSource = parseField("geoSource") || fields.geoSource;

  postcard.greeting = parseLocalized("greeting");
  postcard.content = parseLocalized("content");
  postcard.farewell = parseLocalized("farewell");
  postcard.invitation = parseLocalized("invitation");
  postcard.invitationBookLink = parseLocalized("invitationBookLink");

  if (!hasLocalizedContent(postcard.greeting)) {
    const legacyGreeting = parseMultilineField("greeting");
    if (legacyGreeting) {
      postcard.greeting.ru = legacyGreeting;
    }
  }

  if (!hasLocalizedContent(postcard.content)) {
    postcard.content = parseLocalized("description");
  }

  if (!hasLocalizedContent(postcard.invitation)) {
    const legacyBookInvite = parseMultilineField("bookInvite");
    if (legacyBookInvite) {
      postcard.invitation.ru = legacyBookInvite;
    }
  }

  if (!hasLocalizedContent(postcard.invitation)) {
    const legacyInvitation = parseMultilineField("footer");
    if (legacyInvitation) {
      postcard.invitation.ru = legacyInvitation;
    }
  }

  if (!hasLocalizedContent(postcard.farewell)) {
    const legacyFarewell = parseMultilineField("footer");
    if (legacyFarewell) {
      postcard.farewell.ru = legacyFarewell;
    }
  }

  if (!hasLocalizedContent(postcard.invitationBookLink)) {
    const legacyBookLink = parseField("bookLink");
    if (legacyBookLink) {
      postcard.invitationBookLink.ru = legacyBookLink;
    }
  }

  fields.greeting = postcard.greeting.ru || parseMultilineField("greeting");
  fields.footer = postcard.farewell.ru || parseMultilineField("footer");

  const imageSlots = Number.parseInt(
    parseField("illustrationSlots") || parseField("imageSlots"),
    10,
  );
  if (!Number.isNaN(imageSlots)) {
    images.maxCount = imageSlots;
  }

  images.commonPrompt =
    parseMultilineField("illustrationCommonPrompt") ||
    parseMultilineField("commonImagePrompt") ||
    images.commonPrompt;

  images.stamp.file = parseField("stamp.file") || parseField("stampImage");
  images.stamp.prompt =
    parseMultilineField("stamp.prompt") ||
    parseMultilineField("stampPrompt") ||
    images.stamp.prompt;
  fields.stampPrompt = images.stamp.prompt;

  const illustrationIndexSet = new Set();
  for (const key of Object.keys(flatFields)) {
    const indexed = key.match(
      /^illustration\[(\d+)\]\.(file|prompt|size|type|position|wrap|shadow|border|rotate|insert\\.where|insert\\.paragraph|anchor)$/,
    );
    if (!indexed) continue;
    illustrationIndexSet.add(Number.parseInt(indexed[1], 10));
  }

  if (illustrationIndexSet.size > 0) {
    const sorted = [...illustrationIndexSet].sort((a, b) => a - b);
    images.items = sorted
      .map((idx) => {
        const file = parseField(`illustration[${idx}].file`);
        const prompt = parseMultilineField(`illustration[${idx}].prompt`);
        if (!file && !prompt) return null;
        return {
          index: idx + 1,
          file,
          prompt,
          size: parseField(`illustration[${idx}].size`) || "medium",
          type: parseField(`illustration[${idx}].type`) || "ketty-drawing",
          position: parseField(`illustration[${idx}].position`) || "right",
          wrap: parseField(`illustration[${idx}].wrap`) || "true",
          shadow: parseField(`illustration[${idx}].shadow`) || "false",
          border: parseField(`illustration[${idx}].border`) || "false",
          rotate: parseField(`illustration[${idx}].rotate`) || "0",
          insertWhere:
            parseField(`illustration[${idx}].insert.where`) || "after",
          insertParagraph:
            parseField(`illustration[${idx}].insert.paragraph`) || "1",
          anchor: parseField(`illustration[${idx}].anchor`) || "",
        };
      })
      .filter(Boolean);
  }

  if (images.items.length === 0) {
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
            size: parseField(`image[${idx}].size`) || "medium",
            type: parseField(`image[${idx}].type`) || "ketty-drawing",
            position: parseField(`image[${idx}].position`) || "right",
            wrap: parseField(`image[${idx}].wrap`) || "true",
            shadow: parseField(`image[${idx}].shadow`) || "false",
            border: parseField(`image[${idx}].border`) || "false",
            rotate: parseField(`image[${idx}].rotate`) || "0",
            insertWhere: parseField(`image[${idx}].insert.where`) || "after",
            insertParagraph:
              parseField(`image[${idx}].insert.paragraph`) || "1",
            anchor: parseField(`image[${idx}].anchor`) || "",
          };
        })
        .filter(Boolean);
    }
  }

  const galleryIndexSet = new Set();
  for (const key of Object.keys(flatFields)) {
    const indexed = key.match(/^gallery\[(\d+)\]\.(file|alt)$/);
    if (!indexed) continue;
    galleryIndexSet.add(Number.parseInt(indexed[1], 10));
  }

  if (galleryIndexSet.size > 0) {
    const sorted = [...galleryIndexSet].sort((a, b) => a - b);
    gallery.items = sorted
      .map((idx) => {
        const file = parseField(`gallery[${idx}].file`);
        const alt = parseMultilineField(`gallery[${idx}].alt`);
        if (!file && !alt) return null;
        return {
          ...createDefaultGalleryItem(idx + 1),
          file,
          alt,
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
      images.items.push({
        ...createDefaultImageItem(i),
        file,
        prompt,
      });
    }
  }

  if (!fields.greeting) {
    fields.greeting = "Милый друг,";
  }

  if (!fields.footer) {
    fields.footer = "Обнимаю!  Твоя Кетти 🌟";
  }

  if (!postcard.greeting.ru) {
    postcard.greeting.ru = fields.greeting;
  }

  if (!postcard.invitation.ru) {
    postcard.invitation.ru = "Читать полную историю в книге";
  }

  if (!postcard.farewell.ru) {
    postcard.farewell.ru = fields.footer;
  }

  return {
    blocks,
    fields,
    postcard,
    images,
    gallery,
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

  const cityLandmarks = Array.isArray(city.landmarks) ? city.landmarks : [];
  const requestedMode = String(data.fields.landmarkMode || "")
    .trim()
    .toLowerCase();
  const landmarkMode =
    requestedMode === "select" || requestedMode === "create"
      ? requestedMode
      : data.fields.landmarkExistingSlug
        ? "select"
        : "create";

  let landmarkTitle = String(
    data.fields.landmark || data.fields.landmarkTitle || "",
  ).trim();
  let resolvedLandmarkSlug = "";

  if (landmarkMode === "select") {
    const selectedSlug = String(
      data.fields.landmarkExistingSlug || data.fields.landmarkSlug || "",
    ).trim();

    if (!selectedSlug) {
      throw new Error(
        "Для режима выбора укажите landmarkExistingSlug (или landmarkSlug).",
      );
    }

    resolvedLandmarkSlug = selectedSlug;

    const matchedLandmark = cityLandmarks.find((item) => {
      if (!item || typeof item !== "object") return false;
      const slug = typeof item.slug === "string" ? item.slug.trim() : "";
      return slug === selectedSlug;
    });

    if (!landmarkTitle) {
      landmarkTitle =
        typeof matchedLandmark?.name === "string" && matchedLandmark.name.trim()
          ? matchedLandmark.name.trim()
          : selectedSlug;
    }
  } else {
    if (!landmarkTitle) {
      throw new Error(
        "Для режима создания заполните поле landmark (название достопримечательности).",
      );
    }

    resolvedLandmarkSlug = toSlug(data.fields.landmarkSlug || landmarkTitle);
    if (!resolvedLandmarkSlug) {
      throw new Error("Не удалось вычислить landmarkSlug.");
    }
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

  data.fields.landmarkMode = landmarkMode;
  data.fields.landmark = landmarkTitle;
  data.fields.landmarkTitle = landmarkTitle;
  data.fields.landmarkSlug = resolvedLandmarkSlug;

  if (landmarkMode === "select") {
    data.fields.landmarkExistingSlug = resolvedLandmarkSlug;
  }

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
  const perLandmarkPath = path.join(
    process.cwd(),
    "agent",
    "backend",
    "landmark-data",
    city.slug,
    `${resolvedLandmarkSlug}.json`,
  );

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  await fs.mkdir(path.dirname(perLandmarkPath), { recursive: true });
  await fs.writeFile(perLandmarkPath, JSON.stringify(data, null, 2), "utf8");

  return data;
};
