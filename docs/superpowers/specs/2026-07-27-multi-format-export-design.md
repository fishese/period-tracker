# Multi-format export redesign

**Date:** 2026-07-27  
**Status:** Approved for planning  
**App:** My Cycle Keeper (`period-tracker/`)  
**Related:** Import design — `docs/superpowers/specs/2026-07-27-multi-app-import-design.md`

## Problem

Export today is drip-only (`Export to drip CSV`). Users also want a simple spreadsheet-friendly dump of period context and daily symptoms. My Calendar’s `.txt` doctor extract is **one-way** (proprietary app backup is not this format), so we must not offer a false “export back to My Calendar” path.

## Goals

- One in-app **Export to another app** flow (Settings), mirroring the import wizard’s source-picker pattern
- Export to **drip CSV** and **plain CSV** now, with a clear extension point for more formats later
- Plain CSV rows include period context when applicable: `period_start, period_end, date, flow, pain, mood, notes`
- Session-safe: no navigation away / full reload during export
- Keep encrypted `.bin` backup export as a separate control

## Non-goals

- My Calendar `.txt` / proprietary backup export
- Excel `.xlsx` generation (plain CSV is enough; opens in Excel)
- Uploading exports to Google Drive
- Changing import My Calendar mood label mapping for Low/Neutral/Happy (that was only for a cancelled My Calendar export round-trip)
- Rescaling existing flow values

## Approach

**Export adapters + one wizard** (same architecture family as multi-app import).

```
Pick format (drip | Plain CSV | …later) → Download → Done
```

---

## Architecture

### Modules

| Module | Role |
|--------|------|
| `js/export/adapters/drip.js` | Move/wrap current `buildDripCsv` from `export-drip.js` |
| `js/export/adapters/plain-csv.js` | Build plain CSV string from `state.logs` |
| `js/export/export-core.js` | Period ranges from flow logs, filename helpers, download blob |
| UI overlay + `script.js` wiring | Settings entry; format picker; download |

Future formats: add `js/export/adapters/<name>.js` and a picker entry.

### Period detection (shared)

Derive period start/end from logged **flow** days using the same gap rule as import cycle rebuild (`buildCycleHistoryFromLogs`: consecutive flow with gap ≤ 2 days). Spotting alone does not open a period.

### Session safety

- Never set `location` / never full-reload during export
- Overlay-only UI; stay unlocked after download

---

## Wizard UX

### Entry

- Settings → Security: replace **Export to drip CSV** with **Export to another app**
- Encrypted backup export button unchanged
- Not required on onboarding

### Steps

1. **Pick format** — drip | Plain CSV (one-line hint each)
2. **Download** — generate and trigger download immediately (read-only; no pattern/merge step)
3. **Confirm** — toast or brief “Downloaded …” then close / Done

### Filenames

Local calendar date (via `toISO(new Date())`), not `Date.toISOString()`:

- `mycyclekeeper-drip-YYYY-MM-DD.csv`
- `mycyclekeeper-plain-YYYY-MM-DD.csv`

### Empty state

If there are no exportable log days (no flow, spotting, pain, mood, or non-empty note), show a modal and do not download.

---

## Format mapping

### drip

Preserve current `buildDripCsv` behavior:

| App | drip |
|-----|------|
| flow 1–3 | `bleeding.value` 1–3 |
| flow 4 | `bleeding.value` 3 + `flow:4` token in `note.value` |
| spotting | `bleeding.value` 0 |
| pain | existing boolean flags + numeric `pain.note` |
| mood | existing boolean flags + numeric `mood.note` |
| note | `note.value` (with flow:4 token rules as today) |

Rows newest-first (existing drip convention).

### Plain CSV

**Header (exact):**

```text
period_start,period_end,date,flow,pain,mood,notes
```

**Rows:** one per log day that has at least one of: flow, spotting, pain, mood, non-empty note.

| Column | Value |
|--------|--------|
| `period_start` / `period_end` | ISO dates if `date` falls inside a detected flow period; else empty |
| `date` | ISO `YYYY-MM-DD` |
| `flow` | empty, `spotting`, or `1`–`4` |
| `pain` | numeric string or empty |
| `mood` | numeric string or empty |
| `notes` | raw note text, RFC-4180 escaped |

Sort **oldest → newest** (readable in sheets).

Include non-period log days (pain/mood/note outside a period) with blank period columns.

---

## Error handling

- Empty dataset → modal; no file
- Download/blob failure → toast or modal; session unchanged
- Unknown format id in picker → ignore / no-op

## Testing (acceptance)

- drip export matches prior behavior for flow 1–3, spotting, pain, mood; flow 4 still emits bleed 3 + token
- Plain CSV header exact; period columns set for in-period days; blank for out-of-period log days
- Spotting-only days: `flow=spotting`; do not create a period by themselves
- Empty logs → no download + message
- Export while unlocked never forces lock screen / navigation
- Filenames use local `YYYY-MM-DD`
- Adding a stub third adapter later only requires picker + one module (smoke by code structure)

## Migration / cleanup

- Remove/replace Settings **Export to drip CSV** label with **Export to another app**
- Thin re-export shim from `export-drip.js` if other callers remain during migration
- i18n for new strings; bump `CACHE_VERSION` when shipping
- Update HANDOFF export section

## Open follow-ups

- Additional app formats when a real open export exists
- Optional Excel `.xlsx` if a zero-dependency need appears later
- Optional My Calendar doctor-extract generator (explicitly separate from “export to app”) if desired later
