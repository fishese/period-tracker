package cc.fishese.mycyclekeeper;

import static androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG;

import android.content.Context;
import android.content.SharedPreferences;
import android.annotation.SuppressLint;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.Executor;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "NativeSecure")
public class NativeSecurePlugin extends Plugin {
    private static final String DATA_PREFS = "mycyclekeeper_native_data";
    private static final String SECURITY_PREFS = "mycyclekeeper_native_security";
    private static final String KEY_ALIAS = "mycyclekeeper_biometric_pin_v1";
    private static final String PREF_CIPHERTEXT = "biometric_pin_ciphertext";
    private static final String PREF_IV = "biometric_pin_iv";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";

    private SharedPreferences dataPrefs() {
        return getContext().getSharedPreferences(DATA_PREFS, Context.MODE_PRIVATE);
    }

    private SharedPreferences securityPrefs() {
        return getContext().getSharedPreferences(SECURITY_PREFS, Context.MODE_PRIVATE);
    }

    private String requireKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("A non-empty storage key is required.", "invalid_key");
            return null;
        }
        return key;
    }

    @PluginMethod
    public void storageGet(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        JSObject result = new JSObject();
        String value = dataPrefs().getString(key, null);
        if (value != null) result.put("value", value);
        call.resolve(result);
    }

    @PluginMethod
    public void storageSet(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        String value = call.getString("value");
        if (value == null) {
            call.reject("A serialized storage value is required.", "invalid_value");
            return;
        }
        if (!dataPrefs().edit().putString(key, value).commit()) {
            call.reject("Native storage write failed.", "storage_write_failed");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void storageSetMany(PluginCall call) {
        JSObject entries = call.getObject("entries");
        if (entries == null || entries.length() == 0) {
            call.reject("At least one storage entry is required.", "invalid_entries");
            return;
        }
        SharedPreferences.Editor editor = dataPrefs().edit();
        Iterator<String> keys = entries.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object raw = entries.opt(key);
            if (!(raw instanceof String) || key.isEmpty()) {
                call.reject("Storage entries must contain non-empty keys and string values.", "invalid_entries");
                return;
            }
            editor.putString(key, (String) raw);
        }
        if (!editor.commit()) {
            call.reject("Native storage write failed.", "storage_write_failed");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void storageRemove(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        if (!dataPrefs().edit().remove(key).commit()) {
            call.reject("Native storage delete failed.", "storage_delete_failed");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void storageClear(PluginCall call) {
        if (!dataPrefs().edit().clear().commit()) {
            call.reject("Native storage clear failed.", "storage_clear_failed");
            return;
        }
        clearBiometricCredential();
        call.resolve();
    }

    @PluginMethod
    public void storageKeys(PluginCall call) {
        JSArray keys = new JSArray();
        for (String key : dataPrefs().getAll().keySet()) keys.put(key);
        JSObject result = new JSObject();
        result.put("keys", keys);
        call.resolve(result);
    }

    @PluginMethod
    public void storageUsage(PluginCall call) {
        long bytes = 0;
        for (Map.Entry<String, ?> entry : dataPrefs().getAll().entrySet()) {
            bytes += entry.getKey().getBytes(StandardCharsets.UTF_8).length;
            if (entry.getValue() instanceof String) {
                bytes += ((String) entry.getValue()).getBytes(StandardCharsets.UTF_8).length;
            }
        }
        JSObject result = new JSObject();
        result.put("bytes", bytes);
        call.resolve(result);
    }

    @PluginMethod
    public void biometricStatus(PluginCall call) {
        JSObject result = new JSObject();
        int status = BiometricManager.from(getContext()).canAuthenticate(BIOMETRIC_STRONG);
        result.put("available", status == BiometricManager.BIOMETRIC_SUCCESS);
        result.put("configured", hasBiometricCredential());
        result.put("status", status);
        call.resolve(result);
    }

    @PluginMethod
    public void biometricEnable(PluginCall call) {
        String pin = call.getString("pin");
        if (pin == null || !pin.matches("\\d{4}")) {
            call.reject("A four-digit PIN is required.", "invalid_pin");
            return;
        }
        if (BiometricManager.from(getContext()).canAuthenticate(BIOMETRIC_STRONG)
                != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject("Strong biometric authentication is not available.", "biometric_unavailable");
            return;
        }

        try {
            SecretKey key = getOrCreateSecretKey();
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            showPrompt(call, cipher, true, pin);
        } catch (Exception error) {
            clearBiometricCredential();
            call.reject("Could not prepare biometric enrollment.", "biometric_setup_failed", error);
        }
    }

    @PluginMethod
    public void biometricAuthenticate(PluginCall call) {
        if (!hasBiometricCredential()) {
            call.reject("Biometric unlock has not been enabled.", "biometric_not_configured");
            return;
        }
        try {
            byte[] iv = Base64.decode(securityPrefs().getString(PREF_IV, ""), Base64.NO_WRAP);
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), new GCMParameterSpec(128, iv));
            showPrompt(call, cipher, false, null);
        } catch (Exception error) {
            clearBiometricCredential();
            call.reject("Biometric credentials changed; enable biometric unlock again.", "biometric_invalidated", error);
        }
    }

    @PluginMethod
    public void biometricDisable(PluginCall call) {
        clearBiometricCredential();
        call.resolve();
    }

    private void showPrompt(PluginCall call, Cipher cipher, boolean enrolling, String pin) {
        if (!(getActivity() instanceof FragmentActivity)) {
            call.reject("Biometric authentication requires a foreground activity.", "biometric_no_activity");
            return;
        }
        FragmentActivity activity = (FragmentActivity) getActivity();
        activity.runOnUiThread(() -> {
            Executor executor = ContextCompat.getMainExecutor(activity);
            BiometricPrompt prompt = new BiometricPrompt(activity, executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            call.reject(errString.toString(), "biometric_error_" + errorCode);
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            try {
                                Cipher authenticatedCipher = result.getCryptoObject() == null
                                        ? null : result.getCryptoObject().getCipher();
                                if (authenticatedCipher == null) {
                                    throw new IllegalStateException("Missing authenticated cipher.");
                                }
                                JSObject response = new JSObject();
                                if (enrolling) {
                                    byte[] ciphertext = authenticatedCipher.doFinal(pin.getBytes(StandardCharsets.UTF_8));
                                    boolean stored = securityPrefs().edit()
                                            .putString(PREF_CIPHERTEXT, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                                            .putString(PREF_IV, Base64.encodeToString(authenticatedCipher.getIV(), Base64.NO_WRAP))
                                            .commit();
                                    if (!stored) throw new IllegalStateException("Could not store biometric credential.");
                                    response.put("configured", true);
                                } else {
                                    byte[] ciphertext = Base64.decode(
                                            securityPrefs().getString(PREF_CIPHERTEXT, ""), Base64.NO_WRAP);
                                    String unlockedPin = new String(
                                            authenticatedCipher.doFinal(ciphertext), StandardCharsets.UTF_8);
                                    if (!unlockedPin.matches("\\d{4}")) {
                                        throw new IllegalStateException("Stored biometric credential is invalid.");
                                    }
                                    response.put("pin", unlockedPin);
                                }
                                call.resolve(response);
                            } catch (Exception error) {
                                clearBiometricCredential();
                                call.reject("Biometric credential could not be used.", "biometric_credential_failed", error);
                            }
                        }
                    });

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(enrolling ? "Enable biometric unlock" : "Unlock My Cycle Keeper")
                    .setSubtitle(enrolling
                            ? "Confirm your biometric to protect your PIN on this device"
                            : "Use your biometric or cancel to enter your PIN")
                    .setAllowedAuthenticators(BIOMETRIC_STRONG)
                    .setNegativeButtonText("Use PIN")
                    .build();
            prompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
        });
    }

    private boolean hasBiometricCredential() {
        SharedPreferences prefs = securityPrefs();
        if (!prefs.contains(PREF_CIPHERTEXT) || !prefs.contains(PREF_IV)) return false;
        try {
            return keyStore().containsAlias(KEY_ALIAS);
        } catch (Exception error) {
            clearBiometricCredential();
            return false;
        }
    }

    private SecretKey getOrCreateSecretKey() throws Exception {
        KeyStore store = keyStore();
        if (store.containsAlias(KEY_ALIAS)) return (SecretKey) store.getKey(KEY_ALIAS, null);

        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
                KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
        } else {
            builder.setUserAuthenticationValidityDurationSeconds(-1);
        }
        generator.init(builder.build());
        return generator.generateKey();
    }

    private SecretKey getSecretKey() throws Exception {
        KeyStore store = keyStore();
        if (!store.containsAlias(KEY_ALIAS)) throw new IllegalStateException("Biometric key is missing.");
        return (SecretKey) store.getKey(KEY_ALIAS, null);
    }

    private KeyStore keyStore() throws Exception {
        KeyStore store = KeyStore.getInstance(ANDROID_KEYSTORE);
        store.load(null);
        return store;
    }

    @SuppressLint("ApplySharedPref")
    private void clearBiometricCredential() {
        securityPrefs().edit().remove(PREF_CIPHERTEXT).remove(PREF_IV).commit();
        try {
            KeyStore store = keyStore();
            if (store.containsAlias(KEY_ALIAS)) store.deleteEntry(KEY_ALIAS);
        } catch (Exception ignored) {
            // The preference marker is already removed, so the credential is unusable.
        }
    }
}
