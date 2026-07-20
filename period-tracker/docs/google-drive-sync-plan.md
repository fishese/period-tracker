# Google Drive backup — as built

**Status:** Shipped (2026-07-20) on this fork  
**Live app:** https://fishese.github.io/period-tracker/period-tracker/  
**Scope:** `period-tracker/` PWA (GitHub Pages — root `firebase.json` is unused)

Optional one-way encrypted backup to the user's own Google Drive. No app backend; the browser talks to Google APIs only after the user connects.

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
| **Disconnect** | Clears local OAuth tokens / file id; does **not** delete the Drive file |

Local Export / Import / drip CSV stay primary for most users. Drive section sits **below** those controls.

---

## Security model

| Layer | What happens |
|--------|----------------|
| **Hosting (GitHub Pages)** | Static files only. Never sees health data. |
| **Google Drive** | Encrypted blob only. Google sees metadata (size, modified time), not plaintext. |
| **Device** | PIN in memory; AES-256-GCM via Web Crypto (unchanged). |
| **OAuth tokens** | Refresh token in IndexedDB; revocable via Disconnect. |
| **Client secret** | Google **Web application** clients require `client_secret` on the token endpoint even with PKCE. In a SPA it ships in `drive-config.js` and is visible in the browser — acceptable for **Testing** mode + test users only. |

**In-app privacy copy** (combined with test-user note): encrypted file in a hidden app folder; ask **fishese** to add Google accounts to the OAuth test users list.

---

## Files

| Path | Role |
|------|------|
| `js/drive-sync.js` | PKCE OAuth, token exchange/refresh, upload/download, auto-backup scheduler |
| `js/drive-config.js` | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (live credentials; GitHub may block push until allowed) |
| `js/drive-config.example.js` | Setup instructions + placeholders |
| `js/script.js` | Settings UI hooks, `buildBackupBundle()`, restore prompt, `save()` isolation |
| `js/i18n.js` | Drive strings for **en / es / ja / zh-TW** |
| `index.html` | Drive section under local backup |
| `service-worker.js` | Caches `drive-sync.js` / `drive-config.js`; bump `CACHE_VERSION` on deploy |

### IndexedDB keys

- `mycyclekeeper_drive_refresh_token_v1`
- `mycyclekeeper_drive_file_id_v1`
- `mycyclekeeper_drive_last_sync_v1`
- `mycyclekeeper_drive_auto_v1`
- Ephemeral OAuth: state, verifier, redirect, pending exchange, errors (mirrored to **localStorage** so PWA ↔ system browser redirects can share PKCE state)

### Scope

`https://www.googleapis.com/auth/drive.appdata` only.

---

## Google Cloud setup (required)

1. Enable **Google Drive API**.
2. **OAuth consent screen** → **Testing** (recommended for this personal fork).
3. Add every allowed Gmail under **Test users** (strangers cannot finish OAuth otherwise).
4. **Credentials → OAuth 2.0 Client ID → Web application** (not Desktop).
5. **Authorized JavaScript origins:**
   - `https://fishese.github.io`
   - `http://localhost:8000`
6. **Authorized redirect URIs** (exact, trailing slash):
   - `https://fishese.github.io/period-tracker/period-tracker/`
   - `http://localhost:8000/period-tracker/`
7. Copy **Client ID** and **Client secret** into `js/drive-config.js`.

### Testing vs Production

| Mode | Use |
|------|-----|
| **Testing** + test users | Correct for this fork. Unverified-app warning is normal; use Advanced → continue. |
| **In production** unverified | Drive scopes often hard-block. Prefer Testing. |
| **Verified production** | Only if opening to the public (review process). |

Refreshing tokens in Testing may expire after ~7 days — user reconnects.

### Client secret in a public repo

- GitHub Push Protection may block commits containing the secret; allow via the unblock links if you intentionally ship it for Pages.
- Anyone can extract the secret from the live JS. Risk is mitigated by Testing + test-user allowlist; it is **not** equivalent to leaking a Google account password.
- Period data remains PIN-encrypted either way.

---

## OAuth flow (as implemented)

1. **Connect** → generate PKCE verifier/challenge; store state + verifier + redirect URI in IndexedDB **and** localStorage; redirect to Google.
2. Google returns to the app URL with `?code=…&state=…` (often lands on the **PIN** screen — expected).
3. On load: validate state, stage/exchange code for tokens (`client_id` + `client_secret` + `code_verifier` + `redirect_uri`).
4. After unlock: show connected toast, or prompt restore if a remote backup exists.
5. Service worker must **not** reload mid-OAuth while `code`/`error` are in the URL.

**Redirect URI** used for authorize and token exchange must be identical and match Console (pinned map in `getDriveRedirectUri()` for GitHub Pages / localhost).

### Common errors

| Symptom | Likely cause |
|---------|----------------|
| `client_secret is missing` | Secret not in `drive-config.js` or not deployed |
| Access blocked / not verified | Account not in Test users, or consent screen In production unverified |
| Redirect URI mismatch | Console URI ≠ app (check double `period-tracker` + trailing `/`) |
| Lost login session / state mismatch | PWA vs browser storage; retry in browser; localStorage mirror should help |
| Save Failed (historical) | Drive auto-backup check used to sit inside `save()`'s catch — **fixed**; local save is isolated from Drive |

---

## `save()` and auto-backup

1. Encrypt state → write IndexedDB (local save).
2. **Separately** (never fails the local save): if auto-backup enabled → `scheduleDriveBackupUpload` (~45s debounce) → upload bundle.

Manual **Back up now** still surfaces Drive errors in a modal.

---

## UX placement

Settings → **Security & Privacy**:

1. Change PIN  
2. Local export / import / drip CSV  
3. **Google Drive backup** (desc + privacy/test-user note + status + buttons + auto toggle)  
4. Storage / erase  

---

## i18n

Drive UI and OAuth error strings: **en, es, ja, zh-TW**.  
`drive_test_user_note` is `""` (retired); text lives inside `drive_privacy_note`. Empty `data-i18n-html` nodes are hidden by `applyI18n()`.

---

## Non-goals (still deferred)

- Two-way / multi-device merge or conflict resolution  
- Storing PIN or plaintext on Google  
- Auto-restore without confirmation + PIN  
- Replacing manual Export/Import  
- Firebase hosting / CSP for this fork  

---

## Test checklist

- [ ] Connect (test user) → PIN → “connected” toast  
- [ ] Back up now → status shows last backup date  
- [ ] Auto-backup: edit data, wait ~45s+, confirm Drive last-sync updates (optional)  
- [ ] Disconnect → reconnect  
- [ ] First connect with existing remote backup → restore / skip  
- [ ] Toggle fertility / save still works (local save not blocked by Drive)  
- [ ] Hard-refresh after deploy (`CACHE_VERSION` bump)  
- [ ] Localhost redirect URI when developing  

---

## References

- [Drive API — appDataFolder](https://developers.google.com/drive/api/guides/appdata)
- [OAuth 2.0 for web (auth code + PKCE)](https://developers.google.com/identity/protocols/oauth2/web-server)
- Setup copy: `period-tracker/js/drive-config.example.js`
- Handoff: [`HANDOFF.md`](./HANDOFF.md) §10
