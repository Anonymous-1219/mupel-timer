import { requireNativeModule } from "expo-modules-core";
import { NativeEventEmitter, NativeModules, Platform } from "react-native";

const isAndroid = Platform.OS === "android";
const NativeFloatingOverlay = isAndroid ? requireNativeModule("FloatingOverlay") : null;

// Some events are emitted from the native bubble's own quick-action buttons
const emitter = isAndroid && NativeModules.FloatingOverlay
  ? new NativeEventEmitter(NativeModules.FloatingOverlay)
  : null;

function unsupported() {
  console.warn("Floating overlay is Android-only.");
}

export function hasOverlayPermission() {
  if (!isAndroid) return Promise.resolve(false);
  return NativeFloatingOverlay.hasOverlayPermission();
}

export function requestOverlayPermission() {
  if (!isAndroid) return unsupported();
  return NativeFloatingOverlay.requestOverlayPermission();
}

export function startOverlay(label, seconds) {
  if (!isAndroid) return unsupported();
  return NativeFloatingOverlay.startOverlay(label, seconds);
}

export function updateOverlay(label, seconds) {
  if (!isAndroid) return unsupported();
  return NativeFloatingOverlay.updateOverlay(label, seconds);
}

export function stopOverlay() {
  if (!isAndroid) return unsupported();
  return NativeFloatingOverlay.stopOverlay();
}

// Subscribe to bubble button taps (Pause, +5 min, Stop) from within the Timer screen
export function onBubbleAddFiveMinutes(callback) {
  return emitter?.addListener("onAddFiveMinutes", callback);
}
export function onBubblePauseToggle(callback) {
  return emitter?.addListener("onPauseToggle", callback);
}
export function onBubbleStop(callback) {
  return emitter?.addListener("onStopFromBubble", callback);
}
