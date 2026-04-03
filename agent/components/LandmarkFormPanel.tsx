"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type LandmarkOption = {
  slug: string;
  name: string;
};

type CityOption = {
  cityId: string;
  slug: string;
  label: string;
  landmarks?: LandmarkOption[];
};

type LocaleCode = "en" | "de" | "ru" | "uk";

type LocalizedText = Record<LocaleCode, string>;

type ImageDraft = {
  file: string;
  size: string;
  type: string;
  position: string;
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: string;
  insertWhere: string;
  insertParagraph: string;
  anchor: string;
};

type GalleryDraft = {
  file: string;
  alt: string;
};

const LOCALES: LocaleCode[] = ["en", "de", "ru", "uk"];

const emptyLocalized = (): LocalizedText => ({
  en: "",
  de: "",
  ru: "",
  uk: "",
});

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");
const encodeMultiline = (value: string): string =>
  value.replace(/\r?\n/g, "\\n");

const parseField = (markdown: string, key: string): string => {
  const m = markdown.match(new RegExp(`^${key}:[ \\t]*([^\\r\\n]*)$`, "m"));
  return m ? m[1].trim() : "";
};

const parseMultiline = (markdown: string, key: string): string => {
  const single = parseField(markdown, key);
  if (single) return decodeMultiline(single);

  const regex = new RegExp(
    `^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^[A-Za-z0-9_.\\[\\]]+\\s*:|^##|\\Z)`,
    "m",
  );
  const match = markdown.match(regex);
  return match?.[1] || "";
};

const parseBoolean = (value: string, fallback: boolean): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
};

const createEmptyIllustration = (): ImageDraft => ({
  file: "",
  size: "medium",
  type: "ketty-drawing",
  position: "right",
  wrap: true,
  shadow: false,
  border: false,
  rotate: "0",
  insertWhere: "after",
  insertParagraph: "1",
  anchor: "",
});

const createEmptyGalleryItem = (): GalleryDraft => ({
  file: "",
  alt: "",
});

const parseLocalized = (markdown: string, prefix: string): LocalizedText => ({
  en: parseMultiline(markdown, `${prefix}\\.en`),
  de: parseMultiline(markdown, `${prefix}\\.de`),
  ru: parseMultiline(markdown, `${prefix}\\.ru`),
  uk: parseMultiline(markdown, `${prefix}\\.uk`),
});

const hasLocalizedValue = (value: LocalizedText): boolean =>
  LOCALES.some((locale) => value[locale].trim().length > 0);

const parseIllustrations = (markdown: string): ImageDraft[] => {
  const indices = new Set<number>();
  const pattern = /illustration\[(\d+)\]\.(file|prompt):[ \t]*([^\r\n]*)$/gm;

  for (const match of markdown.matchAll(pattern)) {
    indices.add(Number.parseInt(match[1], 10));
  }

  if (indices.size > 0) {
    return [...indices]
      .sort((a, b) => a - b)
      .map((idx) => ({
        ...createEmptyIllustration(),
        file: parseField(markdown, `illustration\\[${idx}\\]\\.file`),
        size:
          parseField(markdown, `illustration\\[${idx}\\]\\.size`) || "medium",
        type:
          parseField(markdown, `illustration\\[${idx}\\]\\.type`) ||
          "ketty-drawing",
        position:
          parseField(markdown, `illustration\\[${idx}\\]\\.position`) ||
          "right",
        wrap: parseBoolean(
          parseField(markdown, `illustration\\[${idx}\\]\\.wrap`),
          true,
        ),
        shadow: parseBoolean(
          parseField(markdown, `illustration\\[${idx}\\]\\.shadow`),
          false,
        ),
        border: parseBoolean(
          parseField(markdown, `illustration\\[${idx}\\]\\.border`),
          false,
        ),
        rotate:
          parseField(markdown, `illustration\\[${idx}\\]\\.rotate`) || "0",
        insertWhere:
          parseField(markdown, `illustration\\[${idx}\\]\\.insert\\.where`) ||
          "after",
        insertParagraph:
          parseField(
            markdown,
            `illustration\\[${idx}\\]\\.insert\\.paragraph`,
          ) || "1",
        anchor: parseField(markdown, `illustration\\[${idx}\\]\\.anchor`) || "",
      }))
      .filter((item) => item.file || item.anchor);
  }

  const legacyIndices = new Set<number>();
  const legacyPattern = /image\[(\d+)\]\.(file|prompt):[ \t]*([^\r\n]*)$/gm;
  for (const match of markdown.matchAll(legacyPattern)) {
    legacyIndices.add(Number.parseInt(match[1], 10));
  }

  if (legacyIndices.size > 0) {
    return [...legacyIndices]
      .sort((a, b) => a - b)
      .map((idx) => ({
        ...createEmptyIllustration(),
        file: parseField(markdown, `image\\[${idx}\\]\\.file`),
        size: parseField(markdown, `image\\[${idx}\\]\\.size`) || "medium",
        type:
          parseField(markdown, `image\\[${idx}\\]\\.type`) || "ketty-drawing",
        position:
          parseField(markdown, `image\\[${idx}\\]\\.position`) || "right",
        wrap: parseBoolean(
          parseField(markdown, `image\\[${idx}\\]\\.wrap`),
          true,
        ),
        shadow: parseBoolean(
          parseField(markdown, `image\\[${idx}\\]\\.shadow`),
          false,
        ),
        border: parseBoolean(
          parseField(markdown, `image\\[${idx}\\]\\.border`),
          false,
        ),
        rotate: parseField(markdown, `image\\[${idx}\\]\\.rotate`) || "0",
        insertWhere:
          parseField(markdown, `image\\[${idx}\\]\\.insert\\.where`) || "after",
        insertParagraph:
          parseField(markdown, `image\\[${idx}\\]\\.insert\\.paragraph`) || "1",
        anchor: parseField(markdown, `image\\[${idx}\\]\\.anchor`) || "",
      }))
      .filter((item) => item.file || item.anchor);
  }

  const legacy: ImageDraft[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const file = parseField(markdown, `image${i}File`);
    if (!file) continue;
    legacy.push({
      ...createEmptyIllustration(),
      file,
    });
  }

  return legacy;
};

const parseGalleryItems = (markdown: string): GalleryDraft[] => {
  const indices = new Set<number>();
  const pattern = /gallery\[(\d+)\]\.(file|alt):[ \t]*([^\r\n]*)$/gm;

  for (const match of markdown.matchAll(pattern)) {
    indices.add(Number.parseInt(match[1], 10));
  }

  if (indices.size === 0) {
    return [];
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((idx) => ({
      file: parseField(markdown, `gallery\\[${idx}\\]\\.file`),
      alt: parseMultiline(markdown, `gallery\\[${idx}\\]\\.alt`),
    }))
    .filter((item) => item.file || item.alt);
};

export default function LandmarkFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState("");

  const [landmarkMode, setLandmarkMode] = useState<"select" | "create">(
    "select",
  );
  const [landmarkExistingSlug, setLandmarkExistingSlug] = useState("");
  const [landmark, setLandmark] = useState("");
  const [landmarkSlug, setLandmarkSlug] = useState("");

  const [greeting, setGreeting] = useState<LocalizedText>(emptyLocalized());
  const [content, setContent] = useState<LocalizedText>(emptyLocalized());
  const [farewell, setFarewell] = useState<LocalizedText>(emptyLocalized());
  const [invitation, setInvitation] = useState<LocalizedText>(emptyLocalized());
  const [invitationBookLink, setInvitationBookLink] =
    useState<LocalizedText>(emptyLocalized());

  const [stampFile, setStampFile] = useState("");
  const [illustrations, setIllustrations] = useState<ImageDraft[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryDraft[]>([]);

  const selectedCity = useMemo(
    () => cityOptions.find((item) => item.cityId === cityId) ?? null,
    [cityId, cityOptions],
  );

  const cityLandmarks = useMemo(
    () =>
      Array.isArray(selectedCity?.landmarks) ? selectedCity.landmarks : [],
    [selectedCity],
  );

  useEffect(() => {
    loadForm();
  }, []);

  useEffect(() => {
    if (landmarkMode !== "select") return;
    if (!landmarkExistingSlug || !cityLandmarks.length) return;

    const matched = cityLandmarks.find(
      (item) => item.slug === landmarkExistingSlug,
    );
    if (!matched) return;

    if (!landmark.trim()) {
      setLandmark(matched.name);
    }
    if (!landmarkSlug.trim()) {
      setLandmarkSlug(matched.slug);
    }
  }, [
    cityLandmarks,
    landmark,
    landmarkExistingSlug,
    landmarkMode,
    landmarkSlug,
  ]);

  const resetEditableFields = () => {
    setLandmarkExistingSlug("");
    setLandmark("");
    setLandmarkSlug("");
    setGreeting(emptyLocalized());
    setContent(emptyLocalized());
    setFarewell(emptyLocalized());
    setInvitation(emptyLocalized());
    setInvitationBookLink(emptyLocalized());
    setStampFile("");
    setIllustrations([]);
    setGalleryItems([]);
  };

  const loadForm = async (nextCityId?: string, nextLandmarkSlug?: string) => {
    setLoading(true);
    try {
      const effectiveCityId = (nextCityId ?? cityId).trim();
      const effectiveLandmarkSlug = (
        nextLandmarkSlug ?? landmarkExistingSlug
      ).trim();
      const query =
        effectiveCityId && effectiveLandmarkSlug
          ? `?cityId=${encodeURIComponent(effectiveCityId)}&landmarkSlug=${encodeURIComponent(effectiveLandmarkSlug)}`
          : "";

      const response = await fetch(`/api/agent/forms/landmark${query}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.message ?? "Не удалось загрузить форму");
      }

      const md = String(payload.content || "");
      const options = Array.isArray(payload.cityOptions)
        ? (payload.cityOptions as CityOption[])
        : [];
      setCityOptions(options);

      const parsedCityId = parseField(md, "cityId");
      const parsedLandmarkMode = parseField(md, "landmarkMode");
      const parsedExistingSlug =
        parseField(md, "landmarkExistingSlug") ||
        parseField(md, "landmarkSlug");
      const parsedLandmark =
        parseField(md, "landmark") || parseField(md, "landmarkTitle");
      const parsedLandmarkSlug = parseField(md, "landmarkSlug");

      const cityIdToSet = parsedCityId || effectiveCityId;
      const existingSlugToSet = parsedExistingSlug || effectiveLandmarkSlug;
      const landmarkSlugToSet = parsedLandmarkSlug || existingSlugToSet;
      const cityForLabel = options.find((item) => item.cityId === cityIdToSet);
      const landmarkLabel =
        cityForLabel?.landmarks?.find((item) => item.slug === existingSlugToSet)
          ?.name || "";

      setCityId(cityIdToSet);
      setLandmarkMode(parsedLandmarkMode === "create" ? "create" : "select");
      setLandmarkExistingSlug(existingSlugToSet);
      setLandmark(parsedLandmark || landmarkLabel);
      setLandmarkSlug(landmarkSlugToSet);

      const parsedGreeting = parseLocalized(md, "greeting");
      const parsedContent = parseLocalized(md, "content");
      const parsedFarewell = parseLocalized(md, "farewell");
      const parsedInvitation = parseLocalized(md, "invitation");
      const parsedInvitationBookLink = parseLocalized(md, "invitationBookLink");

      if (!hasLocalizedValue(parsedGreeting)) {
        parsedGreeting.ru = parseMultiline(md, "greeting") || "Милый друг,";
      }

      if (!hasLocalizedValue(parsedInvitation)) {
        parsedInvitation.ru =
          parseMultiline(md, "bookInvite") || "Читать полную историю в книге";
      }

      if (!hasLocalizedValue(parsedFarewell)) {
        parsedFarewell.ru =
          parseMultiline(md, "footer") || "Обнимаю!  Твоя Кетти 🌟";
      }

      if (!hasLocalizedValue(parsedInvitationBookLink)) {
        const legacyBookLink = parseField(md, "bookLink");
        if (legacyBookLink) {
          parsedInvitationBookLink.ru = legacyBookLink;
        }
      }

      setGreeting(parsedGreeting);
      setContent(parsedContent);
      setFarewell(parsedFarewell);
      setInvitation(parsedInvitation);
      setInvitationBookLink(parsedInvitationBookLink);

      setStampFile(
        parseField(md, "stamp\\.file") || parseField(md, "stampImage"),
      );
      setIllustrations(parseIllustrations(md));
      setGalleryItems(parseGalleryItems(md));

      setMessage("Форма загружена");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalized = (
    setter: React.Dispatch<React.SetStateAction<LocalizedText>>,
    locale: LocaleCode,
    value: string,
  ) => {
    setter((prev) => ({ ...prev, [locale]: value }));
  };

  const updateIllustration = (index: number, patch: Partial<ImageDraft>) => {
    setIllustrations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateGalleryItem = (index: number, patch: Partial<GalleryDraft>) => {
    setGalleryItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const uploadImageFile = async (
    file: File,
    fieldName: string,
    onDone: (path: string) => void,
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", fieldName);

      const response = await fetch("/api/agent/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setMessage(
          `Ошибка загрузки файла: ${error?.message ?? response.statusText}`,
        );
        return;
      }

      const payload = await response.json();
      onDone(payload.path || "");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${String(error)}`);
    }
  };

  const buildMarkdown = () => {
    const lines: string[] = [];

    lines.push("# Форма достопримечательности (landmark-item)");
    lines.push("");

    lines.push("## 1. Город и достопримечательность");
    lines.push("");
    lines.push(`cityId: ${cityId}`);
    lines.push(`landmarkMode: ${landmarkMode}`);
    lines.push(
      `landmarkExistingSlug: ${landmarkMode === "select" ? landmarkExistingSlug : ""}`,
    );
    lines.push(`landmark: ${landmark}`);
    lines.push(`landmarkSlug: ${landmarkSlug}`);
    lines.push("");

    lines.push("## 2. Тексты открытки");
    lines.push("");
    for (const locale of LOCALES) {
      lines.push(`greeting.${locale}: ${encodeMultiline(greeting[locale])}`);
    }
    lines.push("");

    for (const locale of LOCALES) {
      lines.push(`content.${locale}: ${encodeMultiline(content[locale])}`);
    }
    lines.push("");

    for (const locale of LOCALES) {
      lines.push(`farewell.${locale}: ${encodeMultiline(farewell[locale])}`);
    }
    lines.push("");

    for (const locale of LOCALES) {
      lines.push(
        `invitation.${locale}: ${encodeMultiline(invitation[locale])}`,
      );
      lines.push(
        `invitationBookLink.${locale}: ${encodeMultiline(invitationBookLink[locale])}`,
      );
    }
    lines.push("");

    lines.push("## 3. Иллюстрации");
    lines.push("");
    lines.push(`stamp.file: ${stampFile}`);
    lines.push("");

    illustrations.forEach((item, index) => {
      lines.push(`illustration[${index}].file: ${item.file}`);
      lines.push(`illustration[${index}].size: ${item.size}`);
      lines.push(`illustration[${index}].type: ${item.type}`);
      lines.push(`illustration[${index}].position: ${item.position}`);
      lines.push(
        `illustration[${index}].wrap: ${item.wrap ? "true" : "false"}`,
      );
      lines.push(
        `illustration[${index}].shadow: ${item.shadow ? "true" : "false"}`,
      );
      lines.push(
        `illustration[${index}].border: ${item.border ? "true" : "false"}`,
      );
      lines.push(`illustration[${index}].rotate: ${item.rotate}`);
      lines.push(`illustration[${index}].insert.where: ${item.insertWhere}`);
      lines.push(
        `illustration[${index}].insert.paragraph: ${item.insertParagraph}`,
      );
      lines.push(`illustration[${index}].anchor: ${item.anchor}`);
      lines.push("");
    });

    lines.push("## 4. Галерея изображений");
    lines.push("");

    galleryItems.forEach((item, index) => {
      lines.push(`gallery[${index}].file: ${item.file}`);
      lines.push(`gallery[${index}].alt: ${encodeMultiline(item.alt)}`);
      lines.push("");
    });

    lines.push("## 5. Справочник городов (read-only)");
    lines.push("");
    lines.push("Список городов загружается автоматически при открытии формы.");

    return lines.join("\n");
  };

  const handleSave = async () => {
    if (!cityId.trim()) {
      setMessage("Выберите cityId.");
      return;
    }

    if (landmarkMode === "select" && !landmarkExistingSlug.trim()) {
      setMessage("Выберите достопримечательность из списка.");
      return;
    }

    if (landmarkMode === "create" && !landmark.trim()) {
      setMessage("Заполните название достопримечательности.");
      return;
    }

    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const response = await fetch("/api/agent/forms/landmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Ошибка сохранения формы");
      }

      setMessage("Форма сохранена");
    } catch (error) {
      setMessage(`Ошибка сохранения: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма открытки достопримечательности</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          1. Город и достопримечательность
        </legend>

        <div className={styles.field}>
          <label className={styles.label}>Город (cityId)</label>
          <select
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              resetEditableFields();
            }}
          >
            <option value="">(выберите город)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Режим достопримечательности</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label>
              <input
                type="radio"
                checked={landmarkMode === "select"}
                onChange={() => setLandmarkMode("select")}
              />
              Выбрать существующую
            </label>
            <label>
              <input
                type="radio"
                checked={landmarkMode === "create"}
                onChange={() => {
                  setLandmarkMode("create");
                  resetEditableFields();
                }}
              />
              Создать новую
            </label>
          </div>
        </div>

        {landmarkMode === "select" ? (
          <div className={styles.field}>
            <label className={styles.label}>
              Достопримечательность (выбор)
            </label>
            <select
              value={landmarkExistingSlug}
              onChange={(e) => {
                const nextSlug = e.target.value;
                setLandmarkExistingSlug(nextSlug);
                const matched = cityLandmarks.find(
                  (item) => item.slug === nextSlug,
                );
                setLandmark(matched?.name || "");
                setLandmarkSlug(nextSlug || "");
                if (cityId && nextSlug) {
                  void loadForm(cityId, nextSlug);
                } else if (!nextSlug) {
                  setLandmark("");
                  setLandmarkSlug("");
                  setGreeting(emptyLocalized());
                  setContent(emptyLocalized());
                  setFarewell(emptyLocalized());
                  setInvitation(emptyLocalized());
                  setInvitationBookLink(emptyLocalized());
                  setStampFile("");
                  setIllustrations([]);
                  setGalleryItems([]);
                }
              }}
            >
              <option value="">(выберите достопримечательность)</option>
              {cityLandmarks.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} ({item.slug})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {landmarkMode === "create" ? (
          <>
            <div className={styles.field}>
              <label className={styles.label}>
                Название достопримечательности
              </label>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Slug достопримечательности (опц.)
              </label>
              <input
                value={landmarkSlug}
                onChange={(e) => setLandmarkSlug(e.target.value)}
              />
            </div>
          </>
        ) : null}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Тексты открытки</legend>

        {LOCALES.map((locale) => (
          <div key={`greeting-${locale}`} className={styles.field}>
            <label className={styles.label}>{`Приветствие (${locale})`}</label>
            <textarea
              rows={2}
              value={greeting[locale]}
              onChange={(e) =>
                updateLocalized(setGreeting, locale, e.target.value)
              }
            />
          </div>
        ))}

        {LOCALES.map((locale) => (
          <div key={`content-${locale}`} className={styles.field}>
            <label
              className={styles.label}
            >{`Главный блок текста (${locale})`}</label>
            <textarea
              rows={4}
              value={content[locale]}
              onChange={(e) =>
                updateLocalized(setContent, locale, e.target.value)
              }
            />
          </div>
        ))}

        {LOCALES.map((locale) => (
          <div key={`farewell-${locale}`} className={styles.field}>
            <label className={styles.label}>{`Прощание (${locale})`}</label>
            <textarea
              rows={2}
              value={farewell[locale]}
              onChange={(e) =>
                updateLocalized(setFarewell, locale, e.target.value)
              }
            />
          </div>
        ))}

        {LOCALES.map((locale) => (
          <div key={`invitation-${locale}`} className={styles.field}>
            <label className={styles.label}>{`Приглашение (${locale})`}</label>
            <textarea
              rows={2}
              value={invitation[locale]}
              onChange={(e) =>
                updateLocalized(setInvitation, locale, e.target.value)
              }
            />

            <label
              className={styles.label}
              style={{ marginTop: 8 }}
            >{`Ссылка на книгу (${locale})`}</label>
            <input
              value={invitationBookLink[locale]}
              onChange={(e) =>
                updateLocalized(setInvitationBookLink, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Иллюстрации</legend>

        <div className={styles.field}>
          <label className={styles.label}>Марка: файл</label>
          <input
            value={stampFile}
            onChange={(e) => setStampFile(e.target.value)}
          />
        </div>

        {stampFile ? (
          <div className={styles.field}>
            <label className={styles.label}>Марка: превью</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={stampFile}
                alt="stamp preview"
                style={{ maxWidth: 140, maxHeight: 140, objectFit: "contain" }}
              />
              <button
                type="button"
                className="agent-button"
                onClick={() => setStampFile("")}
              >
                Удалить
              </button>
            </div>
          </div>
        ) : null}

        <div className={styles.field}>
          <label className={styles.label}>Марка: загрузить файл</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              uploadImageFile(file, "landmark-stamp", setStampFile);
            }}
          />
        </div>

        {illustrations.map((item, index) => (
          <div
            key={`illustration-${index}`}
            style={{
              borderTop: "1px solid #ddd",
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div className={styles.field}>
              <label
                className={styles.label}
              >{`Иллюстрация #${index + 1}: файл`}</label>
              <input
                value={item.file}
                onChange={(e) =>
                  updateIllustration(index, { file: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Иллюстрация: загрузить файл
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  uploadImageFile(
                    file,
                    `landmark-illustration-${index}`,
                    (imagePath) =>
                      updateIllustration(index, { file: imagePath }),
                  );
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Размер</label>
              <select
                value={item.size}
                onChange={(e) =>
                  updateIllustration(index, { size: e.target.value })
                }
              >
                <option value="large">Большой (100%)</option>
                <option value="threeQuarter">Три четверти (75%)</option>
                <option value="medium">Средний (50%)</option>
                <option value="compact">Компактный (40%)</option>
                <option value="small">Маленький (30%)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Тип</label>
              <input
                value={item.type}
                onChange={(e) =>
                  updateIllustration(index, { type: e.target.value })
                }
              />
            </div>

            {item.file ? (
              <div className={styles.field}>
                <label className={styles.label}>Превью иллюстрации</label>
                <img
                  src={item.file}
                  alt={`illustration-${index + 1}`}
                  style={{
                    maxWidth: 220,
                    maxHeight: 160,
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : null}

            <div className={styles.field}>
              <label className={styles.label}>Позиция</label>
              <select
                value={item.position}
                onChange={(e) =>
                  updateIllustration(index, { position: e.target.value })
                }
              >
                <option value="left">Слева</option>
                <option value="right">Справа</option>
                <option value="center">По центру</option>
              </select>
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={item.wrap}
                  onChange={(e) =>
                    updateIllustration(index, { wrap: e.target.checked })
                  }
                />
                Обтекание
              </label>
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={item.shadow}
                  onChange={(e) =>
                    updateIllustration(index, { shadow: e.target.checked })
                  }
                />
                Тень
              </label>
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={item.border}
                  onChange={(e) =>
                    updateIllustration(index, { border: e.target.checked })
                  }
                />
                Рамка
              </label>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Поворот</label>
              <input
                value={item.rotate}
                onChange={(e) =>
                  updateIllustration(index, { rotate: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Вставка: where</label>
              <select
                value={item.insertWhere}
                onChange={(e) =>
                  updateIllustration(index, { insertWhere: e.target.value })
                }
              >
                <option value="before">Перед абзацем</option>
                <option value="after">После абзаца</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Вставка: paragraph</label>
              <input
                value={item.insertParagraph}
                onChange={(e) =>
                  updateIllustration(index, { insertParagraph: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Якорь</label>
              <input
                value={item.anchor}
                onChange={(e) =>
                  updateIllustration(index, { anchor: e.target.value })
                }
              />
            </div>

            <button
              type="button"
              className="agent-button"
              onClick={() =>
                setIllustrations((prev) => prev.filter((_, i) => i !== index))
              }
            >
              Удалить
            </button>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="agent-button"
            onClick={() =>
              setIllustrations((prev) => [...prev, createEmptyIllustration()])
            }
          >
            Добавить иллюстрацию
          </button>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Галерея изображений</legend>

        {galleryItems.map((item, index) => (
          <div
            key={`gallery-${index}`}
            style={{
              borderTop: "1px solid #ddd",
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div className={styles.field}>
              <label
                className={styles.label}
              >{`Изображение #${index + 1}: файл`}</label>
              <input
                value={item.file}
                onChange={(e) =>
                  updateGalleryItem(index, { file: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Изображение: загрузить файл
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  uploadImageFile(file, `landmark-gallery-${index}`, (path) =>
                    updateGalleryItem(index, { file: path }),
                  );
                }}
              />
            </div>

            {item.file ? (
              <div className={styles.field}>
                <label className={styles.label}>Превью галереи</label>
                <img
                  src={item.file}
                  alt={item.alt || `gallery-${index + 1}`}
                  style={{
                    maxWidth: 220,
                    maxHeight: 160,
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : null}

            <div className={styles.field}>
              <label className={styles.label}>ALT-текст</label>
              <input
                value={item.alt}
                onChange={(e) =>
                  updateGalleryItem(index, { alt: e.target.value })
                }
              />
            </div>

            <button
              type="button"
              className="agent-button"
              onClick={() =>
                setGalleryItems((prev) => prev.filter((_, i) => i !== index))
              }
            >
              Удалить изображение
            </button>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="agent-button"
            onClick={() =>
              setGalleryItems((prev) => [...prev, createEmptyGalleryItem()])
            }
          >
            Добавить изображение в галерею
          </button>
        </div>
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button className="agent-button" onClick={handleSave} disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <button
          className="agent-button"
          style={{ marginLeft: 8 }}
          onClick={() => {
            void loadForm();
          }}
          disabled={saving}
        >
          Перезагрузить
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
