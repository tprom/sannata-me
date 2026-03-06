import {
  BuildPostcardJsonInput,
  BuildPostcardJsonOutput,
} from "../types/BuildPostcardJsonTypes";

export class BuildPostcardJson {
  async execute(
    input: BuildPostcardJsonInput,
  ): Promise<BuildPostcardJsonOutput> {
    const requiredBlocks = [
      input.data,
      input.analysis,
      input.style,
      input.outline,
      input.contentFile,
      input.illustrationPrompts,
      input.galleryPrompts,
      input.stampPrompt,
      input.images,
    ];

    if (requiredBlocks.some((block) => block == null)) {
      throw { type: "missing_data" };
    }

    const data = input.data as Record<string, unknown> | null;
    const passport = buildPassportFromBlocks(data);
    if (!passport) {
      throw { type: "missing_data" };
    }

    if (
      input.illustrationPrompts.length !== input.images.illustrations.length ||
      input.galleryPrompts.length !== input.images.gallery.length
    ) {
      throw { type: "inconsistent_visual_data" };
    }

    const sortedOutline = [...input.outline].sort((a, b) => a.id - b.id);
    const contentFile = input.contentFile;
    const sortedIllustrationPrompts = [...input.illustrationPrompts].sort(
      (a, b) => a.paragraphId - b.paragraphId,
    );
    const sortedIllustrationImages = [...input.images.illustrations].sort(
      (a, b) => a.paragraphId - b.paragraphId,
    );
    const sortedGalleryPrompts = [...input.galleryPrompts].sort(
      (a, b) => a.id - b.id,
    );
    const sortedGalleryImages = [...input.images.gallery].sort(
      (a, b) => a.id - b.id,
    );

    const illustrations = sortedIllustrationPrompts.map((promptItem) => {
      const image = sortedIllustrationImages.find(
        (img) => img.paragraphId === promptItem.paragraphId,
      );
      if (!image) {
        throw { type: "inconsistent_visual_data" };
      }
      return {
        paragraphId: promptItem.paragraphId,
        prompt: promptItem.prompt,
        imagePath: image.imagePath,
      };
    });

    const gallery = sortedGalleryPrompts.map((promptItem) => {
      const image = sortedGalleryImages.find((img) => img.id === promptItem.id);
      if (!image) {
        throw { type: "inconsistent_visual_data" };
      }
      return {
        id: promptItem.id,
        prompt: promptItem.prompt,
        orientation: promptItem.orientation,
        imagePath: image.imagePath,
      };
    });

    const { greeting, footer } = readPrompts(input.data);
    const profile = input.context?.profile;
    const metaStyle =
      (profile?.text?.style as Record<string, unknown> | undefined) ??
      (input.style as Record<string, unknown> | undefined) ??
      {};
    const metaVisuals = {
      illustration:
        (profile?.visuals?.illustration as
          | Record<string, unknown>
          | undefined) ?? null,
      stamp:
        (profile?.visuals?.stamp as Record<string, unknown> | undefined) ??
        null,
      gallery:
        (profile?.visuals?.gallery as Record<string, unknown> | undefined) ??
        null,
    };

    const postcardJson = {
      id: passport.id,
      title: passport.title,
      location: passport.location,
      type: passport.type,
      tags: Array.isArray(passport.tags) ? passport.tags : [],
      meta: {
        style: metaStyle,
        visuals: metaVisuals,
      },
      greeting,
      footer,
      contentFile,
      analysis: input.analysis,
      style: input.style,
      text: {
        outline: sortedOutline,
      },
      visuals: {
        illustrations,
        gallery,
        stamp: {
          prompt: input.stampPrompt,
          imagePath: input.images.stamp.imagePath,
        },
      },
    };

    return { postcardJson };
  }
}

const buildPassportFromBlocks = (
  data: Record<string, unknown> | null,
): {
  id: string;
  title: string;
  location: string;
  type: string;
  tags: string[];
} | null => {
  if (!data) return null;
  const blocks = data.blocks as Record<string, unknown> | undefined;
  if (!blocks || typeof blocks !== "object" || Array.isArray(blocks)) {
    return null;
  }

  const passportBlock =
    typeof blocks.passport === "string" ? blocks.passport : "";
  const fields = parseKeyValueLines(passportBlock);

  const title = fields["Официальное название"] || "";
  const location = fields["Местоположение"] || "";
  const type = fields["Тип объекта"] || "";
  const tags = buildTags(fields["Стиль"], type);
  const id = buildId(title);

  if (!id || !title || !location || !type) return null;

  return {
    id,
    title,
    location,
    type,
    tags,
  };
};

const parseKeyValueLines = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.replace(/^\s*[•o]\s*/i, "").trim();
    if (!trimmed) continue;
    const [key, value] = trimmed.split(":").map((part) => part.trim());
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
};

const buildTags = (style: string | undefined, type: string): string[] => {
  const tags = new Set<string>();
  if (style) {
    for (const item of style.split(/[;,]+/g)) {
      const trimmed = item.trim();
      if (trimmed) tags.add(trimmed);
    }
  }
  if (type) tags.add(type);
  return Array.from(tags).slice(0, 6);
};

const buildId = (title?: string): string => {
  const raw = (title || "landmark").toLowerCase();
  return raw.replace(/\s+/g, "_");
};

const readPrompts = (
  data: Record<string, unknown> | null,
): {
  greeting: string;
  footer: string;
} => {
  if (!data) return { greeting: "", footer: "" };
  const prompts = data.prompts as Record<string, unknown> | undefined;
  if (!prompts || typeof prompts !== "object" || Array.isArray(prompts)) {
    return { greeting: "", footer: "" };
  }
  return {
    greeting: typeof prompts.greeting === "string" ? prompts.greeting : "",
    footer: typeof prompts.footer === "string" ? prompts.footer : "",
  };
};
