# Universal Page Template — Schema Pack v1.1

[![Build](https://github.com/tprom/sannata-me/actions/workflows/build.yml/badge.svg)](https://github.com/tprom/sannata-me/actions/workflows/build.yml) [![Validate Universal Page Template](https://github.com/tprom/sannata-me/actions/workflows/validate-universal-page-template.yml/badge.svg)](https://github.com/tprom/sannata-me/actions/workflows/validate-universal-page-template.yml)

## Статус

- Базовый контракт: RFC `universal-page-template` Approved v1.1 (2026-02-26)
- Область: `landmarks` + масштабирование на модули дневников
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

Этот пакет фиксирует машинно-проверяемый контракт RFC для универсального шаблона страниц.

## Состав

- `schemas/envelope.schema.json` — основная схема страницы (envelope)
- `schemas/section-types.schema.json` — типы секций и payload-контракты
- `schemas/profile-registry.schema.json` — схема профилей порядка/ограничений секций
- `registries/module-registry.json` — реестр модулей
- `registries/page-kind-registry.json` — глобальный реестр `pageKind`
- `registries/page-kind-alias-map.json` — alias-мэппинг доменных названий
- `registries/section-type-registry.json` — реестр поддержанных типов секций
- `registries/profile-registry.json` — профильные правила рендера/валидации
- `examples/module-home.ru.json` — пример документа (`module-home`)
- `examples/collection-home.ru.json` — пример документа (`collection-home`)
- `VALIDATION-CHECKLIST.md` — пошаговый чеклист проверки schema-pack для CI

## Базовые правила v1.1

- `schemaVersion`: SemVer
- `pageId`: UUID v4, неизменяемый
- `slug`: стабилен после `published`, изменяется только через миграцию
- `pageKind`: только из глобального реестра (`module-home`, `collection-home`, `item`, `entry`)
- module-specific названия допустимы только через alias-map
- `hero` — отдельный блок envelope, не секция
- `sections[].id` уникален в пределах страницы
- `sections[].type` должен быть из `sectionType-registry` (или `custom:*`)
- `childrenIds[]` — источник правды для порядка дочерних страниц
- все медиа задаются через `mediaRefs` и/или section payload refs, без прямых URL в `hero`

## Примечание

Схемы рассчитаны на JSON Schema Draft 2020-12.
