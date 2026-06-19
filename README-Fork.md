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

### 13. Onboarding Simplified to PIN-Only

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js` → `startApp()`

Removed the "Last period start date", "Average cycle length", and "Period duration" input fields from the first-time setup screen. The onboarding now asks only for a 4-digit PIN.

**Why:** These fields were confusing for new users who had no data yet. They also caused conflicts when users immediately imported data from a backup or drip CSV (the imported data would be overwritten by the onboarding defaults). Users build up their data organically by logging or importing — the settings can be adjusted later from the Settings tab.

---

### 14. Empty State for Status Card

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js` → `updateStatusCard()`, `period-tracker/js/i18n.js`

When no period data has been logged, the status card now shows a large Georgian-serif message ("Start recording your period to see statistics.") in the same style as the normal "Day X of your Y-day cycle" heading. Below it, a smaller subtitle-style link reads "or import your data" — clicking it navigates directly to the Settings tab.

The cycle pills (Cycle Day / Until Next / Avg Length) show `—` dashes in the empty state. History and Predictions tables remain blank. Translated in all 6 locales.

---

### 15. Status Card Uses Predicted Date (Not Day Count)

**File:** `period-tracker/js/script.js` → `updateStatusCard()`

The period countdown in the status card subtitle was changed from "in N days" to an actual date string (e.g. "Next period expected around June 26"). This is more useful than a day count because users can plan ahead with a real date.

Two messages:
- Within 3 days: "May start today or around [date]"
- Otherwise: "Next period expected around [date]"

The date is formatted with `toLocaleDateString(getLanguage(), { month: "long", day: "numeric" })` — using the **app's chosen language**, not the OS locale. Previously `undefined` was passed, which caused Chinese date formats to appear even when the app was set to English on a Chinese-locale system.

---

### 16. Auto-fill Triggered from Modal (Not Only Save Button)

**File:** `period-tracker/js/script.js`

Auto-fill was only wired to the explicit **Save** button (`saveLog()`). On mobile, most users confirm their flow selection in the flow modal and then close the log panel without pressing Save — the auto-save path (`autoSaveSymptomSelection()`) ran but never triggered auto-fill.

**Fix:**
- Extracted a shared `applyAutoFill(dateStr, flow)` helper function
- Session guard: `autoFillDatesThisSession` Set prevents double-fill if both paths run for the same date
- Both `saveLog()` and `autoSaveSymptomSelection()` call the helper
- Banner is shown only after save/render completes (used a `didAutoFill` flag + try-catch to prevent banner errors from blocking the save)

---

### 17. Auto-fill Banner Improvements

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js`, `period-tracker/style.css`

The auto-fill notification banner was updated:
- Added a "Reminder to back up" line with **"back up"** as a clickable link that calls `exportData()` directly
- Restructured to two-row layout (`flex-wrap: wrap`, `flex: 1 1 100%` on the message) so the main message occupies its own row and the action links sit below
- Wired the backup link in JS: `backupLink.onclick = (e) => { e.preventDefault(); dismissAutoFillBanner(); exportData(); }`

---

### 18. Theme System

**Files:** `period-tracker/style.css`, `period-tracker/style-desktop.css`, `period-tracker/index.html`, `period-tracker/js/script.js`, `period-tracker/js/i18n.js`

Added four selectable colour themes. The active theme is stored in `localStorage` under `yourcyclekeeper_theme` (UI preference only — not health data, so localStorage is acceptable here).

| Key | Name | Description |
|-----|------|-------------|
| `default` | YCK Classic | Original dark-purple midnight theme |
| `light` | Newsroom Light | Black-on-warm-grey, news/planner aesthetic |
| `dark` | Newsroom Dark | Dark-slate neutral, same minimal accent |
| `kawaii` | Pink Power 🌸 | Blush-pink background, hot-pink / lavender accents |

Implemented via `[data-theme="..."]` attribute on `<html>` and CSS custom property overrides per theme block. A 2×2 swatch picker in Settings → Layout lets users switch theme — swatches use hardcoded per-swatch text colours so they remain readable regardless of the currently active theme.

**Theme-aware fixes applied:**
- `.field-input`, `.setting-save-btn` — were invisible on light cards (used hardcoded `rgba(255,255,255,...)` backgrounds); overridden per theme
- Desktop nav pills and settings/insights tab buttons — used hardcoded light-lavender colours that disappeared on light headers; overridden per theme
- Info boxes, backup status, chart select — swapped hardcoded dark-only tints to `var(--...)` values
- Legend dots on the cycle stage bar — hardcoded to `#FF3D6B / #34D399 / #F59E0B / #A78BFA` so they always match the bar regardless of theme

---

### 19. Layout Settings Tab

**Files:** `period-tracker/index.html`, `period-tracker/js/script.js`, `period-tracker/js/i18n.js`

Added a **Layout** tab to the Settings screen (between Cycle and Security), containing:
- **Calendar** section — "Show fertile window in calendar" toggle (moved from Cycle tab)
- **Theme** section — theme picker (moved from Cycle tab)
- **Language** section — language selector (moved from Cycle tab)

The Cycle tab now contains only numeric settings (period duration, prediction tolerance, auto-fill days).

Tab label translations: Layout / Apariencia / Интерфейс / Інтэрфейс / レイアウト / 介面設定

---

### 20. Post-Import Modal DOM Fix

**File:** `period-tracker/js/script.js`

After importing an encrypted backup (or changing the PIN), the flow/pain/mood buttons in the log panel appeared to do nothing — the modal would not open. Refreshing and logging back in cleared the problem.

**Root cause:** Both `_showImportPinModal` and `_renderChangePinModal` use `box.replaceChildren()` to build their custom PIN-pad UI inside the shared `#modal-overlay`. This call physically removes the static elements `#modal-icon`, `#modal-title`, `#modal-msg`, `#modal-confirm`, and `#modal-cancel` from the DOM. After the PIN modal closed, any subsequent call to `showModal()` (including the ✅ success confirmation) or to `showFlowModal()` / `showPainModal()` / `showMoodModal()` would immediately throw a null-reference error on `getElementById("modal-icon").textContent = ...` and silently bail out. A page refresh restored the HTML and the IDs with it.

**Fix:** Added `_restoreModalBox()`, which recreates the standard modal box structure (icon, title, message, cancel button, confirm button — all with their original IDs). It is called in all four exit paths where the PIN pad replaces the box:

- Import backup — cancel
- Import backup — success
- Change PIN — cancel
- Change PIN — success

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
  autoFillDays: 5,           // number of days to auto-fill after first flow day; 0 = disabled
  logs: { "YYYY-MM-DD": { flow, pain, mood, note } },
  cycleHistory: [{ start: "YYYY-MM-DD", length: N }],
}
```

`toleranceDays`, `showFertility`, and `autoFillDays` are fields added in this fork. All state initialization sites in `script.js` include them with `?? default` fallbacks for backward-compatible migration.

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
| `period-tracker/index.html` | Status card markup (import hint, empty state), Settings layout tab, Layout tab content (theme/lang/fertility moved), removed onboarding period/cycle fields, auto-fill banner backup link |
| `period-tracker/style.css` | Import hint visibility rule, onboarding scroll fix (`flex-shrink: 0`), light/kawaii theme overrides (inputs, buttons, info boxes, chart controls, nav), 4-theme variable blocks |
| `period-tracker/style-desktop.css` | Light/kawaii overrides for `.bnav-item`, `.settings-tab-btn`, `.insight-tab-btn` |
| `period-tracker/js/script.js` | `updateStatusCard()` (empty state + import hint + predicted date + app locale); `applyAutoFill()` helper; `autoSaveSymptomSelection()` triggers auto-fill; `autoFillDatesThisSession` session guard; `switchSettingsTab()` includes layout tab; `startApp()` PIN-only onboarding; auto-fill banner backup link wired; `_restoreModalBox()` fix for post-import/PIN-change modal breakage |
| `period-tracker/js/i18n.js` | New keys: `status_import_hint`, `settings_layout_tab`, `settings_calendar_display`; all 6 locales |
| `period-tracker/service-worker.js` | Cache version bumped to `v20260619h` |
| `period-tracker/js/cycles.js` | (unchanged this session) |
| `period-tracker/js/crypto.js` | (unchanged this session) |
| `period-tracker/js/periodMarking.js` | (unchanged this session) |
| `period-tracker/import-drip.html` | (unchanged this session) |
| `period-tracker/js/import-drip.js` | (unchanged this session) |
| `period-tracker/mycalendar-to-drip.html` | (unchanged this session) |
