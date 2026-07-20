"use strict";

/**
 * Copy this file to drive-config.js and set your Google Cloud OAuth client ID.
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
 * 6. Scope: drive.appdata only
 *
 * GitHub repo URL (github.com/fishese/period-tracker) is NOT an OAuth origin — only
 * the live Pages URL above. Root firebase.json in this repo is from upstream and is
 * not used for fishese.github.io hosting.
 */
export const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
