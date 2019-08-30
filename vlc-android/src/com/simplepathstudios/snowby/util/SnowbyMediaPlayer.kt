package com.simplepathstudios.snowby.util

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.util.Log
import com.simplepathstudios.snowby.emby.EmbyApiClient
import com.simplepathstudios.snowby.emby.model.Item
import com.simplepathstudios.snowby.emby.model.UpdateProgress
import org.videolan.medialibrary.media.MediaWrapper
import org.videolan.vlc.media.MediaUtils
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

object SnowbyMediaPlayer {
    private val TAG = "SnowbyMediaPlayer"

    private val EMBY_TICK_MULTIPLIER: Long = 10000

    private var nowPlayingEmbyId: String = ""

    fun start(activity: Activity, context: Context, embyItemId: String) {
        val emby = EmbyApiClient.getInstance(context)
        emby.api.item(emby.authHeader, emby.userId, embyItemId).enqueue(object : Callback<Item> {
            override fun onResponse(call: Call<Item>, response: Response<Item>) {
                Log.i(TAG, "Loaded information for media")
                val embyItem = response.body()
                val embyMedia = MediaWrapper(Uri.parse(embyItem!!.Path))
                // In Emby one tick is one microsecond. Time units in VLC are Milliseconds
                SnowbySettings.setResumePositionMilliseconds(embyItem.UserData.PlaybackPositionTicks / EMBY_TICK_MULTIPLIER)
                nowPlayingEmbyId = embyItemId
                MediaUtils.openMedia(activity, embyMedia);
            }

            override fun onFailure(call: Call<Item>, t: Throwable) {
                Log.e(TAG, "An error occurred while media was loading", t)
            }
        })
    }

    fun updateProgress(vlcPositionTicks : Long){
        if(!nowPlayingEmbyId.isNullOrEmpty() && vlcPositionTicks != 0L){
            //Log.i(TAG,"Updating progress to "+vlcPositionTicks)
            val emby = EmbyApiClient.getInstance()
            val updateProgress = UpdateProgress()
            updateProgress.ItemId = nowPlayingEmbyId
            updateProgress.PositionTicks = vlcPositionTicks * EMBY_TICK_MULTIPLIER
            emby.api.updateProgress(emby.authHeader,updateProgress).enqueue(object:Callback<Void>{
                override fun onResponse(call: Call<Void>, response: Response<Void>) {

                }

                override fun onFailure(call: Call<Void>, t: Throwable) {
                    Log.e(TAG, "An error occurred while updating Emby's progress for media "+ nowPlayingEmbyId,t)
                }
            })
        }
    }
}
