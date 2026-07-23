"use strict";

/**
 * Public OAuth client config (safe to ship in the browser).
 * The Client secret must NEVER live here — use drive-oauth-proxy/ instead.
 *
 * See drive-config.example.js and docs/google-drive-sync-plan.md.
 */
export const GOOGLE_CLIENT_ID =
  "541116003915-rj3jb8lfmhbujtf9d0d5trs3vs2p3ufh.apps.googleusercontent.com";

/**
 * URL of the token-exchange worker (Cloudflare Worker, etc.).
 * Example: "https://mycyclekeeper-drive-oauth.fishese.workers.dev"
 * Leave empty until the proxy is deployed — Drive connect stays disabled.
 */
export const DRIVE_TOKEN_PROXY_URL = "";
