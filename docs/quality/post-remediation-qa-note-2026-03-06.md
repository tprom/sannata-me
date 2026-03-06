# Post-Remediation QA Note (2026-03-06)

## Scope

Validation run after completing media remediation bundles for:

- `rome/coliseum`
- `augsburg/rathaus-perlachturm`
- `munich/frauenkirche`
- `nuremberg/kaiserburg`

## Commands

```bash
npm run check:media:no-new-warnings:compact
npm run build
npm run start
```

Route smoke probes (against running prod server):

- `http://localhost:3000/en`
- `http://localhost:3000/en/landmarks`
- `http://localhost:3000/en/landmarks/rome`
- `http://localhost:3000/en/landmarks/rome/coliseum`
- `http://localhost:3000/en/books`

## Results

- `check:media:no-new-warnings:compact`: `MEDIA_INVARIANTS_OK`
- `build`: success (`Compiled successfully`, static pages `15/15`)
- Route smoke:
  - `ROUTE_OK 200 http://localhost:3000/en`
  - `ROUTE_OK 200 http://localhost:3000/en/landmarks`
  - `ROUTE_OK 200 http://localhost:3000/en/landmarks/rome`
  - `ROUTE_OK 200 http://localhost:3000/en/landmarks/rome/coliseum`
  - `ROUTE_OK 200 http://localhost:3000/en/books`

## Notes

- Production server was started for probes and then terminated.
- Local untracked `.github/workflows/` remained intentionally untouched.
