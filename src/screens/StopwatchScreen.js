import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { colors } from "../theme/colors";

function formatStopwatch(ms) {
  const totalMs = Math.max(0, ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centis = Math.floor((totalMs % 1000) / 10);
  const pad = (n, len = 2) => n.toString().padStart(len, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

export default function StopwatchScreen() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const startRef = useRef(null); // epoch ms when (re)started
  const baseRef = useRef(0); // accumulated ms before current run
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (Date.now() - startRef.current));
  }, []);

  useEffect(() => {
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  const handleStart = () => {
    startRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(tick, 31);
  };

  const handlePause = () => {
    clearInterval(intervalRef.current);
    baseRef.current = elapsed;
    setRunning(false);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    baseRef.current = 0;
    startRef.current = null;
    setElapsed(0);
    setRunning(false);
    setLaps([]);
  };

  const handleLap = () => {
    setLaps((prev) => [{ id: prev.length + 1, time: elapsed }, ...prev]);
  };

  const bestWorst = laps.length > 1
    ? laps.reduce(
        (acc, lap, idx) => {
          const dur = idx === laps.length - 1 ? lap.time : lap.time - laps[idx + 1].time;
          if (dur < acc.min) acc.min = dur;
          if (dur > acc.max) acc.max = dur;
          return acc;
        },
        { min: Infinity, max: -Infinity }
      )
    : null;

  const renderLap = ({ item, index }) => {
    const prevTime = index === laps.length - 1 ? 0 : laps[index + 1].time;
    const lapDuration = item.time - prevTime;
    return (
      <View style={styles.lapRow}>
        <Text style={styles.lapIndex}>Lap {item.id}</Text>
        <Text style={styles.lapDuration}>{formatStopwatch(lapDuration)}</Text>
        <Text style={styles.lapTotal}>{formatStopwatch(item.time)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatStopwatch(elapsed)}</Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.sideBtn, laps.length === 0 && !running && styles.sideBtnDisabled]}
          onPress={running ? handleLap : handleReset}
          disabled={!running && elapsed === 0}
        >
          <Text style={styles.sideBtnText}>{running ? "Lap" : "Reset"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainBtn, running ? styles.mainBtnPause : styles.mainBtnStart]}
          onPress={running ? handlePause : handleStart}
        >
          <Text style={styles.mainBtnText}>{running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.lapList}
        data={laps}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLap}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Laps will appear here</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", paddingTop: 64, paddingHorizontal: 24 },
  time: {
    fontSize: 58,
    fontWeight: "700",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 36, marginBottom: 28 },
  sideBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  sideBtnDisabled: { opacity: 0.4 },
  sideBtnText: { color: colors.textSecondary, fontWeight: "700", fontSize: 14 },
  mainBtn: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: "center", justifyContent: "center",
  },
  mainBtnStart: { backgroundColor: colors.primary },
  mainBtnPause: { backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: colors.danger },
  mainBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  lapList: { width: "100%", flex: 1 },
  lapRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  lapIndex: { color: colors.textSecondary, fontSize: 14, flex: 1 },
  lapDuration: { color: colors.textPrimary, fontSize: 15, fontWeight: "600", flex: 1, textAlign: "center" },
  lapTotal: { color: colors.textMuted, fontSize: 13, flex: 1, textAlign: "right" },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
});
