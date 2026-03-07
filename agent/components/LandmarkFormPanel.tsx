"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type CityOption = { cityId: string; slug: string; label: string };

type LandmarkBlocks = {
  passport: string;
  history: string;
  meaning: string;
  legends: string;
  visual: string;
  sensory: string;
  touristExperience: string;
  sources: string;
};

type ImageDraft = {
  file: string;
  prompt: string;
};

const emptyBlocks = (): LandmarkBlocks => ({
  passport: "",
  history: "",
  meaning: "",
  legends: "",
  visual: "",
  sensory: "",
  touristExperience: "",
  sources: "",
});

const decodeMultiline = (value: string): string => value.replace(/\\n/g, "\n");
const encodeMultiline = (value: string): string =>
  value.replace(/\r?\n/g, "\\n");

const parseField = (markdown: string, key: string): string => {
  const m = markdown.match(new RegExp(`^${key}:[ \\t]*([^\\r\\n]*)$`, "m"));
  return m ? m[1].trim() : "";
};

const parseMultiline = (markdown: string, key: string): string => {
  const single = parseField(markdown, key);
  if (single) return decodeMultiline(single);

  const regex = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=^##|\\Z)`, "m");
  const match = markdown.match(regex);
  return match?.[1]?.trim() || "";
};

const parseImages = (markdown: string): ImageDraft[] => {
  const indices = new Set<number>();
  const indexedPattern = /image\[(\d+)\]\.(file|prompt):[ \t]*([^\r\n]*)$/gm;
  for (const match of markdown.matchAll(indexedPattern)) {
    indices.add(Number.parseInt(match[1], 10));
  }

  if (indices.size > 0) {
    return [...indices]
      .sort((a, b) => a - b)
      .map((idx) => ({
        file: parseField(markdown, `image\\[${idx}\\]\\.file`),
        prompt: parseMultiline(markdown, `image\\[${idx}\\]\\.prompt`),
      }))
      .filter((item) => item.file || item.prompt);
  }

  const legacy: ImageDraft[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const file = parseField(markdown, `image${i}File`);
    const prompt = parseMultiline(markdown, `image${i}Prompt`);
    if (!file && !prompt) continue;
    legacy.push({ file, prompt });
  }
  return legacy;
};

export default function LandmarkFormPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [landmark, setLandmark] = useState("");
  const [landmarkSlug, setLandmarkSlug] = useState("");
  const [geoLat, setGeoLat] = useState("");
  const [geoLng, setGeoLng] = useState("");
  const [geoSource, setGeoSource] = useState("manual");

  const [blocks, setBlocks] = useState<LandmarkBlocks>(emptyBlocks());
  const [greeting, setGreeting] = useState("Милый друг,");
  const [footer, setFooter] = useState(
    "Читать полную историю в книге\nКнига Кетти",
  );
  const [stampPrompt, setStampPrompt] = useState("");

  const [imageSlots, setImageSlots] = useState("8");
  const [commonImagePrompt, setCommonImagePrompt] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agent/forms/landmark");
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.message ?? "Не удалось загрузить форму");
      }

      const md = String(payload.content || "");
      const options = Array.isArray(payload.cityOptions)
        ? (payload.cityOptions as CityOption[])
        : [];
      setCityOptions(options);

      setCityId(parseField(md, "cityId"));
      setLandmark(parseField(md, "landmark"));
      setLandmarkSlug(parseField(md, "landmarkSlug"));
      setGeoLat(parseField(md, "geoLat"));
      setGeoLng(parseField(md, "geoLng"));
      setGeoSource(parseField(md, "geoSource") || "manual");

      setBlocks({
        passport: parseMultiline(md, "block\\.passport"),
        history: parseMultiline(md, "block\\.history"),
        meaning: parseMultiline(md, "block\\.meaning"),
        legends: parseMultiline(md, "block\\.legends"),
        visual: parseMultiline(md, "block\\.visual"),
        sensory: parseMultiline(md, "block\\.sensory"),
        touristExperience: parseMultiline(md, "block\\.touristExperience"),
        sources: parseMultiline(md, "block\\.sources"),
      });

      setGreeting(parseMultiline(md, "greeting") || "Милый друг,");
      setFooter(
        parseMultiline(md, "footer") ||
          "Читать полную историю в книге\nКнига Кетти",
      );
      setStampPrompt(parseMultiline(md, "stampPrompt"));

      setImageSlots(parseField(md, "imageSlots") || "8");
      setCommonImagePrompt(parseMultiline(md, "commonImagePrompt"));
      setImages(parseImages(md));

      setMessage("Форма загружена");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = (key: keyof LandmarkBlocks, value: string) => {
    setBlocks((prev) => ({ ...prev, [key]: value }));
  };

  const updateImage = (index: number, patch: Partial<ImageDraft>) => {
    setImages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
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

    lines.push("# Форма достопримечательности (landmark-item)");
    lines.push("");

    lines.push("## 1. Привязка к городу и объекту");
    lines.push("");
    lines.push(`cityId: ${cityId}`);
    lines.push(`landmark: ${landmark}`);
    lines.push(`landmarkSlug: ${landmarkSlug}`);
    lines.push(`geoLat: ${geoLat}`);
    lines.push(`geoLng: ${geoLng}`);
    lines.push(`geoSource: ${geoSource}`);
    lines.push("");

    lines.push("## 2. Основные текстовые блоки");
    lines.push("");
    lines.push(`block.passport: ${encodeMultiline(blocks.passport)}`);
    lines.push(`block.history: ${encodeMultiline(blocks.history)}`);
    lines.push(`block.meaning: ${encodeMultiline(blocks.meaning)}`);
    lines.push(`block.legends: ${encodeMultiline(blocks.legends)}`);
    lines.push(`block.visual: ${encodeMultiline(blocks.visual)}`);
    lines.push(`block.sensory: ${encodeMultiline(blocks.sensory)}`);
    lines.push(
      `block.touristExperience: ${encodeMultiline(blocks.touristExperience)}`,
    );
    lines.push(`block.sources: ${encodeMultiline(blocks.sources)}`);
    lines.push("");

    lines.push("## 3. Тексты открытки");
    lines.push("");
    lines.push(`greeting: ${encodeMultiline(greeting)}`);
    lines.push(`footer: ${encodeMultiline(footer)}`);
    lines.push(`stampPrompt: ${encodeMultiline(stampPrompt)}`);
    lines.push("");

    lines.push("## 4. Галерея изображений");
    lines.push("");
    lines.push(`imageSlots: ${imageSlots}`);
    lines.push(`commonImagePrompt: ${encodeMultiline(commonImagePrompt)}`);
    lines.push("");

    images.forEach((item, index) => {
      lines.push(`image[${index}].file: ${item.file}`);
      lines.push(`image[${index}].prompt: ${encodeMultiline(item.prompt)}`);
      lines.push("");
    });

    lines.push("## 5. Справочник городов (read-only)");
    lines.push("");
    lines.push("Список городов загружается автоматически при открытии формы.");

    return lines.join("\n");
  };

  const handleSave = async () => {
    if (!cityId.trim()) {
      setMessage("Выберите cityId.");
      return;
    }

    if (!landmark.trim()) {
      setMessage("Заполните поле Название достопримечательности.");
      return;
    }

    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const response = await fetch("/api/agent/forms/landmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Ошибка сохранения формы");
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
      <h2 className={styles.title}>Форма достопримечательности</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          1. Привязка к городу и объекту
        </legend>

        <div className={styles.field}>
          <label className={styles.label}>Город (cityId)</label>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">(выберите город)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Название достопримечательности</label>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Slug достопримечательности</label>
          <input
            value={landmarkSlug}
            onChange={(e) => setLandmarkSlug(e.target.value)}
          />
        </div>

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
        <legend className={styles.legend}>2. Основные текстовые блоки</legend>

        <div className={styles.field}>
          <label className={styles.label}>Паспорт объекта</label>
          <textarea
            rows={5}
            value={blocks.passport}
            onChange={(e) => updateBlock("passport", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>История</label>
          <textarea
            rows={5}
            value={blocks.history}
            onChange={(e) => updateBlock("history", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Значение</label>
          <textarea
            rows={5}
            value={blocks.meaning}
            onChange={(e) => updateBlock("meaning", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Легенды и истории</label>
          <textarea
            rows={5}
            value={blocks.legends}
            onChange={(e) => updateBlock("legends", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Визуальный образ</label>
          <textarea
            rows={5}
            value={blocks.visual}
            onChange={(e) => updateBlock("visual", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Сенсорные впечатления</label>
          <textarea
            rows={5}
            value={blocks.sensory}
            onChange={(e) => updateBlock("sensory", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Туристический опыт</label>
          <textarea
            rows={5}
            value={blocks.touristExperience}
            onChange={(e) => updateBlock("touristExperience", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Источники</label>
          <textarea
            rows={5}
            value={blocks.sources}
            onChange={(e) => updateBlock("sources", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Тексты открытки</legend>

        <div className={styles.field}>
          <label className={styles.label}>Приветствие</label>
          <textarea
            rows={2}
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Футер</label>
          <textarea
            rows={3}
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Промпт марки</label>
          <textarea
            rows={3}
            value={stampPrompt}
            onChange={(e) => setStampPrompt(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Галерея изображений</legend>

        <div className={styles.field}>
          <label className={styles.label}>Количество слотов</label>
          <input
            value={imageSlots}
            onChange={(e) => setImageSlots(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Общий промпт изображений</label>
          <textarea
            rows={3}
            value={commonImagePrompt}
            onChange={(e) => setCommonImagePrompt(e.target.value)}
          />
        </div>

        {images.map((item, index) => (
          <div
            key={`image-${index}`}
            style={{
              borderTop: "1px solid #ddd",
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div className={styles.field}>
              <label
                className={styles.label}
              >{`Изображение #${index + 1}`}</label>
              <input
                value={item.file}
                onChange={(e) => updateImage(index, { file: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Загрузить файл</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  uploadImageFile(
                    file,
                    `landmark-image-${index}`,
                    (imagePath) => updateImage(index, { file: imagePath }),
                  );
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Промпт изображения</label>
              <textarea
                rows={3}
                value={item.prompt}
                onChange={(e) => updateImage(index, { prompt: e.target.value })}
              />
            </div>

            <button
              type="button"
              className="agent-button"
              onClick={() =>
                setImages((prev) => prev.filter((_, i) => i !== index))
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
              setImages((prev) => [...prev, { file: "", prompt: "" }])
            }
          >
            Добавить изображение
          </button>
        </div>
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
