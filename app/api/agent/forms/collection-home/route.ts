import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processCollectionHomeForm } from "@/agent/backend/collection-home-form-processor";
import {
  listCityOptions,
  loadCitiesRegistry,
} from "@/agent/backend/cities-registry";

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
  typeof value === "string" ? value.trim() : "";

const toScalarString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
};

const pickLocalized = (value: unknown) => {
  const record = asRecord(value);
  return {
    en: pickText(record.en),
    de: pickText(record.de),
    ru: pickText(record.ru),
    uk: pickText(record.uk),
  };
};

const buildCollectionHomeMarkdownFromData = (
  cityId: string,
  pageContent: Record<string, unknown>,
) => {
  const greeting = pickLocalized(pageContent.greeting);
  const description = pickLocalized(pageContent.description);
  const invitation = pickLocalized(pageContent.invitation);
  const panorama = pickText(pageContent.panorama);
  const illustrationsRaw = Array.isArray(pageContent.illustrations)
    ? pageContent.illustrations
    : [];

  const lines: string[] = [];
  lines.push("# Форма страницы города (collection-home)");
  lines.push("");
  lines.push("## 1. Выбор города");
  lines.push("");
  lines.push(`cityId: ${cityId}`);
  lines.push("");

  lines.push("## 2. Панорама города");
  lines.push("");
  lines.push(`panorama: ${panorama}`);
  lines.push("");

  lines.push("## 3. Приветствие Кетти");
  lines.push("");
  lines.push(`greeting.en: ${greeting.en}`);
  lines.push(`greeting.de: ${greeting.de}`);
  lines.push(`greeting.ru: ${greeting.ru}`);
  lines.push(`greeting.uk: ${greeting.uk}`);
  lines.push("");

  lines.push("## 4. Описание (восприятие Кетти)");
  lines.push("");
  lines.push(`description.en: ${description.en}`);
  lines.push(`description.de: ${description.de}`);
  lines.push(`description.ru: ${description.ru}`);
  lines.push(`description.uk: ${description.uk}`);
  lines.push("");

  lines.push("## 5. Иллюстрации (динамический список)");
  lines.push("");
  illustrationsRaw.forEach((item, index) => {
    const block = asRecord(item);
    const caption = pickLocalized(block.caption);
    const insert = asRecord(block.insert);

    lines.push(`illustration[${index}].image: ${pickText(block.image)}`);
    lines.push(`illustration[${index}].caption.en: ${caption.en}`);
    lines.push(`illustration[${index}].caption.de: ${caption.de}`);
    lines.push(`illustration[${index}].caption.ru: ${caption.ru}`);
    lines.push(`illustration[${index}].caption.uk: ${caption.uk}`);
    lines.push(
      `illustration[${index}].size: ${toScalarString(block.size) || "medium"}`,
    );
    lines.push(
      `illustration[${index}].type: ${toScalarString(block.type) || "ketty-drawing"}`,
    );
    lines.push(
      `illustration[${index}].position: ${toScalarString(block.position) || "right"}`,
    );
    lines.push(
      `illustration[${index}].wrap: ${toScalarString(block.wrap) || "true"}`,
    );
    lines.push(
      `illustration[${index}].shadow: ${toScalarString(block.shadow) || "false"}`,
    );
    lines.push(
      `illustration[${index}].border: ${toScalarString(block.border) || "false"}`,
    );
    lines.push(
      `illustration[${index}].rotate: ${toScalarString(block.rotate) || "0"}`,
    );
    lines.push(
      `illustration[${index}].insert.where: ${toScalarString(insert.where) || "after"}`,
    );
    lines.push(
      `illustration[${index}].insert.paragraph: ${toScalarString(insert.paragraph) || "1"}`,
    );
    lines.push(`illustration[${index}].anchor: ${pickText(block.anchor)}`);
    lines.push("");
  });

  lines.push("## 6. Приглашение Кетти");
  lines.push("");
  lines.push(`invitation.en: ${invitation.en}`);
  lines.push(`invitation.de: ${invitation.de}`);
  lines.push(`invitation.ru: ${invitation.ru}`);
  lines.push(`invitation.uk: ${invitation.uk}`);
  lines.push("");

  return lines.join("\n");
};

export async function GET(request: Request) {
  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "collection-home-form.md",
  );

  try {
    const template = await fs.readFile(filePath, "utf8");
    const options = await listCityOptions();
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId")?.trim() ?? "";
    const slug = searchParams.get("slug")?.trim() ?? "";

    let content = template;
    let mode: "create" | "edit" = "create";

    if (cityId || slug) {
      const cities = await loadCitiesRegistry();
      const selectedCity =
        cities.find((item) => item.cityId === cityId) ??
        cities.find((item) => item.slug === slug) ??
        null;

      if (selectedCity) {
        const cityDataPath = path.join(
          process.cwd(),
          "data",
          "landmarks",
          selectedCity.slug,
          "data.json",
        );

        let cityData: Record<string, unknown> = {};
        try {
          const raw = await fs.readFile(cityDataPath, "utf8");
          cityData = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          cityData = {};
        }

        const pageContent = asRecord(cityData.pageContent);
        content = buildCollectionHomeMarkdownFromData(
          selectedCity.cityId,
          pageContent,
        );
        mode = "edit";
      }
    }

    return NextResponse.json({
      ok: true,
      content,
      cityOptions: options,
      mode,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось загрузить форму collection-home.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const result = await processCollectionHomeForm(body.markdown);
    return NextResponse.json({
      ok: true,
      message: `Форма collection-home для города ${result.citySlug} сохранена.`,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить форму collection-home.",
      },
      { status: 400 },
    );
  }
}
