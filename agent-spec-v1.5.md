# Agent v1.5 — Техническое задание (Skill generateCover)

Цель версии v1.5 — добавить Skill `generateCover`, который создаёт или обновляет главное изображение (обложку) достопримечательности, формирует структуру папок и обновляет поле `cover` в `data.json`.

---

# 1. Новый Skill: generateCover

Файл:
```
/components/agent/skills/generateCover.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает имя файла обложки (`coverImage`)
- создаёт папку `cover/`, если её нет
- регистрирует файл обложки
- обновляет поле `cover` в `data.json`
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай обложку для Dom в Augsburg»
- «Добавь обложку для Cathedral в городе Augsburg: cover.jpg»
- «Установи главное изображение для Perlachturm: main.png»
- «Обнови cover у Rathaus в Augsburg»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateCover

Команда считается `generateCover`, если содержит:

- «обложк»
- «cover»
- «главное изображение»
- «установи обложку»
- «добавь обложку»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
- `coverImage` — строка (имя файла)

Пример:
«Добавь обложку для Cathedral в Augsburg: cathedr.jpg»

Результат:
- `cityName = "Augsburg"`
- `landmarkName = "Cathedral"`
- `coverImage = "cathedr.jpg"`

---

# 4. Поведение Skill generateCover

## 4.1. Входные данные

```ts
generateCover(cityName: string, landmarkName: string, coverImage: string)
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

4. Создать папку cover, если её нет:
   ```
   /data/landmarks/{citySlug}/{landmarkSlug}/cover/
   ```

5. Зарегистрировать файл обложки:
   - Skill НЕ генерирует изображение  
   - НЕ скачивает  
   - НЕ перемещает автоматически  
   - Он только записывает имя файла в `data.json`

6. Обновить data.json:
   - загрузить:
     ```
     /data/landmarks/{citySlug}/{landmarkSlug}/data.json
     ```
   - если нет поля `cover` → добавить  
   - установить:
     ```json
     "cover": "cover/имя_файла"
     ```

7. Сохранить файл.

8. Вернуть результат:

```json
{
  "type": "success",
  "message": "Обложка обновлена",
  "data": {
    "city": "{cityName}",
    "landmark": "{landmarkName}",
    "cover": "{coverImage}"
  }
}
```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateCover`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateCover(cityName, landmarkName, coverImage);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v1.5

Skill НЕ должен:

- генерировать изображение  
- скачивать изображение  
- изменять slug  
- изменять название достопримечательности  
- создавать новые сущности  

Только работа с обложкой.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateCover` согласно разделу «Поведение Skill generateCover».
2. Обнови AgentCore, чтобы он распознавал команды установки обложки.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `cover`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
