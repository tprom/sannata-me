# Agent v1.4 — Техническое задание (Skill generateGallery)

Цель версии v1.4 — добавить Skill `generateGallery`, который создаёт галерею изображений для достопримечательности, формирует структуру папок и обновляет список изображений в `data.json`.

---

# 1. Новый Skill: generateGallery

Файл:
```
/components/agent/skills/generateGallery.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает список изображений (`images`)
- создаёт папку `gallery/`, если её нет
- копирует или регистрирует изображения
- обновляет массив `images` в `data.json`
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай галерею для Dom в Augsburg»
- «Добавь изображения в галерею Perlachturm в городе Augsburg»
- «Обнови галерею Rathaus в Augsburg»
- «Добавь в галерею Cathedral картинки: image1.jpg, image2.jpg»
- «Создай папку gallery и добавь туда изображения для Dom»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateGallery

AgentCore должен определять команду как `generateGallery`, если текст содержит:

- «галерею»
- «добавь изображения»
- «обнови галерею»
- «создай галерею»
- «добавь в галерею»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
- `images` — массив строк (имена файлов или URL)

Пример:
- команда: «Добавь в галерею Dom в Augsburg изображения: a.jpg, b.jpg»
- результат:
  - `cityName = "Augsburg"`
  - `landmarkName = "Dom"`
  - `images = ["a.jpg", "b.jpg"]`

---

# 4. Поведение Skill generateGallery

## 4.1. Входные данные

```ts
generateGallery(cityName: string, landmarkName: string, images: string[])
```

## 4.2. Действия Skill

1. **Создать slug города**
   ```
   citySlug = slugify(cityName)
   ```

2. **Проверить, существует ли город**
   - проверить наличие:
     ```
     /data/landmarks/{citySlug}/index.json
     ```

3. **Найти достопримечательность в index.json**
   - загрузить список
   - найти запись по названию или slug
   - если нет → вернуть ошибку

4. **Создать папку gallery, если её нет**
   ```
   /data/landmarks/{citySlug}/{landmarkSlug}/gallery/
   ```

5. **Добавить изображения**
   - Skill НЕ генерирует изображения  
   - Skill НЕ скачивает изображения  
   - Skill просто:
     - регистрирует имена файлов
     - или копирует файлы, если они уже есть в проекте (опционально)

6. **Обновить data.json**
   - загрузить файл:
     ```
     /data/landmarks/{citySlug}/{landmarkSlug}/data.json
     ```
   - если нет поля `images` → создать `[]`
   - добавить новые элементы в массив `images`
   - сохранить файл

7. **Вернуть результат**
   ```json
   {
     "type": "success",
     "message": "Галерея обновлена",
     "data": {
       "city": "{cityName}",
       "landmark": "{landmarkName}",
       "added": images
     }
   }
   ```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateGallery`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateGallery(cityName, landmarkName, images);
   ```
4. Вернуть результат в UI в стандартизированном формате.

---

# 6. Ограничения версии v1.4

Skill generateGallery НЕ должен:

- генерировать изображения
- скачивать изображения из интернета
- изменять slug
- изменять название достопримечательности
- создавать новые достопримечательности
- создавать новые города

Только работа с галереей и обновление массива `images`.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateGallery` согласно разделу «Поведение Skill generateGallery».
2. Обнови AgentCore, чтобы он распознавал команды работы с галереей.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только массив `images`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills createCity, createLandmark, updateLandmark и normalizeLandmark.
7. Добавь комментарии к ключевым функциям.
