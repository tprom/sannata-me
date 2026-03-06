"use client";

import { useMemo } from "react";
import { Chat } from "@/components/agent/frontend/Chat";
import { createDefaultAgentEngine } from "@/components/agent/backend/core/agentEngine";
import { routeAgentMessage } from "@/components/agent/backend/core/messageRouter";
import styles from "./ChatPanel.module.css";

export function ChatPanel() {
  const engine = useMemo(() => createDefaultAgentEngine(), []);

  const handleSendMessage = async (message) => {
    return routeAgentMessage({ text: message }, engine);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Чат агента</h2>
        <p className={styles.subtitle}>Сообщения отправляются в ядро агента.</p>
      </div>
      <div className={styles.chatArea}>
        <Chat onSend={handleSendMessage} />
      </div>
    </div>
  );
}
