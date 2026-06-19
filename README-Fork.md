# README — My Cycle Keeper (Fork)

This document summarises all changes made to the app across the recent development sessions, starting from the original `pythonime-lab/yourcyclekeeper` codebase and ending at `fishese/period-tracker`.

---

## About This Fork

This is a personal fork of [`pythonime-lab/yourcyclekeeper`](https://github.com/pythonime-lab/yourcyclekeeper), maintained at [`fishese/period-tracker`](https://github.com/fishese/period-tracker) for personal use.

**Why it exists:** The goal is to migrate historical data from **My Calendar** and continue tracking going forward. The drip CSV format was chosen as the go-between rather than importing from My Calendar directly — drip's column structure maps more cleanly to this app's data model.

**What was removed:** Several features from the original that aren't relevant to personal use have been stripped out.

**What was added:** The prediction logic was updated to derive the average cycle length from recorded history, similar to how drip approaches it, rather than relying on a fixed user-set value. Auto-fill for period days was added because of a tendency to forget to log mid-period — logging the first flow day automatically fills the following days with light flow. An export-to-drip-CSV function was added (accessible from Settings while logged in) so data can be migrated to another app in the future without needing to re-enter encryption credentials.

**References:** [drip](https://gitlab.com/bloodyhealth/drip) was referenced for the CSV column format, prediction logic approach, and some display elements.

> ⚠️ All coding in this fork was done via Claude Code with minimal coding experience. Use at your own risk.

---

## What Was Changed and Why

### 1. Drip CSV Import Tool

**Files:** `period-tracker/import-drip.html`, `period-tracker/js/import-drip.js`

A standalone one-time import tool for migrating historical data from the Drip period tracker app. Drip exports a CSV with columns including `Date`, `Menstruation` (spotting/light/medium/heavy), `Notes`, etc.

The import tool:
- Runs entirely in the browser with no server (drag-and-drop CSV)
- Parses Drip's menstruation column to detect flow days and infer cycle start dates
- Reconstructs `state.cycleHistory` (array of `{ start, length }`) and `state.logs` (daily flow entries)
- Encrypts the result with the user's existing PIN before writing to IndexedDB
- Does **not** overwrite existing data — prompts for confirmation first

This is a separate HTML page, not part of the main app, so it doesn't add to the main bundle.

---

### 2. Encryption Fix

**File:** `period-tracker/js/crypto.js`

The original `encryptData` used `JSON.stringify → TextEncoder → encrypt`, but on very large datasets (128+ cycles) the `btoa(String.fromCharCode(...bytes))` call hit a JavaScript call-stack limit and threw `RangeError: Maximum call stack size exceeded`.

**Fix:** Replaced the single `btoa()` call with a chunked base64 encoder (`u8ToBase64`) that processes the byte array in 8 KB slices, avoiding stack overflow on large payloads.

---

### 3. Auto-fill 5 Days on New Period Log

**File:** `period-tracker/js/script.js` → `saveLog()`

When a user marks the first day of a new period (flow logged on a day that isn't part of an existing menses episode), the app now automatically pre-fills the following 5 days with light flow (`flow: 1`). This avoids the user having to return and log each day during their period.

Rules:
- Only triggers on the **first day** of a new episode (uses `isSameMenses()` check)
- Never overwrites a day that already has flow logged
- The 5 days are filled silently — they appear as flow days on the calendar but can be individually edited or removed

---

### 4. Status Card Redesign (Drip-style)

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js` → `updateStatusCard()`, `period-tracker/style.css`

Replaced the old fertility-focused status card with a cleaner daily summary card:

| Line | Content |
|------|---------|
| Top (small) | Today's date (locale-formatted) |
| Main heading | "Day X of your Y-day cycle" |
| Subtitle | "Phase N — [Phase Name]  ·  [Period countdown]" |
| Pills (bottom) | Cycle Day / Days Until Next / Avg Length |

Phase names: Menstruation, Follicular, Fertile Window, Ovulation Day, Luteal.

Countdown messages vary: "Your period may start today", "Tomorrow", "in N days", or "Your period is here" when in Menstruation phase.

---

### 5. Insights Tab Restructure

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js`

#### Removed
- The **symptom/chart tab** was removed entirely. The canvas chart code remains in `script.js` (not deleted) but the tab button and panel are gone from the HTML. The chart functions could be re-enabled if needed.

#### Tab order (new)
1. **History** (default active)
2. **Predictions**
3. **How it Works**

#### Cycle History tab changes
- **Removed:** End date column (redundant — period duration conveys the same information)
- **Added:** Period duration column (e.g., "6d") showing actual logged flow duration (or falls back to `state.periodDuration`)
- Column grid: `5fr 2fr 3fr` (proportional — no hardcoded px widths)
- Pill colours: green (<26d), lavender (26–32d), orange/red (>32d)
- "View all" button appears below the 6-row summary

#### Predictions tab
- Shows next 6 predicted period windows (Start / End / Duration)
- Uses **statistical mean** from `getStatisticalCycleData()`, not `state.cycleLength`
- Dates in ISO `YYYY-MM-DD` format (not locale-formatted, avoids Japanese/locale issues)
- Requires at least 1 logged period start to show predictions

---

### 6. Full-Page History Overlay Fix

**Files:** `period-tracker/js/script.js` → `showHistoryFullPage()`, `period-tracker/style.css`

The original overlay had two layout bugs on Windows/desktop:

1. **Columns misaligned between header and rows** — The sticky column header was a sibling of the scrollable body div, so it had a different effective width (the body's scrollbar consumed ~17px the header didn't account for).  
   **Fix:** Moved the subheader inside the scrollable body div and made it `position: sticky; top: 0` so it scrolls with the container (and therefore has the same grid width as the rows).

2. **Body scroll causing overlay to appear offset** — The page body had horizontal overflow from somewhere in the main app layout. When the overlay opened, the body was still scrollable, and if the user scrolled right, the fixed overlay appeared shifted.  
   **Fix:** `document.body.style.overflow = 'hidden'` on open; restored to `''` on close.

The overlay CSS was also simplified from `inset: 0` (which has edge-case browser quirks) to explicit `top: 0; left: 0; width: 100%; height: 100%`.

---

### 7. Calendar Tolerance Day Styling

**File:** `period-tracker/style.css`

Two new CSS classes differentiate predicted period days from tolerance window days:

| Class | Meaning | Style |
|-------|---------|-------|
| `.predicted-period` | Future days inside the predicted period window | Dashed border + rose background fill |
| `.tolerance-period` | Days ±N days around the predicted window (uncertainty range) | Dashed border only, no fill |

Previously the tolerance days also had a rose background fill, making them visually identical to predicted period days. The fill-only-for-predicted-days approach now gives a clearer visual signal: solid fill = "likely period", ring = "might be slightly earlier/later".

---

### 8. Fertility Calendar Toggle

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js` → `toggleFertility()`, `renderCalendar()`

Added a checkbox in Settings → Cycle to show/hide the green fertile window and amber ovulation day markers on the calendar. State stored in `state.showFertility` (boolean, default `true`). When toggled off, the fertile/ovulation calendar classes are not applied and the corresponding legend items are hidden.

---

### 9. Settings Redesign

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js`

**Removed from Settings → Cycle:**
- "Last period start date" input — not needed; the app sets this automatically when flow is logged
- "Average cycle length" input — this was overriding the statistical mean calculation silently, which caused predictions to drift from reality

**Added:**
- **Period duration** — number input (1–10) with its own Save button; only affects `state.periodDuration`
- **Prediction tolerance** — number input (0–5, blank = auto) with its own Save button; overrides the automatic ±1d/±2d variation window used for the calendar tolerance band. Auto mode uses `statsData.variation` (±1d for σ < 1.5, ±2d otherwise)
- **Show fertile window** — checkbox toggle (see §8 above)

Each setting saves independently so changing one doesn't affect others.

---

### 10. `getCycleInfo()` Statistical Fix

**File:** `period-tracker/js/cycles.js`

The function previously used `state.cycleLength` directly for all phase/day calculations. But `calculatePredictions()` (used for the calendar) already used the statistical mean when ≥3 cycles were available. This meant the status card said "Day 3 of your 28-day cycle" while the calendar predicted based on a 31-day mean — they were out of sync.

**Fix:** `getCycleInfo()` now calls `getStatisticalCycleData()` at the top and uses `Math.round(statsData.mean)` when available, matching `calculatePredictions()` exactly.

---

### 11. History Date Locale Fix

**Files:** `period-tracker/js/script.js` → `buildHistoryRow()`

The history rows were using `toLocaleDateString(undefined, { ... })` which picked up the system locale (showing Japanese date formats on a Japanese-locale system). Fixed by using `c.start` directly — it's already stored as `YYYY-MM-DD` ISO string, which is unambiguous and locale-neutral.

The status card date (top of the page) still uses `toLocaleDateString` intentionally, since that's user-facing and should respect the system language.

---

### 12. My Calendar → drip Converter

**File:** `period-tracker/mycalendar-to-drip.html`

A standalone browser tool for converting a **My Calendar** period export into a **drip**-compatible CSV, which can then be imported via the drip import tool (§1 above). This is the recommended migration path: My Calendar → convert to drip CSV → import into the app.

The tool:
- Accepts a My Calendar `.txt` or `.csv` export (or pasted text) where each line contains a date and either `Period Starts` or `Period Ends`
- Lets the user set a per-day bleeding intensity pattern (e.g. `2,3,3,1`) applied across every cycle; the last value repeats if the period runs longer than the pattern
- Outputs a drip-format CSV with only the `bleeding.value` and `bleeding.exclude` columns populated — all other drip columns are left blank, so existing drip data round-trips cleanly
- Is entirely client-side — no data leaves the browser

Linked from the first step of `import-drip.html` under "Using My Calendar instead of drip?".

**Also updated** `import-drip.html`:
- Added a **← Back to Your Cycle Keeper** link at the top of the card
- Added the **Convert My Calendar to drip →** entry point in step 1

---

## Architecture Notes for Future Work

### State shape (current)

```js
state = {
  lastPeriodStart: "YYYY-MM-DD",
  cycleLength: 28,           // running average (not used for predictions when stats available)
  periodDuration: 5,
  toleranceDays: null,       // null = auto, 0-5 = manual override
  showFertility: true,
  logs: { "YYYY-MM-DD": { flow, pain, mood, note } },
  cycleHistory: [{ start: "YYYY-MM-DD", length: N }],
}
```

`toleranceDays` and `showFertility` are new fields added in this session. All 3 state initialization sites in `script.js` include them.

### `getStatisticalCycleData()` (cycles.js)

Returns `{ mean, median, min, max, stdDeviation, variation, count }` or `null` if fewer than 3 valid cycles exist. `variation` is 1 when stdDev < 1.5, 2 otherwise. This is the single source of truth for "what is my cycle length" throughout the app — both `getCycleInfo()` and `calculatePredictions()` use it.

### Prediction flow

```
getStatisticalCycleData()   →   mean cycle length (or state.cycleLength fallback)
calculatePredictions()      →   6 prediction objects { periodStart, periodEnd, variation, ... }
getDayType(dateStr)         →   "period" / "predicted-period" / "tolerance-period" / "fertile" / etc.
renderCalendar()            →   applies CSS classes based on getDayType() result
```

### Import / migration flow

Recommended path for migrating from My Calendar:

```
My Calendar export (.txt/.csv)
  → mycalendar-to-drip.html   (convert to drip CSV)
  → import-drip.html           (import drip CSV into the app)
  → index.html                 (Your Cycle Keeper, unlocked with PIN)
```

`import-drip.html` is self-contained and imports into the same IndexedDB database as the main app (same origin, same key names). `mycalendar-to-drip.html` is purely a file converter — it writes no data anywhere, only produces a downloadable CSV.

---

## Files Changed Summary

| File | What changed |
|------|-------------|
| `period-tracker/index.html` | Status card markup, tab structure (removed chart tab, added Predictions), Settings (removed last-period/avg-len, added tolerance/fertility toggle), history column labels |
| `period-tracker/style.css` | History grid columns (`5fr 2fr 3fr`), fullpage overlay structure, tolerance-period vs predicted-period classes, setting-row/setting-save-btn/field-hint styles, toggle-row styles, history legend, pred-col-labels |
| `period-tracker/js/script.js` | `updateStatusCard()`, `renderCalendar()`, `buildHistoryRow()`, `showHistoryFullPage()`, `renderPredictionsTab()`, `savePeriodDuration()`, `saveTolerance()`, `toggleFertility()`, `loadSettingsFields()`, `saveLog()` (auto-fill 5 days), `getCycleInfo()` stats fix, state shape additions |
| `period-tracker/js/cycles.js` | `getCycleInfo()` uses stats mean; `calculatePredictions()` respects `state.toleranceDays`; two-pass `getDayType()` for tolerance band |
| `period-tracker/js/crypto.js` | Chunked base64 (`u8ToBase64`) to fix stack overflow on large datasets |
| `period-tracker/js/i18n.js` | New keys: status card phrases, settings labels, history column labels, predictions tab, tolerance hint |
| `period-tracker/js/periodMarking.js` | `isSameMenses()` exported for use by auto-fill logic in script.js |
| `period-tracker/service-worker.js` | Minor cache version bump |
| `period-tracker/import-drip.html` | New — standalone drip CSV import page; updated with back link and My Calendar converter entry point |
| `period-tracker/js/import-drip.js` | New — drip CSV parser + IndexedDB import logic |
| `period-tracker/mycalendar-to-drip.html` | New — My Calendar → drip CSV converter (client-side, no data stored) |
