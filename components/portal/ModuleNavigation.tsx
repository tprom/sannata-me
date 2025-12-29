'use client';

import styles from './ModuleNavigation.module.css';

type Props = {
  navigation: {
    title?: string;
    items: { id: string; label: string }[];
    active: string;
  };
  controls: {
    onSelect: (id: string) => void;
  };
};

export default function ModuleNavigation({ navigation, controls }: Props) {
  return (
    <aside className={styles.nav}>
      {navigation.title && (
        <div className={styles.title}>{navigation.title}</div>
      )}

      {navigation.items && navigation.items.length > 0 && (
        <ul className={styles.list}>
          {navigation.items.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navButton} ${
                  navigation.active === item.id ? styles.active : ''
                }`}
                onClick={() => controls.onSelect(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
