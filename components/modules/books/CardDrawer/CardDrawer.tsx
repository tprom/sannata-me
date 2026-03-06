"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./CardDrawer.module.css";

export type CardDrawerBlock = {
  title: string;
  content: ReactNode;
};

type CardDrawerProps = {
  blocks: CardDrawerBlock[];
  staticCount?: number;
};

export default function CardDrawer({
  blocks,
  staticCount = 2,
}: CardDrawerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const staticBlocks = blocks.slice(0, staticCount);
  const cardBlocks = blocks.slice(staticCount);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setActiveIndex(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <div className={styles.staticSection}>
        {staticBlocks.map((block, index) => (
          <div key={`${block.title}-${index}`} className={styles.staticBlock}>
            <h3 className={styles.blockTitle}>{block.title}</h3>
            <div className={styles.blockContent}>{block.content}</div>
          </div>
        ))}
      </div>

      {cardBlocks.length > 0 && (
        <div
          className={styles.tray}
          style={{ "--card-count": cardBlocks.length } as CSSProperties}
        >
          <div className={styles.trayBase} aria-hidden="true" />
          <div className={styles.trayInner}>
            {cardBlocks.map((block, index) => {
              const isOpen = activeIndex === index;
              const tabSide =
                index % 2 === 0 ? styles.tabRight : styles.tabLeft;
              const cardSide =
                index % 2 === 0 ? styles.cardRight : styles.cardLeft;
              const panelId = `card-drawer-panel-${index}`;

              return (
                <button
                  key={`${block.title}-${index}`}
                  type="button"
                  className={`${styles.card} ${cardSide} ${isOpen ? styles.cardOpen : styles.cardClosed}`}
                  style={{ "--card-index": index } as CSSProperties}
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  aria-controls={panelId}
                >
                  <div className={`${styles.tab} ${tabSide}`}>
                    <span>{block.title}</span>
                  </div>
                  <div id={panelId} className={styles.cardBody}>
                    <div className={styles.cardContent}>{block.content}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
