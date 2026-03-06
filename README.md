# sannata-me

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
- CI guide: `docs/ci.md`
- CI troubleshooting (`smoke:writers`): `docs/ci.md#troubleshooting-smokewriters-failures`
- Рабочий документ: `docs/v2-input.md`
- Stage 3 backlog (Jira CSV): `docs/backlog-stage3-jira.csv`
- Stage 3 backlog (Linear MD): `docs/backlog-stage3-linear.md`

## Orchestrator

- Запуск оркестратора:

  `npm run orchestrator -- <path-to-data.json> <languages>`

- Пример:

  `npm run orchestrator -- data/landmarks/rome/coliseum/data.json ru,en,de,uk`

- Примечание: для запуска `.ts` используется `tsx`, поэтому не нужно вызывать `node scripts/run-orchestrator.ts` напрямую.

### Частые ошибки

- `input path is required`

  Причина: не передан путь к `data.json`.

  Как исправить:

  `npm run orchestrator -- data/landmarks/rome/coliseum/data.json ru,en,de,uk`

- Некорректный список языков

  Поддерживаются только: `ru,en,de,uk`.

  Пример корректного формата:

  `ru,en,de,uk`

## SubNP Health Check

- Быстрый health-check провайдера SubNP:

  `npm run health:subnp`

- Скрипт делает один запрос с `prompt="health check"` и ждёт SSE-статус `complete` или `error`.

- Вывод:
  - `OK` — провайдер ответил `status=complete` с `imageUrl`.
  - `FAIL` — ошибка API/сети/таймаута или `status=error`.

- Опциональный таймаут (в миллисекундах):

  PowerShell:

  `$env:SUBNP_HEALTH_TIMEOUT_MS="15000"; npm run health:subnp`

  cmd:

  `set SUBNP_HEALTH_TIMEOUT_MS=15000 && npm run health:subnp`

  bash:

  `SUBNP_HEALTH_TIMEOUT_MS=15000 npm run health:subnp`

### Troubleshooting (`FAIL`)

- Таймаут SSE (медленный ответ API): увеличьте `SUBNP_HEALTH_TIMEOUT_MS` и повторите запуск.

- Сетевая недоступность/блокировка домена: проверьте доступ к endpoint.

  PowerShell:

  `Invoke-WebRequest https://subnp.com/api/free/generate -Method Head`

  Если `HEAD` не поддерживается, используйте короткий `POST`-пробник:

  PowerShell:

  `Invoke-RestMethod https://subnp.com/api/free/generate -Method Post -ContentType "application/json" -Body '{"prompt":"health check","model":"turbo"}'`

- Ошибка со стороны SubNP (`status=error`): повторите health-check позже (возможны временные сбои бесплатного API).

## Gallery Pipeline Mode (Current Default)

- Текущий безопасный дефолт: реальные фотографии без генерации.
  - `IMAGE_GALLERY_MODE=legacy`
  - `IMAGE_PROVIDER_PRIMARY=manual`
  - `IMAGE_PROVIDER_FALLBACK=manual`

- Это сделано для стабильной работы портала, пока бесплатные провайдеры нестабильны.

- Временно включить генерацию (для теста):

  PowerShell:

  `$env:IMAGE_GALLERY_MODE="generated"; $env:IMAGE_PROVIDER_PRIMARY="subnp"; $env:IMAGE_PROVIDER_FALLBACK="pollinations,manual"; npm run dev`

  cmd:

  `set IMAGE_GALLERY_MODE=generated && set IMAGE_PROVIDER_PRIMARY=subnp && set IMAGE_PROVIDER_FALLBACK=pollinations,manual && npm run dev`

  bash:

  `IMAGE_GALLERY_MODE=generated IMAGE_PROVIDER_PRIMARY=subnp IMAGE_PROVIDER_FALLBACK=pollinations,manual npm run dev`

- Быстрый возврат к безопасному режиму:

  PowerShell:

  `$env:IMAGE_GALLERY_MODE="legacy"; $env:IMAGE_PROVIDER_PRIMARY="manual"; $env:IMAGE_PROVIDER_FALLBACK="manual"; npm run dev`

  cmd:

  `set IMAGE_GALLERY_MODE=legacy && set IMAGE_PROVIDER_PRIMARY=manual && set IMAGE_PROVIDER_FALLBACK=manual && npm run dev`

  bash:

  `IMAGE_GALLERY_MODE=legacy IMAGE_PROVIDER_PRIMARY=manual IMAGE_PROVIDER_FALLBACK=manual npm run dev`

## Agent UI Smoke

- Быстрый e2e smoke для реальной админ-панели агента:

  `npm run smoke:agent-ui`

- Что проверяется:
  - открывается страница `/ru/agent`;
  - кнопка “Создать / обновить город” переключает панель в city-form режим (`#form-select`);
  - кнопка “Создать достопримечательность” показывает поле выбора `input[list="agent-landmark-options"]`.

- Поведение по умолчанию:
  - скрипт сам поднимает `next dev` на свободном порту (начиная с `3101`);
  - после завершения теста dev-сервер останавливается автоматически.

- Полезные переменные:
  - `SMOKE_AGENT_UI_BASE_URL` — использовать уже запущенный сервер (например, `http://localhost:3000`);
  - `SMOKE_AGENT_UI_PORT` — стартовый порт для автопоиска, если сервер поднимает сам smoke.

- Типичные причины падения:
  - не установлен браузер Playwright:

    `npx playwright install`

  - при падении сохраняется скриншот `tmp-smoke-agent-ui-failure.png` в корне проекта;
  - лог старта dev-сервера печатается между `DEV_SERVER_LOG_TAIL_START` и `DEV_SERVER_LOG_TAIL_END`.

---

Temporary patch for `next-intl` dynamic import warning — details: `docs/patches/next-intl.md`.
