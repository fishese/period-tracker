# Task 4 Report: drip adapter → ImportPreview (+ leftovers, flow:4 token)

**Branch:** `feature/multi-app-import`  
**Commit:** `43306ab` — feat: drip adapter with leftovers and flow-4 round-trip  
**Date:** 2026-07-27

## Summary

Migrated drip CSV parsing into `import/adapters/drip.js` returning the shared `ImportPreview` shape. Unused drip fields (temperature, mucus, cervix, sex, desire) become `leftovers[]`. Flow level 4 round-trips via `bleeding.value=3` + `flow:4` note token on export/import. `import-drip.js` is now a shim; `export-drip.js` writes the token for flow 4.

## Files changed

| File | Action |
|------|--------|
| `period-tracker/js/import/adapters/drip.js` | Created — `parseDripCsvToPreview`, `buildCycleHistoryFromLogs` |
| `period-tracker/js/import/fixtures/drip-mini.csv` | Created — bleed 2/0/3 + temp leftover row |
| `period-tracker/js/import/tests/drip-adapter.test.js` | Created — 2 tests |
| `period-tracker/js/import-drip.js` | Shim — re-exports adapter + legacy `parseDripCsv` via `previewToLogs` |
| `period-tracker/js/export-drip.js` | Modified — flow 4 → bleed 3 + `flow:4` token in note |

## TDD evidence

### RED — before implementation

Command: `cd period-tracker && npm test`

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\adapters\drip.js'
✖ js\import\tests\drip-adapter.test.js
ℹ tests 10 | pass 9 | fail 1
```

### GREEN — after implementation

Command: `cd period-tracker && npm test`

```
▶ drip adapter
  ✔ maps bleeding and leftovers
  ✔ restores flow 4 from note token
▶ parseFlowPattern (2 passing)
▶ applyFlowPattern (2 passing)
▶ previewToLogs + report (1 passing)
▶ flow level 4 (4 passing)
ℹ tests 11 | pass 11 | fail 0
```

## Implementation details

- **Adapter:** Refactored CSV parse/unflatten/coerce from old `import-drip.js`; maps bleed 0→spotting, 1–3→flow, bleed 3 + `flow:4` token→flow 4 (token stripped from note).
- **Leftovers:** Non-empty temp/mucus/cervix/sex/desire fields → `temperature:36.5` style strings.
- **Periods:** Groups flow/spotting days with gap ≤2; `hasSourceFlow: true`.
- **Export:** `flowToBleed(4)` returns 3; `appendFlow4Token()` adds `flow:4` to note (deduped).
- **Shim:** `parseDripCsv` wraps `parseDripCsvToPreview` + `previewToLogs` for `script.js` / `import-drip.html` until Task 6.

## Self-review

| Check | Result |
|-------|--------|
| ImportPreview shape matches Task 3 | ✓ |
| TDD: RED → implement → GREEN | ✓ |
| No `Date.toISOString()` for day keys | ✓ |
| Legacy `parseDripCsv` preserved | ✓ |
| Commit message per brief | ✓ |

## Concerns

1. **Brief flow:4 test CSV misalignment** — template row had 2 extra commas; `flow:4` landed in `desire.value`. Test row corrected so token sits in `note.value` (column 15).
2. **Leftover key format** — uses `field:value` convention; Task 6 UI should confirm readability in import report.
3. **No export-drip unit test** — flow-4 export round-trip covered by adapter import test only; consider adding export test in Task 6.

## Review follow-up (2026-07-27)

Addressed Important findings #1–2 from task-4-review.md.

### Tests added

| Test | Coverage |
|------|----------|
| `exports flow 4 as bleed 3 with flow:4 token` | `buildDripCsv` writes `bleeding.value=3` and `note.value=flow:4` |
| `round-trips flow 4 with user note without duplicating token` | Export appends ` \| flow:4`; import restores flow 4 and strips token; re-export does not duplicate token |

### Verification

Command: `cd period-tracker && npm test`

```
▶ drip adapter (4 passing)
▶ parseFlowPattern (2 passing)
▶ applyFlowPattern (2 passing)
▶ previewToLogs + report (1 passing)
▶ flow level 4 (4 passing)
ℹ tests 13 | pass 13 | fail 0
```

**Commit:** `test: cover drip flow-4 export round-trip`
