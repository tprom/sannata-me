"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./FormPanel.module.css";

const cityFormApiPath = "/api/agent/forms/city";

const initialForm = {
  cityId: "",
  slug: "",
  countryEn: "",
  countryDe: "",
  countryRu: "",
  countryUk: "",
  nameEn: "",
  nameDe: "",
  nameRu: "",
  nameUk: "",
  geoLat: "",
  geoLng: "",
  geoSource: "manual",
  cityInfoEn: "",
  cityInfoDe: "",
  cityInfoRu: "",
  cityInfoUk: "",
};

const toSlug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const toCountryId = (countryEn) => {
  const normalized = String(countryEn ?? "").trim();
  if (!normalized) return "country_unknown";
  if (normalized.startsWith("country_")) return normalized;
  const slug = toSlug(normalized);
  return slug ? `country_${slug}` : "country_unknown";
};

const buildCityMarkdown = (form) => {
  const slug = toSlug(form.slug || form.nameEn || form.nameRu);
  const cityId = String(form.cityId || `city_${slug}`).trim();
  const countryId = toCountryId(form.countryEn);

  return [
    "# Форма города",
    "",
    "Эта форма создаёт или обновляет только данные города.",
    "Форма достопримечательности не должна создавать города.",
    "",
    "## A. Страна",
    "",
    `countryEn: ${form.countryEn}`,
    `countryDe: ${form.countryDe}`,
    `countryRu: ${form.countryRu}`,
    `countryUk: ${form.countryUk}`,
    "",
    "## B. Город",
    "",
    `nameEn: ${form.nameEn}`,
    `nameDe: ${form.nameDe}`,
    `nameRu: ${form.nameRu}`,
    `nameUk: ${form.nameUk}`,
    "",
    "## C. Геоданные",
    "",
    `geoLat: ${form.geoLat}`,
    `geoLng: ${form.geoLng}`,
    `geoSource: ${form.geoSource || "manual"}`,
    "",
    "## D. Информация о городе",
    "",
    `cityInfoEn: ${form.cityInfoEn}`,
    `cityInfoDe: ${form.cityInfoDe}`,
    `cityInfoRu: ${form.cityInfoRu}`,
    `cityInfoUk: ${form.cityInfoUk}`,
    "",
    "## E. Служебные поля (авто)",
    "",
    `cityId: ${cityId}`,
    `slug: ${slug}`,
    `countryId: ${countryId}`,
    "hasMapOption: true",
    "geoReady: true",
    "isActive: true",
    "mapLabelRu: Показать на карте",
    "mapLabelEn: Show on map",
    "mapLabelDe: Auf der Karte anzeigen",
    "mapLabelUk: Показати на мапі",
    "",
  ].join("\n");
};

export function FormPanel() {
  const [form, setForm] = useState(initialForm);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityModeLabel = selectedCityId
    ? `Режим: редактирование (${selectedCityId})`
    : "Режим: создание";
  const cityModeClass = selectedCityId
    ? styles.modeIndicatorEdit
    : styles.modeIndicatorCreate;
  const cityModeDotClass = selectedCityId
    ? styles.modeDotEdit
    : styles.modeDotCreate;
  const autoSlug = useMemo(
    () => toSlug(form.slug || form.nameEn || form.nameRu),
    [form.slug, form.nameEn, form.nameRu],
  );
  const autoCountryId = useMemo(
    () => toCountryId(form.countryEn),
    [form.countryEn],
  );

  const applyCityData = useCallback((cityData) => {
    if (!cityData) {
      setForm(initialForm);
      return;
    }

    setForm({
      cityId: cityData.cityId ?? "",
      slug: cityData.slug ?? "",
      countryEn: cityData.countryName?.en ?? cityData.countryId ?? "",
      countryDe: cityData.countryName?.de ?? "",
      countryRu: cityData.countryName?.ru ?? "",
      countryUk: cityData.countryName?.uk ?? "",
      nameEn: cityData.name?.en ?? cityData.city ?? "",
      nameDe: cityData.name?.de ?? "",
      nameRu: cityData.name?.ru ?? "",
      nameUk: cityData.name?.uk ?? "",
      geoLat:
        typeof cityData.geo?.lat === "number" ? String(cityData.geo.lat) : "",
      geoLng:
        typeof cityData.geo?.lng === "number" ? String(cityData.geo.lng) : "",
      geoSource: cityData.geo?.source ?? "manual",
      cityInfoEn: cityData.info?.en ?? "",
      cityInfoDe: cityData.info?.de ?? "",
      cityInfoRu: cityData.info?.ru ?? "",
      cityInfoUk: cityData.info?.uk ?? "",
    });
  }, []);

  const loadForm = useCallback(
    async (cityId = "") => {
      setIsLoading(true);
      setStatus(null);

      try {
        const apiPath = cityId
          ? `${cityFormApiPath}?cityId=${encodeURIComponent(cityId)}`
          : cityFormApiPath;

        const response = await fetch(apiPath, { method: "GET" });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message ?? "Не удалось загрузить форму.");
        }

        const options = Array.isArray(payload.cityOptions)
          ? payload.cityOptions
          : [];
        setCityOptions(options);
        setSelectedCityId(payload.selectedCity?.cityId ?? "");
        applyCityData(payload.selectedCityData ?? null);
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error instanceof Error ? error.message : "Ошибка загрузки формы.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [applyCityData],
  );

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleCitySelect = async (cityId) => {
    setSelectedCityId(cityId);
    await loadForm(cityId);
  };

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const markdown = buildCityMarkdown(form);
      const response = await fetch(cityFormApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не удалось отправить форму.");
      }

      setStatus({
        type: "success",
        message: payload.message ?? "Форма отправлена агенту.",
      });
      await loadForm(payload.data?.city?.cityId ?? selectedCityId);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка отправки формы.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Форма города</h2>
        <p className={styles.subtitle}>Заполните только ручные поля.</p>
      </div>

      <div className={styles.selector}>
        <label className={styles.label} htmlFor="city-select">
          Город для корректировки
        </label>
        <select
          id="city-select"
          value={selectedCityId}
          onChange={(event) => handleCitySelect(event.target.value)}
          className={styles.select}
        >
          <option value="">Новый город (пустая форма)</option>
          {cityOptions.map((city) => (
            <option key={city.cityId} value={city.cityId}>
              {city.label} ({city.cityId})
            </option>
          ))}
        </select>
        <div className={`${styles.modeIndicator} ${cityModeClass}`}>
          <span className={`${styles.modeDot} ${cityModeDotClass}`} />
          {cityModeLabel}
        </div>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Страна (en, для countryId)</span>
          <input
            className={styles.input}
            value={form.countryEn}
            onChange={(event) =>
              handleFieldChange("countryEn", event.target.value)
            }
            placeholder="Germany"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Страна (de, опционально)</span>
          <input
            className={styles.input}
            value={form.countryDe}
            onChange={(event) =>
              handleFieldChange("countryDe", event.target.value)
            }
            placeholder="Deutschland"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Страна (ru, опционально)</span>
          <input
            className={styles.input}
            value={form.countryRu}
            onChange={(event) =>
              handleFieldChange("countryRu", event.target.value)
            }
            placeholder="Германия"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Страна (uk, опционально)</span>
          <input
            className={styles.input}
            value={form.countryUk}
            onChange={(event) =>
              handleFieldChange("countryUk", event.target.value)
            }
            placeholder="Німеччина"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Город (en, для alias)</span>
          <input
            className={styles.input}
            value={form.nameEn}
            onChange={(event) =>
              handleFieldChange("nameEn", event.target.value)
            }
            placeholder="Augsburg"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Город (de)</span>
          <input
            className={styles.input}
            value={form.nameDe}
            onChange={(event) =>
              handleFieldChange("nameDe", event.target.value)
            }
            placeholder="Augsburg"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Город (ru)</span>
          <input
            className={styles.input}
            value={form.nameRu}
            onChange={(event) =>
              handleFieldChange("nameRu", event.target.value)
            }
            placeholder="Аугсбург"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Город (uk)</span>
          <input
            className={styles.input}
            value={form.nameUk}
            onChange={(event) =>
              handleFieldChange("nameUk", event.target.value)
            }
            placeholder="Аугсбург"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Geo lat</span>
          <input
            className={styles.input}
            type="number"
            step="any"
            value={form.geoLat}
            onChange={(event) =>
              handleFieldChange("geoLat", event.target.value)
            }
            placeholder="48.3705"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Geo lng</span>
          <input
            className={styles.input}
            type="number"
            step="any"
            value={form.geoLng}
            onChange={(event) =>
              handleFieldChange("geoLng", event.target.value)
            }
            placeholder="10.8978"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Информация о городе (en)</span>
          <textarea
            className={styles.textarea}
            value={form.cityInfoEn}
            onChange={(event) =>
              handleFieldChange("cityInfoEn", event.target.value)
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Информация о городе (de)</span>
          <textarea
            className={styles.textarea}
            value={form.cityInfoDe}
            onChange={(event) =>
              handleFieldChange("cityInfoDe", event.target.value)
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Информация о городе (ru)</span>
          <textarea
            className={styles.textarea}
            value={form.cityInfoRu}
            onChange={(event) =>
              handleFieldChange("cityInfoRu", event.target.value)
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Информация о городе (uk)</span>
          <textarea
            className={styles.textarea}
            value={form.cityInfoUk}
            onChange={(event) =>
              handleFieldChange("cityInfoUk", event.target.value)
            }
          />
        </label>
      </div>

      <div className={styles.systemInfo}>
        <div>
          Авто cityId: {form.cityId || (autoSlug ? `city_${autoSlug}` : "—")}
        </div>
        <div>Авто slug: {autoSlug || "—"}</div>
        <div>Авто countryId: {autoCountryId || "—"}</div>
      </div>

      <div className={styles.actions}>
        <button
          className="agent-button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isLoading ||
            !form.nameEn.trim() ||
            !form.countryEn.trim()
          }
        >
          {isSubmitting ? "Отправляю..." : "Отправить Агенту"}
        </button>
      </div>

      {status && (
        <div
          className={
            status.type === "success"
              ? styles.statusSuccess
              : styles.statusError
          }
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
