# RFC: Универсальный шаблон страниц на основе «открытки»

[![Build](https://github.com/tprom/sannata-me/actions/workflows/build.yml/badge.svg)](https://github.com/tprom/sannata-me/actions/workflows/build.yml) [![Validate Universal Page Template](https://github.com/tprom/sannata-me/actions/workflows/validate-universal-page-template.yml/badge.svg)](https://github.com/tprom/sannata-me/actions/workflows/validate-universal-page-template.yml)

## Статус

- Approved v1.1
- Дата утверждения: 2026-02-26
- Область: `landmarks` + масштабирование на модули дневников
- CI: включены workflow `Build` и `Validate Universal Page Template`

### Статус внедрения (landmarks)

- Этап 2 (параллельный рендер) завершён для `module-home`, `collection-home`, `item`.
- Этап 3 (форма) завершён: Wave 1 (foundation), Wave 2 (validation), Wave 3 (STAGE3-06/07) и Wave 4 (STAGE3-08 final acceptance). Для Wave 4 зафиксированы schema-pass (`envelope.schema.json` на examples через AJV), regression smoke для форм/UI и production build.
- Текущее состояние: `envelope + sections + page-specific renderer` для всех трёх типов страниц.
- Проверка: production-сборка проходит (`npm run build`, 2026-02-27).

Точки интеграции:

- `app/[lang]/landmarks/page.tsx` → `ModuleSectionsRenderer`
- `app/[lang]/landmarks/[city]/page.tsx` → `CollectionSectionsRenderer`
- `app/[lang]/landmarks/[city]/[slug]/page.tsx` → `LandmarksPage` + `ItemSectionsRenderer`
- Адаптеры legacy → envelope: `lib/universal-page-template/landmarks-adapters.ts`

Экспорт Stage 3 backlog:

- Jira CSV: `docs/backlog-stage3-jira.csv`
- Linear Markdown: `docs/backlog-stage3-linear.md`

## Documentation Map

- RFC: `docs/rfc-universal-page-template-v1.md`
- Schema-pack: `docs/schemas/universal-page-template-v1.1/`
- Рабочий документ: `docs/v2-input.md`
- Stage 3 backlog (Jira CSV): `docs/backlog-stage3-jira.csv`
- Stage 3 backlog (Linear MD): `docs/backlog-stage3-linear.md`

## 1) Цель RFC

Сформировать единый подход, где страницы модуля, города и объекта собираются из одного шаблона секций («открытка»), а контент вводится через форму и хранится в типизированной структуре данных.

Это должно дать:

- переиспользуемый рендерер для разных модулей;
- быстрое изменение контекста страницы без переписывания UI;
- предсказуемую миграцию и валидацию контента;
- единый принцип для будущих модулей: дневник Кутти и дневник Родителей Кетти.

## 2) Базовые принципы

- Layout стабилен, контент вариативен.
- Страница = набор секций с порядком и настройками видимости.
- Форма управляет структурой секций, а не только «плоским текстом».
- Схема данных версионируется (`schemaVersion`).
- Любой модуль может расширять секции своими полями без ломки ядра.

## 3) Структура данных (ядро)

Минимальный envelope для любой страницы:

- `schemaVersion`: версия контракта в формате SemVer (`major.minor.patch`, например `1.0.0`)
- `moduleKey`: идентификатор модуля из глобального `module-registry` (`landmarks`, `diary-kutty`, `diary-parents`, ...)
- `pageKind`: нейтральный тип страницы (`module-home` | `collection-home` | `item` | `entry`)
- `pageId`: уникальный ID страницы (UUID v4, генерируется при создании и не меняется)
- `slug`: человекочитаемый URL-идентификатор страницы (required)
- `locale`: язык записи (одна запись = один язык)
- `translationGroupId`: ID группы переводов для связки локалей
- `meta`: SEO/служебные поля (`title`, `subtitle`, `tags`, `status`)
- `hero`: базовый визуальный контекст страницы (опционально)
- `sections`: массив секций в порядке рендера
- `navigation`: явная иерархия (`parentId`, `childrenIds[]`, `siblings[]?`, `breadcrumbs[]?`)
- `mediaRefs`: ссылки на медиа-ресурсы в отдельном media-реестре
- `audit`: `createdAt`, `updatedAt`, `updatedBy`

### 3.1 Идентичность и версионирование

- `schemaVersion` использует SemVer:
  - `major` — несовместимые изменения;
  - `minor` — расширения без ломки контракта;
  - `patch` — исправления без изменения структуры.
- `pageId` неизменяем и используется как первичный ключ для связей/миграций.
- `slug` используется для URL и SEO:
  - уникален в пределах `moduleKey + locale`;
  - после `published` меняется только через управляемую миграцию (с redirect-политикой на уровне маршрутизации).
- `meta.title` и `slug` независимы:
  - `meta.title` может меняться в редактуре;
  - `slug` должен оставаться стабильным и меняться только через миграцию.

### 3.2 `hero` как отдельный контекст

- `hero` — отдельный структурный блок envelope, не являющийся секцией.
- `hero` не участвует в reorder секций.
- `hero` не управляется `visible=false` из механики секций.
- `hero` не относится к `profile-registry` и задаёт базовый визуальный контекст страницы.

### 3.3 Навигационная структура

- `childrenIds[]` — упорядоченный массив, определяющий порядок отображения дочерних страниц.
- `childrenIds[]` является источником правды для порядка на уровне данных; UI может применять дополнительную сортировку только как производное представление.
- `breadcrumbs[]` — структурированный массив объектов:

```json
[
  {
    "pageId": "string",
    "title": "string",
    "slug": "string"
  }
]
```

### 3.4 Media-ссылки

- `mediaRefs` фиксируется как структурированный объект ссылок на media-реестр:

```json
{
  "hero": ["media-id-1"],
  "sections": ["media-id-2", "media-id-3"]
}
```

- Детальные медиа-метаданные хранятся только в отдельном media-реестре.
- `hero` не содержит прямых URL; медиа для hero задаются через `mediaRefs.hero[]`.

### 3.5 Реестр `pageKind` и alias-слой

- Глобальный реестр `pageKind` обязателен и является частью ядра.
- Module-specific значения допускаются только как alias, мапящиеся на глобальные типы.
- Ядро оперирует только типами: `module-home`, `collection-home`, `item`, `entry`.
- Примеры alias:
  - `city-home` → `collection-home`
  - `landmark` → `item`
  - `diary-entry` → `entry`

### 3.6 Тип секции (универсально)

Каждая секция:

- `id`: стабильный ID
- `type`: тип секции (см. MVP ниже)
- `title`: заголовок (опц.)
- `visible`: флаг показа
- `styleVariant`: вариант визуального оформления
- `payload`: объект данных секции

Уточнения:

- `sections[].id` уникален в пределах одной страницы (`pageId`), но не является глобально уникальным.
- `sections[].id` используется для diff/reorder и отслеживания изменений секции.
- `sections[].type` должен быть зарегистрирован в `sectionType-registry` (включая `custom:*` типы).

## 4) MVP-набор секций

Общий MVP для `landmarks`:

- `hero`
- `summary`
- `highlights`
- `gallery`
- `facts`
- `links-grid`
- `cta`

Рекомендованные профили по типу страницы:

- `module-home`: `hero`, `summary`, `highlights`, `links-grid`, `cta`
- `collection-home`: `hero`, `summary`, `highlights`, `links-grid`, `gallery`
- `item`: `hero`, `summary`, `gallery`, `facts`, `cta`

Примечание по обратной совместимости:

- в текущем `landmarks` допускается временный mapping: `city-home -> collection-home`, `landmark -> item`.

### 4.1 Profile-registry

- Рекомендованный порядок секций хранится в отдельном `profile-registry`, а не в контракте.
- Контракт фиксирует структуру секций и envelope.
- `profile-registry` задаёт:
  - рекомендованный порядок;
  - обязательные секции;
  - запрещённые секции;
  - визуальные варианты по `pageKind`/`moduleKey`.
- Допускаются разные профили для разных модулей при неизменном контракте ядра.

## 5) Правила формы (ввод контента)

### 5.1 Общие

- Форма работает поверх `sections[]` (добавить/удалить/переупорядочить).
- Для каждой секции есть строгая валидация payload.
- Обязательные поля по типу секции отмечаются на уровне схемы.
- Любая секция поддерживает `visible=false` вместо удаления (для быстрых переключений контекста).

### 5.2 Валидация

- Проверка типа секции и обязательных полей.
- Проверка медиа-полей (URL/путь, допустимые форматы).
- Ограничения длины текста (`title`, `summary`, `items[]`).
- Проверка ссылок навигации (цели должны существовать).
- Проверка `moduleKey` по реестру модулей.
- Проверка `pageKind` по реестру поддерживаемых типов.
- Проверка `sections[].type` по `sectionType-registry`.
- Проверка `translationGroupId` и связности локалей.
- Проверка `mediaRefs` на существование в media-реестре.

### 5.3 Публикация

- Статусы: `draft` → `review` → `published` → `archived`.
- Черновики редактируются без влияния на production.
- Публикация фиксирует `updatedAt/updatedBy` и контрольную версию.
- `archived` — мягкое скрытие: страница исключается из пользовательской навигации, но остаётся доступной для Агента, аудита и миграций.

## 6) Миграционный план

### Этап 1: Контракт

- Зафиксировать `schemaVersion=1.0.0` и типы секций MVP.
- Ввести адаптер чтения старых данных `landmarks` в новый envelope.
- Зафиксировать mapping старых `pageKind`: `city-home -> collection-home`, `landmark -> item`.

### Этап 2: Параллельный рендер

- Подключить универсальный рендерер на `module-home` и `city-home`.
- Сохранить fallback на текущий рендер до завершения валидации.

Статус: выполнено для `landmarks` (включая `item`-страницу через page-specific renderer и fallback-совместимость).

### Этап 3: Форма

- Расширить форму агента до редактирования `sections[]`.
- Добавить проверки, предпросмотр и статус публикации.

Статус: выполнено для `landmarks` (Wave 1 foundation, Wave 2 validation, Wave 3 STAGE3-06/07 и Wave 4 STAGE3-08 final acceptance закрыты; подтверждены schema-pass по примерам, regression smoke для форм/UI и production build).

### Этап 4: Перенос контента

- Мигрировать текущие страницы `landmarks` в новый формат.
- Запустить regression pass (визуал + навигация + локализация).

### Этап 5: Расширение на дневники

- Внедрить тот же envelope для:
  - `diary-kutty`
  - `diary-parents`
- Добавить дневниковые секции (ниже) без изменения ядра.

### Этап 6: Media-слой

- Ввести единый media-реестр (метаданные и статусы ресурсов).
- Оставить в секциях только ссылки/ID на медиа (`mediaRefs`, payload refs).

## 7) Расширение для дневниковых модулей

Для модулей дневников добавить типы секций поверх ядра:

- `timeline`
- `entry-card`
- `mood-strip`
- `dialogue`
- `memory-links`

Отличия механики допускаются (другая навигация/сценарии), но ввод/вывод остаётся через тот же принцип `envelope + sections + renderer`.

## 8) Критерии готовности v1

- `landmarks` module-home и city-home рендерятся из секций.
- Форма создаёт/редактирует минимум 6 MVP-секций.
- Миграция старых данных проходит без потерь контента.
- Контракт переиспользуется в одном дневниковом модуле без форка схемы.

## 9) Решения для Draft v1.1-prep

- Порядок секций: жёстко не фиксируем; есть рекомендованные профили по `pageKind`.
- `hero`: один базовый на уровне envelope; дополнительные визуальные блоки идут через секции (`gallery`, `timeline`, ...).
- Медиа: метаданные храним в отдельном media-реестре; в секциях и envelope — только ссылки/ID.
- Module-specific секции: разрешены, но только как зарегистрированные типы (например, `custom:diary-mood-strip`) со схемой payload.
- Локализация: одна запись = один язык; локали связываются через `translationGroupId`.

## 10) Решения для Draft v1.1 (утверждено)

- Глобальный реестр `pageKind` обязателен.
- Module-specific значения допускаются только как alias к глобальным типам.
- Правила рекомендованного порядка секций хранятся в `profile-registry`, а не в контракте.
- Статус `archived` вводится как мягкое скрытие страницы без удаления данных.

Итог:

- Ядро остаётся универсальным для Агента.
- Модули сохраняют семантическую выразительность через alias и профильные настройки.
- Архитектура избегает конфликтов и расползания контрактов при масштабировании.

---

Этот RFC утверждён как базовый контракт v1.1. Этап 3 для `landmarks` завершён, включая STAGE3-08 (финальная schema/UX-приёмка).

Текущий schema-pack v1.1: `docs/schemas/universal-page-template-v1.1/`.
