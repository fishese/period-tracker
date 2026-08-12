import test from "node:test";
import assert from "node:assert/strict";

globalThis.document = {
  getElementById() {
    return null;
  },
};

const session = await import("../session.js");

test("session expiry is based on elapsed wall time", () => {
  session.setSessionTimers(null, null, 1_000);
  assert.equal(session.hasSessionExpired(300_999), false);
  assert.equal(session.hasSessionExpired(301_000), true);
});

test("activity after expiry locks instead of extending the session", () => {
  let locks = 0;
  session.setLockApp(() => { locks += 1; });
  session.setSessionTimers(null, null, 1_000);
  assert.equal(session.handleSessionActivity(301_000), false);
  assert.equal(locks, 1);
});
