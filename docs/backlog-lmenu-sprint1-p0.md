# Sprint 1 (P0 only): Landmark Menu

## Sprint goal

Собрать рабочий MVP меню достопримечательностей по зафиксированному UI-spec: корректный layout, геометрия указателей, базовая интерактивность раскрытия, доступность и mobile-поведение.

## Scope summary

- **Epic:** LMENU-EPIC-01
- **Included tasks (P0):** LMENU-01, LMENU-02, LMENU-04, LMENU-05, LMENU-07, LMENU-08, LMENU-10
- **Total estimate:** 18 SP
- **Excluded for this sprint (P1):** LMENU-03, LMENU-06, LMENU-09, LMENU-11

## Stories (P0)

| ID       | Title                                   |  SP | Scope                                                           | DoD                                                  |
| -------- | --------------------------------------- | --: | --------------------------------------------------------------- | ---------------------------------------------------- |
| LMENU-01 | Menu container & base layout            |   3 | Контейнер 680/620/560, внутренняя прокрутка, без layout shift.  | Внешние секции страницы не сдвигаются при раскрытии. |
| LMENU-02 | City signpost geometry                  |   3 | Размеры табличек городов, базовая геометрия, pivot у крепления. | Корректные размеры и вращение от точки крепления.    |
| LMENU-04 | Angle rhythm system                     |   3 | Углы 3–5°/7–10°/12–15°, не более 2 больших подряд.              | Нет хаоса углов при любом наборе городов.            |
| LMENU-05 | Text handling & long labels             |   2 | Перенос строк, динамическая высота, внутренний скролл.          | Длинные названия не ломают таблички.                 |
| LMENU-07 | Click/open-close behavior (single-open) |   3 | Пружина, open/close, single-open, тайминги.                     | Одновременно открыт только один город.               |
| LMENU-08 | Accessibility & keyboard                |   2 | Focus, клавиатура, контраст WCAG AA.                            | Полная keyboard-навигация и видимый focus.           |
| LMENU-10 | Mobile interaction pass                 |   2 | Tap-highlight, повторный tap, зона 44px.                        | Touch UX предсказуем, без hover-зависимости.         |

## Recommended execution order

1. LMENU-01 → LMENU-02 → LMENU-04
2. LMENU-05 → LMENU-07
3. LMENU-08 → LMENU-10

## Sprint acceptance gate

- Все задачи P0 закрыты по DoD.
- Нет внешнего layout shift при раскрытии/сворачивании.
- На desktop, keyboard-only и mobile поведение соответствует разделу 9 в spec.

## Board view (Sprint 1)

### To Do

- [ ] —

### In Progress

- [ ] —

### Done

- [x] LMENU-01 — Menu container & base layout (3 SP)
- [x] LMENU-02 — City signpost geometry (3 SP)
- [x] LMENU-04 — Angle rhythm system (3 SP)
- [x] LMENU-05 — Text handling & long labels (2 SP)
- [x] LMENU-07 — Click/open-close behavior (single-open) (3 SP)
- [x] LMENU-08 — Accessibility & keyboard (2 SP)
- [x] LMENU-10 — Mobile interaction pass (2 SP)

## Board update rule

- Перемещать задачу между колонками только целиком (ID + название + SP).
- Задача попадает в `Done` только после соответствия её DoD из секции `Stories (P0)`.
