# Media Remediation Priority

Generated: 2026-03-06T19:39:07.035Z

## Scope

- Baseline source: `docs/quality/media-warning-baseline.json`
- Total baseline warnings: **136**
- Unique landmarks affected: **4**
- Unique missing media paths: **34**

## Top Landmarks By Warning Count

- rome/coliseum: 44
- augsburg/rathaus-perlachturm: 40
- munich/frauenkirche: 32
- nuremberg/kaiserburg: 20

## Top Missing Media Paths

- /public/landmarks/augsburg/rathaus-perlachturm/illustrations/2l.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/illustrations/4r.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-01.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-02.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-03.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-04.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-05.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-06.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/images/image-07.jpg: 4
- /public/landmarks/augsburg/rathaus-perlachturm/stamp/stamp.png: 4
- /public/landmarks/munich/frauenkirche/images/image-01.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-02.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-03.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-04.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-05.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-06.jpg: 4
- /public/landmarks/munich/frauenkirche/images/image-07.jpg: 4
- /public/landmarks/munich/frauenkirche/stamp/stamp.png: 4
- /public/landmarks/nuremberg/kaiserburg/images/image-01.jpg: 4
- /public/landmarks/nuremberg/kaiserburg/images/image-02.jpg: 4

## Locale Distribution

- de: 34
- en: 34
- ru: 34
- uk: 34

## Top Cities By Warning Count

- rome: 44
- augsburg: 40
- munich: 32
- nuremberg: 20

## Suggested Remediation Order

1. Fix shared media paths that appear in all locales first (highest multiplier).
2. Close top landmark bundles end-to-end to reduce warning surface fast.
3. Regenerate and rerun `npm run check:media:no-new-warnings:compact` after each batch.

