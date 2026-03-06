"use client";

import React, { useEffect, useState } from "react";
import styles from "./ModuleHomeFormPanel.module.css";

type Props = {};
type CityOption = { cityId: string; slug: string; label: string };

export default function CollectionHomeFormPanel(_props: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [locale, setLocale] = useState("ru");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summarySubtitle, setSummarySubtitle] = useState("");
  const [summaryDescription, setSummaryDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [linksGridTitle, setLinksGridTitle] = useState("");
  const [ctaText, setCtaText] = useState("");

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/forms/collection-home");
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не удалось загрузить форму.");
      }

      const options = Array.isArray(payload.cityOptions)
        ? (payload.cityOptions as CityOption[])
        : [];
      setCityOptions(options);

      // Try to parse some common keys from the payload.content markdown
      const md = payload.content || "";
      const kv = (key: string) => {
        const m = md.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
        return m ? m[1].trim() : "";
      };

      const parsedCityId = kv("cityId") || "";
      const parsedCitySlug = kv("citySlug") || "";

      setCityId(parsedCityId);
      setCitySlug(parsedCitySlug);

      if (!parsedCityId && parsedCitySlug) {
        const matched = options.find((item) => item.slug === parsedCitySlug);
        if (matched) {
          setCityId(matched.cityId);
        }
      }

      setLocale(kv("locale") || "ru");
      setTitle(kv("title") || "");
      setSubtitle(kv("subtitle") || "");
      setTags(kv("tags") || "");
      setStatus(kv("status") || "draft");
      setHeroTitle(kv("heroTitle") || "");
      setHeroSubtitle(kv("heroSubtitle") || "");
      setHeroImage(kv("heroImage") || "");
      setSummaryTitle(kv("summaryTitle") || "");
      setSummarySubtitle(kv("summarySubtitle") || "");
      setSummaryDescription(kv("summaryDescription") || "");

      // highlights as highlight1, highlight2 ... collect them
      const highlightsMatches = Array.from(
        md.matchAll(/^highlight\d+:\s*(.+)$/gm),
      ).map((r) => r[1].trim());
      setHighlights(highlightsMatches.join("\n"));

      setLinksGridTitle(kv("linksGridTitle") || "");
      setCtaText(kv("ctaText") || "");

      setMessage("Форма загружена");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Форма страницы города (collection-home)");
    lines.push("");
    lines.push("## A. Город");
    lines.push("");
    if (cityId) lines.push(`cityId: ${cityId}`);
    lines.push(`citySlug: ${citySlug}`);
    lines.push(`locale: ${locale}`);
    lines.push("");
    lines.push("## B. Метаданные");
    lines.push("");
    lines.push(`title: ${title}`);
    lines.push(`subtitle: ${subtitle}`);
    if (tags) lines.push(`tags: ${tags}`);
    lines.push(`status: ${status}`);
    lines.push("");
    lines.push("## C. Hero");
    lines.push("");
    if (heroTitle) lines.push(`heroTitle: ${heroTitle}`);
    if (heroSubtitle) lines.push(`heroSubtitle: ${heroSubtitle}`);
    if (heroImage) lines.push(`heroImage: ${heroImage}`);
    lines.push("");
    lines.push("## D. Summary секция");
    lines.push("");
    if (summaryTitle) lines.push(`summaryTitle: ${summaryTitle}`);
    if (summarySubtitle) lines.push(`summarySubtitle: ${summarySubtitle}`);
    if (summaryDescription)
      lines.push(`summaryDescription: ${summaryDescription}`);
    lines.push("");
    if (highlights.trim()) {
      highlights
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((h, i) => lines.push(`highlight${i + 1}: ${h}`));
      lines.push("");
    }
    if (linksGridTitle) {
      lines.push("## F. Links-grid секция");
      lines.push("");
      lines.push(`linksGridTitle: ${linksGridTitle}`);
      lines.push("");
    }
    if (ctaText) {
      lines.push("## G. CTA секция");
      lines.push("");
      lines.push(`ctaText: ${ctaText}`);
      lines.push("");
    }
    return lines.join("\n");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const markdown = buildMarkdown();
      const res = await fetch("/api/agent/forms/collection-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Ошибка сохранения");
      }

      setMessage("Форма сохранена");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  const handleCityIdChange = (nextCityId: string) => {
    setCityId(nextCityId);
    const matched = cityOptions.find((item) => item.cityId === nextCityId);
    if (matched?.slug) {
      setCitySlug(matched.slug);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Форма страницы города (Collection Home)</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>A. Город</legend>
        <div className={styles.field}>
          <label className={styles.label}>cityId</label>
          <select
            value={cityId}
            onChange={(e) => handleCityIdChange(e.target.value)}
          >
            <option value="">(выберите город)</option>
            {cityOptions.map((item) => (
              <option key={item.cityId} value={item.cityId}>
                {item.label} ({item.slug})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>citySlug</label>
          <input
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>locale</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="ru">ru</option>
            <option value="en">en</option>
            <option value="de">de</option>
            <option value="uk">uk</option>
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>B. Метаданные</legend>
        <div className={styles.field}>
          <label className={styles.label}>title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>subtitle</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>tags (comma)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>C. Hero</legend>
        <div className={styles.field}>
          <label className={styles.label}>heroTitle</label>
          <input
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>heroSubtitle</label>
          <input
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>heroImage</label>
          <input
            value={heroImage}
            onChange={(e) => setHeroImage(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>D. Summary</legend>
        <div className={styles.field}>
          <label className={styles.label}>summaryTitle</label>
          <input
            value={summaryTitle}
            onChange={(e) => setSummaryTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>summarySubtitle</label>
          <input
            value={summarySubtitle}
            onChange={(e) => setSummarySubtitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>summaryDescription</label>
          <textarea
            value={summaryDescription}
            onChange={(e) => setSummaryDescription(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>highlights (one per line)</label>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>F/G. Links & CTA</legend>
        <div className={styles.field}>
          <label className={styles.label}>linksGridTitle</label>
          <input
            value={linksGridTitle}
            onChange={(e) => setLinksGridTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>ctaText</label>
          <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
        </div>
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button className="agent-button" onClick={handleSave} disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
