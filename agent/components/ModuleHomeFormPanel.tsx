"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

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

const localeNames: Record<LocaleCode, string> = {
  en: "английский",
  de: "немецкий",
  ru: "русский",
  uk: "украинский",
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

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");
const encodeMultiline = (value: string): string =>
  value.replace(/\r?\n/g, "\\n");

const parseField = (markdown: string, key: string): string => {
  const m = markdown.match(new RegExp(`^${key}:[ \\t]*([^\\r\\n]*)$`, "m"));
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

const parseMultilineLegacy = (markdown: string, key: string): string => {
  const regex = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`, "m");
  const match = markdown.match(regex);
  return match?.[1]?.trim() || "";
};

const parseLegacyOrNew = (
  markdown: string,
  newKey: string,
  legacyKey: string,
): string => {
  const nextValue = parseField(markdown, newKey);
  if (nextValue) {
    return decodeMultiline(nextValue);
  }

  const legacySingle = parseField(markdown, legacyKey);
  if (legacySingle) {
    return legacySingle;
  }

  const legacyMultiline = parseMultilineLegacy(markdown, legacyKey);
  if (legacyMultiline) {
    return legacyMultiline;
  }

  return "";
};

const parseIllustrations = (markdown: string): IllustrationDraft[] => {
  const indexSet = new Set<number>();
  const pattern = /illustration\[(\d+)\]\.[a-zA-Z0-9.]+:[ \t]*([^\r\n]*)$/gm;
  for (const match of markdown.matchAll(pattern)) {
    indexSet.add(Number.parseInt(match[1], 10));
  }

  const indices = [...indexSet].sort((a, b) => a - b);
  return indices
    .map((index) => {
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
    })
    .filter((item) => item.image.trim().length > 0);
};

const legacyIllustrations = (markdown: string): IllustrationDraft[] => {
  const map: Array<[string, "left" | "right", number]> = [
    ["illustration1L", "left", 2],
    ["illustration1R", "right", 2],
    ["illustration2L", "left", 4],
    ["illustration2R", "right", 4],
    ["illustration3L", "left", 6],
    ["illustration3R", "right", 6],
  ];

  return map
    .map(([legacyKey, side, paragraph]) => {
      const image = parseField(markdown, legacyKey);
      if (!image) return null;

      return {
        image,
        caption: emptyLocalized(),
        size: "medium",
        type: "ketty-drawing",
        position: side,
        wrap: true,
        shadow: false,
        border: false,
        rotate: "0",
        insertWhere: "after",
        insertParagraph: String(paragraph),
        anchor: "",
      } as IllustrationDraft;
    })
    .filter((item): item is IllustrationDraft => Boolean(item));
};

export default function ModuleHomeFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [moduleKey, setModuleKey] = useState("landmarks");
  const [slug, setSlug] = useState("landmarks");
  const [stampImage, setStampImage] = useState("");
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
      const response = await fetch("/api/agent/forms/module-home");
      const markdown = await response.text();

      setModuleKey(parseField(markdown, "moduleKey") || "landmarks");
      setSlug(parseField(markdown, "slug") || "landmarks");
      setStampImage(parseField(markdown, "stampImage"));

      setGreeting({
        en:
          parseLegacyOrNew(markdown, "greeting\\.en", "greetingEn") ||
          "Hello. My name is Ketty.",
        de:
          parseLegacyOrNew(markdown, "greeting\\.de", "greetingDe") ||
          "Hallo. Mein Name ist Ketty.",
        ru:
          parseLegacyOrNew(markdown, "greeting\\.ru", "greetingRu") ||
          "Привет. Меня зовут Кетти.",
        uk:
          parseLegacyOrNew(markdown, "greeting\\.uk", "greetingUk") ||
          "Привiт. Мене звуть Кеттi.",
      });

      setDescription({
        en: parseLegacyOrNew(markdown, "description\\.en", "contentEn"),
        de: parseLegacyOrNew(markdown, "description\\.de", "contentDe"),
        ru: parseLegacyOrNew(markdown, "description\\.ru", "contentRu"),
        uk: parseLegacyOrNew(markdown, "description\\.uk", "contentUk"),
      });

      setInvitation({
        en:
          parseLegacyOrNew(markdown, "invitation\\.en", "closingTextEn") ||
          "Postcards come not by schedule.",
        de:
          parseLegacyOrNew(markdown, "invitation\\.de", "closingTextDe") ||
          "Postkarten kommen nicht nach Plan.",
        ru:
          parseLegacyOrNew(markdown, "invitation\\.ru", "closingTextRu") ||
          "Открытки приходят не по расписанию.",
        uk:
          parseLegacyOrNew(markdown, "invitation\\.uk", "closingTextUk") ||
          "Листiвки приходять не за розкладом.",
      });

      const parsedIllustrations = parseIllustrations(markdown);
      setIllustrations(
        parsedIllustrations.length > 0
          ? parsedIllustrations
          : legacyIllustrations(markdown),
      );

      setMessage("Форма загружена");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${String(error)}`);
    } finally {
      setLoading(false);
    }
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

  const buildMarkdown = (): string => {
    const lines: string[] = [];
    lines.push("# Форма главной страницы модуля (module-home)");
    lines.push("");
    lines.push("## 1. Модуль");
    lines.push("");
    lines.push(`moduleKey: ${moduleKey}`);
    lines.push(`slug: ${slug}`);
    lines.push("");

    lines.push("## 2. Приветствие Кетти");
    lines.push("");
    lines.push(`greeting.en: ${encodeMultiline(greeting.en)}`);
    lines.push(`greeting.de: ${encodeMultiline(greeting.de)}`);
    lines.push(`greeting.ru: ${encodeMultiline(greeting.ru)}`);
    lines.push(`greeting.uk: ${encodeMultiline(greeting.uk)}`);
    lines.push("");

    lines.push("## 3. Основной текст");
    lines.push("");
    lines.push(`description.en: ${encodeMultiline(description.en)}`);
    lines.push(`description.de: ${encodeMultiline(description.de)}`);
    lines.push(`description.ru: ${encodeMultiline(description.ru)}`);
    lines.push(`description.uk: ${encodeMultiline(description.uk)}`);
    lines.push("");

    lines.push("## 4. Иллюстрации");
    lines.push("");
    lines.push(`stampImage: ${stampImage}`);
    lines.push("");

    illustrations.forEach((item, index) => {
      lines.push(`illustration[${index}].image: ${item.image}`);
      lines.push(
        `illustration[${index}].caption.en: ${encodeMultiline(item.caption.en)}`,
      );
      lines.push(
        `illustration[${index}].caption.de: ${encodeMultiline(item.caption.de)}`,
      );
      lines.push(
        `illustration[${index}].caption.ru: ${encodeMultiline(item.caption.ru)}`,
      );
      lines.push(
        `illustration[${index}].caption.uk: ${encodeMultiline(item.caption.uk)}`,
      );
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

    lines.push("## 5. Заключительная фраза");
    lines.push("");
    lines.push(`invitation.en: ${encodeMultiline(invitation.en)}`);
    lines.push(`invitation.de: ${encodeMultiline(invitation.de)}`);
    lines.push(`invitation.ru: ${encodeMultiline(invitation.ru)}`);
    lines.push(`invitation.uk: ${encodeMultiline(invitation.uk)}`);
    lines.push("");

    lines.push("## 6. Служебные поля");
    lines.push("");
    lines.push("pageKind: module-home");
    lines.push("schemaVersion: 1.2.0");
    lines.push("");

    return lines.join("\n");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const response = await fetch("/api/agent/forms/module-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Ошибка сохранения");
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
      <h2 className={styles.title}>Форма главной страницы модуля</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Модуль</legend>
        <div className={styles.field}>
          <label className={styles.label}>Ключ модуля (moduleKey)</label>
          <input
            value={moduleKey}
            onChange={(e) => setModuleKey(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Приветствие Кетти</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`greeting-${locale}`}>
            <label
              className={styles.label}
            >{`Приветствие (${localeNames[locale]})`}</label>
            <textarea
              value={greeting[locale]}
              onChange={(e) =>
                updateLocalized(setGreeting, locale, e.target.value)
              }
              rows={3}
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Основной текст</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`description-${locale}`}>
            <label
              className={styles.label}
            >{`Описание (${localeNames[locale]})`}</label>
            <textarea
              value={description[locale]}
              onChange={(e) =>
                updateLocalized(setDescription, locale, e.target.value)
              }
              rows={6}
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Иллюстрации</legend>
        <div className={styles.field}>
          <label className={styles.label}>Марка (stampImage)</label>
          <input
            value={stampImage}
            onChange={(e) => setStampImage(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Загрузить марку</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              uploadImageFile(file, "module-stamp", (imagePath) =>
                setStampImage(imagePath),
              );
            }}
          />
        </div>

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
              >{`Изображение иллюстрации #${index + 1}`}</label>
              <input
                value={item.image}
                onChange={(e) =>
                  updateIllustration(index, { image: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Загрузить изображение</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  uploadImageFile(
                    file,
                    `module-illustration-${index}`,
                    (imagePath) =>
                      updateIllustration(index, { image: imagePath }),
                  );
                }}
              />
            </div>

            {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
              <div className={styles.field} key={`caption-${index}-${locale}`}>
                <label
                  className={styles.label}
                >{`Подпись (${localeNames[locale]})`}</label>
                <input
                  value={item.caption[locale]}
                  onChange={(e) =>
                    updateIllustrationCaption(index, locale, e.target.value)
                  }
                />
              </div>
            ))}

            <div className={styles.field}>
              <label className={styles.label}>Размер</label>
              <select
                value={item.size}
                onChange={(e) =>
                  updateIllustration(index, {
                    size: e.target.value as IllustrationDraft["size"],
                  })
                }
              >
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Большой</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Тип</label>
              <select
                value={item.type}
                onChange={(e) =>
                  updateIllustration(index, {
                    type: e.target.value as IllustrationDraft["type"],
                  })
                }
              >
                <option value="ketty-drawing">Рисунок Кетти</option>
                <option value="photo">Фото</option>
                <option value="decor">Декор</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Позиция</label>
              <select
                value={item.position}
                onChange={(e) =>
                  updateIllustration(index, {
                    position: e.target.value as IllustrationDraft["position"],
                  })
                }
              >
                <option value="left">Слева</option>
                <option value="right">Справа</option>
                <option value="center">По центру</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Вставка: до/после абзаца</label>
              <select
                value={item.insertWhere}
                onChange={(e) =>
                  updateIllustration(index, {
                    insertWhere: e.target
                      .value as IllustrationDraft["insertWhere"],
                  })
                }
              >
                <option value="before">Перед абзацем</option>
                <option value="after">После абзаца</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Номер абзаца</label>
              <input
                value={item.insertParagraph}
                onChange={(e) =>
                  updateIllustration(index, { insertParagraph: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Поворот (-10..10)</label>
              <input
                value={item.rotate}
                onChange={(e) =>
                  updateIllustration(index, { rotate: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Якорь (необязательно)</label>
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
                Обтекание текстом
              </label>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={item.shadow}
                  onChange={(e) =>
                    updateIllustration(index, { shadow: e.target.checked })
                  }
                />{" "}
                Тень
              </label>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={item.border}
                  onChange={(e) =>
                    updateIllustration(index, { border: e.target.checked })
                  }
                />{" "}
                Рамка
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
        <legend className={styles.legend}>5. Заключительная фраза</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`invitation-${locale}`}>
            <label
              className={styles.label}
            >{`Приглашение (${localeNames[locale]})`}</label>
            <textarea
              value={invitation[locale]}
              onChange={(e) =>
                updateLocalized(setInvitation, locale, e.target.value)
              }
              rows={3}
            />
          </div>
        ))}
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button className="agent-button" onClick={handleSave} disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <button
          className="agent-button"
          style={{ marginLeft: 8 }}
          onClick={loadForm}
          disabled={saving}
        >
          Перезагрузить
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
