"use strict";

import { GOOGLE_CLIENT_ID, DRIVE_TOKEN_PROXY_URL } from "./drive-config.js";

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
const OAUTH_PENDING_EXCHANGE_KEY = "mycyclekeeper_drive_oauth_pending_exchange";
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

function normalizeRedirectPath(pathname) {
  let path = pathname.replace(/\/index\.html$/i, "");
  if (!path.endsWith("/")) path += "/";
  return path;
}

/** Redirect URI for OAuth — must match authorize + token requests and Google Console. */
export function getDriveRedirectUri() {
  const canonical = DRIVE_REDIRECT_BY_ORIGIN[window.location.origin];
  if (canonical) return canonical;
  return window.location.origin + normalizeRedirectPath(window.location.pathname);
}

async function idbGet(key) {
  try {
    return await globalThis.getFromDB(key);
  } catch (err) {
    console.warn("[Drive] idbGet failed:", key, err);
    return null;
  }
}

async function idbSet(key, value) {
  await globalThis.setInDB(key, value);
}

async function idbDel(key) {
  if (typeof globalThis.deleteFromDB !== "function") {
    throw new Error("idb_unavailable");
  }
  await globalThis.deleteFromDB(key);
}

function lsSuffix(idbKey) {
  if (idbKey === OAUTH_VERIFIER_KEY) return "verifier";
  if (idbKey === OAUTH_STATE_KEY) return "state";
  if (idbKey === OAUTH_PENDING_CONNECT_KEY) return "pending";
  if (idbKey === OAUTH_REDIRECT_KEY) return "redirect";
  if (idbKey === OAUTH_CODE_USED_KEY) return "code_used";
  return idbKey;
}

function lsGet(key) {
  try {
    return localStorage.getItem(OAUTH_LS_PREFIX + lsSuffix(key));
  } catch (_) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(OAUTH_LS_PREFIX + lsSuffix(key), value);
  } catch (_) {
    /* quota / private mode — IndexedDB still used */
  }
}

function lsDel(key) {
  try {
    localStorage.removeItem(OAUTH_LS_PREFIX + lsSuffix(key));
  } catch (_) {}
}

/** OAuth PKCE/state: write to localStorage first (sync, survives redirect), then IndexedDB. */
async function oauthSet(key, value) {
  lsSet(key, value);
  await idbSet(key, value);
}

async function oauthGet(key) {
  const fromLs = lsGet(key);
  if (fromLs != null && fromLs !== "") return fromLs;
  const fromIdb = await idbGet(key);
  if (fromIdb != null && fromIdb !== "") return fromIdb;
  return null;
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

export function isDriveConfigured() {
  return (
    typeof GOOGLE_CLIENT_ID === "string" &&
    GOOGLE_CLIENT_ID.length > 10 &&
    !GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID") &&
    typeof DRIVE_TOKEN_PROXY_URL === "string" &&
    /^https:\/\//i.test(DRIVE_TOKEN_PROXY_URL)
  );
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

async function postTokenViaProxy(payload) {
  if (!isDriveConfigured()) throw new Error("token_proxy_missing");
  const res = await fetch(DRIVE_TOKEN_PROXY_URL.replace(/\/$/, ""), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* ignore */
  }
  if (!res.ok) {
    const detail =
      (data && (data.error_description || data.error)) ||
      `http_${res.status}`;
    throw new Error(
      typeof detail === "string" && detail.includes(":")
        ? `token_exchange_failed:${res.status}:${detail}`
        : `token_exchange_failed:${res.status}:${detail}`
    );
  }
  return data;
}

async function exchangeCodeForTokens(code, verifier, redirectUri) {
  return postTokenViaProxy({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
}

async function getAccessToken() {
  const refresh = await idbGet(DRIVE_REFRESH_TOKEN_KEY);
  if (!refresh) throw new Error("not_connected");

  try {
    const data = await postTokenViaProxy({
      grant_type: "refresh_token",
      refresh_token: refresh,
    });
    if (!data?.access_token) throw new Error("token_refresh_failed");
    return data.access_token;
  } catch (e) {
    const msg = String(e.message || "");
    if (msg.includes(":400:") || msg.includes("invalid_grant")) {
      await disconnectDrive();
      throw new Error("reconnect_required");
    }
    throw new Error("token_refresh_failed");
  }
}

async function driveApiError(prefix, res) {
  let detail = `http_${res.status}`;
  try {
    const body = await res.json();
    detail =
      body?.error?.message ||
      body?.error_description ||
      body?.error ||
      detail;
  } catch (_) {
    /* non-JSON error body */
  }
  return new Error(`${prefix}:${res.status}:${detail}`);
}

async function verifyBackupOnDrive(fileId, accessToken) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,modifiedTime,size`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw await driveApiError("drive_verify_failed", res);
  const meta = await res.json();
  if (!meta?.id) throw new Error("drive_verify_failed");
  return meta;
}

async function finishConnectFlow(pendingConnect) {
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
}

export async function hasPendingDriveOAuthExchange() {
  return !!(await idbGet(OAUTH_PENDING_EXCHANGE_KEY));
}

/**
 * Complete token exchange after PIN unlock (Google redirect lands on lock screen).
 */
export async function completePendingDriveOAuth() {
  const raw = await idbGet(OAUTH_PENDING_EXCHANGE_KEY);
  if (!raw) return { status: "none" };

  let pending;
  try {
    pending = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    await setDriveOAuthError("state_mismatch");
    return { status: "error", error: "state_mismatch" };
  }

  if (!pending?.code || !pending?.verifier || !pending?.redirectUri) {
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    await setDriveOAuthError("state_mismatch");
    return { status: "error", error: "state_mismatch" };
  }

  if (Date.now() - (pending.ts || 0) > 10 * 60 * 1000) {
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    await setDriveOAuthError("code_expired");
    return { status: "error", error: "code_expired" };
  }

  const usedCode = await oauthGet(OAUTH_CODE_USED_KEY);
  if (usedCode === pending.code) {
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    return { status: "none" };
  }

  try {
    const data = await exchangeCodeForTokens(
      pending.code,
      pending.verifier,
      pending.redirectUri
    );
    await oauthSet(OAUTH_CODE_USED_KEY, pending.code);
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    await clearOAuthSessionKeys();

    if (data.refresh_token) {
      await idbSet(DRIVE_REFRESH_TOKEN_KEY, data.refresh_token);
    } else if (!(await idbGet(DRIVE_REFRESH_TOKEN_KEY))) {
      await setDriveOAuthError("no_refresh_token");
      return { status: "error", error: "no_refresh_token" };
    }

    return finishConnectFlow(!!pending.pendingConnect);
  } catch (e) {
    await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
    const msg = e.message || "token_exchange_failed";
    await setDriveOAuthError(msg);
    return { status: "error", error: msg };
  }
}

/**
 * Call on page load (before unlock). Validates Google redirect and stages the
 * authorization code for exchange after PIN unlock.
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
  const redirectUri = await oauthGet(OAUTH_REDIRECT_KEY);
  if (!redirectUri) {
    cleanOAuthParamsFromUrl();
    await setDriveOAuthError("state_mismatch:no_redirect");
    await clearOAuthSessionKeys();
    return { status: "error", error: "state_mismatch:no_redirect" };
  }

  if (!verifier || !state || state !== expectedState) {
    cleanOAuthParamsFromUrl();
    const detail = !verifier ? "state_mismatch:no_verifier" : "state_mismatch";
    await setDriveOAuthError(detail);
    await clearOAuthSessionKeys();
    return { status: "error", error: detail };
  }

  await idbSet(
    OAUTH_PENDING_EXCHANGE_KEY,
    JSON.stringify({
      code,
      verifier,
      redirectUri,
      pendingConnect,
      ts: Date.now(),
    })
  );
  await clearOAuthSessionKeys();
  cleanOAuthParamsFromUrl();
  return completePendingDriveOAuth();
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
  await idbDel(DRIVE_LAST_SYNC_KEY);
  await idbDel(DRIVE_AUTO_KEY);
  await idbDel(DRIVE_PENDING_RESTORE_KEY);
  await idbDel(OAUTH_PENDING_EXCHANGE_KEY);
  await idbDel(OAUTH_ERROR_KEY);
  await clearOAuthSessionKeys();
  const remaining = await globalThis.getFromDB(DRIVE_REFRESH_TOKEN_KEY);
  if (remaining) {
    throw new Error("disconnect_failed");
  }
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
    if (!res.ok) throw await driveApiError("drive_upload_failed", res);
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
    if (!res.ok) throw await driveApiError("drive_upload_failed", res);
    const data = await res.json();
    if (!data?.id) throw new Error("drive_upload_failed:no_file_id");
    fileId = data.id;
    await idbSet(DRIVE_FILE_ID_KEY, fileId);
  }

  await verifyBackupOnDrive(fileId, accessToken);

  const syncDate = new Date().toISOString().slice(0, 10);
  await idbSet(DRIVE_LAST_SYNC_KEY, syncDate);
  return syncDate;
}

/** Map stored OAuth error codes to i18n keys. */
export function getDriveOAuthErrorKey(err) {
  if (!err) return "drive_sync_failed_msg";
  if (err === "state_mismatch" || String(err).startsWith("state_mismatch"))
    return "drive_oauth_state_mismatch";
  if (err === "code_expired") return "drive_oauth_code_expired";
  if (err === "no_refresh_token") return "drive_oauth_no_refresh";
  if (err === "access_denied") return "drive_oauth_access_denied";
  const lower = String(err).toLowerCase();
  if (lower.includes("redirect_uri_mismatch")) return "drive_oauth_redirect_mismatch";
  if (
    lower.includes("client_secret") ||
    lower.includes("token_proxy_missing") ||
    lower.includes("proxy_misconfigured")
  ) {
    return "drive_oauth_missing_secret";
  }
  if (lower.includes("invalid_grant")) return "drive_oauth_invalid_grant";
  return "drive_sync_failed_msg";
}

/** Human-readable detail from stored OAuth error (for modal). */
export function getDriveOAuthErrorDetail(err) {
  if (!err) return "";
  const str = String(err);
  const tokenIdx = str.indexOf("token_exchange_failed:");
  if (tokenIdx === -1) return str;
  const tail = str.slice(tokenIdx + "token_exchange_failed:".length);
  const colon = tail.indexOf(":");
  if (colon === -1) return tail;
  return tail.slice(colon + 1);
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
