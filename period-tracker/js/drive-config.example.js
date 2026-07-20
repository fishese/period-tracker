"use strict";

/**
 * Copy values into drive-config.js (Client ID + proxy URL only).
 * NEVER put GOOGLE_CLIENT_SECRET in the browser or in this public repo.
 *
 * Setup:
 * 1. Google Cloud Console → enable Drive API
 * 2. OAuth consent screen → Testing → add test users
 * 3. Credentials → Web application client:
 *    Origins: https://fishese.github.io , http://localhost:8000
 *    Redirects:
 *      https://fishese.github.io/period-tracker/period-tracker/
 *      http://localhost:8000/period-tracker/
 * 4. Deploy period-tracker/drive-oauth-proxy/ (see its README) with
 *    GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET as Worker secrets
 * 5. Set DRIVE_TOKEN_PROXY_URL below to the Worker URL
 * 6. If Google emailed you about a leaked secret: rotate/reset the secret
 *    in Console first, then put only the NEW secret on the Worker
 */
export const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
export const DRIVE_TOKEN_PROXY_URL = "https://YOUR_WORKER.workers.dev";
