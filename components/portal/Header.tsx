"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./Header.module.css";

export default function Header({ lang }: { lang: string }) {
  const t = useTranslations("nav");

  return (
    <header className={styles.header}>
      <nav className={styles.left}>
        <Link href={`/${lang}/books`}>{t("books")}</Link>
        <Link href={`/${lang}/insights`}>{t("insights")}</Link>
        <Link href={`/${lang}/landmarks`}>{t("landmarks")}</Link>
        <Link href={`/${lang}/studio`}>{t("studio")}</Link>
      </nav>

      <div className={styles.right}>
        <Link href="/en">EN</Link>
        <Link href="/de">DE</Link>
        <Link href="/ru">RU</Link>
        <Link href="/uk">UK</Link>
      </div>
    </header>
  );
}
