import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processModuleHomeForm } from "@/agent/backend/module-home-form-processor";

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

const joinModuleTexts = (sections: unknown): string => {
  if (!Array.isArray(sections)) return "";
  const parts = sections
    .map((item) => asRecord(item))
    .filter((item) => {
      const type = pickText(item.type);
      return (
        type === "module-home-block" || type === "custom:module-home-block"
      );
    })
    .map((item) => {
      const payload = asRecord(item.payload);
      return pickText(payload.text);
    })
    .filter(Boolean);

  return parts.join("\n\n").trim();
};

const buildLegacyIllustrations = (sections: unknown) => {
  const result: string[] = [];
  if (!Array.isArray(sections)) return result;

  sections
    .map((item) => asRecord(item))
    .filter((item) => {
      const type = pickText(item.type);
      return (
        type === "module-home-block" || type === "custom:module-home-block"
      );
    })
    .forEach((item, blockIndex) => {
      const payload = asRecord(item.payload);
      const left = pickText(payload.illustrationLeft);
      const right = pickText(payload.illustrationRight);
      const paragraph = String((blockIndex + 1) * 2);

      if (left) {
        result.push(left, "left", paragraph);
      }
      if (right) {
        result.push(right, "right", paragraph);
      }
    });

  return result;
};

const buildModuleHomeMarkdownFromEnvelope = (
  template: string,
  envelopeByLocale: Record<string, Record<string, unknown>>,
) => {
  const ruEnvelope = envelopeByLocale.ru ?? {};
  const contract = asRecord(ruEnvelope.moduleHomeContract);

  const hasContract = Object.keys(contract).length > 0;
  const greeting = {
    en: "",
    de: "",
    ru: "",
    uk: "",
  };
  const description = {
    en: "",
    de: "",
    ru: "",
    uk: "",
  };
  const invitation = {
    en: "",
    de: "",
    ru: "",
    uk: "",
  };

  if (hasContract) {
    Object.assign(greeting, pickLocalized(contract.greeting));
    Object.assign(description, pickLocalized(contract.description));
    Object.assign(invitation, pickLocalized(contract.invitation));
  } else {
    const locales = ["en", "de", "ru", "uk"] as const;
    locales.forEach((locale) => {
      const envelope = envelopeByLocale[locale] ?? {};
      const hero = asRecord(envelope.hero);
      greeting[locale] = pickText(hero.headline);
      description[locale] = joinModuleTexts(envelope.sections);
      const closing = (
        Array.isArray(envelope.sections) ? envelope.sections : []
      )
        .map((item) => asRecord(item))
        .find((item) => {
          const type = pickText(item.type);
          return (
            type === "module-home-closing" ||
            type === "custom:module-home-closing"
          );
        });
      invitation[locale] = pickText(asRecord(closing?.payload).text);
    });
  }

  const mediaRefs = asRecord(ruEnvelope.mediaRefs);
  const heroMedia = Array.isArray(mediaRefs.hero) ? mediaRefs.hero : [];
  const stampImage = pickText(contract.stampImage) || pickText(heroMedia[0]);

  const illustrations = Array.isArray(contract.illustrations)
    ? contract.illustrations
    : [];

  const lines: string[] = [];
  lines.push("# Форма главной страницы модуля (module-home)");
  lines.push("");
  lines.push(
    "Форма создаёт и обновляет главную страницу модуля Landmarks в едином контракте.",
  );
  lines.push("");
  lines.push("## 1. Модуль");
  lines.push("");
  lines.push(`moduleKey: ${pickText(ruEnvelope.moduleKey) || "landmarks"}`);
  lines.push(`slug: ${pickText(ruEnvelope.slug) || "landmarks"}`);
  lines.push("");
  lines.push("## 2. Приветствие Кетти");
  lines.push("");
  lines.push(`greeting.en: ${encodeMultiline(greeting.en)}`);
  lines.push(`greeting.de: ${encodeMultiline(greeting.de)}`);
  lines.push(`greeting.ru: ${encodeMultiline(greeting.ru)}`);
  lines.push(`greeting.uk: ${encodeMultiline(greeting.uk)}`);
  lines.push("");
  lines.push("## 3. Основной текст");
  lines.push("");
  lines.push(`description.en: ${encodeMultiline(description.en)}`);
  lines.push(`description.de: ${encodeMultiline(description.de)}`);
  lines.push(`description.ru: ${encodeMultiline(description.ru)}`);
  lines.push(`description.uk: ${encodeMultiline(description.uk)}`);
  lines.push("");
  lines.push("## 4. Иллюстрации");
  lines.push("");
  lines.push(`stampImage: ${stampImage}`);
  lines.push("");

  if (illustrations.length > 0) {
    illustrations.forEach((item, index) => {
      const block = asRecord(item);
      const caption = pickLocalized(block.caption);
      const insert = asRecord(block.insert);
      lines.push(`illustration[${index}].image: ${pickText(block.image)}`);
      lines.push(
        `illustration[${index}].caption.en: ${encodeMultiline(caption.en)}`,
      );
      lines.push(
        `illustration[${index}].caption.de: ${encodeMultiline(caption.de)}`,
      );
      lines.push(
        `illustration[${index}].caption.ru: ${encodeMultiline(caption.ru)}`,
      );
      lines.push(
        `illustration[${index}].caption.uk: ${encodeMultiline(caption.uk)}`,
      );
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
  } else {
    const legacy = buildLegacyIllustrations(ruEnvelope.sections);
    for (let i = 0, idx = 0; i < legacy.length; i += 3, idx += 1) {
      const image = legacy[i] || "";
      const position = legacy[i + 1] || "right";
      const paragraph = legacy[i + 2] || "1";
      lines.push(`illustration[${idx}].image: ${image}`);
      lines.push(`illustration[${idx}].caption.en: `);
      lines.push(`illustration[${idx}].caption.de: `);
      lines.push(`illustration[${idx}].caption.ru: `);
      lines.push(`illustration[${idx}].caption.uk: `);
      lines.push(`illustration[${idx}].size: medium`);
      lines.push(`illustration[${idx}].type: ketty-drawing`);
      lines.push(`illustration[${idx}].position: ${position}`);
      lines.push(`illustration[${idx}].wrap: true`);
      lines.push(`illustration[${idx}].shadow: false`);
      lines.push(`illustration[${idx}].border: false`);
      lines.push(`illustration[${idx}].rotate: 0`);
      lines.push(`illustration[${idx}].insert.where: after`);
      lines.push(`illustration[${idx}].insert.paragraph: ${paragraph}`);
      lines.push(`illustration[${idx}].anchor: `);
      lines.push("");
    }
  }

  lines.push("## 5. Заключительная фраза");
  lines.push("");
  lines.push(`invitation.en: ${encodeMultiline(invitation.en)}`);
  lines.push(`invitation.de: ${encodeMultiline(invitation.de)}`);
  lines.push(`invitation.ru: ${encodeMultiline(invitation.ru)}`);
  lines.push(`invitation.uk: ${encodeMultiline(invitation.uk)}`);
  lines.push("");
  lines.push("## 6. Служебные поля");
  lines.push("");
  lines.push("pageKind: module-home");
  lines.push(`schemaVersion: ${pickText(ruEnvelope.schemaVersion) || "1.2.0"}`);
  lines.push("");

  return lines.length > 0 ? lines.join("\n") : template;
};

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "module-home-form.md",
  );

  try {
    const template = await fs.readFile(filePath, "utf8");
    const locales = ["ru", "en", "de", "uk"];
    const envelopeByLocale: Record<string, Record<string, unknown>> = {};

    await Promise.all(
      locales.map(async (locale) => {
        const localePath = path.join(
          process.cwd(),
          "app",
          "landmarks",
          "data",
          `home.${locale}.json`,
        );
        try {
          const raw = await fs.readFile(localePath, "utf8");
          envelopeByLocale[locale] = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          envelopeByLocale[locale] = {};
        }
      }),
    );

    const content = buildModuleHomeMarkdownFromEnvelope(
      template,
      envelopeByLocale,
    );

    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось загрузить форму module-home.",
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
    // Save markdown template
    const templatePath = path.join(
      process.cwd(),
      "agent",
      "forms",
      "module-home-form.md",
    );
    await fs.writeFile(templatePath, body.markdown, "utf-8");
    console.log("[module-home POST] Markdown saved to:", templatePath);

    // Process and generate localized JSON files
    const result = await processModuleHomeForm(body.markdown);
    console.log("[module-home POST] Form processed, results:", result);

    return NextResponse.json({
      ok: true,
      message: "Форма module-home сохранена.",
      data: result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[module-home POST] Error:", errorMessage, error);
    return NextResponse.json(
      {
        ok: false,
        message: `Не удалось сохранить форму module-home: ${errorMessage}`,
      },
      { status: 400 },
    );
  }
}
