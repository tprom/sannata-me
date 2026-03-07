"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type LocaleCode = "en" | "de" | "ru" | "uk";
type CityOption = { cityId: string; slug: string; label: string };

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

const parseIllustrations = (markdown: string): IllustrationDraft[] => {
  const indexSet = new Set<number>();

  const patternNew = /illustration\[(\d+)\]\.[a-zA-Z0-9.]+:[ \t]*([^\r\n]*)$/gm;
  for (const match of markdown.matchAll(patternNew)) {
    indexSet.add(Number.parseInt(match[1], 10));
  }

  return [...indexSet]
    .sort((a, b) => a - b)
    .map((index) => {
      const prefix = `illustration[${index}]`;
      return {
        image: parseField(markdown, `${prefix}\\.image`),
        caption: {
          en:
            parseField(markdown, `${prefix}\\.caption\\.en`) ||
            parseField(markdown, `${prefix}\\.captionEn`),
          de:
            parseField(markdown, `${prefix}\\.caption\\.de`) ||
            parseField(markdown, `${prefix}\\.captionDe`),
          ru:
            parseField(markdown, `${prefix}\\.caption\\.ru`) ||
            parseField(markdown, `${prefix}\\.captionRu`),
          uk:
            parseField(markdown, `${prefix}\\.caption\\.uk`) ||
            parseField(markdown, `${prefix}\\.captionUk`),
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
          ) as IllustrationDraft["insertWhere"]) ||
          (parseField(
            markdown,
            `${prefix}\\.insertWhere`,
          ) as IllustrationDraft["insertWhere"]) ||
          "after",
        insertParagraph:
          parseField(markdown, `${prefix}\\.insert\\.paragraph`) ||
          parseField(markdown, `${prefix}\\.insertParagraph`) ||
          "1",
        anchor: parseField(markdown, `${prefix}\\.anchor`),
      };
    })
    .filter((item) => item.image.trim().length > 0);
};

export default function CityFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");

  const [country, setCountry] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [name, setName] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [cityInfo, setCityInfo] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [greeting, setGreeting] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [invitation, setInvitation] =
    useState<Record<LocaleCode, string>>(emptyLocalized());

  const [cityId, setCityId] = useState("");
  const [slug, setSlug] = useState("");
  const [countryId, setCountryId] = useState("");

  const [geoLat, setGeoLat] = useState("");
  const [geoLng, setGeoLng] = useState("");
  const [geoSource, setGeoSource] = useState("manual");

  const [hasMapOption, setHasMapOption] = useState(true);
  const [geoReady, setGeoReady] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [mapLabel, setMapLabel] = useState<Record<LocaleCode, string>>({
    en: "Show on map",
    de: "Auf der Karte anzeigen",
    ru: "Показать на карте",
    uk: "Показати на мапi",
  });

  const [illustrations, setIllustrations] = useState<IllustrationDraft[]>([]);

  useEffect(() => {
    void loadForm();
  }, []);

  const loadForm = async (cityToLoad?: string) => {
    setLoading(true);
    try {
      const query = cityToLoad
        ? `?cityId=${encodeURIComponent(cityToLoad)}`
        : "";
      const response = await fetch(`/api/agent/forms/city${query}`);
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload?.message ?? "Не удалось загрузить форму города.",
        );
      }

      const md = String(payload.content || "");
      const options = Array.isArray(payload.cityOptions)
        ? (payload.cityOptions as CityOption[])
        : [];

      setCityOptions(options);
      setSelectedCityId(parseField(md, "cityId") || cityToLoad || "");

      setCountry({
        en: parseField(md, "countryEn"),
        de: parseField(md, "countryDe"),
        ru: parseField(md, "countryRu"),
        uk: parseField(md, "countryUk"),
      });

      setName({
        en: parseField(md, "nameEn"),
        de: parseField(md, "nameDe"),
        ru: parseField(md, "nameRu"),
        uk: parseField(md, "nameUk"),
      });

      setGeoLat(parseField(md, "geoLat"));
      setGeoLng(parseField(md, "geoLng"));
      setGeoSource(parseField(md, "geoSource") || "manual");

      setCityInfo({
        en: parseField(md, "cityInfoEn"),
        de: parseField(md, "cityInfoDe"),
        ru: parseField(md, "cityInfoRu"),
        uk: parseField(md, "cityInfoUk"),
      });

      setCityId(parseField(md, "cityId"));
      setSlug(parseField(md, "slug"));
      setCountryId(parseField(md, "countryId"));

      setHasMapOption(parseBoolean(parseField(md, "hasMapOption"), true));
      setGeoReady(parseBoolean(parseField(md, "geoReady"), true));
      setIsActive(parseBoolean(parseField(md, "isActive"), true));

      setMapLabel({
        en: parseField(md, "mapLabelEn") || "Show on map",
        de: parseField(md, "mapLabelDe") || "Auf der Karte anzeigen",
        ru: parseField(md, "mapLabelRu") || "Показать на карте",
        uk: parseField(md, "mapLabelUk") || "Показати на мапi",
      });

      setGreeting({
        en: parseField(md, "greetingEn") || parseField(md, "greeting\\.en"),
        de: parseField(md, "greetingDe") || parseField(md, "greeting\\.de"),
        ru: parseField(md, "greetingRu") || parseField(md, "greeting\\.ru"),
        uk: parseField(md, "greetingUk") || parseField(md, "greeting\\.uk"),
      });

      setInvitation({
        en: parseField(md, "invitationEn") || parseField(md, "invitation\\.en"),
        de: parseField(md, "invitationDe") || parseField(md, "invitation\\.de"),
        ru: parseField(md, "invitationRu") || parseField(md, "invitation\\.ru"),
        uk: parseField(md, "invitationUk") || parseField(md, "invitation\\.uk"),
      });

      setIllustrations(parseIllustrations(md));
      setMessage("Форма загружена");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
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

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Форма города");
    lines.push("");

    lines.push("## 1. Страна");
    lines.push("");
    lines.push(`countryEn: ${country.en}`);
    lines.push(`countryDe: ${country.de}`);
    lines.push(`countryRu: ${country.ru}`);
    lines.push(`countryUk: ${country.uk}`);
    lines.push("");

    lines.push("## 2. Город");
    lines.push("");
    lines.push(`nameEn: ${name.en}`);
    lines.push(`nameDe: ${name.de}`);
    lines.push(`nameRu: ${name.ru}`);
    lines.push(`nameUk: ${name.uk}`);
    lines.push("");

    lines.push("## 3. Геоданные");
    lines.push("");
    lines.push(`geoLat: ${geoLat}`);
    lines.push(`geoLng: ${geoLng}`);
    lines.push(`geoSource: ${geoSource}`);
    lines.push("");

    lines.push("## 4. Информация о городе");
    lines.push("");
    lines.push(`cityInfoEn: ${cityInfo.en}`);
    lines.push(`cityInfoDe: ${cityInfo.de}`);
    lines.push(`cityInfoRu: ${cityInfo.ru}`);
    lines.push(`cityInfoUk: ${cityInfo.uk}`);
    lines.push("");

    lines.push("## 5. Служебные поля");
    lines.push("");
    lines.push(`cityId: ${cityId}`);
    lines.push(`slug: ${slug}`);
    lines.push(`countryId: ${countryId}`);
    lines.push("");

    lines.push(`hasMapOption: ${hasMapOption}`);
    lines.push(`geoReady: ${geoReady}`);
    lines.push(`isActive: ${isActive}`);
    lines.push("");

    lines.push(`mapLabelRu: ${mapLabel.ru}`);
    lines.push(`mapLabelEn: ${mapLabel.en}`);
    lines.push(`mapLabelDe: ${mapLabel.de}`);
    lines.push(`mapLabelUk: ${mapLabel.uk}`);
    lines.push("");

    lines.push("## 6. Приветствие");
    lines.push("");
    lines.push(`greetingEn: ${greeting.en}`);
    lines.push(`greetingDe: ${greeting.de}`);
    lines.push(`greetingRu: ${greeting.ru}`);
    lines.push(`greetingUk: ${greeting.uk}`);
    lines.push("");

    lines.push("## 7. Иллюстрации");
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

    lines.push("## 8. Приглашение");
    lines.push("");
    lines.push(`invitationEn: ${invitation.en}`);
    lines.push(`invitationDe: ${invitation.de}`);
    lines.push(`invitationRu: ${invitation.ru}`);
    lines.push(`invitationUk: ${invitation.uk}`);
    lines.push("");

    return lines.join("\n");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const response = await fetch("/api/agent/forms/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.message ?? "Не удалось сохранить форму города.",
        );
      }

      setMessage(payload.message ?? "Форма сохранена");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма города</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          Выбор города для редактирования
        </legend>
        <div className={styles.field}>
          <label className={styles.label}>
            Город из реестра (необязательно)
          </label>
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
          >
            <option value="">(новый или ручной ввод)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="agent-button"
          onClick={() => void loadForm(selectedCityId)}
          disabled={!selectedCityId}
        >
          Загрузить данные города
        </button>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Страна</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`country-${locale}`}>
            <label
              className={styles.label}
            >{`Название страны (${localeNames[locale]})`}</label>
            <input
              value={country[locale]}
              onChange={(e) =>
                updateLocalized(setCountry, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Город</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`name-${locale}`}>
            <label
              className={styles.label}
            >{`Название города (${localeNames[locale]})`}</label>
            <input
              value={name[locale]}
              onChange={(e) => updateLocalized(setName, locale, e.target.value)}
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Геоданные</legend>
        <div className={styles.field}>
          <label className={styles.label}>Широта (geoLat)</label>
          <input value={geoLat} onChange={(e) => setGeoLat(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Долгота (geoLng)</label>
          <input value={geoLng} onChange={(e) => setGeoLng(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Источник геоданных</label>
          <input
            value={geoSource}
            onChange={(e) => setGeoSource(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Информация о городе</legend>
        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`info-${locale}`}>
            <label
              className={styles.label}
            >{`Описание (${localeNames[locale]})`}</label>
            <textarea
              value={cityInfo[locale]}
              onChange={(e) =>
                updateLocalized(setCityInfo, locale, e.target.value)
              }
              rows={4}
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Служебные поля</legend>
        <div className={styles.field}>
          <label className={styles.label}>cityId</label>
          <input value={cityId} onChange={(e) => setCityId(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>countryId</label>
          <input
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={hasMapOption}
              onChange={(e) => setHasMapOption(e.target.checked)}
            />{" "}
            Показывать пункт карты
          </label>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={geoReady}
              onChange={(e) => setGeoReady(e.target.checked)}
            />{" "}
            Геоданные готовы
          </label>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{" "}
            Город активен
          </label>
        </div>

        {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
          <div className={styles.field} key={`map-label-${locale}`}>
            <label
              className={styles.label}
            >{`Подпись ссылки на карту (${localeNames[locale]})`}</label>
            <input
              value={mapLabel[locale]}
              onChange={(e) =>
                updateLocalized(setMapLabel, locale, e.target.value)
              }
            />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>6. Приветствие</legend>
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
        <legend className={styles.legend}>7. Иллюстрации</legend>
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
                    `city-illustration-${index}`,
                    (imagePath) =>
                      updateIllustration(index, { image: imagePath }),
                  );
                }}
              />
            </div>

            {(["en", "de", "ru", "uk"] as LocaleCode[]).map((locale) => (
              <div className={styles.field} key={`ill-cap-${index}-${locale}`}>
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
        <legend className={styles.legend}>8. Приглашение</legend>
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
          onClick={() => void loadForm(selectedCityId)}
          disabled={saving}
        >
          Перезагрузить
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
