# My Cycle Keeper — Handoff Document

**Last updated:** 2026-07-30 (app flattened to repo root; Pages at /period-tracker/)<br>
**Maintainer:** Personal fork (fishese)  
**Status:** Stable for personal use. Latest on `period-tracker/master`. Come back in a new chat with the prompt in §13.

This document is the **current source of truth** for continuing work. Older implementation history remains available in Git; verify historical notes against current code for predictions, storage keys, fertility defaults, and branding.

**Current `CACHE_VERSION`:** `v20260801d` (in `service-worker.js`)

---

## 1. What this project is

| Item | Detail |
|------|--------|
| **This fork** | **My Cycle Keeper** — personal period-tracking PWA |
| **Upstream** | [**Your Cycle Keeper**](https://github.com/pythonime-lab/yourcyclekeeper) by pythonime-lab (GPL v3, open source) |
| **This repo** | [`fishese/period-tracker`](https://github.com/fishese/period-tracker) on GitHub |
| **App path** | Repo root (GitHub Pages serves as `/period-tracker/`) |
| **Stack** | Vanilla JS ES modules, no build step, IndexedDB + AES-256-GCM, Service Worker |
| **Privacy** | Zero server data; no backend. Google Drive backup (optional) talks to Google APIs from the browser only |

**Live URL (this fork):** https://period.fishese.cc/

**Why the fork exists:** Migrate history from **My Calendar** or **drip** directly into this app; continue tracking with rolling predictions, auto-fill, and optional export to **drip** or **plain CSV** (My Calendar export is not offered).

**Branding rule:** UI and product name = **My Cycle Keeper**. Attribution / support for the original = **Your Cycle Keeper** / `pythonime-lab` (GitHub link only — PayPal donate removed to avoid payment confusion).

---

## 2. Repository layout

```
fishese/period-tracker/           # GitHub repo (GitHub Pages) — app at repo root
├── index.html
├── js/
├── style.css
├── service-worker.js
├── manifest.json
├── icons/
├── docs/
│   ├── HANDOFF.md
│   ├── google-drive-sync-plan.md
│   └── superpowers/              # design specs / plans
├── drive-oauth-proxy/            # Cloudflare Worker (Client secret)
├── README.md
├── LICENSE.txt
└── CLAUDE.md
```

**Pages URL:** `https://period.fishese.cc/` (custom domain; app files live at the repo root).

---

## 3. Development & deployment

### Deploy (GitHub Pages)

**Live app:** https://period.fishese.cc/

Push to `period-tracker` remote **`master`** (not `origin`, not `main`):

```bash
git push period-tracker master
# or, after tracking is set: git push
```

Typo `masterx` will fail with “src refspec does not match any”.

Root `firebase.json`, upstream marketing site, and Firebase hosting are **removed** — not used for this fork (GitHub Pages only).

### Local dev (required for SW + Web Crypto)

```bash
# from repo root
python -m http.server 8000
# Open: http://localhost:8000/
# NOT file://
```

Note: serve from repo root locally (`http://localhost:8000/`). OAuth redirect URIs must include `https://period.fishese.cc/` and localhost (see `js/drive-config.example.js`).

### Pre-deploy checklist

1. Bump `CACHE_VERSION` in `service-worker.js` (see value at top of this doc)
2. Test offline: DevTools → Network → Offline → reload
3. Push to GitHub (`period-tracker` remote)
4. Confirm GitHub Pages build succeeded (Jekyll is disabled via `.nojekyll` + `_config.yml` exclude for `docs/`)
5. Hard-refresh or unregister the Service Worker after deploy

### Git remotes

| Remote | URL | Purpose |
|--------|-----|---------|
| `period-tracker` | `https://github.com/fishese/period-tracker.git` | **Push fork work here** (`master`) → GitHub Pages |
| `origin` | `https://github.com/pythonime-lab/yourcyclekeeper.git` | Upstream (do not force-push) |

### Fonts

- Body UI: system sans (`Segoe UI`, `system-ui`, …) — **not** DM Sans (removed; CSP blocks Google Fonts)
- Display headings: `LunaDisplay` `@font-face` currently maps to **local Georgia / Times New Roman** (no font file shipped)

### `.gitignore`

- `.claude/` — local Cursor/Claude IDE config

---

## 4. Storage & encryption

### IndexedDB

| Key | Purpose |
|-----|---------|
| DB name: `mycyclekeeper` | Database |
| `mycyclekeeper_enc_v1` | Encrypted state blob |
| `mycyclekeeper_salt_v1` | PBKDF2 salt |
| `mycyclekeeper_ph_v1` | PIN HMAC (fast wrong-PIN check) |
| `mycyclekeeper_lastbackup_v1` | ISO date of last manual export |
| `mycyclekeeper_theme` | Theme preference — one of `default` / `light` / `dark` / `kawaii` / `custom` (localStorage, not encrypted) |
| `mycyclekeeper_custom_theme_v1` | Custom theme preset the user chose to keep (localStorage, not encrypted) |
| `mycyclekeeper_custom_theme_draft_v1` | Custom theme colours currently applied, so the panel survives theme switches and reloads (localStorage, not encrypted) |
| `mycyclekeeper_drive_*` | Google Drive OAuth tokens, file id, last sync, auto-backup flag (see [`google-drive-sync-plan.md`](./google-drive-sync-plan.md)) |

**Settings → “Storage used”** shows `navigator.storage.estimate()` for the **whole origin** (IndexedDB + Service Worker cache + localStorage), not the size of cycle logs alone. Mobile PWA often reports much higher numbers than desktop because of offline cache.

**IndexedDB loader:** `indexeddb-storage.js` is a **classic script** (`defer`, before `script.js` module). Do not convert it to ES-module-only without updating `index.html` — mixed cache broke startup in Jul 2026.

**Deletes:** `deleteFromDB()` waits for `transaction.oncomplete` (not just `request.onsuccess`) so Drive disconnect can verify the refresh token is gone.

**Migration note:** Keys renamed from `yourcyclekeeper_*`. Old encrypted blobs are not auto-migrated — re-onboard + re-import CSV/backup.

### State shape (current)

```javascript
state = {
  lastPeriodStart: "YYYY-MM-DD" | null,
  cycleLength: 28,              // synced from rolling mean when history exists
  periodDuration: 5,            // synced from rolling flow duration when logs exist
  toleranceDays: null,          // null = auto (±1/±2 from stats), 0–5 manual
  autoFillDays: null,           // null = auto from logs; 0 = off; 1–10 = days ahead (not including start day)
  showFertility: false,         // default OFF — fertility-specific calendar/status/stats content
  showCyclePhases: true,        // default ON — independent cycle phase timeline setting
  logs: { "YYYY-MM-DD": { flow?, spotting?, flowEstimated?, pain?, mood?, note? } },
  cycleHistory: [{ start, length }],
}
```

- `flow` (1–3) is a real period day and counts toward cycle-length/period-duration stats.
- `spotting: true` is tracked separately (UI or drip CSV `bleeding.value === 0`) — calendar uses the hollow `flow-0` ring (not a period day) and is **excluded** from `flow`-based cycle/period calculations so it doesn't skew predictions. Round-trips back to drip's `bleeding.value=0` on export.
- `flowEstimated: true` marks light-flow days created by auto-fill. The day editor identifies these until the user confirms or changes the flow.
- `pain: 0` means explicitly **no pain**; a missing `pain` property means pain was not recorded. Never use truthy checks for pain.

`setState()` in `cycles.js` / `periodMarking.js` holds a **reference** — never pass copies.

---

## 5. Prediction & cycle logic (`cycles.js`)

### Rolling window (6 months)

| Function | Use |
|----------|-----|
| `getRollingStatisticalCycleData()` | Predictions — mean cycle length from completed cycles in last 6 months |
| `getOverallStatisticalCycleData()` | Insights — all-time stats |
| `getCompletedCycles(hist)` | History **except** the last (open) cycle |
| `recalculateCycleLength(hist)` | Writes rolling mean → `state.cycleLength` |
| `getPredictionCycleLength()` | Rounded rolling mean for anchor walking |
| `getPredictionPeriodDuration()` | Rolling mean of logged period lengths |
| `recalculatePeriodDuration()` | Writes → `state.periodDuration` |

### Shift & spread flags

- **Shift:** Cycle differs from 6-mo mean by **>3 days**
- **Spread caution:** Shortest vs longest **>7 days**
- **Spread irregular:** **>9 days** (Cleveland Clinic)

### Prediction window variation

`buildStatisticalData()` derives the predicted-period highlight padding from the **real rolling std-deviation** (`Math.round(stdDeviation)`, clamped 1–5 days) instead of the old binary 1-or-2-day flag. Manual override still available via `state.toleranceDays` (0–5, Settings).

### Anchor walking

`getCurrentCycleAnchor()` walks from `lastPeriodStart` using **rolling average** cycle length (not last irregular cycle alone).

### Cycle history advancement (`updateCycleHistory()` in `script.js`)

Every new flow day that isn't "same menses" (1-day gap tolerance, `isSameMenses()`) now **always** advances to a new cycle entry and moves `lastPeriodStart` forward — including gaps outside the "valid" 15–59 day range. Only the *length value* used in rolling/overall stats is filtered by `isValidCycleLength()` (in `cycles.js`); the episode itself is always recorded. (Previously, a gap >59 or <15 days was silently dropped entirely, leaving `lastPeriodStart` stale forever — long/irregular cycles would permanently break late-period detection and predictions until the user reset something.)

- **Manual override:** log panel has a "This is a new period, not a continuation" checkbox (`#log-force-new-cycle`) to bypass the gap-tolerance heuristic when it misclassifies (e.g. spotting a couple days before real flow). The row (`#log-new-cycle-row`/`#log-new-cycle-hint`) is only shown when `isSameMenses(dateStr)` is true — i.e. only when there's actually a period day 1–2 days prior, so the option doesn't show up (confusingly, doing nothing) for an obviously-new cycle after weeks with no periods.
- **Recovery tool:** Settings → Cycle → "Recalculate Cycle History" rebuilds `cycleHistory` + `lastPeriodStart` from scratch using `rebuildCycleHistoryFromLogs()` (safe — doesn't touch logs).

### Late period UX

When bleeding ended, no new period logged, and today is past expected start:

- Title: “Your period is N days late” (`status_period_late_*`)
- Subtitle: expected start date (`status_period_expected_on`)
- Status phase line uses `status_phase_line` (fully i18n’d)

### Calendar day types

| Type | Meaning | Style |
|------|---------|-------|
| `period` | Logged flow | Solid rose |
| `predicted-period` | Predicted, **not logged** | Dashed (past or future) |
| `fertile` / `ovulation` | Rhythm method | Only if `showFertility === true` |

### History “In progress”

Only while **actively bleeding** (`isPeriodEpisodeActive`).

---

## 6. UI surfaces

| Area | Notes |
|------|--------|
| Calendar tab | Status → **calendar** → **timeline bar** (bar under calendar); tapping a day opens the compact accordion editor |
| Insights | Recent period profile with adaptive flow/pain/mood tracks; the six recent History rows combine dates, duration, cycle length, and a compact daily flow/pain/mood SVG chart / Predictions / How it works |
| Settings Layout | Fertility estimates + cycle phase timeline toggles → **Language** → Theme (incl. **Customize** colour panel) |
| About → Developer | Combined About (no PayPal); separate **About This Fork** summary |
| zh-TW terminology | 經期 / 月經 (not 生理期 / 生理) |

### Calendar flow colours

Every flow level shares one two-colour gradient, so heavier flow reads as more of the same colour rather than a new one. Each built-in theme provides a palette suited to its background; Customize can override either endpoint.

| Theme | `--flow-start-rgb` (light / outer) | `--flow-end-rgb` (heavy / core) | `--flow-text` |
|-------|------------------------------------|----------------------------------|---------------|
| YCK Classic | `213 149 255` / `#d595ff` | `197 52 246` / `#c534f6` | Dark ink |
| Newsroom Light | `245 96 97` / `#f56061` | `216 45 45` / `#d82d2d` | White |
| Newsroom Dark | `92 151 217` / `#5c97d9` | `24 71 172` / `#1847ac` | White |
| Pink Power | `255 142 195` / `#ff8ec3` | `255 74 147` / `#ff4a93` | Dark ink |

`--flow-text` is the ink for filled flow days and is auto-picked for custom themes.

- `.cal-day.flow-1` → `.flow-3` use a gradual blend (small digit-sized core → wider core → soft outer ring). `.flow-4` keeps a sharp solid core (~86 %) with a thin outer rim.
- Spotting (`.flow-0`) is a solid `--flow-end` ring over a low-opacity fill of the same colour.
- `.predicted-period` uses a 2 px dotted `--flow-end` ring; `.tolerance-period` (the padding days) uses a 1 px dotted `--flow-start` ring and a fainter fill, so real predictions still lead.
- `getDayType()` now returns **`tolerance-period`** for the variation padding instead of `predicted-period`. Both still satisfy `dayType.includes("period")`, which is what the insights aggregates rely on.
- The derived `--flow-*` variables are declared for `:root, [data-theme]` because a custom property inherits its already-substituted value; re-declaring them wherever the triplets are overridden is required.

### Theme customizer

Settings → Layout → Theme has a fifth option, **Customize**, which opens an inline panel.

- Selecting it snapshots whatever palette is currently on screen (read through a hidden probe element, so any `rgb(var(…))` or `color-mix()` value resolves to plain hex). This applies whether the current theme is built-in or already customized; there is no separate “Start from” control.
- The panel edits 11 colours. Each swatch opens one shared saturation/brightness gradient with a hue slider; the adjacent hex field remains editable for exact values. Reusing one picker keeps the DOM and event work small.
- `applyCustomThemeColors()` derives `--bg2`, `--bg3`, `--border`, `--rose-pale`, `--deep-purple`, `--coral`, `--amber`, `--danger`, `--success`, `--status-card-bg`, the theme-aware navigation tokens, and `--flow-text` from those colours and writes everything as inline variables on `:root`.
- `data-theme` stays on the chosen **base** theme so its light/dark-specific rules (inputs, tab bars) keep working; `data-theme-custom="on"` marks that inline overrides are active. Leaving Customize calls `clearCustomThemeVars()`, which removes every property in `CUSTOM_THEME_APPLIED_PROPS`.
- Two storage keys: a **draft** (auto-saved on every edit, survives switching themes) and one explicitly **saved preset** (Save preset / Load saved preset). *Reset to theme colours* reloads the built-in theme captured when Customize was opened.

### Fertility and timeline toggles

- **Show fertility estimates** defaults to `false`. It controls fertile/ovulation calendar highlights, explicitly fertile status wording, and the **Fertile Days** insight. When it is off but cycle phases remain on, the status may still name **Follicular / Ovulation / Luteal** without saying the user is fertile.
- **Show cycle phase timeline** defaults to `true` and is independent of fertility estimates. On, the timeline and status show **Menstrual / Follicular / Ovulation / Luteal**; off, the timeline shows a neutral **Period / Other cycle days** view and the status omits phase names except **Menstrual** while a period is active.
- Existing encrypted state without `showCyclePhases` migrates to `true`.

### Cycle history

- Compact dates use two-digit years (for example, `Jun 4–Jun 9, ’26`). Japanese and Traditional Chinese month/day labels have no inserted space and include `日` (for example, `6月4日–6月9日, ’26`).
- History columns: Dates \| Period \| Cycle \| Daily pattern. The daily pattern is a compact, theme-safe SVG with flow bars plus overlaid pain and mood lines; its own `var(--bg2)` background keeps it readable across themes.
- Both the recent-six table and full-history overlay use the same chart component and aligned four-column grid.
- Footer row: “Showing last N of M cycles” + small **share icon** (mailto, last 6 periods as plain text) + **print icon** (`printCycleSummary()`)
- `shareRecentPeriodHistory()` in `script.js` intentionally shares dates/durations only; it does not include flow, pain, mood, symptoms, or notes.

### Daily log editor

- Mobile-first, vertically compact accordion rows for **Flow / Pain / Mood / Note**. Selecting a value autosaves; each row has an explicit **Clear**, and a saved day has an explicit **Delete entry** action.
- Flow drops sit beside the Flow label; flow supports spotting/light/medium/heavy in the UI while only light/medium/heavy count as period days.
- Pain supports `0–10` in `0.5` increments. `0` is an explicit **No pain** record and is distinct from an absent pain field.
- Existing logs remain readable through normalizers: numeric flow/pain/mood, legacy `flow: true`, legacy numeric/boolean `headache`, and legacy `mood-happy` / `mood-low`.
- Auto-fill runs only when flow is newly added to a date that starts a new period (or the user explicitly forces a new cycle). Editing pain, mood, or notes on an existing period day cannot trigger it.
- Auto-filled future light-flow days carry `flowEstimated: true` until the user confirms or changes them.

### Print cycle summary (doctor-visit friendly)

- `printCycleSummary()` / `buildPrintSummaryContent()` in `script.js`, print icon next to the share icon on the History tab footer row.
- Builds a hidden `#print-summary` element (direct child of `<body>`), then `window.print()`. `@media print` in `style.css` hides everything else (`body > *:not(.print-summary)`) and forces black-on-white regardless of active theme.
- Privacy prompt defaults to dates/durations only on every print. Two independent opt-ins can add symptom summaries and/or daily notes. The medical disclaimer appears when symptoms are included.

### Symptom chart

- Code kept in `script.js`; UI disabled in `init()` on purpose
- Re-enable: restore HTML + uncomment `initializePainChartControls()`

### Status / i18n

- Status subtitle: `status_phase_line` with `{num}`, `{phase}`, `{detail}`
- Late strings + status date line use app language
- Rolling avg label: `avg_length_rolling` (zh-TW 近期平均, ja 直近平均, es Prom. 6 m)

---

## 7. Import / export

```
Settings or onboarding → Import from another app (in-app wizard)
  1. Pick source (My Calendar | drip)
  2. Choose file (.txt / .csv)
  3. Review + flow pattern (levels 1–4; overwrite vs fill-gaps when source flow exists)
  4. Apply (onboarding: initial load; in-app: Merge vs Replace)
  5. Import report (short result; extras + copy/export only when needed)

Settings → Export to another app (in-app wizard)
  1. Pick format (drip | Plain CSV)
  2. Download CSV (local ISO date in filename)
  Empty state when no logged days to export
```

- Entry: **Settings → Import from another app** or onboarding import — same five-step overlay (`showAppImportWizard()`). Encrypted `.bin` backup import stays separate.
- Entry: **Settings → Export to another app** — format picker overlay (`showAppExportWizard()`). Session stays unlocked; wizard closes on lock.
- **Export formats:** **drip** (drip-compatible CSV for re-import into drip) and **Plain CSV** (spreadsheet layout: date, flow, pain, mood, note). **My Calendar export is not offered** — import only.
- Standalone `mycalendar-to-drip.html` and `import-drip.html` are retired (short message + link back to the app only; no auto-redirect).
- **Flow level 4 (Very heavy):** stored as `log.flow = 4`; drip export writes `bleeding.value=3` plus a `flow:4` note token; drip import recognizes the token without rescaling levels 1–3.
- **Flow pattern:** always shown on review. Levels `1–4`; `0` = spotting. Presets include `2,3,3,1`, `1,2,3,2,1`, `2`, `3`, `1,1,1,1,1`. Hint text: if the pattern is longer than a period, extra days are ignored; if shorter, the last level repeats. When periods lack source flow and the field is empty, apply defaults to `1` (light) and prefills the input. When source flow exists (`M > 0`), choose **Overwrite** vs **Only fill periods with no flow**.
- **Import report:** one result line — `Imported {days} period days across {periods} cycles.` If unmapped moods or leftovers remain, show a short note that those details aren’t tracked yet (listed below for copy/export or notes later), then the lists. Copy / Export `.txt` / `.csv` appear only when extras exist (full leftover strings; not stored in encrypted state). Truncated day notes (500) may still be written into imported logs.
- Encrypted backup: `.bin` (`mycyclekeeper_backup_*.bin`)
- Plain CSV export includes flow days and spotting-only days; spotting appears as `flow=spotting` (not a period day, so period columns stay blank). drip export round-trips spotting as `bleeding.value=0`.
- drip `bleeding.value === 0` (spotting) imports as `log.spotting = true`, **not** `log.flow` — see §4 State shape. Export round-trips it back to `bleeding.value=0`.
- Future-date cutoff uses `toISO(new Date())` (local date) — was previously `Date.toISOString()` (UTC), which could wrongly drop "today"'s rows near midnight in timezones ahead of UTC.
- Non-onboarding import offers **Merge** (keep existing logs on date collisions) vs **Replace** (imported data wins). Onboarding import has nothing to merge with, so it's just an initial load.

---

## 8. Work completed (July 2026)

### Core (earlier in session → `3a1c889` / related)

1. Rolling 6-month predictions + dual Insights stats  
2. Late-period messaging; predicted vs logged calendar styling  
3. Period duration from logs; history “In progress” fix  
4. Two-step onboarding + in-app CSV import  
5. `mycyclekeeper_*` storage keys; fork branding  
6. Fertility toggle scoped correctly (`6ee0144`)

### Evening UX polish (this closure)

7. Timeline moved under calendar  
8. Compact history date ranges + mailto share icon on count row  
9. Status messages fully i18n’d (`status_phase_line`, late strings)  
10. Layout: Language above Theme  
11. About: remove donate; merge support copy; refresh fork summary  
12. zh-TW 經期／月經 terminology  
13. Drop unused **DM Sans** reference → system sans stack  
14. SW cache bump `v20260708b`

### Bug-fix + feature session (this closure, `v20260708d`)

**Bugs fixed:**

1. `updateCycleHistory()` no longer silently drops cycles with a gap outside 15–59 days — `lastPeriodStart` always advances now (see §5). This was the most impactful fix: long/irregular cycle gaps used to permanently desync predictions and late-period detection.
2. `parseDripCsv()` future-date cutoff switched from `Date.toISOString()` (UTC) to `toISO(new Date())` (local) — matches the project's own date-handling rule and fixes a timezone-dependent CSV-import edge case.
3. Fertile-window math (`getFertileWindowOffsets()` in `cycles.js`) clamped so `fertileEnd >= fertileStart` — previously inverted (and hid the fertile window entirely) for cycle lengths under ~19 days.
4. `updateCycleBar()` no longer shifts segments backwards when a segment width is ≤0 (could happen for short cycles with a long period duration).
5. `selectDay()`'s log-panel date now uses `getLanguage()` instead of a hardcoded `"default"` locale.
6. Removed dead code: `getPhaseMessage()` / `getPhaseSubtitle()` (never called; superseded by `getStatusPhaseLabel()` + `status_phase_line`).
7. Prediction-window variation now uses real rolling std-deviation (clamped 1–5d) instead of a coarse 1-or-2-day binary flag (see §5).

**Features added:**

8. Settings → Cycle → **Recalculate Cycle History** button (`recalculateCycleHistoryWithConfirm()`) — safe recovery tool that rebuilds `cycleHistory`/`lastPeriodStart` from logged flow days.
9. Log panel → **"This is a new period, not a continuation"** checkbox (`#log-force-new-cycle`, `getForceNewCycleFlag()`) — manually overrides the gap-tolerance heuristic for both `updateCycleHistory()` and `applyAutoFill()`. Only shown when `isSameMenses(dateStr)` is true (recent adjacent flow), so an obviously-new cycle after weeks without bleeding never presents the option.
10. CSV import now distinguishes **spotting** (drip `bleeding.value=0`) from real flow — see §4/§7.
11. **Print cycle summary** for doctor visits — see §6.
12. Auto-fill Settings copy clarified to **"Auto-fill expected period days ahead"** — value means days *after* the start day (e.g. `5` → start + 5 = 6 days total). Blank/`null` remains the default (rolling avg period length).

**Explicitly deferred (owner's call, revisit later):**

- Symptom chart re-enable — undecided how to present the data meaningfully.
- ~~Google Drive sync — still just the plan doc.~~ → **Shipped** (one-way backup); see §10 A and [`google-drive-sync-plan.md`](./google-drive-sync-plan.md).
- Push/background notifications — not feasible without a backend (Push API requires a server to trigger sends; Periodic Background Sync is unreliable/Chromium-only). In-app reminder-on-logging is the current approach.
- WebAuthn/biometric unlock — unclear PWA support story, revisit later.
- ru/be i18n rollout — personal fork with no current ru/be users; revisit if that changes.
- Smarter CSV-import merge (auto-resolving near-duplicate records) — intentionally *not* wanted; current Merge/Replace choice is enough, and auto-merging risks silently "fixing" what might actually be a misclick.

### Google Drive + deploy session (2026-07-23, `v20260723h`)

**Shipped / fixed:**

1. **Token proxy** — Client secret removed from SPA; Cloudflare Worker (`drive-oauth-proxy/`) handles code + refresh exchange; `DRIVE_TOKEN_PROXY_URL` in `drive-config.js`.
2. **Drive disconnect** — Two-tap confirm (no broken modal on mobile); clears refresh token, file id, auto-backup, OAuth keys + localStorage mirrors.
3. **`wireDriveDb()`** — `script.js` passes `window.getFromDB/setInDB/deleteFromDB` into `drive-sync.js` after `initIndexedDB()` (ES modules cannot rely on globals alone for deletes).
4. **`_uploadTimer`** — Missing module variable crashed disconnect at `cancelScheduledDriveBackupUpload()` (root cause of “Could not disconnect” on PC).
5. **Upload verify** — Post-upload Drive API check before success toast; shorter mobile toasts; toast CSS wraps text.
6. **`save()` isolation** — Drive auto-backup errors no longer fail local encrypt/save.
7. **Startup recovery** — Reverted ES-module-only IndexedDB loader after cache mismatch caused “Database Error” / blank screen.

**Verified working:** Connect → back up now → two-tap Disconnect → Connect again; restore from Drive on fresh device.

### Daily logging + history insights session (2026-07-27, `5609921`, `fe7c3df`, `84352ad`; cache `v20260727q`)

**Logging and compatibility:**

1. Replaced the day input panel with a compact, mobile-first accordion editor with autosave, explicit per-field clearing, and an unambiguous whole-entry delete action.
2. Added explicit **No pain** (`pain: 0`) so “recorded no pain” is not conflated with “not recorded.”
3. Added compatibility normalizers for existing numeric and legacy boolean symptom data. drip CSV pain and mood flags are converted to the current scales; numeric values placed in drip note fields by this app round-trip without being duplicated into the user’s note.
4. Auto-fill now triggers only when a new flow record begins a period, never when editing symptoms on an existing flow day. Estimated days are labeled with `flowEstimated`.

**Insights, fertility, and privacy:**

5. Added a compact **Recent period profile** showing duration, heavy-flow days, peak-flow day, peak pain, and per-day flow/pain/mood tracks. The layout remains valid when only flow was recorded.
6. Combined the recent comparison with cycle history. The latest six rows and full-history overlay now use aligned Dates / Period / Cycle / Daily pattern columns and compact, theme-safe SVG charts: bottom-aligned flow bars with overlaid pain and mood lines.
7. Compacted rolling-six-month and all-time statistics into horizontal metric grids for mobile.
8. Split the old fertility display setting into **Show fertility estimates** (default off) and **Show cycle phase timeline** (default on). Fertility-off removes fertile-day statistics and calendar/status fertility labels; the independent phase timeline may still show menstrual, follicular, ovulation, and luteal phases. Turning the phase timeline off shows only Period / Other cycle days and removes ovulation/luteal legend entries.
9. Kept sharing privacy-preserving: recent history sharing remains dates/durations only. Printing defaults to dates/durations and offers two independent, unchecked opt-ins for symptom summaries and notes.

**Authentication, localization, and PWA updates:**

10. Encrypted-backup PIN entry now accepts keyboard digits and Backspace before a mouse click, uses semantic keypad buttons, restores focus correctly, and prevents duplicate decrypt submissions.
11. Service-worker activation no longer interrupts an unlocked session. It also defers while a PIN is partially entered or while hash/decrypt work is in progress, preventing the update race that produced two login screens back to back.
12. Unlock remains security-equivalent: the PIN is memory-only, submissions are single-flight, the existing attempt counter/lockout remains active, and pending updates reload only after locking (with the existing maximum deferral).
13. Japanese and Traditional Chinese period ranges now render compact month/day labels such as `6月4日–6月9日`, including `日` and no space before the day.

### Multi-app import / export session (2026-07-27 → 2026-07-28; cache `v20260728e`)

**Shipped:**

1. In-app **Import from another app** wizard (My Calendar + drip) with adapters, flow pattern, merge/replace, and session-safe overlay (no kick to lock).
2. Flow level **4 (Very heavy)** without rescaling 1–3; My Calendar `++++Flow` → 4; drip export token `flow:4`.
3. **Export to another app** — drip + Plain CSV only (no My Calendar export).
4. Import report shortened to `Imported {days} period days across {periods} cycles.`; extras note + lists + copy/export only when unmapped/leftovers exist.
5. Flow pattern hint (truncate extras / repeat last level); empty pattern defaults to `1` when periods need flow.
6. GitHub Pages: `.nojekyll` + `_config.yml` so Liquid in docs cannot break deploys.
7. Calendar flow dots: full-circle rose→peach radial gradients with wider core-size steps (1–4); level 4 deeper core + light rim; spotting stays a hollow ring.

### Repo flatten and custom-domain session (2026-07-30; cache `v20260730j`)

Moved the app from nested `period-tracker/` up to **repo root**, then configured GitHub Pages to publish it at `https://period.fishese.cc/`. Updated the manifest scope, public metadata, share URL, Drive redirect helpers, and docs.

Mobile settings are one continuous page ordered Language → Calendar → Cycle Settings → Cycle History Maintenance → Theme → Security → Google Drive backup → Erase All Data. Desktop uses tabs ordered Layout → Cycle → Security & Privacy. The Drive section uses one combined privacy/behavior description and no longer carries test-user access copy.

Onboarding offers both local encrypted-backup restore and Google Drive restore. Both use the backup encryption PIN as the new app PIN. The multi-app import flow-pattern field preserves native digit/Backspace input and removes unsupported characters; report Copy/TXT/CSV actions share one compact row above Done.

---

## 9. Older work

See earlier commits for older implementation history (drip tools, crypto chunks, auto-fill, themes, PWA, modal DOM fixes, etc.). Prefer this HANDOFF for anything current.

---

## 10. Next plans (when you return)

### A. Google Drive backup — shipped

Spec (as-built): [`google-drive-sync-plan.md`](./google-drive-sync-plan.md)

- One-way encrypted upload to Drive `appDataFolder` (`js/drive-sync.js` + `drive-config.js`)
- Settings → Security (**below** local export/import): Connect / Back up now / **Disconnect** (two-tap confirm) + auto-backup (~45s debounce after `save()`)
- First connect: optional restore from Drive (replaces local; PIN required)
- OAuth: external Web client in **Production**; **Client ID in SPA** and **Client secret only on `drive-oauth-proxy` Worker**
- Origins/redirects: custom domain + GitHub Pages fallback + localhost (see `drive-config.example.js`)
- If Google warns about a published secret: **rotate secret**, put new secret on Worker only, never recommit to the SPA
- PKCE state mirrored in IndexedDB + localStorage; `save()` isolates Drive errors from local encrypt
- i18n: en / es / ja / zh-TW
- No CSP changes on GitHub Pages (`firebase.json` unused)

### A2. Google Drive — still deferred

- Backend token exchange → **done** via Cloudflare Worker (`drive-oauth-proxy/`); keep secret only there
- Two-way sync / conflict resolution
- Basic OAuth brand verification if verified public branding is desired
- Deleting remote backup on disconnect

### B. Remaining UI / docs (optional)

- Desktop Insights polish; symptom chart restore if needed (undecided how to present the data meaningfully — see §8)
- Keep `README.md`, `CLAUDE.md`, and this handoff synchronized when state fields, privacy defaults, or authentication behavior change.
- ~~Confirm share-card / QR text pointing at GitHub Pages URL~~ (done)
- Update `og:url` / canonical if hosting on a personal domain
- ~~Distinct calendar style for spotting / flow levels 1–4~~ (done — hollow ring + growing fills + deeper very-heavy)

### C. Explicitly deferred

- Two-way sync / conflict resolution
- Loading a real webfont file for LunaDisplay (currently Georgia alias)
- See §8 "Explicitly deferred" for the full current list (push notifications, WebAuthn, ru/be i18n, smarter CSV merge, symptom chart) with reasoning for each. Drive **one-way backup is shipped**; two-way sync remains deferred (§10 A2).

---

## 11. Known gotchas

1. Hard-refresh / unregister SW after JS/CSS deploys; bump `CACHE_VERSION`. A `controllerchange` while unlocked, while a PIN is partially entered, or while unlock is in progress is deferred until the session next locks, with a five-minute maximum deferral. `unlockInProgress` also makes PIN validation single-flight. Do not persist this flag or the PIN. `lockApp()` clears state and sensitive overlays before attempting the pending reload so navigation failure cannot leave the app exposed.
2. PIN modal: `_restoreModalBox()` after import / change-PIN. Encrypted-backup PIN entry uses `#ipin-dots` and must remain wired into `initKeyboardNavigation()` for digits + Backspace; its keypad controls are semantic buttons for Tab / Enter / Space. `_importPinSubmitting` keeps backup decryption single-flight.
3. Dates: `toISO()` / `fromISO()` — never `Date.toISOString()` for day keys (this bit `import-drip.js` once already — fixed, see §8, but stay alert for new occurrences)  
4. State by reference after decrypt  
5. `autoFillDays`: `null` = auto (rolling avg), `0` = off, `1–10` = days ahead after start (not including the start day itself)  
6. Onboarding CSV import has nothing to merge with (fresh state); non-onboarding import offers a real Merge/Replace choice — see §7  
7. GitHub Pages path quirks for `manifest.json` (`dd363ef`)  
8. Drive OAuth: external app in **Production**, requesting only non-sensitive `drive.appdata`; **never** put the Client secret in `drive-config.js` — use `drive-oauth-proxy/`. Rotate the secret immediately if Google reports a leak. Redirect URI must exactly match `https://period.fishese.cc/`.
9. iOS PWA OAuth remains awkward — test on a real device if supporting iPhone shortcuts  
10. `log.flow` is truthy-checked pervasively (`if (log.flow)`) — a future 4th flow level must not be `0`/falsy, or it'll silently behave like "not set" everywhere. This is exactly why `spotting` was added as its own boolean field instead of `flow: 0`.  
11. If cycle history / predictions ever look wrong, try Settings → Cycle → "Recalculate Cycle History" before debugging further — it's a safe, non-destructive rebuild from logs.  
12. Local `save()` must not fail because of Drive — auto-backup scheduling is outside the encrypt/IndexedDB try/catch.  
13. **Git push:** use remote `period-tracker`, branch `master` — `origin` is upstream pythonime-lab.  
14. **Drive backup file** is in hidden `appDataFolder` — not visible at drive.google.com; restore prompt on connect confirms it exists.  
15. **`indexeddb-storage.js`** must stay classic-script + `defer` before `type="module" script.js` unless you migrate HTML and bust SW cache everywhere.  
16. After deploy: hard-refresh or unregister Service Worker once if JS behaves oddly (mixed cache versions).  

---

## 12. Quick test checklist

- [ ] Onboarding / CSV import / unlock  
- [ ] Enter a correct PIN while a new service worker activates — app unlocks once and does not immediately show a second login screen
- [ ] Enter only part of a PIN while a new service worker activates — entry is not interrupted
- [ ] Late period message + dotted predicted days (heavy-flow ring) vs. lighter dotted tolerance days (light-flow ring)
- [ ] Flow levels 1–4 read as one gradient in all four themes; the date stays legible on the level-1 core
- [ ] Theme → Customize: opens on the palette you were viewing, previews live, Save/Load preset survives switching themes, Reset restores the base theme, and leaving Customize clears every inline override
- [ ] Fertility estimates toggle: calendar highlights + Fertile Days stat; cycle phase timeline remains independently configurable
- [ ] Disable cycle phase timeline — neutral timeline shows only Period / Other cycle days with no Ovulation or Luteal legend
- [ ] Activate a new service worker while unlocked — app stays open, then refreshes when the session locks
- [ ] Encrypted-backup PIN modal accepts digits and Backspace before any click; keypad also works with Tab + Enter/Space
- [ ] Daily editor: clear fields, delete entry, explicit No pain, and editing symptoms on an existing period does not auto-fill
- [ ] History charts: bars start at the bottom; pain/mood overlay flow; SVG background works in every theme
- [ ] History compact dates + share icon + print icon; ja/zh-TW ranges render like `6月4日–6月9日`
- [ ] Share history contains dates/durations only
- [ ] Status phase line in zh-TW / ja / es  
- [ ] Layout: Language above Theme; About has no PayPal  
- [ ] Offline reload  
- [ ] Log a period after a >60-day gap — confirm `lastPeriodStart`/predictions advance (was silently stuck before this session's fix)  
- [ ] Log panel "This is a new period" checkbox actually splits a cycle when checked  
- [ ] Settings → Cycle → "Recalculate Cycle History" rebuilds without errors on real data  
- [ ] Import a drip CSV with a `bleeding.value=0` (spotting) row — check it doesn't inflate period count, and round-trips on export  
- [ ] Print summary defaults to dates/durations; symptoms and notes can be enabled independently
- [x] Drive: connect → back up now → two-tap disconnect → Connect again; fertility toggle still saves without error

---

## 13. New-chat starter prompt

```
I'm continuing work on My Cycle Keeper (fork of Your Cycle Keeper).
Repo: github.com/fishese/period-tracker (app at repo root).
Read docs/HANDOFF.md and docs/google-drive-sync-plan.md first.

[Describe your task here]
```

---

## 14. Key files

| File | Role |
|------|------|
| `js/script.js` | Main UI / state / share / status / print summary |
| `js/cycles.js` | Predictions / rolling / day types / fertile window |
| `js/import/import-core.js` | Import wizard helpers (preview, flow pattern, report) |
| `js/import/adapters/drip.js` | drip CSV import adapter |
| `js/import/adapters/mycalendar.js` | My Calendar `.txt` import adapter |
| `js/export/export-core.js` | Export wizard helpers (dates, filename, download) |
| `js/export/adapters/drip.js` | drip CSV export (incl. spotting round-trip) |
| `js/export/adapters/plain-csv.js` | Plain CSV export (flow + spotting rows) |
| `js/import-drip.js` | Legacy re-export shim (tests) |
| `js/export-drip.js` | Legacy re-export shim (tests) |
| `js/periodMarking.js` | Menses episode logic, `cleanupEmptyLogs()` |
| `js/i18n.js` | Locales |
| `js/drive-sync.js` | Google Drive OAuth, upload/download, disconnect, auto-backup |
| `js/drive-config.js` | Public OAuth Client ID + token proxy URL |
| `js/indexeddb-storage.js` | IndexedDB (classic script globals) |
| `drive-oauth-proxy/` | Cloudflare Worker — OAuth Client secret |
| `index.html` | Structure / About / Layout / log panel / print container |
| `style.css` | Themes, calendar, history footer, `@media print` |
| `service-worker.js` | Offline cache |

---

*End of handoff. Upstream / GPL: [Your Cycle Keeper](https://github.com/pythonime-lab/yourcyclekeeper).*
