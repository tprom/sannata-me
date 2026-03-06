# Интеграция SidebarMenu + PostcardLayout в LandmarksPage

## Цель
Создать страницу LandmarksPage, которая объединяет SidebarMenu (слева) и PostcardLayout (справа).  
Компоненты НЕ должны зависеть друг от друга.  
LandmarksPage НЕ загружает данные — только принимает mock‑данные.

## Структура файлов
/components/modules/landmarks/
    LandmarksPage.jsx
    LandmarksPage.module.css

## Требования к LandmarksPage.jsx
- Использовать flex или grid.
- Высота: 100vh.
- overflow: hidden.
- Левая колонка: SidebarMenu (фиксированная ширина).
- Правая колонка: PostcardLayout (растягивается).
- Передавать в PostcardLayout пропсы:
  - postcardText
  - postcardIllustrations
  - gallery
  - style (null)

## Пример JSX‑структуры
<div className={styles.layout}>
  <aside className={styles.menuColumn}>
    <SidebarMenu />
  </aside>
  <main className={styles.contentColumn}>
    <PostcardLayout
      postcardText={mockText}
      postcardIllustrations={mockIllustrations}
      gallery={mockGallery}
      style={null}
    />
  </main>
</div>

## Требования к LandmarksPage.module.css
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.menuColumn {
  width: 260px;
  overflow-y: auto;
}

.contentColumn {
  flex: 1;
  overflow: hidden;
}

## Архитектурные правила
- SidebarMenu и PostcardLayout — соседи, не родитель/ребёнок.
- Никаких загрузок данных.
- Никаких обращений к API.
- Никаких временных костылей.
