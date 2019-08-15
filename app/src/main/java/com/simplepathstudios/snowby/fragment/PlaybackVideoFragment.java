/*
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package com.simplepathstudios.snowby.fragment;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.leanback.app.VideoSupportFragment;
import androidx.leanback.app.VideoSupportFragmentGlueHost;
import androidx.leanback.media.MediaPlayerAdapter;
import androidx.leanback.media.PlaybackTransportControlGlue;
import androidx.leanback.widget.PlaybackControlsRow;

import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.Item;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Handles video playback with media controls.
 */
public class PlaybackVideoFragment extends VideoSupportFragment {

    private final String TAG = "PlaybackVideoFragment";

    private PlaybackTransportControlGlue<MediaPlayerAdapter> mediaTransportControlGlue;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final String itemId =
                (String) getActivity().getIntent().getSerializableExtra(PlaybackVideoActivity.PLAYBACK_TARGET);

        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.getItem(emby.authHeader,emby.userId, itemId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Log.i(TAG,"Loaded information for media");
                final Item item = response.body();

                VideoSupportFragmentGlueHost glueHost =
                        new VideoSupportFragmentGlueHost(PlaybackVideoFragment.this);

                MediaPlayerAdapter playerAdapter = new MediaPlayerAdapter(getContext());
                playerAdapter.setRepeatAction(PlaybackControlsRow.RepeatAction.INDEX_NONE);

                mediaTransportControlGlue = new PlaybackTransportControlGlue<>(getContext(), playerAdapter);
                mediaTransportControlGlue.setHost(glueHost);
                mediaTransportControlGlue.setTitle(item.getTitle());
                mediaTransportControlGlue.setSubtitle(item.getDescription());
                mediaTransportControlGlue.playWhenPrepared();
                playerAdapter.setDataSource(Uri.parse(item.getMediaPath()));
            }

            @Override
            public void onFailure(Call<Item> call, Throwable t) {
                Log.e(TAG,"An error occurred while media",t);
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mediaTransportControlGlue != null) {
            mediaTransportControlGlue.pause();
        }
    }
}