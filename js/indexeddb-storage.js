/**
 * Persistent storage for My Cycle Keeper.
 *
 * Browser/PWA builds use IndexedDB. The Android wrapper registers the
 * NativeSecure Capacitor plugin, which stores the same serialized values in
 * the APK's private app data instead of sharing a browser storage partition.
 */

"use strict";

const DB_NAME = "mycyclekeeper";
const DB_VERSION = 1;
const STORE_NAME = "appdata";

let db = null;

function getNativeStoragePlugin() {
  return globalThis.Capacitor?.Plugins?.NativeSecure || null;
}

function isNativeStorageBackend() {
  return !!getNativeStoragePlugin();
}

function decodeNativeValue(result) {
  if (!result || typeof result.value !== "string") return null;
  return JSON.parse(result.value);
}

/** Initialize the active persistent storage backend. */
async function initIndexedDB() {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) return nativeStorage;

  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(
      request.error || new Error("IndexedDB initialization failed")
    );
    request.onblocked = () => reject(
      new Error("IndexedDB initialization is blocked by another open tab")
    );
    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db?.close();
        db = null;
      };
      db.onclose = () => {
        db = null;
      };
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getFromDB(key) {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    return decodeNativeValue(await nativeStorage.storageGet({ key }));
  }

  await initIndexedDB();
  return new Promise((resolve, reject) => {
    let request;
    try {
      const transaction = db.transaction([STORE_NAME], "readonly");
      request = transaction.objectStore(STORE_NAME).get(key);
    } catch (error) {
      db = null;
      reject(error);
      return;
    }
    request.onsuccess = () => resolve(
      request.result !== undefined ? request.result : null
    );
    request.onerror = () => reject(
      request.error || new Error(`Failed to read key "${key}"`)
    );
  });
}

async function setInDB(key, value) {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    await nativeStorage.storageSet({ key, value: JSON.stringify(value) });
    return;
  }
  await setManyInDB([[key, value]]);
}

/**
 * Atomically store several values.
 * @param {Array<[string, any]>} entries
 */
async function setManyInDB(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("setManyInDB requires at least one entry");
  }

  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    const encoded = {};
    for (const [key, value] of entries) {
      if (typeof key !== "string" || !key) throw new Error("Invalid storage key");
      encoded[key] = JSON.stringify(value);
    }
    await nativeStorage.storageSetMany({ entries: encoded });
    return;
  }

  await initIndexedDB();
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      for (const [key, value] of entries) store.put(value, key);
    } catch (error) {
      db = null;
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error("Failed to write values to database")
    );
    transaction.onabort = () => reject(
      transaction.error || new Error("Database write was aborted")
    );
  });
}

async function deleteFromDB(key) {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    await nativeStorage.storageRemove({ key });
    return;
  }

  await initIndexedDB();
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.objectStore(STORE_NAME).delete(key);
    } catch (error) {
      db = null;
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error(`Failed to delete key "${key}"`)
    );
    transaction.onabort = () => reject(
      transaction.error || new Error("Database delete was aborted")
    );
  });
}

async function clearDB() {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    await nativeStorage.storageClear();
    return;
  }

  await initIndexedDB();
  return new Promise((resolve, reject) => {
    let transaction;
    try {
      transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.objectStore(STORE_NAME).clear();
    } catch (error) {
      db = null;
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error("Failed to clear database")
    );
    transaction.onabort = () => reject(
      transaction.error || new Error("Database clear was aborted")
    );
  });
}

async function getAllKeysFromDB() {
  const nativeStorage = getNativeStoragePlugin();
  if (nativeStorage) {
    const result = await nativeStorage.storageKeys();
    return Array.isArray(result?.keys) ? result.keys : [];
  }

  await initIndexedDB();
  return new Promise((resolve, reject) => {
    let request;
    try {
      const transaction = db.transaction([STORE_NAME], "readonly");
      request = transaction.objectStore(STORE_NAME).getAllKeys();
    } catch (error) {
      db = null;
      reject(error);
      return;
    }
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(
      request.error || new Error("Failed to list database keys")
    );
  });
}

async function calculateDBStorageUsage() {
  try {
    const nativeStorage = getNativeStoragePlugin();
    if (nativeStorage) {
      const result = await nativeStorage.storageUsage();
      return Number(result?.bytes) || 0;
    }
    if (!navigator.storage?.estimate) return 0;
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error("Could not estimate storage usage:", error);
    return 0;
  }
}

Object.assign(globalThis, {
  initIndexedDB,
  getFromDB,
  setInDB,
  setManyInDB,
  deleteFromDB,
  clearDB,
  getAllKeysFromDB,
  calculateDBStorageUsage,
  isNativeStorageBackend,
});
