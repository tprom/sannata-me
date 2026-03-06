import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processLandmarkForm } from "@/agent/backend/landmark-form-processor";
import { listCityOptions } from "@/agent/backend/cities-registry";

type RequestBody = {
  markdown?: string;
};

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "landmark-form.md",
  );

  try {
    const content = await fs.readFile(filePath, "utf8");
    const options = await listCityOptions();
    const optionsText = options.length
      ? options
          .map((item) => `- ${item.cityId} | ${item.label} (${item.slug})`)
          .join("\n")
      : "- справочник городов пуст";

    const enriched = `${content}\n\n## D. Справочник городов (read-only)\n${optionsText}\n`;
    return NextResponse.json({ ok: true, content: enriched });
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
