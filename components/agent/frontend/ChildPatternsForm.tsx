"use client";

import { useState } from "react";

type ChildPatternsFormProps = {
  onSubmit: (text: string) => void;
  saveStatus: "idle" | "saving" | "success" | "error";
  statusMessage: string;
  isSubmitting: boolean;
};

export function ChildPatternsForm({
  onSubmit,
  saveStatus,
  statusMessage,
  isSubmitting,
}: ChildPatternsFormProps) {
  const [text, setText] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextText = text.trim();
    if (!nextText) {
      setHasError(true);
      return;
    }

    setHasError(false);
    onSubmit(nextText);
  };

  return (
    <form className="agent-form" onSubmit={handleSubmit}>
      <h3>Словарь детских паттернов</h3>

      <label className={`agent-field${hasError ? " agent-field-error" : ""}`}>
        <span>Многостроковый текст</span>
        <textarea
          value={text}
          placeholder="Вставьте текст дневника или наброски"
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      <button className="agent-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем…" : "Отправить на разбор"}
      </button>

      {saveStatus !== "idle" && statusMessage ? (
        <div
          className={`agent-status agent-status-${
            saveStatus === "success"
              ? "success"
              : saveStatus === "error"
                ? "error"
                : "info"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
    </form>
  );
}
