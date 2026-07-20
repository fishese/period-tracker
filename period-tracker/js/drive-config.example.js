"use strict";

/**
 * Copy this file to drive-config.js and set your Google Cloud OAuth credentials.
 *
 * Setup (one-time):
 * 1. Google Cloud Console → APIs & Services → Enable Google Drive API
 * 2. OAuth consent screen (Testing mode is fine for personal use)
 * 3. Credentials → OAuth 2.0 Client ID → Web application
 * 4. Authorized JavaScript origins:
 *    - https://fishese.github.io
 *    - http://localhost:8000
 * 5. Authorized redirect URIs (must match exactly — note double period-tracker on GitHub Pages):
 *    - https://fishese.github.io/period-tracker/period-tracker/
 *    - http://localhost:8000/period-tracker/
 * 6. Copy both Client ID and Client secret into drive-config.js
 *
 * Note: Google Web clients require client_secret on the token endpoint even with
 * PKCE. In a browser SPA that value is visible in the downloaded JS — acceptable
 * for a personal Testing-mode app with test users only.
 *
 * GitHub repo URL (github.com/fishese/period-tracker) is NOT an OAuth origin — only
 * the live Pages URL above.
 */
export const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
export const GOOGLE_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
