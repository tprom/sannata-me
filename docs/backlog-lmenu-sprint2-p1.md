# Sprint 2 (P1): Landmark Menu polish

## Scope summary

- **Included tasks (P1):** LMENU-03, LMENU-06, LMENU-09, LMENU-11
- **Current status:** LMENU-03, LMENU-06, LMENU-09, LMENU-11 реализованы.

## Board view

### To Do

- [ ] —

### In Progress

- [ ] —

### Done

- [x] LMENU-03 — Landmark signpost geometry (2 SP)
- [x] LMENU-06 — Desktop hover states (2 SP)
- [x] LMENU-09 — Reduced motion support (1 SP)
- [x] LMENU-11 — QA + visual regression checklist (1 SP)

## QA report (LMENU-11)

- ✅ `get_errors` по `CityMenu.tsx`, `LandmarkList.tsx`, `styles.css`: ошибок нет.
- ✅ `npm run build`: успешно, TypeScript/Next build зелёный.
- ✅ Повторная проверка после обновлённого `LandmarkList.tsx`: ошибок нет.
- ℹ️ В build есть предупреждение webpack cache для `next-intl` (`import(t)`), на результат сборки не влияет.
- 📝 Ручная визуальная валидация (desktop + mobile + reduced-motion) остаётся финальным шагом при открытом `next dev`.
