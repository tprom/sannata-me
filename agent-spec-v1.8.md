# Agent v1.8 — Техническое задание (Skill generateMeta)

Цель версии v1.8 — добавить Skill `generateMeta`, который создаёт или обновляет meta‑данные достопримечательности.  
Meta‑данные включают:  
- `title` — короткое название  
- `subtitle` — подзаголовок  
- `keywords` — массив ключевых слов  
- `shortDescription` — краткое описание (1–2 предложения)

---

# 1. Новый Skill: generateMeta

Файл:
```
/components/agent/skills/generateMeta.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает объект meta‑данных (`meta`)
- обновляет поле `meta` в `data.json`
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай meta для Dom в Augsburg: title=…, subtitle=…, keywords=…, short=…»
- «Обнови meta‑данные Cathedral в городе Augsburg: …»
- «Добавь ключевые слова и подзаголовок для Perlachturm: …»
- «Установи meta для Rathaus: …»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateMeta

Команда считается `generateMeta`, если содержит:

- «meta»
- «мета»
- «meta‑данные»
- «ключевые слова»
- «подзаголовок»
- «title»
- «subtitle»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
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

«Создай meta для Cathedral в Augsburg: title=Main Cathedral, subtitle=Historic landmark, keywords=cathedral,church,history, short=One of the most important churches in the city.»

Результат:

- `cityName = "Augsburg"`
- `landmarkName = "Cathedral"`
- `meta = { title, subtitle, keywords[], shortDescription }`

---

# 4. Поведение Skill generateMeta

## 4.1. Входные данные

```ts
generateMeta(cityName: string, landmarkName: string, meta: MetaData)
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

3. Найти достопримечательность в index.json.

4. Загрузить data.json:
   ```
   /data/landmarks/{citySlug}/{landmarkSlug}/data.json
   ```

5. Обновить поле `meta`:
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

6. Сохранить файл.

7. Вернуть результат:

```json
{
  "type": "success",
  "message": "Meta обновлена",
  "data": {
    "city": "{cityName}",
    "landmark": "{landmarkName}",
    "updated": true
  }
}
```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateMeta`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateMeta(cityName, landmarkName, meta);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v1.8

Skill НЕ должен:

- генерировать meta автоматически  
- интерпретировать текст  
- изменять slug  
- изменять название достопримечательности  
- создавать новые сущности  

Только запись переданных meta‑данных.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateMeta` согласно разделу «Поведение Skill generateMeta».
2. Обнови AgentCore, чтобы он распознавал команды создания/обновления meta.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `meta`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
