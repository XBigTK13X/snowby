/*
 * *************************************************************************
 *  MainTvModel.kt
 * **************************************************************************
 *  Copyright © 2019 VLC authors and VideoLAN
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA 02110-1301, USA.
 *  ***************************************************************************
 */

package org.videolan.vlc.viewmodels.tv

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.*
import com.simplepathstudios.snowby.emby.model.MediaResume
import com.simplepathstudios.snowby.emby.model.MediaView
import com.simplepathstudios.snowby.gui.MediaLibraryActivity
import com.simplepathstudios.snowby.util.SnowbyMediaPlayer
import kotlinx.coroutines.*
import org.videolan.medialibrary.interfaces.AbstractMedialibrary
import org.videolan.medialibrary.interfaces.media.AbstractMediaWrapper
import org.videolan.medialibrary.media.DummyItem
import org.videolan.medialibrary.media.MediaLibraryItem
import org.videolan.medialibrary.media.MediaWrapper
import org.videolan.vlc.gui.DialogActivity
import org.videolan.vlc.gui.tv.MainTvActivity
import org.videolan.vlc.gui.tv.TvUtil
import org.videolan.vlc.gui.tv.audioplayer.AudioPlayerActivity
import org.videolan.vlc.gui.tv.browser.TVActivity
import org.videolan.vlc.gui.tv.browser.VerticalGridActivity
import org.videolan.vlc.media.MediaUtils
import org.videolan.vlc.util.*

private const val NUM_ITEMS_PREVIEW = 5
private const val TAG = "MainTvModel"

@ObsoleteCoroutinesApi
@ExperimentalCoroutinesApi
class MainTvModel(app: Application) : AndroidViewModel(app), AbstractMedialibrary.OnMedialibraryReadyListener,
        AbstractMedialibrary.OnDeviceChangeListener, CoroutineScope by MainScope() {

    val context = getApplication<Application>().baseContext!!
    private val medialibrary = AbstractMedialibrary.getInstance()
    val settings = Settings.getInstance(context)
    var showHistory = false
        private set

    // LiveData
    val videos: LiveData<List<MediaLibraryItem>> = MutableLiveData()


    init {
        medialibrary.addOnMedialibraryReadyListener(this)
        medialibrary.addOnDeviceChangeListener(this)
    }

    fun refresh() = launch {
        updateVideos()
    }

    private fun updateVideos() = launch {
        context.getFromMl {
            getPagedVideos(AbstractMedialibrary.SORT_INSERTIONDATE, true, NUM_ITEMS_PREVIEW, 0)
        }.let {
            (videos as MutableLiveData).value = mutableListOf<MediaLibraryItem>().apply {
                add(MediaWrapper(Uri.parse("smb://trove.9914.us/media/tv/Laid-Back Camp/Season 1/Laid-Back Camp - S01E05 - Two Camps, Two Campers' Views.mkv")))
            }
        }
    }


    override fun onMedialibraryIdle() {
        refresh()
    }

    override fun onMedialibraryReady() {
        refresh()
    }

    override fun onDeviceChange() {
        refresh()
    }

    override fun onCleared() {
        super.onCleared()
        medialibrary.removeOnMedialibraryReadyListener(this)
        medialibrary.removeOnDeviceChangeListener(this)
        cancel()
    }

    fun open(activity: FragmentActivity, item: Any?) {
        when (item) {
            is AbstractMediaWrapper -> when {
                item.type == AbstractMediaWrapper.TYPE_DIR -> {
                    val intent = Intent(activity, VerticalGridActivity::class.java)
                    intent.putExtra(MainTvActivity.BROWSER_TYPE, if ("file" == item.uri.scheme) HEADER_DIRECTORIES else HEADER_NETWORK)
                    intent.data = item.uri
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                    activity.startActivity(intent)
                }
                else -> {
                    MediaUtils.openMedia(activity, item)
                    if (item.type == AbstractMediaWrapper.TYPE_AUDIO) {
                        activity.startActivity(Intent(activity, AudioPlayerActivity::class.java))
                    }
                }
            }
            is DummyItem -> when {
                item.id == HEADER_STREAM -> {
                    val intent = Intent(activity, TVActivity::class.java)
                    intent.putExtra(MainTvActivity.BROWSER_TYPE, HEADER_STREAM)
                    activity.startActivity(intent)
                }
                item.id == HEADER_SERVER -> activity.startActivity(Intent(activity, DialogActivity::class.java).setAction(DialogActivity.KEY_SERVER)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                else -> {
                    val intent = Intent(activity, VerticalGridActivity::class.java)
                    intent.putExtra(MainTvActivity.BROWSER_TYPE, item.id)
                    activity.startActivity(intent)
                }
            }
            is MediaResume -> {
                SnowbyMediaPlayer.start(activity,context,item.Id)
            }
            is MediaView -> {
                val intent = Intent(activity, MediaLibraryActivity::class.java)
                intent.putExtra(MediaLibraryActivity.PARENT_ID, item.Id)
                activity.startActivity(intent)
            }
            is MediaLibraryItem -> TvUtil.openAudioCategory(activity, item)
        }
    }

    companion object {
        fun Fragment.getMainTvModel() = ViewModelProviders.of(requireActivity(), Factory(requireActivity().application)).get(MainTvModel::class.java)
    }

    class Factory(private val app: Application) : ViewModelProvider.NewInstanceFactory() {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            @Suppress("UNCHECKED_CAST")
            return MainTvModel(app) as T
        }
    }
}
