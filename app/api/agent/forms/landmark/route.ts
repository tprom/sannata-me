import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processLandmarkForm } from "@/agent/backend/landmark-form-processor";
import { loadCitiesRegistry } from "@/agent/backend/cities-registry";
import { ensureAgentApiAccess } from "@/lib/security/agent-auth";

type RequestBody = {
  markdown?: string;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const pickText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const pickSingleLine = (value: unknown): string => pickText(value).trim();

const encodeMultiline = (value: string): string =>
  value.replace(/\r?\n/g, "\\n");

const pickLocalized = (value: unknown) => {
  const record = asRecord(value);
  return {
    en: pickText(record.en),
    de: pickText(record.de),
    ru: pickText(record.ru),
    uk: pickText(record.uk),
  };
};

const normalizeLegacyGalleryPath = (
  value: string,
  citySlug: string,
  landmarkSlug: string,
): string => {
  const file = value.trim();
  if (!file) return "";

  if (file.startsWith("/") || /^https?:\/\//i.test(file)) {
    return file;
  }

  if (file.startsWith("images/") || file.startsWith("gallery/")) {
    return `/data/landmarks/${citySlug}/${landmarkSlug}/${file}`;
  }

  return `/data/landmarks/${citySlug}/${landmarkSlug}/images/${file}`;
};

const pickGalleryItems = (
  data: Record<string, unknown>,
  citySlug: string,
  landmarkSlug: string,
) => {
  const gallery = asRecord(data.gallery);
  const items = Array.isArray(gallery.items) ? gallery.items : [];

  return items
    .map((item) => {
      const block = asRecord(item);
      const rawFile =
        pickSingleLine(block.file) ||
        pickSingleLine(block.src) ||
        pickSingleLine(block.savedFile) ||
        pickSingleLine(block.fileName);
      const file = normalizeLegacyGalleryPath(rawFile, citySlug, landmarkSlug);
      if (!file) return null;

      const alt =
        pickSingleLine(block.alt) ||
        pickSingleLine(block.caption) ||
        pickSingleLine(block.fileName);

      return { file, alt };
    })
    .filter((item): item is { file: string; alt: string } => Boolean(item));
};

const buildLandmarkMarkdownFromData = (data: Record<string, unknown>) => {
  const fields = asRecord(data.fields);
  const postcard = asRecord(data.postcard);
  const images = asRecord(data.images);
  const gallery = asRecord(data.gallery);

  const greeting = pickLocalized(postcard.greeting);
  const content = pickLocalized(postcard.content);
  const farewell = pickLocalized(postcard.farewell);
  const invitation = pickLocalized(postcard.invitation);
  const invitationBookLink = pickLocalized(postcard.invitationBookLink);

  const stamp = asRecord(images.stamp);
  const illustrations = Array.isArray(images.items) ? images.items : [];
  const galleryItems = Array.isArray(gallery.items) ? gallery.items : [];

  const lines: string[] = [];
  lines.push("# Форма достопримечательности (landmark-item)");
  lines.push("");

  lines.push("## 1. Город и достопримечательность");
  lines.push("");
  lines.push(`cityId: ${pickSingleLine(fields.cityId)}`);
  lines.push(
    `landmarkMode: ${pickSingleLine(fields.landmarkMode) || "select"}`,
  );
  lines.push(
    `landmarkExistingSlug: ${pickSingleLine(fields.landmarkExistingSlug)}`,
  );
  lines.push(
    `landmark: ${pickSingleLine(fields.landmark) || pickSingleLine(fields.landmarkTitle)}`,
  );
  lines.push(`landmarkSlug: ${pickSingleLine(fields.landmarkSlug)}`);
  lines.push("");

  lines.push("## 2. Тексты открытки");
  lines.push("");
  lines.push(`greeting.en: ${encodeMultiline(greeting.en)}`);
  lines.push(`greeting.de: ${encodeMultiline(greeting.de)}`);
  lines.push(`greeting.ru: ${encodeMultiline(greeting.ru)}`);
  lines.push(`greeting.uk: ${encodeMultiline(greeting.uk)}`);
  lines.push("");

  lines.push(`content.en: ${encodeMultiline(content.en)}`);
  lines.push(`content.de: ${encodeMultiline(content.de)}`);
  lines.push(`content.ru: ${encodeMultiline(content.ru)}`);
  lines.push(`content.uk: ${encodeMultiline(content.uk)}`);
  lines.push("");

  lines.push(`farewell.en: ${encodeMultiline(farewell.en)}`);
  lines.push(`farewell.de: ${encodeMultiline(farewell.de)}`);
  lines.push(`farewell.ru: ${encodeMultiline(farewell.ru)}`);
  lines.push(`farewell.uk: ${encodeMultiline(farewell.uk)}`);
  lines.push("");

  lines.push(`invitation.en: ${encodeMultiline(invitation.en)}`);
  lines.push(
    `invitationBookLink.en: ${encodeMultiline(invitationBookLink.en)}`,
  );
  lines.push(`invitation.de: ${encodeMultiline(invitation.de)}`);
  lines.push(
    `invitationBookLink.de: ${encodeMultiline(invitationBookLink.de)}`,
  );
  lines.push(`invitation.ru: ${encodeMultiline(invitation.ru)}`);
  lines.push(
    `invitationBookLink.ru: ${encodeMultiline(invitationBookLink.ru)}`,
  );
  lines.push(`invitation.uk: ${encodeMultiline(invitation.uk)}`);
  lines.push(
    `invitationBookLink.uk: ${encodeMultiline(invitationBookLink.uk)}`,
  );
  lines.push("");

  lines.push("## 3. Иллюстрации");
  lines.push("");
  lines.push(`stamp.file: ${pickSingleLine(stamp.file)}`);
  lines.push("");

  illustrations.forEach((item, index) => {
    const block = asRecord(item);
    lines.push(`illustration[${index}].file: ${pickSingleLine(block.file)}`);
    lines.push(
      `illustration[${index}].size: ${pickSingleLine(block.size) || "medium"}`,
    );
    lines.push(
      `illustration[${index}].type: ${pickSingleLine(block.type) || "ketty-drawing"}`,
    );
    lines.push(
      `illustration[${index}].position: ${pickSingleLine(block.position) || "right"}`,
    );
    lines.push(
      `illustration[${index}].wrap: ${pickSingleLine(block.wrap) || "true"}`,
    );
    lines.push(
      `illustration[${index}].shadow: ${pickSingleLine(block.shadow) || "false"}`,
    );
    lines.push(
      `illustration[${index}].border: ${pickSingleLine(block.border) || "false"}`,
    );
    lines.push(
      `illustration[${index}].rotate: ${pickSingleLine(block.rotate) || "0"}`,
    );
    lines.push(
      `illustration[${index}].insert.where: ${pickSingleLine(block.insertWhere) || "after"}`,
    );
    lines.push(
      `illustration[${index}].insert.paragraph: ${pickSingleLine(block.insertParagraph) || "1"}`,
    );
    lines.push(
      `illustration[${index}].anchor: ${pickSingleLine(block.anchor)}`,
    );
    lines.push("");
  });

  lines.push("## 4. Галерея изображений");
  lines.push("");

  galleryItems.forEach((item, index) => {
    const block = asRecord(item);
    lines.push(`gallery[${index}].file: ${pickSingleLine(block.file)}`);
    lines.push(
      `gallery[${index}].alt: ${pickSingleLine(block.alt) || pickSingleLine(block.caption)}`,
    );
    lines.push("");
  });

  lines.push("## 5. Справочник городов (read-only)");
  lines.push("");
  lines.push("Список городов загружается автоматически при открытии формы.");

  return lines.join("\n");
};

export async function GET(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "landmark-form.md",
  );

  try {
    const template = await fs.readFile(filePath, "utf8");
    const cities = await loadCitiesRegistry();
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId")?.trim() ?? "";
    const landmarkSlug = searchParams.get("landmarkSlug")?.trim() ?? "";

    let content = template;
    let mode: "create" | "edit" = "create";

    if (cityId && landmarkSlug) {
      const city = cities.find((item) => item.cityId === cityId) ?? null;
      if (city) {
        const savedFilePath = path.join(
          process.cwd(),
          "agent",
          "backend",
          "landmark-data",
          city.slug,
          `${landmarkSlug}.json`,
        );
        const legacyDataPath = path.join(
          process.cwd(),
          "data",
          "landmarks",
          city.slug,
          landmarkSlug,
          "data.json",
        );

        let legacyGalleryItems: Array<{ file: string; alt: string }> = [];
        try {
          const legacyRaw = await fs.readFile(legacyDataPath, "utf8");
          const legacyParsed = JSON.parse(legacyRaw) as Record<string, unknown>;
          legacyGalleryItems = pickGalleryItems(
            legacyParsed,
            city.slug,
            landmarkSlug,
          );
        } catch {
          legacyGalleryItems = [];
        }

        try {
          const raw = await fs.readFile(savedFilePath, "utf8");
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const gallery = asRecord(parsed.gallery);
          const normalizedParsedGalleryItems = pickGalleryItems(
            parsed,
            city.slug,
            landmarkSlug,
          );

          // Логирование для диагностики
          console.log(
            "[LandmarkForm API] savedFile gallery.items:",
            gallery.items,
          );
          console.log(
            "[LandmarkForm API] normalizedParsedGalleryItems:",
            normalizedParsedGalleryItems,
          );
          console.log(
            "[LandmarkForm API] legacyGalleryItems:",
            legacyGalleryItems,
          );

          // Если в новом файле есть gallery.items (даже пустой массив), используем только его
          if (Array.isArray(gallery.items)) {
            parsed.gallery = {
              ...gallery,
              items: gallery.items,
            };
          } else if (normalizedParsedGalleryItems.length > 0) {
            parsed.gallery = {
              ...gallery,
              items: normalizedParsedGalleryItems,
            };
          } else if (legacyGalleryItems.length > 0) {
            parsed.gallery = {
              ...gallery,
              items: legacyGalleryItems,
            };
          }

          content = buildLandmarkMarkdownFromData(parsed);
          mode = "edit";
        } catch (err) {
          console.log("[LandmarkForm API] catch error:", err);
          if (legacyGalleryItems.length > 0) {
            content = buildLandmarkMarkdownFromData({
              fields: {
                cityId,
                landmarkMode: "select",
                landmarkExistingSlug: landmarkSlug,
                landmark: landmarkSlug,
                landmarkSlug,
              },
              gallery: { items: legacyGalleryItems },
            });
            mode = "edit";
          } else {
            content = template;
          }
        }
      }
    }

    const cityOptions = cities.map((item) => ({
      cityId: item.cityId,
      slug: item.slug,
      label: item.name?.en || item.city,
      landmarks: Array.isArray(item.landmarks)
        ? item.landmarks
            .map((entry) => {
              if (!entry || typeof entry !== "object") {
                return null;
              }

              const record = entry as Record<string, unknown>;
              const slug =
                typeof record.slug === "string" ? record.slug.trim() : "";
              const name =
                typeof record.name === "string" ? record.name.trim() : slug;

              if (!slug) return null;
              return { slug, name };
            })
            .filter((entry): entry is { slug: string; name: string } =>
              Boolean(entry),
            )
        : [],
    }));
    return NextResponse.json({ ok: true, content, cityOptions, mode });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось загрузить форму.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const body = (await request.json()) as RequestBody;

  if (!body.markdown) {
    return NextResponse.json(
      {
        ok: false,
        message: "Текст формы не передан.",
      },
      { status: 400 },
    );
  }

  try {
    const data = await processLandmarkForm(body.markdown);
    return NextResponse.json({
      ok: true,
      message: "Форма сохранена.",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось сохранить форму.",
      },
      { status: 500 },
    );
  }
}
