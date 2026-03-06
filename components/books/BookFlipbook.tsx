"use client";

import { useState } from "react";
import BookPageRenderer from "./BookPageRenderer";

interface Page {
  type: "text" | "illustration" | "coloring" | "mixed";
  content?: string;
  image?: string;
  download?: boolean;
}

export default function BookFlipbook({ pages }: { pages: Page[] }) {
  const [pageIndex, setPageIndex] = useState(0);

  const goNext = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  const goPrev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const currentPage = pages[pageIndex];

  return (
    <div>
      <BookPageRenderer page={currentPage} />
      <div>
        <button onClick={goPrev} disabled={pageIndex === 0}>
          Previous
        </button>
        <span>
          Page {pageIndex + 1} of {pages.length}
        </span>
        <button onClick={goNext} disabled={pageIndex === pages.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
}