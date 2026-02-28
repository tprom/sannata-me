# Next session start

Дата фиксации: 27.02.2026

**Базовый контракт:** RFC `universal-page-template` Approved v1.1 ✅

## Текущий контекст

- Этап 2 (`landmarks`): завершён (`module-home`, `collection-home`, `item`).
- Этап 3: завершён (включая STAGE3-08 `final acceptance`).
- Активный фокус: Этап 4 — перенос контента и расширенный regression pass.
- Проверка сборки: `npm run build` проходит.

## Чекпоинт на паузу

- STAGE3-08 зафиксирован как `Done` (чеклист 15.5 закрыт).
- Зафиксированы доказательства: AJV schema-pass для `module-home.ru.json` и `collection-home.ru.json`; `npm run smoke:forms`; `npm run smoke:agent-ui`; `npm run build`.
- Документация и backlog синхронизированы под статус `Done` для STAGE3-08.

## Приоритетная задача на следующую сессию

Запустить Этап 4 для `landmarks`: перенос контента и расширенный regression pass.

### Что нужно сделать

1. Подготовить план миграции текущих страниц `landmarks` в новый формат.
2. Выполнить regression pass (визуал + навигация + локализация) на мигрированных страницах.
3. Зафиксировать результаты в handoff note и backlog Этапа 4.

### Критерии готовности

- Миграционные шаги Этапа 4 зафиксированы и согласованы.
- `npm run build` проходит без новых ошибок.

## Быстрые ссылки

- RFC: `docs/rfc-universal-page-template-v1.md`
- Рабочий документ: `docs/v2-input.md` (чеклист 15.\*, backlog STAGE3-01..08)
- Schema-pack: `docs/schemas/universal-page-template-v1.1/`

## Backlog после Этапа 3

1. Этап 4: перенос контента и regression pass (визуал + навигация + локализация).
2. Этап 5: расширение envelope на дневниковые модули.
