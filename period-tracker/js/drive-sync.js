"use strict";

import { GOOGLE_CLIENT_ID } from "./drive-config.js";

const DRIVE_REFRESH_TOKEN_KEY = "mycyclekeeper_drive_refresh_token_v1";
const DRIVE_FILE_ID_KEY = "mycyclekeeper_drive_file_id_v1";
const DRIVE_LAST_SYNC_KEY = "mycyclekeeper_drive_last_sync_v1";
const DRIVE_AUTO_KEY = "mycyclekeeper_drive_auto_v1";
const BACKUP_FILENAME = "mycyclekeeper_backup.bin";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

const OAUTH_STATE_KEY = "mycyclekeeper_drive_oauth_state";
const OAUTH_VERIFIER_KEY = "mycyclekeeper_drive_oauth_verifier";
const OAUTH_PENDING_CONNECT_KEY = "mycyclekeeper_drive_pending_connect";
const OAUTH_REDIRECT_KEY = "mycyclekeeper_drive_oauth_redirect";
const OAUTH_ERROR_KEY = "mycyclekeeper_drive_oauth_error";
const SHOW_CONNECTED_KEY = "mycyclekeeper_drive_show_connected_toast";
const OAUTH_CODE_USED_KEY = "mycyclekeeper_drive_oauth_code_used";
export const DRIVE_PENDING_RESTORE_KEY = "mycyclekeeper_drive_pending_restore";

/** Ephemeral OAuth keys — mirrored to localStorage so PWA ↔ browser redirect can share state. */
const OAUTH_LS_PREFIX = "mycyclekeeper_drive_oauth_";

/** Must match Google Cloud Console redirect URIs exactly. */
const DRIVE_REDIRECT_BY_ORIGIN = {
  "https://fishese.github.io": "https://fishese.github.io/period-tracker/period-tracker/",
  "http://localhost:8000": "http://localhost:8000/period-tracker/",
  "http://127.0.0.1:8000": "http://127.0.0.1:8000/period-tracker/",
};

function idb() {
  if (typeof globalThis.getFromDB !== "function") {
    throw new Error("idb_unavailable");
  }
  return globalThis;
}

async function idbGet(key) {
  return idb().getFromDB(key);
}

async function idbSet(key, value) {
  await idb().setInDB(key, value);
}

async function idbDel(key) {
  await idb().deleteFromDB(key);
}

function lsGet(key) {
  try {
    return localStorage.getItem(OAUTH_LS_PREFIX + key);
  } catch (_) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(OAUTH_LS_PREFIX + key, value);
  } catch (_) {
    /* quota / private mode — IndexedDB still used */
  }
}

function lsDel(key) {
  try {
    localStorage.removeItem(OAUTH_LS_PREFIX + key);
  } catch (_) {}
}

/** OAuth PKCE/state: write to IndexedDB + localStorage (PWA and browser tab share localStorage). */
async function oauthSet(key, value) {
  lsSet(key, value);
  await idbSet(key, value);
}

async function oauthGet(key) {
  const fromIdb = await idbGet(key);
  if (fromIdb != null && fromIdb !== "") return fromIdb;
  return lsGet(key);
}

async function oauthDel(key) {
  lsDel(key);
  await idbDel(key);
}

async function clearOAuthSessionKeys() {
  await oauthDel(OAUTH_STATE_KEY);
  await oauthDel(OAUTH_VERIFIER_KEY);
  await oauthDel(OAUTH_PENDING_CONNECT_KEY);
  await oauthDel(OAUTH_REDIRECT_KEY);
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePkce() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(verifierBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64UrlEncode(new Uint8Array(digest));
  return { verifier, challenge };
}

/** Redirect URI must match Google Cloud Console entry exactly. */
export function getDriveRedirectUri() {
  const fixed = DRIVE_REDIRECT_BY_ORIGIN[window.location.origin];
  if (fixed) return fixed;
  let path = window.location.pathname.replace(/\/index\.html$/i, "");
  if (!path.endsWith("/")) path += "/";
  return window.location.origin + path;
}

export function isDriveConfigured() {
  return typeof GOOGLE_CLIENT_ID === "string" && GOOGLE_CLIENT_ID.length > 10;
}

export async function isDriveConnected() {
  return !!(await idbGet(DRIVE_REFRESH_TOKEN_KEY));
}

export async function isDriveAutoBackupEnabled() {
  return (await idbGet(DRIVE_AUTO_KEY)) === true;
}

export async function setDriveAutoBackup(enabled) {
  await idbSet(DRIVE_AUTO_KEY, !!enabled);
}

export async function getDriveLastSyncTime() {
  return idbGet(DRIVE_LAST_SYNC_KEY);
}

export async function consumeDriveOAuthError() {
  const err = await idbGet(OAUTH_ERROR_KEY);
  if (err) await idbDel(OAUTH_ERROR_KEY);
  return err;
}

export async function consumeDriveShowConnectedToast() {
  const v = await idbGet(SHOW_CONNECTED_KEY);
  if (v === "1") await idbDel(SHOW_CONNECTED_KEY);
  return v === "1";
}

export async function consumeDrivePendingRestore() {
  const v = await idbGet(DRIVE_PENDING_RESTORE_KEY);
  if (v === "1") await idbDel(DRIVE_PENDING_RESTORE_KEY);
  return v === "1";
}

async function setDriveOAuthError(error) {
  await idbSet(OAUTH_ERROR_KEY, error || "unknown");
}

function cleanOAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  if (
    !url.searchParams.has("code") &&
    !url.searchParams.has("error") &&
    !url.searchParams.has("state")
  ) {
    return;
  }
  ["code", "state", "scope", "authuser", "prompt", "error"].forEach((k) =>
    url.searchParams.delete(k)
  );
  history.replaceState({}, "", url.pathname + url.search + url.hash);
}

async function exchangeCodeForTokens(code, verifier, redirectUri) {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = json.error || json.error_description || "";
    } catch (_) {
      /* ignore */
    }
    throw new Error(
      detail
        ? `token_exchange_failed:${res.status}:${detail}`
        : `token_exchange_failed:${res.status}`
    );
  }
  return res.json();
}

async function getAccessToken() {
  const refresh = await idbGet(DRIVE_REFRESH_TOKEN_KEY);
  if (!refresh) throw new Error("not_connected");

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    if (res.status === 400) {
      await disconnectDrive();
      throw new Error("reconnect_required");
    }
    throw new Error("token_refresh_failed");
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * Call on page load (before unlock). Exchanges OAuth code if present and stores
 * tokens. Sets IndexedDB flags for post-unlock restore prompt when needed.
 */
export async function handleDriveOAuthReturn() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    cleanOAuthParamsFromUrl();
    await setDriveOAuthError(error);
    await clearOAuthSessionKeys();
    return { status: "error", error };
  }
  if (!code) return { status: "none" };

  const usedCode = await oauthGet(OAUTH_CODE_USED_KEY);
  if (usedCode === code) {
    cleanOAuthParamsFromUrl();
    return { status: "none" };
  }

  const expectedState = await oauthGet(OAUTH_STATE_KEY);
  const verifier = await oauthGet(OAUTH_VERIFIER_KEY);
  const pendingConnect = (await oauthGet(OAUTH_PENDING_CONNECT_KEY)) === "1";
  const redirectUri =
    (await oauthGet(OAUTH_REDIRECT_KEY)) || getDriveRedirectUri();

  if (!verifier || !state || state !== expectedState) {
    cleanOAuthParamsFromUrl();
    await setDriveOAuthError("state_mismatch");
    await clearOAuthSessionKeys();
    return { status: "error", error: "state_mismatch" };
  }

  try {
    const data = await exchangeCodeForTokens(code, verifier, redirectUri);
    await oauthSet(OAUTH_CODE_USED_KEY, code);
    await clearOAuthSessionKeys();
    cleanOAuthParamsFromUrl();

    if (data.refresh_token) {
      await idbSet(DRIVE_REFRESH_TOKEN_KEY, data.refresh_token);
    } else if (!(await idbGet(DRIVE_REFRESH_TOKEN_KEY))) {
      await setDriveOAuthError("no_refresh_token");
      return { status: "error", error: "no_refresh_token" };
    }

    if (pendingConnect) {
      let existing = null;
      try {
        existing = await findExistingBackup();
      } catch (_) {
        /* list may fail offline — connect still succeeded */
      }
      if (existing) {
        await idbSet(DRIVE_PENDING_RESTORE_KEY, "1");
      } else {
        await idbSet(SHOW_CONNECTED_KEY, "1");
      }
      return { status: "connected", existingBackup: existing };
    }
    return { status: "connected", existingBackup: null };
  } catch (e) {
    cleanOAuthParamsFromUrl();
    await clearOAuthSessionKeys();
    const msg = e.message || "token_exchange_failed";
    await setDriveOAuthError(msg);
    return { status: "error", error: msg };
  }
}

export async function startDriveConnect() {
  if (!isDriveConfigured()) throw new Error("not_configured");
  if (!navigator.onLine) throw new Error("offline");

  const { verifier, challenge } = await generatePkce();
  const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));
  const redirectUri = getDriveRedirectUri();
  await oauthDel(OAUTH_CODE_USED_KEY);
  await oauthSet(OAUTH_VERIFIER_KEY, verifier);
  await oauthSet(OAUTH_STATE_KEY, state);
  await oauthSet(OAUTH_PENDING_CONNECT_KEY, "1");
  await oauthSet(OAUTH_REDIRECT_KEY, redirectUri);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function disconnectDrive() {
  await idbDel(DRIVE_REFRESH_TOKEN_KEY);
  await idbDel(DRIVE_FILE_ID_KEY);
}

export async function findExistingBackup() {
  const accessToken = await getAccessToken();
  const q = encodeURIComponent(
    `name='${BACKUP_FILENAME}' and trashed=false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("drive_list_failed");
  const data = await res.json();
  if (!data.files?.length) return null;
  const file = data.files[0];
  await idbSet(DRIVE_FILE_ID_KEY, file.id);
  return { fileId: file.id, modifiedTime: file.modifiedTime };
}

export async function downloadDriveBackup() {
  let fileId = await idbGet(DRIVE_FILE_ID_KEY);
  if (!fileId) {
    const found = await findExistingBackup();
    if (!found) return null;
    fileId = found.fileId;
  }
  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("drive_download_failed");
  return res.text();
}

export async function uploadDriveBackup(bundleString) {
  if (!navigator.onLine) throw new Error("offline");
  const accessToken = await getAccessToken();
  let fileId = await idbGet(DRIVE_FILE_ID_KEY);

  if (!fileId) {
    const found = await findExistingBackup();
    if (found) fileId = found.fileId;
  }

  if (fileId) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: bundleString,
      }
    );
    if (!res.ok) throw new Error("drive_upload_failed");
  } else {
    const metadata = { name: BACKUP_FILENAME, parents: ["appDataFolder"] };
    const boundary = "mycyclekeeper_" + Date.now();
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n` +
      bundleString +
      `\r\n--${boundary}--`;
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
    if (!res.ok) throw new Error("drive_upload_failed");
    const data = await res.json();
    await idbSet(DRIVE_FILE_ID_KEY, data.id);
  }

  const syncDate = new Date().toISOString().slice(0, 10);
  await idbSet(DRIVE_LAST_SYNC_KEY, syncDate);
  return syncDate;
}

/** Map stored OAuth error codes to i18n key suffixes. */
export function getDriveOAuthErrorKey(err) {
  if (!err) return "drive_sync_failed_msg";
  if (err === "state_mismatch") return "drive_oauth_state_mismatch";
  if (err === "no_refresh_token") return "drive_oauth_no_refresh";
  if (err === "access_denied") return "drive_oauth_access_denied";
  const lower = String(err).toLowerCase();
  if (
    lower.includes("redirect_uri_mismatch") ||
    lower.includes("invalid_grant") ||
    lower.includes("token_exchange_failed:400")
  ) {
    return "drive_oauth_redirect_mismatch";
  }
  return "drive_sync_failed_msg";
}

/** Debounced upload hook — call from save() when auto-backup is enabled. */
export function scheduleDriveBackupUpload(uploadFn) {
  clearTimeout(_uploadTimer);
  _uploadTimer = setTimeout(() => {
    uploadFn().catch((err) => console.warn("[Drive backup]", err));
  }, 45000);
}

export function cancelScheduledDriveBackupUpload() {
  clearTimeout(_uploadTimer);
}
