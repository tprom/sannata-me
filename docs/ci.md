# CI Workflows

This document describes the current CI behavior for `sannata-me`.

## Active Workflows

- `Build` -> `.github/workflows/build.yml`
- `Validate Universal Page Template v1.1` -> `.github/workflows/validate-universal-page-template.yml`

## Build Workflow

### Trigger

- `pull_request`
- `push` to `main`
- `workflow_dispatch`

### Security / Runtime Controls

- `permissions: contents: read`
- `concurrency` enabled:
  - `group: ${{ github.workflow }}-${{ github.ref }}`
  - `cancel-in-progress: true`

### Jobs

1. `changes`

- Purpose: detect writer-related diffs via `dorny/paths-filter@v3`
- Timeout: `5` minutes
- Output: `writers` (`true` / `false`)

2. `build`

- Purpose: full app build
- Timeout: `20` minutes
- Commands:
  - `npm ci`
  - `npm run build`
- Adds a step summary in Actions UI

3. `smoke-writers`

- Purpose: writer runtime smoke suite
- Timeout: `20` minutes
- Depends on: `changes`, `build`
- Condition:
  - always for `workflow_dispatch`
  - for `push`/`pull_request` only if `changes.outputs.writers == 'true'`
- Command:
  - `npm run smoke:writers`
- Adds a step summary in Actions UI

### Writer-Related Path Filter

`smoke-writers` is enabled when any of these paths change:

- `app/api/agent/landmark/**`
- `app/api/agent/forms/collection-home/**`
- `app/api/agent/forms/module-home/**`
- `agent/backend/cities-registry.js`
- `agent/backend/collection-home-form-processor.ts`
- `agent/backend/module-home-form-processor.ts`
- `agent/forms/collection-home-form.md`
- `agent/forms/module-home-form.md`
- `scripts/smoke-*.ts`
- `scripts/smoke-writers.ts`
- `data/landmarks/**`
- `app/landmarks/data/**`
- `package.json`
- `package-lock.json`
- `.github/workflows/build.yml`

## Universal Template Validation Workflow

### Trigger

- `pull_request` with schema-pack path filter
- `workflow_dispatch`

### Security / Runtime Controls

- `permissions: contents: read`
- `concurrency` enabled:
  - `group: ${{ github.workflow }}-${{ github.ref }}`
  - `cancel-in-progress: true`
- Timeout: `15` minutes

### Checks

- AJV validation for:
  - `profile-registry.json`
  - `module-home.ru.json`
  - `collection-home.ru.json`
- Cross-check script verifies:
  - pageKind consistency
  - module registry consistency
  - section type consistency
  - envelope invariants (`schemaVersion`, UUID v4 `pageId`, `slug`, `meta.status`, hero constraints)
- Adds a step summary in Actions UI

## Local Commands (Parity with CI)

- Build:
  - `npm run build`

- Writer smokes:
  - `npm run smoke:landmark-writer`
  - `npm run smoke:collection-home-writer`
  - `npm run smoke:module-home-writer`
  - `npm run smoke:writers`

<a id="troubleshooting-smokewriters-failures"></a>

## Troubleshooting: `smoke:writers` Failures

Use this quick flow when `smoke-writers` fails in CI.

1. Identify the failed sub-suite in logs

- In job logs, find markers:
  - `SMOKE_WRITERS_RUNNING scripts\\smoke-landmark-writer.ts`
  - `SMOKE_WRITERS_RUNNING scripts\\smoke-collection-home-writer.ts`
  - `SMOKE_WRITERS_RUNNING scripts\\smoke-module-home-writer.ts`
- Then inspect the JSON block between:
  - `SMOKE_*_START`
  - `SMOKE_*_END`

2. Reproduce locally exactly

- Full suite:
  - `npm run smoke:writers`
- Single suite:
  - `npm run smoke:landmark-writer`
  - `npm run smoke:collection-home-writer`
  - `npm run smoke:module-home-writer`

3. Common failure patterns

- `status=400` in mismatch checks:
  - expected only for conflict case (`cityId` vs `citySlug` mismatch).
- `status=404` / `fetch failed`:
  - transient dev-server startup issue; rerun once before deeper debugging.
- merge/restore assertion failed:
  - inspect affected data files under `data/landmarks/**` and `app/landmarks/data/**`.

4. Fast local sanity before rerun

- `npm run build`
- `npm run smoke:writers`

If both pass locally and CI still flakes once, re-run failed jobs in GitHub Actions.
