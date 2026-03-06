import { useTranslations } from "next-intl";
import BookReader from "./BookReader";
import styles from "./BooksModule.module.css";

type Props = {
  lang: string;
  slug?: string;
};

export default function BooksModule({ lang, slug }: Props) {
  const t = useTranslations("books");

  if (slug) {
    return <BookReader lang={lang} slug={slug} />;
  }

  return (
    <div className={styles.emptyState}>
      <h1 className={styles.title}>{t("welcome")}</h1>

      <p className={styles.description}>{t("chooseBook")}</p>

      <div className={styles.divider} />
    </div>
  );
}
