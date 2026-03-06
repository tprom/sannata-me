# Agent v2.4 — UpdateCityUI

Цель версии v2.4 — обновить UI страницы города так, чтобы он корректно использовал meta‑данные города, созданные в v2.3.

После обновления UI должен отображать:

- meta.title → основной заголовок страницы
- meta.subtitle → подзаголовок
- meta.shortDescription → краткое описание
- description → основной текст
- hero → верхнее изображение
- gallery → галерею города

---

# 1. Компоненты, которые нужно обновить

## 1.1. CityList.tsx

Текущая версия принимает:

```ts
type Props = {
  title: string;
  description: string;
  note?: string;
};
```

Новая версия должна принимать:

```ts
type Props = {
  meta: {
    title: string;
    subtitle: string;
    shortDescription: string;
  };
  description: string;
};
```

### Новый UI:

```tsx
export default function CityList({ meta, description }: Props) {
  return (
    <section className="landmarks-info">
      <h1>{meta.title}</h1>
      <h2 className="landmarks-muted">{meta.subtitle}</h2>
      <p className="landmarks-muted">{meta.shortDescription}</p>
      <p>{description}</p>
    </section>
  );
}
```

---

# 2. Обновление страницы города

Файл может называться:

- `/app/city/[slug]/page.tsx`
- или `/components/city/CityPage.tsx`
- или аналогично

Страница должна:

1. Загружать `data.json` города:

```
/data/landmarks/{citySlug}/data.json
```

2. Передавать meta и description в CityList:

```tsx
<CityList 
  meta={data.meta}
  description={data.description}
/>
```

3. Отображать hero:

```tsx
<img src={data.hero} alt={data.meta.title} />
```

4. Отображать gallery:

```tsx
{data.gallery.map((img, i) => (
  <img key={i} src={img} alt={`${data.meta.title} ${i}`} />
))}
```

---

# 3. Требования к обновлению UI

UI должен:

- использовать meta.title как главный заголовок
- использовать meta.subtitle как подзаголовок
- использовать meta.shortDescription как краткое описание
- использовать description как основной текст
- корректно отображать hero‑изображение
- корректно отображать галерею
- не ломать существующие стили
- не менять структуру данных

---

# 4. Ограничения версии v2.4

UI НЕ должен:

- изменять данные  
- генерировать данные  
- менять структуру файлов  
- менять работу Skills  

Только корректное отображение данных.

---

# 5. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Обнови компонент `CityList.tsx` согласно новой структуре Props.
2. Обнови страницу города так, чтобы она передавала meta и description в CityList.
3. Добавь отображение hero‑изображения.
4. Добавь отображение галереи.
5. Убедись, что UI использует meta.title, meta.subtitle и meta.shortDescription.
6. Не изменяй структуру данных.
7. Не изменяй Skills.
8. Добавь комментарии к ключевым изменениям.
