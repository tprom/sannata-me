# Agent v2.3 — Техническое задание (Skill generateCityMeta)

Цель версии v2.3 — добавить Skill `generateCityMeta`, который создаёт или обновляет meta‑данные города.  
Meta‑данные включают:

- `title` — короткое название города
- `subtitle` — подзаголовок
- `keywords` — массив ключевых слов
- `shortDescription` — краткое SEO‑описание

---

# 1. Новый Skill: generateCityMeta

Файл:
```
/components/agent/skills/generateCityMeta.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает объект meta‑данных (`meta`)
- обновляет поле `meta` в `data.json` города
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай meta для города Augsburg: title=…, subtitle=…, keywords=…, short=…»
- «Обнови meta‑данные города Munich: …»
- «Добавь ключевые слова и подзаголовок для города Berlin: …»
- «Установи meta для города Hamburg: …»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateCityMeta

Команда считается `generateCityMeta`, если содержит:

- «meta города»
- «meta‑данные города»
- «создай meta города»
- «обнови meta города»
- «добавь meta города»
- «title», «subtitle», «keywords», «short»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `meta` — объект вида:

```json
{
  "title": "...",
  "subtitle": "...",
  "keywords": ["...", "..."],
  "shortDescription": "..."
}
```

Пример команды:

«Создай meta для города Augsburg: title=City of Augsburg, subtitle=Historic Bavarian city, keywords=augsburg,bavaria,history, short=One of the oldest cities in Germany.»

Результат:

- `cityName = "Augsburg"`
- `meta = { title, subtitle, keywords[], shortDescription }`

---

# 4. Поведение Skill generateCityMeta

## 4.1. Входные данные

```ts
generateCityMeta(cityName: string, meta: MetaData)
```

## 4.2. Действия Skill

1. Создать slug города:
   ```
   citySlug = slugify(cityName)
   ```

2. Проверить, существует ли город:
   ```
   /data/landmarks/{citySlug}/index.json
   ```

3. Загрузить data.json города:
   ```
   /data/landmarks/{citySlug}/data.json
   ```

4. Обновить поле `meta`:
   - если поля нет → создать  
   - установить:

```json
"meta": {
  "title": "...",
  "subtitle": "...",
  "keywords": [...],
  "shortDescription": "..."
}
```

5. Сохранить файл.

6. Вернуть результат:

```json
{
  "type": "success",
  "message": "Meta города обновлена",
  "data": {
    "city": "{cityName}",
    "updated": true
  }
}
```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateCityMeta`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateCityMeta(cityName, meta);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v2.3

Skill НЕ должен:

- генерировать meta автоматически  
- интерпретировать текст  
- изменять slug  
- создавать новые города  
- изменять description или изображения  

Только запись переданных meta‑данных.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateCityMeta` согласно разделу «Поведение Skill generateCityMeta».
2. Обнови AgentCore, чтобы он распознавал команды создания/обновления meta города.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `meta`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
