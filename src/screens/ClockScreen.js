import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { colors } from "../theme/colors";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ClockScreen() {
  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    let suffix = "";

    if (!is24Hour) {
      suffix = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
    }

    const hourStr = hours.toString().padStart(2, "0");
    return { hourStr, minutes, seconds, suffix };
  };

  const { hourStr, minutes, seconds, suffix } = formatTime();
  const dayName = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const dateStr = `${dayName}, ${monthName} ${now.getDate()}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.clockWrap}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{hourStr}</Text>
          <Text style={[styles.timeText, styles.colon]}>:</Text>
          <Text style={styles.timeText}>{minutes}</Text>
          <Text style={[styles.timeText, styles.seconds]}>:{seconds}</Text>
          {!is24Hour && <Text style={styles.suffix}>{suffix}</Text>}
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <TouchableOpacity
        style={styles.toggle}
        activeOpacity={0.7}
        onPress={() => setIs24Hour((prev) => !prev)}
      >
        <Text style={styles.toggleText}>{is24Hour ? "24H" : "12H"}</Text>
        <Text style={styles.toggleHint}>Tap to switch</Text>
      </TouchableOpacity>
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
  clockWrap: {
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 72,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  colon: {
    color: colors.primary,
    marginHorizontal: 2,
  },
  seconds: {
    fontSize: 32,
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  suffix: {
    fontSize: 22,
    color: colors.primaryLight,
    fontWeight: "600",
    marginLeft: 8,
    marginBottom: 12,
  },
  dateText: {
    marginTop: 12,
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  toggle: {
    marginTop: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  toggleText: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
