import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { normalizePortalHomeFormData } from "../../../../../types/portalHomeForm";
import { ensureAgentApiAccess } from "@/lib/security/agent-auth";

type RequestBody = {
  content?: string;
};

const dataPath = path.join(
  process.cwd(),
  "app",
  "data",
  "portal-home.form.json",
);

export async function GET(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  try {
    const raw = await fs.readFile(dataPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const validation = normalizePortalHomeFormData(parsed);

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: `Текущая форма портала невалидна: ${validation.errors[0] ?? "unknown"}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      content: JSON.stringify(validation.value, null, 2),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Не удалось загрузить форму портала: ${error.message}`
            : "Не удалось загрузить форму портала.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as RequestBody;
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { ok: false, message: "Пустой JSON формы портала." },
        { status: 400 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body.content);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Невалидный JSON: ошибка синтаксиса." },
        { status: 400 },
      );
    }

    const validation = normalizePortalHomeFormData(parsed);
    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: `Ошибка схемы: ${validation.errors[0] ?? "unknown"}`,
          errors: validation.errors,
        },
        { status: 400 },
      );
    }

    await fs.writeFile(
      dataPath,
      `${JSON.stringify(validation.value, null, 2)}\n`,
      "utf8",
    );

    return NextResponse.json({
      ok: true,
      message: "Форма портала сохранена и прошла валидацию.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Не удалось сохранить форму портала: ${error.message}`
            : "Не удалось сохранить форму портала.",
      },
      { status: 500 },
    );
  }
}
