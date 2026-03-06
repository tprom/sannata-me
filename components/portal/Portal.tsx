"use client";

import styles from "./Portal.module.css";
import type { PortalModule } from "./types";

type Props = {
  module?: PortalModule; // делаем необязательным, чтобы портал не падал
};

export default function Portal({ module }: Props) {
  // Защита от undefined
  if (!module) {
    return (
      <div className={styles.portalEmpty}>
        <h2>Module not found</h2>
        <p>Похоже, что модуль не был передан в Portal.</p>
      </div>
    );
  }

  const { navigation, pages } = module;

  return (
    <div className={styles.portalRoot}>
      {/* Левое меню */}
      <aside className={styles.portalSidebar}>
        <h2>{navigation.title}</h2>

        <ul className={styles.portalNavList}>
          {navigation.items.map((item) => (
            <li
              key={item.id}
              className={
                item.id === navigation.active
                  ? styles.portalNavItemActive
                  : styles.portalNavItem
              }
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Контент */}
      <main className={styles.portalContent}>
        {pages.map((page, index) => (
          <div key={index} className={styles.portalPage}>
            {page}
          </div>
        ))}
      </main>
    </div>
  );
}
