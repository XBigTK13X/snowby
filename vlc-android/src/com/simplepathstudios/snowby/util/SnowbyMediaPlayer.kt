package com.simplepathstudios.snowby.util

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.util.Log
import com.simplepathstudios.snowby.emby.EmbyApiClient
import com.simplepathstudios.snowby.emby.model.Item
import org.videolan.medialibrary.media.MediaWrapper
import org.videolan.vlc.media.MediaUtils
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

object SnowbyMediaPlayer {
    private val TAG = "SnowbyMediaPlayer"
    fun start(activity: Activity, context: Context, embyItemId: String) {
        val emby = EmbyApiClient.getInstance(context)
        emby.api.item(emby.authHeader, emby.userId, embyItemId).enqueue(object : Callback<Item> {
            override fun onResponse(call: Call<Item>, response: Response<Item>) {
                Log.i(TAG, "Loaded information for media")
                val embyItem = response.body()
                val embyMedia = MediaWrapper(Uri.parse(embyItem!!.Path))
                // In Emby one tick is one microsecond. Time units in VLC are Milliseconds
                SnowbySettings.setResumePositionMilliseconds(embyItem.UserData.PlaybackPositionTicks / 10000)
                MediaUtils.openMedia(activity, embyMedia);
            }

            override fun onFailure(call: Call<Item>, t: Throwable) {
                Log.e(TAG, "An error occurred while media was loading", t)
            }
        })
    }
}
