"use client";

import styles from "./AgentLayout.module.css";
import { MarkdownFormPanel } from "./MarkdownFormPanel";
import { ChatPanel } from "./ChatPanel";

export default function AgentLayout() {
  return (
    <div className={styles.layout}>
      <section className={styles.formPanel} aria-label="Панель форм">
        <MarkdownFormPanel formType="city" />
      </section>
      <section className={styles.chatPanel} aria-label="Панель чата">
        <ChatPanel />
      </section>
    </div>
  );
}
