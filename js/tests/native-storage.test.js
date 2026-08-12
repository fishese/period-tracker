import test from "node:test";
import assert from "node:assert/strict";

let storedEntries = null;
let systemBarOptions = null;
globalThis.Capacitor = {
  getPlatform: () => "android",
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
    SystemBars: {
      async setStyle(options) {
        systemBarOptions = options;
      },
    },
  },
};

await import("../indexeddb-storage.js");
const { setStatusBarStyle } = await import("../native.js");

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

test("native status bar content follows the rendered theme brightness", async () => {
  await setStatusBarStyle(true);
  assert.deepEqual(systemBarOptions, {
    style: "LIGHT",
    bar: "StatusBar",
  });

  await setStatusBarStyle(false);
  assert.deepEqual(systemBarOptions, {
    style: "DARK",
    bar: "StatusBar",
  });
});
