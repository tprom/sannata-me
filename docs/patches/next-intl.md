# next-intl dynamic import warning (temporary patch)

Дата: 2026-03-05

Кратко

При сборке проекта (`next build`) может появляться повторяющееся предупреждение от webpack, связанное с файлом `next-intl`:

Parsing of node_modules/next-intl/dist/esm/production/extractor/format/index.js for build dependencies failed at 'import(t)'. Build dependencies behind this expression are ignored and might cause incorrect cache invalidation.

Причина

Скомпилированный файл `dist/esm/production/extractor/format/index.js` использует динамический импорт с переменной (`await import(t)`), что мешает статическому анализу зависимостей в webpack.

Локальный (временный) фикс

- Скрипт: `scripts/patch-next-intl.js` — идемпотентный Node-скрипт, который ищет `await import(t)` и заменяет на `await import(/* webpackIgnore: true */ t)` в файле `node_modules/next-intl/dist/esm/production/extractor/format/index.js`.
- Триггер: `postinstall` в `package.json` запускает этот скрипт автоматически после `npm install`.
- Почему: добавление `/* webpackIgnore: true */` запрещает webpack пытаться анализировать и резолвить этот динамический import на этапе сборки, устраняя предупреждение.

Как откатить

- Удалить `postinstall` из `package.json` и/или файл `scripts/patch-next-intl.js`.
- Затем восстановить оригинальный файл в `node_modules` (например, удалить `node_modules/next-intl` и выполнить `npm install`), либо откатить изменения в версии пакета.

Рекомендации

- Долгосрочно: дождаться фикса в upstream (`amannn/next-intl`) и удалить локальный патч.
- Со стороны проекта: оставить `postinstall` как временное решение и добавить заметку в `README` (короткая ссылка на этот документ).

Issue шаблон (готовый текст для открытия issue в next-intl)

Title: Webpack parsing warnings from dynamic `import(t)` in extractor/format/index.js

Repository: amannn/next-intl

Body:

Steps to reproduce

1. Use `next` with `next-intl` in a Next.js project.
2. Run `npm run build` (or `next build`).

Observed

- During the build you may see repeated warnings like:

  Parsing of node_modules/next-intl/dist/esm/production/extractor/format/index.js for build dependencies failed at 'import(t)'. Build dependencies behind this expression are ignored and might cause incorrect cache invalidation.

Expected

- No parser warnings from the compiled extractor when running a normal Next.js build.

Notes / Investigation

- The compiled file `dist/esm/production/extractor/format/index.js` uses a runtime variable in a dynamic import (`await import(t)`), which causes webpack's dependency parsing to fail when it scans files for build dependencies.
- A local workaround is to add the `/* webpackIgnore: true */` comment to the dynamic import (e.g. `await import(/* webpackIgnore: true */ t)`), which prevents webpack from attempting to resolve the import at build-time.

Suggested fix

- Consider changing the build output so that webpack won't try to statically analyze that dynamic import (for example, by adding a `/* webpackIgnore: true */` comment on that import in the compiled output, or by providing a mapping that webpack can understand at build time).

Environment

- `next-intl` version: (see package.json in consumer project)
- Node/npm: (see consumer environment)

Attached logs

- Example warning lines and the relevant file path: `dist/esm/production/extractor/format/index.js`.

Additional context

- This issue was observed while using `next@^15` and `next-intl@~4.x` in a Next.js app where `next build` reported the parser warnings. A temporary workaround is to patch the compiled file in `node_modules` or to run a `postinstall` script that applies the webpackIgnore comment; however an upstream fix is preferred.
