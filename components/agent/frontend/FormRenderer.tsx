"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentFormSchema } from "../backend/core/schema";
import citiesIndex from "../../../data/cities.json";
import { ImageBlock } from "@/components/agent/frontend/ImageBlock";
import PostcardLayout from "@/components/modules/landmarks/PostcardLayout/PostcardLayout";
import {
  adaptLandmarksCollectionHomeToEnvelope,
  adaptLandmarksItemToEnvelope,
  adaptLandmarksModuleHomeToEnvelope,
} from "@/lib/universal-page-template/landmarks-adapters";
import type {
  UniversalPageEnvelope,
  UniversalSection,
} from "@/lib/universal-page-template/types";

type FormRendererProps = {
  schema: AgentFormSchema | null;
  onSubmit: (
    values: Record<string, unknown>,
    options?: { runAfterSave?: boolean },
  ) => Promise<boolean> | boolean;
  onRunOrchestrator?: (input: {
    mode: "data" | "rules";
    city: string;
    landmark: string;
  }) => void;
  lastOrchestratorTarget?: {
    city: string;
    landmark: string;
  } | null;
  autoRunAfterSave?: boolean;
  onToggleAutoRun?: (value: boolean) => void;
  saveStatus: "idle" | "saving" | "success" | "error";
  statusMessage: string;
  orchestratorStatus?: "idle" | "running" | "success" | "error";
  orchestratorMessage?: string;
  isSubmitting: boolean;
  fieldErrors: string[];
};

type ImageSlotState = {
  file?: File;
  fileName?: string;
  dataUrl?: string;
  prompt?: string;
  savedFile?: string;
  isActive?: boolean;
  mime?: string;
};

type ImageBlockState = {
  globalPrompt: string;
  items: ImageSlotState[];
};

type GraphicSlotState = {
  file?: File;
  fileName?: string;
  dataUrl?: string;
  savedFile?: string;
  isActive?: boolean;
  mime?: string;
};

type PostcardGraphicsState = {
  stamp: GraphicSlotState;
  illustrations: {
    "2L": GraphicSlotState;
    "2R": GraphicSlotState;
    "4L": GraphicSlotState;
    "4R": GraphicSlotState;
  };
};

type SectionDraftType =
  | "summary"
  | "highlights"
  | "gallery"
  | "facts"
  | "links-grid"
  | "cta"
  | "postcard";

type SectionDraftItem = {
  id: string;
  type: SectionDraftType;
  visible: boolean;
};

type HeroDraftState = {
  image: string;
  title: Record<"ru" | "en" | "de" | "uk", string>;
  subtitle: Record<"ru" | "en" | "de" | "uk", string>;
};

type WorkflowStatus = "draft" | "review" | "published" | "archived";

type PreviewPageKind = "item" | "collection-home" | "module-home";

const CONTENT_FIELD_IDS = ["contentRu", "contentEn", "contentDe", "contentUk"];
const SMALL_FIELD_IDS = [
  "greetingRu",
  "greetingEn",
  "greetingDe",
  "greetingUk",
  "footerRu",
  "bookInviteRu",
  "bookLinkRu",
  "footerEn",
  "bookInviteEn",
  "bookLinkEn",
  "footerDe",
  "bookInviteDe",
  "bookLinkDe",
  "footerUk",
  "bookInviteUk",
  "bookLinkUk",
];

const OPTIONAL_SMALL_FIELD_IDS = new Set(SMALL_FIELD_IDS);

const SMALL_FIELD_LOCALES = [
  { code: "ru", suffix: "Ru", label: "Русский (ru)" },
  { code: "en", suffix: "En", label: "English (en)" },
  { code: "de", suffix: "De", label: "Deutsch (de)" },
  { code: "uk", suffix: "Uk", label: "Українська (uk)" },
] as const;

const SMALL_FIELD_ORDER: Array<
  "greeting" | "footer" | "bookInvite" | "bookLink"
> = ["greeting", "footer", "bookInvite", "bookLink"];

const getSmallFieldRank = (id: string): number => {
  const index = SMALL_FIELD_ORDER.findIndex((prefix) => id.startsWith(prefix));
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const PROMPT_DEFAULTS = {
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

const readLocalizedPrompt = (
  value: unknown,
  lang: "ru" | "en" | "de" | "uk",
): string => {
  if (typeof value === "string") {
    return lang === "ru" ? value : "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Partial<Record<"ru" | "en" | "de" | "uk", unknown>>;
  const localized = record[lang];
  return typeof localized === "string" ? localized : "";
};

const getPromptDefaultByFieldId = (fieldId: string): string => {
  switch (fieldId) {
    case "greetingRu":
      return PROMPT_DEFAULTS.greeting.ru;
    case "greetingEn":
      return PROMPT_DEFAULTS.greeting.en;
    case "greetingDe":
      return PROMPT_DEFAULTS.greeting.de;
    case "greetingUk":
      return PROMPT_DEFAULTS.greeting.uk;
    case "footerRu":
      return PROMPT_DEFAULTS.footer.ru;
    case "footerEn":
      return PROMPT_DEFAULTS.footer.en;
    case "footerDe":
      return PROMPT_DEFAULTS.footer.de;
    case "footerUk":
      return PROMPT_DEFAULTS.footer.uk;
    default:
      return "";
  }
};

const IMAGE_SLOTS_COUNT = 8;

const DEFAULT_SECTION_DRAFT: SectionDraftItem[] = [
  { id: "summary-main", type: "summary", visible: true },
  { id: "highlights-main", type: "highlights", visible: true },
  { id: "postcard-main", type: "postcard", visible: true },
  { id: "gallery-main", type: "gallery", visible: true },
  { id: "facts-main", type: "facts", visible: true },
  { id: "links-grid-main", type: "links-grid", visible: true },
  { id: "cta-main", type: "cta", visible: true },
];

const DEFAULT_HERO_DRAFT: HeroDraftState = {
  image: "",
  title: { ru: "", en: "", de: "", uk: "" },
  subtitle: { ru: "", en: "", de: "", uk: "" },
};

const WORKFLOW_STATUS_OPTIONS: Array<{
  value: WorkflowStatus;
  label: string;
}> = [
  { value: "draft", label: "draft" },
  { value: "review", label: "review" },
  { value: "published", label: "published" },
  { value: "archived", label: "archived" },
];

const PREVIEW_PAGE_KIND_OPTIONS: Array<{
  value: PreviewPageKind;
  label: string;
}> = [
  { value: "item", label: "item" },
  { value: "collection-home", label: "collection-home" },
  { value: "module-home", label: "module-home" },
];

function PreviewUniversalSections({
  envelope,
}: {
  envelope: UniversalPageEnvelope;
}) {
  return (
    <>
      {envelope.sections
        .filter((section) => section.visible)
        .map((section) => (
          <PreviewSectionView key={section.id} section={section} />
        ))}
    </>
  );
}

function PreviewSectionView({ section }: { section: UniversalSection }) {
  if (section.payload.kind === "summary") {
    return (
      <section className="city-zone-2">
        <div className="city-zone-2-header">
          {section.payload.title && <h2>{section.payload.title}</h2>}
          {section.payload.subtitle && (
            <p className="city-zone-2-subtitle">{section.payload.subtitle}</p>
          )}
        </div>
        <p className="city-zone-2-description">{section.payload.description}</p>
      </section>
    );
  }

  if (section.payload.kind === "highlights") {
    if (section.payload.items.length === 0) return null;
    return (
      <section className="city-zone-2">
        <ul className="city-zone-2-highlights">
          {section.payload.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (section.payload.kind === "cta") {
    return (
      <section className="city-zone-2">
        <p className="city-zone-2-note">{section.payload.text}</p>
      </section>
    );
  }

  if (section.payload.kind === "links-grid") {
    return (
      <section className="city-zone-3">
        <h3>{section.payload.title}</h3>
        <div className="city-landmarks-gallery">
          {section.payload.items.map((item) => (
            <a key={item.id} className="landmark-card" href={item.href}>
              {item.image && (
                <div className="landmark-card-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="landmark-card-image"
                  />
                </div>
              )}

              <div className="landmark-card-content">
                <h4>{item.title}</h4>
                {item.description && (
                  <p className="landmark-card-muted">{item.description}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  }

  return null;
}

function PreviewItemSections({
  envelope,
  gallerySource,
}: {
  envelope: UniversalPageEnvelope;
  gallerySource: "generated" | "legacy";
}) {
  const postcardSection = envelope.sections.find(
    (section) => section.payload.kind === "postcard",
  );
  const summarySection = envelope.sections.find(
    (section) => section.payload.kind === "summary",
  );
  const factsSection = envelope.sections.find(
    (section) => section.payload.kind === "facts",
  );
  const gallerySection = envelope.sections.find(
    (section) => section.payload.kind === "gallery",
  );

  if (!postcardSection || postcardSection.payload.kind !== "postcard") {
    return null;
  }

  const galleryItems =
    gallerySection && gallerySection.payload.kind === "gallery"
      ? gallerySection.payload.items
      : [];

  return (
    <>
      <PostcardLayout
        view={{
          greeting: postcardSection.payload.greeting,
          stampImage: postcardSection.payload.stampImage,
          contentFile: postcardSection.payload.contentFile,
          footer: postcardSection.payload.footer,
          invitation:
            postcardSection.payload.invitation ||
            (postcardSection.payload as Record<string, unknown>).bookInvite ||
            "",
          invitationBookLink:
            postcardSection.payload.invitationBookLink ||
            (postcardSection.payload as Record<string, unknown>).bookLink ||
            "",
        }}
        greeting={postcardSection.payload.greeting}
        stampImage={postcardSection.payload.stampImage}
        contentFile={postcardSection.payload.contentFile}
        farewell={postcardSection.payload.footer}
        invitation={
          postcardSection.payload.invitation ||
          (postcardSection.payload as Record<string, unknown>).bookInvite ||
          ""
        }
        invitationBookLink={
          postcardSection.payload.invitationBookLink ||
          (postcardSection.payload as Record<string, unknown>).bookLink ||
          ""
        }
        gallery={galleryItems}
        gallerySource={gallerySource}
        style={null}
      />

      {summarySection?.payload.kind === "summary" && (
        <section className="city-zone-2">
          <div className="city-zone-2-header">
            {summarySection.payload.title && (
              <h2>{summarySection.payload.title}</h2>
            )}
            {summarySection.payload.subtitle && (
              <p className="city-zone-2-subtitle">
                {summarySection.payload.subtitle}
              </p>
            )}
          </div>
          <p className="city-zone-2-description">
            {summarySection.payload.description}
          </p>
        </section>
      )}

      {factsSection?.payload.kind === "facts" &&
        factsSection.payload.items.length > 0 && (
          <section className="city-zone-2">
            <ul className="city-zone-2-highlights">
              {factsSection.payload.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
    </>
  );
}

type CityIndexItem = {
  city?: string;
  slug?: string;
  name?: Partial<Record<"en" | "de" | "ru" | "uk", string>>;
  landmarks?: Array<{ name?: string; slug?: string }>;
};

type LandmarkOption = { name: string; slug: string };

type CityOptionRecord = {
  city: string;
  slug: string;
  names: Partial<Record<"en" | "de" | "ru" | "uk", string>>;
  landmarks: LandmarkOption[];
};

type LandmarkGeo = {
  lat?: number;
  lng?: number;
  source?: string;
};

type UniversalEnvelopeSection = {
  type?: string;
  payload?: unknown;
};

type UniversalEnvelope = {
  hero?: {
    title?: unknown;
    subtitle?: unknown;
    image?: unknown;
  };
  sections?: UniversalEnvelopeSection[];
};

const normalizeLookup = (value: string) => value.trim().toLowerCase();

const cityRecords = (citiesIndex as CityIndexItem[])
  .map<CityOptionRecord | null>((item) => {
    if (typeof item?.city !== "string" || typeof item?.slug !== "string") {
      return null;
    }

    const landmarks = Array.isArray(item.landmarks)
      ? item.landmarks
          .filter(
            (landmark): landmark is { name: string; slug: string } =>
              typeof landmark?.name === "string" &&
              typeof landmark?.slug === "string",
          )
          .map((landmark) => ({ name: landmark.name, slug: landmark.slug }))
      : [];

    return {
      city: item.city,
      slug: item.slug,
      names: item.name ?? {},
      landmarks,
    };
  })
  .filter((item): item is CityOptionRecord => Boolean(item));

const cityRegistryOptions = cityRecords.map((item) => ({
  slug: item.slug,
  label: item.names.en ?? item.city,
  de: item.names.de ?? "",
  ru: item.names.ru ?? "",
  uk: item.names.uk ?? "",
}));

const cityBySlug = cityRecords.reduce<Map<string, CityOptionRecord>>(
  (acc, item) => {
    acc.set(item.slug, item);
    return acc;
  },
  new Map(),
);

const allLandmarkOptions = Array.from(
  cityRecords
    .flatMap((item) => item.landmarks)
    .reduce<Map<string, LandmarkOption>>((acc, landmark) => {
      const key = `${normalizeLookup(landmark.name)}::${normalizeLookup(landmark.slug)}`;
      if (!acc.has(key)) {
        acc.set(key, landmark);
      }
      return acc;
    }, new Map())
    .values(),
);

const cityLookup = cityRecords.reduce<Map<string, CityOptionRecord>>(
  (acc, item) => {
    const aliases = [
      item.city,
      item.slug,
      item.names.en,
      item.names.de,
      item.names.ru,
      item.names.uk,
    ].filter((value): value is string => typeof value === "string");

    aliases.forEach((alias) => {
      const key = normalizeLookup(alias);
      if (key && !acc.has(key)) {
        acc.set(key, item);
      }
    });

    return acc;
  },
  new Map(),
);

const graphicSlots = [
  { id: "2L" as const, label: "Графический блок 2L (абзац 2, слева)" },
  { id: "2R" as const, label: "Графический блок 2R (абзац 2, справа)" },
  { id: "4L" as const, label: "Графический блок 4L (абзац 4, слева)" },
  { id: "4R" as const, label: "Графический блок 4R (абзац 4, справа)" },
];

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const getEnvelopeSectionPayload = (
  envelope: UniversalEnvelope | undefined,
  sectionType: string,
): Record<string, unknown> | null => {
  if (!envelope || !Array.isArray(envelope.sections)) return null;

  const section = envelope.sections.find((item) => item?.type === sectionType);
  if (!section || !section.payload || typeof section.payload !== "object") {
    return null;
  }

  return section.payload as Record<string, unknown>;
};

const getStringField = (
  payload: Record<string, unknown> | null,
  key: string,
): string => {
  if (!payload) return "";
  const value = payload[key];
  return typeof value === "string" ? value : "";
};

const getFirstStringField = (
  payload: Record<string, unknown> | null,
  keys: string[],
): string => {
  for (const key of keys) {
    const value = getStringField(payload, key);
    if (value) return value;
  }
  return "";
};

const getGalleryItemsFromEnvelope = (
  envelope: UniversalEnvelope | undefined,
): Array<{ src: string; alt?: string }> => {
  const galleryPayload = getEnvelopeSectionPayload(envelope, "gallery");
  if (!galleryPayload) return [];

  const items = galleryPayload.items;
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        src: typeof record.src === "string" ? record.src : "",
        alt: typeof record.alt === "string" ? record.alt : "",
      };
    })
    .filter((item) => item.src);
};

const toSavedFileFromSrc = (src: string): string => {
  if (!src) return "";
  const clean = src.split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);
  return segments.at(-1) ?? "";
};

export function FormRenderer({
  schema,
  onSubmit,
  onRunOrchestrator,
  autoRunAfterSave = false,
  onToggleAutoRun,
  saveStatus,
  statusMessage,
  orchestratorStatus = "idle",
  orchestratorMessage = "",
  isSubmitting,
  fieldErrors,
  lastOrchestratorTarget,
}: FormRendererProps) {
  const initialTextState = useMemo(() => {
    if (!schema) return {};
    return schema.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.id] = "";
      return acc;
    }, {});
  }, [schema]);

  const [textValues, setTextValues] =
    useState<Record<string, string>>(initialTextState);
  const [cityEn, setCityEn] = useState("");
  const [cityDe, setCityDe] = useState("");
  const [cityRu, setCityRu] = useState("");
  const [cityUk, setCityUk] = useState("");
  const [selectedCityRegistrySlug, setSelectedCityRegistrySlug] = useState("");
  const [landmark, setLandmark] = useState("");
  const [landmarkGeoLat, setLandmarkGeoLat] = useState("");
  const [landmarkGeoLng, setLandmarkGeoLng] = useState("");
  const [postcardGraphics, setPostcardGraphics] =
    useState<PostcardGraphicsState>({
      stamp: {},
      illustrations: {
        "2L": {},
        "2R": {},
        "4L": {},
        "4R": {},
      },
    });
  const [imageState, setImageState] = useState<ImageBlockState>({
    globalPrompt: "",
    items: Array.from({ length: IMAGE_SLOTS_COUNT }, () => ({})),
  });
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [loadMessage, setLoadMessage] = useState("");
  const [gallerySource, setGallerySource] = useState<
    "generated" | "legacy" | null
  >(null);
  const [sectionDraft, setSectionDraft] = useState<SectionDraftItem[]>(
    DEFAULT_SECTION_DRAFT,
  );
  const [heroDraft, setHeroDraft] =
    useState<HeroDraftState>(DEFAULT_HERO_DRAFT);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("draft");
  const [previewLocale, setPreviewLocale] = useState<"ru" | "en" | "de" | "uk">(
    "ru",
  );
  const [previewPageKind, setPreviewPageKind] =
    useState<PreviewPageKind>("item");
  const lastLoadedKeyRef = useRef<string>("");

  useEffect(() => {
    setTextValues(initialTextState);
  }, [initialTextState]);

  const resetMediaAndContent = () => {
    setTextValues(initialTextState);
    setLandmarkGeoLat("");
    setLandmarkGeoLng("");
    setPostcardGraphics({
      stamp: {},
      illustrations: {
        "2L": {},
        "2R": {},
        "4L": {},
        "4R": {},
      },
    });
    setImageState({
      globalPrompt: "",
      items: Array.from({ length: IMAGE_SLOTS_COUNT }, () => ({})),
    });
    setSectionDraft(DEFAULT_SECTION_DRAFT);
    setHeroDraft(DEFAULT_HERO_DRAFT);
    setWorkflowStatus("draft");
    setGallerySource(null);
  };

  const selectedCity =
    cityBySlug.get(selectedCityRegistrySlug) ??
    cityLookup.get(normalizeLookup(cityEn));
  const landmarkOptions = selectedCity?.landmarks ?? allLandmarkOptions;
  const selectedCitySlug = selectedCity?.slug ?? normalizeSlug(cityEn);
  const selectedLandmarkSlug =
    landmarkOptions.find(
      (item) => item.name.toLowerCase() === landmark.toLowerCase(),
    )?.slug ??
    allLandmarkOptions.find(
      (item) => item.name.toLowerCase() === landmark.toLowerCase(),
    )?.slug ??
    normalizeSlug(landmark);

  useEffect(() => {
    if (!selectedCitySlug || !selectedLandmarkSlug) {
      lastLoadedKeyRef.current = "";
      return;
    }

    const key = `${selectedCitySlug}/${selectedLandmarkSlug}`;
    if (lastLoadedKeyRef.current === key) {
      return;
    }

    let isCancelled = false;

    const loadExisting = async () => {
      setLoadStatus("loading");
      setLoadMessage("Загружаем существующие данные…");

      try {
        const response = await fetch(
          `/api/agent/landmark?citySlug=${encodeURIComponent(selectedCitySlug)}&landmarkSlug=${encodeURIComponent(selectedLandmarkSlug)}`,
        );

        if (response.status === 404) {
          if (isCancelled) return;
          lastLoadedKeyRef.current = key;
          setLoadStatus("idle");
          setLoadMessage("");
          resetMediaAndContent();
          return;
        }

        if (!response.ok) {
          throw new Error("load_failed");
        }

        const result = (await response.json()) as {
          gallerySource?: "generated" | "legacy";
          data?: {
            meta?: {
              city?: { en?: string; de?: string; ru?: string; uk?: string };
              citySlug?: string;
              landmark?: string;
              landmarkGeo?: LandmarkGeo;
            };
            content?: { ru?: string; en?: string; de?: string; uk?: string };
            prompts?: {
              greeting?: unknown;
              footer?: unknown;
              invitation?: unknown;
              invitationBookLink?: unknown;
              bookInvite?: unknown;
              bookLink?: unknown;
            };
            universal?: {
              workflowStatus?: "draft" | "review" | "published" | "archived";
              sections?: Array<{
                id?: string;
                type?: string;
                visible?: boolean;
              }>;
              envelopesByLocale?: Partial<
                Record<"ru" | "en" | "de" | "uk", UniversalEnvelope>
              >;
            };
            postcardGraphics?: {
              stamp?: GraphicSlotState;
              illustrations?: Record<
                "2L" | "2R" | "4L" | "4R",
                GraphicSlotState
              >;
            };
            gallery?: {
              globalPrompt?: string;
              items?: ImageSlotState[];
            };
          };
        };

        if (isCancelled) return;

        const payload = result.data;
        if (!payload) {
          throw new Error("empty_payload");
        }

        const loadedWorkflowStatus =
          payload.universal?.workflowStatus === "draft" ||
          payload.universal?.workflowStatus === "review" ||
          payload.universal?.workflowStatus === "published" ||
          payload.universal?.workflowStatus === "archived"
            ? payload.universal.workflowStatus
            : "draft";

        setWorkflowStatus(loadedWorkflowStatus);

        setGallerySource(
          result.gallerySource === "generated" ? "generated" : "legacy",
        );

        const universalByLocale = payload.universal?.envelopesByLocale;
        const ruEnvelope = universalByLocale?.ru;
        const enEnvelope = universalByLocale?.en;
        const deEnvelope = universalByLocale?.de;
        const ukEnvelope = universalByLocale?.uk;

        const heroImageCandidate = [
          ruEnvelope?.hero?.image,
          enEnvelope?.hero?.image,
          deEnvelope?.hero?.image,
          ukEnvelope?.hero?.image,
        ].find((value) => typeof value === "string" && value.trim()) as
          | string
          | undefined;

        setHeroDraft({
          image: heroImageCandidate ?? "",
          title: {
            ru:
              (typeof ruEnvelope?.hero?.title === "string"
                ? ruEnvelope.hero.title
                : "") || "",
            en:
              (typeof enEnvelope?.hero?.title === "string"
                ? enEnvelope.hero.title
                : "") || "",
            de:
              (typeof deEnvelope?.hero?.title === "string"
                ? deEnvelope.hero.title
                : "") || "",
            uk:
              (typeof ukEnvelope?.hero?.title === "string"
                ? ukEnvelope.hero.title
                : "") || "",
          },
          subtitle: {
            ru:
              (typeof ruEnvelope?.hero?.subtitle === "string"
                ? ruEnvelope.hero.subtitle
                : "") || "",
            en:
              (typeof enEnvelope?.hero?.subtitle === "string"
                ? enEnvelope.hero.subtitle
                : "") || "",
            de:
              (typeof deEnvelope?.hero?.subtitle === "string"
                ? deEnvelope.hero.subtitle
                : "") || "",
            uk:
              (typeof ukEnvelope?.hero?.subtitle === "string"
                ? ukEnvelope.hero.subtitle
                : "") || "",
          },
        });

        const sectionSource =
          ruEnvelope?.sections && ruEnvelope.sections.length > 0
            ? ruEnvelope.sections
            : Array.isArray(payload.universal?.sections)
              ? payload.universal?.sections
              : [];

        const parsedSectionDraft = sectionSource
          .map((section, index) => {
            const sectionType =
              section?.type === "summary" ||
              section?.type === "highlights" ||
              section?.type === "postcard" ||
              section?.type === "gallery" ||
              section?.type === "facts" ||
              section?.type === "links-grid" ||
              section?.type === "cta"
                ? section.type
                : null;

            if (!sectionType) return null;

            return {
              id:
                typeof section.id === "string" && section.id.trim()
                  ? section.id
                  : `${sectionType}-${index + 1}`,
              type: sectionType,
              visible: section.visible !== false,
            } as SectionDraftItem;
          })
          .filter((item): item is SectionDraftItem => Boolean(item));

        setSectionDraft(
          parsedSectionDraft.length > 0
            ? parsedSectionDraft
            : DEFAULT_SECTION_DRAFT,
        );

        const ruSummaryPayload = getEnvelopeSectionPayload(
          ruEnvelope,
          "summary",
        );
        const enSummaryPayload = getEnvelopeSectionPayload(
          enEnvelope,
          "summary",
        );
        const deSummaryPayload = getEnvelopeSectionPayload(
          deEnvelope,
          "summary",
        );
        const ukSummaryPayload = getEnvelopeSectionPayload(
          ukEnvelope,
          "summary",
        );

        const ruPostcardPayload = getEnvelopeSectionPayload(
          ruEnvelope,
          "postcard",
        );
        const enPostcardPayload = getEnvelopeSectionPayload(
          enEnvelope,
          "postcard",
        );
        const dePostcardPayload = getEnvelopeSectionPayload(
          deEnvelope,
          "postcard",
        );
        const ukPostcardPayload = getEnvelopeSectionPayload(
          ukEnvelope,
          "postcard",
        );

        const universalGalleryItemsCandidates = [
          getGalleryItemsFromEnvelope(ruEnvelope),
          getGalleryItemsFromEnvelope(enEnvelope),
          getGalleryItemsFromEnvelope(deEnvelope),
          getGalleryItemsFromEnvelope(ukEnvelope),
        ];
        const universalGalleryItems =
          universalGalleryItemsCandidates.find((items) => items.length > 0) ??
          [];

        setCityEn(payload.meta?.city?.en ?? cityEn);
        setCityDe(payload.meta?.city?.de ?? "");
        setCityRu(payload.meta?.city?.ru ?? "");
        setCityUk(payload.meta?.city?.uk ?? "");
        setSelectedCityRegistrySlug(payload.meta?.citySlug ?? "");
        setLandmark(payload.meta?.landmark ?? landmark);
        setLandmarkGeoLat(
          typeof payload.meta?.landmarkGeo?.lat === "number"
            ? String(payload.meta.landmarkGeo.lat)
            : "",
        );
        setLandmarkGeoLng(
          typeof payload.meta?.landmarkGeo?.lng === "number"
            ? String(payload.meta.landmarkGeo.lng)
            : "",
        );

        setTextValues((prev) => ({
          ...prev,
          contentRu:
            getStringField(ruSummaryPayload, "description") ||
            payload.content?.ru ||
            "",
          contentEn:
            getStringField(enSummaryPayload, "description") ||
            payload.content?.en ||
            "",
          contentDe:
            getStringField(deSummaryPayload, "description") ||
            payload.content?.de ||
            "",
          contentUk:
            getStringField(ukSummaryPayload, "description") ||
            payload.content?.uk ||
            "",
          greetingRu:
            getStringField(ruPostcardPayload, "greeting") ||
            readLocalizedPrompt(payload.prompts?.greeting, "ru"),
          greetingEn:
            getStringField(enPostcardPayload, "greeting") ||
            readLocalizedPrompt(payload.prompts?.greeting, "en"),
          greetingDe:
            getStringField(dePostcardPayload, "greeting") ||
            readLocalizedPrompt(payload.prompts?.greeting, "de"),
          greetingUk:
            getStringField(ukPostcardPayload, "greeting") ||
            readLocalizedPrompt(payload.prompts?.greeting, "uk"),
          footerRu:
            getStringField(ruPostcardPayload, "footer") ||
            readLocalizedPrompt(payload.prompts?.footer, "ru"),
          bookInviteRu:
            getFirstStringField(ruPostcardPayload, [
              "invitation",
              "bookInvite",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitation, "ru") ||
            readLocalizedPrompt(payload.prompts?.bookInvite, "ru"),
          bookLinkRu:
            getFirstStringField(ruPostcardPayload, [
              "invitationBookLink",
              "bookLink",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitationBookLink, "ru") ||
            readLocalizedPrompt(payload.prompts?.bookLink, "ru"),
          footerEn:
            getStringField(enPostcardPayload, "footer") ||
            readLocalizedPrompt(payload.prompts?.footer, "en"),
          bookInviteEn:
            getFirstStringField(enPostcardPayload, [
              "invitation",
              "bookInvite",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitation, "en") ||
            readLocalizedPrompt(payload.prompts?.bookInvite, "en"),
          bookLinkEn:
            getFirstStringField(enPostcardPayload, [
              "invitationBookLink",
              "bookLink",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitationBookLink, "en") ||
            readLocalizedPrompt(payload.prompts?.bookLink, "en"),
          footerDe:
            getStringField(dePostcardPayload, "footer") ||
            readLocalizedPrompt(payload.prompts?.footer, "de"),
          bookInviteDe:
            getFirstStringField(dePostcardPayload, [
              "invitation",
              "bookInvite",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitation, "de") ||
            readLocalizedPrompt(payload.prompts?.bookInvite, "de"),
          bookLinkDe:
            getFirstStringField(dePostcardPayload, [
              "invitationBookLink",
              "bookLink",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitationBookLink, "de") ||
            readLocalizedPrompt(payload.prompts?.bookLink, "de"),
          footerUk:
            getStringField(ukPostcardPayload, "footer") ||
            readLocalizedPrompt(payload.prompts?.footer, "uk"),
          bookInviteUk:
            getFirstStringField(ukPostcardPayload, [
              "invitation",
              "bookInvite",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitation, "uk") ||
            readLocalizedPrompt(payload.prompts?.bookInvite, "uk"),
          bookLinkUk:
            getFirstStringField(ukPostcardPayload, [
              "invitationBookLink",
              "bookLink",
            ]) ||
            readLocalizedPrompt(payload.prompts?.invitationBookLink, "uk") ||
            readLocalizedPrompt(payload.prompts?.bookLink, "uk"),
        }));

        setPostcardGraphics({
          stamp: payload.postcardGraphics?.stamp ?? {},
          illustrations: {
            "2L": payload.postcardGraphics?.illustrations?.["2L"] ?? {},
            "2R": payload.postcardGraphics?.illustrations?.["2R"] ?? {},
            "4L": payload.postcardGraphics?.illustrations?.["4L"] ?? {},
            "4R": payload.postcardGraphics?.illustrations?.["4R"] ?? {},
          },
        });

        const loadedItems = Array.isArray(payload.gallery?.items)
          ? (payload.gallery?.items ?? [])
          : [];

        const fallbackItemsFromUniversal = universalGalleryItems.map((item) => {
          const isDataUrl = item.src.startsWith("data:");
          const savedFile = isDataUrl ? "" : toSavedFileFromSrc(item.src);

          return {
            savedFile,
            fileName: savedFile,
            dataUrl: isDataUrl ? item.src : undefined,
            isActive: true,
            prompt: "",
            mime: "",
          };
        });

        const imageItemsSource =
          loadedItems.length > 0 ? loadedItems : fallbackItemsFromUniversal;

        setImageState({
          globalPrompt: payload.gallery?.globalPrompt ?? "",
          items: Array.from({ length: IMAGE_SLOTS_COUNT }, (_, index) => {
            const item = imageItemsSource[index];
            return item
              ? {
                  fileName: item.fileName,
                  dataUrl: item.dataUrl,
                  prompt: item.prompt,
                  savedFile: item.savedFile,
                  isActive:
                    item.isActive ?? Boolean(item.dataUrl || item.savedFile),
                  mime: item.mime,
                }
              : {};
          }),
        });

        lastLoadedKeyRef.current = key;
        setLoadStatus("idle");
        setLoadMessage("");
      } catch {
        if (isCancelled) return;
        setLoadStatus("error");
        setLoadMessage(
          "Не удалось загрузить data.json для выбранного объекта.",
        );
      }
    };

    void loadExisting();

    return () => {
      isCancelled = true;
    };
  }, [
    cityEn,
    initialTextState,
    landmark,
    landmarkOptions,
    selectedCitySlug,
    selectedLandmarkSlug,
  ]);

  if (!schema) {
    return (
      <div className="agent-card agent-muted">
        Выберите операцию слева, чтобы создать форму.
      </div>
    );
  }

  const handleTextChange = (id: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleRegistryCityChange = (slug: string) => {
    setSelectedCityRegistrySlug(slug);

    if (!slug) {
      setCityEn("");
      setCityDe("");
      setCityRu("");
      setCityUk("");
      setLandmark("");
      lastLoadedKeyRef.current = "";
      resetMediaAndContent();
      return;
    }

    const city = cityBySlug.get(slug);
    if (!city) {
      return;
    }

    setCityEn(city.names.en ?? city.city);
    setCityDe(city.names.de ?? "");
    setCityRu(city.names.ru ?? "");
    setCityUk(city.names.uk ?? "");
    setLandmark("");
    lastLoadedKeyRef.current = "";
    resetMediaAndContent();
  };

  const createSectionDraftItem = (
    type: SectionDraftType,
  ): SectionDraftItem => ({
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    visible: true,
  });

  const handleAddSection = (type: SectionDraftType) => {
    setSectionDraft((prev) => [...prev, createSectionDraftItem(type)]);
  };

  const handleRemoveSection = (id: string) => {
    setSectionDraft((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleSectionVisible = (id: string) => {
    setSectionDraft((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const handleMoveSection = (id: string, direction: "up" | "down") => {
    setSectionDraft((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const current = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = current;
      return next;
    });
  };

  const handleHeroImageChange = (value: string) => {
    setHeroDraft((prev) => ({ ...prev, image: value }));
  };

  const handleHeroFieldChange = (
    locale: "ru" | "en" | "de" | "uk",
    field: "title" | "subtitle",
    value: string,
  ) => {
    setHeroDraft((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value,
      },
    }));
  };

  const buildSubmitPayload = () => {
    const imagePayload = {
      globalPrompt: imageState.globalPrompt,
      items: imageState.items.map((item) => ({
        fileName: item.fileName,
        dataUrl: item.dataUrl,
        savedFile: item.savedFile,
        isActive: item.isActive ?? Boolean(item.dataUrl || item.savedFile),
        prompt: item.prompt,
      })),
    };

    const content = {
      ru: textValues.contentRu ?? "",
      en: textValues.contentEn ?? "",
      de: textValues.contentDe ?? "",
      uk: textValues.contentUk ?? "",
    };

    const prompts = {
      greeting: {
        ru: textValues.greetingRu?.trim() || PROMPT_DEFAULTS.greeting.ru,
        en: textValues.greetingEn?.trim() || PROMPT_DEFAULTS.greeting.en,
        de: textValues.greetingDe?.trim() || PROMPT_DEFAULTS.greeting.de,
        uk: textValues.greetingUk?.trim() || PROMPT_DEFAULTS.greeting.uk,
      },
      footer: {
        ru: textValues.footerRu?.trim() || PROMPT_DEFAULTS.footer.ru,
        en: textValues.footerEn?.trim() || PROMPT_DEFAULTS.footer.en,
        de: textValues.footerDe?.trim() || PROMPT_DEFAULTS.footer.de,
        uk: textValues.footerUk?.trim() || PROMPT_DEFAULTS.footer.uk,
      },
      invitation: {
        ru: textValues.bookInviteRu?.trim() || "",
        en: textValues.bookInviteEn?.trim() || "",
        de: textValues.bookInviteDe?.trim() || "",
        uk: textValues.bookInviteUk?.trim() || "",
      },
      invitationBookLink: {
        ru: textValues.bookLinkRu?.trim() || "",
        en: textValues.bookLinkEn?.trim() || "",
        de: textValues.bookLinkDe?.trim() || "",
        uk: textValues.bookLinkUk?.trim() || "",
      },
    };

    const buildGraphicPayload = (slot: GraphicSlotState) => ({
      fileName: slot.fileName,
      dataUrl: slot.dataUrl,
      savedFile: slot.savedFile,
      isActive: slot.isActive ?? Boolean(slot.dataUrl || slot.savedFile),
      mime: slot.mime,
    });

    const postcardGraphicsPayload = {
      stamp: buildGraphicPayload(postcardGraphics.stamp),
      illustrations: {
        "2L": buildGraphicPayload(postcardGraphics.illustrations["2L"]),
        "2R": buildGraphicPayload(postcardGraphics.illustrations["2R"]),
        "4L": buildGraphicPayload(postcardGraphics.illustrations["4L"]),
        "4R": buildGraphicPayload(postcardGraphics.illustrations["4R"]),
      },
    };

    return {
      city: {
        en: selectedCity?.names.en ?? cityEn,
        de: selectedCity?.names.de ?? cityDe,
        ru: selectedCity?.names.ru ?? cityRu,
        uk: selectedCity?.names.uk ?? cityUk,
      },
      landmark,
      landmarkGeo:
        landmarkGeoLat.trim() || landmarkGeoLng.trim()
          ? {
              lat: landmarkGeoLat.trim(),
              lng: landmarkGeoLng.trim(),
              source: "manual",
            }
          : undefined,
      content,
      prompts,
      postcardGraphics: postcardGraphicsPayload,
      gallery: imagePayload,
      workflowStatus,
      sectionDraft,
      heroDraft,
    };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    void onSubmit(buildSubmitPayload());
  };

  const handleGraphicFileChange = (
    type: "stamp" | "illustration",
    slotId: "2L" | "2R" | "4L" | "4R" | null,
    file?: File,
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const nextSlot: GraphicSlotState = {
        file,
        fileName: file.name,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        savedFile: undefined,
        isActive: true,
      };

      setPostcardGraphics((prev) => {
        if (type === "stamp") {
          return {
            ...prev,
            stamp: nextSlot,
          };
        }

        if (!slotId) return prev;
        return {
          ...prev,
          illustrations: {
            ...prev.illustrations,
            [slotId]: nextSlot,
          },
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGraphicRemove = (
    type: "stamp" | "illustration",
    slotId: "2L" | "2R" | "4L" | "4R" | null,
  ) => {
    setPostcardGraphics((prev) => {
      if (type === "stamp") {
        return {
          ...prev,
          stamp: { isActive: false },
        };
      }

      if (!slotId) return prev;
      return {
        ...prev,
        illustrations: {
          ...prev.illustrations,
          [slotId]: { isActive: false },
        },
      };
    });
  };

  const handleRun = (mode: "data" | "rules") => {
    if (!onRunOrchestrator) return;
    const hasFormTarget = cityEn.trim() && landmark.trim();
    if (mode === "data") {
      if (!hasFormTarget) return;
      if (isSubmitting) return;
      void onSubmit(buildSubmitPayload(), { runAfterSave: true });
      return;
    }

    if (hasFormTarget) {
      onRunOrchestrator({ mode, city: cityEn, landmark });
      return;
    }

    if (lastOrchestratorTarget?.city && lastOrchestratorTarget?.landmark) {
      onRunOrchestrator({
        mode,
        city: lastOrchestratorTarget.city,
        landmark: lastOrchestratorTarget.landmark,
      });
    }
  };

  const contentFields = schema.fields.filter((field) =>
    CONTENT_FIELD_IDS.includes(field.id),
  );
  const smallFields = schema.fields.filter((field) =>
    SMALL_FIELD_IDS.includes(field.id),
  );

  const alias = `${(selectedCitySlug || cityEn)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")}-${landmark
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")}`;

  const errorSet = new Set(fieldErrors);

  const canRunWithForm = cityEn.trim().length > 0 && landmark.trim().length > 0;
  const canRunWithLast = Boolean(
    lastOrchestratorTarget?.city && lastOrchestratorTarget?.landmark,
  );
  const canRunRules = canRunWithForm || canRunWithLast;

  const stampActive = Boolean(
    postcardGraphics.stamp.dataUrl ||
    postcardGraphics.stamp.savedFile ||
    postcardGraphics.stamp.isActive,
  );
  const resolveSavedFileSrc = (savedFile?: string) => {
    if (!savedFile || !selectedCitySlug || !selectedLandmarkSlug) {
      return undefined;
    }
    return `/api/agent/landmark/asset?citySlug=${encodeURIComponent(selectedCitySlug)}&landmarkSlug=${encodeURIComponent(selectedLandmarkSlug)}&file=${encodeURIComponent(savedFile)}`;
  };
  const stampPreviewSrc = postcardGraphics.stamp.dataUrl
    ? postcardGraphics.stamp.dataUrl
    : resolveSavedFileSrc(postcardGraphics.stamp.savedFile);
  const stampBadge = postcardGraphics.stamp.dataUrl
    ? "новое"
    : postcardGraphics.stamp.savedFile
      ? "из файла"
      : "";
  const showGallerySourceBadge =
    process.env.NODE_ENV !== "production" &&
    (gallerySource === "generated" || gallerySource === "legacy");
  const gallerySourceValueClass =
    gallerySource === "generated"
      ? "agent-dev-indicator-value agent-dev-indicator-value-generated"
      : "agent-dev-indicator-value agent-dev-indicator-value-legacy";

  const previewSuffixByLocale = {
    ru: "Ru",
    en: "En",
    de: "De",
    uk: "Uk",
  } as const;
  const previewSuffix = previewSuffixByLocale[previewLocale];
  const previewSummary = textValues[`content${previewSuffix}`] ?? "";
  const previewGreeting =
    textValues[`greeting${previewSuffix}`] ??
    getPromptDefaultByFieldId(`greeting${previewSuffix}`);
  const previewFooter =
    textValues[`footer${previewSuffix}`] ??
    getPromptDefaultByFieldId(`footer${previewSuffix}`);
  const previewBookInvite = textValues[`bookInvite${previewSuffix}`] ?? "";
  const previewBookLink = textValues[`bookLink${previewSuffix}`] ?? "";
  const previewCityByLocale = {
    ru: cityRu,
    en: cityEn,
    de: cityDe,
    uk: cityUk,
  };
  const previewCity = previewCityByLocale[previewLocale] || cityEn;
  const previewGalleryItems = imageState.items
    .map((item, index) => {
      const src = item.dataUrl || resolveSavedFileSrc(item.savedFile);
      if (!src) return null;

      return {
        key: `${index}-${item.savedFile || item.fileName || "gallery"}`,
        src,
        alt: item.prompt?.trim() || `${landmark || "landmark"} ${index + 1}`,
      };
    })
    .filter((item): item is { key: string; src: string; alt: string } =>
      Boolean(item),
    )
    .slice(0, 6);

  const previewModuleCities = cityRecords.slice(0, 8).map((cityRecord) => ({
    city:
      cityRecord.names[previewLocale] || cityRecord.names.en || cityRecord.city,
    slug: cityRecord.slug,
    count: cityRecord.landmarks.length,
  }));

  const previewCollectionLandmarks = landmarkOptions
    .slice(0, 8)
    .map((item, index) => ({
      slug: item.slug,
      title: item.name,
      shortDescription:
        index === 0
          ? previewSummary.trim() || "Описание объекта будет добавлено позже."
          : "Откройте страницу объекта, чтобы посмотреть историю и материалы.",
      thumbnail: previewGalleryItems[index]?.src,
    }));

  const previewModuleEnvelope = adaptLandmarksModuleHomeToEnvelope({
    locale: previewLocale,
    cities: previewModuleCities,
  });

  const previewCollectionEnvelope = adaptLandmarksCollectionHomeToEnvelope({
    locale: previewLocale,
    citySlug:
      selectedCitySlug || normalizeSlug(previewCity || cityEn || "city"),
    cityTitle: previewCity || cityEn || "City",
    subtitle: heroDraft.subtitle[previewLocale] || cityEn || "",
    shortDescription: previewSummary.trim() || undefined,
    description:
      previewSummary.trim() || "Информация о городе будет добавлена позже.",
    heroImage: heroDraft.image || previewGalleryItems[0]?.src,
    landmarks: previewCollectionLandmarks,
  });

  const previewItemEnvelope = adaptLandmarksItemToEnvelope({
    locale: previewLocale,
    citySlug:
      selectedCitySlug || normalizeSlug(previewCity || cityEn || "city"),
    cityTitle: previewCity || cityEn || "City",
    landmarkSlug: selectedLandmarkSlug || normalizeSlug(landmark || "landmark"),
    landmarkTitle: landmark.trim() || "Landmark",
    view: {
      greeting:
        previewGreeting.trim() || PROMPT_DEFAULTS.greeting[previewLocale],
      stampImage: stampPreviewSrc || "",
      contentFile: previewSummary.trim() || "",
      footer: previewFooter.trim() || PROMPT_DEFAULTS.footer[previewLocale],
      invitation: previewBookInvite.trim() || "",
      invitationBookLink: previewBookLink.trim() || "",
    },
    gallery: previewGalleryItems.map((item) => ({
      src: item.src,
      alt: item.alt,
    })),
    gallerySource: gallerySource === "generated" ? "generated" : "legacy",
  });

  return (
    <form className="agent-form" onSubmit={handleSubmit}>
      <h3>{schema.title}</h3>

      {loadStatus !== "idle" && loadMessage ? (
        <div
          className={`agent-status agent-status-${loadStatus === "error" ? "error" : "info"}`}
        >
          {loadMessage}
        </div>
      ) : null}

      <section className="agent-section">
        <div className="agent-section-title">Метаданные</div>
        <div className="agent-grid">
          <label className="agent-field">
            <span>Город (реестр)</span>
            <select
              value={selectedCityRegistrySlug}
              onChange={(event) => handleRegistryCityChange(event.target.value)}
            >
              <option value="">Выберите город из реестра</option>
              {cityRegistryOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="agent-field-hint">
              Локализация города редактируется только в форме города.
            </span>
          </label>

          <label
            className={`agent-field${errorSet.has("landmark") ? " agent-field-error" : ""}`}
          >
            <span>Достопримечательность</span>
            <input
              type="text"
              list="agent-landmark-options"
              value={landmark}
              placeholder="Выберите или введите объект"
              onChange={(event) => setLandmark(event.target.value)}
            />
            <datalist id="agent-landmark-options">
              {landmarkOptions.map((item) => (
                <option key={item.slug} value={item.name} />
              ))}
            </datalist>
          </label>

          <label className="agent-field">
            <span>Алиас</span>
            <input type="text" value={alias} readOnly />
          </label>

          <label className="agent-field">
            <span>Workflow status</span>
            <select
              value={workflowStatus}
              onChange={(event) =>
                setWorkflowStatus(event.target.value as WorkflowStatus)
              }
            >
              {WORKFLOW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="agent-field">
            <span>Geo lat (опционально)</span>
            <input
              type="number"
              step="any"
              value={landmarkGeoLat}
              placeholder="например 48.368"
              onChange={(event) => setLandmarkGeoLat(event.target.value)}
            />
            <span className="agent-field-hint">Диапазон: от -90 до 90</span>
          </label>

          <label className="agent-field">
            <span>Geo lng (опционально)</span>
            <input
              type="number"
              step="any"
              value={landmarkGeoLng}
              placeholder="например 10.898"
              onChange={(event) => setLandmarkGeoLng(event.target.value)}
            />
            <span className="agent-field-hint">Диапазон: от -180 до 180</span>
          </label>
        </div>
      </section>

      <section className="agent-section">
        <div className="agent-section-title">Контент</div>
        {contentFields.map((field) => (
          <label
            key={field.id}
            className={`agent-field${errorSet.has(field.id) ? " agent-field-error" : ""}`}
          >
            <span>{field.label}</span>
            <textarea
              value={textValues[field.id] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) =>
                handleTextChange(field.id, event.target.value)
              }
            />
          </label>
        ))}

        <div className="agent-section-subtitle">Малые поля</div>
        <div className="agent-locale-grid">
          {SMALL_FIELD_LOCALES.map((locale) => {
            const localeFields = smallFields
              .filter((field) => field.id.endsWith(locale.suffix))
              .sort(
                (a, b) => getSmallFieldRank(a.id) - getSmallFieldRank(b.id),
              );

            if (localeFields.length === 0) {
              return null;
            }

            return (
              <div className="agent-locale-block" key={locale.code}>
                <div className="agent-locale-title">{locale.label}</div>
                <div className="agent-locale-fields">
                  {localeFields.map((field) => {
                    const isOptional = OPTIONAL_SMALL_FIELD_IDS.has(field.id);
                    const defaultValue = getPromptDefaultByFieldId(field.id);
                    const currentValue = textValues[field.id] ?? "";
                    const isDefaultValue =
                      isOptional &&
                      currentValue.trim().length > 0 &&
                      currentValue.trim() === defaultValue;

                    return (
                      <label key={field.id} className="agent-field">
                        <div className="agent-field-label-row">
                          <span>{field.label}</span>
                          {isOptional ? (
                            <span className="agent-field-tag">опционально</span>
                          ) : (
                            <span className="agent-field-tag">
                              обязательное
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={currentValue}
                          placeholder={defaultValue || field.placeholder}
                          className={
                            isOptional
                              ? `agent-default-placeholder${
                                  isDefaultValue ? " agent-default-value" : ""
                                }`
                              : undefined
                          }
                          onChange={(event) =>
                            handleTextChange(field.id, event.target.value)
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="agent-field-hint">
          Если оставить пустым — подставится значение по умолчанию.
        </div>
      </section>

      <section className="agent-section">
        <div className="agent-section-title">Hero (envelope)</div>
        <div className="agent-grid">
          <label className="agent-field">
            <span>Hero image (опционально)</span>
            <input
              type="text"
              value={heroDraft.image}
              placeholder="/images/hero.jpg"
              onChange={(event) => handleHeroImageChange(event.target.value)}
            />
          </label>
        </div>

        <div className="agent-locale-grid">
          {SMALL_FIELD_LOCALES.map((locale) => (
            <div className="agent-locale-block" key={`hero-${locale.code}`}>
              <div className="agent-locale-title">{locale.label}</div>
              <div className="agent-locale-fields">
                <label className="agent-field">
                  <span>Hero title</span>
                  <input
                    type="text"
                    value={heroDraft.title[locale.code]}
                    onChange={(event) =>
                      handleHeroFieldChange(
                        locale.code,
                        "title",
                        event.target.value,
                      )
                    }
                  />
                </label>
                <label className="agent-field">
                  <span>Hero subtitle</span>
                  <input
                    type="text"
                    value={heroDraft.subtitle[locale.code]}
                    onChange={(event) =>
                      handleHeroFieldChange(
                        locale.code,
                        "subtitle",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="agent-section">
        <div className="agent-section-title">Section operations (MVP)</div>
        <div className="agent-grid">
          <div className="agent-field">
            <span>Добавить секцию</span>
            <div className="agent-grid">
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("summary")}
              >
                + summary
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("highlights")}
              >
                + highlights
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("postcard")}
              >
                + postcard
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("gallery")}
              >
                + gallery
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("facts")}
              >
                + facts
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("links-grid")}
              >
                + links-grid
              </button>
              <button
                className="agent-button agent-button-secondary"
                type="button"
                onClick={() => handleAddSection("cta")}
              >
                + cta
              </button>
            </div>
          </div>
        </div>

        {sectionDraft.length > 0 ? (
          <div className="agent-locale-block">
            <div className="agent-locale-title">Порядок и видимость секций</div>
            {sectionDraft.map((section, index) => (
              <div className="agent-field" key={section.id}>
                <div className="agent-field-label-row">
                  <span>
                    {index + 1}. {section.type}
                  </span>
                  <span className="agent-field-tag">id: {section.id}</span>
                </div>
                <div className="agent-grid">
                  <label className="agent-field">
                    <span>visible</span>
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={() => handleToggleSectionVisible(section.id)}
                    />
                  </label>
                  <button
                    className="agent-button agent-button-secondary"
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveSection(section.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    className="agent-button agent-button-secondary"
                    type="button"
                    disabled={index === sectionDraft.length - 1}
                    onClick={() => handleMoveSection(section.id, "down")}
                  >
                    ↓
                  </button>
                  <button
                    className="agent-button agent-button-ghost"
                    type="button"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="agent-field-hint">Список секций пуст.</div>
        )}
      </section>

      <section className="agent-section">
        <div className="agent-section-title">Live preview (sections)</div>
        <div className="agent-grid">
          <label className="agent-field">
            <span>Тип страницы предпросмотра</span>
            <select
              value={previewPageKind}
              onChange={(event) =>
                setPreviewPageKind(event.target.value as PreviewPageKind)
              }
            >
              {PREVIEW_PAGE_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="agent-field">
            <span>Локаль предпросмотра</span>
            <select
              value={previewLocale}
              onChange={(event) =>
                setPreviewLocale(
                  event.target.value as "ru" | "en" | "de" | "uk",
                )
              }
            >
              {SMALL_FIELD_LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="agent-locale-block">
          <div className="agent-locale-title">Renderer parity preview</div>
          {previewPageKind === "module-home" ? (
            <PreviewUniversalSections envelope={previewModuleEnvelope} />
          ) : null}

          {previewPageKind === "collection-home" ? (
            <>
              <section className="city-zone-1">
                {previewCollectionEnvelope.hero?.image && (
                  <img
                    className="city-hero"
                    src={previewCollectionEnvelope.hero.image}
                    alt={
                      previewCollectionEnvelope.hero.title ||
                      previewCollectionEnvelope.meta.title
                    }
                  />
                )}
                <h1>
                  {previewCollectionEnvelope.hero?.title ||
                    previewCollectionEnvelope.meta.title}
                </h1>
                <h2 className="landmarks-muted">
                  {previewCollectionEnvelope.hero?.subtitle ||
                    previewCollectionEnvelope.meta.subtitle}
                </h2>
              </section>
              <PreviewUniversalSections envelope={previewCollectionEnvelope} />
            </>
          ) : null}

          {previewPageKind === "item" ? (
            <PreviewItemSections
              envelope={previewItemEnvelope}
              gallerySource={
                gallerySource === "generated" ? "generated" : "legacy"
              }
            />
          ) : null}
        </div>
      </section>

      <section className="agent-section">
        <div className="agent-section-title">Графический блок открытки</div>
        <div
          className={`agent-graphic-card${stampActive ? "" : " agent-graphic-card-inactive"}`}
        >
          <div className="agent-graphic-header">
            <span>Почтовая марка</span>
            <span className="agent-graphic-status">
              {stampActive ? "активен" : "неактивен"}
            </span>
          </div>
          <div className="agent-image-preview agent-image-preview-graphic">
            {stampBadge ? (
              <span className="agent-image-badge">{stampBadge}</span>
            ) : null}
            {stampPreviewSrc ? (
              <img src={stampPreviewSrc} alt="Почтовая марка" />
            ) : (
              <span>Пустой слот</span>
            )}
          </div>
          <div className="agent-image-actions">
            <input
              id="agent-stamp-upload"
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleGraphicFileChange("stamp", null, event.target.files?.[0])
              }
            />
            <label
              className="agent-button agent-button-secondary"
              htmlFor="agent-stamp-upload"
            >
              {stampActive ? "Заменить" : "Загрузить"}
            </label>
            {stampActive ? (
              <button
                className="agent-button agent-button-ghost"
                type="button"
                onClick={() => handleGraphicRemove("stamp", null)}
              >
                Удалить
              </button>
            ) : null}
          </div>
        </div>

        <div className="agent-image-grid">
          {graphicSlots.map((slot) => {
            const value = postcardGraphics.illustrations[slot.id];
            const isActive = Boolean(
              value.dataUrl || value.savedFile || value.isActive,
            );
            const previewSrc = value.dataUrl
              ? value.dataUrl
              : resolveSavedFileSrc(value.savedFile);
            const sourceBadge = value.dataUrl
              ? "новое"
              : value.savedFile
                ? "из файла"
                : "";
            const inputId = `agent-graphic-upload-${slot.id}`;

            return (
              <div
                key={slot.id}
                className={`agent-graphic-card${isActive ? "" : " agent-graphic-card-inactive"}`}
              >
                <div className="agent-graphic-header">
                  <span>{slot.label}</span>
                  <span className="agent-graphic-status">
                    {isActive ? "активен" : "неактивен"}
                  </span>
                </div>
                <div className="agent-image-preview agent-image-preview-graphic">
                  {sourceBadge ? (
                    <span className="agent-image-badge">{sourceBadge}</span>
                  ) : null}
                  {previewSrc ? (
                    <img src={previewSrc} alt={slot.label} />
                  ) : (
                    <span>Пустой слот</span>
                  )}
                </div>
                <div className="agent-image-actions">
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleGraphicFileChange(
                        "illustration",
                        slot.id,
                        event.target.files?.[0],
                      )
                    }
                  />
                  <label
                    className="agent-button agent-button-secondary"
                    htmlFor={inputId}
                  >
                    {isActive ? "Заменить" : "Загрузить"}
                  </label>
                  {isActive ? (
                    <button
                      className="agent-button agent-button-ghost"
                      type="button"
                      onClick={() =>
                        handleGraphicRemove("illustration", slot.id)
                      }
                    >
                      Удалить
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ImageBlock
        value={imageState}
        onChange={setImageState}
        resolveSavedFileSrc={resolveSavedFileSrc}
      />

      <button className="agent-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем…" : "Отправить Агенту"}
      </button>

      <label className="agent-field">
        <span>Автозапуск после сохранения данных</span>
        <input
          type="checkbox"
          checked={autoRunAfterSave}
          onChange={(event) => onToggleAutoRun?.(event.target.checked)}
        />
      </label>

      {showGallerySourceBadge ? (
        <div className="agent-dev-indicator">
          dev: gallery source =
          <span className={gallerySourceValueClass}> {gallerySource}</span>
        </div>
      ) : null}

      <div className="agent-grid">
        <button
          className="agent-button"
          type="button"
          disabled={
            orchestratorStatus === "running" || isSubmitting || !canRunWithForm
          }
          onClick={() => handleRun("data")}
        >
          Пересобрать открытку (данные)
        </button>
        <button
          className="agent-button"
          type="button"
          disabled={orchestratorStatus === "running" || !canRunRules}
          onClick={() => handleRun("rules")}
        >
          Пересобрать открытку (правила)
        </button>
      </div>

      {orchestratorStatus !== "idle" && orchestratorMessage ? (
        <div
          className={`agent-status agent-status-${
            orchestratorStatus === "success"
              ? "success"
              : orchestratorStatus === "error"
                ? "error"
                : "info"
          }`}
        >
          {orchestratorMessage}
        </div>
      ) : null}

      {saveStatus !== "idle" && statusMessage ? (
        <div
          className={`agent-status agent-status-${
            saveStatus === "success"
              ? "success"
              : saveStatus === "error"
                ? "error"
                : "info"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
    </form>
  );
}
