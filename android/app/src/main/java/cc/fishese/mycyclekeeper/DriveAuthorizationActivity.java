package cc.fishese.mycyclekeeper;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentSender;
import android.os.Build;
import android.os.Bundle;

/**
 * Small result-forwarding activity for Google AuthorizationClient's
 * PendingIntent. Capacitor's plugin API launches ordinary Intents, so this
 * activity bridges the IntentSender result back to the plugin callback.
 */
public class DriveAuthorizationActivity extends Activity {
    public static final String EXTRA_PENDING_INTENT = "drive_pending_intent";
    private static final int REQUEST_AUTHORIZATION = 4801;
    private static final String STATE_LAUNCHED = "launched";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null && savedInstanceState.getBoolean(STATE_LAUNCHED, false)) {
            return;
        }

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pendingIntent = getIntent().getParcelableExtra(EXTRA_PENDING_INTENT, PendingIntent.class);
        } else {
            //noinspection deprecation
            pendingIntent = getIntent().getParcelableExtra(EXTRA_PENDING_INTENT);
        }
        if (pendingIntent == null) {
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        try {
            startIntentSenderForResult(
                    pendingIntent.getIntentSender(),
                    REQUEST_AUTHORIZATION,
                    null,
                    0,
                    0,
                    0
            );
        } catch (IntentSender.SendIntentException error) {
            Intent failure = new Intent();
            failure.putExtra("drive_authorization_error", "authorization_ui_failed");
            setResult(RESULT_CANCELED, failure);
            finish();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putBoolean(STATE_LAUNCHED, true);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_AUTHORIZATION) return;
        setResult(resultCode, data);
        finish();
    }
}
