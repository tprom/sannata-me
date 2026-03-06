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

  const previewImage = preview
    ? (preview.hero ?? preview.cover ?? preview.thumbnail ?? "")
    : "";

  const previewPortal =
    preview && previewImage && typeof document !== "undefined"
      ? createPortal(
          <div className="landmark-preview-portal">
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
              onMouseEnter={() => setPreview(item)}
              onMouseLeave={() => setPreview(null)}
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
