# Validation Checklist (CI): Universal Page Template v1.1

Цель: обеспечить предсказуемую проверку `schema-pack` в CI до merge.

## 1) Что проверяем

- Синтаксис JSON во всех файлах `schemas/`, `registries/`, `examples/`.
- Валидность examples относительно JSON Schema.
- Согласованность реестров (`moduleKey`, `pageKind`, `sectionType`, alias-map, profiles).
- Базовые контрактные инварианты RFC.

## 2) Минимальные CI-артефакты

- `schemas/envelope.schema.json`
- `schemas/section-types.schema.json`
- `schemas/profile-registry.schema.json`
- `registries/module-registry.json`
- `registries/page-kind-registry.json`
- `registries/page-kind-alias-map.json`
- `registries/section-type-registry.json`
- `registries/profile-registry.json`
- `examples/module-home.ru.json`
- `examples/collection-home.ru.json`

## 3) Команды валидации схем и примеров

Из директории проекта:

`npx ajv-cli validate --spec=draft2020 -s docs/schemas/universal-page-template-v1.1/schemas/profile-registry.schema.json -d docs/schemas/universal-page-template-v1.1/registries/profile-registry.json`

`npx ajv-cli validate --spec=draft2020 -s docs/schemas/universal-page-template-v1.1/schemas/envelope.schema.json -d docs/schemas/universal-page-template-v1.1/examples/module-home.ru.json`

`npx ajv-cli validate --spec=draft2020 -s docs/schemas/universal-page-template-v1.1/schemas/envelope.schema.json -d docs/schemas/universal-page-template-v1.1/examples/collection-home.ru.json`

## 4) Cross-check правила (обязательные)

### 4.1 Реестр `pageKind`

- Все значения `pageKind` в examples и `profile-registry.json` должны входить в `globalPageKinds`.
- В `page-kind-alias-map.json` значения alias должны мапиться только в `globalPageKinds`.

### 4.2 Реестр модулей

- Все `moduleKey` из examples и профилей должны существовать в `module-registry.json`.

### 4.3 Реестр секций

- Все non-custom `sections[].type` в examples должны существовать в `section-type-registry.json`.
- Для custom-типов обязателен паттерн `^custom:[a-z0-9-]+$`.

### 4.4 Контрактные инварианты envelope

- `schemaVersion` соответствует SemVer.
- `pageId` — UUID.
- `slug` соответствует slug-pattern.
- `meta.status` входит в `draft|review|published|archived`.
- `hero` не содержит прямых URL (медиа — через `mediaRefs.hero[]`).

## 5) Exit criteria для CI

CI считается пройденным, если:

- все команды AJV возвращают exit code `0`;
- JSON parse ошибок нет;
- cross-check правила 4.1–4.4 пройдены;
- нет расхождений между registries и examples.

## 6) Рекомендация для pipeline

Референс workflow:

- `.github/workflows/validate-universal-page-template.yml`

- Выполнять этот чеклист на каждом PR, который меняет файлы внутри:
  - `docs/schemas/universal-page-template-v1.1/schemas/**`
  - `docs/schemas/universal-page-template-v1.1/registries/**`
  - `docs/schemas/universal-page-template-v1.1/examples/**`

- Блокировать merge при любом нарушении.
