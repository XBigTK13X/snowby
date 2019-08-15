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
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import androidx.leanback.app.VideoSupportFragment;
import androidx.leanback.app.VideoSupportFragmentGlueHost;
import androidx.leanback.media.MediaPlayerAdapter;
import androidx.leanback.media.PlaybackTransportControlGlue;
import androidx.leanback.widget.PlaybackControlsRow;

import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.util.Util;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.Item;

import java.net.MalformedURLException;
import java.util.concurrent.ExecutionException;

import jcifs.smb.SmbFile;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Handles video playback with media controls.
 */
public class PlaybackVideoFragment extends VideoSupportFragment {

    private final String TAG = "PlaybackVideoFragment";

    private PlaybackTransportControlGlue<MediaPlayerAdapter> mediaTransportControlGlue;

    private SimpleExoPlayer player;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final String itemId =
                (String) getActivity().getIntent().getSerializableExtra(PlaybackVideoActivity.PLAYBACK_TARGET);

        player = ExoPlayerFactory.newSimpleInstance(getContext());

        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.getItem(emby.authHeader,emby.userId, itemId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Log.i(TAG,"Loaded information for media");
                final Item item = response.body();
                try {
                    MediaSource videoSource = new LoadVideo().execute(item.Path).get();
                    player.prepare(videoSource);
                } catch (ExecutionException e) {
                    Log.e(TAG,"The media prep thread encountered an execution error",e);
                } catch (InterruptedException e) {
                    Log.e(TAG,"The media prep thread was interrupted",e);
                }

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

    private class LoadVideo extends AsyncTask<String, Void, MediaSource> {
        @Override
        protected MediaSource doInBackground(String... smbPaths) {
            try {
                SmbFile networkFile = new SmbFile(smbPaths[0]);
                Uri videoUri = Uri.parse(smbPaths[0]);
                DataSource.Factory dataSourceFactory = new DefaultDataSourceFactory(getContext(), Util.getUserAgent(getContext(),"snowby"));
                MediaSource videoSource = new ProgressiveMediaSource.Factory(dataSourceFactory).createMediaSource(videoUri);
                return videoSource;
/*                    VideoSupportFragmentGlueHost glueHost =
                            new VideoSupportFragmentGlueHost(PlaybackVideoFragment.this);

                    MediaPlayerAdapter playerAdapter = new MediaPlayerAdapter(getContext());
                    playerAdapter.setRepeatAction(PlaybackControlsRow.RepeatAction.INDEX_NONE);

                    mediaTransportControlGlue = new PlaybackTransportControlGlue<>(getContext(), playerAdapter);
                    mediaTransportControlGlue.setHost(glueHost);
                    mediaTransportControlGlue.setTictle(item.getTitle());
                    mediaTransportControlGlue.setSubtitle(item.getDescription());
                    mediaTransportControlGlue.playWhenPrepared();
                    //networkFile.
                    playerAdapter.setDataSource();*/
            } catch (MalformedURLException e) {
                Log.e(TAG,"Malformed URL provided for media: "+smbPaths[0],e);
            }
            return null;
        }
    }
}