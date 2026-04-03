# Session 3: GA4 + Consent + Final Audit Checklist

## 1. GA4 runtime checks

- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in production environment.
- Confirm analytics is disabled in local/dev (`NODE_ENV !== production`).
- Open production site and verify `gtag/js` request appears in Network tab.

## 2. Consent checks

- On first visit in production, consent banner is visible.
- Click "Отклонить": no `page_view` events sent.
- Click "Принять": `page_view` events are sent.
- Consent decision is persisted in localStorage key `sannata_ga_consent_v1`.

## 3. Internal traffic marker

- Configure `NEXT_PUBLIC_INTERNAL_HOSTS` with internal domains if needed.
- Verify events include parameter/user property `traffic_type`.
- In GA4 Admin create internal traffic filter based on `traffic_type = internal`.
- Validate internal traffic is excluded from standard reports.

## 4. Event contract (minimum)

- `page_view` includes: `page_location`, `page_path`, `page_title`, `traffic_type`.
- Custom events use `trackEvent(eventName, params)` from `lib/analytics/gtag.ts`.
- Keep event names stable and lowercase snake_case.

## 5. SEO + security smoke checks before release

- `/agent` and `/api/agent/*` return redirect/401 when not authorized.
- `/admin/login` is accessible and noindex headers are present.
- Service routes (`/agent`, `/admin`, `/api/agent`) are disallowed in robots.
- Security headers present: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `site.webmanifest` and favicon set load without 404.

## 6. Manual smoke regression

- Open Home, Books, Landmarks pages and verify no layout regressions.
- Confirm menu and modal interactions still work.
- Verify agent login, save forms, and upload endpoints still work after auth checks.
