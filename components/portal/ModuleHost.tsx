// /components/portal/ModuleHost.tsx

'use client';

import styles from './ModuleHost.module.css';

// Модули
import BooksModule from '../modules/books/BooksModule';
import InsightsModule from '../modules/insights/InsightsModule';
import LandmarksModule from '../modules/landmarks/LandmarksModule';
import StudioModule from '../modules/studio/StudioModule';

// Компоненты портала
import ModuleNavigation from './ModuleNavigation';
import PortalBook from '../book/PortalBook';

type Props = {
  activeModule: 'books' | 'insights' | 'landmarks' | 'studio';
};

export default function ModuleHost({ activeModule }: Props) {
  // 1. Выбираем модуль
  const moduleMap = {
    books: BooksModule,
    insights: InsightsModule,
    landmarks: LandmarksModule,
    studio: StudioModule,
  };

  const ActiveModule = moduleMap[activeModule];

  // 2. Получаем данные модуля
  const { navigation, pages, controls } = ActiveModule.generate();

  return (
    <div className={styles.host}>
      {/* Левая зона — навигация модуля */}
      <ModuleNavigation
        navigation={navigation}
        controls={controls}
      />

      {/* Правая зона — книга */}
      <PortalBook pages={pages} />
    </div>
  );
}
