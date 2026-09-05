import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { today } from "../dateUtils.js";

const refreshKey = "mycyclekeeper_drive_refresh_token_v1";
const fileKey = "mycyclekeeper_drive_file_id_v1";
const toastKey = "mycyclekeeper_drive_show_connected_toast";
let drive, db, authorization, clearedTokens;
let serial = 0;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};

beforeEach(async () => {
  db = new Map([[refreshKey, "native_google_authorization_v1"]]);
  clearedTokens = [];
  authorization = async () => ({ accessToken: "token" });
  globalThis.Capacitor = {
    getPlatform: () => "android",
    Plugins: {
      NativeSecure: {},
      DriveAuthorization: {
        authorize: options => authorization(options),
        clearToken: async ({ accessToken }) => { clearedTokens.push(accessToken); },
      },
    },
  };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true } });
  const ls = new Map();
  globalThis.localStorage = {
    getItem: key => ls.get(key) ?? null,
    setItem: (key, value) => ls.set(key, value),
    removeItem: key => ls.delete(key),
  };
  drive = await import(`../drive-sync.js?case=${++serial}`);
  drive.wireDriveDb({
    getFromDB: async key => db.get(key) ?? null,
    setInDB: async (key, value) => { db.set(key, value); },
    deleteFromDB: async key => { db.delete(key); },
  });
});

test("Android clears a rejected cached token and retries once with a fresh token", async () => {
  authorization = async () => ({ accessToken: clearedTokens.length ? "fresh" : "expired" });
  const headers = [];
  globalThis.fetch = async (_url, options) => {
    headers.push(options.headers.Authorization);
    return options.headers.Authorization === "Bearer expired"
      ? json({}, 401) : json({ files: [{ id: "backup" }] });
  };
  assert.equal((await drive.findExistingBackup()).fileId, "backup");
  assert.deepEqual(headers, ["Bearer expired", "Bearer fresh"]);
  assert.deepEqual(clearedTokens, ["expired"]);
});

test("a second 401 terminates instead of endlessly retrying", async () => {
  let requests = 0;
  globalThis.fetch = async () => { requests++; return json({}, 401); };
  await assert.rejects(drive.findExistingBackup(), /reconnect_required/);
  assert.equal(requests, 2);
});

test("concurrent first uploads create one file and leave the newest snapshot", async () => {
  const firstCreate = deferred();
  const started = deferred();
  let created = 0, content = "";
  globalThis.fetch = async (url, options) => {
    if (options.method === "POST") {
      created++;
      started.resolve();
      await firstCreate.promise;
      content = "old";
      return json({ id: "backup" });
    }
    if (options.method === "PATCH") { content = options.body; return json({ id: "backup" }); }
    if (url.includes("spaces=")) return json({ files: [] });
    return json({ id: "backup" });
  };
  const first = drive.uploadDriveBackup("old");
  await started.promise;
  const second = drive.uploadDriveBackup("new");
  firstCreate.resolve();
  await Promise.all([first, second]);
  assert.equal(created, 1);
  assert.equal(content, "new");
  assert.equal(db.get("mycyclekeeper_drive_last_sync_v1"), today());
});

test("upload recovers if the remembered remote backup was deleted", async () => {
  db.set(fileKey, "deleted");
  const methods = [];
  globalThis.fetch = async (_url, options) => {
    methods.push(options.method || "GET");
    if (options.method === "PATCH") return json({}, 404);
    return json({ id: "replacement" });
  };
  await drive.uploadDriveBackup("encrypted bundle");
  assert.equal(db.get(fileKey), "replacement");
  assert.deepEqual(methods, ["PATCH", "POST", "GET"]);
});

test("restore rediscovers a deleted/replaced backup and clears stale ids", async () => {
  db.set(fileKey, "deleted");
  globalThis.fetch = async url => url.includes("spaces=")
    ? json({ files: [] }) : json({}, 404);
  assert.equal(await drive.downloadDriveBackup(), null);
  assert.equal(db.has(fileKey), false);
});

test("a lookup failure is not reported as a successful connection with no backup", async () => {
  globalThis.fetch = async () => json({}, 503);
  await assert.rejects(drive.startDriveConnect(), /drive_list_failed/);
  assert.equal(db.has(toastKey), false);
});

test("repeated connect clicks share one authorization and disconnect cancels its result", async () => {
  const pending = deferred();
  let calls = 0;
  authorization = () => { calls++; return pending.promise; };
  const first = drive.startDriveConnect();
  const second = drive.startDriveConnect();
  assert.equal(first, second);
  const rejected = assert.rejects(first, /not_connected/);
  await drive.disconnectDrive();
  pending.resolve({ accessToken: "late-token" });
  await rejected;
  assert.equal(calls, 1);
  assert.equal(await drive.isDriveConnected(), false);
});

test("web connect continues to use PKCE and the canonical redirect", async () => {
  delete globalThis.Capacitor;
  globalThis.window = { location: { origin: "https://period.fishese.cc", pathname: "/index.html" } };
  await drive.startDriveConnect();
  const url = new URL(window.location.href);
  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.searchParams.get("redirect_uri"), "https://period.fishese.cc/");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("state"));
});

test("a web proxy configuration error does not discard a valid refresh token", async () => {
  delete globalThis.Capacitor;
  db.set(refreshKey, "real-refresh-token");
  globalThis.fetch = async () => json({ error: "invalid_client" }, 400);
  await assert.rejects(drive.findExistingBackup(), /token_refresh_failed/);
  assert.equal(db.get(refreshKey), "real-refresh-token");
});

test("web OAuth completion reports backup lookup errors without an unhandled rejection", async () => {
  delete globalThis.Capacitor;
  db.set("mycyclekeeper_drive_oauth_pending_exchange", {
    code: "one-time-code", verifier: "verifier", redirectUri: "https://period.fishese.cc/",
    ts: Date.now(), pendingConnect: true,
  });
  globalThis.fetch = async url => url.includes("googleapis.com/drive/")
    ? json({}, 503) : json({ refresh_token: "refresh", access_token: "access" });
  assert.deepEqual(await drive.completePendingDriveOAuth(), {
    status: "error", error: "drive_list_failed",
  });
  assert.equal(db.has(toastKey), false);
});
