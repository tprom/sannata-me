# Модуль “Landmarks” — Техническое задание (Версия 1.1)

Модуль предназначен для отображения достопримечательностей в двухступенчатой структуре:  
**город → достопримечательность**.  
Модуль должен иметь постоянную левую зону меню и динамическую рабочую зону, которая меняет структуру в зависимости от выбора пользователя.

---

# 🧱 1. Структура файлов модуля

Используем существующие файлы:

```
/app/[lang]/landmarks/page.tsx
/components/modules/landmarks/LandmarksModule.tsx
```

Добавить:

```
/app/[lang]/landmarks/[city]/page.tsx
/app/[lang]/landmarks/[city]/[slug]/page.tsx

/components/modules/landmarks/
    CityMenu.tsx
    CityList.tsx
    LandmarkList.tsx
    LandmarkPage.tsx
    LandmarkContent.tsx
    LandmarkGallery.tsx
    styles.css

/data/landmarks/
    index.json
    {city}/index.json
    {city}/{slug}/data.json
    {city}/{slug}/gallery/
```

---

# 🗺 2. Механика работы модуля

## 2.1. Общая архитектура layout

Модуль всегда содержит **левую зону меню**:

```
[ МЕНЮ ГОРОДОВ ] | [ РАБОЧАЯ ЗОНА ]
```

Рабочая зона меняется в зависимости от выбора.

---

## 2.2. Сценарий 1 — пользователь открыл `/landmarks`

Отображается:

- слева: меню городов (`CityMenu.tsx`)
- справа: главная рабочая зона (`LandmarksModule.tsx`)

Структура:

```
[ МЕНЮ ГОРОДОВ ] | [ СПИСОК ГОРОДОВ / ОПИСАНИЕ МОДУЛЯ ]
```

---

## 2.3. Сценарий 2 — пользователь выбрал город `/landmarks/[city]`

Отображается:

- слева: меню городов  
- справа: список достопримечательностей выбранного города  

Структура:

```
[ МЕНЮ ГОРОДОВ ] | [ СПИСОК ДОСТОПРИМЕЧАТЕЛЬНОСТЕЙ ]
```

---

## 2.4. Сценарий 3 — пользователь выбрал достопримечательность `/landmarks/[city]/[slug]`

Рабочая зона делится на две части:

- **центр**: текстовая зона (`LandmarkContent.tsx`)  
- **право**: галерея (`LandmarkGallery.tsx`)  

Итого:

```
[ МЕНЮ ГОРОДОВ ] | [ ТЕКСТОВАЯ ЗОНА ] | [ ГАЛЕРЕЯ ]
```

Это трёхзонная архитектура.

---

# 🧩 3. Структура данных

## 3.1. `/data/landmarks/index.json`
Список городов:

```json
[
  {
    "city": "Augsburg",
    "slug": "augsburg",
    "count": 12
  }
]
```

---

## 3.2. `/data/landmarks/{city}/index.json`
Список достопримечательностей:

```json
[
  {
    "slug": "perlachturm",
    "title": "Perlachturm",
    "thumbnail": "gallery/01.jpg"
  }
]
```

---

## 3.3. `/data/landmarks/{city}/{slug}/data.json`
Полная карточка:

```json
{
  "title": "",
  "city": "",
  "country": "",
  "description": "",
  "history": "",
  "facts": [],
  "coordinates": { "lat": 0, "lng": 0 },
  "tags": [],
  "content": [
    { "type": "paragraph", "text": "" },
    { "type": "image", "src": "gallery/01.jpg", "caption": "" }
  ]
}
```

---

# 🎨 4. Визуальная структура

## 4.1. Главная страница и страница города
Двухколоночный layout:

```
.landmarks-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}
```

---

## 4.2. Страница достопримечательности
Трёхколоночный layout:

```
.landmark-page {
  display: grid;
  grid-template-columns: 300px 2fr 1fr;
  gap: 20px;
}
```

---

## 4.3. Галерея
Функции:

- миниатюры  
- модальное окно  
- зум  
- переключение стрелками  

---

# 🤖 5. Подготовка для будущего Агента

Модуль должен быть готов к тому, что Агент сможет:

- создавать новые города  
- создавать новые достопримечательности  
- генерировать data.json  
- генерировать галерею  
- обновлять index.json  
- генерировать текстовые блоки  
- генерировать изображения  

---

# 🚀 6. Задача для Copilot VS Code

Copilot, выполни следующие шаги:

1. Создай недостающие страницы маршрутов.  
2. Создай компоненты CityMenu, CityList, LandmarkList, LandmarkPage, LandmarkContent, LandmarkGallery.  
3. Реализуй трёхзонную архитектуру layout.  
4. Создай структуру данных в `/data/landmarks`.  
5. Реализуй галерею с модальным окном и зумом.  
6. Обнови LandmarksModule.tsx так, чтобы он рендерил меню и рабочую зону.  
7. Не реализуй сложную логику — только каркас.  
8. Добавь комментарии к ключевым функциям.  
