const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");

// This plugin runs during `expo prebuild` / EAS Build and edits the
// generated AndroidManifest.xml so the overlay permission + foreground
// service are registered without ever touching Android Studio.
module.exports = function withFloatingOverlay(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    // Register the foreground service used by the floating bubble
    if (!app.service) app.service = [];
    const alreadyRegistered = app.service.some(
      (s) => s["$"]["android:name"] === "com.mupel.floatingoverlay.FloatingOverlayService"
    );
    if (!alreadyRegistered) {
      app.service.push({
        $: {
          "android:name": "com.mupel.floatingoverlay.FloatingOverlayService",
          "android:foregroundServiceType": "specialUse",
          "android:exported": "false",
        },
      });
    }

    // Ensure SYSTEM_ALERT_WINDOW permission is present
    if (!manifest.manifest["uses-permission"]) {
      manifest.manifest["uses-permission"] = [];
    }
    const perms = manifest.manifest["uses-permission"];
    const hasOverlayPerm = perms.some(
      (p) => p["$"]["android:name"] === "android.permission.SYSTEM_ALERT_WINDOW"
    );
    if (!hasOverlayPerm) {
      perms.push({ $: { "android:name": "android.permission.SYSTEM_ALERT_WINDOW" } });
    }

    return config;
  });
};
