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
  const [isOpen, setIsOpen] = useState(false);

  const caption = block.caption?.[lang as keyof typeof block.caption] ?? "";

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const classes = [
    "illustration-block",
    sizeClass[block.size],
    positionClass[block.position],
    block.wrap ? "illustration-wrap" : "",
    block.shadow ? "illustration-shadow" : "",
    block.border ? "illustration-border" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties = block.rotate
    ? { transform: `rotate(${block.rotate}deg)` }
    : {};

  return (
    <>
      <figure className={classes} style={style} id={block.anchor ?? undefined}>
        <button
          type="button"
          className="illustration-zoom-button"
          onClick={() => setIsOpen(true)}
          aria-label="Открыть иллюстрацию в увеличенном размере"
        >
          <img src={block.image} alt={caption} className="illustration-img" />
        </button>
        {caption && (
          <figcaption className="illustration-caption">{caption}</figcaption>
        )}
      </figure>

      {isOpen && (
        <div
          className="illustration-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            className="illustration-modal-close"
            aria-label="Закрыть"
            onClick={() => setIsOpen(false)}
          >
            Закрыть
          </button>
          <img
            src={block.image}
            alt={caption}
            className="illustration-modal-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
