// /components/modules/studio/StudioModule.tsx

"use client";

import React from "react";
import type { PortalModuleGenerator } from "@/components/portal/types";
import styles from "./StudioModule.module.css";

// Временные страницы (позже заменим на JSON)
function StudioIntroLeft() {
  return (
    <div className={styles.section}>
      <h1>Studio</h1>
      <p>Welcome to the Studio module.</p>
    </div>
  );
}

function StudioIntroRight() {
  return (
    <div className={styles.section}>
      <h2>Creative Workspace</h2>
      <p>This is where projects come to life.</p>
    </div>
  );
}

const StudioModule: PortalModuleGenerator = {
  generate() {
    // 1. Навигация модуля
    const navigation = {
      title: "Studio",
      active: "home",
      items: [{ id: "home", label: "Home" }],
    };

    // 2. Страницы (пока статично)
    const pages = [
      <StudioIntroLeft key="studio-left" />,
      <StudioIntroRight key="studio-right" />,
    ];

    // 3. Управление модулем (пока заглушка)
    const controls = {
      onSelect: (id: string) => {
        console.log("Selected studio section:", id);
      },
    };

    return { navigation, pages, controls };
  },
};

export default StudioModule;
