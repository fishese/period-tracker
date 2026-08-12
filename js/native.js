function getNativePlugin() {
  return globalThis.Capacitor?.Plugins?.NativeSecure || null;
}

function getSystemBarsPlugin() {
  return globalThis.Capacitor?.Plugins?.SystemBars || null;
}

function getDriveAuthorizationPlugin() {
  return globalThis.Capacitor?.Plugins?.DriveAuthorization || null;
}

export function isNativeApp() {
  const capacitor = globalThis.Capacitor;
  return !!(
    getNativePlugin() &&
    (capacitor?.isNativePlatform?.() || capacitor?.getPlatform?.() === "android")
  );
}

export async function setStatusBarStyle(useDarkContent) {
  const plugin = getSystemBarsPlugin();
  if (!plugin || !isNativeApp()) return;
  await plugin.setStyle({
    // Capacitor names styles after the background: LIGHT means dark content.
    style: useDarkContent ? "LIGHT" : "DARK",
    bar: "StatusBar",
  });
}

export async function getBiometricStatus() {
  const plugin = getNativePlugin();
  if (!plugin) return { available: false, configured: false, status: -1 };
  return plugin.biometricStatus();
}

export async function enableBiometric(pin) {
  const plugin = getNativePlugin();
  if (!plugin) throw new Error("biometric_unavailable");
  return plugin.biometricEnable({ pin });
}

export async function authenticateBiometric() {
  const plugin = getNativePlugin();
  if (!plugin) throw new Error("biometric_unavailable");
  return plugin.biometricAuthenticate();
}

export async function disableBiometric() {
  const plugin = getNativePlugin();
  if (!plugin) return;
  await plugin.biometricDisable();
}

export function hasNativeDriveAuthorization() {
  return !!(isNativeApp() && getDriveAuthorizationPlugin());
}

export async function authorizeNativeDrive(interactive = true) {
  const plugin = getDriveAuthorizationPlugin();
  if (!plugin || !isNativeApp()) throw new Error("drive_authorization_unavailable");
  const result = await plugin.authorize({ interactive: !!interactive });
  if (!result?.accessToken) throw new Error("drive_access_token_missing");
  return result.accessToken;
}

export function isBiometricCancellation(error) {
  const code = String(error?.code || "");
  return ["10", "13"].some((suffix) => code.endsWith(suffix));
}
