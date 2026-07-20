# Drive OAuth token proxy

Keeps the Google **Client secret** off GitHub Pages / the public SPA.

Google’s warning about a published client secret is expected if the secret was
ever committed or shipped in `drive-config.js`. Treat that secret as burned:
**rotate it in Google Cloud Console**, then store only the **new** secret here.

## One-time setup

### 1. Rotate the leaked secret (if Google emailed you)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Open your **Web application** OAuth client
3. **Reset secret** / add a new secret and disable the old one
4. Keep the Client ID (public) unchanged

### 2. Deploy this Worker (Cloudflare, free tier)

```bash
cd period-tracker/drive-oauth-proxy
npx wrangler login
npx wrangler secret put GOOGLE_CLIENT_ID      # paste Client ID
npx wrangler secret put GOOGLE_CLIENT_SECRET # paste NEW Client secret only
npx wrangler deploy
```

Copy the Worker URL (e.g. `https://mycyclekeeper-drive-oauth.<you>.workers.dev`).

### 3. Point the app at the Worker

In `period-tracker/js/drive-config.js`:

```js
export const GOOGLE_CLIENT_ID = "….apps.googleusercontent.com";
export const DRIVE_TOKEN_PROXY_URL = "https://mycyclekeeper-drive-oauth.<you>.workers.dev";
```

Commit/push **only** those two public values — never the secret.

### 4. Re-connect Drive in the app

Users who connected with the old secret should **Disconnect** and **Connect** again after deploy.

## What the Worker does

`POST` JSON:

- `{ grant_type: "authorization_code", code, code_verifier, redirect_uri }`
- `{ grant_type: "refresh_token", refresh_token }`

Forwards to `https://oauth2.googleapis.com/token` with `client_id` + `client_secret` from Worker secrets. CORS allows `https://fishese.github.io` and localhost.

## Security notes

- The Worker URL is public; it only helps attackers who already obtained a valid auth `code` for *your* OAuth client (redirect URI locked to your Pages URL).
- Keep OAuth consent screen in **Testing** + test users for this personal fork.
- Do not log secrets or tokens.
