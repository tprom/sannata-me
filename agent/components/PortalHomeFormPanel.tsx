"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./FormPanel.module.css";
import {
  PORTAL_HOME_LOCALES,
  type DynamicIllustration,
  type DynamicTextBlock,
  type IllustrationSize,
  type IllustrationType,
  normalizePortalHomeFormData,
  type PortalHomeFormData,
  type PortalHomeLocale,
  type TextAlign,
  type TextSpacing,
  type TextTone,
} from "@/types/portalHomeForm";

type PageSide = "left" | "right";

const LOCALE_LABELS: Record<PortalHomeLocale, string> = {
  ru: "Русский",
  en: "Английский",
  de: "Немецкий",
  uk: "Украинский",
};

const TONE_OPTIONS: Array<{ value: TextTone; label: string }> = [
  { value: "normal", label: "Обычный" },
  { value: "bold", label: "Полужирный" },
  { value: "italic", label: "Курсив" },
  { value: "highlight", label: "Выделение" },
];

const ALIGN_OPTIONS: Array<{ value: TextAlign; label: string }> = [
  { value: "left", label: "Слева" },
  { value: "center", label: "По центру" },
  { value: "right", label: "Справа" },
];

const SPACING_OPTIONS: Array<{ value: TextSpacing; label: string }> = [
  { value: "compact", label: "Плотные" },
  { value: "normal", label: "Обычные" },
  { value: "relaxed", label: "Свободные" },
];

const KIND_OPTIONS: Array<{ value: DynamicTextBlock["kind"]; label: string }> =
  [
    { value: "paragraph", label: "Абзац" },
    { value: "lead", label: "Лид" },
    { value: "heading", label: "Заголовок" },
    { value: "quote", label: "Цитата" },
    { value: "list", label: "Список" },
    { value: "note", label: "Примечание" },
  ];

const ILLUSTRATION_SIZE_OPTIONS: Array<{
  value: IllustrationSize;
  label: string;
}> = [
  { value: "small-30", label: "Маленький (30%)" },
  { value: "reduced-40", label: "Уменьшенный (40%)" },
  { value: "medium-50", label: "Средний (50%)" },
  { value: "large-75", label: "Крупный (75%)" },
  { value: "full-100", label: "Большой (100%)" },
];

const ILLUSTRATION_TYPE_OPTIONS: Array<{
  value: IllustrationType;
  label: string;
}> = [
  { value: "ketty-drawing", label: "Рисунок Кетти" },
  { value: "photo", label: "Фото" },
  { value: "decor", label: "Декор" },
];

const cloneData = (value: PortalHomeFormData): PortalHomeFormData =>
  structuredClone(value);

const createTextBlock = (): DynamicTextBlock => ({
  text: { ru: "", en: "", de: "", uk: "" },
  kind: "paragraph",
  tone: "normal",
  align: "left",
  spacing: "normal",
  sizeAdjust: 0,
});

const createIllustration = (): DynamicIllustration => ({
  image: "",
  caption: { ru: "", en: "", de: "", uk: "" },
  size: "medium-50",
  type: "ketty-drawing",
  position: "center",
  insert: {
    where: "after",
    paragraph: 1,
  },
  rotate: 0,
  anchor: "",
  wrap: true,
  shadow: false,
  border: false,
});

const getTextBlocks = (data: PortalHomeFormData, side: PageSide) =>
  side === "left" ? data.leftPage.textBlocks : data.rightPage.textBlocks;

const getIllustrations = (data: PortalHomeFormData, side: PageSide) =>
  side === "left" ? data.leftPage.illustrations : data.rightPage.illustrations;

export default function PortalHomeFormPanel() {
  const [formData, setFormData] = useState<PortalHomeFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadForm = useCallback(async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/agent/forms/portal-home", {
        method: "GET",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        content?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok || !payload.content) {
        throw new Error(
          payload.message ?? "Не удалось загрузить форму портала.",
        );
      }

      const parsed = JSON.parse(payload.content) as unknown;
      const normalized = normalizePortalHomeFormData(parsed);
      if (!normalized.ok || !normalized.value) {
        throw new Error(`Ошибка схемы: ${normalized.errors[0] ?? "unknown"}`);
      }

      setFormData(normalized.value);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка загрузки формы.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const updateData = (updater: (draft: PortalHomeFormData) => void) => {
    if (!formData) return;
    const next = cloneData(formData);
    updater(next);
    setFormData(next);
  };

  const updateMottoText = (locale: PortalHomeLocale, value: string) => {
    updateData((draft) => {
      draft.leftPage.motto[locale] = value;
    });
  };

  const updateMottoTone = (tone: TextTone) => {
    updateData((draft) => {
      draft.leftPage.mottoStyle.tone = tone;
    });
  };

  const updateMottoSize = (value: -1 | 0 | 1) => {
    updateData((draft) => {
      draft.leftPage.mottoStyle.sizeAdjust = value;
    });
  };

  const addTextBlock = (side: PageSide) => {
    updateData((draft) => {
      getTextBlocks(draft, side).push(createTextBlock());
    });
  };

  const removeTextBlock = (side: PageSide, index: number) => {
    updateData((draft) => {
      getTextBlocks(draft, side).splice(index, 1);
    });
  };

  const updateTextBlock = (
    side: PageSide,
    index: number,
    patch: Partial<DynamicTextBlock>,
  ) => {
    updateData((draft) => {
      const block = getTextBlocks(draft, side)[index];
      if (!block) return;
      Object.assign(block, patch);
    });
  };

  const updateTextBlockText = (
    side: PageSide,
    index: number,
    locale: PortalHomeLocale,
    value: string,
  ) => {
    updateData((draft) => {
      const block = getTextBlocks(draft, side)[index];
      if (!block) return;
      block.text[locale] = value;
    });
  };

  const addIllustration = (side: PageSide) => {
    updateData((draft) => {
      getIllustrations(draft, side).push(createIllustration());
    });
  };

  const removeIllustration = (side: PageSide, index: number) => {
    updateData((draft) => {
      getIllustrations(draft, side).splice(index, 1);
    });
  };

  const updateIllustration = (
    side: PageSide,
    index: number,
    patch: Partial<DynamicIllustration>,
  ) => {
    updateData((draft) => {
      const illustration = getIllustrations(draft, side)[index];
      if (!illustration) return;
      Object.assign(illustration, patch);
    });
  };

  const updateIllustrationCaption = (
    side: PageSide,
    index: number,
    locale: PortalHomeLocale,
    value: string,
  ) => {
    updateData((draft) => {
      const illustration = getIllustrations(draft, side)[index];
      if (!illustration) return;
      illustration.caption[locale] = value;
    });
  };

  const uploadIllustrationFile = async (
    side: PageSide,
    index: number,
    file: File,
  ) => {
    try {
      const formPayload = new FormData();
      formPayload.append("file", file);
      formPayload.append(
        "fieldName",
        `portal-home-${side}-illustration-${index + 1}`,
      );

      const response = await fetch("/api/agent/upload", {
        method: "POST",
        body: formPayload,
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        path?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.ok || !payload.path) {
        throw new Error(payload?.message ?? "Ошибка загрузки изображения.");
      }

      updateData((draft) => {
        const illustration = getIllustrations(draft, side)[index];
        if (!illustration) return;
        illustration.image = payload.path ?? "";
      });

      setStatus({ type: "success", message: "Изображение загружено." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ошибка загрузки изображения.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const normalized = normalizePortalHomeFormData(formData);
    if (!normalized.ok || !normalized.value) {
      setStatus({
        type: "error",
        message: `Ошибка схемы: ${normalized.errors[0] ?? "unknown"}`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/agent/forms/portal-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(normalized.value, null, 2),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Не удалось сохранить форму.");
      }

      setStatus({
        type: "success",
        message: payload?.message ?? "Форма портала сохранена.",
      });
      await loadForm();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Ошибка сохранения формы.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftTextBlocks = useMemo(
    () => (formData ? formData.leftPage.textBlocks : []),
    [formData],
  );

  const rightTextBlocks = useMemo(
    () => (formData ? formData.rightPage.textBlocks : []),
    [formData],
  );

  const leftIllustrations = useMemo(
    () => (formData ? formData.leftPage.illustrations : []),
    [formData],
  );

  const rightIllustrations = useMemo(
    () => (formData ? formData.rightPage.illustrations : []),
    [formData],
  );

  const renderLocalizedTextFields = (
    label: string,
    getValue: (locale: PortalHomeLocale) => string,
    onChange: (locale: PortalHomeLocale, value: string) => void,
    singleLine: boolean,
  ) => (
    <div className={styles.localeFieldGrid}>
      {PORTAL_HOME_LOCALES.map((locale) => (
        <label key={`${label}-${locale}`} className={styles.field}>
          <span className={styles.label}>
            {label} ({LOCALE_LABELS[locale]})
          </span>
          {singleLine ? (
            <input
              className={styles.input}
              value={getValue(locale)}
              onChange={(event) => onChange(locale, event.target.value)}
              disabled={isLoading || isSubmitting || !formData}
            />
          ) : (
            <textarea
              className={styles.textarea}
              rows={4}
              value={getValue(locale)}
              onChange={(event) => onChange(locale, event.target.value)}
              disabled={isLoading || isSubmitting || !formData}
            />
          )}
        </label>
      ))}
    </div>
  );

  const renderTextBlockEditor = (
    side: PageSide,
    block: DynamicTextBlock,
    index: number,
  ) => (
    <div key={`${side}-text-${index}`} className={styles.builderBlockCard}>
      <div className={styles.builderBlockHeader}>
        <h4 className={styles.builderBlockTitle}>
          Текстовый блок #{index + 1}
        </h4>
        <button
          className="agent-button"
          type="button"
          onClick={() => removeTextBlock(side, index)}
          disabled={isLoading || isSubmitting}
        >
          Удалить блок
        </button>
      </div>

      {renderLocalizedTextFields(
        "Текст",
        (locale) => block.text[locale],
        (locale, value) => updateTextBlockText(side, index, locale, value),
        false,
      )}

      <div className={styles.builderControlRow}>
        <label className={styles.field}>
          <span className={styles.label}>Тип блока</span>
          <select
            className={styles.select}
            value={block.kind}
            onChange={(event) =>
              updateTextBlock(side, index, {
                kind: event.target.value as DynamicTextBlock["kind"],
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {KIND_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Стиль</span>
          <select
            className={styles.select}
            value={block.tone}
            onChange={(event) =>
              updateTextBlock(side, index, {
                tone: event.target.value as TextTone,
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {TONE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Выравнивание</span>
          <select
            className={styles.select}
            value={block.align}
            onChange={(event) =>
              updateTextBlock(side, index, {
                align: event.target.value as TextAlign,
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {ALIGN_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Интервалы</span>
          <select
            className={styles.select}
            value={block.spacing}
            onChange={(event) =>
              updateTextBlock(side, index, {
                spacing: event.target.value as TextSpacing,
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {SPACING_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const renderIllustrationEditor = (
    side: PageSide,
    illustration: DynamicIllustration,
    index: number,
  ) => (
    <div
      key={`${side}-illustration-${index}`}
      className={styles.builderImageCard}
    >
      <div className={styles.builderBlockHeader}>
        <h4 className={styles.builderBlockTitle}>Иллюстрация #{index + 1}</h4>
        <button
          className="agent-button"
          type="button"
          onClick={() => removeIllustration(side, index)}
          disabled={isLoading || isSubmitting}
        >
          Удалить
        </button>
      </div>

      <div className={styles.builderControlRow}>
        <label className={styles.field}>
          <span className={styles.label}>Загрузить изображение</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadIllustrationFile(side, index, file);
              }
            }}
            disabled={isLoading || isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Путь к изображению</span>
          <input
            className={styles.input}
            value={illustration.image}
            onChange={(event) =>
              updateIllustration(side, index, { image: event.target.value })
            }
            disabled={isLoading || isSubmitting}
          />
        </label>
      </div>

      {illustration.image ? (
        <div className={styles.imagePreviewBox}>
          <img src={illustration.image} alt={`preview-${side}-${index}`} />
        </div>
      ) : null}

      {renderLocalizedTextFields(
        "Подпись",
        (locale) => illustration.caption[locale],
        (locale, value) =>
          updateIllustrationCaption(side, index, locale, value),
        true,
      )}

      <div className={styles.builderControlRow}>
        <label className={styles.field}>
          <span className={styles.label}>Размер</span>
          <select
            className={styles.select}
            value={illustration.size}
            onChange={(event) =>
              updateIllustration(side, index, {
                size: event.target.value as IllustrationSize,
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {ILLUSTRATION_SIZE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Тип</span>
          <select
            className={styles.select}
            value={illustration.type}
            onChange={(event) =>
              updateIllustration(side, index, {
                type: event.target.value as IllustrationType,
              })
            }
            disabled={isLoading || isSubmitting}
          >
            {ILLUSTRATION_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Позиция</span>
          <select
            className={styles.select}
            value={illustration.position}
            onChange={(event) =>
              updateIllustration(side, index, {
                position: event.target.value as DynamicIllustration["position"],
              })
            }
            disabled={isLoading || isSubmitting}
          >
            <option value="left">Слева</option>
            <option value="right">Справа</option>
            <option value="center">По центру</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Вставка</span>
          <select
            className={styles.select}
            value={illustration.insert.where}
            onChange={(event) =>
              updateIllustration(side, index, {
                insert: {
                  ...illustration.insert,
                  where: event.target.value as "before" | "after",
                },
              })
            }
            disabled={isLoading || isSubmitting}
          >
            <option value="before">до абзаца</option>
            <option value="after">после абзаца</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Номер абзаца</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={illustration.insert.paragraph}
            onChange={(event) =>
              updateIllustration(side, index, {
                insert: {
                  ...illustration.insert,
                  paragraph: Math.max(1, Number(event.target.value) || 1),
                },
              })
            }
            disabled={isLoading || isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Поворот (-10..10)</span>
          <input
            className={styles.input}
            type="number"
            min={-10}
            max={10}
            value={illustration.rotate}
            onChange={(event) =>
              updateIllustration(side, index, {
                rotate: Math.max(
                  -10,
                  Math.min(10, Number(event.target.value) || 0),
                ),
              })
            }
            disabled={isLoading || isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Якорь (необязательно)</span>
          <input
            className={styles.input}
            value={illustration.anchor}
            onChange={(event) =>
              updateIllustration(side, index, { anchor: event.target.value })
            }
            disabled={isLoading || isSubmitting}
          />
        </label>
      </div>

      <div className={styles.builderChecksRow}>
        <label>
          <input
            type="checkbox"
            checked={illustration.wrap}
            onChange={(event) =>
              updateIllustration(side, index, { wrap: event.target.checked })
            }
            disabled={isLoading || isSubmitting}
          />
          Обтекание текстом
        </label>
        <label>
          <input
            type="checkbox"
            checked={illustration.shadow}
            onChange={(event) =>
              updateIllustration(side, index, { shadow: event.target.checked })
            }
            disabled={isLoading || isSubmitting}
          />
          Тень
        </label>
        <label>
          <input
            type="checkbox"
            checked={illustration.border}
            onChange={(event) =>
              updateIllustration(side, index, { border: event.target.checked })
            }
            disabled={isLoading || isSubmitting}
          />
          Рамка
        </label>
      </div>
    </div>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Форма главной страницы портала</h2>
        <p className={styles.subtitle}>
          Динамическое создание левой и правой страниц.
        </p>
      </div>

      <section className={styles.builderSection}>
        <h3 className={styles.builderSectionTitle}>
          Левая страница: Блок 1 (девиз)
        </h3>

        {renderLocalizedTextFields(
          "Девиз",
          (locale) => formData?.leftPage.motto[locale] ?? "",
          (locale, value) => updateMottoText(locale, value),
          true,
        )}

        <div className={styles.builderControlRow}>
          <label className={styles.field}>
            <span className={styles.label}>Стиль</span>
            <select
              className={styles.select}
              value={formData?.leftPage.mottoStyle.tone ?? "normal"}
              onChange={(event) =>
                updateMottoTone(event.target.value as TextTone)
              }
              disabled={isLoading || isSubmitting || !formData}
            >
              {TONE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Размер</span>
            <select
              className={styles.select}
              value={formData?.leftPage.mottoStyle.sizeAdjust ?? 0}
              onChange={(event) =>
                updateMottoSize(Number(event.target.value) as -1 | 0 | 1)
              }
              disabled={isLoading || isSubmitting || !formData}
            >
              <option value={-1}>-1</option>
              <option value={0}>0</option>
              <option value={1}>+1</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>
            Левая страница: Блок 2 (текст)
          </h3>
          <button
            className="agent-button"
            type="button"
            onClick={() => addTextBlock("left")}
            disabled={isLoading || isSubmitting || !formData}
          >
            + Текстовый блок
          </button>
        </div>

        {leftTextBlocks.map((block, index) =>
          renderTextBlockEditor("left", block, index),
        )}
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>
            Левая страница: Блок 3 (иллюстрации)
          </h3>
          <button
            className="agent-button"
            type="button"
            onClick={() => addIllustration("left")}
            disabled={isLoading || isSubmitting || !formData}
          >
            + Иллюстрация
          </button>
        </div>

        {leftIllustrations.map((illustration, index) =>
          renderIllustrationEditor("left", illustration, index),
        )}
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>
            Правая страница: Блок 1 (текст)
          </h3>
          <button
            className="agent-button"
            type="button"
            onClick={() => addTextBlock("right")}
            disabled={isLoading || isSubmitting || !formData}
          >
            + Текстовый блок
          </button>
        </div>

        {rightTextBlocks.map((block, index) =>
          renderTextBlockEditor("right", block, index),
        )}
      </section>

      <section className={styles.builderSection}>
        <div className={styles.builderSectionHeader}>
          <h3 className={styles.builderSectionTitle}>
            Правая страница: Блок 2 (иллюстрации)
          </h3>
          <button
            className="agent-button"
            type="button"
            onClick={() => addIllustration("right")}
            disabled={isLoading || isSubmitting || !formData}
          >
            + Иллюстрация
          </button>
        </div>

        {rightIllustrations.map((illustration, index) =>
          renderIllustrationEditor("right", illustration, index),
        )}
      </section>

      <div className={styles.actions}>
        <button
          className="agent-button"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || !formData}
        >
          {isSubmitting ? "Сохраняю..." : "Сохранить"}
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
