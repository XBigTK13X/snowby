/*
 * *************************************************************************
 *  MainTvFragment.kt
 * **************************************************************************
 *  Copyright © 2018-2019 VLC authors and VideoLAN
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

package org.videolan.vlc.gui.tv

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.core.content.ContextCompat
import androidx.leanback.app.BackgroundManager
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.*
import com.simplepathstudios.snowby.emby.EmbyApiClient
import com.simplepathstudios.snowby.emby.model.*
import com.simplepathstudios.snowby.gui.SnowbySettingsActivity
import com.simplepathstudios.snowby.util.SnowbySettings
import kotlinx.coroutines.*
import org.videolan.libvlc.util.AndroidUtil
import org.videolan.medialibrary.interfaces.AbstractMedialibrary
import org.videolan.medialibrary.interfaces.media.AbstractMediaWrapper
import org.videolan.vlc.*
import org.videolan.vlc.util.*
import org.videolan.vlc.viewmodels.tv.MainTvModel
import org.videolan.vlc.viewmodels.tv.MainTvModel.Companion.getMainTvModel
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

private const val TAG = "VLC/MainTvFragment"

@ObsoleteCoroutinesApi
@ExperimentalCoroutinesApi
class MainTvFragment : BrowseSupportFragment(), OnItemViewSelectedListener, OnItemViewClickedListener,
        View.OnClickListener, CoroutineScope by MainScope() {

    private var backgroundManager: BackgroundManager? = null
    private lateinit var rowsAdapter: ArrayObjectAdapter

    private lateinit var otherAdapter: ArrayObjectAdapter

    private lateinit var nowPlayingRow: ListRow
    private lateinit var videoRow: ListRow
    private lateinit var audioRow: ListRow
    private lateinit var historyRow: ListRow
    private lateinit var playlistRow: ListRow
    private lateinit var browsersRow: ListRow
    private lateinit var miscRow: ListRow

    private var displayHistory = false
    private var displayPlaylist = false
    private var displayNowPlaying = false
    private var selectedItem: Any? = null

    internal lateinit var model: MainTvModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Set display parameters for the BrowseFragment
        headersState = HEADERS_DISABLED
        title = getString(R.string.app_name)
        badgeDrawable = ContextCompat.getDrawable(requireContext(), R.drawable.icon)

        //Enable search feature only if we detect Google Play Services.
        if (AndroidDevices.hasPlayServices) {
            //TODO Renable for https://github.com/XBigTK13X/snowby/issues/12
            // setOnSearchClickedListener(this)
            // set search icon color
            // searchAffordanceColor = ContextCompat.getColor(requireContext(), R.color.orange600)
        }
        brandColor = ContextCompat.getColor(requireContext(), R.color.orange900)
        backgroundManager = BackgroundManager.getInstance(requireActivity()).apply { attach(requireActivity().window) }
        model = getMainTvModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        refreshHomePage();
    }

    private fun refreshHomePage(){
        Log.d(TAG,"Refreshing again!")
        val emby = EmbyApiClient.getInstance(context)
        val fragment = this
        emby.api.listUsers().enqueue(object : Callback<List<User>> {
            override fun onResponse(call: Call<List<User>>, response: Response<List<User>>) {
                val user = response.body()!![0]
                val login = Login()
                login.Username = user.Name
                login.Pw = ""
                emby.setUserId(user.Id)
                emby.api.login(emby.authHeader, login).enqueue(object : Callback<AuthenticatedUser> {
                    override fun onResponse(call: Call<AuthenticatedUser>, response: Response<AuthenticatedUser>) {
                        val authenticatedUser = response.body()
                        emby.setAccessToken(authenticatedUser!!.AccessToken)
                        emby.api.mediaOverview(emby.authHeader, user.Id).enqueue(object : Callback<ItemPage<MediaView>> {
                            override fun onResponse(call: Call<ItemPage<MediaView>>, response: Response<ItemPage<MediaView>>) {
                                val overviewList = response.body()!!.Items
                                emby.api.resumeOverview(emby.authHeader, user.Id, 1 ,"Primary,Backdrop,Thumb").enqueue(object : Callback<ItemPage<MediaResume>> {
                                    override fun onResponse(call: Call<ItemPage<MediaResume>>, response: Response<ItemPage<MediaResume>>) {
                                        Log.i(TAG, "Data loaded, refreshing view")
                                        val ctx = requireActivity()
                                        rowsAdapter = ArrayObjectAdapter(ListRowPresenter())

                                        val resumeList = response.body()!!.Items

                                        val mediaViewPresenter = CardPresenter(
                                                requireActivity(),
                                                SnowbySettings.getHomeCardWidth(),
                                                SnowbySettings.getHomeCardHeight()
                                        )

                                        val mediaOverviewRow = ArrayObjectAdapter(mediaViewPresenter)
                                        for (mediaView in overviewList) {
                                            if (mediaView.CollectionType == "movies" || mediaView.CollectionType == "tvshows") {
                                                mediaOverviewRow.add(mediaView)
                                            }
                                        }
                                        if (mediaOverviewRow.size() > 0) {
                                            val mediaOverviewHeader = HeaderItem(0, "Media")
                                            rowsAdapter.add(ListRow(mediaOverviewHeader, mediaOverviewRow))
                                        }

                                        if (resumeList.size > 0) {
                                            val mediaResumePresenter = CardPresenter(
                                                    requireActivity(),
                                                    SnowbySettings.getResumeCardWidth(),
                                                    SnowbySettings.getResumeCardHeight()
                                            )
                                            val resumeRow = ArrayObjectAdapter(mediaResumePresenter)
                                            for (mediaResume in resumeList) {
                                                resumeRow.add(mediaResume)
                                            }
                                            val resumeHeader = HeaderItem(1, "Resume")
                                            rowsAdapter.add(ListRow(resumeHeader, resumeRow))
                                        }

                                        //Misc. section
                                        otherAdapter = ArrayObjectAdapter(GenericCardPresenter(ctx))
                                        val miscHeader = HeaderItem(HEADER_MISC, getString(R.string.other))

                                        otherAdapter.add(GenericCardItem(ID_SNOWBY_SETTINGS, "Snowby", "", R.drawable.ic_menu_preferences_big, R.color.tv_card_content_dark))
                                        otherAdapter.add(GenericCardItem(ID_SETTINGS, getString(R.string.preferences), "", R.drawable.ic_menu_preferences_big, R.color.tv_card_content_dark))
                                        otherAdapter.add(GenericCardItem(ID_ABOUT_TV, getString(R.string.about), "${getString(R.string.app_name_full)} ${BuildConfig.VERSION_NAME}", R.drawable.ic_menu_info_big, R.color.tv_card_content_dark))
                                        otherAdapter.add(GenericCardItem(ID_LICENCE, getString(R.string.licence), "", R.drawable.ic_menu_open_source, R.color.tv_card_content_dark))
                                        miscRow = ListRow(miscHeader, otherAdapter)
                                        rowsAdapter.add(miscRow)

                                        adapter = rowsAdapter
                                        onItemViewClickedListener = fragment
                                        onItemViewSelectedListener = fragment
                                    }

                                    override fun onFailure(call: Call<ItemPage<MediaResume>>, t: Throwable) {
                                        Log.e(TAG, "An error occurred while getting in progress content", t)
                                    }
                                })
                            }

                            override fun onFailure(call: Call<ItemPage<MediaView>>, t: Throwable) {
                                Log.e(TAG, "An error occurred while getting media overview", t)
                            }
                        })
                    }

                    override fun onFailure(call: Call<AuthenticatedUser>, t: Throwable) {
                        Log.e(TAG, "An error occurred while logging in", t)
                    }
                })
            }

            override fun onFailure(call: Call<List<User>>, t: Throwable) {
                Log.e(TAG, "An error occurred while finding users", t)
            }
        })
    }

    private fun resetLines() {
        val adapters = listOf(nowPlayingRow, videoRow, audioRow, playlistRow, historyRow, browsersRow, miscRow).filter {
            when {
                !displayHistory && it == historyRow -> false
                !displayPlaylist && it == playlistRow -> false
                !displayNowPlaying && it == nowPlayingRow -> false
                else -> true
            }

        }
        var needToRefresh = false
        if (adapters.size != rowsAdapter.size()) needToRefresh = true else
            adapters.withIndex().forEach {
                if ((rowsAdapter.get(it.index) as ListRow).headerItem != it.value.headerItem) {
                    needToRefresh = true
                    return@forEach
                }
            }
        if (needToRefresh) rowsAdapter.setItems(adapters, TvUtil.listDiffCallback)
    }

    override fun onStart() {
        super.onStart()
        if (selectedItem is AbstractMediaWrapper) updateBackground(requireContext(), backgroundManager, selectedItem)
        model.refresh()
    }

    override fun onStop() {
        super.onStop()
        if (AndroidDevices.isAndroidTv && !AndroidUtil.isOOrLater) requireActivity().startService(Intent(requireActivity(), RecommendationsService::class.java))
    }

    override fun onDestroy() {
        cancel()
        super.onDestroy()
    }

    override fun onClick(v: View?) = requireActivity().startActivity(Intent(requireContext(), SearchActivity::class.java))

    fun showDetails(): Boolean {
        val media = selectedItem as? AbstractMediaWrapper ?: return false
        if (media.type != AbstractMediaWrapper.TYPE_DIR) return false
        val intent = Intent(requireActivity(), DetailsActivity::class.java)
        // pass the item information
        intent.putExtra("media", media)
        intent.putExtra("item", MediaItemDetails(media.title, media.artist, media.album, media.location, media.artworkURL))
        startActivity(intent)
        return true
    }

    override fun onItemClicked(itemViewHolder: Presenter.ViewHolder?, item: Any?, rowViewHolder: RowPresenter.ViewHolder?, row: Row?) {
        val activity = requireActivity()
        when (row?.id) {
            HEADER_MISC -> {
                when ((item as GenericCardItem).id) {
                    ID_SNOWBY_SETTINGS -> activity.startActivity(Intent(activity, SnowbySettingsActivity::class.java))
                    ID_SETTINGS -> activity.startActivityForResult(Intent(activity, org.videolan.vlc.gui.tv.preferences.PreferencesActivity::class.java), ACTIVITY_RESULT_PREFERENCES)
                    ID_REFRESH -> {
                        if (!AbstractMedialibrary.getInstance().isWorking) {
                            requireActivity().reloadLibrary()
                        }
                    }
                    ID_ABOUT_TV -> activity.startActivity(Intent(activity, org.videolan.vlc.gui.tv.AboutActivity::class.java))
                    ID_LICENCE -> startActivity(Intent(activity, org.videolan.vlc.gui.tv.LicenceActivity::class.java))
                }
            }
            else -> {
                model.open(activity, item)
            }
        }
    }

    override fun onItemSelected(itemViewHolder: Presenter.ViewHolder?, item: Any?, rowViewHolder: RowPresenter.ViewHolder?, row: Row?) {
        selectedItem = item
        updateBackground(requireContext(), backgroundManager, item)
    }
}
