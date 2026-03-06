import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { processModuleHomeForm } from "@/agent/backend/module-home-form-processor";

type RequestBody = {
  markdown?: string;
};

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "module-home-form.md",
  );

  try {
    const content = await fs.readFile(filePath, "utf8");
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
