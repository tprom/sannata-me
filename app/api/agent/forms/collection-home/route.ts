import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processCollectionHomeForm } from "@/agent/backend/collection-home-form-processor";
import { listCityOptions } from "@/agent/backend/cities-registry";

type RequestBody = {
  markdown?: string;
};

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "collection-home-form.md",
  );

  try {
    const content = await fs.readFile(filePath, "utf8");
    const options = await listCityOptions();
    const optionsText = options.length
      ? options
          .map((item) => `- ${item.cityId} | ${item.label} (${item.slug})`)
          .join("\n")
      : "- справочник городов пуст";

    const enriched = `${content}\n\n${optionsText}\n`;

    return NextResponse.json({
      ok: true,
      content: enriched,
      cityOptions: options,
      mode: "create",
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
