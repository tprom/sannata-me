// /components/book/Page.tsx

import styles from './Page.module.css';

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {children}
      </div>
    </div>
  );
}
