# Agent v2.0 — Техническое задание (Skill generateImage)

Цель версии v2.0 — добавить Skill `generateImage`, который генерирует изображение по текстовому описанию (prompt), сохраняет файл в нужную папку и регистрирует его в `data.json`.

---

# 1. Новый Skill: generateImage

Файл:
```
/components/agent/skills/generateImage.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает тип изображения (`imageType`)
- принимает текстовый prompt (`prompt`)
- генерирует изображение через встроенный image‑генератор
- сохраняет файл в нужную папку
- обновляет соответствующее поле в `data.json`
- возвращает стандартизированный ответ

---

# 2. Поддерживаемые типы изображений

Skill должен поддерживать следующие типы:

| Тип | Папка | Поле в data.json | Описание |
|-----|--------|-------------------|----------|
| `cover` | `cover/` | `cover` | Обложка |
| `hero` | `hero/` | `hero` | Верхнее изображение |
| `gallery` | `gallery/` | `gallery[]` | Элемент галереи |
| `image` | `images/` | `images[]` | Дополнительные изображения |

---

# 3. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Сгенерируй cover для Cathedral в Augsburg: …»
- «Создай hero‑изображение для Perlachturm: …»
- «Добавь изображение в галерею Rathaus: …»
- «Сгенерируй изображение для Dom в городе Augsburg: …»

---

# 4. Логика обработки команд в AgentCore

## 4.1. Определение команды generateImage

Команда считается `generateImage`, если содержит:

- «сгенерируй изображение»
- «создай изображение»
- «сгенерируй cover»
- «сгенерируй hero»
- «добавь в галерею»
- «сделай картинку»

## 4.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
- `imageType` (cover, hero, gallery, image)
- `prompt` — текстовое описание изображения

Пример:
«Сгенерируй cover для Cathedral в Augsburg: majestic gothic cathedral at sunrise»

Результат:
- `cityName = "Augsburg"`
- `landmarkName = "Cathedral"`
- `imageType = "cover"`
- `prompt = "majestic gothic cathedral at sunrise"`

---

# 5. Поведение Skill generateImage

## 5.1. Входные данные

```ts
generateImage(cityName: string, landmarkName: string, imageType: string, prompt: string)
```

## 5.2. Действия Skill

1. Создать slug города и достопримечательности.
2. Проверить существование города и landmark.
3. Определить папку назначения:
   ```
   cover → cover/
   hero → hero/
   gallery → gallery/
   image → images/
   ```
4. Сгенерировать имя файла:
   ```
   {timestamp}-{slug}.jpg
   ```
5. Вызвать image‑генератор с prompt.
6. Сохранить изображение в нужную папку.
7. Обновить data.json:
   - cover → `"cover": "cover/filename.jpg"`
   - hero → `"hero": "hero/filename.jpg"`
   - gallery → `gallery.push("gallery/filename.jpg")`
   - image → `images.push("images/filename.jpg")`
8. Вернуть результат:

```json
{
  "type": "success",
  "message": "Изображение создано",
  "data": {
    "city": "{cityName}",
    "landmark": "{landmarkName}",
    "type": "{imageType}",
    "file": "{filename}"
  }
}
```

---

# 6. Ограничения версии v2.0

Skill НЕ должен:

- генерировать slug  
- менять структуру города  
- изменять meta или description  
- удалять существующие изображения  

Только генерация и регистрация нового изображения.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateImage` согласно разделу «Поведение Skill generateImage».
2. Обнови AgentCore, чтобы он распознавал команды генерации изображений.
3. Реализуй работу с файловой системой (fs, path).
4. Реализуй вызов image‑генератора.
5. Обновляй только соответствующие поля в data.json.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
