import { GenerateImage } from "../skills/GenerateImage";
import { ReadLandmarkData } from "../skills/ReadLandmarkData";
import {
  OrchestratorLandmarkPostcardInput,
  OrchestratorLandmarkPostcardOutput,
} from "../types/Orchestrator_LandmarkPostcardTypes";
import path from "path";
import { buildGalleryTasks } from "@/lib/image/taskBuilder";
import { ProviderRouter } from "@/lib/image/providerRouter";
import type { GalleryMode, ProviderPolicy } from "@/types/GenerateImageTypes";

export interface OrchestratorLandmarkPostcardDeps {
  readLandmarkData: ReadLandmarkData;
  generateImage: GenerateImage;
}

type Language = "ru" | "en" | "de" | "uk";

const PROMPT_DEFAULTS: Record<
  "greeting" | "footer",
  Record<Language, string>
> = {
  greeting: {
    ru: "Привет!",
    en: "Hi there!",
    de: "Hallo!",
    uk: "Привіт!",
  },
  footer: {
    ru: "Обнимаю!  Твоя Кетти 🌟",
    en: "Hugs!  Your Ketty 🌟",
    de: "Liebe Grüße!  Deine Ketty 🌟",
    uk: "Обіймаю!  Твоя Кетті 🌟",
  },
};

type LandmarkDataV3 = {
  meta?: {
    landmark?: string;
  };
  content?: Partial<Record<Language, string>>;
  prompts?: {
    greeting?: string | Partial<Record<Language, string>>;
    footer?: string | Partial<Record<Language, string>>;
    invitation?: string | Partial<Record<Language, string>>;
    invitationBookLink?: string | Partial<Record<Language, string>>;
    bookInvite?: string | Partial<Record<Language, string>>;
    bookLink?: string | Partial<Record<Language, string>>;
  };
  postcardGraphics?: {
    stamp?: {
      isActive?: boolean;
      savedFile?: string;
    };
    illustrations?: {
      "2L"?: { isActive?: boolean; savedFile?: string };
      "2R"?: { isActive?: boolean; savedFile?: string };
      "4L"?: { isActive?: boolean; savedFile?: string };
      "4R"?: { isActive?: boolean; savedFile?: string };
    };
  };
  gallery?: {
    globalPrompt?: string;
    items?: Array<{
      index?: number;
      fileName?: string;
      savedFile?: string;
      prompt?: string;
      isActive?: boolean;
    }>;
  };
};

export class Orchestrator_LandmarkPostcard {
  private readonly deps: OrchestratorLandmarkPostcardDeps;

  constructor(deps: OrchestratorLandmarkPostcardDeps) {
    this.deps = deps;
  }

  async run(
    input: OrchestratorLandmarkPostcardInput,
  ): Promise<OrchestratorLandmarkPostcardOutput> {
    try {
      const { data } = await this.deps.readLandmarkData.execute({
        path: input.path,
      });

      const normalized = normalizeData(data);
      const outputDir = path.dirname(input.path);
      const processedGallery = await this.processGallery({
        data: normalized,
        outputDir,
        mode: input.galleryMode ?? "hybrid",
        providerPolicy: input.providerPolicy ?? "quality-first",
        primaryProvider: input.primaryProvider ?? "mock",
        fallbackProviders:
          input.fallbackProviders && input.fallbackProviders.length > 0
            ? input.fallbackProviders
            : ["manual"],
      });

      const views: OrchestratorLandmarkPostcardOutput["views"] = {};
      for (const lang of input.languages) {
        const sourceContent = normalized.content[lang] ?? "";
        views[lang] = {
          greeting: normalized.greeting[lang],
          stampImage: normalized.stampImage,
          contentFile: injectIllustrations(
            sourceContent,
            normalized.illustrations,
          ),
          footer: normalized.footer[lang],
          invitation: normalized.invitation[lang],
          invitationBookLink: normalized.invitationBookLink[lang],
        };
      }

      return {
        views,
        gallery: processedGallery.legacyItems,
        galleryManifest: processedGallery.manifest,
      };
    } catch (error) {
      throw { type: "orchestrator_error", originalError: error };
    }
  }

  private async processGallery(input: {
    data: ReturnType<typeof normalizeData>;
    outputDir: string;
    mode: GalleryMode;
    providerPolicy: ProviderPolicy;
    primaryProvider: string;
    fallbackProviders: string[];
  }) {
    const {
      data,
      outputDir,
      mode,
      providerPolicy,
      primaryProvider,
      fallbackProviders,
    } = input;

    if (mode === "legacy") {
      return {
        legacyItems: [] as OrchestratorLandmarkPostcardOutput["gallery"],
        manifest: {
          version: "1.0.0",
          generatedAt: new Date().toISOString(),
          mode: "legacy" as const,
          providerPolicy,
          stylePresetVersion: "1.0.0",
          promptBuilderVersion: "1.0.0",
          items:
            [] as OrchestratorLandmarkPostcardOutput["galleryManifest"]["items"],
        },
      };
    }

    const tasks = await buildGalleryTasks({
      outputDir,
      providerPolicy,
      galleryGlobalPrompt: data.galleryGlobalPrompt,
      landmark: data.landmark,
      items: data.galleryItems,
    });

    const router = new ProviderRouter({
      primary: primaryProvider,
      fallback: fallbackProviders,
    });

    const legacyItems: OrchestratorLandmarkPostcardOutput["gallery"] = [];
    const manifestItems: OrchestratorLandmarkPostcardOutput["galleryManifest"]["items"] =
      [];

    for (const task of tasks) {
      const result = await router.run(task);

      if (result.status === "completed" && result.outputPath) {
        legacyItems.push({
          index: task.index,
          imagePath: result.outputPath,
          prompt: task.finalPrompt,
          status: result.status,
          providerUsed: result.provider,
          fallbackChain: result.fallbackChain,
          durationMs: result.durationMs,
          attempt: result.attempt,
          taskChecksum: task.taskChecksum,
          sourceImagePath: task.sourceImagePath,
          sourceImageChecksum: task.sourceImageChecksum,
          orientation: task.orientation,
          outputSpec: task.outputSpec,
          stylePresetVersion: task.stylePresetVersion,
          promptBuilderVersion: task.promptBuilderVersion,
          manualRequired: result.manualRequired,
        });
      }

      manifestItems.push({
        taskId: task.taskId,
        index: task.index,
        status: result.status,
        sourceImagePath: task.sourceImagePath,
        sourceImageChecksum: task.sourceImageChecksum,
        taskChecksum: task.taskChecksum,
        basePrompt: task.basePrompt,
        extraPrompt: task.extraPrompt,
        finalPrompt: task.finalPrompt,
        providerUsed: result.provider,
        fallbackChain: result.fallbackChain,
        outputPath: result.outputPath ?? task.outputRelativePath,
        outputSpec: task.outputSpec,
        orientation: task.orientation,
        attempt: result.attempt,
        durationMs: result.durationMs,
        error: result.error,
        manualRequired: result.manualRequired,
        note: result.note,
      });
    }

    return {
      legacyItems,
      manifest: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        mode,
        providerPolicy,
        stylePresetVersion: tasks[0]?.stylePresetVersion ?? "1.0.0",
        promptBuilderVersion: tasks[0]?.promptBuilderVersion ?? "1.0.0",
        items: manifestItems,
      },
    };
  }
}

const normalizeData = (raw: unknown) => {
  const data = (raw ?? {}) as LandmarkDataV3;
  const content = data.content ?? {};
  const illustrations = data.postcardGraphics?.illustrations ?? {};

  return {
    landmark: data.meta?.landmark ?? "",
    content: {
      ru: typeof content.ru === "string" ? content.ru : "",
      en: typeof content.en === "string" ? content.en : "",
      de: typeof content.de === "string" ? content.de : "",
      uk: typeof content.uk === "string" ? content.uk : "",
    },
    greeting: resolvePromptByLang(data.prompts?.greeting, "greeting"),
    footer: resolvePromptByLang(data.prompts?.footer, "footer"),
    invitation: resolveOptionalPromptByLang(
      data.prompts?.invitation ?? data.prompts?.bookInvite,
    ),
    invitationBookLink: resolveOptionalPromptByLang(
      data.prompts?.invitationBookLink ?? data.prompts?.bookLink,
    ),
    stampImage:
      data.postcardGraphics?.stamp?.isActive &&
      typeof data.postcardGraphics?.stamp?.savedFile === "string"
        ? data.postcardGraphics.stamp.savedFile
        : "",
    illustrations: {
      "2L": toIllustrationPath(illustrations["2L"]),
      "2R": toIllustrationPath(illustrations["2R"]),
      "4L": toIllustrationPath(illustrations["4L"]),
      "4R": toIllustrationPath(illustrations["4R"]),
    },
    galleryGlobalPrompt:
      typeof data.gallery?.globalPrompt === "string"
        ? data.gallery.globalPrompt
        : "",
    galleryItems: Array.isArray(data.gallery?.items) ? data.gallery.items : [],
  };
};

const resolvePromptByLang = (
  value: unknown,
  key: "greeting" | "footer",
): Record<Language, string> => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return {
      ru: normalized || PROMPT_DEFAULTS[key].ru,
      en: PROMPT_DEFAULTS[key].en,
      de: PROMPT_DEFAULTS[key].de,
      uk: PROMPT_DEFAULTS[key].uk,
    };
  }

  const record =
    value && typeof value === "object"
      ? (value as Partial<Record<Language, string>>)
      : {};

  return {
    ru: (record.ru ?? "").trim() || PROMPT_DEFAULTS[key].ru,
    en: (record.en ?? "").trim() || PROMPT_DEFAULTS[key].en,
    de: (record.de ?? "").trim() || PROMPT_DEFAULTS[key].de,
    uk: (record.uk ?? "").trim() || PROMPT_DEFAULTS[key].uk,
  };
};

const resolveOptionalPromptByLang = (
  value: unknown,
): Record<Language, string> => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return {
      ru: normalized,
      en: "",
      de: "",
      uk: "",
    };
  }

  const record =
    value && typeof value === "object"
      ? (value as Partial<Record<Language, string>>)
      : {};

  return {
    ru: (record.ru ?? "").trim(),
    en: (record.en ?? "").trim(),
    de: (record.de ?? "").trim(),
    uk: (record.uk ?? "").trim(),
  };
};

const toIllustrationPath = (
  slot: { isActive?: boolean; savedFile?: string } | undefined,
) => {
  if (!slot?.isActive) return "";
  if (typeof slot.savedFile !== "string") return "";
  return slot.savedFile;
};

const injectIllustrations = (
  content: string,
  illustrations: {
    "2L": string;
    "2R": string;
    "4L": string;
    "4R": string;
  },
): string => {
  if (!content) return "";

  const paragraphs = splitContentToParagraphs(content);

  return paragraphs
    .map((paragraph, index) => {
      const paragraphNumber = index + 1;
      const markers: string[] = [];

      if (paragraphNumber === 2) {
        if (illustrations["2L"]) {
          markers.push(`[[illustration:${illustrations["2L"]}|left]]`);
        }
        if (illustrations["2R"]) {
          markers.push(`[[illustration:${illustrations["2R"]}|right]]`);
        }
      }

      if (paragraphNumber === 4) {
        if (illustrations["4L"]) {
          markers.push(`[[illustration:${illustrations["4L"]}|left]]`);
        }
        if (illustrations["4R"]) {
          markers.push(`[[illustration:${illustrations["4R"]}|right]]`);
        }
      }

      if (markers.length === 0) return paragraph;
      return `${paragraph}\n\n${markers.join("\n")}`;
    })
    .join("\n\n");
};

const splitContentToParagraphs = (content: string): string[] => {
  const byBlankLines = content
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (byBlankLines.length >= 4) {
    return byBlankLines;
  }

  const bySingleLines = content
    .split(/\r?\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return bySingleLines.length > byBlankLines.length
    ? bySingleLines
    : byBlankLines;
};
