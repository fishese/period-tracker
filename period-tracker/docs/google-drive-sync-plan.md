# Google Drive backup sync — implementation plan

**Status:** Phase 1 implemented (2026-07-20) — manual + auto one-way backup; OAuth setup required in `drive-config.js`  
**Scope:** `period-tracker/` PWA

This document captures the agreed approach for optional Google Drive backup. Data stays off our servers; only an encrypted backup blob is stored in the user's own Google Drive.

---

## Goals

- Let users **opt in** to backing up their encrypted data to **their** Google Drive.
- Reuse the **existing backup format** (`{ enc, salt, v }` JSON bundle — same as manual Export).
- **One-way sync:** upload only after initial setup (no merge / no two-way sync).
- On **first connect**, optionally **restore** from Drive if a backup exists (reuse existing import + PIN flow).
- Preserve the offline-first, zero-server-data model.

## Non-goals (v1)

- Two-way / multi-device sync with conflict resolution.
- Storing plaintext or PIN on Google or our server.
- Automatic restore without user confirmation + PIN.
- Replacing manual Export/Import (keep both).

---

## Security model

| Layer | What happens |
|--------|----------------|
| **App server (Firebase hosting)** | Serves static files only. Never sees user health data. |
| **Google Drive** | Stores encrypted `.bin` JSON only. Google sees file metadata (size, modified time), not contents. |
| **User device** | PIN in memory only; decrypt locally via Web Crypto (unchanged). |
| **OAuth tokens** | Stored in IndexedDB on device after user connects. Revocable via Disconnect. |

**User-facing privacy message (draft):**  
*"Your cycle data is encrypted with your PIN before leaving this device. Google Drive only receives an encrypted backup file in a hidden app folder. We do not operate a backend and cannot read your data."*

---

## Backup format (already implemented)

Manual export in `js/script.js` → `exportData()`:

```json
{
  "enc": "<base64 AES-256-GCM ciphertext>",
  "salt": "<base64 PBKDF2 salt>",
  "v": 1
}
```

Drive sync should upload **this exact bundle** (as `application/json` or `application/octet-stream`). Restore should download it and pass it to the existing `importData()` / `_submitImportPin()` path.

**Suggested Drive filename:** `mycyclekeeper_backup.bin` (single file, overwrite on each sync).

---

## Google API approach

### Scope (recommended)

Use **`https://www.googleapis.com/auth/drive.appdata`**

- Files live in the user's **application data folder** (hidden from normal Drive UI).
- Only this OAuth client can access files it created there.
- Ideal for a single encrypted backup blob.

Do **not** request full `drive` scope unless there is a strong reason.

### Auth flow

- **OAuth 2.0 for SPA** with **PKCE** (no client secret in the browser).
- **Google Identity Services (GIS)** for sign-in, or raw `fetch` to token endpoint.
- Store in IndexedDB (new keys, e.g.):
  - `mycyclekeeper_drive_refresh_token_v1` (if using offline access)
  - `mycyclekeeper_drive_file_id_v1` (Drive file ID after first upload)
  - `mycyclekeeper_drive_last_sync_v1` (ISO date — mirrors `BACKUP_KEY` semantics)

### Drive API operations

| Action | API |
|--------|-----|
| First upload | `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` with `appDataFolder` parent |
| Update | `PATCH .../files/{fileId}?uploadType=media` (overwrite content) |
| Download | `GET .../files/{fileId}?alt=media` |
| Find existing | `GET .../files?q=...` in `appDataFolder`, or rely on stored `file_id` |

No backend proxy required — browser talks directly to `googleapis.com`.

---

## Hosting / CSP changes

**This fork:** GitHub Pages at `https://fishese.github.io/period-tracker/period-tracker/` — no CSP header (root `firebase.json` is upstream-only and not used).

Google Drive API calls (`fetch` to `googleapis.com`, `oauth2.googleapis.com`) work without CSP changes on GitHub Pages.

If you ever deploy to Firebase instead, extend CSP in root `firebase.json`:

```
connect-src 'self';
```

**Must extend** (exact list to verify during implementation):

```
connect-src 'self'
  https://www.googleapis.com
  https://oauth2.googleapis.com
  https://accounts.google.com;
```

If using the GIS script:

```
script-src 'self' 'unsafe-inline' https://accounts.google.com;
frame-src https://accounts.google.com;
```

Update `CLAUDE.md` / copilot instructions when implemented — today they say no network calls.

---

## Google Cloud Console setup (one-time, weekend prep)

1. Create or reuse a [Google Cloud project](https://console.cloud.google.com/).
2. **Enable** Google Drive API.
3. **OAuth consent screen**
   - App name: e.g. `Your Cycle Keeper` (or `My Cycle Keeper` — match product branding).
   - User support email: use a neutral address (e.g. project email), not necessarily personal Gmail.
   - Privacy policy URL: required for production (can link to in-app About/Privacy tab or GitHub).
   - Scopes: `drive.appdata` only.
4. **Credentials → OAuth 2.0 Client ID → Web application**
   - Authorized JavaScript origins:
     - `https://fishese.github.io` (GitHub Pages — this fork)
     - `http://localhost:8000` (local testing from repo root)
   - Authorized redirect URIs (must match exactly):
     - `https://fishese.github.io/period-tracker/period-tracker/` (note double `period-tracker` on Pages)
     - `http://localhost:8000/period-tracker/` (local — single `period-tracker`)
   - No client secret needed for PKCE SPA flow.
5. **Testing vs Production**
   - **Testing:** up to 100 test users you add manually — fine for development.
   - **Production:** public; Drive scopes may require [Google verification](https://support.google.com/cloud/answer/9110914) (free, but review can take days/weeks).

### Cost

- **Developer:** $0 for OAuth + Drive API at this scale.
- **User:** backup counts against their Google Drive quota (tiny for one encrypted file).

### What users see on connect

- App name, support email, requested permissions — **not** the developer's personal Google login.
- They sign in with **their** Google account.

---

## UX flow

### Settings → Backup & Security (new section or extend existing)

```
[ ] Connect Google Drive backup
    Status: Not connected | Last synced: Today | Error: …

[Connect Google Drive]  [Disconnect]
[Sync now]              (disabled if not connected)
```

### First-time connect

1. User taps **Connect Google Drive**.
2. Google OAuth consent → user approves.
3. App searches `appDataFolder` for existing `mycyclekeeper_backup.bin` (or stored `file_id`).
4. **If backup found:** modal — *"A backup was found in your Google Drive. Restore it now? This will replace local data."*
   - **Restore** → download blob → existing import PIN modal → decrypt → replace state.
   - **Skip** → continue with local data; next sync will upload (confirm overwrite if remote was newer? v1: simple — skip = keep local, upload on next sync overwrites remote).
5. **If no backup:** show connected; offer **Sync now** or wait for auto-upload.

### Ongoing (one-way)

- **Manual:** Settings → **Sync now** → build bundle → upload/overwrite.
- **Optional auto (v1.1):** after successful `save()`, debounced upload (e.g. 30–60s idle, only if connected and session unlocked).
- Update `BACKUP_KEY` / Drive last-sync display on success.

### Disconnect

- Clear OAuth tokens + `file_id` from IndexedDB.
- Do **not** delete remote file unless user explicitly chooses "Disconnect and remove Drive backup".

---

## Code structure (proposed)

```
period-tracker/js/
  drive-sync.js      # NEW — OAuth, upload, download, token refresh
  script.js          # Wire Settings UI, first-connect restore prompt
  indexeddb-storage.js  # (unchanged) + new keys for tokens/file id
```

### `drive-sync.js` exports (sketch)

```javascript
export async function connectDrive()           // OAuth + optional restore prompt data
export async function disconnectDrive()
export function isDriveConnected()
export async function uploadBackup(bundle)     // string or Blob
export async function downloadBackup()         // returns bundle string or null
export async function findExistingBackup()     // { fileId, modifiedTime } | null
export function getLastSyncTime()
```

### Integration points in `script.js`

| Hook | Action |
|------|--------|
| `exportData()` | Extract `buildBackupBundle()` helper shared with Drive upload |
| `importData()` / `_submitImportPin()` | Accept bundle from Drive download same as file picker |
| `save()` | (Optional later) `scheduleDriveSync()` if connected |
| Settings screen | Connect / Disconnect / Sync now / status |
| App unlock | Do **not** auto-sync without user action (v1) |

---

## Implementation phases

### Phase 1 — Manual one-way (MVP, ~1 weekend)

- [ ] Google Cloud project + OAuth client (Testing mode) with GitHub Pages origins (see §4).
- [x] ~~CSP updates in `firebase.json`~~ Not needed for GitHub Pages hosting.
- [ ] `drive-sync.js`: connect, disconnect, upload, download.
- [ ] Refactor: `buildBackupBundle()` from `exportData()`.
- [ ] Settings UI: Connect, Sync now, status line.
- [ ] First connect: detect remote backup → offer restore via existing import flow.
- [ ] i18n strings (en first; others fall back).
- [ ] Privacy copy in Settings + About.

### Phase 2 — Polish (optional follow-up)

- [ ] Auto-upload after `save()` (debounced, only when unlocked).
- [ ] Token refresh error handling + "Reconnect" prompt.
- [ ] Service worker: ensure OAuth routes are not cached incorrectly.
- [ ] OAuth consent screen → Production + verification if releasing publicly.
- [ ] Translations for ru, es, ja, zh-TW.

### Phase 3 — Explicitly deferred

- Two-way sync, conflict resolution, multi-device merge.

---

## Testing checklist

- [ ] Local: `python -m http.server 8000` from repo root → `http://localhost:8000/period-tracker/`
- [ ] Connect with test Google account (added in Cloud Console Testing).
- [ ] Upload → verify file in appDataFolder (Drive API explorer or re-download).
- [ ] Clear site data → connect → restore from Drive → PIN → data intact.
- [ ] Wrong PIN on restore → same error as manual import.
- [ ] Disconnect → tokens cleared; app still works offline.
- [ ] CSP: no console violations on OAuth or API calls.
- [ ] iOS Safari PWA: OAuth popup/redirect (known pain point — test early).
- [ ] Backup file remains undecryptable without PIN (inspect downloaded file).

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| iOS PWA OAuth popups blocked | Use redirect flow or full-page redirect; test on real device. |
| Google verification delay | Stay in Testing for personal use; ship manual export as fallback. |
| User forgets PIN | Same as today — backup useless without PIN; warn on PIN change (already done). |
| Token expiry | Implement refresh; prompt reconnect on failure. |
| Accidental overwrite | First connect: explicit restore/skip; Sync now: confirm if remote newer (v1.1). |

---

## Open decisions (pick when implementing)

1. **Auto-sync on save** in v1 or Phase 2?
2. **Branding on consent screen:** "Your Cycle Keeper" vs "My Cycle Keeper"?
3. **Production domain list** for OAuth origins (staging URL?).
4. On first connect with **both** local data and remote backup: default to "Keep local" vs "Restore from Drive"?

---

## References

- [Google Drive API — appDataFolder](https://developers.google.com/drive/api/guides/appdata)
- [OAuth 2.0 for client-side web apps (PKCE)](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow) — prefer authorization code + PKCE for SPAs
- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth verification FAQ](https://support.google.com/cloud/answer/9110914)
- Existing export: `period-tracker/js/script.js` → `exportData()`
- Existing import: `period-tracker/js/script.js` → `importData()`, `_submitImportPin()`
- CSP (Firebase only): root `firebase.json` → `/period-tracker/**` headers — not used on GitHub Pages
