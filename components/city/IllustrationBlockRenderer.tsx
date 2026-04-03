"use client";

import { useEffect, useState } from "react";
import type { IllustrationBlock } from "@/data/types";

type Props = {
  block: IllustrationBlock;
  lang: string;
};

const sizeClass: Record<IllustrationBlock["size"], string> = {
  small: "illustration-size-small",
  compact: "illustration-size-compact",
  medium: "illustration-size-medium",
  threeQuarter: "illustration-size-three-quarter",
  large: "illustration-size-large",
};

const positionClass: Record<IllustrationBlock["position"], string> = {
  left: "illustration-position-left",
  right: "illustration-position-right",
  center: "illustration-position-center",
};

export default function IllustrationBlockRenderer({ block, lang }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const caption =
    block.caption?.[lang as keyof typeof block.caption] ?? "";

  const normalizedSize: IllustrationBlock["size"] =
    block.size === "small" ||
    block.size === "compact" ||
    block.size === "threeQuarter" ||
    block.size === "large"
      ? block.size
      : "medium";
  const normalizedPosition: IllustrationBlock["position"] =
    block.position === "left" || block.position === "center" ? block.position : "right";

  const classes = [
    "illustration-block",
    sizeClass[normalizedSize],
    positionClass[normalizedPosition],
    `illustration-type-${block.type || "photo"}`,
    block.wrap ? "illustration-wrap" : "",
    block.shadow ? "illustration-shadow" : "",
    block.border ? "illustration-border" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties =
    block.rotate ? { transform: `rotate(${block.rotate}deg)` } : {};

  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  return (
    <>
      <figure
        className={classes}
        style={style}
        id={block.anchor ?? undefined}
      >
        <button
          type="button"
          className="illustration-image-button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Открыть иллюстрацию в полном размере"
        >
          <img src={block.image} alt={caption} className="illustration-img" />
        </button>
        {caption && (
          <figcaption className="illustration-caption">{caption}</figcaption>
        )}
      </figure>

      {isModalOpen && (
        <div
          className="illustration-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="illustration-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="agent-button illustration-modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              Закрыть
            </button>
            <img
              src={block.image}
              alt={caption || "Иллюстрация"}
              className="illustration-modal-image"
            />
            {caption && (
              <p className="illustration-modal-caption">{caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
