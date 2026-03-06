# Legacy to Target Mapping (v1)

Статус: draft
Дата: 2026-03-05

## 1. Module Home

| Legacy source                                         | Target field/path                               | Правило трансформации                        |
| ----------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `agent/forms/module-home-form.md:greetingRu/En/De/Uk` | `home.{locale}.json: hero.headline`             | Берется по локали                            |
| `stampImage`                                          | `hero.image` + `mediaRefs.hero[]`               | Нормализация в public path                   |
| `content{Locale}`                                     | `sections[].payload` (`summary/highlights/...`) | Разбор текста по выбранной стратегии         |
| `illustration1L..3R`                                  | `sections[].payload` media refs                 | Перевод в структурные ссылки, без line-index |
| `closingText{Locale}`                                 | `cta.text` или `summary/highlights` по профилю  | Нормализация по profile-registry             |
| `module-home-block` (custom type)                     | стандартные section types                       | Миграция типа секции обязательна             |

## 2. Collection Home (City)

| Legacy source                                           | Target field/path                                         | Правило трансформации         |
| ------------------------------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `data/landmarks/{city}/data.json: pageContent.greeting` | `home.{locale}.json hero/meta/sections`                   | По локали, через merge        |
| `pageContent.description`                               | `sections.summary.description` или `postcard.contentFile` | По утвержденному профилю      |
| `pageContent.illustrations[]`                           | structured illustration model                             | Сохранение параметров вставки |
| `pageContent.invitation`                                | `cta.text`                                                | По локали                     |
| `meta.title/subtitle`                                   | `meta.title/meta.subtitle`                                | Без потерь                    |

## 3. Landmark Item

| Legacy source                      | Target field/path                        | Правило трансформации                     |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------- |
| `view.{locale}.json.greeting`      | `sections[postcard].payload.greeting`    | 1:1                                       |
| `view.{locale}.json.stampImage`    | `sections[postcard].payload.stampImage`  | Нормализация путей                        |
| `view.{locale}.json.contentFile`   | `sections[postcard].payload.contentFile` | Сохранение маркеров иллюстраций           |
| `view.{locale}.json.footer`        | `sections[postcard].payload.footer`      | 1:1                                       |
| `data.json.postcardGraphics.*`     | marker injection inputs                  | Используется только для fallback/миграции |
| `agent/backend/landmark-data.json` | исключается                              | Это временный файл, не target-source      |

## 4. Compatibility Rules

1. До окончания миграции чтение legacy допускается только через explicit adapter.
2. После миграции adapter остается read-only fallback на ограниченный период.
3. Новые записи выполняются только в target canonical files.

## 5. Data Quality Flags

Обязательные флаги отчета миграции:

- `missingLocale`
- `invalidMediaPath`
- `unknownSectionType`
- `outOfRangeParagraph`
- `droppedLegacyField`
