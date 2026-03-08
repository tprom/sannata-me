import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

type LocaleCode = "ru" | "en" | "de" | "uk";

type IllustrationDraft = {
  image: string;
  caption: Record<LocaleCode, string>;
  size: "small" | "medium" | "large" | "threeQuarter" | "compact";
  type: "ketty-drawing" | "photo" | "decor";
  position: "left" | "right" | "center";
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: number;
  insert?: {
    where: "before" | "after";
    paragraph: number;
  };
  anchor?: string;
};

type ModuleHomeFormData = {
  moduleKey: string;
  slug: string;
  greeting: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
  invitation: Record<LocaleCode, string>;
  stampImage: string;
  illustrations: IllustrationDraft[];
  legacyIllustrationSlots: {
    illustration1L: string;
    illustration1R: string;
    illustration2L: string;
    illustration2R: string;
    illustration3L: string;
    illustration3R: string;
  };
};

const LOCALES: LocaleCode[] = ["ru", "en", "de", "uk"];

const emptyLocalized = (): Record<LocaleCode, string> => ({
  ru: "",
  en: "",
  de: "",
  uk: "",
});

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");

const parseFlatFields = (markdown: string): Record<string, string> => {
  const fields: Record<string, string> = {};

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("<!--")) continue;
    const match = line.match(/^([A-Za-z0-9_.\[\]]+)\s*:\s*([^\r\n]*)$/);
    if (!match) continue;
    fields[match[1]] = match[2].trim();
  }

  return fields;
};

const parseMultilineLegacy = (markdown: string, key: string): string => {
  const regex = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`, "m");
  const match = markdown.match(regex);
  if (match?.[1]) {
    return match[1].trim();
  }
  return "";
};

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  const normalized = normalize(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
};

const parseNumber = (value: unknown, fallback: number): number => {
  const n = Number.parseFloat(normalize(value));
  return Number.isFinite(n) ? n : fallback;
};

const clampRotate = (value: number): number => {
  if (value < -10) return -10;
  if (value > 10) return 10;
  return value;
};

const normalizeSize = (value: unknown): IllustrationDraft["size"] => {
  const normalized = normalize(value);
  if (normalized === "large") return "large";
  if (normalized === "threeQuarter") return "threeQuarter";
  if (normalized === "medium") return "medium";
  if (normalized === "compact") return "compact";
  if (normalized === "small") return "small";
  return "medium";
};

const parseIllustrations = (
  fields: Record<string, string>,
): IllustrationDraft[] => {
  const byIndex = new Map<number, Record<string, string>>();

  for (const [key, value] of Object.entries(fields)) {
    const match = key.match(/^illustration\[(\d+)\]\.(.+)$/);
    if (!match) continue;

    const index = Number.parseInt(match[1], 10);
    if (!Number.isFinite(index)) continue;

    if (!byIndex.has(index)) {
      byIndex.set(index, {});
    }

    byIndex.get(index)![match[2]] = value;
  }

  return [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, block]) => {
      const rotate = clampRotate(parseNumber(block.rotate, 0));
      const paragraph = Math.max(
        1,
        Math.floor(parseNumber(block["insert.paragraph"], 1)),
      );
      const whereRaw = normalize(block["insert.where"]);
      const where: "before" | "after" =
        whereRaw === "before" ? "before" : "after";

      return {
        image: normalize(block.image),
        caption: {
          ru: normalize(block["caption.ru"]),
          en: normalize(block["caption.en"]),
          de: normalize(block["caption.de"]),
          uk: normalize(block["caption.uk"]),
        },
        size: normalizeSize(block.size),
        type:
          (normalize(block.type) as IllustrationDraft["type"]) ||
          "ketty-drawing",
        position:
          (normalize(block.position) as IllustrationDraft["position"]) ||
          "right",
        wrap: parseBoolean(block.wrap, true),
        shadow: parseBoolean(block.shadow, false),
        border: parseBoolean(block.border, false),
        rotate,
        insert: {
          where,
          paragraph,
        },
        anchor: normalize(block.anchor) || undefined,
      } as IllustrationDraft;
    })
    .filter((item) => item.image.length > 0);
};

const splitContentIntoThreeParts = (
  content: string,
): [string, string, string] => {
  if (!content.trim()) {
    return ["", "", ""];
  }

  const byDivider = content
    .split(/\n\s*---\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts =
    byDivider.length > 0
      ? byDivider
      : content
          .split(/\n{2,}/g)
          .map((part) => part.trim())
          .filter(Boolean);

  return [parts[0] || "", parts[1] || "", parts[2] || ""];
};

const toLegacySlots = (
  illustrations: IllustrationDraft[],
  legacy: ModuleHomeFormData["legacyIllustrationSlots"],
) => {
  const slots = {
    illustration1L: legacy.illustration1L,
    illustration1R: legacy.illustration1R,
    illustration2L: legacy.illustration2L,
    illustration2R: legacy.illustration2R,
    illustration3L: legacy.illustration3L,
    illustration3R: legacy.illustration3R,
  };

  for (const item of illustrations) {
    const paragraph = item.insert?.paragraph ?? 1;
    const blockIndex = Math.min(3, Math.max(1, Math.ceil(paragraph / 2)));
    const side = item.position === "left" ? "L" : "R";
    const slotKey = `illustration${blockIndex}${side}` as keyof typeof slots;
    if (!slots[slotKey]) {
      slots[slotKey] = item.image;
    }
  }

  return slots;
};

const parseLegacyOrNewValue = (
  fields: Record<string, string>,
  markdown: string,
  newKey: string,
  oldKey: string,
) => {
  const fromNew = normalize(fields[newKey]);
  if (fromNew) return decodeMultiline(fromNew);

  const fromOld = normalize(fields[oldKey]);
  if (fromOld) return fromOld;

  const oldMultiline = parseMultilineLegacy(markdown, oldKey);
  if (oldMultiline) return oldMultiline;

  return "";
};

const parseKeyValue = (fields: Record<string, string>, key: string): string => {
  const value = normalize(fields[key]);

  if (
    value === "(путь к файлу или URL)" ||
    value === "(path to file or URL)" ||
    value === "(url)"
  ) {
    return "";
  }

  if (value.startsWith("## ")) {
    return "";
  }

  return value;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuidOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return UUID_RE.test(value) ? value : null;
};

export const parseModuleHomeForm = (markdown: string): ModuleHomeFormData => {
  const fields = parseFlatFields(markdown);

  const greeting = emptyLocalized();
  const description = emptyLocalized();
  const invitation = emptyLocalized();

  for (const locale of LOCALES) {
    greeting[locale] =
      parseLegacyOrNewValue(
        fields,
        markdown,
        `greeting.${locale}`,
        `greeting${locale.toUpperCase()}`,
      ) ||
      (locale === "ru"
        ? "Привет. Меня зовут Кетти."
        : locale === "en"
          ? "Hello. My name is Ketty."
          : locale === "de"
            ? "Hallo. Mein Name ist Ketty."
            : "Привiт. Мене звуть Кеттi.");

    description[locale] = parseLegacyOrNewValue(
      fields,
      markdown,
      `description.${locale}`,
      `content${locale.toUpperCase()}`,
    );

    invitation[locale] =
      parseLegacyOrNewValue(
        fields,
        markdown,
        `invitation.${locale}`,
        `closingText${locale.toUpperCase()}`,
      ) ||
      (locale === "ru"
        ? "Открытки приходят не по расписанию."
        : locale === "en"
          ? "Postcards come not by schedule."
          : locale === "de"
            ? "Postkarten kommen nicht nach Plan."
            : "Листiвки приходять не за розкладом.");
  }

  const legacyIllustrationSlots = {
    illustration1L: parseKeyValue(fields, "illustration1L"),
    illustration1R: parseKeyValue(fields, "illustration1R"),
    illustration2L: parseKeyValue(fields, "illustration2L"),
    illustration2R: parseKeyValue(fields, "illustration2R"),
    illustration3L: parseKeyValue(fields, "illustration3L"),
    illustration3R: parseKeyValue(fields, "illustration3R"),
  };

  let illustrations = parseIllustrations(fields);
  if (illustrations.length === 0) {
    const legacyOrder: Array<
      [
        keyof ModuleHomeFormData["legacyIllustrationSlots"],
        "left" | "right",
        number,
      ]
    > = [
      ["illustration1L", "left", 2],
      ["illustration1R", "right", 2],
      ["illustration2L", "left", 4],
      ["illustration2R", "right", 4],
      ["illustration3L", "left", 6],
      ["illustration3R", "right", 6],
    ];

    illustrations = legacyOrder
      .map(([key, position, paragraph]) => {
        const image = legacyIllustrationSlots[key];
        if (!image) return null;

        return {
          image,
          caption: emptyLocalized(),
          size: "medium",
          type: "ketty-drawing",
          position,
          wrap: true,
          shadow: false,
          border: false,
          rotate: 0,
          insert: {
            where: "after",
            paragraph,
          },
        } as IllustrationDraft;
      })
      .filter((item): item is IllustrationDraft => Boolean(item));
  }

  return {
    moduleKey: parseKeyValue(fields, "moduleKey") || "landmarks",
    slug: parseKeyValue(fields, "slug") || "landmarks",
    greeting,
    description,
    invitation,
    stampImage: parseKeyValue(fields, "stampImage"),
    illustrations,
    legacyIllustrationSlots,
  };
};

export const processModuleHomeForm = async (markdown: string) => {
  const data = parseModuleHomeForm(markdown);
  const timestamp = new Date().toISOString();
  const locales: LocaleCode[] = ["ru", "en", "de", "uk"];

  const outputDir = path.join(process.cwd(), "app", "landmarks", "data");
  await fs.mkdir(outputDir, { recursive: true });

  const slots = toLegacySlots(data.illustrations, data.legacyIllustrationSlots);

  const results = await Promise.all(
    locales.map(async (locale) => {
      const [text1, text2, text3] = splitContentIntoThreeParts(
        data.description[locale],
      );

      const blocks = [
        {
          id: "sec_module_home_block_1",
          type: "custom:module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text1,
            illustrationLeft: slots.illustration1L,
            illustrationRight: slots.illustration1R,
          },
        },
        {
          id: "sec_module_home_block_2",
          type: "custom:module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text2,
            illustrationLeft: slots.illustration2L,
            illustrationRight: slots.illustration2R,
          },
        },
        {
          id: "sec_module_home_block_3",
          type: "custom:module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text3,
            illustrationLeft: slots.illustration3L,
            illustrationRight: slots.illustration3R,
          },
        },
      ];

      const outPath = path.join(outputDir, `home.${locale}.json`);
      let existingEnvelope: Record<string, unknown> = {};
      try {
        const raw = await fs.readFile(outPath, "utf-8");
        existingEnvelope = asRecord(JSON.parse(raw));
      } catch {
        existingEnvelope = {};
      }

      const pageId = asUuidOrNull(existingEnvelope.pageId) ?? randomUUID();
      const envelope = {
        schemaVersion: "1.1.0",
        moduleKey: data.moduleKey || "landmarks",
        pageKind: "module-home",
        pageId,
        slug: data.slug || "landmarks",
        locale,
        translationGroupId: `tg_${data.moduleKey || "landmarks"}_module_home`,
        meta: {
          title: "Landmarks",
          tags: ["landmarks", "module-home"],
          status: "published",
        },
        hero: {
          headline: data.greeting[locale],
          kicker: "Sannata",
        },
        sections: [
          ...blocks,
          {
            id: "sec_module_home_closing",
            type: "custom:module-home-closing",
            visible: true,
            payload: { text: data.invitation[locale] },
          },
        ],
        navigation: {
          parentId: null,
          childrenIds: [],
          siblings: [],
          breadcrumbs: [
            {
              pageId,
              title: "Landmarks",
              slug: "landmarks",
            },
          ],
        },
        mediaRefs: {
          hero: data.stampImage ? [data.stampImage] : [],
          sections: blocks
            .flatMap((b) => [
              b.payload.illustrationLeft,
              b.payload.illustrationRight,
            ])
            .filter(Boolean),
        },
        audit: {
          createdAt: timestamp,
          updatedAt: timestamp,
          updatedBy: "agent-form",
        },
        moduleHomeContract: {
          greeting: data.greeting,
          description: data.description,
          invitation: data.invitation,
          stampImage: data.stampImage,
          illustrations: data.illustrations,
        },
      };

      const existingAudit = asRecord(existingEnvelope.audit);
      const createdAt =
        typeof existingAudit.createdAt === "string"
          ? existingAudit.createdAt
          : timestamp;

      const mergedEnvelope = {
        ...existingEnvelope,
        ...envelope,
        meta: {
          ...asRecord(existingEnvelope.meta),
          ...envelope.meta,
        },
        hero: envelope.hero,
        mediaRefs: {
          ...asRecord(existingEnvelope.mediaRefs),
          ...envelope.mediaRefs,
        },
        sections: envelope.sections,
        navigation: envelope.navigation,
        audit: {
          ...existingAudit,
          createdAt,
          updatedAt: timestamp,
          updatedBy: "agent-form",
        },
      };

      await fs.writeFile(
        outPath,
        JSON.stringify(mergedEnvelope, null, 2),
        "utf-8",
      );
      return { locale, pageId, path: outPath };
    }),
  );

  return { success: true, locales, outputDir, results };
};
