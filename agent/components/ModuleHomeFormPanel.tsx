"use client";

import React, { useState, useEffect } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

interface ModuleHomeFormState {
  greetingRu: string;
  greetingEn: string;
  greetingDe: string;
  greetingUk: string;
  contentRu: string;
  contentEn: string;
  contentDe: string;
  contentUk: string;
  stampImage: string;
  illustration1L: string;
  illustration1R: string;
  illustration2L: string;
  illustration2R: string;
  illustration3L: string;
  illustration3R: string;
  closingTextRu: string;
  closingTextEn: string;
  closingTextDe: string;
  closingTextUk: string;
}

interface ImagePreviews {
  stampImage: string;
  illustration1L: string;
  illustration1R: string;
  illustration2L: string;
  illustration2R: string;
  illustration3L: string;
  illustration3R: string;
}

const initialState: ModuleHomeFormState = {
  greetingRu: "",
  greetingEn: "",
  greetingDe: "",
  greetingUk: "",
  contentRu: "",
  contentEn: "",
  contentDe: "",
  contentUk: "",
  stampImage: "",
  illustration1L: "",
  illustration1R: "",
  illustration2L: "",
  illustration2R: "",
  illustration3L: "",
  illustration3R: "",
  closingTextRu: "",
  closingTextEn: "",
  closingTextDe: "",
  closingTextUk: "",
};

export default function ModuleHomeFormPanel() {
  const [formData, setFormData] = useState<ModuleHomeFormState>(initialState);
  const [imagePreviews, setImagePreviews] = useState<ImagePreviews>({
    stampImage: "",
    illustration1L: "",
    illustration1R: "",
    illustration2L: "",
    illustration2R: "",
    illustration3L: "",
    illustration3R: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load form template
  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agent/forms/module-home");
      const template = await response.text();
      const parsed = parseFormMarkdown(template);
      setFormData(parsed);
      loadImagePreviews(parsed);
      setMessage("Форма загружена");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const parseFormMarkdown = (markdown: string): ModuleHomeFormState => {
    const data: ModuleHomeFormState = { ...initialState };

    // Parse key-value fields
    const parseKeyValue = (key: string): string => {
      const regex = new RegExp(`^${key}\\s*:\\s*(.+?)(?=\\n|$)`, "m");
      const match = markdown.match(regex);
      return match?.[1]?.trim() || "";
    };

    // Parse multiline fields
    const parseMultiline = (key: string): string => {
      const regex = new RegExp(
        `^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`,
        "m",
      );
      const match = markdown.match(regex);
      return match?.[1]?.trim() || "";
    };

    data.greetingRu = parseKeyValue("greetingRu");
    data.greetingEn = parseKeyValue("greetingEn");
    data.greetingDe = parseKeyValue("greetingDe");
    data.greetingUk = parseKeyValue("greetingUk");

    data.contentRu = parseMultiline("contentRu");
    data.contentEn = parseMultiline("contentEn");
    data.contentDe = parseMultiline("contentDe");
    data.contentUk = parseMultiline("contentUk");

    data.stampImage = parseKeyValue("stampImage");
    data.illustration1L = parseKeyValue("illustration1L");
    data.illustration1R = parseKeyValue("illustration1R");
    data.illustration2L = parseKeyValue("illustration2L");
    data.illustration2R = parseKeyValue("illustration2R");
    data.illustration3L = parseKeyValue("illustration3L");
    data.illustration3R = parseKeyValue("illustration3R");
    data.closingTextRu = parseKeyValue("closingTextRu");
    data.closingTextEn = parseKeyValue("closingTextEn");
    data.closingTextDe = parseKeyValue("closingTextDe");
    data.closingTextUk = parseKeyValue("closingTextUk");

    return data;
  };

  // Load previews from parsed image paths
  const loadImagePreviews = (data: ModuleHomeFormState) => {
    const previews: ImagePreviews = {
      stampImage: "",
      illustration1L: "",
      illustration1R: "",
      illustration2L: "",
      illustration2R: "",
      illustration3L: "",
      illustration3R: "",
    };

    // Load image paths from form data
    Object.keys(previews).forEach((key) => {
      const value = data[key as keyof ModuleHomeFormState];
      if (value && (value.startsWith("/") || value.startsWith("http"))) {
        previews[key as keyof ImagePreviews] = value;
      }
    });

    setImagePreviews(previews);
  };

  const buildFormMarkdown = (): string => {
    return `# Форма главной страницы модуля Landmarks

Эта форма создаёт или обновляет главную страницу модуля landmarks (module-home).
Каждое поле - отдельный блок для удобства редактирования.

## A. Приветствие - Русский

greetingRu: ${formData.greetingRu}

## A. Приветствие - English

greetingEn: ${formData.greetingEn}

## A. Приветствие - Deutsch

greetingDe: ${formData.greetingDe}

## A. Приветствие - Українська

greetingUk: ${formData.greetingUk}

## B. Контент - Русский

contentRu:
${formData.contentRu}

## B. Контент - English

contentEn:
${formData.contentEn}

## B. Контент - Deutsch

contentDe:
${formData.contentDe}

## B. Контент - Українська

contentUk:
${formData.contentUk}

## C. Иллюстрация почтовой марки

stampImage: ${formData.stampImage}

## D. Иллюстрация блока 1 - Слева

illustration1L: ${formData.illustration1L}

## D. Иллюстрация блока 1 - Справа

illustration1R: ${formData.illustration1R}

## D. Иллюстрация блока 2 - Слева

illustration2L: ${formData.illustration2L}

## D. Иллюстрация блока 2 - Справа

illustration2R: ${formData.illustration2R}

## D. Иллюстрация блока 3 - Слева

illustration3L: ${formData.illustration3L}

## D. Иллюстрация блока 3 - Справа

illustration3R: ${formData.illustration3R}

## E. Заключительная фраза - Русский

closingTextRu: ${formData.closingTextRu}

## E. Заключительная фраза - English

closingTextEn: ${formData.closingTextEn}

## E. Заключительная фраза - Deutsch

closingTextDe: ${formData.closingTextDe}

## E. Заключительная фраза - Українська

closingTextUk: ${formData.closingTextUk}

## F. Служебные поля (авто)

pageKind: module-home
moduleKey: landmarks
pageId: (генерируется автоматически)
slug: landmarks
schemaVersion: 1.1.0`;
  };

  const handleChange = (key: keyof ModuleHomeFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (
    fieldName: keyof ImagePreviews,
    file: File | null,
  ) => {
    if (!file) {
      setImagePreviews((prev) => ({ ...prev, [fieldName]: "" }));
      setFormData((prev) => ({ ...prev, [fieldName]: "" }));
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreviews((prev) => ({ ...prev, [fieldName]: dataUrl }));
    };
    reader.readAsDataURL(file);

    // Upload file to server
    uploadImageFile(file, fieldName);
  };

  const uploadImageFile = async (
    file: File,
    fieldName: keyof ImagePreviews,
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
        const error = await response.json();
        setMessage(`❌ Ошибка загрузки файла: ${error.message}`);
        return;
      }

      const { path: imagePath } = await response.json();
      // Store the public path for markdown serialization
      setFormData((prev) => ({ ...prev, [fieldName]: imagePath }));
    } catch (error) {
      setMessage(`❌ Ошибка загрузки: ${error}`);
    }
  };

  const removeImage = (fieldName: keyof ImagePreviews) => {
    setImagePreviews((prev) => ({ ...prev, [fieldName]: "" }));
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const markdown = buildFormMarkdown();
      const response = await fetch("/api/agent/forms/module-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      if (response.ok) {
        setMessage("✅ Форма сохранена успешно");
      } else {
        const error = await response.text();
        setMessage(`❌ Ошибка сохранения: ${error}`);
      }
    } catch (error) {
      setMessage(`❌ Ошибка: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка формы...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма главной страницы (Module Home)</h2>

      {/* Greetings Section */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>A. Приветствие (4 языка)</legend>

        <div className={styles.field}>
          <label className={styles.label}>Русский (greetingRu)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.greetingRu}
            onChange={(e) => handleChange("greetingRu", e.target.value)}
            placeholder="Привет. Меня зовут Кетти."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>English (greetingEn)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.greetingEn}
            onChange={(e) => handleChange("greetingEn", e.target.value)}
            placeholder="Hello. My name is Ketty."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Deutsch (greetingDe)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.greetingDe}
            onChange={(e) => handleChange("greetingDe", e.target.value)}
            placeholder="Hallo. Mein Name ist Ketty."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Українська (greetingUk)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.greetingUk}
            onChange={(e) => handleChange("greetingUk", e.target.value)}
            placeholder="Привіт. Мене звуть Кеті."
          />
        </div>
      </fieldset>

      {/* Content Section */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          B. Контент (4 многострочных поля)
        </legend>
        <p className={styles.hint}>
          Разделяйте смысловые блоки через `---` на отдельной строке
        </p>

        <div className={styles.field}>
          <label className={styles.label}>Русский (contentRu)</label>
          <textarea
            className={styles.textarea}
            value={formData.contentRu}
            onChange={(e) => handleChange("contentRu", e.target.value)}
            placeholder="Готовый текст открытки на русском"
            rows={6}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>English (contentEn)</label>
          <textarea
            className={styles.textarea}
            value={formData.contentEn}
            onChange={(e) => handleChange("contentEn", e.target.value)}
            placeholder="Ready postcard text in English"
            rows={6}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Deutsch (contentDe)</label>
          <textarea
            className={styles.textarea}
            value={formData.contentDe}
            onChange={(e) => handleChange("contentDe", e.target.value)}
            placeholder="Fertiger Poskartentext auf Deutsch"
            rows={6}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Українська (contentUk)</label>
          <textarea
            className={styles.textarea}
            value={formData.contentUk}
            onChange={(e) => handleChange("contentUk", e.target.value)}
            placeholder="Готовий текст листівки українською"
            rows={6}
          />
        </div>
      </fieldset>

      {/* Stamp Image */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>C. Иллюстрация почтовой марки</legend>
        <div className={styles.field}>
          <label className={styles.label}>stampImage</label>
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) =>
              handleImageChange("stampImage", e.target.files?.[0] || null)
            }
          />
          {imagePreviews.stampImage && (
            <div className={styles.imagePreviewContainer}>
              <img
                src={imagePreviews.stampImage}
                alt="Stamp Preview"
                className={styles.imagePreview}
              />
              <div className={styles.imageInfo}>
                <span className={styles.imageStatus}>активен</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeImage("stampImage")}
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Illustrations Section */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          D. Иллюстрации блоков (6 полей)
        </legend>

        <div className={styles.illustrationGroup}>
          <div className={styles.field}>
            <label className={styles.label}>Блок 1 - Слева (1L)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration1L", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration1L && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration1L}
                  alt="Illustration 1L Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration1L")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Блок 1 - Справа (1R)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration1R", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration1R && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration1R}
                  alt="Illustration 1R Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration1R")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.illustrationGroup}>
          <div className={styles.field}>
            <label className={styles.label}>Блок 2 - Слева (2L)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration2L", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration2L && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration2L}
                  alt="Illustration 2L Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration2L")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Блок 2 - Справа (2R)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration2R", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration2R && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration2R}
                  alt="Illustration 2R Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration2R")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.illustrationGroup}>
          <div className={styles.field}>
            <label className={styles.label}>Блок 3 - Слева (3L)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration3L", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration3L && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration3L}
                  alt="Illustration 3L Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration3L")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Блок 3 - Справа (3R)</label>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) =>
                handleImageChange("illustration3R", e.target.files?.[0] || null)
              }
            />
            {imagePreviews.illustration3R && (
              <div className={styles.imagePreviewContainer}>
                <img
                  src={imagePreviews.illustration3R}
                  alt="Illustration 3R Preview"
                  className={styles.imagePreview}
                />
                <div className={styles.imageInfo}>
                  <span className={styles.imageStatus}>активен</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage("illustration3R")}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* Closing Section */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          E. Заключительная фраза (4 языка)
        </legend>

        <div className={styles.field}>
          <label className={styles.label}>Русский (closingTextRu)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.closingTextRu}
            onChange={(e) => handleChange("closingTextRu", e.target.value)}
            placeholder="Открытки приходят не по расписанию."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>English (closingTextEn)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.closingTextEn}
            onChange={(e) => handleChange("closingTextEn", e.target.value)}
            placeholder="Postcards come not by schedule."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Deutsch (closingTextDe)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.closingTextDe}
            onChange={(e) => handleChange("closingTextDe", e.target.value)}
            placeholder="Postkarten kommen nicht nach Plan."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Українська (closingTextUk)</label>
          <input
            type="text"
            className={styles.input}
            value={formData.closingTextUk}
            onChange={(e) => handleChange("closingTextUk", e.target.value)}
            placeholder="Листівки приходять не за розкладом."
          />
        </div>
      </fieldset>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Сохранить форму"}
        </button>
        <button className={styles.buttonSecondary} onClick={loadForm}>
          Перезагрузить
        </button>
      </div>

      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
}
