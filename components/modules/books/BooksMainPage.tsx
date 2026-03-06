"use client";

import { useTranslations } from "next-intl";
import CardDrawer from "./CardDrawer/CardDrawer";
import { SHELF_LAYOUT, getAlignedPlankOffsets } from "./shelfLayout";
import styles from "./BooksMainPage.module.css";

export default function BooksMainPage() {
  const t = useTranslations("books.mainPage");
  const alignedPlanks = getAlignedPlankOffsets();
  const [plank1, plank2, plank3] = alignedPlanks;
  const mid1 = Math.round((plank1 + plank2) / 2);
  const mid2 = Math.round((plank2 + plank3) / 2);
  const booksPatternWidth = 180;
  const shelf2Top = plank1 + SHELF_LAYOUT.plankHeight + SHELF_LAYOUT.shelfGap;
  const shelf2Bottom = mid1;
  const shelf3Top = mid1 + SHELF_LAYOUT.plankHeight + SHELF_LAYOUT.shelfGap;
  const shelf3Bottom = plank2;
  const shelf4Top = plank2 + SHELF_LAYOUT.plankHeight + SHELF_LAYOUT.shelfGap;
  const shelf4Bottom = mid2;
  const shelf5Top = mid2 + SHELF_LAYOUT.plankHeight + SHELF_LAYOUT.shelfGap;
  const shelf5Bottom = plank3;
  const getShelfHeight = (top: number, bottom: number) =>
    Math.max(bottom - top, 40);
  const shelf2Height = getShelfHeight(shelf2Top, shelf2Bottom);
  const shelf3Height = getShelfHeight(shelf3Top, shelf3Bottom);
  const shelf4Height = getShelfHeight(shelf4Top, shelf4Bottom);
  const shelf5Height = getShelfHeight(shelf5Top, shelf5Bottom);
  const booksTopOffset = 6;
  const magazineHeight = 42;
  const magazineOffset = 4;
  const getBookHeight = (shelfHeight: number) =>
    Math.max(shelfHeight - booksTopOffset, 24);
  const verticalBooks = [
    {
      height: getBookHeight(shelf2Height),
      top: shelf2Bottom - getBookHeight(shelf2Height),
    },
    {
      height: getBookHeight(shelf3Height),
      top: shelf3Bottom - getBookHeight(shelf3Height),
    },
    {
      height: getBookHeight(shelf4Height),
      top: shelf4Bottom - getBookHeight(shelf4Height),
    },
    {
      height: getBookHeight(shelf5Height),
      top: shelf5Bottom - getBookHeight(shelf5Height),
    },
  ];
  const topMagazinePosition = Math.max(
    plank1 - magazineHeight - magazineOffset,
    6,
  );
  const bottomMagazinePosition = `calc(100% - 28px - ${magazineHeight + magazineOffset}px)`;
  const buildBooksSvg = (height: number) =>
    `data:image/svg+xml;utf8,` +
    `<svg xmlns='http://www.w3.org/2000/svg' width='${booksPatternWidth}' height='${height}' viewBox='0 0 ${booksPatternWidth} ${height}'>` +
    `<rect width='${booksPatternWidth}' height='${height}' fill='none'/>` +
    `<g fill='%23b9b2a6' fill-opacity='0.22'>` +
    `<rect x='6' y='0' width='18' height='${height}' rx='4'/>` +
    `<rect x='28' y='0' width='22' height='${height}' rx='4'/>` +
    `<rect x='54' y='0' width='16' height='${height}' rx='4'/>` +
    `<rect x='74' y='0' width='20' height='${height}' rx='4'/>` +
    `<rect x='98' y='0' width='26' height='${height}' rx='4'/>` +
    `<rect x='128' y='0' width='16' height='${height}' rx='4'/>` +
    `<rect x='148' y='0' width='20' height='${height}' rx='4'/>` +
    `</g>` +
    `<g fill='%23e2ddd3' fill-opacity='0.18'>` +
    `<rect x='10' y='4' width='10' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='34' y='4' width='8' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='58' y='4' width='8' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='82' y='4' width='8' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='108' y='4' width='10' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='132' y='4' width='8' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `<rect x='152' y='4' width='8' height='${Math.max(height - 12, 8)}' rx='3'/>` +
    `</g>` +
    `</svg>`;
  const booksSvgs = verticalBooks.map((block) => buildBooksSvg(block.height));
  const plankPositions = [
    plank1,
    mid1,
    plank2,
    mid2,
    plank3,
    "calc(100% - 28px)",
  ];
  const blocks = [
    {
      title: t("about_title"),
      content: <p>{t("about_text")}</p>,
    },
    {
      title: t("list_title"),
      content: (
        <ul>
          {t.raw("list_items").map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ),
    },
    {
      title: t("audience_title"),
      content: <p>{t("audience_text")}</p>,
    },
    {
      title: t("ketty_title"),
      content: <p>{t("ketty_text")}</p>,
    },
    {
      title: t("shi_title"),
      content: <p>{t("shi_text")}</p>,
    },
  ];

  const dynamicStyles = `
    .${styles.layout} .mag-top {
      top: ${typeof topMagazinePosition === "number" ? `${topMagazinePosition}px` : topMagazinePosition};
    }

    .${styles.layout} .mag-bottom {
      top: ${typeof bottomMagazinePosition === "number" ? `${bottomMagazinePosition}px` : bottomMagazinePosition};
    }

    ${verticalBooks
      .map(
        (block, index) => `
    .${styles.layout} .books-left-${index},
    .${styles.layout} .books-right-${index} {
      top: ${block.top}px;
      height: ${block.height}px;
      background-image: url("${booksSvgs[index]}");
      background-size: ${booksPatternWidth}px ${block.height}px;
    }
    `,
      )
      .join("\n")}

    ${plankPositions
      .map((position, index) => {
        const topValue =
          typeof position === "number" ? `${position}px` : position;
        return `
    .${styles.layout} .plank-pos-${index} {
      top: ${topValue};
    }
    `;
      })
      .join("\n")}
  `;

  return (
    <div className={styles.layout}>
      {/* Левая полка */}
      <div className={`${styles.shelf} ${styles.leftShelf}`}>
        <div className={styles.shelfOverlay}>
          <div className={`${styles.magazine} mag-top`} />
          <div className={`${styles.magazine} mag-bottom`} />
          {verticalBooks.map((block, index) => (
            <div
              key={`left-books-${index}`}
              className={`${styles.bookBand} books-left-${index}`}
            />
          ))}
        </div>
        {plankPositions.map((position, i) => (
          <div key={i} className={`${styles.plank} plank-pos-${i}`} />
        ))}
      </div>

      {/* Центральная область */}
      <div className={styles.centerArea}>
        <h1 className={styles.title}>{t("title")}</h1>
        <h2 className={styles.subtitle}>{t("subtitle")}</h2>

        <CardDrawer blocks={blocks} />
      </div>

      {/* Правая полка */}
      <div className={`${styles.shelf} ${styles.rightShelf}`}>
        <div className={styles.shelfOverlay}>
          <div className={`${styles.magazine} mag-top`} />
          <div className={`${styles.magazine} mag-bottom`} />
          {verticalBooks.map((block, index) => (
            <div
              key={`right-books-${index}`}
              className={`${styles.bookBand} books-right-${index}`}
            />
          ))}
        </div>
        {plankPositions.map((position, i) => (
          <div key={i} className={`${styles.plank} plank-pos-${i}`} />
        ))}
      </div>

      <style jsx>{dynamicStyles}</style>
    </div>
  );
}
