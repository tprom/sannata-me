'use client';

import Flipbook from './Flipbook';
import styles from './PortalBook.module.css';

type Props = {
  pages: any[];
  lang: string;
  hideControls?: boolean;
};

export default function PortalBook({ pages, lang, hideControls = false }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Flipbook pages={pages} lang={lang} hideControls={hideControls} />
      </div>
    </div>
  );
}
