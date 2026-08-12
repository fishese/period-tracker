package cc.fishese.mycyclekeeper;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeSecurePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
