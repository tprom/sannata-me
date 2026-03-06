# Agent v1.6 — Техническое задание (Skill generateHero)

Цель версии v1.6 — добавить Skill `generateHero`, который создаёт или обновляет hero‑изображение достопримечательности.  
Hero — это большое верхнее изображение страницы, отличающееся от обложки (cover).

---

# 1. Новый Skill: generateHero

Файл:
```
/components/agent/skills/generateHero.ts
```

Функции Skill:
- принимает название города (`cityName`)
- принимает название достопримечательности (`landmarkName`)
- принимает имя файла hero‑изображения (`heroImage`)
- создаёт папку `hero/`, если её нет
- регистрирует файл hero
- обновляет поле `hero` в `data.json`
- возвращает стандартизированный ответ

---

# 2. Команды, которые должен распознавать Агент

Агент должен понимать команды вида:

- «Создай hero для Dom в Augsburg»
- «Добавь hero‑изображение для Cathedral в городе Augsburg: hero.jpg»
- «Установи верхнее изображение для Perlachturm: top.png»
- «Обнови hero у Rathaus в Augsburg»

---

# 3. Логика обработки команд в AgentCore

## 3.1. Определение команды generateHero

Команда считается `generateHero`, если содержит:

- «hero»
- «верхнее изображение»
- «баннер»
- «установи hero»
- «добавь hero»

## 3.2. Извлечение параметров

Из текста команды нужно извлечь:

- `cityName`
- `landmarkName`
- `heroImage` — строка (имя файла)

Пример:
«Добавь hero для Cathedral в Augsburg: cathedral-hero.jpg»

Результат:
- `cityName = "Augsburg"`
- `landmarkName = "Cathedral"`
- `heroImage = "cathedral-hero.jpg"`

---

# 4. Поведение Skill generateHero

## 4.1. Входные данные

```ts
generateHero(cityName: string, landmarkName: string, heroImage: string)
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

4. Создать папку hero, если её нет:
   ```
   /data/landmarks/{citySlug}/{landmarkSlug}/hero/
   ```

5. Зарегистрировать файл hero:
   - Skill НЕ генерирует изображение  
   - НЕ скачивает  
   - НЕ перемещает автоматически  
   - Он только записывает имя файла в `data.json`

6. Обновить data.json:
   - загрузить:
     ```
     /data/landmarks/{citySlug}/{landmarkSlug}/data.json
     ```
   - если нет поля `hero` → добавить  
   - установить:
     ```json
     "hero": "hero/имя_файла"
     ```

7. Сохранить файл.

8. Вернуть результат:

```json
{
  "type": "success",
  "message": "Hero обновлён",
  "data": {
    "city": "{cityName}",
    "landmark": "{landmarkName}",
    "hero": "{heroImage}"
  }
}
```

---

# 5. Интеграция с AgentCore

AgentCore должен:

1. Распознать команду как `generateHero`
2. Извлечь параметры
3. Вызвать Skill:
   ```ts
   const result = await generateHero(cityName, landmarkName, heroImage);
   ```
4. Вернуть стандартизированный ответ.

---

# 6. Ограничения версии v1.6

Skill НЕ должен:

- генерировать изображение  
- скачивать изображение  
- изменять slug  
- изменять название достопримечательности  
- создавать новые сущности  

Только работа с hero‑изображением.

---

# 7. Задача для Copilot VS Code

Copilot, выполни следующие задачи:

1. Создай Skill `generateHero` согласно разделу «Поведение Skill generateHero».
2. Обнови AgentCore, чтобы он распознавал команды установки hero.
3. Реализуй работу с файловой системой (fs, path).
4. Обновляй только поле `hero`, не изменяя другие данные.
5. Верни результат в UI в стандартизированном формате.
6. Не изменяй Skills предыдущих версий.
7. Добавь комментарии к ключевым функциям.
