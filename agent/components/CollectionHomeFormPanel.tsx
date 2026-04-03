"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./FormPanel.module.css";

type CityOption = { cityId: string; slug: string; label: string };
type LocaleCode = "en" | "de" | "ru" | "uk";

type Localized = Record<LocaleCode, string>;

type TextBlock = {
  en: string;
  de: string;
  ru: string;
  uk: string;
};

type IllustrationDraft = {
  image: string;
  caption: Localized;
  size: "small" | "compact" | "medium" | "threeQuarter" | "large";
  type: "ketty-drawing" | "photo" | "decor";
  position: "left" | "right" | "center";
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: number;
  insertWhere: "before" | "after";
  insertParagraph: number;
  anchor: string;
};

const emptyLocalized = (): Localized => ({ en: "", de: "", ru: "", uk: "" });

const createTextBlock = (): TextBlock => ({ en: "", de: "", ru: "", uk: "" });

const createIllustration = (): IllustrationDraft => ({
  image: "",
  caption: emptyLocalized(),
  size: "medium",
  type: "ketty-drawing",
  position: "right",
  wrap: true,
  shadow: false,
  border: false,
  rotate: 0,
  insertWhere: "after",
  insertParagraph: 1,
  anchor: "",
});

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");
const encodeMultiline = (value: string): string => value.replace(/\r?\n/g, "\\n");

const splitToParagraphs = (value: string): string[] => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (/\n\s*\n/.test(normalized)) {
    return normalized
      .split(/\n\s*\n+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return normalized
    .split(/\n+/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeBrokenValue = (value: string): string => {
  const trimmed = value.trim();
  if (/^illustration\[\d+\]\.[^:]+:\s*/i.test(trimmed)) {
    return "";
  }
  return trimmed;
};

const getScalar = (markdown: string, key: string): string => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}:\\s*(.*)$`, "m");
  const match = markdown.match(regex);
  return decodeMultiline(match?.[1] ?? "").trim();
};

const getIndexedBlocks = (markdown: string): TextBlock[] => {
  const indexes = Array.from(
    new Set(
      Array.from(markdown.matchAll(/^descriptionBlock\[(\d+)\]\.(en|de|ru|uk):/gm)).map(
        (match) => Number.parseInt(match[1], 10),
      ),
    ),
  ).sort((a, b) => a - b);

  const result = indexes.map((index) => ({
    en: getScalar(markdown, `descriptionBlock[${index}].en`),
    de: getScalar(markdown, `descriptionBlock[${index}].de`),
    ru: getScalar(markdown, `descriptionBlock[${index}].ru`),
    uk: getScalar(markdown, `descriptionBlock[${index}].uk`),
  }));

  if (result.length > 0) {
    return result;
  }

  const fallback = {
    en: getScalar(markdown, "description.en"),
    de: getScalar(markdown, "description.de"),
    ru: getScalar(markdown, "description.ru"),
    uk: getScalar(markdown, "description.uk"),
  };

  if (fallback.en || fallback.de || fallback.ru || fallback.uk) {
    return [fallback];
  }

  return [createTextBlock()];
};

const getIllustrations = (markdown: string): IllustrationDraft[] => {
  const indexes = Array.from(
    new Set(
      Array.from(markdown.matchAll(/^illustration\[(\d+)\]\./gm)).map((match) =>
        Number.parseInt(match[1], 10),
      ),
    ),
  ).sort((a, b) => a - b);

  return indexes
    .map((index) => {
      const size = getScalar(markdown, `illustration[${index}].size`);
      const type = getScalar(markdown, `illustration[${index}].type`);
      const position = getScalar(markdown, `illustration[${index}].position`);
      const insertWhere = getScalar(markdown, `illustration[${index}].insert.where`);

      return {
        image:
          getScalar(markdown, `illustration[${index}].image`) ||
          getScalar(markdown, `illustration[${index}].file`),
        caption: {
          en: normalizeBrokenValue(getScalar(markdown, `illustration[${index}].caption.en`)),
          de: normalizeBrokenValue(getScalar(markdown, `illustration[${index}].caption.de`)),
          ru: normalizeBrokenValue(getScalar(markdown, `illustration[${index}].caption.ru`)),
          uk: normalizeBrokenValue(getScalar(markdown, `illustration[${index}].caption.uk`)),
        },
        size:
          size === "small" ||
          size === "compact" ||
          size === "medium" ||
          size === "threeQuarter" ||
          size === "large"
            ? size
            : "medium",
        type:
          type === "ketty-drawing" || type === "photo" || type === "decor"
            ? type
            : "ketty-drawing",
        position:
          position === "left" || position === "right" || position === "center"
            ? position
            : "right",
        wrap: getScalar(markdown, `illustration[${index}].wrap`) !== "false",
        shadow: getScalar(markdown, `illustration[${index}].shadow`) === "true",
        border: getScalar(markdown, `illustration[${index}].border`) === "true",
        rotate: Number.parseFloat(getScalar(markdown, `illustration[${index}].rotate`)) || 0,
        insertWhere: insertWhere === "before" ? "before" : "after",
        insertParagraph:
          Math.max(
            1,
            Math.floor(
              Number.parseFloat(getScalar(markdown, `illustration[${index}].insert.paragraph`)) || 1,
            ),
          ) || 1,
        anchor: normalizeBrokenValue(getScalar(markdown, `illustration[${index}].anchor`)),
      } as IllustrationDraft;
    })
    .filter((item) => item.image);
};

export default function CollectionHomeFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [panorama, setPanorama] = useState("");
  const [greeting, setGreeting] = useState<Localized>(emptyLocalized());
  const [invitation, setInvitation] = useState<Localized>(emptyLocalized());
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([createTextBlock()]);
  const [illustrations, setIllustrations] = useState<IllustrationDraft[]>([]);

  const normalizedTextBlocks = useMemo(() => {
    return textBlocks.filter((block) => Boolean(block.en || block.de || block.ru || block.uk));
  }, [textBlocks]);

  const paragraphPreview = useMemo(() => {
    const source =
      normalizedTextBlocks.map((block) => block.ru.trim()).filter(Boolean).join("\n\n") ||
      normalizedTextBlocks.map((block) => block.en.trim()).filter(Boolean).join("\n\n") ||
      normalizedTextBlocks.map((block) => block.de.trim()).filter(Boolean).join("\n\n") ||
      normalizedTextBlocks.map((block) => block.uk.trim()).filter(Boolean).join("\n\n");

    return splitToParagraphs(source);
  }, [normalizedTextBlocks]);

  const loadForm = async (selectedCityId?: string) => {
    setLoading(true);
    setMessage("");

    try {
      const query = selectedCityId
        ? `?cityId=${encodeURIComponent(selectedCityId)}`
        : cityId
          ? `?cityId=${encodeURIComponent(cityId)}`
          : "";
      const res = await fetch(`/api/agent/forms/collection-home${query}`);
      const payload = await res.json();

      if (!res.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не удалось загрузить форму.");
      }

      const options = Array.isArray(payload.cityOptions) ? (payload.cityOptions as CityOption[]) : [];
      setCityOptions(options);

      const md = payload.content || "";
      const parsedCityId = getScalar(md, "cityId");
      const parsedCitySlug = getScalar(md, "citySlug");
      const fallbackSlug = getScalar(md, "slug");

      const resolvedCityId = parsedCityId || selectedCityId || cityId;
      const matchedCity = options.find((item) => item.cityId === resolvedCityId);
      const resolvedCitySlug = parsedCitySlug || fallbackSlug || matchedCity?.slug || "";

      setCityId(resolvedCityId);
      setCitySlug(resolvedCitySlug);
      setPanorama(getScalar(md, "panorama"));

      setGreeting({
        en: getScalar(md, "greeting.en"),
        de: getScalar(md, "greeting.de"),
        ru: getScalar(md, "greeting.ru"),
        uk: getScalar(md, "greeting.uk"),
      });

      setInvitation({
        en: getScalar(md, "invitation.en"),
        de: getScalar(md, "invitation.de"),
        ru: getScalar(md, "invitation.ru"),
        uk: getScalar(md, "invitation.uk"),
      });

      setTextBlocks(getIndexedBlocks(md));
      setIllustrations(getIllustrations(md));

      setMessage("Форма загружена");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadForm();
  }, []);

  const buildMarkdown = () => {
    const lines: string[] = [];
    const blocksToSave = normalizedTextBlocks.length > 0 ? normalizedTextBlocks : [createTextBlock()];
    const description = {
      en: blocksToSave.map((b) => b.en.trim()).filter(Boolean).join("\n\n"),
      de: blocksToSave.map((b) => b.de.trim()).filter(Boolean).join("\n\n"),
      ru: blocksToSave.map((b) => b.ru.trim()).filter(Boolean).join("\n\n"),
      uk: blocksToSave.map((b) => b.uk.trim()).filter(Boolean).join("\n\n"),
    };

    lines.push("# Форма страницы города (collection-home)");
    lines.push("");
    lines.push("## 1. Выбор города");
    lines.push("");
    if (cityId) lines.push(`cityId: ${cityId}`);
    lines.push(`citySlug: ${citySlug}`);
    lines.push("");

    lines.push("## 2. Панорама города");
    lines.push("");
    lines.push(`panorama: ${panorama}`);
    lines.push("");

    lines.push("## 3. Приветствие Кетти");
    lines.push("");
    lines.push(`greeting.en: ${encodeMultiline(greeting.en)}`);
    lines.push(`greeting.de: ${encodeMultiline(greeting.de)}`);
    lines.push(`greeting.ru: ${encodeMultiline(greeting.ru)}`);
    lines.push(`greeting.uk: ${encodeMultiline(greeting.uk)}`);
    lines.push("");

    lines.push("## 4. Описание (восприятие Кетти)");
    lines.push("");
    lines.push(`description.en: ${encodeMultiline(description.en)}`);
    lines.push(`description.de: ${encodeMultiline(description.de)}`);
    lines.push(`description.ru: ${encodeMultiline(description.ru)}`);
    lines.push(`description.uk: ${encodeMultiline(description.uk)}`);
    lines.push("");

    lines.push("## 4.1 Динамические текстовые блоки");
    lines.push("");
    blocksToSave.forEach((block, index) => {
      lines.push(`descriptionBlock[${index}].en: ${encodeMultiline(block.en)}`);
      lines.push(`descriptionBlock[${index}].de: ${encodeMultiline(block.de)}`);
      lines.push(`descriptionBlock[${index}].ru: ${encodeMultiline(block.ru)}`);
      lines.push(`descriptionBlock[${index}].uk: ${encodeMultiline(block.uk)}`);
      lines.push("");
    });

    lines.push("## 5. Иллюстрации (динамический список)");
    lines.push("");
    illustrations.forEach((item, index) => {
      lines.push(`illustration[${index}].image: ${item.image}`);
      lines.push(`illustration[${index}].caption.en: ${encodeMultiline(item.caption.en)}`);
      lines.push(`illustration[${index}].caption.de: ${encodeMultiline(item.caption.de)}`);
      lines.push(`illustration[${index}].caption.ru: ${encodeMultiline(item.caption.ru)}`);
      lines.push(`illustration[${index}].caption.uk: ${encodeMultiline(item.caption.uk)}`);
      lines.push(`illustration[${index}].size: ${item.size}`);
      lines.push(`illustration[${index}].type: ${item.type}`);
      lines.push(`illustration[${index}].position: ${item.position}`);
      lines.push(`illustration[${index}].wrap: ${item.wrap ? "true" : "false"}`);
      lines.push(`illustration[${index}].shadow: ${item.shadow ? "true" : "false"}`);
      lines.push(`illustration[${index}].border: ${item.border ? "true" : "false"}`);
      lines.push(`illustration[${index}].rotate: ${item.rotate}`);
      lines.push(`illustration[${index}].insert.where: ${item.insertWhere}`);
      lines.push(`illustration[${index}].insert.paragraph: ${item.insertParagraph}`);
      lines.push(`illustration[${index}].anchor: ${item.anchor}`);
      lines.push("");
    });

    lines.push("## 6. Приглашение Кетти");
    lines.push("");
    lines.push(`invitation.en: ${encodeMultiline(invitation.en)}`);
    lines.push(`invitation.de: ${encodeMultiline(invitation.de)}`);
    lines.push(`invitation.ru: ${encodeMultiline(invitation.ru)}`);
    lines.push(`invitation.uk: ${encodeMultiline(invitation.uk)}`);
    lines.push("");

    return lines.join("\n");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const markdown = buildMarkdown();
      const res = await fetch("/api/agent/forms/collection-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.message || "Ошибка сохранения");
      }

      setMessage(payload?.message || "Форма сохранена");
      await loadForm(cityId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadImageFile = async (
    file: File,
    fieldName: string,
    onDone: (path: string) => void,
  ) => {
    setUploadingKey(fieldName);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", fieldName);

      const response = await fetch("/api/agent/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; path?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.path) {
        throw new Error(payload?.message || "Не удалось загрузить изображение");
      }

      onDone(payload.path);
      setMessage("Изображение загружено");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingKey(null);
    }
  };

  const updateTextBlock = (index: number, locale: LocaleCode, value: string) => {
    setTextBlocks((prev) =>
      prev.map((block, idx) => (idx === index ? { ...block, [locale]: value } : block)),
    );
  };

  const updateIllustration = <K extends keyof IllustrationDraft>(
    index: number,
    key: K,
    value: IllustrationDraft[K],
  ) => {
    setIllustrations((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  if (loading) {
    return <div className={styles.panel}>Загрузка...</div>;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Форма страницы города</h2>
        <p className={styles.subtitle}>Контрактная версия с динамическими текстовыми блоками и иллюстрациями.</p>
      </div>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>1. Город</h3>
        <div className={styles.builderControlRow}>
          <div className={styles.field}>
            <label className={styles.label}>ID города (cityId)</label>
            <select
              className={styles.select}
              value={cityId}
              onChange={(event) => {
                const nextCityId = event.target.value;
                setCityId(nextCityId);
                const matched = cityOptions.find((item) => item.cityId === nextCityId);
                if (matched?.slug) {
                  setCitySlug(matched.slug);
                }
                void loadForm(nextCityId);
              }}
              disabled={saving}
            >
              <option value="">Выберите город</option>
              {cityOptions.map((item) => (
                <option key={item.cityId} value={item.cityId}>
                  {item.label} ({item.slug})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Слаг города (citySlug)</label>
            <input className={styles.input} value={citySlug} onChange={(event) => setCitySlug(event.target.value)} />
          </div>
        </div>
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>2. Панорама города</h3>
        <div className={styles.builderControlRow}>
          <div className={styles.field}>
            <label className={styles.label}>Путь к изображению (panorama)</label>
            <input className={styles.input} value={panorama} onChange={(event) => setPanorama(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Загрузка панорамы</label>
            <input
              id="collection-home-panorama-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                void uploadImageFile(file, "city-panorama", setPanorama);
                event.currentTarget.value = "";
              }}
            />
            <button
              className="agent-button"
              type="button"
              onClick={() => {
                const input = document.getElementById("collection-home-panorama-upload") as HTMLInputElement | null;
                input?.click();
              }}
              disabled={Boolean(uploadingKey)}
            >
              {uploadingKey === "city-panorama" ? "Загрузка..." : panorama ? "Заменить панораму" : "Загрузить панораму"}
            </button>
          </div>
        </div>

        {panorama ? (
          <div className={styles.imagePreviewBox}>
            <img src={panorama} alt="Панорама города" />
          </div>
        ) : null}
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>3. Приветствие</h3>
        <div className={styles.localeFieldGrid}>
          {(["en", "de", "ru", "uk"] as const).map((locale) => (
            <div key={`greeting-${locale}`} className={styles.field}>
              <label className={styles.label}>{`Приветствие (${locale})`}</label>
              <textarea
                className={styles.textarea}
                value={greeting[locale]}
                onChange={(event) => setGreeting((prev) => ({ ...prev, [locale]: event.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>4. Динамические текстовые блоки</h3>
          <button className="agent-button" type="button" onClick={() => setTextBlocks((prev) => [...prev, createTextBlock()])}>
            Добавить блок текста
          </button>
        </div>

        <details className={styles.builderRawDetails}>
          <summary>Превью нумерации абзацев для вставки иллюстраций</summary>
          {paragraphPreview.length > 0 ? (
            <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {paragraphPreview.map((paragraph, index) => (
                <li key={`paragraph-preview-${index}`} style={{ marginBottom: 6 }}>
                  {paragraph.length > 180 ? `${paragraph.slice(0, 180)}...` : paragraph}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ margin: "8px 0 0" }}>Добавьте текстовые блоки, чтобы увидеть нумерацию абзацев.</p>
          )}
        </details>

        {textBlocks.map((block, index) => (
          <div key={`text-block-${index}`} className={styles.builderBlockCard}>
            <div className={styles.builderBlockHeader}>
              <h4 className={styles.builderBlockTitle}>Текстовый блок #{index + 1}</h4>
              <button
                className="agent-button"
                type="button"
                onClick={() => setTextBlocks((prev) => prev.filter((_, idx) => idx !== index))}
                disabled={textBlocks.length <= 1}
              >
                Удалить
              </button>
            </div>
            <div className={styles.localeFieldGrid}>
              {(["en", "de", "ru", "uk"] as const).map((locale) => (
                <div key={`text-${index}-${locale}`} className={styles.field}>
                  <label className={styles.label}>{`Текст блока (${locale})`}</label>
                  <textarea
                    className={styles.textarea}
                    value={block[locale]}
                    onChange={(event) => updateTextBlock(index, locale, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>5. Иллюстрации</h3>
          <button className="agent-button" type="button" onClick={() => setIllustrations((prev) => [...prev, createIllustration()])}>
            Добавить иллюстрацию
          </button>
        </div>
        {illustrations.map((item, index) => (
          <div key={`illustration-${index}`} className={styles.builderBlockCard}>
            <div className={styles.builderBlockHeader}>
              <h4 className={styles.builderBlockTitle}>Иллюстрация #{index + 1}</h4>
              <button
                className="agent-button"
                type="button"
                onClick={() => setIllustrations((prev) => prev.filter((_, idx) => idx !== index))}
              >
                Удалить
              </button>
            </div>

            <div className={styles.builderControlRow}>
              <div className={styles.field}>
                <label className={styles.label}>Путь к файлу (image)</label>
                <input
                  className={styles.input}
                  value={item.image}
                  onChange={(event) => updateIllustration(index, "image", event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Размер</label>
                <select
                  className={styles.select}
                  value={item.size}
                  onChange={(event) => updateIllustration(index, "size", event.target.value as IllustrationDraft["size"])}
                >
                  <option value="small">Маленький (30%)</option>
                  <option value="compact">Компактный (40%)</option>
                  <option value="medium">Средний (50%)</option>
                  <option value="threeQuarter">Три четверти (75%)</option>
                  <option value="large">Большой (100%)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Тип</label>
                <select
                  className={styles.select}
                  value={item.type}
                  onChange={(event) => updateIllustration(index, "type", event.target.value as IllustrationDraft["type"])}
                >
                  <option value="ketty-drawing">Рисунок Кетти</option>
                  <option value="photo">Фото</option>
                  <option value="decor">Декор</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Позиция</label>
                <select
                  className={styles.select}
                  value={item.position}
                  onChange={(event) => updateIllustration(index, "position", event.target.value as IllustrationDraft["position"])}
                >
                  <option value="left">Слева</option>
                  <option value="right">Справа</option>
                  <option value="center">По центру</option>
                </select>
              </div>
            </div>

            <div className={styles.builderControlRow}>
              <div className={styles.field}>
                <label className={styles.label}>Загрузка иллюстрации</label>
                <input
                  id={`collection-home-illustration-upload-${index}`}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) return;
                    void uploadImageFile(file, `city-illustration-${index}`, (imagePath) =>
                      updateIllustration(index, "image", imagePath),
                    );
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  className="agent-button"
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(
                      `collection-home-illustration-upload-${index}`,
                    ) as HTMLInputElement | null;
                    input?.click();
                  }}
                  disabled={Boolean(uploadingKey)}
                >
                  {uploadingKey === `city-illustration-${index}`
                    ? "Загрузка..."
                    : item.image
                      ? "Заменить иллюстрацию"
                      : "Загрузить иллюстрацию"}
                </button>
              </div>
            </div>

            {item.image ? (
              <div className={styles.imagePreviewBox}>
                <img src={item.image} alt={`Иллюстрация ${index + 1}`} />
              </div>
            ) : null}

            <div className={styles.builderControlRow}>
              <div className={styles.field}>
                <label className={styles.label}>Поворот (rotate)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={item.rotate}
                  onChange={(event) => updateIllustration(index, "rotate", Number.parseFloat(event.target.value) || 0)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Вставка: до/после</label>
                <select
                  className={styles.select}
                  value={item.insertWhere}
                  onChange={(event) => updateIllustration(index, "insertWhere", event.target.value as "before" | "after")}
                >
                  <option value="before">Перед абзацем</option>
                  <option value="after">После абзаца</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Номер абзаца</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={item.insertParagraph}
                  onChange={(event) => updateIllustration(index, "insertParagraph", Math.max(1, Number.parseInt(event.target.value || "1", 10)))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Якорь (anchor)</label>
                <input
                  className={styles.input}
                  value={item.anchor}
                  onChange={(event) => updateIllustration(index, "anchor", event.target.value)}
                  placeholder="Оставьте пустым, если не используется"
                />
              </div>
            </div>

            <div className={styles.builderChecksRow}>
              <label>
                <input
                  type="checkbox"
                  checked={item.wrap}
                  onChange={(event) => updateIllustration(index, "wrap", event.target.checked)}
                />
                Обтекание
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.shadow}
                  onChange={(event) => updateIllustration(index, "shadow", event.target.checked)}
                />
                Тень
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.border}
                  onChange={(event) => updateIllustration(index, "border", event.target.checked)}
                />
                Рамка
              </label>
            </div>

            <div className={styles.localeFieldGrid}>
              {(["en", "de", "ru", "uk"] as const).map((locale) => (
                <div key={`caption-${index}-${locale}`} className={styles.field}>
                  <label className={styles.label}>{`Подпись (${locale})`}</label>
                  <textarea
                    className={styles.textarea}
                    value={item.caption[locale]}
                    onChange={(event) =>
                      updateIllustration(index, "caption", {
                        ...item.caption,
                        [locale]: event.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>6. Приглашение</h3>
        <div className={styles.localeFieldGrid}>
          {(["en", "de", "ru", "uk"] as const).map((locale) => (
            <div key={`invitation-${locale}`} className={styles.field}>
              <label className={styles.label}>{`Приглашение (${locale})`}</label>
              <textarea
                className={styles.textarea}
                value={invitation[locale]}
                onChange={(event) => setInvitation((prev) => ({ ...prev, [locale]: event.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        <button className="agent-button" onClick={handleSave} disabled={saving || !citySlug}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <button className="agent-button" onClick={() => void loadForm(cityId)} disabled={saving}>
          Перезагрузить
        </button>
      </div>

      {message ? <div className={styles.statusSuccess}>{message}</div> : null}
    </div>
  );
}
