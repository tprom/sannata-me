"use client";

import { useMemo, useState } from "react";
import type { AgentFormSchema } from "../backend/core/schema";

type DynamicFormProps = {
  schema: AgentFormSchema | null;
  onSubmit: (values: Record<string, string>) => void;
};

export function DynamicForm({ schema, onSubmit }: DynamicFormProps) {
  const initialState = useMemo(() => {
    if (!schema) return {};
    return schema.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.id] = "";
      return acc;
    }, {});
  }, [schema]);

  const [values, setValues] = useState<Record<string, string>>(initialState);

  if (!schema) {
    return (
      <div className="agent-card agent-muted">
        Выберите операцию слева, чтобы создать форму.
      </div>
    );
  }

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="agent-form" onSubmit={handleSubmit}>
      <h3>{schema.title}</h3>
      {schema.fields.map((field) => (
        <label key={field.id} className="agent-field">
          <span>{field.label}</span>
          {field.type === "textarea" ? (
            <textarea
              value={values[field.id] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) => handleChange(field.id, event.target.value)}
            />
          ) : (
            <input
              type="text"
              value={values[field.id] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) => handleChange(field.id, event.target.value)}
            />
          )}
        </label>
      ))}
      <button className="agent-button" type="submit">
        Отправить
      </button>
    </form>
  );
}
