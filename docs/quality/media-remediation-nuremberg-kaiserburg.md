# Media Remediation Plan: nuremberg/kaiserburg

Generated: 2026-03-06T19:46:05.906Z

## Summary

- Baseline source: `docs/quality/media-warning-baseline.json`
- Landmark: `nuremberg/kaiserburg`
- Total warnings for landmark: **20**
- Unique missing media paths: **5**

## Locale Breakdown

- de: 5
- en: 5
- ru: 5
- uk: 5

## Source Files

- data/landmarks/nuremberg/kaiserburg.de.json
- data/landmarks/nuremberg/kaiserburg.en.json
- data/landmarks/nuremberg/kaiserburg.ru.json
- data/landmarks/nuremberg/kaiserburg.uk.json

## Missing Media Checklist

- [ ] /public/landmarks/nuremberg/kaiserburg/images/image-01.jpg (refs: 4; locales: de, en, ru, uk)
- [ ] /public/landmarks/nuremberg/kaiserburg/images/image-02.jpg (refs: 4; locales: de, en, ru, uk)
- [ ] /public/landmarks/nuremberg/kaiserburg/images/image-03.jpg (refs: 4; locales: de, en, ru, uk)
- [ ] /public/landmarks/nuremberg/kaiserburg/images/image-04.jpg (refs: 4; locales: de, en, ru, uk)
- [ ] /public/landmarks/nuremberg/kaiserburg/stamp/stamp.png (refs: 4; locales: de, en, ru, uk)

## Execution Notes

1. Add or restore missing files in `public/...` paths listed above.
2. Keep filename and extension exactly as referenced.
3. Re-run `npm run check:media:no-new-warnings:compact` after each batch.
4. When all items are done, refresh baseline with `npm run check:media:update-baseline`.

