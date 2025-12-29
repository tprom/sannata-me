// /components/book/Flipbook.tsx

'use client';

import React, { useState } from 'react';
import styles from './Flipbook.module.css';

type Props = {
  pages: React.ReactNode[];
};

export default function Flipbook({ pages }: Props) {
  const [pageIndex, setPageIndex] = useState(0);

  const nextPage = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  const prevPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  return (
    <div className={styles.flipbook}>
      <div className={styles.pageContainer}>
        {pages[pageIndex]}
      </div>

      <div className={styles.controls}>
        <button onClick={prevPage} disabled={pageIndex === 0}>
          ← Prev
        </button>

        <span className={styles.counter}>
          {pageIndex + 1} / {pages.length}
        </span>

        <button onClick={nextPage} disabled={pageIndex === pages.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
