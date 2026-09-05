import test from "node:test";
import assert from "node:assert/strict";
import { createStatePersistence } from "../persistence.js";

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

test("pending saves preserve snapshots, write order, and PIN rotation", async () => {
  const blocked = deferred();
  const writes = [];
  const persistence = createStatePersistence({
    getSalt: () => blocked.promise,
    encrypt: async (state, pin) => ({ state, pin }),
    write: async (encrypted, hash) => { writes.push({ ...encrypted, hash }); },
  });
  const state = { logs: { note: "first" } };
  const first = persistence.save(state, "1234");
  state.logs.note = "latest";
  const second = persistence.save(state, "1234");
  const rotation = persistence.save(state, "5678", "new-hash");
  // Simulate edits being cleared by lock while salt/encryption is pending.
  state.logs = {};
  blocked.resolve(new Uint8Array(16));
  await Promise.all([first, second, rotation]);
  assert.deepEqual(writes.map(w => [w.state.logs.note, w.pin, w.hash]), [
    ["first", "1234", null], ["latest", "1234", null], ["latest", "5678", "new-hash"],
  ]);
});

test("a failed save does not block retry, and erase runs after pending writes", async () => {
  const events = [];
  let fail = true;
  const persistence = createStatePersistence({
    getSalt: async () => new Uint8Array(16),
    encrypt: async data => data,
    write: async () => {
      if (fail) { fail = false; throw new Error("quota"); }
      events.push("saved");
    },
  });
  await assert.rejects(persistence.save({}, "1234"), /quota/);
  const retry = persistence.save({}, "1234");
  const clear = persistence.enqueue(async () => events.push("erased"));
  await Promise.all([retry, clear]);
  assert.deepEqual(events, ["saved", "erased"]);
  await assert.rejects(persistence.save({}, null), /not_unlocked/);
});
