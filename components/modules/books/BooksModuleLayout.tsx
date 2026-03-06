"use client";

import styles from "./BooksModuleLayout.module.css";

type Props = {
  sidebar: React.ReactNode;
  content: React.ReactNode;
};

export default function BooksModuleLayout({ sidebar, content }: Props) {
  return (
    <div className={styles.layout}>
      {/* Левая панель */}
      <aside className={styles.sidebar}>{sidebar}</aside>

      {/* Правая панель */}
      <main className={styles.content}>{content}</main>
    </div>
  );
}
