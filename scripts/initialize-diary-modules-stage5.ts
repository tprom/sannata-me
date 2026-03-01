import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DiaryEnvelope {
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
    title?: string;
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

interface DiaryConfig {
  moduleKey: string;
  personaName: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  kicker: Record<string, string>;
  entryCount: number;
}

const DIARY_CONFIGS: DiaryConfig[] = [
  {
    moduleKey: "diary-ketty",
    personaName: "Ketty",
    title: {
      ru: "Дневник Кетти",
      en: "Ketty's Diary",
      de: "Kettys Tagebuch",
      uk: "Щоденник Кеті",
    },
    subtitle: {
      ru: "Истории из пути",
      en: "Stories from the Journey",
      de: "Geschichten aus der Reise",
      uk: "Історії з дороги",
    },
    kicker: {
      ru: "Кетти 💛",
      en: "Ketty 💛",
      de: "Ketty 💛",
      uk: "Кеті 💛",
    },
    entryCount: 3,
  },
  {
    moduleKey: "diary-parents",
    personaName: "Parents",
    title: {
      ru: "Дневник родителей",
      en: "Parents' Diary",
      de: "Tagebuch der Eltern",
      uk: "Щоденник батьків",
    },
    subtitle: {
      ru: "Размышления о пути",
      en: "Reflections on the Journey",
      de: "Überlegungen zur Reise",
      uk: "Роздуми про дорогу",
    },
    kicker: {
      ru: "Мама & Папа 💚",
      en: "Mom & Dad 💚",
      de: "Mama & Papa 💚",
      uk: "Мама & Тато 💚",
    },
    entryCount: 2,
  },
];

function createDiaryModuleHome(
  config: DiaryConfig,
  locale: string,
): DiaryEnvelope {
  const pageId = uuidv4();
  const translationGroupId = `tg_${config.moduleKey}_home`;

  const envelope: DiaryEnvelope = {
    schemaVersion: "1.1.0",
    moduleKey: config.moduleKey,
    pageKind: "module-home",
    pageId,
    slug: config.moduleKey,
    locale,
    translationGroupId,
    meta: {
      title: config.title[locale] || config.title["en"],
      subtitle: config.subtitle[locale] || config.subtitle["en"],
      tags: [config.moduleKey, "diary", "module-home"],
      status: "published",
    },
    hero: {
      headline: config.title[locale] || config.title["en"],
      subheadline: config.subtitle[locale] || config.subtitle["en"],
      kicker: config.kicker[locale] || config.kicker["en"],
      theme: "diary",
    },
    sections: [
      {
        id: "sec_summary_main",
        type: "summary",
        title:
          locale === "ru"
            ? "О дневнике"
            : locale === "de"
              ? "Über das Tagebuch"
              : locale === "uk"
                ? "Про щоденник"
                : "About this Diary",
        visible: true,
        styleVariant: "default",
        payload: {
          text:
            locale === "ru"
              ? `Здесь собраны записи ${config.personaName} о путешествии. Каждая запись — отражение моментов, впечатлений и размышлений.`
              : locale === "de"
                ? `Hier sind die Einträge von ${config.personaName} aus der Reise gesammelt. Jeder Eintrag ist eine Widerspiegelung von Momenten, Eindrücken und Gedanken.`
                : locale === "uk"
                  ? `Тут зібрані записи ${config.personaName} про подорож. Кожна запис — відображення моментів, вражень та роздумів.`
                  : `Here are the entries of ${config.personaName} from the journey. Each entry reflects moments, impressions and thoughts.`,
        },
      },
      {
        id: "sec_timeline_main",
        type: "timeline",
        title:
          locale === "ru"
            ? "Записи"
            : locale === "de"
              ? "Einträge"
              : locale === "uk"
                ? "Записи"
                : "Entries",
        visible: true,
        styleVariant: "default",
        payload: {
          items: Array.from({ length: config.entryCount }, (_, i) => ({
            id: `entry-${i + 1}`,
            date: new Date(Date.now() - (config.entryCount - i) * 86400000)
              .toISOString()
              .split("T")[0],
            title:
              locale === "ru"
                ? `Запись #${i + 1}`
                : locale === "de"
                  ? `Eintrag #${i + 1}`
                  : locale === "uk"
                    ? `Запис #${i + 1}`
                    : `Entry #${i + 1}`,
            slug: `entry-${i + 1}`,
          })),
        },
      },
      {
        id: "sec_mood_stats",
        type: "mood-strip",
        title:
          locale === "ru"
            ? "Настроение"
            : locale === "de"
              ? "Stimmung"
              : locale === "uk"
                ? "Настрій"
                : "Mood",
        visible: true,
        styleVariant: "default",
        payload: {
          items: [
            {
              date: new Date(Date.now() - 2 * 86400000)
                .toISOString()
                .split("T")[0],
              mood: "happy",
              intensity: 8,
            },
            {
              date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
              mood: "pensive",
              intensity: 6,
            },
            {
              date: new Date().toISOString().split("T")[0],
              mood: "grateful",
              intensity: 9,
            },
          ],
        },
      },
    ],
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  return envelope;
}

function createDiaryEntry(
  config: DiaryConfig,
  entryNum: number,
  locale: string,
): DiaryEnvelope {
  const pageId = uuidv4();
  const date = new Date(Date.now() - (config.entryCount - entryNum) * 86400000);
  const dateStr = date.toISOString().split("T")[0];
  const translationGroupId = `tg_${config.moduleKey}_entry_${entryNum}`;

  const entryTexts: Record<string, Record<number, string>> = {
    ru: {
      1: "Сегодня мы прибыли в новый город. Первые впечатления полны света и новых ароматов. Люди встречают нас с улыбками, и я чувствую, здесь нас ждали.",
      2: "День был наполнен открытиями. Мы посетили старый квартал, где каждый камень хранит историю. В каждом углу — память.",
      3: "Пришло время отдыха, но мысли ещё бродят по улицам. Я благодарна за каждый момент этого путешествия.",
    },
    en: {
      1: "Today we arrived in a new city. First impressions are full of light and new scents. People greet us with smiles, and I feel we were expected here.",
      2: "The day was full of discoveries. We visited an old quarter where every stone holds a story. In every corner — memory.",
      3: "Rest is coming, but thoughts still wander the streets. I am grateful for every moment of this journey.",
    },
    de: {
      1: "Heute kamen wir in einer neuen Stadt an. Die ersten Eindrücke sind voller Licht und neuer Düfte. Menschen begrüßen uns mit Lächeln, und ich spüre, dass wir hier erwartet wurden.",
      2: "Der Tag war voller Entdeckungen. Wir besuchten ein altes Viertel, in dem jeder Stein eine Geschichte birgt. In jeder Ecke — Erinnerung.",
      3: "Die Ruhe naht, aber die Gedanken wandern noch durch die Straßen. Ich bin dankbar für jeden Moment dieser Reise.",
    },
    uk: {
      1: "Сьогодні ми прибули в нове місто. Перші враження повні світла і нових запахів. Люди зустрічають нас з посмішками, і я відчуваю, що тут нас чекали.",
      2: "День був сповнений відкриттів. Ми відвідали старий квартал, де кожен камінь зберігає історію. У кожному куті — пам'ять.",
      3: "Прийшов час відпочинку, але думки ще блукають вулицями. Я вдячна за кожен момент цієї подорожі.",
    },
  };

  const envelope: DiaryEnvelope = {
    schemaVersion: "1.1.0",
    moduleKey: config.moduleKey,
    pageKind: "entry",
    pageId,
    slug: `entry-${entryNum}`,
    locale,
    translationGroupId,
    meta: {
      title: `${dateStr}`,
      subtitle:
        locale === "ru"
          ? `Запись #${entryNum}`
          : locale === "de"
            ? `Eintrag #${entryNum}`
            : locale === "uk"
              ? `Запис #${entryNum}`
              : `Entry #${entryNum}`,
      tags: [config.moduleKey, "diary", "entry"],
      status: "published",
    },
    hero: {
      headline: `${dateStr}`,
      subheadline: config.personaName,
      kicker: config.kicker[locale] || config.kicker["en"],
      theme: "diary",
    },
    sections: [
      {
        id: "sec_entry_narrative",
        type: "entry-card",
        visible: true,
        styleVariant: "default",
        payload: {
          date: dateStr,
          text:
            entryTexts[locale]?.[entryNum as 1 | 2 | 3] ||
            entryTexts["en"][entryNum as 1 | 2 | 3],
        },
      },
      {
        id: "sec_entry_mood",
        type: "mood-strip",
        title:
          locale === "ru"
            ? "Настроение"
            : locale === "de"
              ? "Stimmung"
              : locale === "uk"
                ? "Настрій"
                : "Mood",
        visible: true,
        styleVariant: "compact",
        payload: {
          items: [
            {
              date: dateStr,
              mood:
                entryNum === 1
                  ? "happy"
                  : entryNum === 2
                    ? "pensive"
                    : "grateful",
              intensity: entryNum === 1 ? 8 : entryNum === 2 ? 6 : 9,
            },
          ],
        },
      },
    ],
    audit: {
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    },
  };

  return envelope;
}

function initializeDiaryModule(config: DiaryConfig) {
  const modulePath = path.join(__dirname, `../app/${config.moduleKey}`);

  // Создаём директорию модуля
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath, { recursive: true });
  }

  const dataPath = path.join(modulePath, "data");
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  console.log(`\n📖 Initializing ${config.moduleKey}...`);

  // Создаём module-home для каждой локали
  LOCALES.forEach((locale) => {
    const moduleHome = createDiaryModuleHome(config, locale);
    const moduleHomeFilename = `home.${locale}.json`;
    const moduleHomePath = path.join(dataPath, moduleHomeFilename);
    fs.writeFileSync(moduleHomePath, JSON.stringify(moduleHome, null, 2));
    console.log(`  ✅ ${moduleHomeFilename}`);
  });

  // Создаём entries для каждой локали
  for (let i = 1; i <= config.entryCount; i++) {
    LOCALES.forEach((locale) => {
      const entry = createDiaryEntry(config, i, locale);
      const entryFilename = `entry-${i}.${locale}.json`;
      const entryPath = path.join(dataPath, entryFilename);
      fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));
    });
    console.log(`  ✅ entry-${i}.*.json (4 locales)`);
  }

  // Создаём index.json для модуля
  const indexData = {
    moduleKey: config.moduleKey,
    title: config.title,
    subtitle: config.subtitle,
    persona: config.personaName,
    entryCount: config.entryCount,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(dataPath, "index.json"),
    JSON.stringify(indexData, null, 2),
  );
  console.log(`  ✅ index.json`);
}

// Main
async function main() {
  console.log("🚀 Starting STAGE5 diary module initialization...");

  for (const config of DIARY_CONFIGS) {
    initializeDiaryModule(config);
  }

  console.log("\n✨ STAGE5 initialization complete!");
  console.log("\nCreated modules:");
  DIARY_CONFIGS.forEach((config) => {
    console.log(`  - ${config.moduleKey}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
