// Encryption and cryptography functions
const SCHEMA_VERSION = 1;

function u8ToBase64(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i += 8192) {
    bin += String.fromCharCode(...u8.subarray(i, i + 8192));
  }
  return btoa(bin);
}

export async function deriveKey(pin, salt) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data, pin, salt) {
  let envelope;
  try {
    envelope = JSON.stringify({ v: SCHEMA_VERSION, payload: data });
  } catch (err) {
    throw new Error(`state_not_serializable: ${err.message}`);
  }
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(envelope)
  );
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return u8ToBase64(combined);
}

export async function decryptData(b64, pin, salt) {
  const key = await deriveKey(pin, salt);
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const parsed = JSON.parse(new TextDecoder().decode(pt));
  if (parsed.v === undefined) {
    return parsed;
  }
  if (parsed.v !== SCHEMA_VERSION) {
    throw new Error(
      `Unsupported data schema version: ${parsed.v}. Please update the app.`
    );
  }
  return parsed.payload;
}

export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", keyMat, salt);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
