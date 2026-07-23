# My Cycle Keeper — Handoff Document

**Last updated:** 2026-07-23 (Google Drive disconnect + deploy fixes)  
**Maintainer:** Personal fork (fishese)  
**Status:** Stable for personal use. Latest on `period-tracker/master`. Come back in a new chat with the prompt in §13.

This document is the **current source of truth** for continuing work. Older detail lives in [`README-Fork.md`](../../README-Fork.md) (sections 1–20); verify anything in that file against code for predictions, storage keys, fertility defaults, and branding.

---

## 1. What this project is

| Item | Detail |
|------|--------|
| **This fork** | **My Cycle Keeper** — personal period-tracking PWA |
| **Upstream** | [**Your Cycle Keeper**](https://github.com/pythonime-lab/yourcyclekeeper) by pythonime-lab (GPL v3, open source) |
| **This repo** | [`fishese/period-tracker`](https://github.com/fishese/period-tracker) on GitHub |
| **App path** | `period-tracker/` inside the repo (not repo root) |
| **Stack** | Vanilla JS ES modules, no build step, IndexedDB + AES-256-GCM, Service Worker |
| **Privacy** | Zero server data; no backend. Google Drive backup (optional) talks to Google APIs from the browser only |

**Live URL (this fork):** https://fishese.github.io/period-tracker/period-tracker/

**Why the fork exists:** Migrate history from **My Calendar** → **drip CSV** → this app; continue tracking with rolling predictions, auto-fill, and optional export back to drip format.

**Branding rule:** UI and product name = **My Cycle Keeper**. Attribution / support for the original = **Your Cycle Keeper** / `pythonime-lab` (GitHub link only — PayPal donate removed to avoid payment confusion).

---

## 2. Repository layout

```
fishese/period-tracker/           # GitHub repo (GitHub Pages hosts the app)
├── index.html                    # Upstream marketing landing (optional on Pages)
├── firebase.json                 # Upstream Firebase config — NOT used for this fork's hosting
├── README.md / README-Fork.md
└── period-tracker/               # ★ THE WEB APP ★ (served at …/period-tracker/period-tracker/ on Pages)
    ├── index.html                # Main PWA
    ├── js/
    │   ├── script.js             # UI, state, onboarding, settings
    │   ├── cycles.js             # Predictions, rolling stats, day types
    │   ├── crypto.js             # PIN, AES-GCM, PBKDF2
    │   ├── indexeddb-storage.js  # IndexedDB key-value (classic script; loaded before modules)
    │   ├── drive-sync.js         # Google Drive OAuth + one-way backup
    │   ├── drive-config.js       # OAuth Client ID + token proxy URL (no secret)
    │   ├── import-drip.js        # drip CSV parser
    │   ├── export-drip.js        # drip CSV export
    │   ├── periodMarking.js      # Menses episode logic
    │   ├── session.js            # Auto-lock, timeout
    │   ├── i18n.js               # en, ru, be, es, ja, zh-TW
    │   └── ...
    ├── import-drip.html          # Standalone encrypted import tool
    ├── mycalendar-to-drip.html   # My Calendar → drip converter
    ├── docs/
    │   ├── HANDOFF.md            # ← this file
    │   └── google-drive-sync-plan.md
    └── service-worker.js         # CACHE_VERSION currently v20260723h
```

---

## 3. Development & deployment

### Deploy (GitHub Pages)

**Live app:** https://fishese.github.io/period-tracker/period-tracker/

Push to `period-tracker` remote **`master`** (not `origin`, not `main`):

```bash
git push period-tracker master
# or, after tracking is set: git push
```

Typo `masterx` will fail with “src refspec does not match any”.

Root `firebase.json` is leftover from upstream — **not used** for this fork unless you switch to Firebase hosting.

### Local dev (required for SW + Web Crypto)

```bash
cd period-tracker          # repo root (clone root)
python -m http.server 8000
# Open: http://localhost:8000/period-tracker/
# NOT file://
```

Note: local path is single `period-tracker/`; GitHub Pages uses double — OAuth redirect URIs must register **both** (see `drive-config.example.js`).

### Pre-deploy checklist

1. Bump `CACHE_VERSION` in `period-tracker/service-worker.js`
2. Test offline: DevTools → Network → Offline → reload
3. Push to GitHub (`period-tracker` remote)

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
| `mycyclekeeper_theme` | Theme preference (localStorage, not encrypted) |
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
  showFertility: false,         // default OFF — calendar highlights only when true
  logs: { "YYYY-MM-DD": { flow?, spotting?, pain?, mood?, note? } },
  cycleHistory: [{ start, length }],
}
```

- `flow` (1–3) is a real period day and counts toward cycle-length/period-duration stats.
- `spotting: true` is tracked separately (currently only set via drip CSV import, `bleeding.value === 0`) — shows as a logged day (calendar dot) but is **excluded** from `flow`-based cycle/period calculations so it doesn't skew predictions. Round-trips back to drip's `bleeding.value=0` on export.

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
| Calendar tab | Status → **calendar** → **timeline bar** (bar under calendar) |
| Insights | History / Predictions / How it works |
| Settings Layout | Calendar toggle → **Language** → Theme |
| About → Developer | Combined About (no PayPal); separate **About This Fork** summary |
| zh-TW terminology | 經期 / 月經 (not 生理期 / 生理) |

### Fertility toggle

**Default `false`.** Affects calendar highlights + status phase labels only — **not** timeline legend.

### Cycle history

- Compact dates: `Jun 4–Jun 9, 2026`
- Columns: Dates \| Period \| Cycle
- Footer row: “Showing last N of M cycles” + small **share icon** (mailto, last 6 periods as plain text) + **print icon** (`printCycleSummary()`)
- `shareRecentPeriodHistory()` in `script.js`

### Print cycle summary (doctor-visit friendly)

- `printCycleSummary()` / `buildPrintSummaryContent()` in `script.js`, print icon next to the share icon on the History tab footer row.
- Builds a hidden `#print-summary` element (direct child of `<body>`), then `window.print()`. `@media print` in `style.css` hides everything else (`body > *:not(.print-summary)`) and forces black-on-white regardless of active theme.
- Content: rolling/overall cycle stats, next predicted period, and a full cycle history table with per-cycle avg pain/mood + note count (`summarizeCycleSymptoms()`), plus a "not medical advice" disclaimer.

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
My Calendar export
  → mycalendar-to-drip.html
  → drip CSV
  → in-app #csv-import-overlay OR import-drip.html
```

- Encrypted backup: `.bin` (`mycyclekeeper_backup_*.bin`)
- drip CSV export from Settings
- drip `bleeding.value === 0` (spotting) imports as `log.spotting = true`, **not** `log.flow` — see §4 State shape. Export round-trips it back to `bleeding.value=0`.
- `parseDripCsv()`'s future-date cutoff uses `toISO(new Date())` (local date) — was previously `Date.toISOString()` (UTC), which could wrongly drop "today"'s rows near midnight in timezones ahead of UTC.
- Non-onboarding drip import already offers a real choice: **Merge** (keep existing logs on date collisions) vs **Replace** (drip data wins) — see the modal in `_pickDripCsvFile()`. Onboarding import has nothing to merge with, so it's just an initial load.

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

---

## 9. Older work

See `README-Fork.md` §§1–20 (drip tools, crypto chunks, auto-fill, themes, PWA, modal DOM fix, etc.). Prefer this HANDOFF for anything current.

---

## 10. Next plans (when you return)

### A. Google Drive backup — shipped

Spec (as-built): [`google-drive-sync-plan.md`](./google-drive-sync-plan.md)

- One-way encrypted upload to Drive `appDataFolder` (`js/drive-sync.js` + `drive-config.js`)
- Settings → Security (**below** local export/import): Connect / Back up now / **Disconnect** (two-tap confirm) + auto-backup (~45s debounce after `save()`)
- First connect: optional restore from Drive (replaces local; PIN required)
- OAuth: Web client + **Client ID in SPA**; **Client secret only on `drive-oauth-proxy` Worker**; consent **Testing** + test users
- Origins/redirects: GitHub Pages double path + localhost (see `drive-config.example.js`)
- If Google warns about a published secret: **rotate secret**, put new secret on Worker only, never recommit to the SPA
- PKCE state mirrored in IndexedDB + localStorage; `save()` isolates Drive errors from local encrypt
- i18n: en / es / ja / zh-TW
- No CSP changes on GitHub Pages (`firebase.json` unused)

### A2. Google Drive — still deferred

- Backend token exchange → **done** via Cloudflare Worker (`drive-oauth-proxy/`); keep secret only there
- Two-way sync / conflict resolution
- Production OAuth verification for public users
- Deleting remote backup on disconnect

### B. Remaining UI / docs (optional)

- Desktop Insights polish; symptom chart restore if needed (undecided how to present the data meaningfully — see §8)
- Refresh `README-Fork.md` + `CLAUDE.md` (still say Your Cycle Keeper / old keys in places; `CLAUDE.md` also still lists `flow: 1-3` only — now `spotting?: true` too, see §4)
- ~~Confirm share-card / QR text pointing at GitHub Pages URL~~ (done)
- Update `og:url` / canonical if hosting on a personal domain
- Consider adding a distinct calendar dot style for spotting-only days (currently shows as the generic "has-log" dot, same as any other logged day)

### C. Explicitly deferred

- Two-way sync / conflict resolution
- Loading a real webfont file for LunaDisplay (currently Georgia alias)
- See §8 "Explicitly deferred" for the full current list (push notifications, WebAuthn, ru/be i18n, smarter CSV merge, symptom chart) with reasoning for each. Drive **one-way backup is shipped**; two-way sync remains deferred (§10 A2).

---

## 11. Known gotchas

1. Hard-refresh / unregister SW after JS/CSS deploys; bump `CACHE_VERSION`  
2. PIN modal: `_restoreModalBox()` after import / change-PIN  
3. Dates: `toISO()` / `fromISO()` — never `Date.toISOString()` for day keys (this bit `import-drip.js` once already — fixed, see §8, but stay alert for new occurrences)  
4. State by reference after decrypt  
5. `autoFillDays`: `null` = auto (rolling avg), `0` = off, `1–10` = days ahead after start (not including the start day itself)  
6. Onboarding CSV import has nothing to merge with (fresh state); non-onboarding import offers a real Merge/Replace choice — see §7  
7. GitHub Pages path quirks for `manifest.json` (`dd363ef`)  
8. Drive OAuth: **Testing** + test users; **never** put Client secret in `drive-config.js` — use `drive-oauth-proxy/`. Rotate secret immediately if Google reports a leak. Redirect URI must match Pages path (double `period-tracker/`).  
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
- [ ] Late period message + dashed predicted days  
- [ ] Fertility toggle: calendar only; legend stays  
- [ ] History compact dates + share icon + print icon  
- [ ] Status phase line in zh-TW / ja / es  
- [ ] Layout: Language above Theme; About has no PayPal  
- [ ] Offline reload  
- [ ] Log a period after a >60-day gap — confirm `lastPeriodStart`/predictions advance (was silently stuck before this session's fix)  
- [ ] Log panel "This is a new period" checkbox actually splits a cycle when checked  
- [ ] Settings → Cycle → "Recalculate Cycle History" rebuilds without errors on real data  
- [ ] Import a drip CSV with a `bleeding.value=0` (spotting) row — check it doesn't inflate period count, and round-trips on export  
- [ ] Print summary opens print dialog with populated stats + history table  
- [x] Drive: connect (test user) → back up now → two-tap disconnect → Connect again; fertility toggle still saves without error  

---

## 13. New-chat starter prompt

```
I'm continuing work on My Cycle Keeper (fork of Your Cycle Keeper).
Repo: github.com/fishese/period-tracker, app in period-tracker/.
Read period-tracker/docs/HANDOFF.md and period-tracker/docs/google-drive-sync-plan.md first.

[Describe your task here]
```

---

## 14. Key files

| File | Role |
|------|------|
| `js/script.js` | Main UI / state / share / status / print summary |
| `js/cycles.js` | Predictions / rolling / day types / fertile window |
| `js/import-drip.js` | CSV import (incl. spotting) |
| `js/export-drip.js` | CSV export (incl. spotting round-trip) |
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
