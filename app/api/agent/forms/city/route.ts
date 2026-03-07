import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  buildCityFormMarkdown,
  deleteCityById,
  parseCityForm,
  processCityForm,
} from "@/agent/backend/city-form-processor";
import {
  listCityOptions,
  loadCitiesRegistry,
} from "@/agent/backend/cities-registry";

type RequestBody = {
  markdown?: string;
};

export async function GET(request: Request) {
  const filePath = path.join(process.cwd(), "agent", "forms", "city-form.md");

  try {
    const template = await fs.readFile(filePath, "utf8");
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId")?.trim() ?? "";
    const slug = searchParams.get("slug")?.trim() ?? "";

    const cities = await loadCitiesRegistry();
    const selectedCity =
      cities.find((item) => item.cityId === cityId) ??
      cities.find((item) => item.slug === slug) ??
      null;

    const options = await listCityOptions();
    const base = selectedCity ? buildCityFormMarkdown(selectedCity) : template;
    const content = `${base}\n`;

    return NextResponse.json({
      ok: true,
      content,
      mode: selectedCity ? "edit" : "create",
      cityOptions: options,
      selectedCity: selectedCity
        ? { cityId: selectedCity.cityId, slug: selectedCity.slug }
        : null,
      selectedCityData: selectedCity,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось загрузить форму города.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId")?.trim() ?? "";

  if (!cityId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Для удаления передайте cityId в query-параметре.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await deleteCityById(cityId);
    return NextResponse.json({
      ok: true,
      message: `Город ${result.slug} удалён из реестра.`,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Не удалось удалить город.",
      },
      { status: 400 },
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
    const data = await processCityForm(body.markdown);
    return NextResponse.json({
      ok: true,
      message: data.mode === "created" ? "Город создан." : "Город обновлён.",
      data,
    });
  } catch (error) {
    const parsed = parseCityForm(body.markdown);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить форму города.",
        draft: parsed,
        hint: "Исправьте поля в форме вручную и отправьте повторно. Для редактирования существующего города можно загрузить форму с ?cityId=<id>.",
      },
      { status: 400 },
    );
  }
}
