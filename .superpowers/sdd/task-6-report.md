# Task 6 Report: In-app wizard UI + apply wiring

**Status:** Complete  
**Branch:** `feature/multi-app-import`

## Summary

Replaced the drip-only `#csv-import-overlay` with a five-step in-app wizard (source → file → review/pattern → merge-replace modal or onboarding apply → report). Settings and onboarding entry points now read **Import from another app**. No navigation to standalone converter pages; session PIN preserved throughout.

## Files changed

| File | Change |
|------|--------|
| `period-tracker/index.html` | Multi-step wizard markup; removed My Calendar→drip link |
| `period-tracker/js/script.js` | `showAppImportWizard`, adapters + import-core wiring, report export |
| `period-tracker/style.css` | Wizard steps, presets, report panel, `btn-outline` |
| `period-tracker/js/i18n.js` | `settings_import_app` + wizard strings (en; ja/zh label updates) |

## Interfaces delivered

- `showAppImportWizard({ onboarding })` — entry from Settings / onboarding
- `_lastImportReport` — in-memory report for copy / txt / csv export
- Consumes: `parseMyCalendarText`, `parseDripCsvToPreview`, `parseFlowPattern`, `applyFlowPattern`, `previewToLogs`, `buildReportText`, `buildReportCsv`, `buildCycleHistoryFromLogs`, `countPreview`

## Verification

- `node --test period-tracker/js/import/tests/*.test.js` — **15/15 pass**
- No `location` / standalone HTML navigation in import flow
- CACHE_VERSION not bumped (Task 7)
- Manual browser session test (unlock → My Calendar fixture → pattern → merge → report) **not run in this session** — recommended before deploy

## Concerns / follow-ups

- Preset click handler bound once in `setupEventListeners` (must run after DOM ready)
- Non-English locales fall back to English for new wizard strings (except ja/zh button label)
- Onboarding import finishes PIN setup on apply, then shows report (no separate success modal)
- Task 7: standalone page redirects, CACHE_VERSION bump, About/HANDOFF copy

## Commit

```
feat: in-app multi-app import wizard
```

---

## Task 6 review fix (onboarding entry guard)

**Status:** Fixed  
**Commit:** `fix: guard onboarding app-import entry with PIN check`

### Change

- Onboarding **Import from another app** now calls `importAppOnboarding()` (requires `setupPin.length >= 4`) instead of `showAppImportWizard({ onboarding: true })` directly.
- Settings button now calls `importFromAnotherApp()` for parity with the named entry-point pattern (`importData()`, etc.).
- Confirmed `window.importAppOnboarding` is exported from `script.js`.

### Tests

- `npm test` — **15/15 pass** (no CACHE_VERSION bump)
