function getNativePlugin() {
  return globalThis.Capacitor?.Plugins?.NativeSecure || null;
}

export function isNativeApp() {
  const capacitor = globalThis.Capacitor;
  return !!(
    getNativePlugin() &&
    (capacitor?.isNativePlatform?.() || capacitor?.getPlatform?.() === "android")
  );
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

export function isBiometricCancellation(error) {
  const code = String(error?.code || "");
  return ["10", "13"].some((suffix) => code.endsWith(suffix));
}
