import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

interface OldLandmarkData {
  meta: {
    city: Record<string, string>;
    landmark: string;
    citySlug: string;
    landmarkSlug: string;
    alias: string;
    updatedAt: string;
  };
  content: Record<string, string>;
  prompts: Record<string, any>;
  postcardGraphics: any;
  gallery: any;
}

interface NewEnvelope {
  schemaVersion: string;
  moduleKey: string;
  pageKind: string;
  pageId: string;
  slug: string;
  locale: string;
  translationGroupId: string;
  meta: {
    title: string;
    subtitle: string;
    tags: string[];
    status: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    kicker: string;
    theme: string;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    visible: boolean;
    styleVariant: string;
    payload: any;
  }>;
  audit?: {
    createdAt: string;
    updatedAt: string;
  };
}

const LOCALES = ["ru", "en", "de", "uk"];

function convertOldToNew(
  oldData: OldLandmarkData,
  locale: string,
  outputDir: string,
): NewEnvelope {
  const cityName = oldData.meta.city[locale] || oldData.meta.city["en"] || "";
  const landmarkName = oldData.meta.landmark;
  const slug = oldData.meta.landmarkSlug;
  const pageId = randomUUID();
  const translationGroupId = `tg_${oldData.meta.alias}`;

  // Кажущийся hero
  const heroImages =
    oldData.gallery?.items?.filter((item: any) => item.isActive)?.slice(0, 1) ||
    [];
  const heroImagePath = heroImages[0]?.savedFile
    ? `/public${outputDir}/${oldData.meta.landmarkSlug}/${heroImages[0].savedFile}`
    : null;

  // Секции
  const sections: NewEnvelope["sections"] = [];

  // Добавить narrative-контент
  if (oldData.content[locale]) {
    sections.push({
      id: "sec_narrative_main",
      type: "narrative",
      title: "История",
      visible: true,
      styleVariant: "default",
      payload: {
        text: oldData.content[locale],
      },
    });
  }

  // Добавить greeting (если есть)
  if (oldData.prompts?.greeting?.[locale]) {
    sections.push({
      id: "sec_greeting",
      type: "quote",
      title: "Приветствие",
      visible: true,
      styleVariant: "default",
      payload: {
        text: oldData.prompts.greeting[locale],
        attribution: oldData.prompts.footer?.[locale] || "Sannata",
      },
    });
  }

  // Добавить галерею
  const galleryItems =
    oldData.gallery?.items
      ?.filter((item: any) => item.isActive && item.savedFile)
      ?.map((item: any) => ({
        src: `/public${outputDir}/${oldData.meta.landmarkSlug}/${item.savedFile}`,
        caption: oldData.gallery?.globalPrompt || undefined,
      })) || [];

  if (galleryItems.length > 0) {
    sections.push({
      id: "sec_gallery",
      type: "gallery",
      title: "Фотоматериалы",
      visible: true,
      styleVariant: "default",
      payload: {
        items: galleryItems,
      },
    });
  }

  // Добавить postcard-графику (если активна)
  const illustrationItems = [];
  if (oldData.postcardGraphics?.illustrations?.["2L"]?.isActive) {
    illustrationItems.push({
      position: "2L",
      src: `/public${outputDir}/${oldData.meta.landmarkSlug}/${oldData.postcardGraphics.illustrations["2L"].savedFile}`,
    });
  }
  if (oldData.postcardGraphics?.illustrations?.["4R"]?.isActive) {
    illustrationItems.push({
      position: "4R",
      src: `/public${outputDir}/${oldData.meta.landmarkSlug}/${oldData.postcardGraphics.illustrations["4R"].savedFile}`,
    });
  }
  if (oldData.postcardGraphics?.stamp?.isActive) {
    illustrationItems.push({
      position: "stamp",
      src: `/public${outputDir}/${oldData.meta.landmarkSlug}/${oldData.postcardGraphics.stamp.savedFile}`,
    });
  }

  if (illustrationItems.length > 0) {
    sections.push({
      id: "sec_postcard_graphics",
      type: "postcard-graphics",
      title: "Оформление открытки",
      visible: true,
      styleVariant: "default",
      payload: {
        items: illustrationItems,
      },
    });
  }

  const envelope: NewEnvelope = {
    schemaVersion: "1.1.0",
    moduleKey: "landmarks",
    pageKind: "landmark-item",
    pageId,
    slug,
    locale,
    translationGroupId,
    meta: {
      title: `${landmarkName}`,
      subtitle: `${cityName}`,
      tags: ["landmarks", "landmark-item", oldData.meta.citySlug],
      status: "published",
    },
    hero: {
      headline: landmarkName,
      subheadline: cityName,
      kicker: "Sannata",
      theme: "postcard",
    },
    sections,
    audit: {
      createdAt: oldData.meta.updatedAt,
      updatedAt: oldData.meta.updatedAt,
    },
  };

  return envelope;
}

function migrateCity(citySlug: string) {
  const cityPath = path.join(__dirname, `../data/landmarks/${citySlug}`);

  if (!fs.existsSync(cityPath)) {
    console.warn(`City path not found: ${cityPath}`);
    return;
  }

  const landmarkDirs = fs.readdirSync(cityPath).filter((dir) => {
    const fullPath = path.join(cityPath, dir);
    return (
      fs.statSync(fullPath).isDirectory() &&
      dir !== "cover" &&
      dir !== "gallery" &&
      dir !== "hero"
    );
  });

  console.log(`Processing ${landmarkDirs.length} landmarks in ${citySlug}...`);

  landmarkDirs.forEach((landmarkDir) => {
    const landmarkDataPath = path.join(cityPath, landmarkDir, "data.json");

    if (!fs.existsSync(landmarkDataPath)) {
      console.warn(`  ⚠️ No data.json in ${citySlug}/${landmarkDir}`);
      return;
    }

    try {
      const oldData: OldLandmarkData = JSON.parse(
        fs.readFileSync(landmarkDataPath, "utf8"),
      );
      const outputDirPath = `/landmarks/${citySlug}`;

      // Конвертировать для каждой локали
      LOCALES.forEach((locale) => {
        const newEnvelope = convertOldToNew(oldData, locale, outputDirPath);
        const outputFilename = `${landmarkDir}.${locale}.json`;
        const outputPath = path.join(
          __dirname,
          `../data/landmarks/${citySlug}/${outputFilename}`,
        );

        fs.writeFileSync(outputPath, JSON.stringify(newEnvelope, null, 2));
        console.log(`  ✅ ${outputFilename}`);
      });
    } catch (error) {
      console.error(`  ❌ Error processing ${citySlug}/${landmarkDir}:`, error);
    }
  });
}

// Main
async function main() {
  console.log("🚀 Starting STAGE4 landmark migration...\n");

  const dataPath = path.join(__dirname, "../data/landmarks");
  const cities = fs.readdirSync(dataPath).filter((dir) => {
    const fullPath = path.join(dataPath, dir);
    return fs.statSync(fullPath).isDirectory() && dir !== "index.json";
  });

  console.log(`Found ${cities.length} cities: ${cities.join(", ")}\n`);

  cities.forEach(migrateCity);

  console.log("\n✨ Migration complete!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
