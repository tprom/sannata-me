# Agent v2.1 — Техническое задание (Skill generateCityImage)

Цель версии v2.1 — добавить Skill `generateCityImage`, который генерирует изображение для города по текстовому описанию (prompt), сохраняет файл в нужную папку и обновляет `data.json` города.

---

# 1. Новый Skill: generateCityImage

Файл:
```
/components/agent/skills/generateCityImage.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает тип изображения (`imageType`)
- принимает текстовый prompt (`prompt`)
- генерирует изображение через image‑генератор
- сохраняет файл в нужную папку
- обновляет соответствующее поле в `data.json`
- возвращает стандартизированный ответ

---

# 2. Поддерживаемые типы изображений

| Тип | Папка | Поле в data.json | Описание |
|-----|--------|-------------------|----------|
| `cover` | `cover/` | `cover` | Обложка города |
| `hero` | `hero/` | `hero` | Верхнее изображение |
| `gallery` | `gallery/` | `gallery[]` | Элемент галереи города |
| `image` | `images/` | `images[]` | Дополнительные изображения |

---

# 3. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Сгенерируй cover для города Augsburg: …»
- «Создай hero‑изображение для города Munich: …»
- «Добавь изображение в галерею города Berlin: …»
- «Сгенерируй изображение для города Hamburg: …»

---

# 4. Логика обработки команд в AgentCore

## 4.1. Определение команды generateCityImage

Команда считается `generateCityImage`, если содержит:

- «сгенерируй изображение города»
- «сгенерируй cover города»
- «сгенерируй hero города»
- «добавь в галерею города»
- «создай изображение города»

## 4.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `imageType` (cover, hero, gallery, image)
- `prompt` — текстовое описание изображения

Пример:
«Сгенерируй hero для города Augsburg: panoramic view of Augsburg at sunset»

Результат:
- `cityName = "Augsburg"`
- `imageType = "hero"`
- `prompt = "panoramic view of Augsburg at sunset"`

---

# 5. Поведение Skill generateCityImage

## 5.1. Входные данные

```ts
generateCityImage(cityName: string, imageType: string, prompt: string)
```

## 5.2. Действия Skill

1. Создать slug города:
   ```
   citySlug = slugify(cityName)
   ```

2. Проверить, существует ли город:
   ```
   /data/landmarks/{citySlug}/index.json
   ```

3. Определить папку назначения:
   ```
   cover → cover/
   hero → hero/
   gallery → gallery/
   image → images/
   ```

4. Сгенерировать имя файла:
   ```
   {timestamp}-{citySlug}.jpg
   ```

5. Вызвать image‑генератор с prompt.

6. Сохранить изображение в нужную папку.

7. Обновить data.json города:
   - cover → `"cover": "cover/filename.jpg"`
   - hero → `"hero": "hero/filename.jpg"`
   - gallery → `gallery.push("gallery/filename.jpg")`
   - image → `images.push("images/filename.jpg")`

8. Вернуть результат:

```json
{
  "type": "success",
  "message": "Изображение города создано",
  "data": {
    "city": "{cityName}",
    "type": "{imageType}",
    "file": "{filename}"
  }
}
```

---

# 6. Ограничения версии v2.1

Skill НЕ должен:

- изменять meta или description города  
- удалять существующие изображения  
- создавать новые города  
- менять slug  

Только генерация и регистрация изображения.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateCityImage` согласно разделу «Поведение Skill generateCityImage».
2. Обнови AgentCore, чтобы он распознавал команды генерации изображений для городов.
3. Реализуй работу с файловой системой (fs, path).
4. Реализуй вызов image‑генератора.
5. Обновляй только соответствующие поля в data.json города.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
