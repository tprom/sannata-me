# Agent v2.6 — LandmarkCardUpgrade

Цель версии v2.6 — улучшить карточки достопримечательностей, которые отображаются:

- на странице города (в зоне 3)
- в любых списках достопримечательностей
- в будущих модулях (например, "Attractions of the World")

Карточка должна стать более информативной, визуально выразительной и архитектурно расширяемой.

---

# 1. Новая структура карточки достопримечательности

Карточка должна включать:

1. hero‑изображение достопримечательности  
2. название достопримечательности  
3. краткое описание (shortDescription)  
4. ссылку на страницу достопримечательности  
5. hover‑эффект  
6. адаптивную сетку  

---

# 2. Источник данных карточки

Для каждой достопримечательности:

```
/data/landmarks/{citySlug}/{landmarkSlug}/data.json
```

Используем:

- data.meta.title  
- data.meta.shortDescription  
- data.hero (если нет — data.cover)  

---

# 3. Новый компонент LandmarkCard.tsx

Создать файл:

```
/components/landmark/LandmarkCard.tsx
```

Структура:

```tsx
type Props = {
  citySlug: string;
  slug: string;
  title: string;
  shortDescription: string;
  image: string;
};

export default function LandmarkCard({ citySlug, slug, title, shortDescription, image }: Props) {
  return (
    <a href={`/landmark/${citySlug}/${slug}`} className="landmark-card">
      <div className="landmark-card-image-wrapper">
        <img src={image} alt={title} className="landmark-card-image" />
      </div>

      <div className="landmark-card-content">
        <h4>{title}</h4>
        <p className="landmark-card-muted">{shortDescription}</p>
      </div>
    </a>
  );
}
```

---

# 4. Обновление CityLandmarksGallery.tsx

Галерея должна использовать новый компонент LandmarkCard:

```tsx
<LandmarkCard
  citySlug={citySlug}
  slug={l.slug}
  title={l.meta.title}
  shortDescription={l.meta.shortDescription}
  image={l.hero || l.cover}
/>
```

---

# 5. Требования к стилям

Добавить классы:

- `.landmark-card`
- `.landmark-card-image-wrapper`
- `.landmark-card-image`
- `.landmark-card-content`
- `.landmark-card-muted`

Карточка должна:

- иметь тень или лёгкий hover‑подъём  
- иметь скруглённые углы  
- быть кликабельной  
- быть адаптивной (2–4 колонки)  
- иметь фиксированную высоту изображения  

---

# 6. Обновление страницы города (зона 3)

Страница города должна:

- загружать meta и hero каждой достопримечательности  
- передавать данные в LandmarkCard  
- отображать сетку карточек  

---

# 7. Ограничения версии v2.6

Версия НЕ должна:

- менять Skills  
- менять структуру данных  
- генерировать новые данные  
- менять работу агента  

Только UI‑улучшения.

---

# 8. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай компонент LandmarkCard.tsx.
2. Обнови CityLandmarksGallery.tsx, чтобы он использовал LandmarkCard.
3. Добавь адаптивную сетку карточек.
4. Добавь hover‑эффекты и визуальные улучшения.
5. Обнови стили, не ломая существующие компоненты.
6. Не изменяй Skills и структуру данных.
7. Добавь комментарии к ключевым изменениям.
