import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  AppState,
} from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import {
  requestNotificationPermissions,
  scheduleCompletionNotification,
  cancelScheduledNotification,
  showRunningNotification,
  clearRunningNotification,
} from "../utils/timerNotifications";
import {
  startOverlay,
  updateOverlay,
  stopOverlay,
  onBubbleAddFiveMinutes,
  onBubblePauseToggle,
  onBubbleStop,
} from "../../modules/floating-overlay";
import OverlayPermissionGate from "../components/OverlayPermissionGate";

function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimerScreen() {
  const [inputMinutes, setInputMinutes] = useState("5");
  const [totalSeconds, setTotalSeconds] = useState(0); // set when timer starts
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | running | paused | done
  const [floatingEnabled, setFloatingEnabled] = useState(false);

  const endTimeRef = useRef(null); // epoch ms when timer should end
  const intervalRef = useRef(null);
  const notifIdRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    requestNotificationPermissions();

    // Bubble quick-action buttons call back into this screen's logic
    const subAdd = onBubbleAddFiveMinutes(() => handleAddFive());
    const subPause = onBubblePauseToggle(() => {
      setStatus((current) => {
        if (current === "running") handlePause();
        else if (current === "paused") handleResume();
        return current;
      });
    });
    const subStop = onBubbleStop(() => handleStop());

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (soundRef.current) soundRef.current.unloadAsync();
      subAdd?.remove();
      subPause?.remove();
      subStop?.remove();
    };
  }, []);

  // Keep the floating bubble's label in sync while it's enabled and the timer runs
  useEffect(() => {
    if (floatingEnabled && status === "running") {
      updateOverlay(formatClock(remaining), remaining);
    }
  }, [remaining, floatingEnabled, status]);

  const toggleFloating = async () => {
    if (floatingEnabled) {
      await stopOverlay();
      setFloatingEnabled(false);
    } else {
      await startOverlay(formatClock(remaining || totalSeconds), remaining || totalSeconds);
      setFloatingEnabled(true);
    }
  };

  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const secsLeft = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    setRemaining(secsLeft);
    if (secsLeft <= 0) {
      finishTimer();
    }
  }, []);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 250);
  };

  const stopInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const playAlarm = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alarm.mp3")
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      // sound file missing until added by developer — safe to ignore in dev
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), i * 400);
    }
  };

  const finishTimer = async () => {
    stopInterval();
    setStatus("done");
    setRemaining(0);
    await clearRunningNotification();
    if (floatingEnabled) {
      await stopOverlay();
      setFloatingEnabled(false);
    }
    await playAlarm();
  };

  const beginCountdown = async (seconds) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setStatus("running");
    startInterval();
    await requestNotificationPermissions();
    notifIdRef.current = await scheduleCompletionNotification(seconds);
    await showRunningNotification(formatClock(seconds));
  };

  const handleStart = () => {
    const mins = parseFloat(inputMinutes);
    if (!mins || mins <= 0) return;
    beginCountdown(Math.round(mins * 60));
  };

  const handlePause = () => {
    stopInterval();
    setStatus("paused");
    cancelScheduledNotification(notifIdRef.current);
  };

  const handleResume = async () => {
    endTimeRef.current = Date.now() + remaining * 1000;
    setStatus("running");
    startInterval();
    notifIdRef.current = await scheduleCompletionNotification(remaining);
  };

  const handleStop = async () => {
    stopInterval();
    setStatus("idle");
    setRemaining(0);
    setTotalSeconds(0);
    endTimeRef.current = null;
    await cancelScheduledNotification(notifIdRef.current);
    await clearRunningNotification();
    if (floatingEnabled) {
      await stopOverlay();
      setFloatingEnabled(false);
    }
  };

  const handleAddFive = async () => {
    const newRemaining = remaining + 300;
    setRemaining(newRemaining);
    if (status === "running") {
      endTimeRef.current = Date.now() + newRemaining * 1000;
      await cancelScheduledNotification(notifIdRef.current);
      notifIdRef.current = await scheduleCompletionNotification(newRemaining);
    }
    setTotalSeconds((t) => t + 300);
  };

  const handleRestart = () => {
    if (totalSeconds > 0) beginCountdown(totalSeconds);
  };

  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  return (
    <View style={styles.container}>
      {status === "idle" ? (
        <View style={styles.setupWrap}>
          <Text style={styles.label}>Set minutes</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputMinutes}
            onChangeText={setInputMinutes}
            placeholder="5"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
            <Text style={styles.primaryBtnText}>Start Timer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.runWrap}>
          <OverlayPermissionGate />
          <Text style={styles.countdown}>{formatClock(remaining)}</Text>
          <Text style={styles.statusLabel}>
            {status === "running" ? "Running" : status === "paused" ? "Paused" : "Time's up!"}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
          </View>

          <View style={styles.controlsRow}>
            {status === "running" && (
              <TouchableOpacity style={styles.controlBtn} onPress={handlePause}>
                <Text style={styles.controlBtnText}>Pause</Text>
              </TouchableOpacity>
            )}
            {status === "paused" && (
              <TouchableOpacity style={styles.controlBtn} onPress={handleResume}>
                <Text style={styles.controlBtnText}>Resume</Text>
              </TouchableOpacity>
            )}
            {status === "done" && (
              <TouchableOpacity style={styles.controlBtn} onPress={handleRestart}>
                <Text style={styles.controlBtnText}>Restart</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlBtn} onPress={handleAddFive}>
              <Text style={styles.controlBtnText}>+5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={handleStop}>
              <Text style={[styles.controlBtnText, styles.stopBtnText]}>Stop</Text>
            </TouchableOpacity>
          </View>

          {status === "running" && (
            <TouchableOpacity style={styles.floatBtn} onPress={toggleFloating}>
              <Text style={styles.floatBtnText}>
                {floatingEnabled ? "Hide Floating Timer" : "Show Floating Timer"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  setupWrap: { width: "100%", alignItems: "center" },
  label: { color: colors.textSecondary, fontSize: 15, marginBottom: 10 },
  input: {
    width: 140,
    textAlign: "center",
    fontSize: 40,
    fontWeight: "700",
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  runWrap: { width: "100%", alignItems: "center" },
  countdown: {
    fontSize: 64,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  statusLabel: { color: colors.primaryLight, fontSize: 15, fontWeight: "600", marginTop: 6 },

  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.progressTrack,
    marginTop: 28,
    marginBottom: 32,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },

  controlsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  controlBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  controlBtnText: { color: colors.primaryLight, fontWeight: "700", fontSize: 15 },
  stopBtn: { borderColor: colors.danger },
  stopBtnText: { color: colors.danger },

  floatBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  floatBtnText: { color: colors.primaryLight, fontWeight: "700", fontSize: 13 },
});
