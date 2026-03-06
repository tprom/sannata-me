# Agent v2.7 — CityMenuUpgrade

Цель версии v2.7 — убрать дублирование между меню достопримечательностей и галереей, 
и превратить меню в полноценный визуальный навигационный элемент.

После обновления меню должно:

1. Показывать миниатюры достопримечательностей рядом с названием.
2. При наведении показывать всплывающее окно (popover/tooltip) с:
   - изображением (hero или cover)
   - названием
   - кратким описанием
3. Полностью заменить собой галерею на странице города.
4. Работать быстро, компактно и адаптивно.

---

# 1. Удаление галереи из страницы города

Страница города больше НЕ должна содержать:

- зону 3 (галерею достопримечательностей)
- компонент CityLandmarksGallery.tsx

Эти элементы должны быть удалены.

---

# 2. Улучшение меню достопримечательностей

Меню достопримечательностей находится в:

```
/components/city/CityMenu.tsx
или аналогичном файле
```

Меню должно быть обновлено так, чтобы каждая строка содержала:

- миниатюру (thumbnail)
- название достопримечательности
- hover‑эффект
- всплывающее окно с карточкой

---

# 3. Источник данных для миниатюр

Для каждой достопримечательности:

```
/data/landmarks/{citySlug}/{landmarkSlug}/data.json
```

Используем:

- hero (если нет — cover)
- meta.title
- meta.shortDescription

Миниатюра должна быть:

- 40×40 px (или около того)
- обрезана по центру
- скруглённая (border-radius: 6px)

---

# 4. Всплывающее окно (popover / tooltip)

При наведении на пункт меню:

- появляется всплывающее окно справа или слева
- окно содержит:
  - изображение 200–300 px шириной
  - название
  - краткое описание
- окно исчезает при уходе курсора

Технически можно реализовать:

- через React state (onMouseEnter / onMouseLeave)
- или через CSS (если упрощённый вариант)
- или через библиотеку (Radix UI / HeadlessUI), если уже используется

---

# 5. Новый компонент LandmarkPreview.tsx

Создать файл:

```
/components/landmark/LandmarkPreview.tsx
```

Структура:

```tsx
type Props = {
  title: string;
  shortDescription: string;
  image: string;
};

export default function LandmarkPreview({ title, shortDescription, image }: Props) {
  return (
    <div className="landmark-preview">
      <img src={image} alt={title} className="landmark-preview-image" />
      <h4>{title}</h4>
      <p className="landmark-preview-muted">{shortDescription}</p>
    </div>
  );
}
```

---

# 6. Обновление CityMenu.tsx

Каждый пункт меню должен выглядеть так:

```tsx
<li 
  className="city-menu-item"
  onMouseEnter={() => setPreview(landmark.slug)}
  onMouseLeave={() => setPreview(null)}
>
  <img src={thumbnail} className="city-menu-thumb" />
  <a href={`/landmark/${citySlug}/${landmark.slug}`}>{landmark.meta.title}</a>

  {preview === landmark.slug && (
    <LandmarkPreview
      title={landmark.meta.title}
      shortDescription={landmark.meta.shortDescription}
      image={landmark.hero || landmark.cover}
    />
  )}
</li>
```

---

# 7. Требования к стилям

Добавить классы:

- `.city-menu-item`
- `.city-menu-thumb`
- `.landmark-preview`
- `.landmark-preview-image`
- `.landmark-preview-muted`

Требования:

- миниатюра слева от названия
- всплывающее окно позиционируется абсолютно
- окно имеет тень, фон, скругления
- адаптивность обязательна

---

# 8. Ограничения версии v2.7

Версия НЕ должна:

- менять Skills
- менять структуру данных
- менять AgentCore
- генерировать новые данные

Только UI‑улучшения.

---

# 9. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Удали галерею достопримечательностей со страницы города.
2. Обнови меню достопримечательностей, добавив миниатюры.
3. Реализуй всплывающее окно LandmarkPreview.
4. Добавь hover‑эффекты и адаптивность.
5. Обнови стили, не ломая существующие компоненты.
6. Не изменяй Skills и структуру данных.
7. Добавь комментарии к ключевым изменениям.
