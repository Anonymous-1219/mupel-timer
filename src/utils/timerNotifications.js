import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("timer", {
      name: "Mupel Timer",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
}

// Persistent notification shown while a timer is actively running
export async function showRunningNotification(remainingLabel) {
  await Notifications.scheduleNotificationAsync({
    identifier: "mupel-timer-running",
    content: {
      title: "Mupel Timer running",
      body: `${remainingLabel} remaining`,
      sticky: true,
      autoDismiss: false,
      sound: null,
    },
    trigger: null,
  });
}

export async function clearRunningNotification() {
  await Notifications.dismissNotificationAsync("mupel-timer-running");
}

// Fired when the countdown reaches zero (works even if app is backgrounded)
export async function scheduleCompletionNotification(secondsFromNow) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Time's up!",
      body: "Your Mupel Clock timer has finished.",
      sound: "default",
      channelId: "timer",
    },
    trigger: secondsFromNow > 0
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        }
      : null,
  });
}

export async function cancelScheduledNotification(id) {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}
