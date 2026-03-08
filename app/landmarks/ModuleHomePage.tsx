"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import "@/components/modules/landmarks/styles.css";
import styles from "./ModuleHomePage.module.css";

interface PageEnvelope {
  pageId: string;
  locale: string;
  hero?: {
    headline: string;
    kicker?: string;
    image?: string;
  };
  mediaRefs?: {
    hero?: string[];
  };
  sections?: Array<{
    id: string;
    type: string;
    payload: any;
  }>;
}

interface ModuleHomePageProps {
  envelope: PageEnvelope;
}

export default function ModuleHomePage({ envelope }: ModuleHomePageProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    if (!modalImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalImage]);

  const hero = envelope.hero;
  const sections = envelope.sections || [];
  const heroImageFromMedia = envelope.mediaRefs?.hero?.[0];

  const isValidImageSrc = (value?: string): value is string => {
    if (!value) return false;
    const normalized = value.trim();
    if (!normalized) return false;
    if (normalized.includes("(путь к файлу или URL)")) return false;
    if (normalized.includes("(path to file or URL)")) return false;
    return (
      normalized.startsWith("/") ||
      normalized.startsWith("http://") ||
      normalized.startsWith("https://")
    );
  };

  // Find blocks by type
  const blocks = sections.filter(
    (s) =>
      s.type === "module-home-block" || s.type === "custom:module-home-block",
  );
  const closingSection = sections.find(
    (s) =>
      s.type === "module-home-closing" ||
      s.type === "custom:module-home-closing",
  );

  const stampImageSrc = isValidImageSrc(hero?.image)
    ? hero?.image
    : isValidImageSrc(heroImageFromMedia)
      ? heroImageFromMedia
      : undefined;

  const mainBlockWithText = blocks.find(
    (block) => String(block.payload?.text || "").trim().length,
  );

  const mainTitle = String(mainBlockWithText?.payload?.title || "").trim();
  const mainText = String(mainBlockWithText?.payload?.text || "").trim();

  const leftImages = blocks
    .map((block) => block.payload?.illustrationLeft)
    .filter(isValidImageSrc);

  const rightImages = blocks
    .map((block) => block.payload?.illustrationRight)
    .filter(isValidImageSrc);

  const renderZoomableIllustration = (
    key: string,
    src: string,
    alt: string,
    className: string,
    style?: React.CSSProperties,
  ) => (
    <span key={key} className={className} style={style}>
      <button
        type="button"
        className={styles.illustrationZoomButton}
        onClick={() => setModalImage(src)}
        aria-label="Открыть иллюстрацию в увеличенном размере"
      >
        <Image
          src={src}
          alt={alt}
          width={240}
          height={240}
          unoptimized={src.startsWith("/")}
          className={styles.illustrationImage}
        />
      </button>
    </span>
  );

  return (
    <div className={styles.moduleHomePage}>
      {/* Single Postcard Container */}
      <div className={styles.postcardContainer}>
        {/* Greeting with Stamp */}
        {hero && (
          <div className={styles.greetingSection}>
            {stampImageSrc && (
              <div className={styles.stampContainer}>
                <Image
                  src={stampImageSrc}
                  alt={hero.kicker || "Stamp"}
                  width={120}
                  height={120}
                  unoptimized={stampImageSrc.startsWith("/")}
                  className={styles.stampImage}
                />
              </div>
            )}
            <h1 className={`${styles.greetingText} ${styles.textShifted}`}>
              {hero.headline}
            </h1>
          </div>
        )}

        {/* Unified Content Block */}
        {(mainText || leftImages.length > 0 || rightImages.length > 0) && (
          <div className={styles.contentFlow}>
            <div className={styles.contentBlock}>
              <div className={styles.textContent}>
                {/* Text content */}
                {mainTitle && (
                  <h2 className={`${styles.blockTitle} ${styles.textShifted}`}>
                    {mainTitle}
                  </h2>
                )}

                {mainText && (
                  <p className={styles.blockText}>
                    {/* Split text by lines and insert images at specific positions */}
                    {(() => {
                      const lines = mainText.split("\n");
                      const result: React.ReactNode[] = [];

                      lines.forEach((line, index) => {
                        // Insert images before specific lines (0-indexed)
                        // Line 4 = before 5th line (row 5)
                        if (index === 4) {
                          const leftSrc = blocks[0]?.payload?.illustrationLeft;
                          const rightSrc =
                            blocks[0]?.payload?.illustrationRight;

                          if (isValidImageSrc(leftSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-1L",
                                leftSrc,
                                "Illustration 1L",
                                styles.illustrationLeft,
                              ),
                            );
                          }
                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-1R",
                                rightSrc,
                                "Illustration 1R",
                                styles.illustrationRight,
                                { top: "122px" },
                              ),
                            );
                          }
                        }

                        // 2R: line 16 = before 17th line (row 17)
                        if (index === 16) {
                          const rightSrc =
                            blocks[1]?.payload?.illustrationRight;

                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-2R",
                                rightSrc,
                                "Illustration 2R",
                                styles.illustrationRight,
                                { top: "520px" },
                              ),
                            );
                          }
                        }

                        // 2L: line 16 = before 17th line (row 17)
                        if (index === 16) {
                          const leftSrc = blocks[1]?.payload?.illustrationLeft;

                          if (isValidImageSrc(leftSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-2L",
                                leftSrc,
                                "Illustration 2L",
                                styles.illustrationLeft,
                              ),
                            );
                          }
                        }

                        // Line 28 = before 29th line (row 29)
                        if (index === 28) {
                          const leftSrc = blocks[2]?.payload?.illustrationLeft;
                          const rightSrc =
                            blocks[2]?.payload?.illustrationRight;

                          if (isValidImageSrc(leftSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-3L",
                                leftSrc,
                                "Illustration 3L",
                                styles.illustrationLeft,
                              ),
                            );
                          }
                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              renderZoomableIllustration(
                                "img-3R",
                                rightSrc,
                                "Illustration 3R",
                                styles.illustrationRight,
                                { top: "886px" },
                              ),
                            );
                          }
                        }

                        // Add line with newline
                        result.push(
                          <span
                            key={`line-${index}`}
                            className={styles.textShifted}
                          >
                            {line}
                            {index < lines.length - 1 && "\n"}
                          </span>,
                        );
                      });

                      return result;
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Closing */}
        {closingSection && (
          <div className={styles.closingSection}>
            <p className={`${styles.closingText} ${styles.textShifted}`}>
              {closingSection.payload.text}
            </p>
          </div>
        )}

        {hero?.kicker && <p className={styles.kickerBottom}>{hero.kicker}</p>}
      </div>

      {modalImage && (
        <div
          className={styles.illustrationModal}
          role="dialog"
          aria-modal="true"
          onClick={() => setModalImage(null)}
        >
          <button
            type="button"
            className={styles.illustrationModalClose}
            onClick={() => setModalImage(null)}
            aria-label="Закрыть"
          >
            Закрыть
          </button>
          <img
            src={modalImage}
            alt="Увеличенная иллюстрация"
            className={styles.illustrationModalImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
