"use client";

import { useTranslations } from "next-intl";
import styles from "./DiaryModule.module.css";

export default function DiaryModule({ lang }) {
  const t = useTranslations("diary");

  return (
    <div className={styles.container}>
      <h1>{t("title")}</h1>
      <p>{t("comingSoon")}</p>
    </div>
  );
}
