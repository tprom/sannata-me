import styles from './GlobalNavigation.module.css';

export default function GlobalNavigation({ active, onSelect }) {
  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.navButton} ${active === 'books' ? styles.active : ''}`}
        onClick={() => onSelect('books')}
      >
        Books
      </button>

      <button
        className={`${styles.navButton} ${active === 'insights' ? styles.active : ''}`}
        onClick={() => onSelect('insights')}
      >
        Insights
      </button>

      <button
        className={`${styles.navButton} ${active === 'landmarks' ? styles.active : ''}`}
        onClick={() => onSelect('landmarks')}
      >
        Landmarks
      </button>

      <button
        className={`${styles.navButton} ${active === 'studio' ? styles.active : ''}`}
        onClick={() => onSelect('studio')}
      >
        Studio
      </button>
    </nav>
  );
}
