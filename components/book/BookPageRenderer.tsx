import styles from "./Flipbook.module.css";

interface Page {
  type: "text" | "illustration" | "coloring" | "mixed";
  content?: string;
  text?: Record<string, string>;
  image?: string;
  meta?: any;
  slug?: string;
}

export default function BookPageRenderer({
  page,
  lang
}: {
  page: Page;
  lang: string;
}) {
  // ---------- TEXT PAGE ----------
  if (page.type === "text") {
    return (
      <p className={styles.pageText}>
        {page.text?.[lang] || page.content}
      </p>
    );
  }

  // ---------- ILLUSTRATION PAGE ----------
  if (page.type === "illustration") {
    return (
      <div className={styles.imageWrapper}>
        <img
          src={`/books/${page.slug}/${page.image}`}
          alt={page.meta?.title || ""}
          className={styles.pageImage}
        />
      </div>
    );
  }

  // ---------- COLORING PAGE ----------
  if (page.type === "coloring") {
    return (
      <div className={styles.imageWrapper}>
        <img
          src={`/books/${page.slug}/${page.image}`}
          alt={page.meta?.title || ""}
          className={styles.pageImage}
        />
      </div>
    );
  }

  // ---------- MIXED PAGE ----------
  if (page.type === "mixed") {
    return (
      <div className={styles.mixedWrapper}>
        {page.content && (
          <p className={styles.pageText}>
            {page.text?.[lang] || page.content}
          </p>
        )}

        {page.image && (
          <div className={styles.imageWrapper}>
            <img
              src={`/books/${page.slug}/${page.image}`}
              alt={page.meta?.title || ""}
              className={styles.pageImage}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
