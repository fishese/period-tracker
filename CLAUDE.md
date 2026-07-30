# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**My Cycle Keeper** is a personal fork of Your Cycle Keeper: a privacy-first period tracking PWA with client-side AES-256-GCM encryption. Health data stays encrypted in IndexedDB; the only optional external transfer is an encrypted backup to the user's Google Drive. Built with vanilla JavaScript ES6 modules (no frameworks, no build tools, no dependencies).

**Live URL (this fork):** https://period.fishese.cc/

Upstream branding/URL in older docs may still say Your Cycle Keeper / yourcyclekeeper.web.app.

## Development Commands

```bash
# Start local server (required for Service Worker + Web Crypto API)
python -m http.server 8000
# or
npx http-server

# Access at http://localhost:8000/ (NOT file://)

# Deploy: push to fishese/period-tracker (GitHub Pages). App lives at repo root.
git push period-tracker master   # NOT origin — origin is upstream pythonime-lab
```

**Repo layout:** App code at repo root. GitHub Pages publishes it at the custom domain `https://period.fishese.cc/`.

### Git remotes (this fork)

| Remote | URL | Use |
|--------|-----|-----|
| `period-tracker` | `https://github.com/fishese/period-tracker.git` | **Push here** (`master`) → GitHub Pages |
| `origin` | `https://github.com/pythonime-lab/yourcyclekeeper.git` | Upstream only — do not push fork work here |

### Pre-Deploy Checklist

1. Bump `CACHE_VERSION` in `service-worker.js` (current value is documented in `docs/HANDOFF.md`)
2. Test offline: DevTools → Network → Offline → Reload
3. Push: `git push period-tracker master`
4. Hard-refresh or unregister Service Worker after deploy (avoids mixed-cache JS errors)

## Architecture

### Core State Management

Central `state` object in `js/script.js` holds all app data:

```javascript
state = {
  lastPeriodStart: "YYYY-MM-DD" | null,
  cycleLength: 28,
  periodDuration: 5,
  toleranceDays: null,               // null = automatic; otherwise 0-5
  autoFillDays: null,                 // null = automatic, 0 = off, 1-10 = days ahead
  showFertility: false,               // fertility-specific UI defaults off
  showCyclePhases: true,              // independent phase timeline defaults on
  logs: {
    "YYYY-MM-DD": {
      flow: 1-4,                      // 1=light … 4=very heavy
      spotting: true,                 // separate from flow; does not count as a period day
      flowEstimated: true,            // optional auto-fill marker
      pain: 0-10,                     // 0 means explicit No pain; 0.5 increments
      mood: 0-100,                    // 0=low, 50=neutral, 100=happy
      note: "..."                     // max 500 chars
    }
  },
  cycleHistory: [{ start, length }]
};
```

**State is passed by reference** to modules via `setState()` calls—never duplicate or pass as function arguments.

Missing symptom properties mean “not recorded”; they are not zero. Use `getFlowLevelFromLog()`, `getPainValueFromLog()`, and `getMoodValueFromLog()` instead of truthy checks when reading mixed current/legacy data.

### Storage Layer: IndexedDB → AES-GCM → State

1. **IndexedDB** (`js/indexeddb-storage.js`): Persistent key-value store — loaded as a **classic script** before modules; exposes `getFromDB` / `setInDB` / `deleteFromDB` on `globalThis`
2. **Encryption** (`js/crypto.js`): PBKDF2 (250k iterations) + AES-256-GCM with 12-byte IV
3. **Session** (`js/session.js`): PIN held in memory only, auto-lock after 5 min idle

### Module Structure

| Module | Purpose |
|--------|---------|
| `js/script.js` | Main app logic, state management, UI rendering, chart drawing |
| `js/crypto.js` | `deriveKey`, `encryptData`, `decryptData`, `hashPin` |
| `js/indexeddb-storage.js` | `getFromDB`, `setInDB`, `deleteFromDB`, `clearDB` |
| `js/cycles.js` | Cycle predictions via Calendar Rhythm Method |
| `js/periodMarking.js` | Period start/end logic, auto-cleanup of consecutive markers |
| `js/validators.js` | Current/legacy input normalization (spotting/flow 0-4, pain 0-10, mood 0-100) |
| `js/dateUtils.js` | ISO date utilities (`toISO`, `fromISO`, `addDays`, `diffDays`) |
| `js/session.js` | Timeout warnings, countdown timers, lock triggers |
| `js/navigation.js` | Keyboard accessibility and focus management |
| `js/drive-sync.js` | Optional Google Drive one-way backup (OAuth PKCE, token proxy, upload/download, two-tap disconnect) |
| `js/drive-config.js` | OAuth Client ID + `DRIVE_TOKEN_PROXY_URL` only (no Client secret) |
| `js/import/` | Multi-app import wizard helpers + My Calendar / drip adapters |
| `js/export/` | Export wizard helpers + drip / plain-CSV adapters |
| `drive-oauth-proxy/` | Cloudflare Worker — holds Client secret |

### Cycle Prediction Algorithm

Calendar Rhythm Method + Standard Days Method:
- **Fertile window:** Days 8 through `(cycleLength - 11)`
- **Ovulation:** Day `(cycleLength - 14)` from period start
- **getDayType()** returns: `"period"`, `"fertile"`, `"ovulation"`, or `"normal"`

## Critical Conventions

### Date Handling

- **Always use ISO format:** `"YYYY-MM-DD"` strings
- **Convert with:** `toISO(Date)` and `fromISO(string)` from `js/dateUtils.js`
- **Never use:** `.toISOString()` (includes timezone)

### Security Rules

- **No app backend:** Health data never leaves the device except optional user-initiated Google Drive backup (encrypted blob to the user's Drive).
- **PIN never stored:** Derived to key on-demand using PBKDF2
- **Fast PIN validation:** HMAC hash check before attempting decryption
- **Single-flight unlock:** `unlockInProgress` blocks overlapping PIN submissions and prevents service-worker activation from reloading during partial entry/hash/decrypt
- **Schema versioning:** Encrypted envelope wraps state as `{ v: SCHEMA_VERSION, payload: state }`
- **Drive backup docs:** `docs/google-drive-sync-plan.md`
- **Import / export docs:** `docs/HANDOFF.md` §7; design specs under `docs/superpowers/specs/`

### UI Screens

Toggle `.hidden` class to switch between:
- `#onboarding` - Initial PIN setup
- `#lock-screen` - Session timeout lock
- `#app` - Main interface

Bottom-level views: `"calendar"`, `"insights"`, `"settings"`, `"about"`, and `"support"`. Full history is an overlay opened from Insights.

The daily log editor is a compact accordion. Selections autosave, but clearing one field and deleting the entire entry are separate actions. Auto-fill must run only when flow is newly added at the start of a period; symptom-only edits to an existing period day must never trigger it.

Settings → Security hosts **Import from another app** and **Export to another app** (session-safe overlays). Flow supports levels 1–4 (plus spotting). Import report is a short result line; unmapped/leftover extras and copy/export appear only when needed.

## Common Patterns

### Adding New Symptoms/Fields

1. Update `state.logs[date]` structure in `js/script.js`
2. Add validator in `js/validators.js`
3. Bump `SCHEMA_VERSION` in `js/crypto.js` if breaking change
4. Update `cleanupEmptyLogs()` to check new field

### Modifying Cycle Calculations

Edit `js/cycles.js`:
- `getCycleInfo()` - Current cycle phase/day
- `calculatePredictions()` - Future period/ovulation dates
- `getDayType()` - Period vs. fertile vs. ovulation classification

### Chart Rendering (Insights Tab)

Canvas-based with DPR scaling for retina displays:
- Month view: Daily bars (days 1-31)
- Year view: Monthly aggregates
- `activeChartFilter`: `"all"`, `"period"`, `"ovulation"`, `"flow"`, `"pain"`, `"mood"`

## Forbidden Patterns

- **Do not** use `localStorage` for health data (IndexedDB + encryption). UI prefs (theme) and ephemeral Drive OAuth PKCE mirrors may use localStorage.
- **Do not** call `fetch()` for app backends — optional Google Drive backup may `fetch` `googleapis.com` / `oauth2.googleapis.com` / `accounts.google.com` only.
- **Do not** store PIN in state or IndexedDB
- **Do not** use `Date.toISOString()` for day keys (use `toISO()` instead)
- **Do not** pass `state` as function parameter (use module-level `setState()` reference)
- **Do not** let Drive backup errors fail local `save()` (schedule auto-backup outside the encrypt/IDB try/catch)

## Testing Checklist

- Offline mode: Disable network in DevTools, reload app
- Session timeout: Wait 5 min idle, verify auto-lock with countdown
- Wrong PIN: Should fail fast with HMAC check (no decryption attempt)
- Service-worker update during partial PIN entry or unlock: must not reload into a second login screen
- Daily editor: explicit No pain survives save/reload; symptom edits on existing flow do not auto-fill
- History: recent six and full-history compact SVG charts render in all themes
- Print/share privacy: sharing contains dates/durations only; print symptom/note options default off and work independently
- Japanese/Traditional Chinese period dates: `6月4日–6月9日`
- Period marking: add/remove flow around one-day gaps and verify cycle history rebuilds correctly
- Drive backup (optional): connect as test user, back up now, two-tap disconnect, reconnect; confirm normal saves still work without Drive
- Import (optional): My Calendar / drip file → review pattern → merge/replace → short report; extras copy/export only when leftovers/unmapped moods exist
- Export (optional): drip and Plain CSV download while unlocked
