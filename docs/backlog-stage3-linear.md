# Stage 3 Backlog (Linear)

## Epic

- ID: STAGE3-EPIC-01
- Title: Agent Form — Envelope + Sections (MVP)
- Priority: P0
- Estimate: 21 SP
- Goal: Перевести форму агента на редактирование `envelope + sections[]` с schema-валидацией, preview и publish flow.

## Stories

| ID        | Type  | Title                               | Status                                                                       | Priority |  SP | Scope                                                                                     | DoD                                                                                        |
| --------- | ----- | ----------------------------------- | ---------------------------------------------------------------------------- | -------- | --: | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| STAGE3-01 | Story | Form model migration                | Done (MVP)                                                                   | P0       |   3 | Переход формы с плоских полей на модель `envelope + sections[]`.                          | Форма читает/сохраняет документ в формате envelope без потери текущих данных.              |
| STAGE3-02 | Story | Section operations (CRUD + reorder) | Done (MVP)                                                                   | P0       |   3 | Операции `add/remove/reorder/toggle visible` для секций.                                  | Редактор секций полностью управляет порядком и видимостью без ручного JSON-редактирования. |
| STAGE3-03 | Story | Hero block isolation                | Done (MVP)                                                                   | P1       |   2 | Выделить `hero` в отдельный блок формы вне массива секций.                                | Изменение `hero` не влияет на порядок `sections[]` и корректно отражается в preview.       |
| STAGE3-04 | Story | Registry validation gates           | In Progress (MVP server-side gates done)                                     | P0       |   3 | Проверки `moduleKey`, `pageKind`, `sections[].type` по registry v1.1.                     | Недопустимые значения блокируют сохранение и показывают понятную ошибку.                   |
| STAGE3-05 | Story | Payload schema validation           | In Progress (section + envelope structural validation done)                  | P0       |   3 | Валидация `payload` по типу секции (`required`, типы, длины строк).                       | Ошибки payload подсвечиваются на уровне конкретной секции/поля.                            |
| STAGE3-06 | Story | Live preview pipeline               | Done (renderer parity for module/collection/item)                            | P0       |   3 | Preview `draft envelope -> renderer` для `module-home`, `collection-home`, `item`.        | Preview структурно совпадает с production-рендером и не вызывает layout shift.             |
| STAGE3-07 | Story | Publish workflow & audit            | Done (transitions + audit + UI + archived nav filtering)                     | P0       |   2 | Статусы `draft -> review -> published -> archived`, фиксация `audit.updatedAt/updatedBy`. | Переходы статусов работают по правилам и сохраняются в документе.                          |
| STAGE3-08 | Story | Acceptance & regression pass        | Done (checklist 15.5 closed; schema-pass via AJV examples; smoke forms/UI + build passed) | P1       |   2 | E2E-приёмка Этапа 3: 6 MVP секций, schema-pass, preview parity.                           | Чеклист 15.5 закрыт; результаты зафиксированы в handoff note и рабочих документах.         |

## Suggested Waves

- Wave 1 (foundation): STAGE3-01, STAGE3-02, STAGE3-03
- Wave 2 (validation): STAGE3-04, STAGE3-05
- Wave 3 (experience): STAGE3-06, STAGE3-07
- Wave 4 (release gate): STAGE3-08
