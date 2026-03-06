# Agent v1.7 — Техническое задание (Skill generateDescription)

Цель версии v1.7 — добавить Skill `generateDescription`, который создаёт или обновляет текстовое описание достопримечательности.  
Описание — это основной текстовый блок страницы, который должен быть информативным, структурированным и храниться в `data.json`.

---

# 1. Новый Skill: generateDescription

Файл:
```
/components/agent/skills/generateDescription.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает текст описания (`descriptionText`)
- обновляет поле `description` в `data.json`
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай описание для Dom в Augsburg: …»
- «Добавь текстовое описание для Cathedral в городе Augsburg: …»
- «Обнови описание Perlachturm: …»
- «Заполни описание достопримечательности Rathaus следующим текстом: …»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateDescription

Команда считается `generateDescription`, если содержит:

- «описание»
- «текст»
- «добавь описание»
- «создай описание»
- «обнови описание»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
- `descriptionText` — строка (любой текст)

Пример:
«Создай описание для Cathedral в Augsburg: Это один из важнейших храмов города…»

Результат:
- `cityName = "Augsburg"`
- `landmarkName = "Cathedral"`
- `descriptionText = "Это один из важнейших храмов города…"`

---

# 4. Поведение Skill generateDescription

## 4.1. Входные данные

```ts
generateDescription(cityName: string, landmarkName: string, descriptionText: string)
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

5. Обновить поле `description`:
   - если поля нет → создать  
   - установить:
     ```json
     "description": "переданный текст"
     ```

6. Сохранить файл.

7. Вернуть результат:

```json
{
  "type": "success",
  "message": "Описание обновлено",
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

1. Распознать команду как `generateDescription`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateDescription(cityName, landmarkName, descriptionText);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v1.7

Skill НЕ должен:

- генерировать текст самостоятельно  
- интерпретировать текст  
- изменять slug  
- изменять название достопримечательности  
- создавать новые сущности  

Только запись переданного текста в `description`.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateDescription` согласно разделу «Поведение Skill generateDescription».
2. Обнови AgentCore, чтобы он распознавал команды создания/обновления описания.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `description`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
