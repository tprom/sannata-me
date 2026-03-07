"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type Props = {};
type CityOption = { cityId: string; slug: string; label: string };

type LocaleCode = "en" | "de" | "ru" | "uk";

type IllustrationDraft = {
  image: string;
  caption: Record<LocaleCode, string>;
  size: "small" | "medium" | "large";
  type: "ketty-drawing" | "photo" | "decor";
  position: "left" | "right" | "center";
  wrap: boolean;
  shadow: boolean;
  border: boolean;
  rotate: string;
  insertWhere: "before" | "after";
  insertParagraph: string;
  anchor: string;
};

const emptyLocalized = (): Record<LocaleCode, string> => ({
  en: "",
  de: "",
  ru: "",
  uk: "",
});

const createIllustration = (): IllustrationDraft => ({
  image: "",
  caption: emptyLocalized(),
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

const parseField = (markdown: string, key: string): string => {
  const m = markdown.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim() : "";
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

const parseIllustrations = (markdown: string): IllustrationDraft[] => {
  const indexSet = new Set<number>();
  const pattern = /illustration\[(\d+)\]\.[a-zA-Z0-9.]+:\s*(.*)$/gm;
  for (const match of markdown.matchAll(pattern)) {
    indexSet.add(Number.parseInt(match[1], 10));
  }

  const indices = [...indexSet].sort((a, b) => a - b);
  return indices.map((index) => {
    const prefix = `illustration[${index}]`;
    return {
      image: parseField(markdown, `${prefix}\\.image`),
      caption: {
        en: parseField(markdown, `${prefix}\\.caption\\.en`),
        de: parseField(markdown, `${prefix}\\.caption\\.de`),
        ru: parseField(markdown, `${prefix}\\.caption\\.ru`),
        uk: parseField(markdown, `${prefix}\\.caption\\.uk`),
      },
      size:
        (parseField(
          markdown,
          `${prefix}\\.size`,
        ) as IllustrationDraft["size"]) || "medium",
      type:
        (parseField(
          markdown,
          `${prefix}\\.type`,
        ) as IllustrationDraft["type"]) || "ketty-drawing",
      position:
        (parseField(
          markdown,
          `${prefix}\\.position`,
        ) as IllustrationDraft["position"]) || "right",
      wrap: parseBoolean(parseField(markdown, `${prefix}\\.wrap`), true),
      shadow: parseBoolean(parseField(markdown, `${prefix}\\.shadow`), false),
      border: parseBoolean(parseField(markdown, `${prefix}\\.border`), false),
      rotate: parseField(markdown, `${prefix}\\.rotate`) || "0",
      insertWhere:
        (parseField(
          markdown,
          `${prefix}\\.insert\\.where`,
        ) as IllustrationDraft["insertWhere"]) || "after",
      insertParagraph:
        parseField(markdown, `${prefix}\\.insert\\.paragraph`) || "1",
      anchor: parseField(markdown, `${prefix}\\.anchor`),
    };
  });
};

export default function CollectionHomeFormPanel(_props: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [panorama, setPanorama] = useState("");
  const [greeting, setGreeting] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [description, setDescription] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [invitation, setInvitation] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [illustrations, setIllustrations] = useState<IllustrationDraft[]>([]);

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/forms/collection-home");
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не удалось загрузить форму.");
      }

      const options = Array.isArray(payload.cityOptions)
        ? (payload.cityOptions as CityOption[])
        : [];
      setCityOptions(options);

      const md = payload.content || "";

      const parsedCityId = parseField(md, "cityId");
      setCityId(parsedCityId);
      setPanorama(parseField(md, "panorama"));

      setGreeting({
        en: parseField(md, "greeting\\.en"),
        de: parseField(md, "greeting\\.de"),
        ru: parseField(md, "greeting\\.ru"),
        uk: parseField(md, "greeting\\.uk"),
      });

      setDescription({
        en: parseField(md, "description\\.en"),
        de: parseField(md, "description\\.de"),
        ru: parseField(md, "description\\.ru"),
        uk: parseField(md, "description\\.uk"),
      });

      setInvitation({
        en: parseField(md, "invitation\\.en"),
        de: parseField(md, "invitation\\.de"),
        ru: parseField(md, "invitation\\.ru"),
        uk: parseField(md, "invitation\\.uk"),
      });

      setIllustrations(parseIllustrations(md));

      setMessage("Форма загружена");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Форма страницы города (collection-home)");
    lines.push("");
    lines.push("## 1. Выбор города");
    lines.push("");
    lines.push(`cityId: ${cityId}`);
    lines.push("");

    lines.push("## 2. Панорама города");
    lines.push("");
    lines.push(`panorama: ${panorama}`);
    lines.push("");

    lines.push("## 3. Приветствие Кетти");
    lines.push("");
    lines.push(`greeting.en: ${greeting.en}`);
    lines.push(`greeting.de: ${greeting.de}`);
    lines.push(`greeting.ru: ${greeting.ru}`);
    lines.push(`greeting.uk: ${greeting.uk}`);
    lines.push("");

    lines.push("## 4. Описание (восприятие Кетти)");
    lines.push("");
    lines.push(`description.en: ${description.en}`);
    lines.push(`description.de: ${description.de}`);
    lines.push(`description.ru: ${description.ru}`);
    lines.push(`description.uk: ${description.uk}`);
    lines.push("");

    lines.push("## 5. Иллюстрации (динамический список)");
    lines.push("");
    illustrations.forEach((item, index) => {
      lines.push(`illustration[${index}].image: ${item.image}`);
      lines.push(`illustration[${index}].caption.en: ${item.caption.en}`);
      lines.push(`illustration[${index}].caption.de: ${item.caption.de}`);
      lines.push(`illustration[${index}].caption.ru: ${item.caption.ru}`);
      lines.push(`illustration[${index}].caption.uk: ${item.caption.uk}`);
      lines.push(`illustration[${index}].size: ${item.size}`);
      lines.push(`illustration[${index}].type: ${item.type}`);
      lines.push(`illustration[${index}].position: ${item.position}`);
      lines.push(`illustration[${index}].wrap: ${item.wrap}`);
      lines.push(`illustration[${index}].shadow: ${item.shadow}`);
      lines.push(`illustration[${index}].border: ${item.border}`);
      lines.push(`illustration[${index}].rotate: ${item.rotate}`);
      lines.push(`illustration[${index}].insert.where: ${item.insertWhere}`);
      lines.push(
        `illustration[${index}].insert.paragraph: ${item.insertParagraph}`,
      );
      lines.push(`illustration[${index}].anchor: ${item.anchor}`);
      lines.push("");
    });

    lines.push("## 6. Приглашение Кетти");
    lines.push("");
    lines.push(`invitation.en: ${invitation.en}`);
    lines.push(`invitation.de: ${invitation.de}`);
    lines.push(`invitation.ru: ${invitation.ru}`);
    lines.push(`invitation.uk: ${invitation.uk}`);
    lines.push("");

    return lines.join("\n");
  };

  const updateLocalized = (
    setter: React.Dispatch<React.SetStateAction<Record<LocaleCode, string>>>,
    locale: LocaleCode,
    value: string,
  ) => {
    setter((prev) => ({ ...prev, [locale]: value }));
  };

  const updateIllustration = (
    index: number,
    patch: Partial<IllustrationDraft>,
  ) => {
    setIllustrations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateIllustrationCaption = (
    index: number,
    locale: LocaleCode,
    value: string,
  ) => {
    setIllustrations((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, caption: { ...item.caption, [locale]: value } }
          : item,
      ),
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

  const handlePanoramaUpload = async (file: File | null) => {
    if (!file) return;
    await uploadImageFile(file, "city-panorama", (imagePath) => {
      setPanorama(imagePath);
    });
  };

  const handleIllustrationUpload = async (index: number, file: File | null) => {
    if (!file) return;
    await uploadImageFile(file, `city-illustration-${index}`, (imagePath) => {
      updateIllustration(index, { image: imagePath });
    });
  };

  const handleSave = async () => {
    if (!cityId) {
      setMessage("Выберите cityId.");
      return;
    }

    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const res = await fetch("/api/agent/forms/collection-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Ошибка сохранения");
      }

      setMessage("Форма сохранена");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма страницы города (новый контракт)</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Выбор города</legend>
        <div className={styles.field}>
          <label className={styles.label}>cityId</label>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">(выберите город)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Панорама города</legend>
        <div className={styles.field}>
          <label className={styles.label}>panorama</label>
          <input
            value={panorama}
            onChange={(e) => setPanorama(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>upload panorama</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePanoramaUpload(e.target.files?.[0] ?? null)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Приветствие Кетти</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`greeting-${locale}`}>
            <label className={styles.label}>{`greeting.${locale}`}</label>
            <textarea
              value={greeting[locale]}
              onChange={(e) =>
                updateLocalized(setGreeting, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          4. Описание (восприятие Кетти)
        </legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`description-${locale}`}>
            <label className={styles.label}>{`description.${locale}`}</label>
            <textarea
              value={description[locale]}
              onChange={(e) =>
                updateLocalized(setDescription, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Иллюстрации</legend>
        {illustrations.map((item, index) => (
          <div
            key={`ill-${index}`}
            style={{
              borderTop: "1px solid #ddd",
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div className={styles.field}>
              <label
                className={styles.label}
              >{`illustration[${index}].image`}</label>
              <input
                value={item.image}
                onChange={(e) =>
                  updateIllustration(index, { image: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>upload image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleIllustrationUpload(index, e.target.files?.[0] ?? null)
                }
              />
            </div>
            {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
              <div className={styles.field} key={`ill-cap-${index}-${locale}`}>
                <label className={styles.label}>{`caption.${locale}`}</label>
                <input
                  value={item.caption[locale]}
                  onChange={(e) =>
                    updateIllustrationCaption(index, locale, e.target.value)
                  }
                />
              </div>
            ))}
            <div className={styles.field}>
              <label className={styles.label}>size</label>
              <select
                value={item.size}
                onChange={(e) =>
                  updateIllustration(index, {
                    size: e.target.value as IllustrationDraft["size"],
                  })
                }
              >
                <option value="small">small</option>
                <option value="medium">medium</option>
                <option value="large">large</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>type</label>
              <select
                value={item.type}
                onChange={(e) =>
                  updateIllustration(index, {
                    type: e.target.value as IllustrationDraft["type"],
                  })
                }
              >
                <option value="ketty-drawing">ketty-drawing</option>
                <option value="photo">photo</option>
                <option value="decor">decor</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>position</label>
              <select
                value={item.position}
                onChange={(e) =>
                  updateIllustration(index, {
                    position: e.target.value as IllustrationDraft["position"],
                  })
                }
              >
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="center">center</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>insert.where</label>
              <select
                value={item.insertWhere}
                onChange={(e) =>
                  updateIllustration(index, {
                    insertWhere: e.target
                      .value as IllustrationDraft["insertWhere"],
                  })
                }
              >
                <option value="before">before</option>
                <option value="after">after</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>insert.paragraph</label>
              <input
                value={item.insertParagraph}
                onChange={(e) =>
                  updateIllustration(index, { insertParagraph: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>rotate (-10..10)</label>
              <input
                value={item.rotate}
                onChange={(e) =>
                  updateIllustration(index, { rotate: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>anchor (optional)</label>
              <input
                value={item.anchor}
                onChange={(e) =>
                  updateIllustration(index, { anchor: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={item.wrap}
                  onChange={(e) =>
                    updateIllustration(index, { wrap: e.target.checked })
                  }
                />{" "}
                wrap
              </label>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={item.shadow}
                  onChange={(e) =>
                    updateIllustration(index, { shadow: e.target.checked })
                  }
                />{" "}
                shadow
              </label>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={item.border}
                  onChange={(e) =>
                    updateIllustration(index, { border: e.target.checked })
                  }
                />{" "}
                border
              </label>
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
              setIllustrations((prev) => [...prev, createIllustration()])
            }
          >
            Добавить иллюстрацию
          </button>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>6. Приглашение Кетти</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`invitation-${locale}`}>
            <label className={styles.label}>{`invitation.${locale}`}</label>
            <textarea
              value={invitation[locale]}
              onChange={(e) =>
                updateLocalized(setInvitation, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button className="agent-button" onClick={handleSave} disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
