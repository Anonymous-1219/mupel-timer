import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { hasOverlayPermission, requestOverlayPermission } from "../../modules/floating-overlay";

// Renders nothing once permission is granted. Shown inline above the Timer
// controls the first time a user tries to enable the floating bubble.
export default function OverlayPermissionGate({ onGranted }) {
  const [granted, setGranted] = useState(true);

  useEffect(() => {
    let mounted = true;
    hasOverlayPermission().then((result) => {
      if (mounted) setGranted(!!result);
    });
    return () => { mounted = false; };
  }, []);

  if (granted) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        To show the floating timer over other apps, allow "Display over other apps" in settings.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={async () => {
          await requestOverlayPermission();
          // User grants this manually in system settings; re-check on return to app
          setTimeout(async () => {
            const result = await hasOverlayPermission();
            setGranted(!!result);
            if (result) onGranted?.();
          }, 1000);
        }}
      >
        <Text style={styles.btnText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  text: { color: colors.textSecondary, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
