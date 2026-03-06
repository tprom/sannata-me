"use client";

import { useState } from "react";
import type { AgentResponse } from "../backend/core/schema";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

type ChatProps = {
  onSend: (message: string) => Promise<AgentResponse>;
};

export function Chat({ onSend }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const response = await onSend(userMessage.content);
    const agentMessage: ChatMessage = {
      id: `${Date.now()}-agent`,
      role: "agent",
      content: response.ok
        ? JSON.stringify(response.data, null, 2)
        : response.error ?? "Ошибка",
    };

    setMessages((prev) => [...prev, agentMessage]);
  };

  return (
    <div className="agent-chat">
      <div className="agent-chat-log">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`agent-chat-message agent-chat-${message.role}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="agent-chat-input">
        <input
          value={input}
          placeholder="Напишите сообщение..."
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button className="agent-button" onClick={handleSend}>
          Отправить
        </button>
      </div>
    </div>
  );
}
