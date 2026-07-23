# Google Drive backup — as built

**Status:** Shipped (2026-07-20); **token proxy** (2026-07-21); **disconnect + deploy fixes** (2026-07-23, SW `v20260723h`)  
**Live app:** https://fishese.github.io/period-tracker/period-tracker/  
**Scope:** `period-tracker/` PWA (GitHub Pages — root `firebase.json` is unused)

Optional one-way encrypted backup to the user's own Google Drive. Health data stays encrypted; the browser talks to Google Drive APIs after connect. **Token exchange/refresh** goes through a tiny Cloudflare Worker so the OAuth **Client secret never ships in public JS**.

---

## What it does

| Feature | Behavior |
|--------|----------|
| **Direction** | One-way: App → Drive (overwrite). Not two-way sync. |
| **Format** | Same as manual Export: `{ enc, salt, v: 1 }` |
| **Remote file** | `mycyclekeeper_backup.bin` in Drive **`appDataFolder`** (hidden from normal Drive UI) |
| **Manual** | Settings → Security → **Back up now** |
| **Auto** | Optional checkbox — debounced (~45s) upload after `save()` when online and unlocked |
| **First connect** | If a remote backup exists → offer restore (PIN required; replaces local data) |
| **Disconnect** | Two-tap confirm in Settings (no modal — avoids mobile/PWA modal bugs). Clears local OAuth tokens, file id, auto-backup flag, ephemeral OAuth keys (IndexedDB + localStorage). Does **not** delete the remote Drive file. |
| **Success toast** | “Backup uploaded” after Drive API verifies the file exists (backup lives in hidden `appDataFolder`, not drive.google.com). |

Local Export / Import / drip CSV stay primary for most users. Drive section sits **below** those controls.

---

## Security model

| Layer | What happens |
|--------|----------------|
| **Hosting (GitHub Pages)** | Static files only. Never sees health data. **Never** contains Client secret. |
| **Token proxy** (`drive-oauth-proxy/`) | Holds Client secret as a Worker env secret; exchanges auth codes / refreshes tokens. |
| **Google Drive** | Encrypted blob only. Google sees metadata (size, modified time), not plaintext. |
| **Device** | PIN in memory; AES-256-GCM via Web Crypto (unchanged). |
| **OAuth tokens** | Refresh token in IndexedDB; revocable via Disconnect. |

### If Google emails “handle client credentials securely”

That means a Client secret was found in a public place (e.g. this repo / Pages JS). Treat it as **burned**:

1. Cloud Console → Credentials → your Web client → **Reset / rotate secret**
2. Put **only the new secret** on the Worker (`wrangler secret put GOOGLE_CLIENT_SECRET`)
3. Confirm `drive-config.js` has **no** Client secret (only Client ID + `DRIVE_TOKEN_PROXY_URL`)
4. Users: Disconnect + Connect again after rotate

**In-app privacy copy** (combined with test-user note): encrypted file in a hidden app folder; ask **fishese** to add Google accounts to the OAuth test users list.

---

## Files

| Path | Role |
|------|------|
| `js/drive-sync.js` | PKCE OAuth, calls token proxy, upload/download, auto-backup scheduler, `wireDriveDb()`, `disconnectDrive()` |
| `js/drive-config.js` | `GOOGLE_CLIENT_ID` + `DRIVE_TOKEN_PROXY_URL` only (public) |
| `js/drive-config.example.js` | Setup placeholders |
| `drive-oauth-proxy/` | Cloudflare Worker + README — holds Client secret |
| `js/script.js` | Settings UI hooks, `buildBackupBundle()`, restore prompt, `save()` isolation, calls `wireDriveDb()` after `initIndexedDB()` |
| `js/i18n.js` | Drive strings for **en / es / ja / zh-TW** |
| `index.html` | Drive section under local backup |
| `service-worker.js` | Caches drive JS; bump `CACHE_VERSION` on deploy |

### IndexedDB keys

- `mycyclekeeper_drive_refresh_token_v1`
- `mycyclekeeper_drive_file_id_v1`
- `mycyclekeeper_drive_last_sync_v1`
- `mycyclekeeper_drive_auto_v1`
- Ephemeral OAuth: state, verifier, redirect, pending exchange, errors (mirrored to **localStorage** so PWA ↔ system browser redirects can share PKCE state)

### Scope

`https://www.googleapis.com/auth/drive.appdata` only.

---

## Google Cloud + proxy setup (required)

1. Enable **Google Drive API**.
2. **OAuth consent screen** → **Testing** + **Test users**.
3. **Credentials → OAuth 2.0 Client ID → Web application**
4. **Authorized JavaScript origins:**
   - `https://fishese.github.io`
   - `http://localhost:8000`
5. **Authorized redirect URIs** (exact, trailing slash):
   - `https://fishese.github.io/period-tracker/period-tracker/`
   - `http://localhost:8000/period-tracker/`
6. Deploy **`period-tracker/drive-oauth-proxy/`** (see its README) with secrets `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
7. Set `DRIVE_TOKEN_PROXY_URL` in `js/drive-config.js` to the Worker URL. Client ID may stay in that file; **secret must not**.

### Testing vs Production

| Mode | Use |
|------|-----|
| **Testing** + test users | Correct for this fork. |
| **In production** unverified | Often hard-blocks Drive scopes. Prefer Testing. |
| **Verified production** | Only if opening to the public. |

---

## OAuth flow (as implemented)

1. **Connect** → PKCE; store state/verifier/redirect in IndexedDB + localStorage; redirect to Google.
2. Google returns to the app with `?code=…` (PIN screen is normal).
3. App `POST`s `{ grant_type, code, code_verifier, redirect_uri }` to **token proxy** → proxy adds secret → Google token endpoint.
4. After unlock: connected toast, or restore prompt if remote backup exists.
5. Access token refresh also goes through the proxy (`grant_type=refresh_token`).

---

## `save()` and auto-backup

1. Encrypt state → write IndexedDB (local save).
2. **Separately** (never fails the local save): if auto-backup enabled → debounced upload.

---

## UX placement

Settings → **Security & Privacy**: Change PIN → local export/import → **Google Drive** → storage/erase.

---

## i18n

Drive UI / OAuth errors: **en, es, ja, zh-TW**.

---

## Non-goals (still deferred)

- Two-way sync / conflict resolution  
- Auto-restore without PIN  
- Deleting remote file on disconnect  
- Firebase hosting for this fork  

---

## Implementation notes (2026-07-23)

- **`wireDriveDb({ getFromDB, setInDB, deleteFromDB })`** — Called from `script.js` `init()` so `drive-sync.js` uses the same IndexedDB helpers as the rest of the app (module ↔ classic-script bridge).
- **`deleteFromDB`** — Waits for IndexedDB `transaction.oncomplete` before disconnect verification.
- **`_uploadTimer`** — Module-scoped debounce id for auto-backup; must be declared or disconnect throws when cancelling scheduled uploads.
- **IndexedDB loader** — Keep `indexeddb-storage.js` as a classic `<script defer>` before `script.js`; ES-module-only loader caused “Database Error” when Service Worker served mixed cache.
- **Deploy** — `git push period-tracker master` (not `origin`). Hard-refresh / unregister SW after deploys.

---

## Test checklist

- [x] Proxy deployed; `DRIVE_TOKEN_PROXY_URL` set; secret **not** in SPA  
- [x] Connect (test user) → PIN → connected  
- [x] Back up now / optional auto-backup  
- [x] Two-tap Disconnect → UI shows Connect only; Connect again works  
- [x] Restore from Drive on fresh device / after wipe  
- [ ] After secret rotate: Disconnect → Connect again  
- [x] Local save (e.g. fertility toggle) still works if Drive fails  

---

## References

- [Drive API — appDataFolder](https://developers.google.com/drive/api/guides/appdata)
- Proxy: [`../drive-oauth-proxy/README.md`](../drive-oauth-proxy/README.md)
- Handoff: [`HANDOFF.md`](./HANDOFF.md) §10
