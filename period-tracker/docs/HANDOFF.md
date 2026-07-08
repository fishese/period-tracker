# My Cycle Keeper — Handoff Document

**Last updated:** 2026-07-08 (evening session closed)  
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
| **Privacy** | Zero server data; CSP blocks network after load (except future Drive backup) |

**Why the fork exists:** Migrate history from **My Calendar** → **drip CSV** → this app; continue tracking with rolling predictions, auto-fill, and optional export back to drip format.

**Branding rule:** UI and product name = **My Cycle Keeper**. Attribution / support for the original = **Your Cycle Keeper** / `pythonime-lab` (GitHub link only — PayPal donate removed to avoid payment confusion).

---

## 2. Repository layout

```
mycyclekeeper/                    # Git repo root (landing page + Firebase config)
├── index.html                    # Marketing/landing (yourcyclekeeper.com style)
├── firebase.json
├── README.md / README-Fork.md
└── period-tracker/               # ★ THE WEB APP ★
    ├── index.html                # Main PWA
    ├── js/
    │   ├── script.js             # UI, state, onboarding, settings
    │   ├── cycles.js             # Predictions, rolling stats, day types
    │   ├── crypto.js             # PIN, AES-GCM, PBKDF2
    │   ├── indexeddb-storage.js  # IndexedDB key-value
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
    └── service-worker.js         # CACHE_VERSION currently v20260708b
```

---

## 3. Development & deployment

### Local dev (required for SW + Web Crypto)

```bash
cd mycyclekeeper          # repo root
python -m http.server 8000
# Open: http://localhost:8000/period-tracker/
# NOT file://
```

### Git remotes

| Remote | URL | Purpose |
|--------|-----|---------|
| `period-tracker` | `https://github.com/fishese/period-tracker.git` | **Push fork work here** (`master`) |
| `origin` | `https://github.com/pythonime-lab/yourcyclekeeper.git` | Upstream (do not force-push) |

### Pre-deploy checklist

1. Bump `CACHE_VERSION` in `period-tracker/service-worker.js`
2. Bump `?v=` query params on CSS/JS in `index.html` if used
3. Test offline: DevTools → Network → Offline → reload
4. Deploy via Firebase and/or GitHub Pages as appropriate

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

**Migration note:** Keys renamed from `yourcyclekeeper_*`. Old encrypted blobs are not auto-migrated — re-onboard + re-import CSV/backup.

### State shape (current)

```javascript
state = {
  lastPeriodStart: "YYYY-MM-DD" | null,
  cycleLength: 28,              // synced from rolling mean when history exists
  periodDuration: 5,            // synced from rolling flow duration when logs exist
  toleranceDays: null,          // null = auto (±1/±2 from stats), 0–5 manual
  autoFillDays: null,           // null = auto from logs; 0 = off; 1–10 = fixed
  showFertility: false,         // default OFF — calendar highlights only when true
  logs: { "YYYY-MM-DD": { flow?, pain?, mood?, note? } },
  cycleHistory: [{ start, length }],
}
```

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

### Anchor walking

`getCurrentCycleAnchor()` walks from `lastPeriodStart` using **rolling average** cycle length (not last irregular cycle alone).

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
- Footer row: “Showing last N of M cycles” + small **share icon** (mailto, last 6 periods as plain text)
- `shareRecentPeriodHistory()` in `script.js`

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

---

## 9. Older work

See `README-Fork.md` §§1–20 (drip tools, crypto chunks, auto-fill, themes, PWA, modal DOM fix, etc.). Prefer this HANDOFF for anything current.

---

## 10. Next plans (when you return)

### A. Google Drive backup — planned, not built

Spec: [`google-drive-sync-plan.md`](./google-drive-sync-plan.md)

- One-way encrypted upload to Drive `appDataFolder`
- CSP must allow Google OAuth / Drive APIs
- New `js/drive-sync.js`; Phase 1 Connect / Sync now / restore prompt

### B. Remaining UI / docs (optional)

- Broader i18n for ru/be (supported in file; layout switcher currently lists en/es/ja/zh-TW)
- Desktop Insights polish; symptom chart restore if needed
- Refresh `README-Fork.md` + `CLAUDE.md` (still say Your Cycle Keeper / old keys in places)
- Confirm share-card / QR text pointing at `yourcyclekeeper.web.app`
- Update `og:url` / canonical if hosting on a personal domain

### C. Explicitly deferred

- Two-way sync / conflict resolution  
- Loading a real webfont file for LunaDisplay (currently Georgia alias)

---

## 11. Known gotchas

1. Hard-refresh / unregister SW after JS/CSS deploys; bump `CACHE_VERSION`  
2. PIN modal: `_restoreModalBox()` after import / change-PIN  
3. Dates: `toISO()` / `fromISO()` — never `Date.toISOString()` for day keys  
4. State by reference after decrypt  
5. `autoFillDays`: `null` = auto, `0` = off  
6. CSV import overwrites — export backup first  
7. GitHub Pages path quirks for `manifest.json` (`dd363ef`)  
8. iOS PWA OAuth will be hard for Drive backup — test early  

---

## 12. Quick test checklist

- [ ] Onboarding / CSV import / unlock  
- [ ] Late period message + dashed predicted days  
- [ ] Fertility toggle: calendar only; legend stays  
- [ ] History compact dates + share icon  
- [ ] Status phase line in zh-TW / ja / es  
- [ ] Layout: Language above Theme; About has no PayPal  
- [ ] Offline reload  

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
| `js/script.js` | Main UI / state / share / status |
| `js/cycles.js` | Predictions / rolling / day types |
| `js/import-drip.js` | CSV import |
| `js/i18n.js` | Locales |
| `index.html` | Structure / About / Layout |
| `style.css` | Themes, calendar, history footer |
| `service-worker.js` | Offline cache |

---

*End of handoff. Upstream / GPL: [Your Cycle Keeper](https://github.com/pythonime-lab/yourcyclekeeper).*
