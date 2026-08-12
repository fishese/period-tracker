import test from "node:test";
import assert from "node:assert/strict";

let storedEntries = null;
globalThis.Capacitor = {
  Plugins: {
    NativeSecure: {
      async storageGet({ key }) {
        return storedEntries && key in storedEntries
          ? { value: storedEntries[key] }
          : {};
      },
      async storageSetMany({ entries }) {
        storedEntries = { ...(storedEntries || {}), ...entries };
      },
    },
  },
};

await import("../indexeddb-storage.js");

test("native storage multi-write serializes all values in one bridge call", async () => {
  await globalThis.setManyInDB([
    ["encrypted", "ciphertext"],
    ["pinHash", "digest"],
  ]);
  assert.deepEqual(storedEntries, {
    encrypted: '"ciphertext"',
    pinHash: '"digest"',
  });
  assert.equal(await globalThis.getFromDB("encrypted"), "ciphertext");
});

test("native backend is detected without opening browser IndexedDB", () => {
  assert.equal(globalThis.isNativeStorageBackend(), true);
});
