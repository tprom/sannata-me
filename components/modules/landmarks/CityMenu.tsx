"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandmarkList, { type LandmarkItem } from "./LandmarkList";

export type CityItem = {
  city: string;
  slug: string;
  count: number;
};

type Props = {
  cities: CityItem[];
  lang?: string;
  activeCity?: string;
  activeLandmark?: string;
  activeCityLandmarks?: LandmarkItem[];
  basePath?: string;
};

const CITY_ANGLE_PATTERN = [1.5, -2, 3.5, -1.5, 2.5, -1, 3] as const;

const getCityAngle = (index: number): number => {
  return CITY_ANGLE_PATTERN[index % CITY_ANGLE_PATTERN.length];
};

export default function CityMenu({
  cities,
  lang,
  activeCity,
  activeLandmark,
  activeCityLandmarks = [],
  basePath = "/landmarks",
}: Props) {
  const router = useRouter();
  const prefix = lang ? `/${lang}${basePath}` : basePath;

  useEffect(() => {
    if (!activeCity) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      router.push(prefix);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCity, prefix, router]);

  const onLinkKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  };

  return (
    <aside className="city-menu">
      <h3>Города</h3>
      <ul className="city-menu-list">
        {cities.map((city, index) => {
          const isActive = activeCity === city.slug;
          const angle = getCityAngle(index);
          const cityHref = isActive ? `${prefix}` : `${prefix}/${city.slug}`;
          const cityStyle = {
            "--city-angle": `${angle}deg`,
          } as CSSProperties;

          return (
            <li key={city.slug} className="city-menu-item">
              {/* Аккордеон: раскрываем только активный город */}
              <Link
                className={`city-menu-link ${isActive ? "is-active" : ""}`}
                href={cityHref}
                style={cityStyle}
                onKeyDown={onLinkKeyDown}
                aria-expanded={isActive}
              >
                <span className="city-menu-nail" aria-hidden="true" />
                <span className="city-menu-label">{city.city}</span>
                <span className="city-menu-count">{city.count}</span>
              </Link>

              {isActive && activeCityLandmarks.length > 0 && (
                <LandmarkList
                  items={activeCityLandmarks}
                  city={city.slug}
                  lang={lang}
                  activeLandmark={activeLandmark}
                />
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
