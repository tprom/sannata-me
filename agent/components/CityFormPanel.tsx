"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type LocaleCode = "en" | "de" | "ru" | "uk";
type CityOption = { cityId: string; slug: string; label: string };

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

export default function CityFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");

  const [country, setCountry] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [name, setName] =
    useState<Record<LocaleCode, string>>(emptyLocalized());
  const [cityInfo, setCityInfo] =
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

  useEffect(() => {
    void loadForm();
  }, []);

  const resetForNewCity = () => {
    setSelectedCityId("");
    setCountry(emptyLocalized());
    setName(emptyLocalized());
    setCityInfo(emptyLocalized());

    setCityId("");
    setSlug("");
    setCountryId("");

    setGeoLat("");
    setGeoLng("");
    setGeoSource("manual");

    setHasMapOption(true);
    setGeoReady(true);
    setIsActive(true);

    setMapLabel({
      en: "Show on map",
      de: "Auf der Karte anzeigen",
      ru: "Показать на карте",
      uk: "Показати на мапi",
    });
  };

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

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Форма города");
    lines.push("");
    lines.push("Эта форма создаёт или обновляет только данные города.");
    lines.push("Форма достопримечательности не должна создавать города.");
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

    lines.push("## 5. Служебные поля (авто)");
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

      const nextCityId = payload?.data?.city?.cityId;
      setMessage(payload.message ?? "Форма сохранена");
      await loadForm(typeof nextCityId === "string" ? nextCityId : cityId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const targetCityId = cityId.trim() || selectedCityId.trim();
    if (!targetCityId) {
      setMessage("Выберите или укажите cityId для удаления.");
      return;
    }

    const confirmed = window.confirm(
      `Удалить город ${targetCityId} из реестра? Действие необратимо.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/agent/forms/city?cityId=${encodeURIComponent(targetCityId)}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Не удалось удалить город.");
      }

      setMessage(payload.message ?? "Город удалён");
      resetForNewCity();
      await loadForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма города (реестр)</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          Выбор города для редактирования
        </legend>
        <div className={styles.field}>
          <label className={styles.label}>Город из реестра</label>
          <select
            value={selectedCityId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedCityId(next);
              if (!next) {
                resetForNewCity();
                setMessage("Режим создания нового города");
                return;
              }
              void loadForm(next);
            }}
          >
            <option value="">(новый город)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="agent-button"
            onClick={() => {
              resetForNewCity();
              setMessage("Режим создания нового города");
            }}
          >
            Новый город
          </button>
          <button
            type="button"
            className="agent-button"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? "Удаляю..." : "Удалить город"}
          </button>
        </div>
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

      <div style={{ marginTop: 12 }}>
        <button
          className="agent-button"
          onClick={handleSave}
          disabled={saving || deleting}
        >
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <button
          className="agent-button"
          style={{ marginLeft: 8 }}
          onClick={() => void loadForm(selectedCityId)}
          disabled={saving || deleting}
        >
          Перезагрузить
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
