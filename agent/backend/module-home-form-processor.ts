import fs from "fs/promises";
import path from "path";

type LocaleCode = "ru" | "en" | "de" | "uk";

type ModuleHomeFormData = {
  greetingRu: string;
  greetingEn: string;
  greetingDe: string;
  greetingUk: string;
  contentRu: string;
  contentEn: string;
  contentDe: string;
  contentUk: string;
  stampImage: string;
  illustration1L: string;
  illustration1R: string;
  illustration2L: string;
  illustration2R: string;
  illustration3L: string;
  illustration3R: string;
  closingTextRu: string;
  closingTextEn: string;
  closingTextDe: string;
  closingTextUk: string;
};

const parseKeyValue = (markdown: string, key: string): string => {
  const regex = new RegExp(`^${key}\\s*:\\s*(.*)$`, "m");
  const match = markdown.match(regex);
  const value = match?.[1]?.trim() || "";

  if (
    value === "(путь к файлу или URL)" ||
    value === "(path to file or URL)" ||
    value === "(url)"
  ) {
    return "";
  }

  return value;
};

const parseMultilineField = (markdown: string, key: string): string => {
  // Match "key:" followed by newline and content until next section or end
  const regex = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`, "m");
  const match = markdown.match(regex);
  if (match?.[1]) {
    return match[1].trim();
  }
  // Fallback: single line after key
  const singleLineRegex = new RegExp(`^${key}\\s*:\\s*(.+?)(?=\\n|$)`, "m");
  const singleMatch = singleLineRegex.exec(markdown);
  return singleMatch?.[1]?.trim() || "";
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

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

export const parseModuleHomeForm = (markdown: string): ModuleHomeFormData => {
  return {
    greetingRu:
      parseKeyValue(markdown, "greetingRu") || "Привет. Меня зовут Кетти.",
    greetingEn:
      parseKeyValue(markdown, "greetingEn") || "Hello. My name is Ketty.",
    greetingDe:
      parseKeyValue(markdown, "greetingDe") || "Hallo. Mein Name ist Ketty.",
    greetingUk:
      parseKeyValue(markdown, "greetingUk") || "Привіт. Мене звуть Кеті.",
    contentRu: parseMultilineField(markdown, "contentRu"),
    contentEn: parseMultilineField(markdown, "contentEn"),
    contentDe: parseMultilineField(markdown, "contentDe"),
    contentUk: parseMultilineField(markdown, "contentUk"),
    stampImage: parseKeyValue(markdown, "stampImage"),
    illustration1L: parseKeyValue(markdown, "illustration1L"),
    illustration1R: parseKeyValue(markdown, "illustration1R"),
    illustration2L: parseKeyValue(markdown, "illustration2L"),
    illustration2R: parseKeyValue(markdown, "illustration2R"),
    illustration3L: parseKeyValue(markdown, "illustration3L"),
    illustration3R: parseKeyValue(markdown, "illustration3R"),
    closingTextRu:
      parseKeyValue(markdown, "closingTextRu") ||
      "Открытки приходят не по расписанию.",
    closingTextEn:
      parseKeyValue(markdown, "closingTextEn") ||
      "Postcards come not by schedule.",
    closingTextDe:
      parseKeyValue(markdown, "closingTextDe") ||
      "Postkarten kommen nicht nach Plan.",
    closingTextUk:
      parseKeyValue(markdown, "closingTextUk") ||
      "Листівки приходять не за розкладом.",
  };
};

export const processModuleHomeForm = async (markdown: string) => {
  const data = parseModuleHomeForm(markdown);
  const timestamp = new Date().toISOString();
  const locales: LocaleCode[] = ["ru", "en", "de", "uk"];

  const outputDir = path.join(process.cwd(), "app", "landmarks", "data");
  await fs.mkdir(outputDir, { recursive: true });

  const localeGreetings: Record<LocaleCode, string> = {
    ru: data.greetingRu,
    en: data.greetingEn,
    de: data.greetingDe,
    uk: data.greetingUk,
  };

  const localeContents: Record<LocaleCode, string> = {
    ru: data.contentRu,
    en: data.contentEn,
    de: data.contentDe,
    uk: data.contentUk,
  };

  const localeClosingTexts: Record<LocaleCode, string> = {
    ru: data.closingTextRu,
    en: data.closingTextEn,
    de: data.closingTextDe,
    uk: data.closingTextUk,
  };

  const results = await Promise.all(
    locales.map(async (locale) => {
      const [text1, text2, text3] = splitContentIntoThreeParts(
        localeContents[locale],
      );

      const blocks = [
        {
          id: "block-1",
          type: "module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text1,
            illustrationLeft: data.illustration1L,
            illustrationRight: data.illustration1R,
          },
        },
        {
          id: "block-2",
          type: "module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text2,
            illustrationLeft: data.illustration2L,
            illustrationRight: data.illustration2R,
          },
        },
        {
          id: "block-3",
          type: "module-home-block",
          visible: true,
          payload: {
            title: "",
            text: text3,
            illustrationLeft: data.illustration3L,
            illustrationRight: data.illustration3R,
          },
        },
      ];

      const pageId = `landmarks:module-home:${locale}`;
      const envelope = {
        schemaVersion: "1.1.0",
        moduleKey: "landmarks",
        pageKind: "module-home",
        pageId,
        slug: "landmarks",
        locale,
        translationGroupId: "landmarks:module-home",
        meta: {
          title: "Landmarks",
          tags: ["landmarks", "module-home"],
          status: "published",
        },
        hero: {
          headline: localeGreetings[locale],
          kicker: "Sannata",
          image: data.stampImage || "",
        },
        sections: [
          ...blocks,
          {
            id: "closing",
            type: "module-home-closing",
            visible: true,
            payload: { text: localeClosingTexts[locale] },
          },
        ],
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
      };

      const outPath = path.join(outputDir, `home.${locale}.json`);
      let existingEnvelope: Record<string, unknown> = {};
      try {
        const raw = await fs.readFile(outPath, "utf-8");
        existingEnvelope = asRecord(JSON.parse(raw));
      } catch {
        existingEnvelope = {};
      }

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
        hero: {
          ...asRecord(existingEnvelope.hero),
          ...envelope.hero,
        },
        mediaRefs: {
          ...asRecord(existingEnvelope.mediaRefs),
          ...envelope.mediaRefs,
        },
        sections: envelope.sections,
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
