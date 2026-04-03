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
  const [markdown, setMarkdown] = useState("");
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

      setCityOptions(Array.isArray(payload.cityOptions) ? payload.cityOptions : []);
      setMarkdown(payload.content || "");
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
  }, []);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const handleSave = async () => {
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

      <div className={styles.markdownEditor}>
        <textarea
          className={styles.markdownTextarea}
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          placeholder="Здесь будет markdown формы города"
          disabled={loading || saving}
        />
      </div>

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
