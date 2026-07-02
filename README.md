# Mupel Clock — Build & Install Manual (Phone-Only, via GitHub Codespaces + EAS)

## What's included now
- Clock, Timer, Stopwatch — fully working, dark AMOLED + Mupel purple theme
- Bottom nav between the three sections
- Timer: pause/resume/stop, +5 min, restart, sound, vibration, background notification
- Stopwatch: start/pause/resume/reset, laps, millisecond precision
- **Floating overlay bubble** — native Android module (Kotlin) at `modules/floating-overlay/`,
  draggable, edge-snapping, foreground service + notification, wired to a
  "Show Floating Timer" button on the Timer screen
- Placeholder alarm sound at `assets/alarm.mp3` — swap in your own file, same name

## Important: this now requires a real build every time you test
Once native code (the overlay module) is in the project, **Expo Go can no longer run it**.
`npx expo start` + Expo Go still works fine for Clock/Timer/Stopwatch, but the floating
bubble only works inside an actual compiled APK from EAS. Budget a few minutes per build.

---

## Step-by-step: build from your phone using GitHub Codespaces

### 1. Push this code to GitHub
- On your phone browser, go to github.com → create a new repository (e.g. `mupel-clock`)
- Upload all files/folders from this project into it (use "Add file → Upload files",
  drag in the whole folder contents, including the `modules/` and `plugins/` folders)

### 2. Open a Codespace
- On the repo page → green **Code** button → **Codespaces** tab → **Create codespace on main**
- This opens a full VS Code + terminal in your browser — no laptop needed

### 3. Install dependencies (in the Codespace terminal)
```
npm install
npm install -g eas-cli
```

### 4. Log into Expo
```
npx expo login
```
(Create a free account at expo.dev first if you don't have one)

### 5. Configure EAS
```
eas build:configure
```
Choose **Android** when asked.

### 6. Generate the native Android project (required because of the overlay module)
```
npx expo prebuild -p android
```
This reads `plugins/withFloatingOverlay.js` and `modules/floating-overlay/` and generates
a real `android/` folder with the permission + service already wired in. You don't need to
touch anything inside it.

### 7. Trigger the build
```
eas build -p android --profile preview
```
This compiles in Expo's cloud — takes a few minutes. When done, EAS gives you a link.

### 8. Install on your phone
- Open the link EAS gives you directly on your Android phone
- Download and install the APK (you may need to allow "install unknown apps" once)

### 9. Grant the overlay permission
- Start a timer in the app, tap **"Show Floating Timer"**
- Android will prompt you to allow "Display over other apps" — grant it, then return to the app
- The bubble now stays visible over YouTube, games, browsers, etc.

---

## Quick reference — what each new folder does
- `modules/floating-overlay/` — the native Kotlin module (bubble UI, drag/snap, foreground service)
- `plugins/withFloatingOverlay.js` — auto-edits AndroidManifest.xml during prebuild
  (adds the permission + registers the service) so you never touch Android Studio
- `src/components/OverlayPermissionGate.js` — in-app prompt to grant the overlay permission
