import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./page.module.css";
import portalHomeFormData from "@/app/data/portal-home.form.json";
import {
  PORTAL_HOME_LOCALES,
  type DynamicIllustration,
  type DynamicTextBlock,
  type IllustrationSize,
  normalizePortalHomeFormData,
  type PortalHomeFormData,
  type PortalHomeLocale,
  type TextTone,
} from "@/types/portalHomeForm";

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

const normalized = normalizePortalHomeFormData(portalHomeFormData);

const HOME_DATA: PortalHomeFormData = normalized.ok
  ? normalized.value
  : {
      schemaVersion: "2.0.0",
      visual: {
        image: "/images/castle.png",
        divider: "/images/divider.png",
        brand: "SANNATA.me",
      },
      leftPage: {
        motto: { ru: "", en: "", de: "", uk: "" },
        mottoStyle: { tone: "normal", sizeAdjust: 0 },
        title: { ru: "", en: "", de: "", uk: "" },
        textBlocks: [],
        illustrations: [],
      },
      rightPage: {
        title: { ru: "", en: "", de: "", uk: "" },
        textBlocks: [],
        illustrations: [],
      },
    };

const TONE_CLASS: Record<TextTone, string> = {
  normal: "",
  bold: styles.markBold,
  italic: styles.markItalic,
  highlight: styles.markHighlight,
};

const SIZE_CLASS: Record<-1 | 0 | 1, string> = {
  [-1]: styles.blockSizeDown,
  0: "",
  1: styles.blockSizeUp,
};

const KIND_CLASS: Record<DynamicTextBlock["kind"], string> = {
  paragraph: styles.blockParagraph,
  lead: styles.blockLead,
  heading: styles.blockHeading,
  quote: styles.blockQuote,
  list: styles.blockList,
  note: styles.blockNote,
};

const ALIGN_CLASS: Record<DynamicTextBlock["align"], string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

const SPACING_CLASS: Record<DynamicTextBlock["spacing"], string> = {
  compact: styles.spacingCompact,
  normal: styles.spacingNormal,
  relaxed: styles.spacingRelaxed,
};

const ILLUSTRATION_WIDTH: Record<IllustrationSize, string> = {
  "small-30": "30%",
  "reduced-40": "40%",
  "medium-50": "50%",
  "large-75": "75%",
  "full-100": "100%",
};

const ILLUSTRATION_TYPE_CLASS: Record<DynamicIllustration["type"], string> = {
  "ketty-drawing": styles.illustrationTypeDrawing,
  photo: styles.illustrationTypePhoto,
  decor: styles.illustrationTypeDecor,
};

const ILLUSTRATION_POSITION_CLASS: Record<
  DynamicIllustration["position"],
  string
> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

function cx(...items: Array<string | null | false | undefined>): string {
  return items.filter(Boolean).join(" ");
}

function renderIllustration(
  illustration: DynamicIllustration,
  locale: PortalHomeLocale,
  key: string,
) {
  const wrapperStyle = {
    width: ILLUSTRATION_WIDTH[illustration.size],
    transform: `rotate(${illustration.rotate}deg)`,
  };

  return (
    <figure
      key={key}
      className={cx(
        styles.dynamicImage,
        ILLUSTRATION_POSITION_CLASS[illustration.position],
        ILLUSTRATION_TYPE_CLASS[illustration.type],
        illustration.wrap && styles.illustrationWrap,
        illustration.shadow && styles.imageFrameShadow,
        illustration.border && styles.imageFrameBorder,
      )}
      style={wrapperStyle}
      data-anchor={illustration.anchor || undefined}
    >
      <Image
        src={illustration.image}
        alt={illustration.caption[locale] || "Portal illustration"}
        width={1000}
        height={700}
        className={styles.dynamicImageTag}
      />
      {illustration.caption[locale] ? (
        <figcaption>{illustration.caption[locale]}</figcaption>
      ) : null}
    </figure>
  );
}

function renderTextBlock(
  block: DynamicTextBlock,
  locale: PortalHomeLocale,
  index: number,
) {
  const className = cx(
    KIND_CLASS[block.kind],
    ALIGN_CLASS[block.align],
    SPACING_CLASS[block.spacing],
    SIZE_CLASS[block.sizeAdjust],
    TONE_CLASS[block.tone],
  );

  if (block.kind === "heading") {
    return (
      <h3 key={`text-${index}`} className={className}>
        {block.text[locale]}
      </h3>
    );
  }

  if (block.kind === "list") {
    const items = block.text[locale]
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    return (
      <ul key={`text-${index}`} className={className}>
        {items.map((item, itemIndex) => (
          <li key={`${index}-${itemIndex}`}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={`text-${index}`} className={className}>
      {block.text[locale]}
    </p>
  );
}

function renderPageBlocks(
  blocks: DynamicTextBlock[],
  illustrations: DynamicIllustration[],
  locale: PortalHomeLocale,
) {
  const result: ReactNode[] = [];

  blocks.forEach((block, index) => {
    const paragraph = index + 1;

    illustrations
      .filter(
        (illustration) =>
          illustration.insert.paragraph === paragraph &&
          illustration.insert.where === "before",
      )
      .forEach((illustration, illustrationIndex) => {
        result.push(
          renderIllustration(
            illustration,
            locale,
            `before-${paragraph}-${illustrationIndex}`,
          ),
        );
      });

    result.push(renderTextBlock(block, locale, index));

    illustrations
      .filter(
        (illustration) =>
          illustration.insert.paragraph === paragraph &&
          illustration.insert.where === "after",
      )
      .forEach((illustration, illustrationIndex) => {
        result.push(
          renderIllustration(
            illustration,
            locale,
            `after-${paragraph}-${illustrationIndex}`,
          ),
        );
      });
  });

  illustrations
    .filter((illustration) => illustration.insert.paragraph > blocks.length)
    .forEach((illustration, illustrationIndex) => {
      result.push(
        renderIllustration(illustration, locale, `tail-${illustrationIndex}`),
      );
    });

  return result;
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const locale: PortalHomeLocale = PORTAL_HOME_LOCALES.includes(lang as never)
    ? (lang as PortalHomeLocale)
    : "en";

  return (
    <main className={styles.homePage}>
      <section
        className={styles.bookShell}
        aria-label={HOME_DATA.leftPage.title[locale]}
      >
        <article className={styles.bookPageLeft}>
          <div className={styles.leftPageGrid}>
            <div className={styles.mottoBlock}>
              <p
                className={cx(
                  styles.mottoLine,
                  TONE_CLASS[HOME_DATA.leftPage.mottoStyle.tone],
                  SIZE_CLASS[HOME_DATA.leftPage.mottoStyle.sizeAdjust],
                )}
              >
                {HOME_DATA.leftPage.motto[locale]}
              </p>
            </div>

            <div className={styles.visualBlock}>
              <figure
                className={cx(styles.dynamicImage, styles.visualHeroImage)}
              >
                <Image
                  src={HOME_DATA.visual.image}
                  alt="Sannata Castle"
                  width={420}
                  height={260}
                  className={styles.dynamicImageTag}
                  priority
                />
              </figure>

              <div className={styles.brand}>{HOME_DATA.visual.brand}</div>

              <figure
                className={cx(
                  styles.dynamicImage,
                  styles.visualDividerBottomImage,
                )}
              >
                <Image
                  src={HOME_DATA.visual.divider}
                  alt="Decorative Bottom Divider"
                  width={300}
                  height={46}
                  className={styles.dynamicImageTag}
                />
              </figure>
            </div>

            <div className={styles.leftContentBlock}>
              <h1 className={styles.introTitle}>
                {HOME_DATA.leftPage.title[locale]}
              </h1>
              {renderPageBlocks(
                HOME_DATA.leftPage.textBlocks,
                HOME_DATA.leftPage.illustrations,
                locale,
              )}
            </div>
          </div>
        </article>

        <article className={styles.bookPageRight}>
          <div className={styles.rightTextBlock}>
            <h2 className={styles.rightTitle}>
              {HOME_DATA.rightPage.title[locale]}
            </h2>
            {renderPageBlocks(
              HOME_DATA.rightPage.textBlocks,
              HOME_DATA.rightPage.illustrations,
              locale,
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
