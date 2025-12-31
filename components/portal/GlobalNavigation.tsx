'use client';

import { useTranslations } from 'next-intl';
import styles from './GlobalNavigation.module.css';

type Props = {
  active: 'books' | 'insights' | 'landmarks' | 'studio' | null;
  onSelect: (module: 'books' | 'insights' | 'landmarks' | 'studio') => void;
};

export default function GlobalNavigation({ active, onSelect }: Props) {
  const t = useTranslations('nav');

  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.navButton} ${active === 'books' ? styles.active : ''}`}
        onClick={() => onSelect('books')}
      >
        {t('books')}
      </button>

      <button
        className={`${styles.navButton} ${active === 'insights' ? styles.active : ''}`}
        onClick={() => onSelect('insights')}
      >
        {t('insights')}
      </button>

      <button
        className={`${styles.navButton} ${active === 'landmarks' ? styles.active : ''}`}
        onClick={() => onSelect('landmarks')}
      >
        {t('landmarks')}
      </button>

      <button
        className={`${styles.navButton} ${active === 'studio' ? styles.active : ''}`}
        onClick={() => onSelect('studio')}
      >
        {t('studio')}
      </button>
    </nav>
  );
}

