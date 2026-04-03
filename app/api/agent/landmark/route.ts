import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  findCityById,
  loadCitiesRegistry,
  saveCitiesRegistry,
} from "@/agent/backend/cities-registry";
import { ensureAgentApiAccess } from "@/lib/security/agent-auth";

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

type ImageItemPayload = {
  fileName?: string;
  dataUrl?: string;
  prompt?: string;
  savedFile?: string;
  isActive?: boolean;
};

type GraphicSlotPayload = {
  fileName?: string;
  dataUrl?: string;
  savedFile?: string;
  isActive?: boolean;
  mime?: string;
};

type RequestBody = {
  cityId?: string;
  city?: {
    en?: string;
    de?: string;
    ru?: string;
    uk?: string;
  };
  landmark?: string;
  citySlug?: string;
  landmarkSlug?: string;
  content?: {
    ru?: string;
    en?: string;
    de?: string;
    uk?: string;
  };
  prompts?: Record<string, string | Record<string, string>>;
  postcardGraphics?: {
    stamp?: GraphicSlotPayload;
    illustrations?: {
      "2L"?: GraphicSlotPayload;
      "2R"?: GraphicSlotPayload;
      "4L"?: GraphicSlotPayload;
      "4R"?: GraphicSlotPayload;
    };
  };
  gallery?: {
    globalPrompt?: string;
    items?: ImageItemPayload[];
  };
  landmarkGeo?: {
    lat?: number | string | null;
    lng?: number | string | null;
    source?: string;
  };
  universal?: {
    workflowStatus?: "draft" | "review" | "published" | "archived";
    sections?: Array<{
      id?: string;
      type?: string;
      title?: string;
      visible?: boolean;
      styleVariant?: string;
      payload?: unknown;
    }>;
    envelopesByLocale?: Partial<
      Record<"ru" | "en" | "de" | "uk", Record<string, unknown>>
    >;
  };
};

type UniversalDraftSection = {
  id?: string;
  type?: string;
  payload?: unknown;
};

type UniversalDraftEnvelope = {
  schemaVersion?: unknown;
  moduleKey?: unknown;
  pageKind?: unknown;
  pageId?: unknown;
  slug?: unknown;
  locale?: unknown;
  translationGroupId?: unknown;
  meta?: unknown;
  hero?: unknown;
  sections?: unknown;
  navigation?: unknown;
  mediaRefs?: unknown;
  audit?: unknown;
};

type WorkflowStatus = "draft" | "review" | "published" | "archived";

const SUPPORTED_UNIVERSAL_WORKFLOW_STATUSES = new Set([
  "draft",
  "review",
  "published",
  "archived",
]);

const SUPPORTED_UNIVERSAL_SECTION_TYPES = new Set([
  "summary",
  "highlights",
  "postcard",
  "gallery",
  "facts",
  "links-grid",
  "cta",
]);

const SUPPORTED_META_STATUSES = new Set([
  "draft",
  "review",
  "published",
  "archived",
]);

const UNIVERSAL_LOCALES = ["ru", "en", "de", "uk"] as const;

const ALLOWED_WORKFLOW_TRANSITIONS: Record<
  WorkflowStatus,
  Set<WorkflowStatus>
> = {
  draft: new Set(["draft", "review"]),
  review: new Set(["review", "draft", "published"]),
  published: new Set(["published", "archived"]),
  archived: new Set(["archived"]),
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isSemVer = (value: string): boolean =>
  /^\d+\.\d+\.\d+$/.test(value.trim());

const normalizeWorkflowStatus = (value: unknown): WorkflowStatus => {
  if (
    value === "draft" ||
    value === "review" ||
    value === "published" ||
    value === "archived"
  ) {
    return value;
  }

  return "draft";
};

const isWorkflowTransitionAllowed = (
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean => {
  return ALLOWED_WORKFLOW_TRANSITIONS[from].has(to);
};

const validateUniversalSections = (
  sections: unknown,
  pathLabel: string,
): string | null => {
  if (!Array.isArray(sections)) {
    return `${pathLabel} должен быть массивом секций.`;
  }

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index] as UniversalDraftSection;
    const sectionPath = `${pathLabel}[${index}]`;

    if (!isObjectRecord(section)) {
      return `${sectionPath} должен быть объектом.`;
    }

    if (typeof section.id !== "string" || !section.id.trim()) {
      return `${sectionPath}.id обязателен и должен быть непустой строкой.`;
    }

    if (
      typeof section.type !== "string" ||
      !SUPPORTED_UNIVERSAL_SECTION_TYPES.has(section.type)
    ) {
      return `${sectionPath}.type должен быть одним из: summary, highlights, postcard, gallery, facts, links-grid, cta.`;
    }

    if (!isObjectRecord(section.payload)) {
      return `${sectionPath}.payload должен быть объектом.`;
    }

    if (section.type === "summary") {
      if (section.payload.kind !== "summary") {
        return `${sectionPath}.payload.kind должен быть равен "summary".`;
      }

      if (
        typeof section.payload.description !== "string" ||
        !section.payload.description.trim()
      ) {
        return `${sectionPath}.payload.description обязателен и должен быть непустой строкой.`;
      }
    }

    if (section.type === "highlights") {
      if (section.payload.kind !== "highlights") {
        return `${sectionPath}.payload.kind должен быть равен "highlights".`;
      }

      if (!Array.isArray(section.payload.items)) {
        return `${sectionPath}.payload.items обязателен и должен быть массивом.`;
      }

      for (
        let itemIndex = 0;
        itemIndex < section.payload.items.length;
        itemIndex += 1
      ) {
        if (typeof section.payload.items[itemIndex] !== "string") {
          return `${sectionPath}.payload.items[${itemIndex}] должен быть строкой.`;
        }
      }
    }

    if (section.type === "postcard") {
      if (section.payload.kind !== "postcard") {
        return `${sectionPath}.payload.kind должен быть равен "postcard".`;
      }

      const requiredPostcardFields = [
        "greeting",
        "footer",
        "contentFile",
        "stampImage",
      ];

      for (const field of requiredPostcardFields) {
        if (typeof section.payload[field] !== "string") {
          return `${sectionPath}.payload.${field} обязателен и должен быть строкой.`;
        }
      }

      const optionalPostcardFields = [
        "farewell",
        "invitation",
        "invitationBookLink",
      ];
      for (const field of optionalPostcardFields) {
        const value = section.payload[field];
        if (value !== undefined && typeof value !== "string") {
          return `${sectionPath}.payload.${field} должен быть строкой.`;
        }
      }
    }

    if (section.type === "gallery") {
      if (section.payload.kind !== "gallery") {
        return `${sectionPath}.payload.kind должен быть равен "gallery".`;
      }

      const items = section.payload.items;
      if (!Array.isArray(items)) {
        return `${sectionPath}.payload.items обязателен и должен быть массивом.`;
      }

      for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        const item = items[itemIndex];
        const itemPath = `${sectionPath}.payload.items[${itemIndex}]`;

        if (!isObjectRecord(item)) {
          return `${itemPath} должен быть объектом.`;
        }

        if (typeof item.src !== "string" || !item.src.trim()) {
          return `${itemPath}.src обязателен и должен быть непустой строкой.`;
        }

        if (item.alt !== undefined && typeof item.alt !== "string") {
          return `${itemPath}.alt должен быть строкой.`;
        }
      }
    }

    if (section.type === "facts") {
      if (section.payload.kind !== "facts") {
        return `${sectionPath}.payload.kind должен быть равен "facts".`;
      }

      if (!Array.isArray(section.payload.items)) {
        return `${sectionPath}.payload.items обязателен и должен быть массивом.`;
      }

      for (
        let itemIndex = 0;
        itemIndex < section.payload.items.length;
        itemIndex += 1
      ) {
        if (typeof section.payload.items[itemIndex] !== "string") {
          return `${sectionPath}.payload.items[${itemIndex}] должен быть строкой.`;
        }
      }
    }

    if (section.type === "links-grid") {
      if (section.payload.kind !== "links-grid") {
        return `${sectionPath}.payload.kind должен быть равен "links-grid".`;
      }

      if (
        typeof section.payload.title !== "string" ||
        !section.payload.title.trim()
      ) {
        return `${sectionPath}.payload.title обязателен и должен быть непустой строкой.`;
      }

      if (!Array.isArray(section.payload.items)) {
        return `${sectionPath}.payload.items обязателен и должен быть массивом.`;
      }

      for (
        let itemIndex = 0;
        itemIndex < section.payload.items.length;
        itemIndex += 1
      ) {
        const item = section.payload.items[itemIndex];
        const itemPath = `${sectionPath}.payload.items[${itemIndex}]`;

        if (!isObjectRecord(item)) {
          return `${itemPath} должен быть объектом.`;
        }

        if (typeof item.id !== "string" || !item.id.trim()) {
          return `${itemPath}.id обязателен и должен быть непустой строкой.`;
        }

        if (typeof item.title !== "string" || !item.title.trim()) {
          return `${itemPath}.title обязателен и должен быть непустой строкой.`;
        }

        if (typeof item.href !== "string" || !item.href.trim()) {
          return `${itemPath}.href обязателен и должен быть непустой строкой.`;
        }

        if (
          item.description !== undefined &&
          typeof item.description !== "string"
        ) {
          return `${itemPath}.description должен быть строкой.`;
        }

        if (item.image !== undefined && typeof item.image !== "string") {
          return `${itemPath}.image должен быть строкой.`;
        }
      }
    }

    if (section.type === "cta") {
      if (section.payload.kind !== "cta") {
        return `${sectionPath}.payload.kind должен быть равен "cta".`;
      }

      if (
        typeof section.payload.text !== "string" ||
        !section.payload.text.trim()
      ) {
        return `${sectionPath}.payload.text обязателен и должен быть непустой строкой.`;
      }
    }
  }

  return null;
};

const validateUniversalDraft = (
  universal: RequestBody["universal"],
): string | null => {
  if (!universal) return null;

  if (
    universal.workflowStatus &&
    !SUPPORTED_UNIVERSAL_WORKFLOW_STATUSES.has(universal.workflowStatus)
  ) {
    return "universal.workflowStatus должен быть одним из: draft, review, published, archived.";
  }

  if (universal.sections !== undefined) {
    const sectionsError = validateUniversalSections(
      universal.sections,
      "universal.sections",
    );
    if (sectionsError) return sectionsError;
  }

  if (universal.envelopesByLocale !== undefined) {
    if (!isObjectRecord(universal.envelopesByLocale)) {
      return "universal.envelopesByLocale должен быть объектом с локалями ru/en/de/uk.";
    }

    for (const locale of UNIVERSAL_LOCALES) {
      const envelope = universal.envelopesByLocale[locale] as
        | UniversalDraftEnvelope
        | undefined;
      if (envelope === undefined) continue;

      if (!isObjectRecord(envelope)) {
        return `universal.envelopesByLocale.${locale} должен быть объектом.`;
      }

      const envelopePath = `universal.envelopesByLocale.${locale}`;

      if (
        typeof envelope.schemaVersion !== "string" ||
        !isSemVer(envelope.schemaVersion)
      ) {
        return `${envelopePath}.schemaVersion обязателен и должен быть в формате SemVer (x.y.z).`;
      }

      if (envelope.moduleKey !== "landmarks") {
        return `${envelopePath}.moduleKey должен быть равен "landmarks".`;
      }

      if (envelope.pageKind !== "item") {
        return `${envelopePath}.pageKind должен быть равен "item".`;
      }

      if (envelope.locale !== locale) {
        return `${envelopePath}.locale должен совпадать с ключом локали (${locale}).`;
      }

      if (
        typeof envelope.translationGroupId !== "string" ||
        !envelope.translationGroupId.trim()
      ) {
        return `${envelopePath}.translationGroupId обязателен и должен быть непустой строкой.`;
      }

      if (!isObjectRecord(envelope.meta)) {
        return `${envelopePath}.meta обязателен и должен быть объектом.`;
      }

      if (
        typeof envelope.meta.title !== "string" ||
        !envelope.meta.title.trim()
      ) {
        return `${envelopePath}.meta.title обязателен и должен быть непустой строкой.`;
      }

      if (!Array.isArray(envelope.meta.tags)) {
        return `${envelopePath}.meta.tags обязателен и должен быть массивом.`;
      }

      if (
        typeof envelope.meta.status !== "string" ||
        !SUPPORTED_META_STATUSES.has(envelope.meta.status)
      ) {
        return `${envelopePath}.meta.status должен быть одним из: draft, review, published, archived.`;
      }

      if (envelope.hero !== undefined) {
        if (!isObjectRecord(envelope.hero)) {
          return `${envelopePath}.hero должен быть объектом.`;
        }

        const heroFields = ["title", "subtitle", "image"] as const;
        for (const field of heroFields) {
          const value = envelope.hero[field];
          if (value !== undefined && typeof value !== "string") {
            return `${envelopePath}.hero.${field} должен быть строкой.`;
          }
        }
      }

      if (!isObjectRecord(envelope.navigation)) {
        return `${envelopePath}.navigation обязателен и должен быть объектом.`;
      }

      if (!Array.isArray(envelope.navigation.childrenIds)) {
        return `${envelopePath}.navigation.childrenIds обязателен и должен быть массивом.`;
      }

      if (
        !envelope.navigation.childrenIds.every(
          (childId) => typeof childId === "string",
        )
      ) {
        return `${envelopePath}.navigation.childrenIds должен содержать только строки.`;
      }

      if (!isObjectRecord(envelope.mediaRefs)) {
        return `${envelopePath}.mediaRefs обязателен и должен быть объектом.`;
      }

      if (
        !Array.isArray(envelope.mediaRefs.hero) ||
        !Array.isArray(envelope.mediaRefs.sections)
      ) {
        return `${envelopePath}.mediaRefs.hero и mediaRefs.sections должны быть массивами.`;
      }

      if (
        !envelope.mediaRefs.hero.every((item) => typeof item === "string") ||
        !envelope.mediaRefs.sections.every((item) => typeof item === "string")
      ) {
        return `${envelopePath}.mediaRefs.hero и mediaRefs.sections должны содержать только строки.`;
      }

      if (!isObjectRecord(envelope.audit)) {
        return `${envelopePath}.audit обязателен и должен быть объектом.`;
      }

      const auditFields = ["createdAt", "updatedAt", "updatedBy"] as const;
      for (const field of auditFields) {
        const value = envelope.audit[field];
        if (typeof value !== "string" || !value.trim()) {
          return `${envelopePath}.audit.${field} обязателен и должен быть непустой строкой.`;
        }
      }

      if (envelope.sections !== undefined) {
        const envelopeSectionsError = validateUniversalSections(
          envelope.sections,
          `universal.envelopesByLocale.${locale}.sections`,
        );
        if (envelopeSectionsError) return envelopeSectionsError;
      }
    }
  }

  return null;
};

const parseOptionalCoordinate = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const decodeDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const buffer = new Uint8Array(Buffer.from(match[2], "base64"));
  const ext = mime.includes("jpeg")
    ? "jpg"
    : mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : "bin";
  return { buffer, ext, mime };
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const mergePromptValues = (existing: unknown, incoming: unknown): unknown => {
  if (incoming === undefined) return existing;
  if (!isObjectRecord(existing) || !isObjectRecord(incoming)) return incoming;
  return { ...existing, ...incoming };
};

const mergePromptsRecord = (
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> => {
  const keys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);
  const merged: Record<string, unknown> = {};

  keys.forEach((key) => {
    merged[key] = mergePromptValues(existing[key], incoming[key]);
  });

  return merged;
};

export async function GET(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city")?.trim() ?? "";
  const landmark = searchParams.get("landmark")?.trim() ?? "";
  const citySlug = normalizeSlug(searchParams.get("citySlug") ?? city);
  const landmarkSlug = normalizeSlug(
    searchParams.get("landmarkSlug") ?? landmark,
  );

  if (!citySlug || !landmarkSlug) {
    return NextResponse.json(
      {
        ok: false,
        message: "Не указан город или достопримечательность.",
      },
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
  const generatedManifestPath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    citySlug,
    landmarkSlug,
    "gallery.generated.json",
  );

  try {
    const content = await fs.readFile(dataPath, "utf8");
    const data = JSON.parse(content);

    let gallerySource: "generated" | "legacy" = "legacy";

    try {
      const manifestContent = await fs.readFile(generatedManifestPath, "utf8");
      const manifest = JSON.parse(manifestContent) as {
        items?: Array<{
          status?: "completed" | "waiting_manual" | "failed";
          outputPath?: string;
        }>;
      };

      const hasGeneratedImages = (manifest.items ?? []).some(
        (item) => item.status === "completed" && Boolean(item.outputPath),
      );

      if (hasGeneratedImages) {
        gallerySource = "generated";
      }
    } catch {
      gallerySource = "legacy";
    }

    return NextResponse.json({ ok: true, data, gallerySource });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "data.json не найден.",
      },
      { status: 404 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const body = (await request.json()) as RequestBody;
  const cityId = body.cityId?.trim() ?? "";
  const city = {
    en: body.city?.en?.trim() ?? "",
    de: body.city?.de?.trim() ?? "",
    ru: body.city?.ru?.trim() ?? "",
    uk: body.city?.uk?.trim() ?? "",
  };
  const landmark = body.landmark?.trim() ?? "";
  const citySlugFromBody = normalizeSlug(body.citySlug ?? city.en);
  const landmarkSlug = normalizeSlug(body.landmarkSlug ?? landmark);
  const landmarkGeoLat = parseOptionalCoordinate(body.landmarkGeo?.lat);
  const landmarkGeoLng = parseOptionalCoordinate(body.landmarkGeo?.lng);
  const hasLandmarkGeoInput =
    String(body.landmarkGeo?.lat ?? "").trim() !== "" ||
    String(body.landmarkGeo?.lng ?? "").trim() !== "";

  if (!landmark) {
    return NextResponse.json(
      { ok: false, message: "Не указана достопримечательность." },
      { status: 400 },
    );
  }

  if (
    hasLandmarkGeoInput &&
    (landmarkGeoLat === null || landmarkGeoLng === null)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Для геолокации достопримечательности укажите корректные значения lat и lng.",
      },
      { status: 400 },
    );
  }

  if (
    landmarkGeoLat !== null &&
    (landmarkGeoLat < -90 || landmarkGeoLat > 90)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Значение lat должно быть в диапазоне от -90 до 90.",
      },
      { status: 400 },
    );
  }

  if (
    landmarkGeoLng !== null &&
    (landmarkGeoLng < -180 || landmarkGeoLng > 180)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Значение lng должно быть в диапазоне от -180 до 180.",
      },
      { status: 400 },
    );
  }

  const universalValidationError = validateUniversalDraft(body.universal);
  if (universalValidationError) {
    return NextResponse.json(
      {
        ok: false,
        message: universalValidationError,
      },
      { status: 400 },
    );
  }

  const allCities = await loadCitiesRegistry();
  const cityById = cityId ? await findCityById(cityId) : null;
  const cityBySlug = !cityById
    ? (allCities.find((item) => item.slug === citySlugFromBody) ?? null)
    : null;
  const selectedCity = cityById ?? cityBySlug;

  if (!selectedCity) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Город не найден в реестре. Сначала создайте город через форму города.",
      },
      { status: 400 },
    );
  }

  if (cityId && citySlugFromBody && citySlugFromBody !== selectedCity.slug) {
    return NextResponse.json(
      {
        ok: false,
        message: "Поля cityId и citySlug указывают на разные города.",
      },
      { status: 400 },
    );
  }

  const citySlug = selectedCity.slug;
  const resolvedCityNames = {
    en: city.en || selectedCity.name?.en || selectedCity.city || "",
    de: city.de || selectedCity.name?.de || selectedCity.name?.en || "",
    ru: city.ru || selectedCity.name?.ru || selectedCity.name?.en || "",
    uk: city.uk || selectedCity.name?.uk || selectedCity.name?.en || "",
  };

  const baseDir = path.join(
    process.cwd(),
    "data",
    "landmarks",
    citySlug,
    landmarkSlug,
  );
  const existingDataPath = path.join(baseDir, "data.json");
  const imagesDir = path.join(baseDir, "images");
  const stampDir = path.join(baseDir, "stamp");
  const illustrationsDir = path.join(baseDir, "illustrations");

  await fs.mkdir(imagesDir, { recursive: true });
  await fs.mkdir(stampDir, { recursive: true });
  await fs.mkdir(illustrationsDir, { recursive: true });

  let existingJson: Record<string, unknown> = {};
  let previousWorkflowStatus: WorkflowStatus = "draft";
  try {
    const existingRaw = await fs.readFile(existingDataPath, "utf8");
    existingJson = asRecord(JSON.parse(existingRaw));
    previousWorkflowStatus = normalizeWorkflowStatus(
      asRecord(existingJson.universal).workflowStatus,
    );
  } catch {
    existingJson = {};
    previousWorkflowStatus = "draft";
  }

  const requestedWorkflowStatus = normalizeWorkflowStatus(
    body.universal?.workflowStatus,
  );

  if (
    body.universal &&
    !isWorkflowTransitionAllowed(
      previousWorkflowStatus,
      requestedWorkflowStatus,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: `Недопустимый переход статуса: ${previousWorkflowStatus} -> ${requestedWorkflowStatus}.`,
      },
      { status: 400 },
    );
  }

  const saveGraphicSlot = async (
    slot: GraphicSlotPayload | undefined,
    outputDir: string,
    outputFileName: string,
  ) => {
    if (!slot?.dataUrl) {
      if (slot?.isActive && slot.savedFile) {
        return {
          isActive: true,
          fileName: slot.fileName ?? "",
          savedFile: slot.savedFile,
          mime: slot.mime ?? "",
        };
      }

      return {
        isActive: false,
        fileName: "",
        savedFile: "",
        mime: "",
      };
    }

    const decoded = decodeDataUrl(slot.dataUrl);
    if (!decoded) {
      return {
        isActive: false,
        fileName: slot.fileName ?? "",
        savedFile: "",
        mime: "",
      };
    }

    const fileName = `${outputFileName}.${decoded.ext}`;
    await fs.writeFile(path.join(outputDir, fileName), decoded.buffer);

    return {
      isActive: true,
      fileName: slot.fileName ?? "",
      savedFile: path
        .relative(baseDir, path.join(outputDir, fileName))
        .split(path.sep)
        .join("/"),
      mime: decoded.mime,
    };
  };

  const existingContent = asRecord(existingJson.content);
  const existingPrompts = asRecord(existingJson.prompts);
  const existingPostcardGraphics = asRecord(existingJson.postcardGraphics);
  const existingIllustrations = asRecord(
    existingPostcardGraphics.illustrations,
  );
  const existingGallery = asRecord(existingJson.gallery);
  const existingUniversal = asRecord(existingJson.universal);

  const hasIncomingGalleryItems = Array.isArray(body.gallery?.items);
  const incomingGalleryItems = hasIncomingGalleryItems
    ? body.gallery!.items!
    : [];

  const savedImages = hasIncomingGalleryItems
    ? await Promise.all(
        incomingGalleryItems.map(async (item, index) => {
          if (!item?.dataUrl) {
            if (item?.isActive && item.savedFile) {
              return {
                index,
                isActive: true,
                fileName: item.fileName,
                savedFile: item.savedFile,
                prompt: item?.prompt,
              };
            }

            return {
              index,
              isActive: false,
              fileName: item?.fileName,
              prompt: item?.prompt,
            };
          }

          const decoded = decodeDataUrl(item.dataUrl);
          if (!decoded) {
            return {
              index,
              fileName: item?.fileName,
              prompt: item?.prompt,
            };
          }

          const fileName = `image-${String(index + 1).padStart(2, "0")}.${decoded.ext}`;
          const filePath = path.join(imagesDir, fileName);
          await fs.writeFile(filePath, decoded.buffer);

          return {
            index,
            isActive: true,
            fileName: item?.fileName,
            savedFile: path.join("images", fileName).split(path.sep).join("/"),
            prompt: item?.prompt,
            mime: decoded.mime,
          };
        }),
      )
    : Array.isArray(existingGallery.items)
      ? existingGallery.items
      : [];

  const stamp = await saveGraphicSlot(
    body.postcardGraphics?.stamp ??
      (asRecord(existingPostcardGraphics.stamp) as GraphicSlotPayload),
    stampDir,
    "stamp",
  );

  const illustration2L = await saveGraphicSlot(
    body.postcardGraphics?.illustrations?.["2L"] ??
      (asRecord(existingIllustrations["2L"]) as GraphicSlotPayload),
    illustrationsDir,
    "2l",
  );
  const illustration2R = await saveGraphicSlot(
    body.postcardGraphics?.illustrations?.["2R"] ??
      (asRecord(existingIllustrations["2R"]) as GraphicSlotPayload),
    illustrationsDir,
    "2r",
  );
  const illustration4L = await saveGraphicSlot(
    body.postcardGraphics?.illustrations?.["4L"] ??
      (asRecord(existingIllustrations["4L"]) as GraphicSlotPayload),
    illustrationsDir,
    "4l",
  );
  const illustration4R = await saveGraphicSlot(
    body.postcardGraphics?.illustrations?.["4R"] ??
      (asRecord(existingIllustrations["4R"]) as GraphicSlotPayload),
    illustrationsDir,
    "4r",
  );

  const alias = `${citySlug}-${landmarkSlug}`;

  const universalDraft = body.universal
    ? (() => {
        const nowIso = new Date().toISOString();
        const shouldUpdateAudit =
          requestedWorkflowStatus === "published" ||
          requestedWorkflowStatus === "archived";

        const envelopesByLocale =
          body.universal.envelopesByLocale &&
          typeof body.universal.envelopesByLocale === "object"
            ? Object.fromEntries(
                Object.entries(body.universal.envelopesByLocale).map(
                  ([locale, envelope]) => {
                    if (!isObjectRecord(envelope)) {
                      return [locale, envelope];
                    }

                    const nextEnvelope = {
                      ...envelope,
                    } as Record<string, unknown>;

                    const meta = isObjectRecord(nextEnvelope.meta)
                      ? { ...nextEnvelope.meta }
                      : {};
                    meta.status = requestedWorkflowStatus;
                    nextEnvelope.meta = meta;

                    if (shouldUpdateAudit) {
                      const audit = isObjectRecord(nextEnvelope.audit)
                        ? { ...nextEnvelope.audit }
                        : {};
                      audit.updatedAt = nowIso;
                      audit.updatedBy = "agent-form";
                      nextEnvelope.audit = audit;
                    }

                    return [locale, nextEnvelope];
                  },
                ),
              )
            : undefined;

        return {
          workflowStatus: requestedWorkflowStatus,
          sections: Array.isArray(body.universal.sections)
            ? body.universal.sections
            : [],
          envelopesByLocale,
        };
      })()
    : undefined;

  const mergedPrompts = mergePromptsRecord(
    existingPrompts,
    asRecord(body.prompts),
  );

  const dataPayload = {
    ...existingJson,
    meta: {
      ...asRecord(existingJson.meta),
      cityId: selectedCity.cityId,
      city: resolvedCityNames,
      landmark,
      citySlug,
      landmarkSlug,
      alias,
      landmarkGeo:
        landmarkGeoLat !== null && landmarkGeoLng !== null
          ? {
              lat: landmarkGeoLat,
              lng: landmarkGeoLng,
              source: body.landmarkGeo?.source?.trim() || "manual",
            }
          : undefined,
      updatedAt: new Date().toISOString(),
    },
    content: {
      ru:
        body.content?.ru ??
        (typeof existingContent.ru === "string" ? existingContent.ru : ""),
      en:
        body.content?.en ??
        (typeof existingContent.en === "string" ? existingContent.en : ""),
      de:
        body.content?.de ??
        (typeof existingContent.de === "string" ? existingContent.de : ""),
      uk:
        body.content?.uk ??
        (typeof existingContent.uk === "string" ? existingContent.uk : ""),
    },
    prompts: mergedPrompts,
    postcardGraphics: {
      stamp,
      illustrations: {
        "2L": illustration2L,
        "2R": illustration2R,
        "4L": illustration4L,
        "4R": illustration4R,
      },
    },
    gallery: {
      ...existingGallery,
      globalPrompt:
        body.gallery?.globalPrompt ??
        (typeof existingGallery.globalPrompt === "string"
          ? existingGallery.globalPrompt
          : ""),
      items: savedImages,
    },
    universal:
      universalDraft ??
      (Object.keys(existingUniversal).length > 0
        ? existingUniversal
        : undefined),
  };

  await fs.writeFile(
    path.join(baseDir, "data.json"),
    JSON.stringify(dataPayload, null, 2),
  );

  const cityEntryIndex = allCities.findIndex(
    (item) => item.cityId === selectedCity.cityId,
  );
  if (cityEntryIndex >= 0) {
    const cityEntry = allCities[cityEntryIndex];
    if (!cityEntry.landmarks.some((item) => item.slug === landmarkSlug)) {
      cityEntry.landmarks.push({ name: landmark, slug: landmarkSlug });
      cityEntry.updatedAt = new Date().toISOString();
      allCities[cityEntryIndex] = cityEntry;
    }
  }

  await saveCitiesRegistry(allCities);

  return NextResponse.json({ ok: true, data: dataPayload });
}
