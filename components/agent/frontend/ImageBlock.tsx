"use client";

import type { ChangeEvent } from "react";

type ImageSlotState = {
  file?: File;
  fileName?: string;
  dataUrl?: string;
  prompt?: string;
  savedFile?: string;
  isActive?: boolean;
  mime?: string;
};

type ImageBlockState = {
  globalPrompt: string;
  items: ImageSlotState[];
};

type ImageBlockProps = {
  value: ImageBlockState;
  onChange: (next: ImageBlockState) => void;
  resolveSavedFileSrc?: (savedFile?: string) => string | undefined;
};

const EMPTY_SLOT_LABEL = "Пустой слот";

export function ImageBlock({
  value,
  onChange,
  resolveSavedFileSrc,
}: ImageBlockProps) {
  const handleGlobalPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChange({
      ...value,
      globalPrompt: event.target.value,
    });
  };

  const handlePromptChange = (index: number, nextPrompt: string) => {
    const items = value.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, prompt: nextPrompt } : item,
    );
    onChange({ ...value, items });
  };

  const handleRemove = (index: number) => {
    const items = value.items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            file: undefined,
            fileName: undefined,
            dataUrl: undefined,
            savedFile: undefined,
            isActive: false,
            mime: undefined,
          }
        : item,
    );
    onChange({ ...value, items });
  };

  const handleFileChange = (index: number, file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const items = value.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              file,
              fileName: file.name,
              savedFile: undefined,
              isActive: true,
              dataUrl:
                typeof reader.result === "string" ? reader.result : undefined,
            }
          : item,
      );
      onChange({ ...value, items });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="agent-section">
      <div className="agent-section-title">Блок изображений</div>
      <label className="agent-field">
        <span>Общий промпт для всех изображений</span>
        <textarea
          value={value.globalPrompt}
          placeholder="Опишите общий стиль для всех изображений"
          onChange={handleGlobalPromptChange}
        />
      </label>

      <div className="agent-image-grid">
        {value.items.map((item, index) => {
          const inputId = `agent-image-upload-${index}`;
          const hasImage = Boolean(
            item.dataUrl || item.savedFile || item.isActive,
          );
          const savedSrc =
            !item.dataUrl && item.savedFile
              ? resolveSavedFileSrc?.(item.savedFile)
              : undefined;
          const sourceBadge = item.dataUrl
            ? "новое"
            : item.savedFile
              ? "из файла"
              : "";
          return (
            <div className="agent-image-card" key={inputId}>
              <div className="agent-image-preview">
                {sourceBadge ? (
                  <span className="agent-image-badge">{sourceBadge}</span>
                ) : null}
                {item.dataUrl ? (
                  <img src={item.dataUrl} alt={item.fileName ?? "Preview"} />
                ) : savedSrc ? (
                  <img src={savedSrc} alt={item.fileName ?? "Saved preview"} />
                ) : hasImage ? (
                  <span>
                    {item.fileName ?? item.savedFile ?? "Изображение загружено"}
                  </span>
                ) : (
                  <span>{EMPTY_SLOT_LABEL}</span>
                )}
              </div>
              <div className="agent-image-actions">
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleFileChange(index, event.target.files?.[0])
                  }
                />
                <label
                  className="agent-button agent-button-secondary"
                  htmlFor={inputId}
                >
                  {hasImage ? "Заменить" : "Загрузить"}
                </label>
                {hasImage ? (
                  <button
                    className="agent-button agent-button-ghost"
                    type="button"
                    onClick={() => handleRemove(index)}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
              <label className="agent-field">
                <span>Индивидуальный промпт (опционально)</span>
                <input
                  type="text"
                  value={item.prompt ?? ""}
                  placeholder="Например: добавить лёгкий тёплый свет"
                  onChange={(event) =>
                    handlePromptChange(index, event.target.value)
                  }
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
