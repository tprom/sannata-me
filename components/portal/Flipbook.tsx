'use client';

import React from 'react';
import styles from './Flipbook.module.css';

type Props = {
  pages: React.ReactNode[];
};

export default function Flipbook({ pages }: Props) {
  return (
    <div className={styles.flipbook}>
      {pages.map((page, index) => (
        <div key={index} className={styles.page}>
          {page}
        </div>
      ))}
    </div>
  );
}
