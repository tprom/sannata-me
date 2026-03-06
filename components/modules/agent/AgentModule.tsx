"use client";

import { useState } from "react";

type AgentResult = {
  type: "success" | "error";
  message: string;
  data?: unknown;
};

export default function AgentModule() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Передаёт текст команды в ядро через API и возвращает результат.
  const handleSubmit = async () => {
    if (!command.trim()) return;

    setIsLoading(true);
    setResult(null);

    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });

    const payload = (await response.json()) as AgentResult;
    setResult(payload);
    setIsLoading(false);
  };

  return (
    <div className="agent-module">
      <h2>Agent v1.0</h2>
      <p>Введите текстовую команду для создания достопримечательности.</p>

      <div className="agent-module-input">
        <input
          value={command}
          placeholder="Создай достопримечательность Perlachturm в городе Augsburg"
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
        />
        <button className="agent-button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Выполняю..." : "Выполнить"}
        </button>
      </div>

      {result && (
        <div
          className={
            result.type === "success"
              ? "agent-result agent-result-success"
              : "agent-result agent-result-error"
          }
        >
          <strong>{result.message}</strong>
          {result.data && (
            <pre className="agent-result-data">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
