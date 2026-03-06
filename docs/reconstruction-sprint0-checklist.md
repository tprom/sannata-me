# Sprint 0 Checklist (Preparation)

Цель: подготовить безопасный старт реконструкции без ломающих изменений.

## A. Contract Freeze

- [ ] Зафиксирован контракт `module-home` (v1)
- [ ] Зафиксирован контракт `collection-home` (v1)
- [ ] Зафиксирован контракт `item` (v1)
- [ ] Зафиксированы правила merge локалей (`ru/en/de/uk`)
- [ ] Зафиксирован алгоритм встраивания иллюстраций

## B. Canonical Paths

- [ ] Для каждой страницы определен canonical source file
- [ ] Для каждой формы определен canonical write path
- [ ] Для каждого рендера определен canonical read path
- [ ] Удалены/помечены временные промежуточные файлы как non-canonical

## C. Validation Layer

- [ ] Согласован формат JSON schema для 3 страниц
- [ ] Определены mandatory/optional поля
- [ ] Определены правила backward compatibility

## D. Migration Readiness

- [ ] Таблица mapping legacy -> new готова
- [ ] Выбраны pilot-наборы: 3 города, 3 landmark-объекта
- [ ] Определен dry-run формат отчета
- [ ] Подготовлен rollback чеклист

## E. Baseline QA

- [ ] Базовый smoke сценарий для `/[lang]/landmarks`
- [ ] Базовый smoke сценарий для `/[lang]/landmarks/[city]`
- [ ] Базовый smoke сценарий для `/[lang]/landmarks/[city]/[slug]`
- [ ] Зафиксированы текущие known issues (до реконструкции)

## Exit Criteria Sprint 0

- [ ] Контракт утвержден
- [ ] Пути чтения/записи утверждены
- [ ] Migration strategy утверждена
- [ ] Можно переходить к Sprint 1 backend work
