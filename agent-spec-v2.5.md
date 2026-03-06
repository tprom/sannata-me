# Agent v2.5 — CityPageLayoutFix

Цель версии v2.5 — обновить страницу города, превратив её в трёхзонную структуру, аналогичную странице достопримечательности.  
Городская страница должна стать полноценным хабом, включающим:

1. Зона 1 — Hero + Meta  
2. Зона 2 — Основной текст  
3. Зона 3 — Галерея достопримечательностей города (автоматическая)

---

# 1. Новая структура страницы города

Страница города должна состоять из трёх зон:

## Зона 1 — Hero + Meta

Использует данные:

- data.hero
- data.meta.title
- data.meta.subtitle
- data.meta.shortDescription

Пример структуры:

```tsx
<section className="city-zone-1">
  <img className="city-hero" src={data.hero} alt={data.meta.title} />
  <h1>{data.meta.title}</h1>
  <h2 className="landmarks-muted">{data.meta.subtitle}</h2>
  <p className="landmarks-muted">{data.meta.shortDescription}</p>
</section>
```

---

## Зона 2 — Основной текст

Использует:

- data.description

```tsx
<section className="city-zone-2">
  <p>{data.description}</p>
</section>
```

---

## Зона 3 — Галерея достопримечательностей города

Галерея НЕ берётся из data.gallery.  
Она формируется **динамически** на основе списка достопримечательностей города.

Источник:

```
/data/landmarks/{citySlug}/index.json
```

Для каждой достопримечательности:

1. загрузить её data.json  
2. взять hero (если нет — cover)  
3. сформировать карточку:

```tsx
<section className="city-zone-3">
  <h3>Landmarks of {data.meta.title}</h3>

  <div className="city-landmarks-gallery">
    {landmarks.map(l => (
      <a key={l.slug} href={`/landmark/${citySlug}/${l.slug}`} className="city-landmark-card">
        <img src={l.hero} alt={l.title} />
        <p>{l.title}</p>
      </a>
    ))}
  </div>
</section>
```

---

# 2. Обновление компонентов

## 2.1. CityList.tsx

CityList больше НЕ отвечает за meta и НЕ должен выводить галерею.  
Он используется только для текстовой зоны (зона 2).

Новая версия:

```tsx
type Props = {
  description: string;
};

export default function CityList({ description }: Props) {
  return (
    <section className="city-zone-2">
      <p>{description}</p>
    </section>
  );
}
```

---

## 2.2. Новый компонент CityLandmarksGallery.tsx

Создать файл:

```
/components/city/CityLandmarksGallery.tsx
```

Функции:

- принимает список достопримечательностей
- отображает карточки
- использует hero или cover

---

## 2.3. Обновление страницы города

Страница города должна:

1. загрузить data.json города  
2. загрузить index.json достопримечательностей  
3. загрузить hero/cover каждой достопримечательности  
4. собрать структуру  
5. отрисовать три зоны

---

# 3. Требования к стилям

Добавить классы:

- .city-zone-1
- .city-zone-2
- .city-zone-3
- .city-landmarks-gallery
- .city-landmark-card
- .city-hero

Галерея должна быть:

- сеткой 2–4 колонки  
- адаптивной  
- с отступами  
- с кликабельными карточками  

---

# 4. Ограничения версии v2.5

UI НЕ должен:

- изменять данные  
- генерировать данные  
- менять Skills  
- менять структуру файлов  

Только корректное отображение.

---

# 5. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Обнови страницу города, создав трёхзонную структуру.
2. Вынеси галерею достопримечательностей в отдельный компонент.
3. Обнови CityList.tsx, чтобы он отвечал только за текстовую зону.
4. Реализуй автоматическую загрузку hero/cover всех достопримечательностей города.
5. Добавь новые CSS‑классы и адаптивную сетку.
6. Не изменяй Skills и структуру данных.
7. Добавь комментарии к ключевым изменениям.
