"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./FormPanel.module.css";

type LandmarkFormType =
  | "module-home"
  | "city"
  | "collection-home"
  | "landmark-item";

type MarkdownFormPanelProps = {
  formType: LandmarkFormType;
};

const API_PATHS: Record<LandmarkFormType, string | null> = {
  "module-home": "/api/agent/forms/module-home",
  city: "/api/agent/forms/city",
  "collection-home": "/api/agent/forms/collection-home",
  "landmark-item": null, // Uses FormRenderer instead
};

const FORM_TITLES: Record<LandmarkFormType, string> = {
  "module-home": "Главная страница модуля Landmarks",
  city: "Город (реестр)",
  "collection-home": "Страница города",
  "landmark-item": "Открытка достопримечательности",
};

export function MarkdownFormPanel({ formType }: MarkdownFormPanelProps) {
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const apiPath = API_PATHS[formType];

  const loadForm = useCallback(async () => {
    if (!apiPath) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch(apiPath, { method: "GET" });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не удалось загрузить форму.");
      }

      setMarkdown(payload.content ?? "");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка загрузки формы.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSubmit = async () => {
    if (!apiPath) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(apiPath, {
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
        message: payload.message ?? "Форма успешно сохранена.",
      });

      // Reload form to get updated content
      await loadForm();
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

  if (!apiPath) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ошибка</h2>
          <p className={styles.subtitle}>
            Тип формы {formType} не поддерживается через MarkdownFormPanel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{FORM_TITLES[formType]}</h2>
        <p className={styles.subtitle}>
          Редактируйте поля в формате markdown ниже.
        </p>
      </div>

      <div className={styles.markdownEditor}>
        <textarea
          className={`${styles.markdownTextarea} markdownTextarea`}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          disabled={isLoading || isSubmitting}
          placeholder="Загрузка формы..."
          rows={30}
        />
      </div>

      <div className={styles.actions}>
        <button
          className="agent-button"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || !markdown.trim()}
        >
          {isSubmitting ? "Отправляю..." : "Сохранить"}
        </button>
        <button
          className="agent-button"
          onClick={loadForm}
          disabled={isSubmitting || isLoading}
          style={{ marginLeft: "8px" }}
        >
          Перезагрузить
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
