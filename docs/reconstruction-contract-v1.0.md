# Reconstruction Contract v1.0 (Landmarks)

Статус: proposed-for-approval
Дата: 2026-03-05
Scope: `module-home`, `collection-home`, `item`

## 1. Назначение

Этот документ фиксирует единый контракт данных и правила записи/чтения для реконструкции портала в рамках Sprint 0.

## 2. Единые правила

1. Канонический формат страницы: `UniversalPageEnvelope`.
2. Одна запись = одна локаль (`ru|en|de|uk`).
3. Связка локалей через `translationGroupId`.
4. Запись данных только через validated writer.
5. Merge локалей обязателен: запись одной локали не может удалять соседние.

## 3. Канонические файлы (target)

## 3.1 Module Home

- Page kind: `module-home`
- Canonical read/write:
  - `app/landmarks/data/home.ru.json`
  - `app/landmarks/data/home.en.json`
  - `app/landmarks/data/home.de.json`
  - `app/landmarks/data/home.uk.json`

## 3.2 Collection Home (City Page)

- Page kind: `collection-home`
- Canonical read/write:
  - `data/landmarks/{citySlug}/home.ru.json`
  - `data/landmarks/{citySlug}/home.en.json`
  - `data/landmarks/{citySlug}/home.de.json`
  - `data/landmarks/{citySlug}/home.uk.json`

Примечание:

- `data/landmarks/{citySlug}/data.json` допускается как совместимый вспомогательный слой на переходный период, но не как source-of-truth после завершения реконструкции.

## 3.3 Landmark Item

- Page kind: `item`
- Canonical read/write:
  - `data/landmarks/{citySlug}/{landmarkSlug}.ru.json`
  - `data/landmarks/{citySlug}/{landmarkSlug}.en.json`
  - `data/landmarks/{citySlug}/{landmarkSlug}.de.json`
  - `data/landmarks/{citySlug}/{landmarkSlug}.uk.json`

Примечание:

- `view.{lang}.json` и `data.json` внутри landmark-каталога считаются legacy-input на период миграции.

## 4. Минимальные payload-правила

## 4.1 `module-home`

- Использует универсальные секции (`summary`, `highlights`, `links-grid`, `cta`) и `hero`.
- Запрещены временные типы секций, не зарегистрированные в `section-type-registry`.

## 4.2 `collection-home`

- Обязательные данные в `hero/meta` + контентные секции.
- `description` допускает встроенные иллюстрации через маркеры или структурную модель (см. раздел 6).

## 4.3 `item`

- Обязательная секция `postcard` с полями:
  - `greeting`
  - `stampImage`
  - `contentFile`
  - `footer`
- Дополнительные секции: `summary`, `gallery`, `facts`.

## 5. Правила идентификации

1. `cityId` хранится в реестре городов.
2. `citySlug` используется в роутинге и файловых путях.
3. Mapping `cityId -> citySlug` выполняется сервером перед записью страницы.
4. Создание города из landmark-формы запрещено.

## 6. Алгоритм сборки встроенного текста (v1)

Target модель иллюстрации:

- `image`
- `insert.where`: `before|after`
- `insert.paragraph`: `1..N`
- `position`: `left|right|center`
- `wrap`: boolean
- `shadow`: boolean
- `border`: boolean
- `rotate`: `-10..10`
- `anchor?`: string

Правила сборки:

1. Базовый текст разбивается на абзацы.
2. Для каждой иллюстрации определяется целевой абзац и позиция вставки.
3. Итоговый `contentFile` формируется детерминированно по сортировке:
   - paragraph asc
   - where: `before` перед `after`
   - index asc
4. Если абзац вне диапазона, иллюстрация попадает в конец документа и маркируется warning в отчете сохранения.

## 7. API-инварианты

1. Любой POST проходит schema validation.
2. Ошибка валидации возвращает причину и поле.
3. Writer не должен записывать файлы вне canonical path.
4. Любая запись обновляет `audit.updatedAt` и `audit.updatedBy`.

## 8. Критерии приемки контракта

1. Все 3 страницных типа имеют canonical read/write paths.
2. Все формы могут собрать payload в рамках контрактных правил.
3. Есть стратегия backward compatibility для legacy файлов.
4. Контракт принят как source-of-truth для Sprint 1.
