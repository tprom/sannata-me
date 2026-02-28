# Release Note: Меню модуля достопримечательностей

## Версия

- **Дата:** 25.02.2026
- **Область:** UI меню `landmarks` (Cities → Landmarks)
- **Статус:** P0 + P1 завершены

## Что реализовано

- Деревянная модель меню на уровне UI: столб + указатели городов + вторичные таблички достопримечательностей.
- Фиксированный контейнер меню с внутренней прокруткой без внешнего layout shift.
- Геометрия указателей городов: размерные ограничения, точка крепления, наклон по ритму.
- Геометрия табличек достопримечательностей: второй визуальный уровень, меньшая масса, малые углы.
- Поведение раскрытия: `single-open`, повторный клик закрывает активный город.
- Длинные названия: перенос, ограничение по высоте, внутренний скролл.
- Доступность: `focus-visible`, клавиатура (`Tab`, `Enter`, `Space`, `Esc`).
- Mobile: `tap-highlight`, упрощённые анимации для touch.
- `prefers-reduced-motion`: отключение sway/spring, сохранение функционала.

## Технические изменения

- Обновлён компонент меню городов: [components/modules/landmarks/CityMenu.tsx](components/modules/landmarks/CityMenu.tsx)
- Обновлён список достопримечательностей: [components/modules/landmarks/LandmarkList.tsx](components/modules/landmarks/LandmarkList.tsx)
- Обновлены стили модуля: [components/modules/landmarks/styles.css](components/modules/landmarks/styles.css)
- Добавлены и актуализированы sprint-доски:
  - [docs/backlog-lmenu-sprint1-p0.md](docs/backlog-lmenu-sprint1-p0.md)
  - [docs/backlog-lmenu-sprint2-p1.md](docs/backlog-lmenu-sprint2-p1.md)

## QA статус

- ✅ Проверка проблем в изменённых файлах (`get_errors`): ошибок нет.
- ✅ Production build: `npm run build` — успешно.
- ℹ️ Зафиксировано non-blocking предупреждение webpack cache в `next-intl` (`import(t)`), на результат сборки не влияет.
- 📝 Рекомендуется финальная ручная визуальная проверка в `next dev` для desktop/mobile/reduced-motion.

## Известные ограничения

- Механика модуля на уровне главных страниц пока не расширялась сверх согласованного объёма меню.
- Визуальная доводка может продолжаться точечными правками токенов/текстур без изменения базовой логики.

## Рекомендации к следующему шагу

- Зафиксировать короткий визуальный review (3 скриншота: desktop, mobile, reduced-motion).
- После review перевести задачу меню в release-ready в общем roadmap модуля.
- Использовать чеклист handoff: `docs/landmarks-menu-handoff-checklist.md`.
- QA-отчёт оформлять по шаблону: `docs/landmarks-menu-qa-note-template.md`.
- Пример заполненного QA-отчёта: `docs/landmarks-menu-qa-note-2026-02-25.md`.
