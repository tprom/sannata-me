# Media Remediation Execution Order (2026-03-06)

## Objective

Execute legacy media debt cleanup in descending impact order using generated landmark plans.

## Priority Queue

1. `rome/coliseum` - 44 warnings, 11 unique media paths
2. `augsburg/rathaus-perlachturm` - 40 warnings, 10 unique media paths
3. `munich/frauenkirche` - 32 warnings, 8 unique media paths
4. `nuremberg/kaiserburg` - 20 warnings, 5 unique media paths

## Plan Artifacts

- `docs/quality/media-remediation-rome-coliseum.md`
- `docs/quality/media-remediation-rome-coliseum.json`
- `docs/quality/media-remediation-augsburg-rathaus-perlachturm.md`
- `docs/quality/media-remediation-augsburg-rathaus-perlachturm.json`
- `docs/quality/media-remediation-munich-frauenkirche.md`
- `docs/quality/media-remediation-munich-frauenkirche.json`
- `docs/quality/media-remediation-nuremberg-kaiserburg.md`
- `docs/quality/media-remediation-nuremberg-kaiserburg.json`

## Execution Loop

For each landmark in queue:

1. Add or restore files listed in landmark checklist under `public/landmarks/...`.
2. Preserve exact filenames and extensions from checklist.
3. Run `npm run check:media:no-new-warnings:compact`.
4. Commit only landmark-specific media additions.

After completing all four landmarks:

1. Run `npm run check:media:update-baseline`.
2. Run `npm run check:media:no-new-warnings:compact`.
3. Update `docs/quality/media-remediation-priority.md` and `.json` via `npm run check:media:report`.

## Expected Outcome

- Legacy warning baseline shrinks to zero for current known landmarks.
- `MEDIA_WARNINGS_RESOLVED` increases from `0` toward full baseline coverage.
- No new media regressions introduced.
