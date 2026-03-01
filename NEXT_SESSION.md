# Next session start

Дата фиксации: 01.03.2026

**Базовый контракт:** RFC `universal-page-template` Approved v1.1 ✅

## Текущий контекст

- Этап 2 (`landmarks`): завершён (`module-home`, `collection-home`, `item`).
- Этап 3: завершён (включая STAGE3-08 `final acceptance` — подтверждено сегодня).
- Активный фокус: Этап 4 — перенос контента и расширенный regression pass.
- Проверка сборки: `npm run build` проходит ✅

## Чекпоинт на сегодня (01.03.2026)

- **STAGE3-08: ПОЛНОСТЬЮ ЗАКРЫТ** (чеклист 15.5 = Done).
- **Доказательства schema-pass/parity переподтверждены:**
  - ✅ AJV schema-pass: `module-home.ru.json` — valid
  - ✅ AJV schema-pass: `collection-home.ru.json` — valid
  - ✅ Regression smoke:forms: все 3 теста (city-form-valid, landmark-form-valid, landmark-form-invalid-city) пройдены
  - ✅ Regression smoke:agent-ui: оба теста пройдены
  - ✅ Production build: скомпилирован успешно (all pages, chunks, middleware)
- Документация и backlog синхронизированы под статус `Done`.

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
