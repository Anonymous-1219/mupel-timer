package com.mupel.floatingoverlay

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import android.view.*
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

class FloatingOverlayService : Service() {

  companion object {
    const val ACTION_START = "com.mupel.floatingoverlay.START"
    const val ACTION_UPDATE = "com.mupel.floatingoverlay.UPDATE"
    const val EXTRA_LABEL = "label"
    const val EXTRA_SECONDS = "seconds"
    const val CHANNEL_ID = "mupel_floating_timer"
    const val NOTIF_ID = 4471
  }

  private lateinit var windowManager: WindowManager
  private var bubbleView: View? = null
  private var expanded = false
  private var timeLabel: TextView? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val label = intent?.getStringExtra(EXTRA_LABEL) ?: "00:00"

    when (intent?.action) {
      ACTION_UPDATE -> {
        timeLabel?.text = label
        return START_STICKY
      }
      else -> {
        startForeground(NOTIF_ID, buildNotification(label))
        if (bubbleView == null) showBubble(label)
      }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    super.onDestroy()
    bubbleView?.let { runCatching { windowManager.removeView(it) } }
    bubbleView = null
  }

  // --- Bubble UI ---------------------------------------------------------

  private fun showBubble(initialLabel: String) {
    val displayMetrics = DisplayMetrics()
    windowManager.defaultDisplay.getMetrics(displayMetrics)

    val container = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(28, 20, 28, 20)
      background = GradientDrawable().apply {
        cornerRadius = 28f
        setColor(Color.parseColor("#1B1720"))
        setStroke(2, Color.parseColor("#8B5CF6"))
      }
    }

    val label = TextView(this).apply {
      text = initialLabel
      setTextColor(Color.parseColor("#F5F3FF"))
      textSize = 16f
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }
    timeLabel = label
    container.addView(label)

    val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    else
      @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      overlayType,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = displayMetrics.widthPixels - 220
      y = 200
    }

    // Drag + edge-snap behaviour
    var initialX = 0
    var initialY = 0
    var touchX = 0f
    var touchY = 0f

    container.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = params.x
          initialY = params.y
          touchX = event.rawX
          touchY = event.rawY
          true
        }
        MotionEvent.ACTION_MOVE -> {
          params.x = initialX + (event.rawX - touchX).toInt()
          params.y = initialY + (event.rawY - touchY).toInt()
          windowManager.updateViewLayout(container, params)
          true
        }
        MotionEvent.ACTION_UP -> {
          // Snap to nearest horizontal edge
          val screenWidth = displayMetrics.widthPixels
          val bubbleCenter = params.x + container.width / 2
          params.x = if (bubbleCenter < screenWidth / 2) 24 else screenWidth - container.width - 24
          windowManager.updateViewLayout(container, params)
          true
        }
        else -> false
      }
    }

    container.setOnClickListener {
      expanded = !expanded
      // Expanded/compact mode toggling can be extended here with quick-action buttons
      // (Pause, +5 min, Stop) — wired to the "onAddFiveMinutes" / "onPauseToggle" /
      // "onStopFromBubble" events emitted from FloatingOverlayModule.
    }

    windowManager.addView(container, params)
    bubbleView = container
  }

  // --- Notification (required for a foreground service) ------------------

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID, "Mupel Floating Timer", NotificationManager.IMPORTANCE_LOW
      )
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  private fun buildNotification(label: String): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Mupel Timer")
      .setContentText("$label remaining — floating bubble active")
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setOngoing(true)
      .build()
  }
}
