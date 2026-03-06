# Agent v2.2 — Техническое задание (Skill generateCityDescription)

Цель версии v2.2 — добавить Skill `generateCityDescription`, который создаёт или обновляет текстовое описание города.  
Описание хранится в `data.json` города и используется UI для отображения основной текстовой информации.

---

# 1. Новый Skill: generateCityDescription

Файл:
```
/components/agent/skills/generateCityDescription.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает текст описания (`descriptionText`)
- обновляет поле `description` в `data.json` города
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай описание города Augsburg: …»
- «Добавь текстовое описание для города Munich: …»
- «Обнови описание города Berlin следующим текстом: …»
- «Заполни описание города Hamburg: …»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateCityDescription

Команда считается `generateCityDescription`, если содержит:

- «описание города»
- «создай описание города»
- «обнови описание города»
- «добавь описание города»
- «заполни описание города»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `descriptionText` — строка (любой текст)

Пример:
«Создай описание города Augsburg: Это один из старейших городов Германии…»

Результат:
- `cityName = "Augsburg"`
- `descriptionText = "Это один из старейших городов Германии…"»

---

# 4. Поведение Skill generateCityDescription

## 4.1. Входные данные

```ts
generateCityDescription(cityName: string, descriptionText: string)
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

4. Обновить поле `description`:
   - если поля нет → создать  
   - установить:
     ```json
     "description": "переданный текст"
     ```

5. Сохранить файл.

6. Вернуть результат:

```json
{
  "type": "success",
  "message": "Описание города обновлено",
  "data": {
    "city": "{cityName}",
    "updated": true
  }
}
```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateCityDescription`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateCityDescription(cityName, descriptionText);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v2.2

Skill НЕ должен:

- генерировать текст самостоятельно  
- интерпретировать текст  
- изменять slug  
- создавать новые города  
- изменять meta или изображения  

Только запись переданного текста в `description`.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateCityDescription` согласно разделу «Поведение Skill generateCityDescription».
2. Обнови AgentCore, чтобы он распознавал команды создания/обновления описания города.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `description`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
