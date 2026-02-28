Концептуальное задание:  
Исследование Copilot VS Code и проектирование Агентной архитектуры портала

## Статус

- Рабочий документ v2 (единая площадка для задач внедрения)
- Базовый контракт: RFC `universal-page-template` Approved v1.1 (2026-02-26)
- Область: агентная архитектура портала + Universal Page Template (`landmarks` → масштабирование)
- CI: включены workflow `Build` и `Validate Universal Page Template`
- Текущий фокус внедрения: Этап 3 / Wave 4 (`final acceptance`)

Экспорт Stage 3 backlog:

- Jira CSV: `docs/backlog-stage3-jira.csv`
- Linear Markdown: `docs/backlog-stage3-linear.md`

## Documentation Map

- RFC: `docs/rfc-universal-page-template-v1.md`
- Schema-pack: `docs/schemas/universal-page-template-v1.1/`
- Рабочий документ: `docs/v2-input.md`
- Stage 3 backlog (Jira CSV): `docs/backlog-stage3-jira.csv`
- Stage 3 backlog (Linear MD): `docs/backlog-stage3-linear.md`

## 🎯 **Цель**

Определить возможность и архитектурную модель, при которой **Агент становится глобальным Администратором портала**, способным:

- управлять всеми модулями портала,
- обновлять данные,
- генерировать контент,
- поддерживать навигацию,
- обеспечивать автоматизацию,
- взаимодействовать с разработчиком через Copilot VS Code.

---

# 🧠 **1. Роль Агента в портале**

Агент должен стать:

## ✔️ **1.1. Централизованным мозгом**

Он управляет:

- структурами данных,
- переводами,
- контентом,
- связями между модулями,
- обновлением карт,
- генерацией миниатюр,
- метаданными,
- конфигурацией модулей.

## ✔️ **1.2. Администратором модулей**

Каждый модуль предоставляет API для:

- чтения данных,
- обновления данных,
- генерации новых элементов,
- синхронизации состояния.

Агент вызывает эти API и управляет ими.

## ✔️ **1.3. Автоматизатором**

Агент должен уметь:

- добавлять новые города,
- обновлять карты,
- генерировать описания,
- создавать миниатюры,
- обновлять JSON‑структуры,
- поддерживать 4 языка,
- обновлять меню,
- пересобирать связи между сущностями.

---

# 🧩 **2. Роль Модулей**

Модули остаются:

- визуальными,
- интерактивными,
- анимированными,
- реактивными.

Они **не генерируют данные**, а только отображают то, что предоставляет Агент.

Модуль «Достопримечательности» — идеальный пример:

- карта мира,
- карта страны,
- карта города,
- меню,
- фильтрация,
- анимации.

Все данные для этих уровней — от Агента.

---

# 🔗 **3. Интеграция Модуля и Агента**

## ✔️ 3.1. Общий формат данных

Агент управляет структурой:

```
/data/attractions/
  world.json
  continents.json
  countries.json
  cities.json
  places.json
  translations/
  maps/
    world.svg
    europe.svg
    germany.svg
    augsburg.svg
```

Модуль читает эти данные и визуализирует.

## ✔️ 3.2. API взаимодействия

Агент предоставляет:

- `getWorld()`
- `getCountries(continent)`
- `getCities(country)`
- `getPlaces(city)`
- `updateCity()`
- `generateMap()`
- `translate()`
- `syncMenu()`

Модуль вызывает эти методы.

## ✔️ 3.3. Навигация модуля достопримечательностей

Агент обеспечивает:

- структуру континентов,
- структуру стран,
- структуру городов,
- связи между ними,
- фильтрацию меню,
- обновление карты.

Модуль обеспечивает:

- анимацию зума,
- отображение слоёв,
- визуальные эффекты,
- взаимодействие пользователя.

---

# 🧪 **4. Исследование Copilot VS Code**

Задача — проверить, может ли Агент:

## ✔️ 4.1. Управлять файлами проекта

- создавать новые JSON‑структуры,
- обновлять существующие,
- генерировать SVG‑карты,
- изменять конфигурацию модулей.

## ✔️ 4.2. Работать как «оператор данных»

- добавлять новые сущности,
- обновлять связи,
- поддерживать целостность данных.

## ✔️ 4.3. Работать как «генератор контента»

- описания городов,
- описания достопримечательностей,
- тексты интерфейса,
- переводы.

## ✔️ 4.4. Работать как «архитектурный ассистент»

- анализировать структуру проекта,
- предлагать улучшения,
- поддерживать модульность,
- следить за чистотой архитектуры.

---

# 🧭 **5. Исследование интеграции для навигации модуля достопримечательностей**

## Агент должен уметь:

- управлять иерархией «континент → страна → город → достопримечательность»,
- обновлять карту при изменениях,
- фильтровать меню,
- генерировать SVG‑слои,
- поддерживать мультиязычность,
- синхронизировать данные между уровнями.

## Модуль должен уметь:

- визуализировать карту,
- анимировать переходы,
- отображать меню,
- реагировать на выбор пользователя.

# 🧭 \*\*6. Может ли Агент стать:

динамическим линкером,
семантическим индексатором,
хранителем связей,
генератором тегов,
поддерживающим механизмом для нелинейной структуры дневника.

---

# 🏁 **7. Результат исследования**

В конце исследования мы должны получить:

### ✔️ 6.1. Архитектурную схему «Агент ↔ Модуль»

### ✔️ 6.2. Прототип взаимодействия

### ✔️ 6.3. Формат данных

### ✔️ 6.4. Пример API

### ✔️ 6.5. Пример интеграции навигации

### ✔️ 6.6. Оценку возможностей Copilot VS Code

### ✔️ 6.7. Оценку ограничений Агента

### ✔️ 6.8. План внедрения

---

# 🧪 **8. Практический smoke-check админпанели агента**

Для быстрой валидации UI-потока реальной админпанели используется:

`npm run smoke:agent-ui`

Что проверяется:

- открытие страницы `/ru/agent`;
- переключение в режим формы города по кнопке «Создать / обновить город»;
- наличие поля выбора достопримечательности в режиме «Создать достопримечательность».

Поведение скрипта:

- автоматически поднимает `next dev` на свободном порту (поиск от `3101`);
- автоматически останавливает поднятый dev-сервер после завершения.

Переменные окружения:

- `SMOKE_AGENT_UI_BASE_URL` — использовать уже запущенный сервер (например, `http://localhost:3000`);
- `SMOKE_AGENT_UI_PORT` — стартовый порт для автопоиска.

Быстрый troubleshooting:

- если не установлен браузер Playwright: `npx playwright install`;
- при падении сохраняется скриншот: `tmp-smoke-agent-ui-failure.png`;
- хвост server-лога выводится между маркерами `DEV_SERVER_LOG_TAIL_START` и `DEV_SERVER_LOG_TAIL_END`.

---

# 🪵 **9. UI-spec меню модуля достопримечательностей (зафиксировано)**

## 9.1. Визуальная модель

- Меню строится вокруг центрального деревянного столба (неровная геометрия, текстура старого дерева).
- Город = основной указатель (крупнее, насыщеннее по текстуре).
- Достопримечательность = вторичная табличка (меньше, мягче по тону и тени).
- Точка крепления (гвоздь/болт) является точкой вращения для анимаций (`transform-origin`).

## 9.2. Композиционные ограничения

- Видимая зона: desktop 7–10 городов, mobile 4–6.
- Диапазоны наклона городов: 3–5°, 7–10°, 12–15°.
- Не более двух «больших» наклонов (12–15°) подряд.
- Таблички не параллельны, но сохраняют ритм и читаемость.

## 9.3. Размеры и типографика

- Контейнер меню: фиксированная высота; desktop 680px, tablet 620px, mobile 560px.
- Внешний layout страницы не сдвигается; раскрытие работает только внутри контейнера.
- Город-указатель: width 220–280px (`clamp`), min-height 52px, max-height 120px, padding 12px 16px.
- Достопримечательность: width 200–260px, min-height 40px, max-height 112px, padding 10px 14px.
- Текст города: 16/22 semibold; текст достопримечательности: 14/20 medium; выравнивание по центру.

## 9.4. Длинные названия

- Перенос строк обязателен (`white-space: normal`, `overflow-wrap: anywhere`, `word-break: break-word`).
- Рост высоты таблички допускается до max-height.
- При достижении max-height применяется внутренний скролл только в теле таблички.

## 9.5. Состояния и анимации

### Hover (desktop) — город

- Длительность: 180ms, `ease-out`.
- Ротация: +1.2° от базового угла.
- Микрокачание: 1 цикл, 220ms, амплитуда 0.8°.
- Тень: усиление на ~30%.
- Текст: подсветка/яркость +8%.

### Hover (desktop) — достопримечательность

- Эффекты аналогичны городу с коэффициентом 0.6.
- Амплитуда до 0.5°, тень +18%, текст +5%.

### Click — город

- Пружина: 260ms (эквивалент `stiffness ~320`, `damping ~22`).
- Столб удлиняется внутри контейнера на 56px.
- Нижний указатель смещается вниз на 24px.
- Таблички достопримечательностей появляются как `fade + slideY(12px→0)` за 220ms.

### Повторный click

- Закрывает текущий список за 180ms.
- Режим раскрытия: `single-open` (в один момент открыт только один город).
- При переключении: закрытие предыдущего (120ms) → открытие нового (220ms).

## 9.6. Accessibility

- Видимый `focus-outline`: 2px + `outline-offset: 3px`.
- Полная клавиатурная поддержка: `Tab`, `Enter`, `Space`, `Esc`.
- Контраст текста на деревянном фоне соответствует WCAG AA.
- Поддержка `prefers-reduced-motion`: отключаются sway/spring, остаются короткие opacity-переходы до 150ms.

## 9.7. Mobile

- Hover заменяется на `tap-highlight` 120ms.
- Повторный tap закрывает текущий список.
- Минимальная зона нажатия: 44px по высоте.
- Анимации упрощены: без вибрации, только мягкий `scale` и `fade/slide`.

## 9.8. Готовность к вёрстке

- Этот раздел является фиксированной реализационной спецификацией для первого прохода UI.
- Изменение параметров допускается только через отдельный update-spec перед началом правок механики главных страниц модуля/города.

---

# ✅ **10. Frontend checklist для реализации меню (по шагам)**

## 10.1. Этап 1 — Layout/структура

- [ ] Создать фиксированный контейнер меню: desktop 680px, tablet 620px, mobile 560px.
- [ ] Обеспечить отсутствие внешнего layout shift при раскрытии городов.
- [ ] Внутри контейнера реализовать внутренний скролл для списка.
- [ ] Сверстать ось столба и два уровня сущностей: город / достопримечательность.

## 10.2. Этап 2 — Геометрия табличек

- [ ] Город-указатель: width 220–280px (`clamp`), min-height 52px, max-height 120px, padding 12px 16px.
- [ ] Достопримечательность: width 200–260px, min-height 40px, max-height 112px, padding 10px 14px.
- [ ] Применить диапазоны наклонов городов: 3–5°, 7–10°, 12–15°.
- [ ] Ограничить последовательность: не более двух «больших» наклонов подряд.

## 10.3. Этап 3 — Текст и длинные названия

- [ ] Город: 16/22 semibold; достопримечательность: 14/20 medium.
- [ ] Центрирование текста по горизонтали и вертикали.
- [ ] Включить обязательный перенос: `white-space: normal`, `overflow-wrap: anywhere`, `word-break: break-word`.
- [ ] При достижении `max-height` включать внутренний скролл таблички.

## 10.4. Этап 4 — Интеракции desktop

- [ ] Hover города: 180ms `ease-out`, +1.2° rotation, sway 220ms (амплитуда 0.8°), тень +30%, текст +8%.
- [ ] Hover достопримечательности: коэффициент 0.6 (до 0.5°, тень +18%, текст +5%).
- [ ] Click города: spring 260ms (`stiffness ~320`, `damping ~22`).
- [ ] На открытии: столб +56px внутри контейнера, нижний указатель +24px, список `fade + slideY(12px→0)` за 220ms.
- [ ] На повторном click: закрытие за 180ms.
- [ ] Режим `single-open`: при открытии нового города сначала закрыть предыдущий (120ms), затем открыть новый (220ms).

## 10.5. Этап 5 — Accessibility

- [ ] Добавить видимый `focus-outline` 2px + `outline-offset: 3px`.
- [ ] Поддержать клавиатуру: `Tab`, `Enter`, `Space`, `Esc`.
- [ ] Проверить контраст текста на фоне дерева по WCAG AA.
- [ ] Реализовать `prefers-reduced-motion`: без sway/spring, только opacity до 150ms.

## 10.6. Этап 6 — Mobile

- [ ] Заменить hover на `tap-highlight` 120ms.
- [ ] Повторный tap закрывает текущий список.
- [ ] Минимальная tap-зона каждой таблички: 44px по высоте.
- [ ] Упростить анимации: без вибрации, только мягкий `scale` + `fade/slide`.

## 10.7. Этап 7 — QA/acceptance

- [ ] При раскрытии/сворачивании ни один внешний блок страницы не сдвигается.
- [ ] Нет визуального хаоса углов: ритм сохраняется при любом наборе городов.
- [ ] Длинные названия не выходят за пределы табличек.
- [ ] На desktop/mouse, keyboard-only и mobile поведение совпадает со spec.
- [ ] В режиме reduced motion интерфейс остаётся полностью функциональным.

---

# 📌 **11. Jira/Linear backlog (готово к переносу)**

## 11.1. Epic

- **ID:** LMENU-EPIC-01
- **Название:** Menu UI — Wooden Signposts (Cities → Landmarks)
- **Цель:** Реализовать зафиксированный UI-spec меню без изменения текущей механики бизнес-логики.
- **Приоритет:** P0
- **Оценка:** 21 SP

## 11.2. Задачи

### LMENU-01 — Menu container & base layout

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** фиксированный контейнер (680/620/560), внутренняя прокрутка, отсутствие внешнего layout shift.
- **DoD:** при раскрытии городов внешние секции страницы не меняют позицию.

### LMENU-02 — City signpost geometry

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** размеры табличек городов, базовая геометрия, точка вращения у гвоздя/болта.
- **DoD:** город-таблички соответствуют размерам и корректно вращаются вокруг точки крепления.

### LMENU-03 — Landmark signpost geometry

- **Priority:** P1
- **Estimate:** 2 SP
- **Scope:** вторичные таблички достопримечательностей (меньшие размеры, иной тон, меньшая визуальная масса).
- **DoD:** второй уровень визуально читается как подчинённый уровню города.

### LMENU-04 — Angle rhythm system

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** диапазоны 3–5°, 7–10°, 12–15°; ограничение не более 2 больших углов подряд.
- **DoD:** при любом наборе городов сохраняется управляемый ритм без хаоса.

### LMENU-05 — Text handling & long labels

- **Priority:** P0
- **Estimate:** 2 SP
- **Scope:** перенос строк, динамическая высота до max-height, внутренний скролл при переполнении.
- **DoD:** длинные названия не выходят за пределы табличек на всех брейкпоинтах.

### LMENU-06 — Desktop hover states

- **Priority:** P1
- **Estimate:** 2 SP
- **Scope:** hover-анимации города и достопримечательности (амплитуды/тени/подсветка по spec).
- **DoD:** эффекты воспроизводятся стабильно, иерархия hover города > hover достопримечательности.

### LMENU-07 — Click/open-close behavior (single-open)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** click-пружина, раскрытие/сворачивание, single-open, тайминги переключения.
- **DoD:** всегда открыт максимум один город; повторный click корректно закрывает текущий.

### LMENU-08 — Accessibility & keyboard

- **Priority:** P0
- **Estimate:** 2 SP
- **Scope:** focus-outline, Enter/Space/Esc, контраст WCAG AA.
- **DoD:** меню полностью управляется клавиатурой, focus видим в каждом интерактивном состоянии.

### LMENU-09 — Reduced motion support

- **Priority:** P1
- **Estimate:** 1 SP
- **Scope:** режим `prefers-reduced-motion` с отключением sway/spring.
- **DoD:** интерфейс остаётся функциональным, анимации упрощены до мягких opacity-переходов.

### LMENU-10 — Mobile interaction pass

- **Priority:** P0
- **Estimate:** 2 SP
- **Scope:** tap-highlight, повторный tap для закрытия, минимальная зона нажатия 44px.
- **DoD:** UX на touch-экранах предсказуем, без зависимостей от hover.

### LMENU-11 — QA + visual regression checklist

- **Priority:** P1
- **Estimate:** 1 SP
- **Scope:** прогон acceptance-пунктов из раздела 10.7 + фиксация результата в PR.
- **DoD:** все пункты 10.7 отмечены как выполненные, дефекты закрыты или заведены отдельными задачами.

## 11.3. Рекомендуемый порядок в спринте

- **Wave 1 (foundation):** LMENU-01, 02, 04, 05
- **Wave 2 (interaction):** LMENU-07, 06
- **Wave 3 (platform quality):** LMENU-10, 08, 09
- **Wave 4 (release gate):** LMENU-11

---

# 📤 **12. CSV для импорта в Jira**

Готовый файл для прямого импорта: `docs/backlog-lmenu-jira.csv`.

```csv
Issue ID,Issue Type,Summary,Priority,Story Points,Description,Definition of Done
LMENU-EPIC-01,Epic,Menu UI — Wooden Signposts (Cities → Landmarks),P0,21,Реализовать зафиксированный UI-spec меню без изменения текущей механики бизнес-логики.,Epic создан и связан со всеми задачами LMENU-01..11
LMENU-01,Story,Menu container & base layout,P0,3,"Фиксированный контейнер (680/620/560), внутренняя прокрутка, отсутствие внешнего layout shift.",При раскрытии городов внешние секции страницы не меняют позицию
LMENU-02,Story,City signpost geometry,P0,3,"Размеры табличек городов, базовая геометрия, точка вращения у гвоздя/болта.",Город-таблички соответствуют размерам и корректно вращаются вокруг точки крепления
LMENU-03,Story,Landmark signpost geometry,P1,2,"Вторичные таблички достопримечательностей: меньшие размеры, иной тон, меньшая визуальная масса.",Второй уровень визуально читается как подчинённый уровню города
LMENU-04,Story,Angle rhythm system,P0,3,"Диапазоны 3–5°, 7–10°, 12–15°; не более двух больших наклонов подряд.",При любом наборе городов сохраняется управляемый ритм без хаоса
LMENU-05,Story,Text handling & long labels,P0,2,"Перенос строк, динамическая высота до max-height, внутренний скролл при переполнении.",Длинные названия не выходят за пределы табличек на всех брейкпоинтах
LMENU-06,Story,Desktop hover states,P1,2,"Hover-анимации города и достопримечательности (амплитуды/тени/подсветка по spec).",Эффекты воспроизводятся стабильно и сохраняют иерархию города/достопримечательности
LMENU-07,Story,Click/open-close behavior (single-open),P0,3,"Click-пружина, раскрытие/сворачивание, single-open, тайминги переключения.",Всегда открыт максимум один город; повторный click корректно закрывает текущий
LMENU-08,Story,Accessibility & keyboard,P0,2,"Focus-outline, Enter/Space/Esc, контраст WCAG AA.",Меню полностью управляется клавиатурой; focus видим в каждом интерактивном состоянии
LMENU-09,Story,Reduced motion support,P1,1,"Режим prefers-reduced-motion с отключением sway/spring.",Интерфейс остаётся функциональным; анимации упрощены до мягких opacity-переходов
LMENU-10,Story,Mobile interaction pass,P0,2,"Tap-highlight, повторный tap для закрытия, минимальная зона нажатия 44px.",UX на touch-экранах предсказуем и не зависит от hover
LMENU-11,Story,QA + visual regression checklist,P1,1,"Прогон acceptance-пунктов из раздела 10.7 + фиксация результата в PR.",Все пункты 10.7 выполнены; дефекты закрыты или заведены отдельными задачами
```

---

# 📋 **13. Markdown-таблица для Linear**

Готовый отдельный файл: `docs/backlog-lmenu-linear.md`.
Сокращённый бэклог Sprint 1 (только P0): `docs/backlog-lmenu-sprint1-p0.md`.
Сокращённый бэклог Sprint 2 (P1/polish): `docs/backlog-lmenu-sprint2-p1.md`.
Release note по меню: `docs/landmarks-menu-release-note.md`.
Handoff checklist (design + QA): `docs/landmarks-menu-handoff-checklist.md`.
QA note template: `docs/landmarks-menu-qa-note-template.md`.
QA note example (2026-02-25): `docs/landmarks-menu-qa-note-2026-02-25.md`.
RFC универсального шаблона страниц: `docs/rfc-universal-page-template-v1.md`.
Schema-pack универсального шаблона v1.1: `docs/schemas/universal-page-template-v1.1/`.

| ID            | Type  | Title                                           | Priority |  SP | Scope                                                                                  | DoD                                                  |
| ------------- | ----- | ----------------------------------------------- | -------- | --: | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| LMENU-EPIC-01 | Epic  | Menu UI — Wooden Signposts (Cities → Landmarks) | P0       |  21 | Реализовать зафиксированный UI-spec меню без изменения текущей механики бизнес-логики. | Epic связан со всеми задачами LMENU-01..11           |
| LMENU-01      | Story | Menu container & base layout                    | P0       |   3 | Контейнер 680/620/560, внутренняя прокрутка, без layout shift.                         | Внешние секции страницы не сдвигаются при раскрытии. |
| LMENU-02      | Story | City signpost geometry                          | P0       |   3 | Размеры табличек городов, базовая геометрия, pivot у крепления.                        | Корректные размеры и вращение от точки крепления.    |
| LMENU-03      | Story | Landmark signpost geometry                      | P1       |   2 | Вторичные таблички меньшего визуального веса.                                          | Чётко читается второй уровень иерархии.              |
| LMENU-04      | Story | Angle rhythm system                             | P0       |   3 | Углы 3–5°/7–10°/12–15°, не более 2 больших подряд.                                     | Нет хаоса углов при любом наборе городов.            |
| LMENU-05      | Story | Text handling & long labels                     | P0       |   2 | Перенос строк, динамическая высота, внутренний скролл.                                 | Длинные названия не ломают таблички.                 |
| LMENU-06      | Story | Desktop hover states                            | P1       |   2 | Hover города и достопримечательности по spec.                                          | Стабильные эффекты и корректная иерархия.            |
| LMENU-07      | Story | Click/open-close behavior (single-open)         | P0       |   3 | Пружина, open/close, single-open, тайминги.                                            | Одновременно открыт только один город.               |
| LMENU-08      | Story | Accessibility & keyboard                        | P0       |   2 | Focus, клавиатура, контраст WCAG AA.                                                   | Полная keyboard-навигация и видимый focus.           |
| LMENU-09      | Story | Reduced motion support                          | P1       |   1 | Поведение для prefers-reduced-motion.                                                  | Упрощённые анимации без потери функционала.          |
| LMENU-10      | Story | Mobile interaction pass                         | P0       |   2 | Tap-highlight, повторный tap, зона 44px.                                               | Touch UX предсказуем, без hover-зависимости.         |
| LMENU-11      | Story | QA + visual regression checklist                | P1       |   1 | Acceptance + фиксация результата в PR.                                                 | Пункты 10.7 закрыты или оформлены дефектами.         |

---

# 🧱 **14. Статус внедрения RFC Universal Page Template (landmarks)**

## 14.1. Текущий статус

- Этап 2 (параллельный рендер) **завершён** для `module-home`, `collection-home`, `item`.
- Текущая схема для `landmarks`: `envelope + sections + page-specific renderer`.
- Production-проверка пройдена (`npm run build`, 2026-02-26).

## 14.2. Точки интеграции в коде

- `app/[lang]/landmarks/page.tsx` → `ModuleSectionsRenderer`
- `app/[lang]/landmarks/[city]/page.tsx` → `CollectionSectionsRenderer`
- `app/[lang]/landmarks/[city]/[slug]/page.tsx` → `LandmarksPage` + `ItemSectionsRenderer`
- `lib/universal-page-template/landmarks-adapters.ts` → адаптеры `legacy -> envelope`

## 14.3. Следующий шаг

- Этап 3 RFC (Wave 2): расширение validation-gates и payload-схем, затем publish workflow.

## 14.4. Прогресс Этапа 3 (текущее состояние)

Сделано (MVP, частично):

- Форма сохраняет `universal`-черновик (`workflowStatus`, `sections`, `envelopesByLocale`) без поломки legacy payload.
- Форма читает `universal.envelopesByLocale` обратно в поля с fallback на legacy-данные.
- API `/api/agent/landmark` валидирует `universal.sections` и `envelopesByLocale.*.sections` для `summary/postcard/gallery` с `400` и понятным `message`.
- API `/api/agent/landmark` валидирует envelope-level поля: `schemaVersion` (SemVer), `moduleKey`, `pageKind`, `locale`, `translationGroupId`, `meta`, `hero`, `navigation`, `mediaRefs`, `audit`.
- UI формы показывает точный текст серверной ошибки в статусе сохранения.
- Добавлен live preview в форме для `summary`, `postcard` и компактный `gallery` (до 3 элементов).
- Добавлены section-operations в UI формы: `add/remove/reorder/toggle visible`.
- `hero` выделен в отдельный блок формы и сохраняется в `envelope.hero` независимо от `sections[]`.

Остаётся в backlog:

- Полный preview pipeline для `module-home` и `collection-home`.
- Publish workflow (`draft -> review -> published -> archived`) с `audit`-гейтами.
- Полная приёмка чеклиста 15.5.

---

# 🛠️ **15. Технический чеклист Этапа 3 (MVP)**

## 15.1. Контракт формы

- [x] Перевести форму агента с плоских полей на модель `envelope + sections[]`.
- [x] Добавить операции секций: `add`, `remove`, `reorder`, `toggle visible`.
- [x] Сохранить `hero` как отдельный блок формы (вне массива секций).

## 15.2. Валидация

- [x] Подключить проверку `pageKind`, `moduleKey`, `sections[].type` по реестрам v1.1 (MVP server-side gates).
- [ ] Для каждого `sections[].type` включить валидацию `payload` (required + типы + длины строк) с field-level ошибками в UI.
- [ ] Проверять `mediaRefs` на наличие ссылок в media-реестре (или в локальном fallback-реестре на этапе MVP).
- [ ] Блокировать сохранение при критических ошибках схемы, показывать ошибки на уровне поля/секции.

## 15.3. Preview

- [x] Добавить режим предпросмотра для текущей формы: `draft envelope -> renderer`.
- [ ] Обеспечить preview для трёх pageKind в `landmarks`: `module-home`, `collection-home`, `item`.
- [ ] Гарантировать отсутствие layout shift между preview и production-рендером.

## 15.4. Публикация и статусы

- [ ] Реализовать переходы статусов: `draft -> review -> published -> archived`.
- [ ] На публикации фиксировать `audit.updatedAt` и `audit.updatedBy`.
- [ ] Для `archived` скрывать страницу из пользовательской навигации без удаления данных.

## 15.5. Минимальная приёмка Этапа 3

- [x] Агентная форма создаёт/редактирует минимум 6 секций MVP (`summary`, `highlights`, `gallery`, `facts`, `links-grid`, `cta`).
- [x] Созданный документ проходит schema-проверку (`envelope.schema.json`) без ручных правок.
- [x] Preview и фактический рендер совпадают по структуре секций и порядку.

Подтверждение (2026-02-27):

- schema-pass: `npm exec -- ajv-cli validate --spec=draft2020 --strict=false -r docs/schemas/universal-page-template-v1.1/schemas/section-types.schema.json -s docs/schemas/universal-page-template-v1.1/schemas/envelope.schema.json -d docs/schemas/universal-page-template-v1.1/examples/module-home.ru.json` и аналогично для `collection-home.ru.json`.
- regression pass: `npm run smoke:forms`, `npm run smoke:agent-ui`, `npm run build`.

---

# 📦 **16. Backlog Этапа 3 (STAGE3-01..08)**

## 16.1. Epic

- **ID:** STAGE3-EPIC-01
- **Название:** Agent Form — Envelope + Sections (MVP)
- **Цель:** Перевести форму агента на редактирование `envelope + sections[]` с schema-валидацией, preview и publish flow.
- **Приоритет:** P0
- **Оценка:** 21 SP

## 16.2. Задачи

### STAGE3-01 — Form model migration

- **Status:** Done (MVP)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** переход формы с плоских полей на модель `envelope + sections[]`.
- **DoD:** форма читает/сохраняет документ в формате envelope без потери текущих данных.

### STAGE3-02 — Section operations (CRUD + reorder)

- **Status:** Done (MVP)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** операции `add/remove/reorder/toggle visible` для секций.
- **DoD:** редактор секций полностью управляет порядком и видимостью без ручного JSON-редактирования.

### STAGE3-03 — Hero block isolation

- **Status:** Done (MVP)

- **Priority:** P1
- **Estimate:** 2 SP
- **Scope:** выделить `hero` в отдельный блок формы вне массива секций.
- **DoD:** изменение `hero` не влияет на порядок `sections[]` и корректно отражается в preview.

### STAGE3-04 — Registry validation gates

- **Status:** In Progress (MVP server-side gates done)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** проверки `moduleKey`, `pageKind`, `sections[].type` по registry v1.1.
- **DoD:** недопустимые значения блокируют сохранение и показывают понятную ошибку.

### STAGE3-05 — Payload schema validation

- **Status:** In Progress (section + envelope structural validation done, field-level schema UX pending)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** валидация `payload` по типу секции (required, типы, длины строк).
- **DoD:** ошибки в payload подсвечиваются на уровне конкретной секции/поля.

### STAGE3-06 — Live preview pipeline

- **Status:** Done (renderer parity for `module-home` / `collection-home` / `item`)

- **Priority:** P0
- **Estimate:** 3 SP
- **Scope:** `draft envelope -> renderer` preview для `module-home`, `collection-home`, `item`.
- **DoD:** preview структурно совпадает с production-рендером и не вызывает layout shift.

### STAGE3-07 — Publish workflow & audit

- **Status:** Done (API transitions + audit updates + workflowStatus UI + archived hidden in user navigation)

- **Priority:** P0
- **Estimate:** 2 SP
- **Scope:** статусы `draft -> review -> published -> archived`, фиксация `audit.updatedAt/updatedBy`.
- **DoD:** переходы статусов работают по правилам и сохраняются в документе.

### STAGE3-08 — Acceptance & regression pass

- **Status:** Done (schema-pass + regression evidence captured: smoke forms/UI + build)

- **Priority:** P1
- **Estimate:** 2 SP
- **Scope:** E2E-приёмка Этапа 3: создание/редактирование 6 MVP секций, schema-pass, preview parity.
- **DoD:** чеклист 15.5 закрыт; результаты зафиксированы в PR/handoff note.

## 16.3. Рекомендуемый порядок внедрения

- **Wave 1 (foundation):** STAGE3-01, STAGE3-02, STAGE3-03
- **Wave 2 (validation):** STAGE3-04, STAGE3-05
- **Wave 3 (experience):** STAGE3-06, STAGE3-07
- **Wave 4 (release gate):** STAGE3-08

## 16.4. Экспортные файлы

- Jira CSV: `docs/backlog-stage3-jira.csv`
- Linear Markdown: `docs/backlog-stage3-linear.md`
