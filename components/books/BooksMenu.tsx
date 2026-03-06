"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BooksMenu({ books, lang }: { books: any[]; lang: string }) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[2] || null;

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
        {books.map((book) => {
          const key = `book-${book.id}`;
          const isActive = activeSlug === book.slug;
          const isHovered = hovered === key;

          const style: React.CSSProperties = {
            textDecoration: isActive ? "underline" : "none",
            fontWeight: isActive ? "bold" : "normal",
            transition: "all 0.24s ease-out",
            cursor: "pointer",
            opacity: isHovered ? 0.8 : 1,
            transform: isHovered ? "scale(1.03)" : undefined,
            display: "inline-block",
          };

          return (
            <li key={book.id}>
              <Link
                href={`/${lang}/books/${book.slug}`}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={style}
              >
                {book.title[lang] || book.title.en}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}