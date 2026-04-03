"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./FormPanel.module.css";

type CityOption = {
  cityId: string;
  slug: string;
  label: string;
};

type LoadPayload = {
  ok?: boolean;
  content?: string;
  mode?: "create" | "edit";
  cityOptions?: CityOption[];
  selectedCity?: { cityId?: string; slug?: string } | null;
  message?: string;
};

export default function CityFormPanel() {
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [countryEn, setCountryEn] = useState("");
  const [countryDe, setCountryDe] = useState("");
  const [countryRu, setCountryRu] = useState("");
  const [countryUk, setCountryUk] = useState("");

  const [nameEn, setNameEn] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameUk, setNameUk] = useState("");

  const [geoLat, setGeoLat] = useState("");
  const [geoLng, setGeoLng] = useState("");
  const [geoSource, setGeoSource] = useState("manual");

  const [cityInfoEn, setCityInfoEn] = useState("");
  const [cityInfoDe, setCityInfoDe] = useState("");
  const [cityInfoRu, setCityInfoRu] = useState("");
  const [cityInfoUk, setCityInfoUk] = useState("");

  const [cityId, setCityId] = useState("");
  const [slug, setSlug] = useState("");
  const [countryId, setCountryId] = useState("");
  const [hasMapOption, setHasMapOption] = useState(true);
  const [geoReady, setGeoReady] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [mapLabelRu, setMapLabelRu] = useState("Показать на карте");
  const [mapLabelEn, setMapLabelEn] = useState("Show on map");
  const [mapLabelDe, setMapLabelDe] = useState("Auf der Karte anzeigen");
  const [mapLabelUk, setMapLabelUk] = useState("Показати на мапі");

  const [rawMarkdown, setRawMarkdown] = useState("");
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedCity = useMemo(
    () => cityOptions.find((item) => item.cityId === selectedCityId) ?? null,
    [cityOptions, selectedCityId],
  );

  const getField = useCallback((markdown: string, key: string): string => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}:\\s*(.*)$`, "m");
    const match = markdown.match(regex);
    return match?.[1]?.trim() ?? "";
  }, []);

  const setParsedFields = useCallback(
    (content: string) => {
      setRawMarkdown(content);

      setCountryEn(getField(content, "countryEn"));
      setCountryDe(getField(content, "countryDe"));
      setCountryRu(getField(content, "countryRu"));
      setCountryUk(getField(content, "countryUk"));

      setNameEn(getField(content, "nameEn"));
      setNameDe(getField(content, "nameDe"));
      setNameRu(getField(content, "nameRu"));
      setNameUk(getField(content, "nameUk"));

      setGeoLat(getField(content, "geoLat"));
      setGeoLng(getField(content, "geoLng"));
      setGeoSource(getField(content, "geoSource") || "manual");

      setCityInfoEn(getField(content, "cityInfoEn"));
      setCityInfoDe(getField(content, "cityInfoDe"));
      setCityInfoRu(getField(content, "cityInfoRu"));
      setCityInfoUk(getField(content, "cityInfoUk"));

      setCityId(getField(content, "cityId"));
      setSlug(getField(content, "slug"));
      setCountryId(getField(content, "countryId"));
      setHasMapOption(getField(content, "hasMapOption") !== "false");
      setGeoReady(getField(content, "geoReady") !== "false");
      setIsActive(getField(content, "isActive") !== "false");
      setMapLabelRu(
        getField(content, "mapLabelRu") || "Показать на карте",
      );
      setMapLabelEn(getField(content, "mapLabelEn") || "Show on map");
      setMapLabelDe(
        getField(content, "mapLabelDe") || "Auf der Karte anzeigen",
      );
      setMapLabelUk(getField(content, "mapLabelUk") || "Показати на мапі");
    },
    [getField],
  );

  const buildMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push("# Форма города");
    lines.push("");
    lines.push("Эта форма создаёт или обновляет только данные города.");
    lines.push("Форма достопримечательности не должна создавать города.");
    lines.push("");
    lines.push("## A. Страна");
    lines.push("");
    lines.push(`countryEn: ${countryEn}`);
    lines.push(`countryDe: ${countryDe}`);
    lines.push(`countryRu: ${countryRu}`);
    lines.push(`countryUk: ${countryUk}`);
    lines.push("");
    lines.push("## B. Город");
    lines.push("");
    lines.push(`nameEn: ${nameEn}`);
    lines.push(`nameDe: ${nameDe}`);
    lines.push(`nameRu: ${nameRu}`);
    lines.push(`nameUk: ${nameUk}`);
    lines.push("");
    lines.push("## C. Геоданные");
    lines.push("");
    lines.push(`geoLat: ${geoLat}`);
    lines.push(`geoLng: ${geoLng}`);
    lines.push(`geoSource: ${geoSource || "manual"}`);
    lines.push("");
    lines.push("## D. Информация о городе");
    lines.push("");
    lines.push(`cityInfoEn: ${cityInfoEn}`);
    lines.push(`cityInfoDe: ${cityInfoDe}`);
    lines.push(`cityInfoRu: ${cityInfoRu}`);
    lines.push(`cityInfoUk: ${cityInfoUk}`);
    lines.push("");
    lines.push("## E. Служебные поля (авто)");
    lines.push("");
    lines.push(`cityId: ${cityId}`);
    lines.push(`slug: ${slug}`);
    lines.push(`countryId: ${countryId}`);
    lines.push(`hasMapOption: ${hasMapOption ? "true" : "false"}`);
    lines.push(`geoReady: ${geoReady ? "true" : "false"}`);
    lines.push(`isActive: ${isActive ? "true" : "false"}`);
    lines.push(`mapLabelRu: ${mapLabelRu}`);
    lines.push(`mapLabelEn: ${mapLabelEn}`);
    lines.push(`mapLabelDe: ${mapLabelDe}`);
    lines.push(`mapLabelUk: ${mapLabelUk}`);
    lines.push("");
    return lines.join("\n");
  }, [
    cityId,
    cityInfoDe,
    cityInfoEn,
    cityInfoRu,
    cityInfoUk,
    countryDe,
    countryEn,
    countryId,
    countryRu,
    countryUk,
    geoLat,
    geoLng,
    geoReady,
    geoSource,
    hasMapOption,
    isActive,
    mapLabelDe,
    mapLabelEn,
    mapLabelRu,
    mapLabelUk,
    nameDe,
    nameEn,
    nameRu,
    nameUk,
    slug,
  ]);

  const loadForm = useCallback(async (cityId?: string) => {
    setLoading(true);
    setStatus(null);

    try {
      const query = cityId ? `?cityId=${encodeURIComponent(cityId)}` : "";
      const response = await fetch(`/api/agent/forms/city${query}`);
      const payload = (await response.json()) as LoadPayload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Не удалось загрузить форму города.");
      }

      setCityOptions(
        Array.isArray(payload.cityOptions) ? payload.cityOptions : [],
      );
      setParsedFields(payload.content || "");
      setMode(payload.mode === "edit" ? "edit" : "create");

      const nextCityId = payload.selectedCity?.cityId || cityId || "";
      setSelectedCityId(nextCityId);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка загрузки формы.",
      });
    } finally {
      setLoading(false);
    }
  }, [setParsedFields]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const handleSave = async () => {
    const markdown = buildMarkdown();
    setRawMarkdown(markdown);
    if (!markdown.trim()) {
      setStatus({ type: "error", message: "Форма пустая." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/agent/forms/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Не удалось сохранить форму города.");
      }

      setStatus({
        type: "success",
        message: payload.message || "Форма города сохранена.",
      });

      if (selectedCityId) {
        void loadForm(selectedCityId);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка сохранения формы.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCityId) {
      setStatus({ type: "error", message: "Выберите город для удаления." });
      return;
    }

    if (!window.confirm("Удалить выбранный город из реестра?")) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch(
        `/api/agent/forms/city?cityId=${encodeURIComponent(selectedCityId)}`,
        { method: "DELETE" },
      );

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Не удалось удалить город.");
      }

      setStatus({
        type: "success",
        message: payload.message || "Город удален.",
      });

      setSelectedCityId("");
      void loadForm();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Ошибка удаления.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Форма города</h2>
        <p className={styles.subtitle}>
          Создание и редактирование карточек городов для landmarks.
        </p>
      </div>

      <div className={styles.selector}>
        <label className={styles.label}>Город (для редактирования)</label>
        <select
          className={styles.select}
          value={selectedCityId}
          onChange={(event) => {
            const cityId = event.target.value;
            setSelectedCityId(cityId);
            void loadForm(cityId || undefined);
          }}
          disabled={loading || saving}
        >
          <option value="">Создать новый город</option>
          {cityOptions.map((item) => (
            <option key={item.cityId} value={item.cityId}>
              {item.label} ({item.slug})
            </option>
          ))}
        </select>
      </div>

      <div
        className={`${styles.modeIndicator} ${mode === "edit" ? styles.modeIndicatorEdit : styles.modeIndicatorCreate}`}
      >
        <span
          className={`${styles.modeDot} ${mode === "edit" ? styles.modeDotEdit : styles.modeDotCreate}`}
        />
        {mode === "edit"
          ? `Режим: редактирование${selectedCity ? ` (${selectedCity.label})` : ""}`
          : "Режим: создание"}
      </div>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>A. Страна</h3>
        <div className={styles.localeFieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>countryEn</label>
            <input
              className={styles.input}
              value={countryEn}
              onChange={(event) => setCountryEn(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>countryDe</label>
            <input
              className={styles.input}
              value={countryDe}
              onChange={(event) => setCountryDe(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>countryRu</label>
            <input
              className={styles.input}
              value={countryRu}
              onChange={(event) => setCountryRu(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>countryUk</label>
            <input
              className={styles.input}
              value={countryUk}
              onChange={(event) => setCountryUk(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>B. Город</h3>
        <div className={styles.localeFieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>nameEn</label>
            <input
              className={styles.input}
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>nameDe</label>
            <input
              className={styles.input}
              value={nameDe}
              onChange={(event) => setNameDe(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>nameRu</label>
            <input
              className={styles.input}
              value={nameRu}
              onChange={(event) => setNameRu(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>nameUk</label>
            <input
              className={styles.input}
              value={nameUk}
              onChange={(event) => setNameUk(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>C. Геоданные</h3>
        <div className={styles.builderControlRow}>
          <div className={styles.field}>
            <label className={styles.label}>geoLat</label>
            <input
              className={styles.input}
              value={geoLat}
              onChange={(event) => setGeoLat(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>geoLng</label>
            <input
              className={styles.input}
              value={geoLng}
              onChange={(event) => setGeoLng(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>geoSource</label>
            <input
              className={styles.input}
              value={geoSource}
              onChange={(event) => setGeoSource(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>D. Информация о городе</h3>
        <div className={styles.localeFieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>cityInfoEn</label>
            <textarea
              className={styles.textarea}
              value={cityInfoEn}
              onChange={(event) => setCityInfoEn(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>cityInfoDe</label>
            <textarea
              className={styles.textarea}
              value={cityInfoDe}
              onChange={(event) => setCityInfoDe(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>cityInfoRu</label>
            <textarea
              className={styles.textarea}
              value={cityInfoRu}
              onChange={(event) => setCityInfoRu(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>cityInfoUk</label>
            <textarea
              className={styles.textarea}
              value={cityInfoUk}
              onChange={(event) => setCityInfoUk(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
      </section>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>E. Служебные поля</h3>
        <div className={styles.builderControlRow}>
          <div className={styles.field}>
            <label className={styles.label}>cityId</label>
            <input
              className={styles.input}
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>slug</label>
            <input
              className={styles.input}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>countryId</label>
            <input
              className={styles.input}
              value={countryId}
              onChange={(event) => setCountryId(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
        <div className={styles.builderChecksRow}>
          <label>
            <input
              type="checkbox"
              checked={hasMapOption}
              onChange={(event) => setHasMapOption(event.target.checked)}
              disabled={loading || saving}
            />
            hasMapOption
          </label>
          <label>
            <input
              type="checkbox"
              checked={geoReady}
              onChange={(event) => setGeoReady(event.target.checked)}
              disabled={loading || saving}
            />
            geoReady
          </label>
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={loading || saving}
            />
            isActive
          </label>
        </div>
        <div className={styles.localeFieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>mapLabelRu</label>
            <input
              className={styles.input}
              value={mapLabelRu}
              onChange={(event) => setMapLabelRu(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>mapLabelEn</label>
            <input
              className={styles.input}
              value={mapLabelEn}
              onChange={(event) => setMapLabelEn(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>mapLabelDe</label>
            <input
              className={styles.input}
              value={mapLabelDe}
              onChange={(event) => setMapLabelDe(event.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>mapLabelUk</label>
            <input
              className={styles.input}
              value={mapLabelUk}
              onChange={(event) => setMapLabelUk(event.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
      </section>

      <details className={styles.builderRawDetails}>
        <summary>Показать raw markdown</summary>
        <div className={styles.markdownEditor}>
          <textarea
            className={styles.markdownTextarea}
            value={rawMarkdown}
            onChange={(event) => setRawMarkdown(event.target.value)}
            disabled
          />
        </div>
      </details>

      {status ? (
        <div className={status.type === "success" ? styles.statusSuccess : styles.statusError}>
          {status.message}
        </div>
      ) : null}

      <div className={styles.actions} style={{ gap: 8 }}>
        <button
          type="button"
          className="agent-button"
          onClick={() => void loadForm(selectedCityId || undefined)}
          disabled={loading || saving}
        >
          {loading ? "Загрузка..." : "Обновить"}
        </button>
        <button
          type="button"
          className="agent-button"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        <button
          type="button"
          className="agent-button"
          onClick={handleDelete}
          disabled={loading || saving || !selectedCityId}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
