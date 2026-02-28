# Backlog: Landmark Menu (Linear)

## Epic

| ID            | Type | Title                                           | Priority |  SP | Scope                                                                                  | DoD                                        |
| ------------- | ---- | ----------------------------------------------- | -------- | --: | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| LMENU-EPIC-01 | Epic | Menu UI — Wooden Signposts (Cities → Landmarks) | P0       |  21 | Реализовать зафиксированный UI-spec меню без изменения текущей механики бизнес-логики. | Epic связан со всеми задачами LMENU-01..11 |

## Stories

| ID       | Type  | Title                                   | Priority |  SP | Scope                                                           | DoD                                                  |
| -------- | ----- | --------------------------------------- | -------- | --: | --------------------------------------------------------------- | ---------------------------------------------------- |
| LMENU-01 | Story | Menu container & base layout            | P0       |   3 | Контейнер 680/620/560, внутренняя прокрутка, без layout shift.  | Внешние секции страницы не сдвигаются при раскрытии. |
| LMENU-02 | Story | City signpost geometry                  | P0       |   3 | Размеры табличек городов, базовая геометрия, pivot у крепления. | Корректные размеры и вращение от точки крепления.    |
| LMENU-03 | Story | Landmark signpost geometry              | P1       |   2 | Вторичные таблички меньшего визуального веса.                   | Чётко читается второй уровень иерархии.              |
| LMENU-04 | Story | Angle rhythm system                     | P0       |   3 | Углы 3–5°/7–10°/12–15°, не более 2 больших подряд.              | Нет хаоса углов при любом наборе городов.            |
| LMENU-05 | Story | Text handling & long labels             | P0       |   2 | Перенос строк, динамическая высота, внутренний скролл.          | Длинные названия не ломают таблички.                 |
| LMENU-06 | Story | Desktop hover states                    | P1       |   2 | Hover города и достопримечательности по spec.                   | Стабильные эффекты и корректная иерархия.            |
| LMENU-07 | Story | Click/open-close behavior (single-open) | P0       |   3 | Пружина, open/close, single-open, тайминги.                     | Одновременно открыт только один город.               |
| LMENU-08 | Story | Accessibility & keyboard                | P0       |   2 | Focus, клавиатура, контраст WCAG AA.                            | Полная keyboard-навигация и видимый focus.           |
| LMENU-09 | Story | Reduced motion support                  | P1       |   1 | Поведение для prefers-reduced-motion.                           | Упрощённые анимации без потери функционала.          |
| LMENU-10 | Story | Mobile interaction pass                 | P0       |   2 | Tap-highlight, повторный tap, зона 44px.                        | Touch UX предсказуем, без hover-зависимости.         |
| LMENU-11 | Story | QA + visual regression checklist        | P1       |   1 | Acceptance + фиксация результата в PR.                          | Пункты 10.7 закрыты или оформлены дефектами.         |

## Sprint order

- Wave 1 (foundation): LMENU-01, LMENU-02, LMENU-04, LMENU-05
- Wave 2 (interaction): LMENU-07, LMENU-06
- Wave 3 (platform quality): LMENU-10, LMENU-08, LMENU-09
- Wave 4 (release gate): LMENU-11
