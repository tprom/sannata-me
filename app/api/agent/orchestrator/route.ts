import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { Orchestrator_LandmarkPostcard } from "../../../../orchestrator/Orchestrator_LandmarkPostcard";
import { GenerateImage } from "@/skills/GenerateImage";
import { ReadLandmarkData } from "@/skills/ReadLandmarkData";
import { resolveGalleryPipelineConfig } from "@/lib/image/pipelineConfig";

type RequestBody = {
  citySlug?: string;
  landmarkSlug?: string;
  mode?: "data" | "rules";
};

const buildOrchestrator = () => {
  return new Orchestrator_LandmarkPostcard({
    readLandmarkData: new ReadLandmarkData(),
    generateImage: new GenerateImage(),
  });
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const citySlug = body.citySlug?.trim() ?? "";
  const landmarkSlug = body.landmarkSlug?.trim() ?? "";

  if (!citySlug || !landmarkSlug) {
    return NextResponse.json(
      { ok: false, message: "Не указан город или достопримечательность." },
      { status: 400 },
    );
  }

  const dataPath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    citySlug,
    landmarkSlug,
    "data.json",
  );

  try {
    await fs.access(dataPath);
  } catch {
    return NextResponse.json(
      { ok: false, message: "data.json не найден." },
      { status: 404 },
    );
  }

  try {
    const pipelineConfig = resolveGalleryPipelineConfig();
    const orchestrator = buildOrchestrator();
    const result = await orchestrator.run({
      path: dataPath,
      languages: ["ru", "en", "de", "uk"],
      galleryMode: pipelineConfig.mode,
      providerPolicy: pipelineConfig.providerPolicy,
      primaryProvider: pipelineConfig.primaryProvider,
      fallbackProviders: pipelineConfig.fallbackProviders,
    });

    const outputDir = path.dirname(dataPath);
    await Promise.all(
      Object.entries(result.views).map(async ([lang, view]) => {
        await fs.writeFile(
          path.join(outputDir, `view.${lang}.json`),
          JSON.stringify(view, null, 2),
          "utf-8",
        );
      }),
    );

    const canonicalView =
      result.views.ru ?? result.views.en ?? Object.values(result.views)[0];
    if (canonicalView) {
      await fs.writeFile(
        path.join(outputDir, "view.json"),
        JSON.stringify(canonicalView, null, 2),
        "utf-8",
      );
    }

    const galleryManifestPath = path.join(outputDir, "gallery.generated.json");
    const galleryManifestTempPath = `${galleryManifestPath}.tmp`;
    await fs.writeFile(
      galleryManifestTempPath,
      JSON.stringify(result.galleryManifest, null, 2),
      "utf-8",
    );
    await fs.rename(galleryManifestTempPath, galleryManifestPath);

    return NextResponse.json({
      ok: true,
      message:
        body.mode === "rules"
          ? "Открытка пересобрана (правила)."
          : "Открытка пересобрана (данные).",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Не удалось пересобрать открытку." },
      { status: 500 },
    );
  }
}
