package cc.fishese.mycyclekeeper;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;

import java.util.Collections;

@CapacitorPlugin(name = "DriveAuthorization")
public class DriveAuthorizationPlugin extends Plugin {
    private static final String DRIVE_APPDATA_SCOPE =
            "https://www.googleapis.com/auth/drive.appdata";

    @PluginMethod
    public void authorize(PluginCall call) {
        boolean interactive = Boolean.TRUE.equals(call.getBoolean("interactive", true));
        AuthorizationRequest request = AuthorizationRequest.builder()
                .setRequestedScopes(Collections.singletonList(new Scope(DRIVE_APPDATA_SCOPE)))
                .build();

        getActivity().runOnUiThread(() ->
                Identity.getAuthorizationClient(getActivity())
                        .authorize(request)
                        .addOnSuccessListener(result -> handleInitialResult(call, result, interactive))
                        .addOnFailureListener(error -> rejectApiError(call, error))
        );
    }

    private void handleInitialResult(
            PluginCall call,
            AuthorizationResult result,
            boolean interactive
    ) {
        if (!result.hasResolution()) {
            resolveToken(call, result);
            return;
        }
        if (!interactive) {
            call.reject(
                    "Google Drive authorization needs user interaction.",
                    "drive_authorization_required"
            );
            return;
        }

        PendingIntent pendingIntent = result.getPendingIntent();
        if (pendingIntent == null) {
            call.reject("Google Drive authorization could not start.", "drive_authorization_failed");
            return;
        }
        Intent intent = new Intent(getContext(), DriveAuthorizationActivity.class);
        intent.putExtra(DriveAuthorizationActivity.EXTRA_PENDING_INTENT, pendingIntent);
        startActivityForResult(call, intent, "handleAuthorizationResult");
    }

    @ActivityCallback
    private void handleAuthorizationResult(PluginCall call, ActivityResult activityResult) {
        if (call == null) return;
        Intent data = activityResult.getData();
        if (activityResult.getResultCode() != Activity.RESULT_OK || data == null) {
            String detail = data == null
                    ? null
                    : data.getStringExtra("drive_authorization_error");
            call.reject(
                    detail == null ? "Google Drive authorization was cancelled." : detail,
                    detail == null ? "drive_authorization_cancelled" : detail
            );
            return;
        }
        try {
            AuthorizationResult result = Identity.getAuthorizationClient(getContext())
                    .getAuthorizationResultFromIntent(data);
            resolveToken(call, result);
        } catch (ApiException error) {
            rejectApiError(call, error);
        }
    }

    private void resolveToken(PluginCall call, AuthorizationResult result) {
        String accessToken = result.getAccessToken();
        if (accessToken == null || accessToken.isEmpty()) {
            call.reject("Google did not return a Drive access token.", "drive_access_token_missing");
            return;
        }
        JSObject response = new JSObject();
        response.put("accessToken", accessToken);
        call.resolve(response);
    }

    private void rejectApiError(PluginCall call, Exception error) {
        String code = "drive_authorization_failed";
        if (error instanceof ApiException) {
            code += "_" + ((ApiException) error).getStatusCode();
        }
        call.reject("Google Drive authorization failed.", code, error);
    }
}
