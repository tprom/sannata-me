import { Orchestrator_LandmarkPostcard } from "../orchestrator/Orchestrator_LandmarkPostcard";
import { GenerateImage } from "../skills/GenerateImage";
import { ReadLandmarkData } from "../skills/ReadLandmarkData";
import { promises as fs } from "fs";
import path from "path";

const run = async () => {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("input path is required");
  }

  const requestedLanguages = parseLanguages(process.argv[3]);

  const orchestrator = new Orchestrator_LandmarkPostcard({
    readLandmarkData: new ReadLandmarkData(),
    generateImage: new GenerateImage(),
  });

  const result = await orchestrator.run({
    path: inputPath,
    languages: requestedLanguages,
  });

  const outputDir = path.dirname(inputPath);
  const ruView = result.views.ru;
  if (!ruView) {
    throw new Error("ru view was not produced");
  }

  const viewPath = path.join(outputDir, "view.json");

  await fs.writeFile(viewPath, JSON.stringify(ruView, null, 2), "utf-8");

  console.log(JSON.stringify(result, null, 2));
};

const parseLanguages = (
  raw: string | undefined,
): Array<"ru" | "en" | "de" | "uk"> => {
  if (!raw || raw.trim().length === 0) {
    return ["ru", "en", "de", "uk"];
  }

  const allowed = new Set(["ru", "en", "de", "uk"] as const);
  const parsed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item as "ru" | "en" | "de" | "uk")) as Array<
    "ru" | "en" | "de" | "uk"
  >;

  return parsed.length > 0 ? parsed : ["ru", "en", "de", "uk"];
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
