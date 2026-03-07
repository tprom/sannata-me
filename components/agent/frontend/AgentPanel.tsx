"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentFormSchema } from "../backend/core/schema";
import { createDefaultAgentEngine } from "../backend/core/agentEngine";
import { routeAgentMessage } from "../backend/core/messageRouter";
import { FormRenderer } from "./FormRenderer";
import { ChildPatternsForm } from "./ChildPatternsForm";
import { Chat } from "./Chat";
import { Sidebar } from "./Sidebar";
import { default as ModuleHomeFormPanel } from "@/agent/components/ModuleHomeFormPanel";
import CollectionHomeFormPanel from "@/agent/components/CollectionHomeFormPanel";
import LandmarkFormPanel from "@/agent/components/LandmarkFormPanel";
import CityFormPanel from "@/agent/components/CityFormPanel";

const LOCALES = ["ru", "en", "de", "uk"] as const;

type LocaleCode = (typeof LOCALES)[number];

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

type HeroDraftInput = {
  image?: unknown;
  title?: Partial<Record<LocaleCode, unknown>>;
  subtitle?: Partial<Record<LocaleCode, unknown>>;
};

type WorkflowStatus = "draft" | "review" | "published" | "archived";

const pickText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const pickLocalized = (value: unknown, locale: LocaleCode): string => {
  if (typeof value === "string") {
    return locale === "ru" ? value : "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Partial<Record<LocaleCode, unknown>>;
  return pickText(record[locale]);
};

type LandmarkFormType =
  | "module-home"
  | "city"
  | "collection-home"
  | "landmark-item";

export function AgentPanel() {
  const engine = useMemo(() => createDefaultAgentEngine(), []);
  const storageKey = "agent.lastOrchestratorTarget";
  const [schema, setSchema] = useState<AgentFormSchema | null>(null);
  const [selectedLandmarkForm, setSelectedLandmarkForm] =
    useState<LandmarkFormType | null>(null);
  const [activeForm, setActiveForm] = useState<
    "landmark" | "childPatterns" | "landmarkForm" | null
  >(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [childSaveStatus, setChildSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [childStatusMessage, setChildStatusMessage] = useState("");
  const [orchestratorStatus, setOrchestratorStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [orchestratorMessage, setOrchestratorMessage] = useState("");
  const [lastOrchestratorTarget, setLastOrchestratorTarget] = useState<{
    city: string;
    landmark: string;
  } | null>(null);
  const [autoRunAfterSave, setAutoRunAfterSave] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { city?: unknown; landmark?: unknown };
      if (
        typeof parsed.city !== "string" ||
        typeof parsed.landmark !== "string"
      ) {
        return;
      }
      const city = parsed.city.trim();
      const landmark = parsed.landmark.trim();
      if (!city || !landmark) return;
      setLastOrchestratorTarget({ city, landmark });
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey]);

  const persistOrchestratorTarget = (city: string, landmark: string) => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ city, landmark }),
      );
    } catch {
      // ignore localStorage errors
    }
  };

  const handleSendMessage = async (message: string) => {
    return routeAgentMessage({ text: message }, engine);
  };

  const normalizeSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9а-яё\-]/gi, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();
  };

  useEffect(() => {
    if (saveStatus === "idle" && childSaveStatus === "idle") return;
    const timer = window.setTimeout(() => {
      setSaveStatus("idle");
      setStatusMessage("");
      setChildSaveStatus("idle");
      setChildStatusMessage("");
      setOrchestratorStatus("idle");
      setOrchestratorMessage("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [saveStatus, childSaveStatus, orchestratorStatus]);

  const handleFormSubmit = async (
    values: Record<string, unknown>,
    options?: { runAfterSave?: boolean },
  ) => {
    if (saveStatus === "saving") return false;

    const city =
      typeof values.city === "object" && values.city
        ? (values.city as Record<string, unknown>)
        : {};
    const cityEn = typeof city.en === "string" ? city.en : "";
    const landmark = typeof values.landmark === "string" ? values.landmark : "";
    const content =
      typeof values.content === "object" && values.content
        ? values.content
        : {};
    const prompts =
      typeof values.prompts === "object" && values.prompts
        ? values.prompts
        : {};
    const gallery =
      typeof values.gallery === "object" && values.gallery
        ? values.gallery
        : {};
    const heroDraftInput =
      typeof values.heroDraft === "object" && values.heroDraft
        ? (values.heroDraft as HeroDraftInput)
        : ({} as HeroDraftInput);
    const postcardGraphics =
      typeof values.postcardGraphics === "object" && values.postcardGraphics
        ? values.postcardGraphics
        : {};
    const landmarkGeo =
      typeof values.landmarkGeo === "object" && values.landmarkGeo
        ? values.landmarkGeo
        : {};
    // Special-case: collection-home (structured form)
    if (selectedLandmarkForm === "collection-home") {
      const locale = typeof values.locale === "string" ? values.locale : "ru";
      const cityId = typeof values.cityId === "string" ? values.cityId : "";
      const citySlug =
        typeof values.citySlug === "string" ? values.citySlug : "";
      const title = typeof values.title === "string" ? values.title : "";
      const subtitle =
        typeof values.subtitle === "string" ? values.subtitle : "";
      const tags = Array.isArray(values.tags)
        ? (values.tags as string[]).join(", ")
        : typeof values.tags === "string"
          ? values.tags
          : "";
      const status =
        typeof values.status === "string" ? values.status : "draft";
      const heroTitle =
        typeof values.heroTitle === "string" ? values.heroTitle : "";
      const heroSubtitle =
        typeof values.heroSubtitle === "string" ? values.heroSubtitle : "";
      const heroImage =
        typeof values.heroImage === "string" ? values.heroImage : "";
      const summaryTitle =
        typeof values.summaryTitle === "string" ? values.summaryTitle : "";
      const summarySubtitle =
        typeof values.summarySubtitle === "string"
          ? values.summarySubtitle
          : "";
      const summaryDescription =
        typeof values.summaryDescription === "string"
          ? values.summaryDescription
          : "";
      const highlights = Array.isArray(values.highlights)
        ? (values.highlights as string[])
        : typeof values.highlights === "string"
          ? (values.highlights as string)
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const linksGridTitle =
        typeof values.linksGridTitle === "string" ? values.linksGridTitle : "";
      const ctaText = typeof values.ctaText === "string" ? values.ctaText : "";

      const lines: string[] = [];
      lines.push("# Форма страницы города (collection-home)");
      lines.push("");
      lines.push(
        "Эта форма создаёт или обновляет главную страницу города в модуле landmarks.",
      );
      lines.push("");
      lines.push("## A. Город");
      lines.push("");
      if (cityId) lines.push(`cityId: ${cityId}`);
      lines.push(`citySlug: ${citySlug}`);
      lines.push(`locale: ${locale}`);
      lines.push("");
      lines.push("## B. Метаданные");
      lines.push("");
      lines.push(`title: ${title}`);
      lines.push(`subtitle: ${subtitle}`);
      if (tags) lines.push(`tags: ${tags}`);
      lines.push(`status: ${status}`);
      lines.push("");
      lines.push("## C. Hero");
      lines.push("");
      if (heroTitle) lines.push(`heroTitle: ${heroTitle}`);
      if (heroSubtitle) lines.push(`heroSubtitle: ${heroSubtitle}`);
      if (heroImage) lines.push(`heroImage: ${heroImage}`);
      lines.push("");
      lines.push("## D. Summary секция");
      lines.push("");
      if (summaryTitle) lines.push(`summaryTitle: ${summaryTitle}`);
      if (summarySubtitle) lines.push(`summarySubtitle: ${summarySubtitle}`);
      if (summaryDescription)
        lines.push(`summaryDescription: ${summaryDescription}`);
      lines.push("");
      if (highlights.length > 0) {
        highlights.forEach((h, i) => lines.push(`highlight${i + 1}: ${h}`));
        lines.push("");
      }
      if (linksGridTitle) {
        lines.push("## F. Links-grid секция");
        lines.push("");
        lines.push(`linksGridTitle: ${linksGridTitle}`);
        lines.push("");
      }
      if (ctaText) {
        lines.push("## G. CTA секция");
        lines.push("");
        lines.push(`ctaText: ${ctaText}`);
        lines.push("");
      }

      const markdown = lines.join("\n");

      setSaveStatus("saving");
      setStatusMessage("Сохраняем страницу города…");

      try {
        const response = await fetch("/api/agent/forms/collection-home", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
        });

        const result = (await response.json().catch(() => null)) as {
          ok?: boolean;
          message?: string;
        } | null;

        if (!response.ok || !result?.ok) {
          throw new Error(result?.message ?? "Ошибка при сохранении формы.");
        }

        setSaveStatus("success");
        setStatusMessage(result?.message ?? "Форма сохранена");
        return true;
      } catch (err) {
        setSaveStatus("error");
        setStatusMessage(
          err instanceof Error ? err.message : "Ошибка при сохранении",
        );
        return false;
      }
    }
    const sectionDraftInput = Array.isArray(values.sectionDraft)
      ? values.sectionDraft
      : [];
    const workflowStatusInput: WorkflowStatus =
      values.workflowStatus === "draft" ||
      values.workflowStatus === "review" ||
      values.workflowStatus === "published" ||
      values.workflowStatus === "archived"
        ? values.workflowStatus
        : "draft";

    const nextErrors = [] as string[];
    if (!cityEn.trim()) nextErrors.push("cityEn");
    if (!landmark.trim()) nextErrors.push("landmark");
    if (!(content as Record<string, unknown>).ru) nextErrors.push("contentRu");
    if (!(content as Record<string, unknown>).en) nextErrors.push("contentEn");
    if (!(content as Record<string, unknown>).de) nextErrors.push("contentDe");
    if (!(content as Record<string, unknown>).uk) nextErrors.push("contentUk");

    if (nextErrors.length > 0) {
      setFieldErrors(nextErrors);
      setSaveStatus("error");
      setStatusMessage("Ошибка при сохранении");
      return false;
    }

    setFieldErrors([]);
    setSaveStatus("saving");
    setStatusMessage("Сохраняем…");

    const citySlug = normalizeSlug(cityEn);
    const landmarkSlug = normalizeSlug(landmark);
    const contentRecord = content as Partial<Record<LocaleCode, unknown>>;
    const promptsRecord = prompts as Record<string, unknown>;
    const galleryRecord = gallery as {
      items?: Array<{
        savedFile?: string;
        fileName?: string;
        dataUrl?: string;
      }>;
    };
    const galleryItems = Array.isArray(galleryRecord.items)
      ? galleryRecord.items
      : [];

    const defaultSummary =
      pickText(contentRecord.ru) ||
      pickText(contentRecord.en) ||
      pickText(contentRecord.de) ||
      pickText(contentRecord.uk);

    const summarySection = {
      id: "summary-main",
      type: "summary",
      visible: true,
      payload: {
        kind: "summary",
        description: defaultSummary,
      },
    };

    const postcardByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    LOCALES.forEach((locale) => {
      const greeting = pickLocalized(promptsRecord.greeting, locale);
      const footer = pickLocalized(promptsRecord.footer, locale);
      const bookInvite = pickLocalized(promptsRecord.bookInvite, locale);
      const bookLink = pickLocalized(promptsRecord.bookLink, locale);

      postcardByLocale[locale] = {
        id: `postcard-${locale}`,
        type: "postcard",
        visible: true,
        payload: {
          kind: "postcard",
          greeting,
          stampImage: "",
          contentFile: `content.${locale}.md`,
          footer,
          bookInvite,
          bookLink,
        },
      };
    });

    const gallerySection = {
      id: "gallery-main",
      type: "gallery",
      visible: true,
      payload: {
        kind: "gallery",
        items: galleryItems
          .filter((item) =>
            Boolean(item?.savedFile || item?.fileName || item?.dataUrl),
          )
          .map((item, index) => {
            const source =
              item.savedFile ||
              item.fileName ||
              item.dataUrl ||
              `gallery-${index + 1}.jpg`;

            return {
              src: source.startsWith("/")
                ? source
                : `/data/landmarks/${citySlug}/${landmarkSlug}/${source}`,
              alt: `${landmark} ${index + 1}`,
            };
          }),
      },
    };

    const firstGallerySrc =
      (gallerySection.payload.items[0] as { src?: string } | undefined)?.src ||
      undefined;

    const highlightsByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    const factsByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    const linksGridByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    const ctaByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    LOCALES.forEach((locale) => {
      const localizedCity =
        pickText((city as Partial<Record<LocaleCode, unknown>>)[locale]) ||
        cityEn;

      highlightsByLocale[locale] = {
        id: `highlights-${locale}`,
        type: "highlights",
        visible: true,
        payload: {
          kind: "highlights",
          items: [
            `${localizedCity}: ${landmark}`,
            `Локаль контента: ${locale}`,
            `Изображений в галерее: ${galleryItems.length}`,
          ],
        },
      };

      factsByLocale[locale] = {
        id: `facts-${locale}`,
        type: "facts",
        visible: true,
        payload: {
          kind: "facts",
          items: [
            `Источник данных: agent-form`,
            `Статус workflow: ${workflowStatusInput}`,
            `Алиас: ${citySlug}/${landmarkSlug}`,
          ],
        },
      };

      linksGridByLocale[locale] = {
        id: `links-grid-${locale}`,
        type: "links-grid",
        visible: true,
        payload: {
          kind: "links-grid",
          title: "Навигация",
          items: [
            {
              id: `city-${citySlug}`,
              title: localizedCity || citySlug,
              href: `/${locale}/landmarks/${citySlug}`,
              description: "Страница города",
            },
            {
              id: `landmark-${landmarkSlug}`,
              title: landmark,
              href: `/${locale}/landmarks/${citySlug}/${landmarkSlug}`,
              description: defaultSummary || "Страница достопримечательности",
              image: firstGallerySrc,
            },
          ],
        },
      };

      ctaByLocale[locale] = {
        id: `cta-${locale}`,
        type: "cta",
        visible: true,
        payload: {
          kind: "cta",
          text: "Выберите секцию и продолжайте редактирование контента в агентной форме.",
        },
      };
    });

    const normalizedSectionDraft = sectionDraftInput
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const type =
          record.type === "summary" ||
          record.type === "highlights" ||
          record.type === "postcard" ||
          record.type === "gallery" ||
          record.type === "facts" ||
          record.type === "links-grid" ||
          record.type === "cta"
            ? (record.type as SectionDraftType)
            : null;

        if (!type) return null;

        const id =
          typeof record.id === "string" && record.id.trim()
            ? record.id
            : `${type}-${index + 1}`;

        return {
          id,
          type,
          visible: record.visible !== false,
        } as SectionDraftItem;
      })
      .filter((item): item is SectionDraftItem => Boolean(item));

    const fallbackSectionDraft: SectionDraftItem[] = [
      { id: "summary-main", type: "summary", visible: true },
      { id: "highlights-main", type: "highlights", visible: true },
      { id: "postcard-main", type: "postcard", visible: true },
      { id: "gallery-main", type: "gallery", visible: true },
      { id: "facts-main", type: "facts", visible: true },
      { id: "links-grid-main", type: "links-grid", visible: true },
      { id: "cta-main", type: "cta", visible: true },
    ];

    const activeSectionDraft =
      normalizedSectionDraft.length > 0
        ? normalizedSectionDraft
        : fallbackSectionDraft;

    const cloneSectionWithDraft = (
      section: Record<string, unknown>,
      draft: SectionDraftItem,
    ) => ({
      ...section,
      id: draft.id,
      visible: draft.visible,
      payload:
        section.payload && typeof section.payload === "object"
          ? { ...(section.payload as Record<string, unknown>) }
          : section.payload,
    });

    const buildSectionsByLocale = (locale: LocaleCode) =>
      activeSectionDraft.map((draft) => {
        if (draft.type === "summary") {
          return cloneSectionWithDraft(summarySection, draft);
        }

        if (draft.type === "highlights") {
          return cloneSectionWithDraft(highlightsByLocale[locale], draft);
        }

        if (draft.type === "gallery") {
          return cloneSectionWithDraft(gallerySection, draft);
        }

        if (draft.type === "facts") {
          return cloneSectionWithDraft(factsByLocale[locale], draft);
        }

        if (draft.type === "links-grid") {
          return cloneSectionWithDraft(linksGridByLocale[locale], draft);
        }

        if (draft.type === "cta") {
          return cloneSectionWithDraft(ctaByLocale[locale], draft);
        }

        return cloneSectionWithDraft(postcardByLocale[locale], draft);
      });

    const heroImage = pickText(heroDraftInput?.image);

    const buildHeroByLocale = (locale: LocaleCode, localizedTitle: string) => {
      const draftTitle = pickText(heroDraftInput?.title?.[locale]);
      const draftSubtitle = pickText(heroDraftInput?.subtitle?.[locale]);

      const hero = {
        title: draftTitle || localizedTitle,
        subtitle: draftSubtitle || cityEn,
      } as {
        title: string;
        subtitle: string;
        image?: string;
      };

      if (heroImage) {
        hero.image = heroImage;
      }

      return hero;
    };

    const now = new Date().toISOString();
    const translationGroupId = `${citySlug}:${landmarkSlug}`;
    const envelopesByLocale: Record<LocaleCode, Record<string, unknown>> = {
      ru: {},
      en: {},
      de: {},
      uk: {},
    };

    LOCALES.forEach((locale) => {
      const localizedTitle = pickText(contentRecord[locale]) || landmark;

      envelopesByLocale[locale] = {
        schemaVersion: "1.1.0",
        moduleKey: "landmarks",
        pageKind: "item",
        pageId: `landmarks:item:${citySlug}:${landmarkSlug}:${locale}`,
        slug: landmarkSlug,
        locale,
        translationGroupId,
        meta: {
          title: localizedTitle,
          subtitle: cityEn,
          tags: ["landmarks", citySlug, landmarkSlug],
          status: workflowStatusInput,
        },
        hero: buildHeroByLocale(locale, localizedTitle),
        sections: buildSectionsByLocale(locale),
        navigation: {
          parentId: `landmarks:collection:${citySlug}`,
          childrenIds: [],
        },
        mediaRefs: {
          hero: [],
          sections: [],
        },
        audit: {
          createdAt: now,
          updatedAt: now,
          updatedBy: "agent-form",
        },
      };
    });

    const universal = {
      workflowStatus: workflowStatusInput,
      sections: buildSectionsByLocale("ru"),
      envelopesByLocale,
    };

    const payload = {
      city,
      landmark,
      citySlug,
      landmarkSlug,
      content,
      prompts,
      postcardGraphics,
      gallery,
      landmarkGeo,
      universal,
    };

    try {
      const response = await fetch("/api/agent/landmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.message ?? "Ошибка при сохранении");
      }

      setSaveStatus("success");
      setStatusMessage(result?.message ?? "Успешно сохранено");
      setLastOrchestratorTarget({ city: cityEn, landmark });
      persistOrchestratorTarget(cityEn, landmark);
      if (autoRunAfterSave || options?.runAfterSave) {
        await handleRunOrchestrator({
          mode: "data",
          city: cityEn,
          landmark,
        });
      }
      return true;
    } catch (error) {
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error && error.message
          ? error.message
          : "Ошибка при сохранении",
      );
      return false;
    }
  };

  const handleChildPatternsSubmit = async (text: string) => {
    if (childSaveStatus === "saving") return;

    setChildSaveStatus("saving");
    setChildStatusMessage("Сохраняем…");

    try {
      const response = await fetch("/api/agent/child-dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при сохранении");
      }

      const result = (await response.json()) as { message?: string };
      setChildSaveStatus("success");
      setChildStatusMessage(result.message ?? "Успешно сохранено");
    } catch (error) {
      setChildSaveStatus("error");
      setChildStatusMessage("Ошибка при сохранении");
    }
  };

  const handleRunOrchestrator = async (input: {
    mode: "data" | "rules";
    city: string;
    landmark: string;
  }) => {
    if (orchestratorStatus === "running") return;

    const citySlug = normalizeSlug(input.city);
    const landmarkSlug = normalizeSlug(input.landmark);
    if (!citySlug || !landmarkSlug) {
      setOrchestratorStatus("error");
      setOrchestratorMessage("Не указан город или достопримечательность.");
      return;
    }

    setOrchestratorStatus("running");
    setOrchestratorMessage("Пересобираем…");
    setLastOrchestratorTarget({ city: input.city, landmark: input.landmark });
    persistOrchestratorTarget(input.city, input.landmark);

    try {
      const response = await fetch("/api/agent/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: input.mode,
          citySlug,
          landmarkSlug,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "Ошибка при запуске.");
      }

      setOrchestratorStatus("success");
      setOrchestratorMessage(result.message ?? "Открытка пересобрана.");
    } catch (error) {
      setOrchestratorStatus("error");
      setOrchestratorMessage("Ошибка при пересборке.");
    }
  };

  const handleCreateBook = async () => {
    setActiveForm("landmark");
    const response = await routeAgentMessage(
      { skill: "formGenerator" },
      engine,
    );
    if (response.ok) {
      setSchema(response.data as AgentFormSchema);
    }
  };

  const handleSelectLandmarkForm = (formType: LandmarkFormType) => {
    setSelectedLandmarkForm(formType);
    setSchema(null);
    setActiveForm("landmarkForm");
  };

  const handleCreateChildPatterns = () => {
    setSchema(null);
    setActiveForm("childPatterns");
  };

  return (
    <div className="agent-panel">
      <Sidebar
        selectedLandmarkForm={selectedLandmarkForm}
        onSelectLandmarkForm={handleSelectLandmarkForm}
        onCreateBook={handleCreateBook}
        onCreateChildPatterns={handleCreateChildPatterns}
      />
      <div className="agent-main">
        <div className="agent-column">
          {activeForm === "childPatterns" ? (
            <ChildPatternsForm
              onSubmit={handleChildPatternsSubmit}
              saveStatus={childSaveStatus}
              statusMessage={childStatusMessage}
              isSubmitting={childSaveStatus === "saving"}
            />
          ) : activeForm === "landmarkForm" && selectedLandmarkForm ? (
            selectedLandmarkForm === "city" ? (
              <CityFormPanel />
            ) : selectedLandmarkForm === "module-home" ? (
              <ModuleHomeFormPanel />
            ) : selectedLandmarkForm === "collection-home" ? (
              <CollectionHomeFormPanel />
            ) : selectedLandmarkForm === "landmark-item" ? (
              <LandmarkFormPanel />
            ) : null
          ) : activeForm === "landmark" ? (
            <FormRenderer
              schema={schema}
              onSubmit={handleFormSubmit}
              onRunOrchestrator={handleRunOrchestrator}
              lastOrchestratorTarget={lastOrchestratorTarget}
              autoRunAfterSave={autoRunAfterSave}
              onToggleAutoRun={setAutoRunAfterSave}
              saveStatus={saveStatus}
              statusMessage={statusMessage}
              orchestratorStatus={orchestratorStatus}
              orchestratorMessage={orchestratorMessage}
              isSubmitting={saveStatus === "saving"}
              fieldErrors={fieldErrors}
            />
          ) : (
            <div className="agent-placeholder">
              <p>Выберите форму в левом меню</p>
            </div>
          )}
        </div>
        <div className="agent-column">
          <Chat onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
