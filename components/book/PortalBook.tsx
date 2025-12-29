// /components/book/PortalBook.tsx

'use client';

import Flipbook from './Flipbook';
import styles from './PortalBook.module.css';

type Props = {
  pages: React.ReactNode[];
};

export default function PortalBook({ pages }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bookShadow}>
        <Flipbook pages={pages} />
      </div>
    </div>
  );
}
