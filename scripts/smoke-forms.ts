import fs from "fs/promises";
import path from "path";
import { processCityForm } from "../agent/backend/city-form-processor.js";
import { processLandmarkForm } from "../agent/backend/landmark-form-processor.js";

type SmokeResult = {
  test: string;
  ok: boolean;
  message?: string;
  mode?: string;
  cityId?: string;
  slug?: string;
};

const run = async (): Promise<void> => {
  const root = process.cwd();
  const citiesPath = path.join(root, "data", "cities.json");
  const landmarkDataPath = path.join(
    root,
    "agent",
    "backend",
    "landmark-data.json",
  );

  const originalCities = await fs.readFile(citiesPath, "utf8");
  let originalLandmark: string | null = null;

  try {
    originalLandmark = await fs.readFile(landmarkDataPath, "utf8");
  } catch {
    originalLandmark = null;
  }

  const results: SmokeResult[] = [];

  try {
    const cityForm = [
      "cityId: city_augsburg",
      "slug: augsburg",
      "countryId: country_de",
      "nameRu: Аугсбург",
      "nameEn: Augsburg",
      "nameDe: Augsburg",
      "nameUk: Аугсбург",
      "geoLat: 48.3705",
      "geoLng: 10.8978",
      "geoSource: manual",
      "hasMapOption: true",
      "geoReady: true",
      "isActive: true",
      "mapLabelRu: Показать на карте",
      "mapLabelEn: Show on map",
      "mapLabelDe: Auf der Karte anzeigen",
      "mapLabelUk: Показати на мапі",
    ].join("\n");

    const cityResult = await processCityForm(cityForm);
    results.push({
      test: "city-form-valid",
      ok: true,
      mode: cityResult.mode,
      cityId: cityResult.city.cityId,
    });

    const landmarkValid = [
      "## B. Малые текстовые поля",
      "cityId: city_augsburg",
      "landmark: Smoke Landmark",
      "landmarkSlug:",
      'greeting: "Привет"',
      'footer: "Футер"',
      'stampPrompt: "Промпт"',
      "## C. Изображения",
      "imageSlots: 2",
      "commonImagePrompt:",
      "image1File:",
      "image1Prompt:",
    ].join("\n");

    const landmarkOk = await processLandmarkForm(landmarkValid);
    results.push({
      test: "landmark-form-valid",
      ok: true,
      cityId: landmarkOk.meta?.cityId,
      slug: landmarkOk.fields?.landmarkSlug,
    });

    let invalidError = "";
    try {
      const landmarkInvalid = [
        "## B. Малые текстовые поля",
        "cityId: city_unknown",
        "landmark: Broken Landmark",
        "landmarkSlug:",
      ].join("\n");
      await processLandmarkForm(landmarkInvalid);
    } catch (error) {
      invalidError = error instanceof Error ? error.message : String(error);
    }

    const invalidOk =
      invalidError.includes("неизвестный cityId") ||
      invalidError.includes("запрещено");

    results.push({
      test: "landmark-form-invalid-city",
      ok: invalidOk,
      message: invalidError,
    });

    console.log("SMOKE_RESULTS_START");
    console.log(JSON.stringify(results, null, 2));
    console.log("SMOKE_RESULTS_END");

    const failed = results.filter((item) => !item.ok);
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await fs.writeFile(citiesPath, originalCities, "utf8");

    if (originalLandmark === null) {
      try {
        await fs.unlink(landmarkDataPath);
      } catch {
        // ignore
      }
    } else {
      await fs.writeFile(landmarkDataPath, originalLandmark, "utf8");
    }
  }
};

await run();
