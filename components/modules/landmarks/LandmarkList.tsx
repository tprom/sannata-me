"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import LandmarkPreview from "@/components/landmark/LandmarkPreview";

export type LandmarkItem = {
  slug: string;
  title: string;
  thumbnail?: string;
  shortDescription?: string;
  hero?: string;
  cover?: string;
};

type Props = {
  items: LandmarkItem[];
  city: string;
  lang?: string;
  activeLandmark?: string;
  basePath?: string;
};

export default function LandmarkList({
  items,
  city,
  lang,
  activeLandmark,
  basePath = "/landmarks",
}: Props) {
  const prefix = lang ? `/${lang}${basePath}` : basePath;
  const [preview, setPreview] = useState<LandmarkItem | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleMouseEnter = (
    item: LandmarkItem,
    event: React.MouseEvent<HTMLLIElement>,
  ) => {
    const rowRect = event.currentTarget.getBoundingClientRect();
    const menuRect = event.currentTarget
      .closest(".city-menu")
      ?.getBoundingClientRect();

    const previewWidth = 280;
    const previewHeight = 220;
    const horizontalGap = 8;
    const viewportPadding = 8;

    const targetLeft = menuRect
      ? menuRect.right + horizontalGap
      : rowRect.right + horizontalGap;

    const minTop = viewportPadding + previewHeight / 2;
    const maxTop = window.innerHeight - viewportPadding - previewHeight / 2;
    const unclampedTop = rowRect.top + rowRect.height / 2;
    const targetTop = Math.min(maxTop, Math.max(minTop, unclampedTop));

    setPreview(item);
    setPreviewPosition({
      top: targetTop,
      left: targetLeft,
    });
  };

  const handleMouseLeave = () => {
    setPreview(null);
    setPreviewPosition(null);
  };

  const previewImage = preview
    ? (preview.hero ?? preview.cover ?? preview.thumbnail ?? "")
    : "";

  const previewPortal =
    preview &&
    previewImage &&
    previewPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="landmark-preview-portal"
            style={{
              top: `${previewPosition.top}px`,
              left: `${previewPosition.left}px`,
              transform: "translateY(-50%)",
            }}
          >
            <LandmarkPreview
              title={preview.title}
              shortDescription={preview.shortDescription ?? ""}
              image={previewImage}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="landmark-list">
      {previewPortal}
      <ul className="landmark-list-items">
        {items.map((item) => {
          return (
            <li
              key={item.slug}
              className="city-menu-item landmark-item"
              onMouseEnter={(event) => handleMouseEnter(item, event)}
              onMouseLeave={handleMouseLeave}
            >
              {/* v2.7: миниатюра рядом с названием */}
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="city-menu-thumb"
                />
              ) : (
                <span
                  className="city-menu-thumb city-menu-thumb-placeholder"
                  aria-hidden
                />
              )}
              <Link
                className={`landmark-list-link ${
                  activeLandmark === item.slug ? "is-active" : ""
                }`}
                href={`${prefix}/${city}/${item.slug}`}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
