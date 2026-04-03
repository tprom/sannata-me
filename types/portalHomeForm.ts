export const PORTAL_HOME_LOCALES = ["ru", "en", "de", "uk"] as const;

export type PortalHomeLocale = (typeof PORTAL_HOME_LOCALES)[number];

export type TextAlign = "left" | "center" | "right";
export type TextSpacing = "compact" | "normal" | "relaxed";
export type TextTone = "normal" | "bold" | "italic" | "highlight";

export type LocalizedText = Record<PortalHomeLocale, string>;

export type DynamicTextBlock = {
  text: LocalizedText;
  kind: "paragraph" | "lead" | "heading" | "quote" | "list" | "note";
  tone: TextTone;
  align: TextAlign;
  spacing: TextSpacing;
  sizeAdjust: -1 | 0 | 1;
};

export type IllustrationSize =
  | "small-30"
  | "reduced-40"
  | "medium-50"
  | "large-75"
  | "full-100";

export type IllustrationType = "ketty-drawing" | "photo" | "decor";

export type DynamicIllustration = {
  image: string;
  caption: LocalizedText;
  size: IllustrationSize;
  type: IllustrationType;
  position: "left" | "right" | "center";
  insert: {
    where: "before" | "after";
    paragraph: number;
  };
  rotate: number;
  anchor: string;
  wrap: boolean;
  shadow: boolean;
  border: boolean;
};

export type PortalPageSection = {
  title: LocalizedText;
  textBlocks: DynamicTextBlock[];
  illustrations: DynamicIllustration[];
};

export type PortalHomeFormData = {
  schemaVersion: "2.0.0";
  visual: {
    image: string;
    divider: string;
    brand: string;
  };
  leftPage: PortalPageSection & {
    motto: LocalizedText;
    mottoStyle: {
      tone: TextTone;
      sizeAdjust: -1 | 0 | 1;
    };
  };
  rightPage: PortalPageSection;
};

type ValidationResult = {
  ok: boolean;
  errors: string[];
  value?: PortalHomeFormData;
};

const TEXT_BLOCK_KINDS = new Set([
  "paragraph",
  "lead",
  "heading",
  "quote",
  "list",
  "note",
]);
const TEXT_ALIGN = new Set(["left", "center", "right"]);
const TEXT_SPACING = new Set(["compact", "normal", "relaxed"]);
const TEXT_TONE = new Set(["normal", "bold", "italic", "highlight"]);
const ILLUSTRATION_SIZE = new Set([
  "small-30",
  "reduced-40",
  "medium-50",
  "large-75",
  "full-100",
]);
const ILLUSTRATION_TYPE = new Set(["ketty-drawing", "photo", "decor"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const toText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const clampSizeAdjust = (value: unknown): -1 | 0 | 1 => {
  if (value === -1 || value === "-1") return -1;
  if (value === 1 || value === "1") return 1;
  return 0;
};

const makeLocalized = (
  source?: Partial<Record<PortalHomeLocale, unknown>>,
): LocalizedText => ({
  ru: toText(source?.ru),
  en: toText(source?.en),
  de: toText(source?.de),
  uk: toText(source?.uk),
});

const emptyLocalized = (): LocalizedText => ({
  ru: "",
  en: "",
  de: "",
  uk: "",
});

function validateLocalized(
  value: unknown,
  path: string,
  errors: string[],
): value is LocalizedText {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object with ru/en/de/uk`);
    return false;
  }

  PORTAL_HOME_LOCALES.forEach((locale) => {
    if (typeof value[locale] !== "string") {
      errors.push(`${path}.${locale} must be a string`);
    }
  });

  return errors.length === 0;
}

function validateTextBlock(
  value: unknown,
  path: string,
  errors: string[],
): value is DynamicTextBlock {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  validateLocalized(value.text, `${path}.text`, errors);

  if (!TEXT_BLOCK_KINDS.has(String(value.kind))) {
    errors.push(`${path}.kind has invalid value`);
  }
  if (!TEXT_TONE.has(String(value.tone))) {
    errors.push(`${path}.tone has invalid value`);
  }
  if (!TEXT_ALIGN.has(String(value.align))) {
    errors.push(`${path}.align has invalid value`);
  }
  if (!TEXT_SPACING.has(String(value.spacing))) {
    errors.push(`${path}.spacing has invalid value`);
  }
  if (
    value.sizeAdjust !== -1 &&
    value.sizeAdjust !== 0 &&
    value.sizeAdjust !== 1
  ) {
    errors.push(`${path}.sizeAdjust must be -1, 0 or 1`);
  }

  return errors.length === 0;
}

function validateIllustration(
  value: unknown,
  path: string,
  errors: string[],
): value is DynamicIllustration {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  if (!toText(value.image)) {
    errors.push(`${path}.image must be a non-empty string`);
  }
  validateLocalized(value.caption, `${path}.caption`, errors);
  if (!ILLUSTRATION_SIZE.has(String(value.size))) {
    errors.push(`${path}.size has invalid value`);
  }
  if (!ILLUSTRATION_TYPE.has(String(value.type))) {
    errors.push(`${path}.type has invalid value`);
  }
  if (!TEXT_ALIGN.has(String(value.position))) {
    errors.push(`${path}.position has invalid value`);
  }

  const insert = asRecord(value.insert);
  if (insert.where !== "before" && insert.where !== "after") {
    errors.push(`${path}.insert.where must be before/after`);
  }
  const paragraph = Number(insert.paragraph);
  if (!Number.isInteger(paragraph) || paragraph < 1) {
    errors.push(`${path}.insert.paragraph must be integer >= 1`);
  }

  const rotate = Number(value.rotate);
  if (!Number.isFinite(rotate) || rotate < -10 || rotate > 10) {
    errors.push(`${path}.rotate must be between -10 and 10`);
  }

  if (typeof value.anchor !== "string") {
    errors.push(`${path}.anchor must be a string`);
  }

  ["wrap", "shadow", "border"].forEach((flag) => {
    if (typeof value[flag] !== "boolean") {
      errors.push(`${path}.${flag} must be boolean`);
    }
  });

  return errors.length === 0;
}

function validatePageSection(
  value: unknown,
  path: string,
  errors: string[],
  includeMotto: boolean,
): boolean {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  validateLocalized(value.title, `${path}.title`, errors);

  if (!Array.isArray(value.textBlocks)) {
    errors.push(`${path}.textBlocks must be an array`);
  } else {
    value.textBlocks.forEach((block, index) => {
      validateTextBlock(block, `${path}.textBlocks[${index}]`, errors);
    });
  }

  if (!Array.isArray(value.illustrations)) {
    errors.push(`${path}.illustrations must be an array`);
  } else {
    value.illustrations.forEach((illustration, index) => {
      validateIllustration(
        illustration,
        `${path}.illustrations[${index}]`,
        errors,
      );
    });
  }

  if (includeMotto) {
    validateLocalized(value.motto, `${path}.motto`, errors);
    const mottoStyle = asRecord(value.mottoStyle);
    if (!TEXT_TONE.has(String(mottoStyle.tone))) {
      errors.push(`${path}.mottoStyle.tone has invalid value`);
    }
    if (
      mottoStyle.sizeAdjust !== -1 &&
      mottoStyle.sizeAdjust !== 0 &&
      mottoStyle.sizeAdjust !== 1
    ) {
      errors.push(`${path}.mottoStyle.sizeAdjust must be -1, 0 or 1`);
    }
  }

  return errors.length === 0;
}

export function validatePortalHomeFormData(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["root must be an object"] };
  }

  if (value.schemaVersion !== "2.0.0") {
    errors.push("root.schemaVersion must be 2.0.0");
  }

  const visual = asRecord(value.visual);
  if (!toText(visual.image)) errors.push("root.visual.image must be a string");
  if (!toText(visual.divider))
    errors.push("root.visual.divider must be a string");
  if (!toText(visual.brand)) errors.push("root.visual.brand must be a string");

  validatePageSection(value.leftPage, "root.leftPage", errors, true);
  validatePageSection(value.rightPage, "root.rightPage", errors, false);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], value: value as PortalHomeFormData };
}

const defaultTextBlock = (): DynamicTextBlock => ({
  text: emptyLocalized(),
  kind: "paragraph",
  tone: "normal",
  align: "left",
  spacing: "normal",
  sizeAdjust: 0,
});

const defaultIllustration = (paragraph: number): DynamicIllustration => ({
  image: "",
  caption: emptyLocalized(),
  size: "medium-50",
  type: "ketty-drawing",
  position: "center",
  insert: {
    where: "after",
    paragraph,
  },
  rotate: 0,
  anchor: "",
  wrap: true,
  shadow: false,
  border: false,
});

const normalizeKind = (value: unknown): DynamicTextBlock["kind"] => {
  const v = String(value);
  if (TEXT_BLOCK_KINDS.has(v)) {
    return v as DynamicTextBlock["kind"];
  }
  return "paragraph";
};

const normalizeToneFromLegacyBlock = (
  block: Record<string, unknown>,
): TextTone => {
  const content = Array.isArray(block.content) ? block.content : [];
  const first = asRecord(content[0]);
  if (first.highlight) return "highlight";
  if (first.bold) return "bold";
  if (first.italic) return "italic";
  return "normal";
};

const normalizeTextFromLegacyBlock = (
  block: Record<string, unknown>,
): string => {
  if (Array.isArray(block.content)) {
    return block.content
      .map((segment) => asRecord(segment))
      .map((segment) => toText(segment.text))
      .join("")
      .trim();
  }

  if (Array.isArray(block.items)) {
    return block.items
      .map((item) => (Array.isArray(item) ? item : []))
      .map((item) =>
        item
          .map((segment) => asRecord(segment))
          .map((segment) => toText(segment.text))
          .join(" "),
      )
      .join("\n")
      .trim();
  }

  return "";
};

const normalizeLegacyIllustrationSize = (value: unknown): IllustrationSize => {
  const v = String(value);
  if (v === "small") return "small-30";
  if (v === "compact") return "reduced-40";
  if (v === "medium") return "medium-50";
  if (v === "threeQuarter") return "large-75";
  if (v === "large") return "full-100";
  return "medium-50";
};

const normalizeLegacyPosition = (
  value: unknown,
): "left" | "center" | "right" => {
  const v = String(value);
  if (v === "left" || v === "right" || v === "center") {
    return v;
  }
  return "center";
};

function fromLegacy(value: Record<string, unknown>): PortalHomeFormData {
  const byLocale = PORTAL_HOME_LOCALES.map((locale) => ({
    locale,
    data: asRecord(value[locale]),
  }));

  const ru = asRecord(value.ru);
  const ruLeft = asRecord(ru.leftForm);
  const ruRight = asRecord(ru.rightForm);
  const ruLeftContent = asRecord(ruLeft.content);

  const visual = asRecord(ruLeft.visual);

  const ruLeftBlocks = Array.isArray(ruLeftContent.blocks)
    ? ruLeftContent.blocks.map((block) => asRecord(block))
    : [];
  const ruRightBlocks = Array.isArray(ruRight.blocks)
    ? ruRight.blocks.map((block) => asRecord(block))
    : [];

  const leftTextBlocks: DynamicTextBlock[] = ruLeftBlocks.map(
    (baseBlock, index) => {
      const text: Partial<LocalizedText> = {};

      byLocale.forEach(({ locale, data }) => {
        const lf = asRecord(data.leftForm);
        const content = asRecord(lf.content);
        const blocks = Array.isArray(content.blocks) ? content.blocks : [];
        text[locale] = normalizeTextFromLegacyBlock(asRecord(blocks[index]));
      });

      return {
        text: makeLocalized(text),
        kind: normalizeKind(baseBlock.kind),
        tone: normalizeToneFromLegacyBlock(baseBlock),
        align: TEXT_ALIGN.has(String(baseBlock.align))
          ? (String(baseBlock.align) as TextAlign)
          : "left",
        spacing: TEXT_SPACING.has(String(baseBlock.spacing))
          ? (String(baseBlock.spacing) as TextSpacing)
          : "normal",
        sizeAdjust: clampSizeAdjust(baseBlock.sizeAdjust),
      };
    },
  );

  const rightTextBlocks: DynamicTextBlock[] = ruRightBlocks.map(
    (baseBlock, index) => {
      const text: Partial<LocalizedText> = {};

      byLocale.forEach(({ locale, data }) => {
        const rf = asRecord(data.rightForm);
        const blocks = Array.isArray(rf.blocks) ? rf.blocks : [];
        text[locale] = normalizeTextFromLegacyBlock(asRecord(blocks[index]));
      });

      return {
        text: makeLocalized(text),
        kind: normalizeKind(baseBlock.kind),
        tone: normalizeToneFromLegacyBlock(baseBlock),
        align: TEXT_ALIGN.has(String(baseBlock.align))
          ? (String(baseBlock.align) as TextAlign)
          : "left",
        spacing: TEXT_SPACING.has(String(baseBlock.spacing))
          ? (String(baseBlock.spacing) as TextSpacing)
          : "normal",
        sizeAdjust: clampSizeAdjust(baseBlock.sizeAdjust),
      };
    },
  );

  const collectLegacyIllustrations = (
    side: "left" | "right",
    baseBlocks: Record<string, unknown>[],
  ): DynamicIllustration[] => {
    const result: DynamicIllustration[] = [];

    baseBlocks.forEach((baseBlock, blockIndex) => {
      const baseImages = Array.isArray(baseBlock.illustrations)
        ? baseBlock.illustrations
        : [];

      baseImages.forEach((rawImage, imageIndex) => {
        const image = asRecord(rawImage);
        const caption: Partial<LocalizedText> = {};

        byLocale.forEach(({ locale, data }) => {
          const container =
            side === "left"
              ? asRecord(asRecord(asRecord(data.leftForm).content))
              : asRecord(data.rightForm);
          const blocks = Array.isArray(container.blocks)
            ? container.blocks
            : [];
          const block = asRecord(blocks[blockIndex]);
          const localizedImages = Array.isArray(block.illustrations)
            ? block.illustrations
            : [];
          const localizedImage = asRecord(localizedImages[imageIndex]);
          caption[locale] = toText(localizedImage.caption);
        });

        result.push({
          image: toText(image.src),
          caption: makeLocalized(caption),
          size: normalizeLegacyIllustrationSize(image.size),
          type: ILLUSTRATION_TYPE.has(String(image.type))
            ? (String(image.type) as IllustrationType)
            : "ketty-drawing",
          position: normalizeLegacyPosition(image.align ?? image.position),
          insert: {
            where:
              image.insert && asRecord(image.insert).where === "before"
                ? "before"
                : "after",
            paragraph:
              Number(asRecord(image.insert).paragraph) > 0
                ? Number(asRecord(image.insert).paragraph)
                : blockIndex + 1,
          },
          rotate: Math.max(-10, Math.min(10, Number(image.rotate) || 0)),
          anchor: toText(image.anchor),
          wrap: typeof image.wrap === "boolean" ? image.wrap : true,
          shadow: typeof image.shadow === "boolean" ? image.shadow : false,
          border: typeof image.border === "boolean" ? image.border : false,
        });
      });
    });

    return result;
  };

  const leftIllustrations = collectLegacyIllustrations("left", ruLeftBlocks);
  const rightIllustrations = collectLegacyIllustrations("right", ruRightBlocks);

  return {
    schemaVersion: "2.0.0",
    visual: {
      image: toText(asRecord(visual.image).src) || "/images/castle.png",
      divider: toText(asRecord(visual.divider).src) || "/images/divider.png",
      brand: toText(visual.brand) || "SANNATA.me",
    },
    leftPage: {
      motto: makeLocalized(
        Object.fromEntries(
          byLocale.map(({ locale, data }) => [
            locale,
            toText(asRecord(data.leftForm).motto),
          ]),
        ) as Partial<Record<PortalHomeLocale, unknown>>,
      ),
      mottoStyle: {
        tone: TEXT_TONE.has(String(asRecord(ruLeft.mottoStyle).tone))
          ? (String(asRecord(ruLeft.mottoStyle).tone) as TextTone)
          : "italic",
        sizeAdjust: clampSizeAdjust(asRecord(ruLeft.mottoStyle).sizeAdjust),
      },
      title: makeLocalized(
        Object.fromEntries(
          byLocale.map(({ locale, data }) => {
            const title = toText(
              asRecord(asRecord(asRecord(data.leftForm).content).title),
            );
            return [locale, title];
          }),
        ) as Partial<Record<PortalHomeLocale, unknown>>,
      ),
      textBlocks:
        leftTextBlocks.length > 0 ? leftTextBlocks : [defaultTextBlock()],
      illustrations: leftIllustrations,
    },
    rightPage: {
      title: makeLocalized(
        Object.fromEntries(
          byLocale.map(({ locale, data }) => {
            const title = toText(asRecord(data.rightForm).title);
            return [locale, title];
          }),
        ) as Partial<Record<PortalHomeLocale, unknown>>,
      ),
      textBlocks:
        rightTextBlocks.length > 0 ? rightTextBlocks : [defaultTextBlock()],
      illustrations: rightIllustrations,
    },
  };
}

export function normalizePortalHomeFormData(value: unknown): ValidationResult {
  const direct = validatePortalHomeFormData(value);
  if (direct.ok) return direct;

  if (!isRecord(value)) {
    return { ok: false, errors: ["root must be an object"] };
  }

  const migrated = fromLegacy(value);
  const migratedValidation = validatePortalHomeFormData(migrated);
  if (migratedValidation.ok) {
    return migratedValidation;
  }

  return {
    ok: false,
    errors: [
      "Failed to normalize portal home form data",
      ...direct.errors,
      ...migratedValidation.errors,
    ],
  };
}
