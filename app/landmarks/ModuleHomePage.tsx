"use client";

import React from "react";
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
  const hero = envelope.hero;
  const sections = envelope.sections || [];

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
  const blocks = sections.filter((s) => s.type === "module-home-block");
  const closingSection = sections.find((s) => s.type === "module-home-closing");

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

  return (
    <div className={styles.moduleHomePage}>
      {/* Single Postcard Container */}
      <div className={styles.postcardContainer}>
        {/* Greeting with Stamp */}
        {hero && (
          <div className={styles.greetingSection}>
            {isValidImageSrc(hero.image) && (
              <div className={styles.stampContainer}>
                <Image
                  src={hero.image}
                  alt={hero.kicker || "Stamp"}
                  width={120}
                  height={120}
                  unoptimized={hero.image.startsWith("/")}
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
                              <span
                                key="img-1L"
                                className={styles.illustrationLeft}
                              >
                                <Image
                                  src={leftSrc}
                                  alt="Illustration 1L"
                                  width={240}
                                  height={240}
                                  unoptimized={leftSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
                            );
                          }
                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              <span
                                key="img-1R"
                                className={styles.illustrationRight}
                                style={{ top: "122px" }}
                              >
                                <Image
                                  src={rightSrc}
                                  alt="Illustration 1R"
                                  width={240}
                                  height={240}
                                  unoptimized={rightSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
                            );
                          }
                        }

                        // 2R: line 16 = before 17th line (row 17)
                        if (index === 16) {
                          const rightSrc =
                            blocks[1]?.payload?.illustrationRight;

                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              <span
                                key="img-2R"
                                className={styles.illustrationRight}
                                style={{ top: "520px" }}
                              >
                                <Image
                                  src={rightSrc}
                                  alt="Illustration 2R"
                                  width={240}
                                  height={240}
                                  unoptimized={rightSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
                            );
                          }
                        }

                        // 2L: line 16 = before 17th line (row 17)
                        if (index === 16) {
                          const leftSrc = blocks[1]?.payload?.illustrationLeft;

                          if (isValidImageSrc(leftSrc)) {
                            result.push(
                              <span
                                key="img-2L"
                                className={styles.illustrationLeft}
                              >
                                <Image
                                  src={leftSrc}
                                  alt="Illustration 2L"
                                  width={240}
                                  height={240}
                                  unoptimized={leftSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
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
                              <span
                                key="img-3L"
                                className={styles.illustrationLeft}
                              >
                                <Image
                                  src={leftSrc}
                                  alt="Illustration 3L"
                                  width={240}
                                  height={240}
                                  unoptimized={leftSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
                            );
                          }
                          if (isValidImageSrc(rightSrc)) {
                            result.push(
                              <span
                                key="img-3R"
                                className={styles.illustrationRight}
                                style={{ top: "886px" }}
                              >
                                <Image
                                  src={rightSrc}
                                  alt="Illustration 3R"
                                  width={240}
                                  height={240}
                                  unoptimized={rightSrc.startsWith("/")}
                                  className={styles.illustrationImage}
                                />
                              </span>,
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
    </div>
  );
}
