package com.mupel.floatingoverlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FloatingOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FloatingOverlay")

    // Whether the user has granted "Display over other apps"
    Function("hasOverlayPermission") {
            val context = appContext.reactContext ?: return@Function false
                  Settings.canDrawOverlays(context)
    }

    // Opens the system settings screen so the user can grant the permission manually
    Function("requestOverlayPermission") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${context.packageName}")
      ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
      context.startActivity(intent)
    }

    // Starts the floating bubble + foreground service with an initial countdown label
    Function("startOverlay") { label: String, seconds: Int ->
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(context, FloatingOverlayService::class.java).apply {
        action = FloatingOverlayService.ACTION_START
        putExtra(FloatingOverlayService.EXTRA_LABEL, label)
        putExtra(FloatingOverlayService.EXTRA_SECONDS, seconds)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    // Pushes an updated remaining-time label to the already-running bubble
    Function("updateOverlay") { label: String, seconds: Int ->
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(context, FloatingOverlayService::class.java).apply {
        action = FloatingOverlayService.ACTION_UPDATE
        putExtra(FloatingOverlayService.EXTRA_LABEL, label)
        putExtra(FloatingOverlayService.EXTRA_SECONDS, seconds)
      }
      context.startService(intent)
    }

    Function("stopOverlay") {
      val context = appContext.reactContext ?: return@Function
      context.stopService(Intent(context, FloatingOverlayService::class.java))
    }

    // Fired from the bubble's own quick-action buttons back into JS
    Events("onAddFiveMinutes", "onPauseToggle", "onStopFromBubble")
  }
}
