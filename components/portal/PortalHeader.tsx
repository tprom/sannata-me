"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalHeader() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const supported = ["en", "de", "ru", "uk"];
  const detected =
    segments[0] && supported.includes(segments[0]) ? segments[0] : "en";

  let pathWithoutLang = "";
  if (pathname === "/") {
    pathWithoutLang = "";
  } else {
    if (segments[0] && supported.includes(segments[0])) {
      const rest = segments.slice(1).join("/");
      pathWithoutLang = rest ? `/${rest}` : "";
    } else {
      pathWithoutLang = pathname;
    }
  }

  const modules = [
    { key: "books", label: "Books" },
    { key: "insights", label: "Insights" },
    { key: "landmarks", label: "Landmarks" },
    { key: "studio", label: "Studio" },
  ];

  const langs = ["en", "de", "ru", "uk"];

  const [hovered, setHovered] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== "undefined" ? window.innerWidth < 600 : false,
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const activeModule =
    segments[1] && modules.map((m) => m.key).includes(segments[1])
      ? segments[1]
      : "";

  return (
    <header
      style={{
        width: "100%",
        padding: "12px 20px",
        borderBottom: "1px solid #ddd",
        background: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        fontSize: "18px",
      }}
    >
      <nav style={{ display: "flex", gap: "24px" }}>
        {modules.map((m) => {
          const key = `module-${m.key}`;
          const isActive = activeModule === m.key;
          const isHovered = hovered === key;

          const style: React.CSSProperties = {
            textDecoration: isActive ? "underline" : "none",
            fontWeight: isActive ? "bold" : "normal",
            cursor: "pointer",
            opacity: isHovered ? 0.8 : 1,
            transition:
              "background .24s ease-out, opacity .24s ease-out, transform .12s ease-out",
            padding: isMobile && isActive ? "8px 10px" : undefined,
            borderRadius: isMobile && isActive ? 6 : undefined,
            background: isMobile && isActive ? "#f5f5f5" : undefined,
            transform: isHovered ? "scale(1.03)" : undefined,
          };

          return (
            <Link
              key={m.key}
              href={`/${detected}/${m.key}`}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={style}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 20,
          fontWeight: "bold",
          transition: "background .24s ease-out, opacity .24s ease-out",
        }}
      >
        <Link
          href={`/${detected}`}
          onMouseEnter={() => setHovered("brand")}
          onMouseLeave={() => setHovered(null)}
          style={{
            textDecoration: "none",
            color: "inherit",
            transform: hovered === "brand" ? "scale(1.03)" : undefined,
            transition: "transform .12s ease-out",
          }}
        >
          SANNATA.me
        </Link>
      </div>

      <nav style={{ display: "flex", gap: "16px" }}>
        {langs.map((l) => {
          const key = `lang-${l}`;
          const isActiveLang = detected === l;
          const isHovered = hovered === key;

          const style: React.CSSProperties = {
            fontWeight: isActiveLang ? "bold" : "normal",
            opacity: isActiveLang ? 1 : 0.5,
            cursor: "pointer",
            transition:
              "background .24s ease-out, opacity .24s ease-out, transform .12s ease-out",
            padding: isMobile && isActiveLang ? "6px 8px" : undefined,
            borderRadius: isMobile && isActiveLang ? 6 : undefined,
            background: isMobile && isActiveLang ? "#f5f5f5" : undefined,
            transform: isHovered ? "scale(1.03)" : undefined,
          } as React.CSSProperties;

          // apply hover opacity
          if (isHovered) style.opacity = 0.8;

          return (
            <Link
              key={l}
              href={`/${l}`}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={style}
            >
              {l.toUpperCase()}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
